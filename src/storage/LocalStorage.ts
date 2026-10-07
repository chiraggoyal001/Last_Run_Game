export interface GameStatistics {
  bestScore: number;
  bestSurvivalTimeSec: number;
  gamesPlayed: number;
  longestNearMissStreak: number;
  totalPoliceDestroyed: number;
}

const STORAGE_KEY = 'last_run_game_stats_v1';

const DEFAULT_STATS: GameStatistics = {
  bestScore: 0,
  bestSurvivalTimeSec: 0,
  gamesPlayed: 0,
  longestNearMissStreak: 0,
  totalPoliceDestroyed: 0
};

export class LocalStorageManager {
  public static getStats(): GameStatistics {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { ...DEFAULT_STATS };
      const parsed = JSON.parse(data);
      return { ...DEFAULT_STATS, ...parsed };
    } catch {
      return { ...DEFAULT_STATS };
    }
  }

  public static saveRunResult(
    score: number,
    survivalTimeSec: number,
    nearMissStreak: number,
    policeDestroyed: number
  ): { isNewBestScore: boolean; isNewBestTime: boolean; stats: GameStatistics } {
    const current = this.getStats();
    const isNewBestScore = score > current.bestScore;
    const isNewBestTime = survivalTimeSec > current.bestSurvivalTimeSec;

    const updated: GameStatistics = {
      bestScore: Math.max(current.bestScore, score),
      bestSurvivalTimeSec: Math.max(current.bestSurvivalTimeSec, survivalTimeSec),
      gamesPlayed: current.gamesPlayed + 1,
      longestNearMissStreak: Math.max(current.longestNearMissStreak, nearMissStreak),
      totalPoliceDestroyed: current.totalPoliceDestroyed + policeDestroyed
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage failed silently or private mode
    }

    return { isNewBestScore, isNewBestTime, stats: updated };
  }
}
