export type GameStatus = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
export type GameOverReason = 'COLLISION' | 'POLICE_TRAP';

export interface GameSnapshot {
  status: GameStatus;
  gameOverReason: GameOverReason | null;
  health: number;
  maxHealth: number;
  score: number;
  survivalTimeSec: number;
  speed: number;
  maxSpeed: number;
  isReversing: boolean;
  isTrapped: boolean;
  trapProgress: number; // 0.0 to 1.0
  activePoliceCount: number;
  policeDestroyedCount: number;
  nearMissStreak: number;
  recentScorePopup: { text: string; id: number } | null;
}

export type StateChangeListener = (snapshot: GameSnapshot) => void;

export class GameState {
  private static instance: GameState | null = null;

  public status: GameStatus = 'MENU';
  public gameOverReason: GameOverReason | null = null;
  public health: number = 100;
  public maxHealth: number = 100;
  public score: number = 0;
  public survivalTimeSec: number = 0;
  public speed: number = 0;
  public maxSpeed: number = 420;
  public isReversing: boolean = false;
  public isTrapped: boolean = false;
  public trapProgress: number = 0;
  public activePoliceCount: number = 0;
  public policeDestroyedCount: number = 0;
  public nearMissStreak: number = 0;
  public recentScorePopup: { text: string; id: number } | null = null;

  private listeners: Set<StateChangeListener> = new Set();
  private popupCounter: number = 0;

  private constructor() {}

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(): void {
    const snap = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }

  public getSnapshot(): GameSnapshot {
    return {
      status: this.status,
      gameOverReason: this.gameOverReason,
      health: this.health,
      maxHealth: this.maxHealth,
      score: Math.floor(this.score),
      survivalTimeSec: this.survivalTimeSec,
      speed: Math.round(this.speed),
      maxSpeed: this.maxSpeed,
      isReversing: this.isReversing,
      isTrapped: this.isTrapped,
      trapProgress: this.trapProgress,
      activePoliceCount: this.activePoliceCount,
      policeDestroyedCount: this.policeDestroyedCount,
      nearMissStreak: this.nearMissStreak,
      recentScorePopup: this.recentScorePopup
    };
  }

  public triggerScorePopup(text: string): void {
    this.popupCounter++;
    this.recentScorePopup = { text, id: this.popupCounter };
    this.notify();
  }

  public resetRun(): void {
    this.status = 'PLAYING';
    this.gameOverReason = null;
    this.health = 100;
    this.score = 0;
    this.survivalTimeSec = 0;
    this.speed = 0;
    this.isReversing = false;
    this.isTrapped = false;
    this.trapProgress = 0;
    this.activePoliceCount = 0;
    this.policeDestroyedCount = 0;
    this.nearMissStreak = 0;
    this.recentScorePopup = null;
    this.notify();
  }
}
