import React from 'react';
import { Trophy, X, Heart, Medal, Sparkles } from 'lucide-react';

export default function LeaderboardModal({
  isOpen,
  onClose,
  contestants,
  onSelectContestant
}) {
  if (!isOpen) return null;

  // Sort by highest votes
  const sorted = [...contestants].sort((a, b) => b.votes - a.votes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[85vh] bg-slate-900/95 border border-amber-400/30 rounded-3xl shadow-2xl p-6 text-white flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-heading text-amber-300">
              อันดับคะแนนโหวตยอดนิยม
            </h3>
            <p className="text-xs text-slate-400">
              กระทงที่มีผู้ร่วมลงคะแนนโหวตสูงสุดในงานเทศกาล (ทั้งหมด {contestants.length} กระทง)
            </p>
          </div>
        </div>

        {/* List of Contestants */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {sorted.map((item, index) => {
            const isTop3 = index < 3;
            const rankBadges = [
              'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black',
              'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black',
              'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 font-black'
            ];

            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectContestant(item);
                  onClose();
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isTop3
                    ? 'bg-slate-800/80 border-amber-400/40 hover:bg-slate-800 hover:border-amber-400 shadow-md'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Rank & Avatar */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                      isTop3 ? rankBadges[index] : 'bg-slate-800 text-slate-400 font-semibold'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <img
                    src={item.photo}
                    alt={item.name}
                    className="w-11 h-11 rounded-xl object-cover border border-amber-400/40 bg-slate-700"
                  />

                  <div>
                    <h4 className="text-sm font-semibold text-slate-100 hover:text-amber-300 transition-colors">
                      {item.name}
                    </h4>
                    <span className="text-xs text-slate-400 block truncate max-w-[180px] sm:max-w-xs">
                      {item.title}
                    </span>
                  </div>
                </div>

                {/* Right: Votes */}
                <div className="flex items-center gap-2 pl-3">
                  <div className="text-right">
                    <span className="text-sm font-bold font-heading text-amber-300 block">
                      {item.votes.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">คะแนน</span>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: item.krathongColor || '#eab308' }}
                    title="สีกระทง"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
