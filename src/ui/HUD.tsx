import React from 'react';
import { GameSnapshot } from '../game/GameState';
import { SoundManager } from '../systems/SoundManager';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

interface HUDProps {
  snapshot: GameSnapshot;
  onTogglePause: () => void;
}

export const HUD: React.FC<HUDProps> = ({ snapshot, onTogglePause }) => {
  const [isMuted, setIsMuted] = React.useState(SoundManager.getInstance().getMuted());

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = SoundManager.getInstance().toggleMute();
    setIsMuted(muted);
  };

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Health color
  const hpPct = Math.max(0, Math.min(100, (snapshot.health / snapshot.maxHealth) * 100));
  let hpColor = '#22c55e'; // Green
  if (hpPct < 30) hpColor = '#ef4444'; // Red
  else if (hpPct < 60) hpColor = '#f59e0b'; // Amber

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Bar Header */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Health Display */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2.5 sm:p-3 shadow-lg min-w-[140px] sm:min-w-[190px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-neutral-300 flex items-center gap-1">
              <span className="text-red-500 animate-pulse">❤️</span> HP
            </span>
            <span className="font-mono text-xs sm:text-sm font-extrabold text-white">
              {snapshot.health} / {snapshot.maxHealth}
            </span>
          </div>
          {/* Health Bar */}
          <div className="w-full bg-neutral-800/80 rounded-full h-2.5 sm:h-3 overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${hpPct}%`,
                backgroundColor: hpColor,
                boxShadow: `0 0 10px ${hpColor}`
              }}
            />
          </div>
        </div>

        {/* Top-Center: Survival Timer */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 sm:px-6 sm:py-2.5 shadow-lg flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-neutral-400 uppercase">
            Survived
          </span>
          <span className="font-mono text-xl sm:text-3xl font-black text-amber-400 tracking-wider">
            {formatTime(snapshot.survivalTimeSec)}
          </span>
        </div>

        {/* Top-Right: Score Display & Utility Buttons */}
        <div className="flex items-start gap-2">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2.5 sm:p-3 shadow-lg text-right min-w-[110px] sm:min-w-[150px]">
            <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-neutral-400 block uppercase">
              Score
            </span>
            <span className="font-mono text-lg sm:text-2xl font-black text-white tracking-tight">
              {snapshot.score.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <button
              onClick={onTogglePause}
              aria-label="Pause Game"
              className="w-9 h-9 sm:w-10 sm:h-10 bg-black/60 hover:bg-neutral-800 border border-white/10 rounded-xl flex items-center justify-center text-white transition-colors"
            >
              {snapshot.status === 'PAUSED' ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button
              onClick={handleToggleMute}
              aria-label="Toggle Sound"
              className="w-9 h-9 sm:w-10 sm:h-10 bg-black/60 hover:bg-neutral-800 border border-white/10 rounded-xl flex items-center justify-center text-white transition-colors"
            >
              {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Center Alert: "BOXED IN!" Capture Meter */}
      {snapshot.isTrapped && (
        <div className="self-center flex flex-col items-center animate-bounce mb-8">
          <div className="bg-red-600/90 text-white font-black text-sm sm:text-xl tracking-widest px-5 py-1.5 rounded-t-lg border border-red-400 shadow-2xl uppercase">
            🚨 BOXED IN! REVERSE OR ESCAPE! 🚨
          </div>
          <div className="w-56 sm:w-72 bg-neutral-900 border-2 border-red-500 rounded-b-lg h-5 p-0.5 overflow-hidden shadow-2xl">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 transition-all duration-75"
              style={{ width: `${Math.min(100, snapshot.trapProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Floating Score Popups */}
      {snapshot.recentScorePopup && (
        <div
          key={snapshot.recentScorePopup.id}
          className="self-center absolute top-28 bg-amber-500/90 text-black font-black text-sm sm:text-lg px-4 py-1 rounded-full shadow-lg border border-amber-200 animate-pulse"
        >
          {snapshot.recentScorePopup.text}
        </div>
      )}

      {/* Bottom Center: Mini Speedometer / Driving Status */}
      <div className="self-center bg-black/50 backdrop-blur-sm border border-white/5 rounded-full px-4 py-1 flex items-center gap-3 text-xs text-neutral-300">
        <span className="font-mono font-bold">
          {snapshot.isReversing ? (
            <span className="text-amber-400 font-extrabold animate-pulse">REVERSING [R]</span>
          ) : (
            <span>
              {Math.abs(Math.round(snapshot.speed * 0.7))} <span className="text-neutral-500">KM/H</span>
            </span>
          )}
        </span>
        <span className="text-neutral-600">•</span>
        <span>
          CHASERS: <strong className="text-red-400">{snapshot.activePoliceCount}</strong>
        </span>
        {snapshot.nearMissStreak > 1 && (
          <>
            <span className="text-neutral-600">•</span>
            <span className="text-amber-400 font-bold">STREAK: x{snapshot.nearMissStreak}</span>
          </>
        )}
      </div>
    </div>
  );
};
