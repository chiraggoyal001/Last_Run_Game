import React, { useRef, useState, useCallback, useEffect } from 'react';
import { PlayerController } from '../player/PlayerController';

export const TouchControls: React.FC = () => {
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const pedalRef = useRef<HTMLButtonElement | null>(null);

  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [isWheelActive, setIsWheelActive] = useState<boolean>(false);
  const [isBrakeActive, setIsBrakeActive] = useState<boolean>(false);

  const controller = PlayerController.getInstance();
  const wheelPointerId = useRef<number | null>(null);
  const wheelStartPos = useRef<{ x: number; y: number } | null>(null);

  // -------------------------------------------------------------
  // STEERING WHEEL TOUCH & POINTER HANDLING
  // -------------------------------------------------------------
  const updateSteeringFromPointer = useCallback((clientX: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    const dx = clientX - centerX;

    // Radius from center
    const radius = rect.width / 2;

    // Horizontal offset ratio: -1.0 (full left) to +1.0 (full right)
    let ratio = dx / (radius * 0.85);
    ratio = Math.max(-1, Math.min(1, ratio));

    // Calculate visual rotation angle (-60deg to +60deg)
    const angle = ratio * 60;
    setWheelRotation(angle);

    // Update PlayerController analog steer
    controller.setTouchSteer(ratio);
  }, [controller]);

  const handleWheelPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    wheelPointerId.current = e.pointerId;
    wheelStartPos.current = { x: e.clientX, y: e.clientY };
    setIsWheelActive(true);

    try {
      navigator.vibrate?.(10);
    } catch {
      // Haptics optional
    }

    updateSteeringFromPointer(e.clientX);
  };

  const handleWheelPointerMove = (e: React.PointerEvent) => {
    if (!isWheelActive || wheelPointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    updateSteeringFromPointer(e.clientX);
  };

  const handleWheelPointerUp = (e: React.PointerEvent) => {
    if (wheelPointerId.current === e.pointerId) {
      e.preventDefault();
      e.stopPropagation();
      wheelPointerId.current = null;
      wheelStartPos.current = null;
      setIsWheelActive(false);
      setWheelRotation(0);
      controller.setTouchSteer(0);
    }
  };

  // -------------------------------------------------------------
  // BRAKE PEDAL TOUCH & POINTER HANDLING (Symbol Only)
  // -------------------------------------------------------------
  const handlePedalPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }
    setIsBrakeActive(true);
    controller.setTouchBrake(true);

    try {
      navigator.vibrate?.(15);
    } catch {
      // Optional
    }
  };

  const handlePedalPointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBrakeActive(false);
    controller.setTouchBrake(false);
  };

  // Global safety cleanup on unmount
  useEffect(() => {
    return () => {
      controller.setTouchSteer(0);
      controller.setTouchBrake(false);
    };
  }, [controller]);

  return (
    <div className="absolute inset-x-0 bottom-10 sm:bottom-12 pb-safe pointer-events-none select-none z-40 flex justify-between items-end px-4 sm:px-8">
      {/* -------------------------------------------------------------
          LEFT: INTERACTIVE STEERING WHEEL
      ------------------------------------------------------------- */}
      <div className="flex flex-col items-center pointer-events-auto">
        <div
          ref={wheelRef}
          onPointerDown={handleWheelPointerDown}
          onPointerMove={handleWheelPointerMove}
          onPointerUp={handleWheelPointerUp}
          onPointerCancel={handleWheelPointerUp}
          aria-label="Steering Wheel"
          className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Subtle Outer Glow Backplate */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-150 ${
              isWheelActive
                ? 'bg-red-500/15 shadow-[0_0_25px_rgba(239,68,68,0.4)] scale-105'
                : 'bg-black/50 shadow-2xl backdrop-blur-md border border-white/10'
            }`}
          />

          {/* Rotating Steering Wheel Graphic */}
          <div
            className="w-28 h-28 sm:w-32 sm:h-32 transition-transform duration-75 ease-out"
            style={{
              transform: `rotate(${wheelRotation}deg)`,
              willChange: 'transform'
            }}
          >
            <svg
              viewBox="0 0 120 120"
              className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
            >
              {/* Outer Leather / Rubber Rim */}
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#18181b"
                strokeWidth="13"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#3f3f46"
                strokeWidth="11"
              />

              {/* Perforated Grip Ridges at 9 and 3 o'clock */}
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#27272a"
                strokeWidth="11"
                strokeDasharray="4 8"
              />

              {/* Red Racing Center Marker at 12 o'clock */}
              <path
                d="M 57 8 A 52 52 0 0 1 63 8"
                fill="none"
                stroke="#ef4444"
                strokeWidth="12"
                strokeLinecap="butt"
              />

              {/* Inner Rim Bezel */}
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="#71717a"
                strokeWidth="1.5"
                opacity="0.6"
              />

              {/* Brushed Aluminum Spokes (Left, Right, Bottom) */}
              {/* Left Spoke */}
              <path
                d="M 20 60 L 45 56 L 45 64 Z"
                fill="#52525b"
                stroke="#a1a1aa"
                strokeWidth="1"
              />
              {/* Right Spoke */}
              <path
                d="M 100 60 L 75 56 L 75 64 Z"
                fill="#52525b"
                stroke="#a1a1aa"
                strokeWidth="1"
              />
              {/* Bottom Spoke */}
              <path
                d="M 60 100 L 56 75 L 64 75 Z"
                fill="#52525b"
                stroke="#a1a1aa"
                strokeWidth="1"
              />

              {/* Spoke Weight-Reduction Cutouts */}
              <ellipse cx="32" cy="60" rx="4" ry="2.5" fill="#09090b" />
              <ellipse cx="88" cy="60" rx="4" ry="2.5" fill="#09090b" />
              <ellipse cx="60" cy="88" rx="2.5" ry="4" fill="#09090b" />

              {/* Center Hub Housing */}
              <circle
                cx="60"
                cy="60"
                r="18"
                fill="#18181b"
                stroke="#71717a"
                strokeWidth="2"
              />

              {/* Chrome Center Cap / Horn Button */}
              <circle
                cx="60"
                cy="60"
                r="13"
                fill="#27272a"
              />

              {/* Racing Center Decal / Crosshair */}
              <circle
                cx="60"
                cy="60"
                r="6"
                fill="#ef4444"
                opacity="0.9"
              />
              <circle
                cx="60"
                cy="60"
                r="2.5"
                fill="#ffffff"
              />

              {/* Left / Right Active Turn Glow Indicators on Spokes */}
              {wheelRotation < -10 && (
                <polygon
                  points="25,60 35,53 35,67"
                  fill="#38bdf8"
                  className="animate-pulse"
                />
              )}
              {wheelRotation > 10 && (
                <polygon
                  points="95,60 85,53 85,67"
                  fill="#38bdf8"
                  className="animate-pulse"
                />
              )}
            </svg>
          </div>

          {/* Quick Helper Subtitle */}
          <div className="absolute -bottom-5 text-[10px] font-bold tracking-widest text-neutral-400 uppercase pointer-events-none drop-shadow">
            STEER
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          RIGHT: BRAKE PEDAL WITH UNIVERSAL SYMBOL (( ! ))
      ------------------------------------------------------------- */}
      <div className="flex flex-col items-center pointer-events-auto">
        <button
          ref={pedalRef}
          onPointerDown={handlePedalPointerDown}
          onPointerUp={handlePedalPointerUp}
          onPointerCancel={handlePedalPointerUp}
          aria-label="Brake and Reverse Pedal"
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-75 shadow-2xl backdrop-blur-md cursor-pointer touch-none select-none ${
            isBrakeActive
              ? 'bg-gradient-to-b from-red-600/90 to-red-800/95 border-red-400 shadow-[0_0_35px_rgba(239,68,68,0.7)] scale-95'
              : 'bg-black/75 border-neutral-700/80 hover:border-red-500/50 shadow-black'
          }`}
        >
          {/* Sports Car Pedal Non-Slip Metal/Rubber Ridges */}
          <div className="absolute inset-2.5 rounded-2xl border border-white/10 flex flex-col justify-around py-1.5 px-3 pointer-events-none">
            <div className="w-full h-1 bg-white/10 rounded-full" />
            <div className="w-full h-1 bg-white/10 rounded-full" />
            <div className="w-full h-1 bg-white/10 rounded-full" />
          </div>

          {/* Universal ISO Automotive Brake System Symbol (( ! )) */}
          <div className="relative z-10 flex items-center justify-center">
            <svg
              viewBox="0 0 64 64"
              className={`w-14 h-14 transition-colors duration-75 ${
                isBrakeActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-red-500'
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Outer Left Curved Brake Shoe ( */}
              <path d="M 14 20 A 24 24 0 0 0 14 44" strokeWidth="4" />
              {/* Outer Right Curved Brake Shoe ) */}
              <path d="M 50 20 A 24 24 0 0 1 50 44" strokeWidth="4" />

              {/* Center Circle (Brake Rotor) */}
              <circle cx="32" cy="32" r="15" strokeWidth="3" />

              {/* Exclamation Point (!) in Center */}
              <line x1="32" y1="24" x2="32" y2="34" strokeWidth="3.5" />
              <circle cx="32" cy="40" r="1.8" fill="currentColor" />
            </svg>
          </div>

          {/* Reverse [R] Mode Indicator Lamp */}
          <div
            className={`relative z-10 mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase transition-all duration-100 ${
              isBrakeActive
                ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse'
                : 'text-neutral-500'
            }`}
          >
            HOLD ➔ [ R ]
          </div>
        </button>
      </div>
    </div>
  );
};
