import React from 'react';
import { LocalStorageManager, GameStatistics } from '../storage/LocalStorage';
import { Play, Shield, Trophy, Flame, Smartphone, Keyboard } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const [stats, setStats] = React.useState<GameStatistics>(() => LocalStorageManager.getStats());

  React.useEffect(() => {
    setStats(LocalStorageManager.getStats());
  }, []);

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="max-w-md w-full bg-neutral-950/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-red-600/20 blur-3xl rounded-full pointer-events-none" />

        {/* Game Title */}
        <div className="mb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-800/60 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Flame size={14} className="text-red-500 animate-pulse" />
            Arcade Pursuit Survival
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 tracking-tight font-serif italic">
            LAST RUN
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-neutral-400 text-sm sm:text-base font-medium tracking-wide mb-6">
          How long can you stay ahead?
        </p>

        {/* Play Action Button */}
        <button
          onClick={onStartGame}
          className="w-full group relative py-4 sm:py-5 px-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-xl sm:text-2xl rounded-2xl shadow-xl shadow-red-900/30 transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer mb-6"
        >
          <Play size={24} className="fill-white group-hover:scale-110 transition-transform" />
          START RUN
        </button>

        {/* Controls Quick Guide */}
        <div className="w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
            <span className="flex items-center gap-1.5">
              <Keyboard size={14} /> Desktop & <Smartphone size={14} /> Mobile Controls
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Steer</span>
              <strong className="text-white font-mono">A / D or ← / →</strong>
              <div className="text-[10px] text-neutral-400 mt-0.5">Sharp turns at low speed</div>
            </div>
            <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Brake / Reverse</span>
              <strong className="text-white font-mono">SPACE or Touch</strong>
              <div className="text-[10px] text-neutral-400 mt-0.5">Hold to back out of traps</div>
            </div>
          </div>
        </div>

        {/* Best Records Summary */}
        {stats.gamesPlayed > 0 && (
          <div className="w-full grid grid-cols-3 gap-2 text-center pt-2 border-t border-neutral-800/80">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block flex items-center justify-center gap-1">
                <Trophy size={11} className="text-amber-400" /> Best Score
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-white">
                {stats.bestScore.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block flex items-center justify-center gap-1">
                <Shield size={11} className="text-blue-400" /> Best Time
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-white">
                {formatTime(stats.bestSurvivalTimeSec)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                Runs
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-white">
                {stats.gamesPlayed}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
