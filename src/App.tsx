import React, { useEffect, useRef, useState } from 'react';
import { GameManager } from './game/GameManager';
import { GameState, GameSnapshot } from './game/GameState';
import { HUD } from './ui/HUD';
import { MainMenu } from './ui/MainMenu';
import { GameOver } from './ui/GameOver';
import { PauseOverlay } from './ui/PauseOverlay';
import { TouchControls } from './ui/TouchControls';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => GameState.getInstance().getSnapshot());
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    // Detect mobile touch capability or viewport
    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 840;
      setIsTouchDevice(hasTouch);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const gameManager = GameManager.getInstance();
    gameManager.attachCanvas(canvasRef.current);

    const unsubscribe = GameState.getInstance().subscribe((snap) => {
      setSnapshot(snap);
    });

    return () => {
      unsubscribe();
      gameManager.destroy();
    };
  }, []);

  const handleStartGame = () => {
    GameManager.getInstance().startGame();
  };

  const handleRestartGame = () => {
    GameManager.getInstance().restartGame();
  };

  const handleTogglePause = () => {
    GameManager.getInstance().togglePause();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans touch-none">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair"
      />

      {/* Main Menu State */}
      {snapshot.status === 'MENU' && (
        <MainMenu onStartGame={handleStartGame} />
      )}

      {/* Playing / In-Game Overlays */}
      {snapshot.status !== 'MENU' && (
        <>
          <HUD snapshot={snapshot} onTogglePause={handleTogglePause} />

          {/* Touch Controls (Mobile / Tablets) */}
          {isTouchDevice && snapshot.status === 'PLAYING' && (
            <TouchControls />
          )}

          {/* Paused Overlay */}
          {snapshot.status === 'PAUSED' && (
            <PauseOverlay
              onResume={handleTogglePause}
              onRestart={handleRestartGame}
            />
          )}

          {/* Game Over Modal */}
          {snapshot.status === 'GAME_OVER' && (
            <GameOver
              reason={snapshot.gameOverReason}
              score={snapshot.score}
              survivalTimeSec={snapshot.survivalTimeSec}
              policeDestroyed={snapshot.policeDestroyedCount}
              nearMissStreak={snapshot.nearMissStreak}
              onRestart={handleRestartGame}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
