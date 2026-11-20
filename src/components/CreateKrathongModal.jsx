import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Sparkles, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { KRATHONG_TEMPLATES } from '../data/initialContestants';
import { compressImageToUnder500KB } from '../utils/imageCompressor';

export default function CreateKrathongModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [wish, setWish] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(KRATHONG_TEMPLATES[0]);
  const [photoData, setPhotoData] = useState(null);
  const [photoSizeKb, setPhotoSizeKb] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  async function startCamera() {
    try {
      setCameraError(null);
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง หรือเลือกอัปโหลดรูปภาพแทน');
      setIsCameraActive(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }

  async function capturePhoto() {
    if (!videoRef.current) return;
    setIsCompressing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      ctx.translate(600, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, 600, 600);

      const rawUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();

      // Compress to strictly under 500 KB for Firestore
      const compressed = await compressImageToUnder500KB(rawUrl, 500 * 1024);
      setPhotoData(compressed.dataUrl);
      setPhotoSizeKb(compressed.sizeKb);
    } catch (err) {
      console.error('Capture compression error:', err);
      alert('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setIsCompressing(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      // Compress to strictly under 500 KB for Firestore
      const compressed = await compressImageToUnder500KB(file, 500 * 1024);
      setPhotoData(compressed.dataUrl);
      setPhotoSizeKb(compressed.sizeKb);
    } catch (err) {
      console.error('File compression error:', err);
      alert('ไม่สามารถย่อขนาดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCompressing(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return alert('กรุณาระบุชื่อของคุณ');
    if (!wish.trim()) return alert('กรุณาระบุคำอธิษฐาน');

    setIsSubmitting(true);
    try {
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=f59e0b&color=fff&size=256&bold=true`;

      const newContestant = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        title: selectedTemplate.name,
        wish: wish.trim(),
        krathongType: selectedTemplate.id,
        krathongColor: selectedTemplate.color,
        candleColor: selectedTemplate.candleColor,
        photo: photoData || defaultAvatar,
        photoSizeKb: photoSizeKb || 0,
        votes: 1,
        speed: 0.26 + Math.random() * 0.08,
        positionOffset: { x: 0, z: -2 }
      };

      await onSubmit(newContestant);

      // Reset form
      setName('');
      setWish('');
      setPhotoData(null);
      setPhotoSizeKb(null);
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900/90 border border-amber-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mb-3 border border-amber-500/30">
            <Sparkles className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-amber-300">
            ร่วมส่งกระทง & ประกวดออนไลน์
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            ถ่ายรูปเซลฟี่ ย่อขนาดรูปอัตโนมัติ (ไม่เกิน 500 KB) แล้วบันทึกลงสู่ Firestore
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Section */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              ภาพถ่ายผู้ประกวด (เซลฟี่ หรือ อัปโหลดรูป)
            </label>

            <div className="flex flex-col items-center gap-4">
              {/* Photo Preview / Live Camera View */}
              <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-amber-400/50 bg-slate-800/80 flex items-center justify-center shadow-inner group">
                {isCompressing ? (
                  <div className="flex flex-col items-center text-center p-2 text-amber-300">
                    <Loader2 className="w-8 h-8 animate-spin mb-1 text-amber-400" />
                    <span className="text-xs">กำลังย่อรูป &lt; 500KB...</span>
                  </div>
                ) : isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : photoData ? (
                  <img
                    src={photoData}
                    alt="Selfie Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-3 text-slate-400">
                    <Camera className="w-8 h-8 mx-auto mb-1 text-slate-500" />
                    <span className="text-xs">ยังไม่มีรูปภาพ</span>
                  </div>
                )}

                {photoData && !isCameraActive && !isCompressing && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoData(null);
                      setPhotoSizeKb(null);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600/80 text-white hover:bg-red-500 text-xs"
                    title="ลบรูป"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Compressed Size Info Badge */}
              {photoSizeKb && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ขนาดรูป: <strong>{photoSizeKb} KB</strong> (ย่อขนาดไม่เกิน 500 KB เรียบร้อย)</span>
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && (
                <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/60 p-2.5 rounded-xl border border-amber-500/30">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Camera Controls */}
              <div className="flex flex-wrap gap-2 justify-center">
                {isCameraActive ? (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      disabled={isCompressing}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      กดถ่ายภาพ
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-all"
                    >
                      ยกเลิก
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={isCompressing}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs sm:text-sm font-medium transition-all border border-indigo-400/30 hover:shadow-lg disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      เปิดกล้องเซลฟี่
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressing}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-all border border-slate-700 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      เลือกจากเครื่อง
                    </button>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Form Fields: Name & Wish */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">
                ชื่อ-นามสกุล หรือชื่อเล่น <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ชัยวัฒน์ รุ่งโรจน์ (เจมส์)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">
                คำอธิษฐานขอพรพระแม่คงคา <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                placeholder="ขอขมาพระแม่คงคา และขอให้ปีนี้มีแต่ความสุขความเจริญ สุขภาพแข็งแรง..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-sm outline-none resize-none transition-all"
              />
            </div>
          </div>

          {/* Krathong Style Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              เลือกรูปแบบกระทง 3D
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {KRATHONG_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate.id === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 shadow-md ring-1 ring-amber-400'
                        : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl mb-1">{tmpl.icon}</span>
                    <span className="text-xs font-semibold text-white">{tmpl.name}</span>
                    <div
                      className="w-4 h-1.5 rounded-full mt-2"
                      style={{ backgroundColor: tmpl.color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isCompressing}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                กำลังบันทึกลง Firestore & ลอยกระทง...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-slate-950" />
                บันทึกลง Firestore & ปล่อยกระทง 3D
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
