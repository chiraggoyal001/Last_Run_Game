import { GAME_CONFIG } from '../game/GameConfig';
import { Player } from '../player/Player';

export interface HealthPickup {
  id: string;
  x: number;
  y: number;
  radius: number;
  pulsePhase: number;
}

export class PowerupSystem {
  public activePickup: HealthPickup | null = null;
  private spawnTimer: number = 0;
  private nextInterval: number = 24;

  constructor() {
    this.resetTimer();
  }

  private resetTimer(): void {
    this.spawnTimer = 0;
    // 20–30s randomized interval
    const min = GAME_CONFIG.HEALTH_PICKUP.SPAWN_INTERVAL_MIN_SEC;
    const max = GAME_CONFIG.HEALTH_PICKUP.SPAWN_INTERVAL_MAX_SEC;
    this.nextInterval = min + Math.random() * (max - min);
  }

  public update(dt: number, player: Player): HealthPickup | null {
    if (this.activePickup) {
      this.activePickup.pulsePhase += dt * 3.5;

      // Despawn if player drove far past it (>900px away)
      const dist = Math.hypot(player.x - this.activePickup.x, player.y - this.activePickup.y);
      if (dist > 950) {
        this.activePickup = null;
        this.resetTimer();
      }
      return null;
    }

    // Delay spawn slightly if player HP > 85 (GDD Section 30)
    let interval = this.nextInterval;
    if (player.health.getHealth() > GAME_CONFIG.HEALTH_PICKUP.HIGH_HP_DELAY_THRESHOLD) {
      interval += GAME_CONFIG.HEALTH_PICKUP.HIGH_HP_DELAY_SEC;
    }

    this.spawnTimer += dt;
    if (this.spawnTimer >= interval) {
      this.spawnPickup(player);
      this.resetTimer();
      return this.activePickup;
    }

    return null;
  }

  private spawnPickup(player: Player): void {
    // Spawn ahead of the player (350 to 550px forward)
    const forwardDist = 380 + Math.random() * 180;
    // Risk/reward positioning: placed slightly off-center towards road edges
    const roadHalf = GAME_CONFIG.WORLD.ROAD_WIDTH / 2;
    const sideOffset = (Math.random() < 0.5 ? -1 : 1) * (roadHalf * 0.45 + Math.random() * (roadHalf * 0.35));

    const forwardX = Math.cos(player.angle);
    const forwardY = Math.sin(player.angle);
    const perpX = -forwardY;
    const perpY = forwardX;

    const px = player.x + forwardX * forwardDist + perpX * sideOffset;
    const py = player.y + forwardY * forwardDist + perpY * sideOffset;

    this.activePickup = {
      id: `hp_${Date.now()}`,
      x: px,
      y: py,
      radius: GAME_CONFIG.HEALTH_PICKUP.RADIUS,
      pulsePhase: 0
    };
  }

  public checkCollection(player: Player): boolean {
    if (!this.activePickup) return false;

    const dist = Math.hypot(player.x - this.activePickup.x, player.y - this.activePickup.y);
    const collectionRadius = this.activePickup.radius + player.width / 2;

    if (dist <= collectionRadius) {
      this.activePickup = null;
      this.resetTimer();
      return true; // Successfully collected
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.activePickup) return;

    const p = this.activePickup;
    const pulse = 1 + Math.sin(p.pulsePhase) * 0.18;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Glowing Aura
    const auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, p.radius * 2.2 * pulse);
    auraGrad.addColorStop(0, 'rgba(34, 197, 94, 0.7)');
    auraGrad.addColorStop(0.5, 'rgba(34, 197, 94, 0.25)');
    auraGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 2.2 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Outer Circle Pill
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // White Medical Cross in Center
    ctx.fillStyle = '#ffffff';
    const barW = 5 * pulse;
    const barL = 16 * pulse;
    // Vertical bar
    ctx.fillRect(-barW / 2, -barL / 2, barW, barL);
    // Horizontal bar
    ctx.fillRect(-barL / 2, -barW / 2, barL, barW);

    ctx.restore();
  }

  public reset(): void {
    this.activePickup = null;
    this.resetTimer();
  }
}
