import { GAME_CONFIG } from '../game/GameConfig';
import { Obstacle, ObstacleSpawner } from './ObstacleSpawner';
import { DecorationGenerator } from './DecorationGenerator';

export interface WorldChunk {
  cx: number;
  cy: number;
  obstacles: Obstacle[];
}

export class ChunkManager {
  private chunks: Map<string, WorldChunk> = new Map();
  private chunkSize: number;
  private radius: number;
  private currentDifficulty: number = 1.0;

  constructor() {
    this.chunkSize = GAME_CONFIG.WORLD.CHUNK_SIZE;
    this.radius = GAME_CONFIG.WORLD.VISIBLE_CHUNK_RADIUS;
  }

  public setDifficulty(difficulty: number): void {
    this.currentDifficulty = difficulty;
  }

  private getChunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  public update(playerX: number, playerY: number): void {
    const playerCx = Math.floor(playerX / this.chunkSize);
    const playerCy = Math.floor(playerY / this.chunkSize);

    const neededKeys = new Set<string>();

    // Generate or keep chunks within visibility radius
    for (let dx = -this.radius; dx <= this.radius; dx++) {
      for (let dy = -this.radius; dy <= this.radius; dy++) {
        const cx = playerCx + dx;
        const cy = playerCy + dy;
        const key = this.getChunkKey(cx, cy);
        neededKeys.add(key);

        if (!this.chunks.has(key)) {
          // Never spawn obstacles right on top of starting player chunk (0, 0)
          const isOrigin = cx === 0 && cy === 0;
          const density = isOrigin ? 0.3 : Math.min(2.2, 0.7 + this.currentDifficulty * 0.3);

          const obstacles = ObstacleSpawner.generateChunkObstacles(
            cx,
            cy,
            this.chunkSize,
            density
          );

          this.chunks.set(key, { cx, cy, obstacles });
        }
      }
    }

    // Prune chunks that are too far behind or away
    for (const [key, chunk] of this.chunks.entries()) {
      const dist = Math.max(Math.abs(chunk.cx - playerCx), Math.abs(chunk.cy - playerCy));
      if (dist > this.radius + 1) {
        this.chunks.delete(key);
      }
    }
  }

  public getActiveObstacles(): Obstacle[] {
    const list: Obstacle[] = [];
    for (const chunk of this.chunks.values()) {
      list.push(...chunk.obstacles);
    }
    return list;
  }

  public removeObstacle(id: string): void {
    for (const chunk of this.chunks.values()) {
      const idx = chunk.obstacles.findIndex((o) => o.id === id);
      if (idx !== -1) {
        chunk.obstacles.splice(idx, 1);
        return;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, playerX: number, playerY: number): void {
    const playerCx = Math.floor(playerX / this.chunkSize);
    const playerCy = Math.floor(playerY / this.chunkSize);

    // Render terrain background for all active chunks
    for (let dx = -this.radius; dx <= this.radius; dx++) {
      for (let dy = -this.radius; dy <= this.radius; dy++) {
        const cx = playerCx + dx;
        const cy = playerCy + dy;
        DecorationGenerator.renderChunkTerrain(ctx, cx, cy, this.chunkSize);
      }
    }

    // Render obstacles
    for (const chunk of this.chunks.values()) {
      for (const obs of chunk.obstacles) {
        ObstacleSpawner.renderObstacle(ctx, obs);
      }
    }
  }

  public reset(): void {
    this.chunks.clear();
  }
}
