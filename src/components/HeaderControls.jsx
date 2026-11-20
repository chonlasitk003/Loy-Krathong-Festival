import React from 'react';
import { Sparkles, Trophy, Plus, Volume2, VolumeX, Navigation, CloudCheck, Cloud } from 'lucide-react';

export default function HeaderControls({
  krathongCount,
  onOpenCreate,
  onOpenLeaderboard,
  isAudioPlaying,
  onToggleAudio,
  hasMyKrathong,
  onJumpToMyKrathong,
  isFirestoreConnected
}) {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-5 flex items-center justify-between pointer-events-none">
      {/* Brand & Festival Info */}
      <div className="pointer-events-auto flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-300 p-0.5 shadow-xl shadow-amber-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl sm:text-2xl">
            🪷
          </div>
        </div>

        <div>
          <h1 className="text-base sm:text-xl font-bold font-heading text-white tracking-wide flex items-center gap-1.5 drop-shadow-md">
            ลอยกระทงออนไลน์ <span className="text-amber-400 font-normal text-xs sm:text-sm">3D</span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-amber-200/80">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>กระทงในน้ำ {krathongCount} ลำ</span>

            {/* Cloud Firestore Indicator */}
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-950/70 border border-sky-400/40 text-[10px] text-sky-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              <span>Firestore Sync</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
        {/* Jump to My Krathong Button */}
        {hasMyKrathong && (
          <button
            onClick={onJumpToMyKrathong}
            className="px-3 py-2 rounded-2xl bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-bold border border-amber-300 backdrop-blur-md text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95 animate-pulse"
            title="ดูกระทงของฉันในแม่น้ำ"
          >
            <Navigation className="w-4 h-4 fill-slate-950" />
            <span className="hidden sm:inline">ดูกระทงของฉัน</span>
          </button>
        )}

        {/* Ambient Sound Toggle */}
        <button
          onClick={onToggleAudio}
          className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700/80 backdrop-blur-md text-xs sm:text-sm font-medium flex items-center gap-1.5 shadow-lg transition-all"
          title={isAudioPlaying ? 'ปิดเสียงบรรยากาศ' : 'เปิดเสียงบรรยากาศขลุ่ยไทย'}
        >
          {isAudioPlaying ? (
            <>
              <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">ดนตรีไทย</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              <span className="hidden sm:inline">ปิดเสียง</span>
            </>
          )}
        </button>

        {/* Leaderboard Button */}
        <button
          onClick={onOpenLeaderboard}
          className="p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 backdrop-blur-md text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">อันดับโหวต</span>
        </button>

        {/* Create Krathong Button */}
        <button
          onClick={onOpenCreate}
          className="px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xl shadow-amber-500/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ส่งกระทง</span>
        </button>
      </div>
    </header>
  );
}
