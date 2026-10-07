import React from 'react';
import { GameOverReason } from '../game/GameState';
import { LocalStorageManager, GameStatistics } from '../storage/LocalStorage';
import { RotateCcw, AlertTriangle, Siren, Trophy, Award } from 'lucide-react';

interface GameOverProps {
  reason: GameOverReason | null;
  score: number;
  survivalTimeSec: number;
  policeDestroyed: number;
  nearMissStreak: number;
  onRestart: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  reason,
  score,
  survivalTimeSec,
  policeDestroyed,
  nearMissStreak,
  onRestart
}) => {
  const [stats, setStats] = React.useState<GameStatistics>(() => LocalStorageManager.getStats());

  React.useEffect(() => {
    setStats(LocalStorageManager.getStats());
  }, []);

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTrap = reason === 'POLICE_TRAP';
  const isNewBestScore = score >= stats.bestScore && score > 0;
  const isNewBestTime = survivalTimeSec >= stats.bestSurvivalTimeSec && survivalTimeSec > 0;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-neutral-950 border border-red-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-600/25 blur-3xl rounded-full pointer-events-none" />

        {/* Reason Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-500 mb-3 shadow-lg">
          {isTrap ? <Siren size={36} className="animate-pulse" /> : <AlertTriangle size={36} />}
        </div>

        {/* Title */}
        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-wider uppercase mb-1">
          BUSTED
        </h2>
        <div className="text-xs sm:text-sm font-bold tracking-widest text-red-400 uppercase mb-6 px-3 py-1 bg-red-950/60 rounded-full border border-red-900/50">
          {isTrap ? 'POLICE TRAPPED — BOXED IN' : 'VEHICLE DESTROYED BY IMPACTS'}
        </div>

        {/* Score & Time Cards */}
        <div className="w-full grid grid-cols-2 gap-3 mb-4">
          {/* Final Score */}
          <div className="bg-neutral-900/90 border border-white/5 rounded-2xl p-4 relative">
            {isNewBestScore && (
              <span className="absolute -top-2.5 right-3 bg-amber-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Trophy size={10} /> New Record!
              </span>
            )}
            <span className="text-[10px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-widest block mb-1">
              Final Score
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-400">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Time Survived */}
          <div className="bg-neutral-900/90 border border-white/5 rounded-2xl p-4 relative">
            {isNewBestTime && (
              <span className="absolute -top-2.5 right-3 bg-blue-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Award size={10} /> Best Time!
              </span>
            )}
            <span className="text-[10px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-widest block mb-1">
              Survived
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-white">
              {formatTime(survivalTimeSec)}
            </span>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="w-full bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-3.5 mb-6 text-xs text-neutral-300 flex justify-around">
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-bold">Police Wrecked</span>
            <strong className="font-mono text-sm font-bold text-white">{policeDestroyed}</strong>
          </div>
          <div className="border-r border-neutral-800" />
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-bold">Best Streak</span>
            <strong className="font-mono text-sm font-bold text-amber-400">x{nearMissStreak}</strong>
          </div>
          <div className="border-r border-neutral-800" />
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-bold">All-Time Best</span>
            <strong className="font-mono text-sm font-bold text-white">{stats.bestScore.toLocaleString()}</strong>
          </div>
        </div>

        {/* Play Again Button */}
        <button
          onClick={onRestart}
          className="w-full group py-4 px-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-lg sm:text-xl rounded-2xl shadow-xl shadow-red-950/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-300" />
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};
