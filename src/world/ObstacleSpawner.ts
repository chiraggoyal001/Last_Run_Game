import { GAME_CONFIG } from '../game/GameConfig';

export type ObstacleType = 'ROCK' | 'BARRIER' | 'ABANDONED_CAR' | 'DEBRIS_CLUSTER';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  angle: number;
  width: number;
  length: number;
  radius: number;
  health: number; // Destroyable on multiple police hits
}

export class ObstacleSpawner {
  private static idCounter: number = 0;

  /**
   * Generates fair obstacle distribution within a given world chunk
   * Guarantees at least 1 open driving corridor through the chunk
   */
  public static generateChunkObstacles(
    _chunkX: number,
    chunkY: number,
    chunkSize: number,
    density: number = 1.0
  ): Obstacle[] {
    const obstacles: Obstacle[] = [];
    const minY = chunkY * chunkSize;

    // Road is centered horizontally around X=0 with width 720
    const roadHalfWidth = GAME_CONFIG.WORLD.ROAD_WIDTH / 2;
    const laneWidth = GAME_CONFIG.WORLD.ROAD_WIDTH / GAME_CONFIG.WORLD.LANE_COUNT;

    // Reserve 1 or 2 random lanes as guaranteed "Clear Escape Corridors"
    const clearLaneIndex = Math.floor(Math.random() * GAME_CONFIG.WORLD.LANE_COUNT);

    // Number of clusters per chunk scales with density (1 to 4)
    const clusterCount = Math.min(4, Math.max(1, Math.floor(density * (1.8 + Math.random() * 1.5))));

    for (let c = 0; c < clusterCount; c++) {
      // Pick a lane that is NOT the guaranteed escape lane
      let lane = Math.floor(Math.random() * GAME_CONFIG.WORLD.LANE_COUNT);
      if (lane === clearLaneIndex) {
        lane = (lane + 1) % GAME_CONFIG.WORLD.LANE_COUNT;
      }

      // X coordinate centered within lane
      const laneCenterX = -roadHalfWidth + lane * laneWidth + laneWidth / 2;
      const jitterX = (Math.random() - 0.5) * (laneWidth * 0.4);
      const obsX = laneCenterX + jitterX;

      // Y coordinate spread across chunk
      const obsY = minY + 100 + Math.random() * (chunkSize - 200);

      // Select obstacle archetype
      const randType = Math.random();
      let type: ObstacleType;

      if (randType < 0.35) {
        type = 'ROCK';
      } else if (randType < 0.65) {
        type = 'BARRIER';
      } else if (randType < 0.85) {
        type = 'ABANDONED_CAR';
      } else {
        type = 'DEBRIS_CLUSTER';
      }

      const obs = this.createObstacle(type, obsX, obsY);
      obstacles.push(obs);
    }

    // Also occasionally place obstacles on roadside shoulders (curb debris/rocks)
    if (Math.random() < 0.4) {
      const leftShoulderX = -roadHalfWidth + 26 + Math.random() * 20;
      const shoulderY = minY + Math.random() * chunkSize;
      obstacles.push(this.createObstacle('ROCK', leftShoulderX, shoulderY));
    }
    if (Math.random() < 0.4) {
      const rightShoulderX = roadHalfWidth - 26 - Math.random() * 20;
      const shoulderY = minY + Math.random() * chunkSize;
      obstacles.push(this.createObstacle('ROCK', rightShoulderX, shoulderY));
    }

    return obstacles;
  }

