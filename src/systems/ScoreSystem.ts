import { GAME_CONFIG } from '../game/GameConfig';
import { Player } from '../player/Player';
import { Police } from '../police/Police';
import { Obstacle } from '../world/ObstacleSpawner';

export class ScoreSystem {
  private totalScore: number = 0;
  private nearMissStreak: number = 0;
  private longestStreak: number = 0;
  private nearMissCooldown: number = 0;

  public update(dt: number): void {
    // Survival score: +10 points per second
    this.totalScore += GAME_CONFIG.SCORING.SURVIVAL_PTS_PER_SEC * dt;

    if (this.nearMissCooldown > 0) {
      this.nearMissCooldown = Math.max(0, this.nearMissCooldown - dt);
    }
  }

  public addPoliceDestructionPoints(): number {
    const pts = GAME_CONFIG.SCORING.POLICE_DESTROYED_PTS;
    this.totalScore += pts;
    return pts;
  }

  /**
   * Check for near misses with obstacles or police vehicles
   */
  public checkNearMiss(
    player: Player,
    obstacles: Obstacle[],
    policeList: Police[]
  ): boolean {
    if (this.nearMissCooldown > 0 || player.health.isInvulnerable() || player.speed < 120) {
      return false;
    }

    const nearDist = GAME_CONFIG.SCORING.NEAR_MISS_DISTANCE;
    let didNearMiss = false;

    // Check police proximity
    for (const p of policeList) {
      if (p.isDestroyed) continue;
      const d = Math.hypot(player.x - p.x, player.y - p.y);
      // Close proximity without overlapping bounding boxes
      if (d > 35 && d < 35 + nearDist) {
        didNearMiss = true;
        break;
      }
    }

    // Check obstacle proximity
    if (!didNearMiss) {
      for (const obs of obstacles) {
        const d = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (d > obs.radius + 15 && d < obs.radius + 15 + nearDist) {
          didNearMiss = true;
          break;
        }
      }
    }

    if (didNearMiss) {
      this.totalScore += GAME_CONFIG.SCORING.NEAR_MISS_PTS;
      this.nearMissStreak++;
      this.longestStreak = Math.max(this.longestStreak, this.nearMissStreak);
      this.nearMissCooldown = GAME_CONFIG.SCORING.NEAR_MISS_COOLDOWN_SEC;
      return true;
    }

    return false;
  }

  public resetStreak(): void {
    this.nearMissStreak = 0;
  }

  public getScore(): number {
    return Math.floor(this.totalScore);
  }

  public getNearMissStreak(): number {
    return this.nearMissStreak;
  }

  public getLongestStreak(): number {
    return this.longestStreak;
  }

  public reset(): void {
    this.totalScore = 0;
    this.nearMissStreak = 0;
    this.longestStreak = 0;
    this.nearMissCooldown = 0;
  }
}
