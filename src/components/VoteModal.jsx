import React, { useState } from 'react';
import { Heart, X, Sparkles, Trophy, Award, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VoteModal({
  contestant,
  onClose,
  onVote,
  hasVoted
}) {
  const [isVotedAnim, setIsVotedAnim] = useState(false);

  if (!contestant) return null;

  function handleVoteClick() {
    if (hasVoted) return;

    // Trigger celebratory confetti
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#f43f5e']
    });

    setIsVotedAnim(true);
    onVote(contestant.id);

    setTimeout(() => {
      setIsVotedAnim(false);
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-amber-400/40 rounded-3xl shadow-2xl p-6 text-white overflow-hidden">
        {/* Glow background accent */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: contestant.krathongColor || '#f59e0b' }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center mt-2">
          {/* Contestant Photo with glowing frame */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-amber-400 via-rose-500 to-amber-200 shadow-xl mb-4 group">
            <img
              src={contestant.photo}
              alt={contestant.name}
              className="w-full h-full object-cover rounded-[22px] bg-slate-800"
            />
            <div
              className="absolute -bottom-2 right-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-md border border-white/20"
              style={{ backgroundColor: contestant.krathongColor || '#eab308' }}
            >
              กระทง 3D
            </div>
          </div>

          {/* Name & Title */}
          <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
            {contestant.name}
          </h3>
          <span className="text-xs sm:text-sm font-medium text-amber-300/90 mt-0.5">
            {contestant.title || 'กระทงมงคลลอยวารี'}
          </span>

          {/* Wish / Prayer Card */}
          <div className="w-full my-5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-200 text-sm leading-relaxed text-left relative">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-400/80 block mb-1">
              คำอธิษฐาน:
            </span>
            <p className="italic font-light">"{contestant.wish}"</p>
          </div>

          {/* Vote Counts */}
          <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-2xl bg-slate-800/80 border border-amber-500/30">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-slate-300 text-sm">คะแนนโหวตปัจจุบัน:</span>
            <span className="text-xl font-bold font-heading text-amber-300">
              {contestant.votes.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">โหวต</span>
          </div>

          {/* Vote Button */}
          <button
            onClick={handleVoteClick}
            disabled={hasVoted}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
              hasVoted
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white shadow-pink-500/25 animate-pulse'
            }`}
          >
            {hasVoted ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                คุณได้ลงคะแนนโหวตแล้ว
              </>
            ) : (
              <>
                <Heart
                  className={`w-5 h-5 text-white ${
                    isVotedAnim ? 'scale-150 fill-white' : 'fill-white/20'
                  } transition-transform`}
                />
                กดโหวตให้กระทงนี้เลย!
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
