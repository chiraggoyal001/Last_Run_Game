import React from 'react';
import { Play, RotateCcw } from 'lucide-react';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume, onRestart }) => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="max-w-xs w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        <h3 className="text-3xl font-black text-white tracking-widest uppercase mb-6">
          PAUSED
        </h3>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-500 text-white font-black text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play size={18} className="fill-white" /> RESUME
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3.5 px-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-base rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={18} /> RESTART
          </button>
        </div>
      </div>
    </div>
  );
};
