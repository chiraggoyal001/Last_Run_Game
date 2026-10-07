import React from 'react';
import { PlayerController } from '../player/PlayerController';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const TouchControls: React.FC = () => {
  const [leftActive, setLeftActive] = React.useState(false);
  const [rightActive, setRightActive] = React.useState(false);
  const [brakeActive, setBrakeActive] = React.useState(false);

  const controller = PlayerController.getInstance();

  // Prevent default gestures and browser scrolling
  const handleTouch = (
    e: React.TouchEvent | React.MouseEvent,
    action: 'LEFT' | 'RIGHT' | 'BRAKE',
    isDown: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (action === 'LEFT') {
      setLeftActive(isDown);
      controller.setTouchLeft(isDown);
    } else if (action === 'RIGHT') {
      setRightActive(isDown);
      controller.setTouchRight(isDown);
    } else if (action === 'BRAKE') {
      setBrakeActive(isDown);
      controller.setTouchBrake(isDown);
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none z-10 flex justify-between items-end p-4 sm:p-6 pb-6 sm:pb-8">
      {/* Left Pad: Steer Left & Right */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Steer Left */}
        <button
          onTouchStart={(e) => handleTouch(e, 'LEFT', true)}
          onTouchEnd={(e) => handleTouch(e, 'LEFT', false)}
          onTouchCancel={(e) => handleTouch(e, 'LEFT', false)}
          onMouseDown={(e) => handleTouch(e, 'LEFT', true)}
          onMouseUp={(e) => handleTouch(e, 'LEFT', false)}
          onMouseLeave={(e) => handleTouch(e, 'LEFT', false)}
          aria-label="Steer Left"
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-75 shadow-2xl backdrop-blur-md active:scale-95 ${
            leftActive
              ? 'bg-red-600/80 border-red-400 text-white shadow-red-500/50 scale-95'
              : 'bg-black/60 border-white/20 text-neutral-200 hover:bg-neutral-900/80'
          }`}
        >
          <ArrowLeft size={36} strokeWidth={2.5} />
        </button>

        {/* Steer Right */}
        <button
          onTouchStart={(e) => handleTouch(e, 'RIGHT', true)}
          onTouchEnd={(e) => handleTouch(e, 'RIGHT', false)}
          onTouchCancel={(e) => handleTouch(e, 'RIGHT', false)}
          onMouseDown={(e) => handleTouch(e, 'RIGHT', true)}
          onMouseUp={(e) => handleTouch(e, 'RIGHT', false)}
          onMouseLeave={(e) => handleTouch(e, 'RIGHT', false)}
          aria-label="Steer Right"
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-75 shadow-2xl backdrop-blur-md active:scale-95 ${
            rightActive
              ? 'bg-red-600/80 border-red-400 text-white shadow-red-500/50 scale-95'
              : 'bg-black/60 border-white/20 text-neutral-200 hover:bg-neutral-900/80'
          }`}
        >
          <ArrowRight size={36} strokeWidth={2.5} />
        </button>
      </div>

      {/* Right Pad: Brake / Hold Reverse Pedal */}
      <div className="pointer-events-auto">
        <button
          onTouchStart={(e) => handleTouch(e, 'BRAKE', true)}
          onTouchEnd={(e) => handleTouch(e, 'BRAKE', false)}
          onTouchCancel={(e) => handleTouch(e, 'BRAKE', false)}
          onMouseDown={(e) => handleTouch(e, 'BRAKE', true)}
          onMouseUp={(e) => handleTouch(e, 'BRAKE', false)}
          onMouseLeave={(e) => handleTouch(e, 'BRAKE', false)}
          aria-label="Brake and Reverse Pedal"
          className={`w-28 h-20 sm:w-32 sm:h-22 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-75 shadow-2xl backdrop-blur-md active:scale-95 ${
            brakeActive
              ? 'bg-amber-600/90 border-amber-300 text-black shadow-amber-500/60 scale-95'
              : 'bg-black/70 border-amber-500/40 text-amber-400 hover:bg-neutral-900/80'
          }`}
        >
          <span className="font-mono font-black text-sm sm:text-base tracking-widest uppercase">
            BRAKE
          </span>
          <span className="text-[10px] text-amber-200/90 uppercase tracking-tight">
            HOLD REVERSE
          </span>
        </button>
      </div>
    </div>
  );
};
