import { GAME_CONFIG } from '../game/GameConfig';
import { Player } from '../player/Player';
import { Police } from './Police';
import { PoliceArchetypeId } from './PoliceTypes';

export class PoliceSpawner {
  private spawnTimer: number = 0;
  private currentSurvivalTime: number = 0;
  private currentDifficulty: number = 1.0;

  constructor() {
    this.reset();
  }

  public update(dt: number, survivalTimeSec: number, difficulty: number): void {
    this.currentSurvivalTime = survivalTimeSec;
    this.currentDifficulty = difficulty;
    this.spawnTimer += dt;
  }

  public canSpawn(activePolice: Police[]): boolean {
    const maxThreat = this.getMaxThreatBudget(this.currentSurvivalTime);
    const currentThreat = activePolice.reduce((sum, p) => sum + p.archetype.threatCost, 0);

    if (currentThreat >= maxThreat) {
      return false;
    }

    // Dynamic spawn interval based on difficulty (6.5s early -> 2.8s late)
    const interval = Math.max(
      GAME_CONFIG.DIFFICULTY.MIN_SPAWN_INTERVAL_SEC,
      GAME_CONFIG.DIFFICULTY.BASE_SPAWN_INTERVAL_SEC - (this.currentDifficulty - 1) * 0.9
    );

    return this.spawnTimer >= interval;
  }

  public spawnNext(player: Player, activePolice: Police[]): Police | null {
    if (!this.canSpawn(activePolice)) return null;

    this.spawnTimer = 0; // Reset timer

    const maxThreat = this.getMaxThreatBudget(this.currentSurvivalTime);
    const currentThreat = activePolice.reduce((sum, p) => sum + p.archetype.threatCost, 0);
    const availableBudget = maxThreat - currentThreat;

    const archetypeId = this.selectArchetype(this.currentSurvivalTime, availableBudget);
    const spawnPos = this.calculateFairSpawnPosition(player);

    // Initial heading roughly oriented towards player
    const spawnAngle = Math.atan2(player.y - spawnPos.y, player.x - spawnPos.x);

    return new Police(archetypeId, spawnPos.x, spawnPos.y, spawnAngle);
  }

  private getMaxThreatBudget(timeSec: number): number {
    for (const tier of GAME_CONFIG.DIFFICULTY.MAX_POLICE_TIERS) {
      if (timeSec < tier.timeSec) {
        return tier.maxThreat;
      }
    }
    return 5;
  }

  private selectArchetype(timeSec: number, availableBudget: number): PoliceArchetypeId {
    const rand = Math.random();

    if (timeSec < 30) {
      // 0–30s: Only Patrol Sedan
      return 'patrol_sedan';
    } else if (timeSec < 60) {
      // 30–60s: Patrol (60%) or Interceptor (40%)
      return rand < 0.6 ? 'patrol_sedan' : 'interceptor';
    } else if (timeSec < 120) {
      // 60–120s: Patrol (35%), Interceptor (35%), Pursuit SUV (30%)
      if (rand < 0.35) return 'patrol_sedan';
      if (rand < 0.70) return 'interceptor';
      return 'pursuit_suv';
    } else {
      // 120s+: All 4 types. Heavy Pursuit is rare (15%) and requires budget >= 2
      if (rand < 0.15 && availableBudget >= 2) {
        return 'heavy_pursuit';
      }
      if (rand < 0.40) return 'interceptor';
      if (rand < 0.70) return 'pursuit_suv';
      return 'patrol_sedan';
    }
  }

  /**
   * Fair spawn position: Behind the player or far to the side.
   * Never directly in front or inside the camera viewport center.
   */
  private calculateFairSpawnPosition(player: Player): { x: number; y: number } {
    const behindAngle = player.angle + Math.PI; // Directly behind
    const sideOffset = (Math.random() - 0.5) * 1.0; // +/- 0.5 rad side spread
    const angle = behindAngle + sideOffset;

    // Spawn distance: 550 to 700 px away (just outside screen edge)
    const distance = 580 + Math.random() * 120;

    const sx = player.x + Math.cos(angle) * distance;
    const sy = player.y + Math.sin(angle) * distance;

    // Ensure police always spawn on the highway within guardrails
    const roadHalf = GAME_CONFIG.WORLD.ROAD_WIDTH / 2;
    const clampedSx = Math.max(-roadHalf + 45, Math.min(roadHalf - 45, sx));

    return { x: clampedSx, y: sy };
  }

  public reset(): void {
    this.spawnTimer = 2.0; // Quick initial spawn after start
    this.currentSurvivalTime = 0;
    this.currentDifficulty = 1.0;
  }
}
