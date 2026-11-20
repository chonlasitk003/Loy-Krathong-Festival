import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'contestants';

/**
 * Clean up any auto-seeded mock krathongs ('kt-01'..'kt-20') from Firestore
 * so only real user-submitted contestants remain in the river and database!
 */
export async function cleanupMockContestantsFromFirestore() {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    const mockDocs = snap.docs.filter((d) => d.id.startsWith('kt-'));

    if (mockDocs.length > 0) {
      console.log(`Cleaning up ${mockDocs.length} mock krathongs from Firestore...`);
      for (const d of mockDocs) {
        await deleteDoc(doc(db, COLLECTION_NAME, d.id));
      }
      console.log('Mock krathongs removed from Firestore successfully!');
    }
  } catch (err) {
    console.warn('Cleanup mock notice:', err);
  }
}

/**
 * Subscribe to real-time contestants list from Firestore
 * Only returns actual registered contestants (filters out mock kt-* krathongs)
 */
export function subscribeToContestants(onData, onError) {
  // Automatically clean up any leftover mock krathongs from Firestore
  cleanupMockContestantsFromFirestore();

  const colRef = collection(db, COLLECTION_NAME);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      // Get all documents that are NOT mock entries (or all documents if none are mock)
      const list = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...d.data()
        }))
        .filter((item) => !item.id.startsWith('kt-')); // Do not include mock items!

      onData(list);
    },
    (error) => {
      console.warn('Firestore real-time subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Add new contestant with compressed photo (<= 500KB) to Firestore
 */
export async function addContestantToFirestore(contestant) {
  try {
    const docRef = doc(db, COLLECTION_NAME, contestant.id);
    await setDoc(docRef, {
      ...contestant,
      createdAt: serverTimestamp()
    });
    return { success: true, id: contestant.id };
  } catch (error) {
    console.error('Error saving contestant to Firestore:', error);
    throw error;
  }
}

/**
 * Atomically increment vote in Firestore
 */
export async function voteContestantInFirestore(contestantId) {
  try {
    const docRef = doc(db, COLLECTION_NAME, contestantId);
    await updateDoc(docRef, {
      votes: increment(1)
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating vote in Firestore:', error);
    throw error;
  }
}
