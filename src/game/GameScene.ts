import { GAME_CONFIG } from './GameConfig';
import { GameState } from './GameState';
import { Player } from '../player/Player';
import { Police } from '../police/Police';
import { PoliceSpawner } from '../police/PoliceSpawner';
import { ChunkManager } from '../world/ChunkManager';
import { CaptureSystem } from '../systems/CaptureSystem';
import { PowerupSystem } from '../systems/PowerupSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { DifficultySystem } from '../systems/DifficultySystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SoundManager } from '../systems/SoundManager';
import { LocalStorageManager } from '../storage/LocalStorage';

export class GameScene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;

  // Entities & Subsystems
  public player: Player;
  public policeList: Police[] = [];
  public spawner: PoliceSpawner;
  public chunkManager: ChunkManager;
  public captureSystem: CaptureSystem;
  public powerupSystem: PowerupSystem;
  public scoreSystem: ScoreSystem;
  public soundManager: SoundManager;
  public gameState: GameState;

  // Camera State
  private cameraX: number = 0;
  private cameraY: number = 0;
  private shakeTimer: number = 0;
  private shakeMagnitude: number = 0;

  // Run Counters
  private survivalTimeSec: number = 0;
  private policeDestroyedCount: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;

    this.player = new Player(0, 0);
    this.spawner = new PoliceSpawner();
    this.chunkManager = new ChunkManager();
    this.captureSystem = new CaptureSystem();
    this.powerupSystem = new PowerupSystem();
    this.scoreSystem = new ScoreSystem();
    this.soundManager = SoundManager.getInstance();
    this.gameState = GameState.getInstance();

    this.resizeCanvas();
    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.resizeCanvas();
  };

  private resizeCanvas(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.scale(dpr, dpr);
  }

  public start(): void {
    this.resetGame();
    this.gameState.status = 'PLAYING';
    this.gameState.notify();
    this.soundManager.unlockAudio();
    this.soundManager.resumeLoops();

    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  public pause(): void {
    if (this.gameState.status === 'PLAYING') {
      this.gameState.status = 'PAUSED';
      this.soundManager.stopAll();
      this.gameState.notify();
    } else if (this.gameState.status === 'PAUSED') {
      this.gameState.status = 'PLAYING';
      this.soundManager.resumeLoops();
      this.lastTime = performance.now();
      this.gameState.notify();
    }
  }

  public resetGame(): void {
    this.survivalTimeSec = 0;
    this.policeDestroyedCount = 0;
    this.policeList = [];
    this.player.reset(0, 0);
    this.cameraX = 0;
    this.cameraY = 0;
    this.shakeTimer = 0;
    this.shakeMagnitude = 0;

    this.spawner.reset();
    this.chunkManager.reset();
    this.captureSystem.reset();
    this.powerupSystem.reset();
    this.scoreSystem.reset();
    this.gameState.resetRun();

    // Pre-populate initial chunks around starting position
    this.chunkManager.update(0, 0);
  }

  private loop = (currentTime: number): void => {
    this.animFrameId = requestAnimationFrame(this.loop);

    if (this.gameState.status !== 'PLAYING') {
      this.render();
      return;
    }

    const elapsed = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;
    this.accumulator += elapsed;

    const fixedDt = GAME_CONFIG.FIXED_DELTA;
    while (this.accumulator >= fixedDt) {
      this.fixedUpdate(fixedDt);
      this.accumulator -= fixedDt;
    }

    this.render();
  };

  private fixedUpdate(dt: number): void {
    this.survivalTimeSec += dt;
    const difficulty = DifficultySystem.calculateDifficulty(this.survivalTimeSec);

    // 1. Update Player
    this.player.update(dt);

    // 2. Update Chunks & Obstacles
    this.chunkManager.setDifficulty(difficulty);
    this.chunkManager.update(this.player.x, this.player.y);
    const activeObstacles = this.chunkManager.getActiveObstacles();

    // 3. Update Spawn Director
    this.spawner.update(dt, this.survivalTimeSec, difficulty);
    const newPolice = this.spawner.spawnNext(this.player, this.policeList);
    if (newPolice) {
      this.policeList.push(newPolice);
    }

    // 4. Update Police Vehicles
    for (let i = this.policeList.length - 1; i >= 0; i--) {
      const p = this.policeList[i];
      p.update(dt, this.player);

      // Despawn police that got left far behind (> 1100 px away)
      const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
      if (dist > 1200 && !p.isDestroyed) {
        this.policeList.splice(i, 1);
        continue;
      }

      if (p.isReadyForRemoval) {
        this.policeList.splice(i, 1);
      }
    }

    // 5. Collision System
    const collisionEvents = CollisionSystem.checkAndResolveCollisions(
      this.player,
      this.policeList,
      activeObstacles,
      (killedPolice) => {
        this.onPoliceDestroyed(killedPolice);
      }
    );

    if (collisionEvents.length > 0) {
      // Trigger camera screen shake & impact audio
      const maxIntensity = Math.max(...collisionEvents.map((e) => e.intensity));
      this.triggerScreenShake(0.25, maxIntensity * 12);
      this.soundManager.playCollisionSound(maxIntensity);
      this.scoreSystem.resetStreak();
    }

    // 6. Capture / Boxed In System
    const trapResult = this.captureSystem.update(dt, this.player, this.policeList);
    if (trapResult.isTrapped) {
      this.soundManager.playBoxedInWarning();
    }
    if (trapResult.isBusted) {
      this.triggerGameOver('POLICE_TRAP');
      return;
    }

    // 7. Check Player Health Death
    if (!this.player.health.isAlive()) {
      this.triggerGameOver('COLLISION');
      return;
    }

    // 8. Health Powerup Lifecycle
    this.powerupSystem.update(dt, this.player);
    if (this.powerupSystem.checkCollection(this.player)) {
      const healed = this.player.health.heal(GAME_CONFIG.HEALTH_PICKUP.RESTORE_AMOUNT);
      this.soundManager.playHealthPickupSound();
      this.gameState.triggerScorePopup(`+${healed} HP`);
    }

    // 9. Scoring & Near Misses
    this.scoreSystem.update(dt);
    if (this.scoreSystem.checkNearMiss(this.player, activeObstacles, this.policeList)) {
      this.soundManager.playNearMissSound();
      this.gameState.triggerScorePopup(`NEAR MISS! +${GAME_CONFIG.SCORING.NEAR_MISS_PTS}`);
    }

    // 10. Audio Dynamics
    const speedRatio = this.player.speed / GAME_CONFIG.PLAYER.MAX_FORWARD_SPEED;
    this.soundManager.updateEngineSound(speedRatio, this.player.isReversing);

    // Calculate nearest police distance for dynamic siren
    let nearestDist = 9999;
    for (const p of this.policeList) {
      if (p.isDestroyed) continue;
      const d = Math.hypot(p.x - this.player.x, p.y - this.player.y);
      if (d < nearestDist) nearestDist = d;
    }
    this.soundManager.updateSiren(nearestDist, this.policeList.length, trapResult.isTrapped);

    // 11. Screen Shake Timer
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeMagnitude = 0;
      }
    }

    // 12. Camera Follow with Forward Lookahead
    const targetCamX = this.player.x + Math.cos(this.player.angle) * 70;
    const targetCamY = this.player.y + Math.sin(this.player.angle) * 70;
    this.cameraX += (targetCamX - this.cameraX) * 0.1;
    this.cameraY += (targetCamY - this.cameraY) * 0.1;

    // 13. Sync GameState
    this.syncGameState();
  }

  private onPoliceDestroyed(_police: Police): void {
    this.policeDestroyedCount++;
    this.scoreSystem.addPoliceDestructionPoints();
    this.triggerScreenShake(0.3, 14);
    this.soundManager.playExplosionSound();
    this.gameState.triggerScorePopup(`POLICE WRECKED! +${GAME_CONFIG.SCORING.POLICE_DESTROYED_PTS}`);
  }

  public triggerScreenShake(durationSec: number, magnitude: number): void {
    this.shakeTimer = durationSec;
    this.shakeMagnitude = magnitude;
  }

  private triggerGameOver(reason: 'COLLISION' | 'POLICE_TRAP'): void {
    this.gameState.status = 'GAME_OVER';
    this.gameState.gameOverReason = reason;
    this.soundManager.stopAll();
    this.soundManager.playGameOverSound();

    // Persist scores
    const finalScore = this.scoreSystem.getScore();
    LocalStorageManager.saveRunResult(
      finalScore,
      Math.floor(this.survivalTimeSec),
      this.scoreSystem.getLongestStreak(),
      this.policeDestroyedCount
    );

    this.syncGameState();
  }

  private syncGameState(): void {
    this.gameState.health = this.player.health.getHealth();
    this.gameState.maxHealth = this.player.health.getMaxHealth();
    this.gameState.score = this.scoreSystem.getScore();
    this.gameState.survivalTimeSec = Math.floor(this.survivalTimeSec);
    this.gameState.speed = this.player.speed;
    this.gameState.maxSpeed = GAME_CONFIG.PLAYER.MAX_FORWARD_SPEED;
    this.gameState.isReversing = this.player.isReversing;
    this.gameState.isTrapped = this.captureSystem.isTrapped;
    this.gameState.trapProgress = this.captureSystem.trapProgress;
    this.gameState.activePoliceCount = this.policeList.length;
    this.gameState.policeDestroyedCount = this.policeDestroyedCount;
    this.gameState.nearMissStreak = this.scoreSystem.getNearMissStreak();
    this.gameState.notify();
  }

  private render(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.save();

    // Screen Shake Offset
    let offsetX = 0;
    let offsetY = 0;
    if (this.shakeTimer > 0) {
      offsetX = (Math.random() - 0.5) * this.shakeMagnitude;
      offsetY = (Math.random() - 0.5) * this.shakeMagnitude;
    }

    // Center camera on player
    this.ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
    this.ctx.translate(-this.cameraX, -this.cameraY);

    // 1. Render World & Obstacles
    this.chunkManager.render(this.ctx, this.cameraX, this.cameraY);

    // 2. Render Health Powerup
    this.powerupSystem.render(this.ctx);

    // 3. Render Police
    for (const p of this.policeList) {
      p.render(this.ctx);
    }

    // 4. Render Player
    this.player.render(this.ctx);

    this.ctx.restore();
  }

  public destroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.soundManager.stopAll();
  }
}
