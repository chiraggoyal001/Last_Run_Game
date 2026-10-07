import { GAME_CONFIG } from '../game/GameConfig';

export class DifficultySystem {
  public static calculateDifficulty(survivalTimeSec: number): number {
    // Formula from GDD Section 31: Difficulty = 1 + SurvivalSeconds / 45
    const raw = 1 + survivalTimeSec / GAME_CONFIG.DIFFICULTY.TIME_BASE_DIVISOR;
    // Cap smoothly at 3.5 to prevent absurd impossible speeds
    return Math.min(3.5, raw);
  }
}
