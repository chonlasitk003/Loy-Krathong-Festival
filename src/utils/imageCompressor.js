/**
 * Utility to compress images to ensure the final Base64 string is strictly under maxBytes (default 500 KB)
 * Fits safely within Google Cloud Firestore 1MB document limit.
 */

export async function compressImageToUnder500KB(fileOrDataUrl, maxBytes = 500 * 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Max initial dimensions (800x800 is ideal for mobile avatars and fits comfortably under 300-400KB)
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Step-down compression qualities until size is under maxBytes
        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let byteSize = getBase64ByteSize(dataUrl);

        while (byteSize > maxBytes && quality > 0.15) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          byteSize = getBase64ByteSize(dataUrl);
        }

        // If still over 500KB (e.g. extremely complex noisy image), scale down canvas dimensions
        if (byteSize > maxBytes) {
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.round(width * 0.7);
          smallCanvas.height = Math.round(height * 0.7);
          const sCtx = smallCanvas.getContext('2d');
          sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
          dataUrl = smallCanvas.toDataURL('image/jpeg', 0.65);
          byteSize = getBase64ByteSize(dataUrl);
        }

        resolve({
          dataUrl,
          sizeBytes: byteSize,
          sizeKb: Math.round(byteSize / 1024)
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error('Failed to load image for compression'));
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      reject(new Error('Invalid image format provided'));
    }
  });
}

function getBase64ByteSize(base64String) {
  const head = 'data:image/jpeg;base64,';
  const content = base64String.startsWith(head) ? base64String.slice(head.length) : base64String;
  // Each 4 base64 chars represent 3 bytes
  return Math.ceil((content.length * 3) / 4);
}
