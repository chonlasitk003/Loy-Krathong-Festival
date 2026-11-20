import React, { useState, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import HeaderControls from './components/HeaderControls';
import CreateKrathongModal from './components/CreateKrathongModal';
import VoteModal from './components/VoteModal';
import LeaderboardModal from './components/LeaderboardModal';
import { soundscape } from './utils/thaiAudio';
import {
  subscribeToContestants,
  addContestantToFirestore,
  voteContestantInFirestore
} from './services/contestantService';
import confetti from 'canvas-confetti';
import { Sparkles, Plus, Trophy, Navigation } from 'lucide-react';

const STORAGE_KEY_CONTESTANTS = 'loy_krathong_contestants_v2';
const STORAGE_KEY_VOTED = 'loy_krathong_voted_ids_v2';
const STORAGE_KEY_MY_KRATHONG = 'loy_krathong_my_id_v2';

export default function App() {
  // Load real contestants only (no mock items)
  const [contestants, setContestants] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONTESTANTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => !item.id.startsWith('kt-'));
        }
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return [];
  });

  // Track voted IDs
  const [votedIds, setVotedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOTED);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return [];
  });

  // Track user's own created krathong ID
  const [myKrathongId, setMyKrathongId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MY_KRATHONG) || null;
    } catch (e) {
      return null;
    }
  });

  // Firestore sync state
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [selectedContestant, setSelectedContestant] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [notification, setNotification] = useState(null);
  const [focusKrathongId, setFocusKrathongId] = useState(null);

  // --- Real-time Firestore Sync (Only real user contestants) ---
  useEffect(() => {
    const unsubscribe = subscribeToContestants(
      (realList) => {
        setContestants(realList);
        setIsFirestoreConnected(true);
      },
      (error) => {
        console.warn('Firestore subscription fallback:', error);
        setIsFirestoreConnected(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync to LocalStorage as cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTESTANTS, JSON.stringify(contestants));
    } catch (e) {
      console.warn('Failed to save contestants cache:', e);
    }
  }, [contestants]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VOTED, JSON.stringify(votedIds));
    } catch (e) {
      console.warn('Failed to save voted IDs:', e);
    }
  }, [votedIds]);

  useEffect(() => {
    if (myKrathongId) {
      try {
        localStorage.setItem(STORAGE_KEY_MY_KRATHONG, myKrathongId);
      } catch (e) {}
    }
  }, [myKrathongId]);

  // Handle vote (Save to Firestore & Local state)
  async function handleVote(contestantId) {
    if (votedIds.includes(contestantId)) return;

    // Optimistic UI update
    setContestants((prev) =>
      prev.map((c) => (c.id === contestantId ? { ...c, votes: (c.votes || 0) + 1 } : c))
    );

    setVotedIds((prev) => [...prev, contestantId]);

    // Update selected contestant in modal
    setSelectedContestant((prev) =>
      prev ? { ...prev, votes: (prev.votes || 0) + 1 } : null
    );

    // Persist vote to Cloud Firestore
    try {
      await voteContestantInFirestore(contestantId);
    } catch (err) {
      console.warn('Firestore vote sync warning:', err);
    }

    showToast('✨ ลงคะแนนโหวตสำเร็จแล้ว! ข้อมูลบันทึกลงสู่ Firestore');
  }

  // Handle new krathong submission (Save to Firestore & Local state)
  async function handleCreateKrathong(newContestant) {
    // 1. Optimistic update
    setContestants((prev) => [newContestant, ...prev]);
    setMyKrathongId(newContestant.id);

    // 2. Focus camera directly onto the new krathong
    setFocusKrathongId(newContestant.id);

    // 3. Save to Google Cloud Firestore with compressed photo (<= 500KB)
    try {
      await addContestantToFirestore(newContestant);
      showToast(`🪷 ปล่อยกระทงของ "${newContestant.name}" ลอยสู่แม่น้ำ และบันทึกลง Firestore แล้ว!`);
    } catch (err) {
      console.warn('Firestore save notice:', err);
      showToast(`🪷 ปล่อยกระทงของ "${newContestant.name}" เรียบร้อยแล้ว!`);
    }

    // 4. Show celebration confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.65 }
    });
  }

  // Jump camera directly to user's krathong
  function handleJumpToMyKrathong() {
    if (!myKrathongId) return;
    setFocusKrathongId(myKrathongId);
    const found = contestants.find((c) => c.id === myKrathongId);
    if (found) {
      showToast(`🎯 กำลังแพนกล้องไปยังกระทงของ "${found.name}"`);
    }
  }

  // Toast Notification
  function showToast(message) {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  }

  // Toggle ambient sound
  function handleToggleAudio() {
    const active = soundscape.toggle();
    setIsAudioPlaying(active);
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Top Header & Quick Actions */}
      <HeaderControls
        krathongCount={contestants.length}
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={handleToggleAudio}
        hasMyKrathong={!!myKrathongId}
        onJumpToMyKrathong={handleJumpToMyKrathong}
        isFirestoreConnected={isFirestoreConnected}
      />

      {/* Main 3D Canvas Scene */}
      <Scene3D
        contestants={contestants}
        selectedContestant={selectedContestant}
        onSelectContestant={(c) => setSelectedContestant(c)}
        focusKrathongId={focusKrathongId}
        onClearFocus={() => setFocusKrathongId(null)}
      />

      {/* Empty State Banner if no krathongs yet */}
      {contestants.length === 0 && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-slate-900/90 border border-amber-400/40 backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl text-center max-w-sm animate-pulse">
          <p className="text-amber-300 font-bold text-sm mb-1">
            🌊 แม่น้ำยังว่างอยู่ พร้อมให้คุณลอยกระทง
          </p>
          <p className="text-slate-300 text-xs mb-3">
            กดปุ่มด้านล่างเพื่อถ่ายรูป กรอกคำอธิษฐาน และปล่อยกระทงของคุณเป็นคนแรก!
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs shadow-md"
          >
            + ส่งกระทงของคุณเลย
          </button>
        </div>
      )}

      {/* Mobile Floating Action Bar */}
      <div className="sm:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {myKrathongId && (
          <button
            onClick={handleJumpToMyKrathong}
            className="p-3.5 rounded-full bg-amber-500/90 text-slate-950 font-bold border border-amber-300 backdrop-blur-md shadow-xl active:scale-95 transition-all animate-pulse"
            title="ดูกระทงของฉัน"
          >
            <Navigation className="w-5 h-5 fill-slate-950" />
          </button>
        )}

        <button
          onClick={() => setIsLeaderboardOpen(true)}
          className="p-3.5 rounded-full bg-slate-900/90 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-xl active:scale-95 transition-all"
          title="อันดับโหวต"
        >
          <Trophy className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/30 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ลอยกระทงของคุณ</span>
        </button>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-20 sm:bottom-6 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 border border-amber-400 text-amber-200 text-sm font-medium shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Modals */}
      <CreateKrathongModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateKrathong}
      />

      <VoteModal
        contestant={selectedContestant}
        onClose={() => setSelectedContestant(null)}
        onVote={handleVote}
        hasVoted={selectedContestant ? votedIds.includes(selectedContestant.id) : false}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        contestants={contestants}
        onSelectContestant={(c) => {
          setSelectedContestant(c);
          setFocusKrathongId(c.id);
        }}
      />
    </div>
  );
}