  public static createObstacle(type: ObstacleType, x: number, y: number): Obstacle {
    this.idCounter++;
    const id = `obs_${this.idCounter}_${Date.now()}`;

    let width = 20;
    let length = 20;
    let radius = 18;
    let angle = 0;

    switch (type) {
      case 'ROCK': {
        const specs = GAME_CONFIG.OBSTACLES.TYPES.ROCK;
        radius = specs.radius;
        width = radius * 2;
        length = radius * 2;
        angle = Math.random() * Math.PI * 2;
        break;
      }
      case 'BARRIER': {
        const specs = GAME_CONFIG.OBSTACLES.TYPES.BARRIER;
        width = specs.width;
        length = specs.length;
        radius = Math.hypot(width, length) / 2;
        angle = (Math.random() - 0.5) * 0.3; // Slightly angled road barrier
        break;
      }
      case 'ABANDONED_CAR': {
        const specs = GAME_CONFIG.OBSTACLES.TYPES.ABANDONED_CAR;
        width = specs.width;
        length = specs.length;
        radius = Math.hypot(width, length) / 2;
        angle = (Math.random() - 0.5) * 1.2; // Smashed/abandoned angle
        break;
      }
      case 'DEBRIS_CLUSTER': {
        const specs = GAME_CONFIG.OBSTACLES.TYPES.DEBRIS_CLUSTER;
        radius = specs.radius;
        width = radius * 2;
        length = radius * 2;
        angle = Math.random() * Math.PI * 2;
        break;
      }
    }

    return {
      id,
      type,
      x,
      y,
      angle,
      width,
      length,
      radius,
      health: 30 // Can absorb 1-2 police impacts before shattering
    };
  }

  public static renderObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle): void {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    ctx.rotate(obs.angle);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';

    switch (obs.type) {
      case 'ROCK': {
        // Shadow
        ctx.beginPath();
        ctx.ellipse(4, 4, obs.radius, obs.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jagged stone shape
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        const pts = 8;
        for (let i = 0; i < pts; i++) {
          const a = (i / pts) * Math.PI * 2;
          const r = obs.radius * (0.8 + 0.3 * Math.sin(i * 3 + 1));
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(-3, -3, obs.radius * 0.4, obs.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'BARRIER': {
        // Concrete road barrier with hazard diagonal stripes
        ctx.fillRect(-obs.width / 2 + 3, -obs.length / 2 + 3, obs.width, obs.length);

        // Barrier base
        ctx.fillStyle = '#475569';
        ctx.fillRect(-obs.width / 2, -obs.length / 2, obs.width, obs.length);

        // Hazard stripes (Yellow and Black)
        const stripeWidth = 12;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-obs.width / 2, -obs.length / 2, obs.width, obs.length);
        ctx.clip();

        for (let sx = -obs.width / 2 - 20; sx < obs.width / 2 + 20; sx += stripeWidth * 2) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(sx, -obs.length / 2);
          ctx.lineTo(sx + stripeWidth, -obs.length / 2);
          ctx.lineTo(sx + stripeWidth - 8, obs.length / 2);
          ctx.lineTo(sx - 8, obs.length / 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Barrier border
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-obs.width / 2, -obs.length / 2, obs.width, obs.length);
        break;
      }

      case 'ABANDONED_CAR': {
        // Wrecked burnt chassis
        ctx.fillRect(-obs.length / 2 + 4, -obs.width / 2 + 4, obs.length, obs.width);

        ctx.fillStyle = '#374151'; // Dark rusted metal
        ctx.beginPath();
        ctx.roundRect(-obs.length / 2, -obs.width / 2, obs.length, obs.width, 4);
        ctx.fill();

        // Smashed windshield
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, -obs.width / 2 + 4, 10, obs.width - 8);

        // Rust patches
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.arc(-8, -4, 5, 0, Math.PI * 2);
        ctx.arc(12, 4, 6, 0, Math.PI * 2);
        ctx.fill();

        // Hazard flash
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-obs.length / 2, -obs.width / 2 + 2, 2, 4);
        break;
      }

      case 'DEBRIS_CLUSTER': {
        ctx.beginPath();
        ctx.ellipse(3, 3, obs.radius, obs.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Scrap metal / tire pile / rubble
        ctx.fillStyle = '#57534e';
        ctx.beginPath();
        ctx.arc(0, 0, obs.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Broken tires & metal pieces
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(-6, -4, 7, 0, Math.PI * 2);
        ctx.arc(5, 3, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#a8a29e';
        ctx.fillRect(-4, 2, 8, 3);
        break;
      }
    }

    ctx.restore();
  }
}
