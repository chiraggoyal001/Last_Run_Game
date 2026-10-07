import { GAME_CONFIG } from '../game/GameConfig';
import { Player } from '../player/Player';
import { PoliceAI, AIState } from './PoliceAI';
import { POLICE_ARCHETYPES, PoliceArchetype, PoliceArchetypeId } from './PoliceTypes';

export interface VisualParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export class Police {
  public id: string;
  public archetypeId: PoliceArchetypeId;
  public archetype: PoliceArchetype;

  public x: number = 0;
  public y: number = 0;
  public angle: number = 0;
  public speed: number = 0;
  public vx: number = 0;
  public vy: number = 0;

  public health: number;
  public maxHealth: number;
  public ai: PoliceAI;

  public isDestroyed: boolean = false;
  public destructionTimer: number = 0; // For death explosion animation
  public isReadyForRemoval: boolean = false;

  public width: number;
  public length: number;

  // Collision cooldown to prevent instant multikill on police
  private hitCooldown: number = 0;
  public particles: VisualParticle[] = [];

  constructor(archetypeId: PoliceArchetypeId, x: number, y: number, angle: number = 0) {
    this.id = `pol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.archetypeId = archetypeId;
    this.archetype = POLICE_ARCHETYPES[archetypeId];
    this.x = x;
    this.y = y;
    this.angle = angle;

    this.maxHealth = this.archetype.health;
    this.health = this.maxHealth;

    this.width = this.archetype.width;
    this.length = this.archetype.length;

    // AI specialization per archetype
    let defaultState: AIState = 'CHASE';
    if (archetypeId === 'interceptor') defaultState = 'INTERCEPT';
    else if (archetypeId === 'pursuit_suv') defaultState = 'FLANK';

    this.ai = new PoliceAI(defaultState);
  }

  public update(dt: number, player: Player): void {
    // Update active particles (smoke, sparks, explosion)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    if (this.hitCooldown > 0) {
      this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    }

    // If destroyed, run explosion animation and halt
    if (this.isDestroyed) {
      this.destructionTimer += dt;
      this.speed = Math.max(0, this.speed - 400 * dt);
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Spawn fiery debris
      if (Math.random() < 0.6) {
        this.spawnSmokeParticle(true);
      }

      if (this.destructionTimer >= 0.75) {
        this.isReadyForRemoval = true;
      }
      return;
    }

    // Target max speed based on player's max forward speed
    const targetMaxSpeed = GAME_CONFIG.PLAYER.MAX_FORWARD_SPEED * this.archetype.speedMultiplier;

    // Accelerate toward target speed
    if (this.speed < targetMaxSpeed) {
      this.speed = Math.min(targetMaxSpeed, this.speed + 230 * dt);
    } else {
      this.speed = Math.max(targetMaxSpeed, this.speed - 150 * dt);
    }

    // AI steering
    const target = this.ai.getTargetPosition(this.x, this.y, this.speed, player, dt);
    this.angle = this.ai.calculateSteer(
      this.angle,
      this.x,
      this.y,
      target.targetX,
      target.targetY,
      this.archetype.steerRate,
      dt
    );

    // Kinematic motion
    const forwardX = Math.cos(this.angle);
    const forwardY = Math.sin(this.angle);

    const grip = 0.85;
    const targetVx = forwardX * this.speed;
    const targetVy = forwardY * this.speed;
    this.vx = this.vx * (1 - grip) + targetVx * grip;
    this.vy = this.vy * (1 - grip) + targetVy * grip;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Strict Highway Guardrail Boundary Enforcement for Police
    const halfRoad = GAME_CONFIG.WORLD.ROAD_WIDTH / 2;
    const minX = -halfRoad + this.width / 2 + 6;
    const maxX = halfRoad - this.width / 2 - 6;

    if (this.x < minX) {
      this.x = minX;
      this.vx = Math.abs(this.vx) * 0.35;
      this.speed *= 0.88;
      this.ai.triggerRecovery(0.4);
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = -Math.abs(this.vx) * 0.35;
      this.speed *= 0.88;
      this.ai.triggerRecovery(0.4);
    }

    // Visual damage state particles (Hidden HP feedback)
    const hpRatio = this.health / this.maxHealth;
    if (hpRatio < 0.25) {
      // Heavy Smoke / Fire (24-1%)
      if (Math.random() < 0.35) {
        this.spawnSmokeParticle(false);
      }
    } else if (hpRatio < 0.5) {
      // Sparks / Minor damage (49-25%)
      if (Math.random() < 0.2) {
        this.spawnSparkParticle();
      }
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isDestroyed || this.hitCooldown > 0) return false;

    this.health = Math.max(0, this.health - amount);
    this.hitCooldown = 0.2; // Brief grace period

    if (this.health <= 0) {
      this.isDestroyed = true;
      this.triggerDestructionEffect();
      return true; // Just destroyed!
    }

    // Trigger AI recovery on hit
    this.ai.triggerRecovery(0.4);
    return false;
  }

  public applyImpulse(impulseX: number, impulseY: number): void {
    this.vx += impulseX;
    this.vy += impulseY;
    this.speed = Math.hypot(this.vx, this.vy) * 0.7;
  }

  private triggerDestructionEffect(): void {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: Math.random() < 0.6 ? '#f97316' : '#ef4444',
        alpha: 1.0,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4
      });
    }
  }

  private spawnSmokeParticle(isFiery: boolean): void {
    const rearDist = -this.length * 0.3;
    const px = this.x + Math.cos(this.angle) * rearDist + (Math.random() - 0.5) * 10;
    const py = this.y + Math.sin(this.angle) * rearDist + (Math.random() - 0.5) * 10;

    this.particles.push({
      x: px,
      y: py,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30 - 20,
      size: 4 + Math.random() * 8,
      color: isFiery ? (Math.random() < 0.5 ? '#f59e0b' : '#ef4444') : '#374151',
      alpha: 0.7,
      life: 0,
      maxLife: 0.4 + Math.random() * 0.3
    });
  }

  private spawnSparkParticle(): void {
    const px = this.x + (Math.random() - 0.5) * this.length;
    const py = this.y + (Math.random() - 0.5) * this.width;

    this.particles.push({
      x: px,
      y: py,
      vx: (Math.random() - 0.5) * 80,
      vy: (Math.random() - 0.5) * 80,
      size: 2,
      color: '#fde047',
      alpha: 1.0,
      life: 0,
      maxLife: 0.2
    });
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Render particles first
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    if (this.destructionTimer > 0.6) return; // Almost gone

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(-this.length / 2 + 5, -this.width / 2 + 5, this.length, this.width, 5);
    ctx.fill();

    // 1. Vehicle Main Body
    const hpRatio = this.health / this.maxHealth;
    const isCharred = hpRatio < 0.25 || this.isDestroyed;

    switch (this.archetypeId) {
      case 'patrol_sedan': {
        // Classic Black & White Cruiser
        ctx.fillStyle = isCharred ? '#27272a' : '#09090b';
        ctx.beginPath();
        ctx.roundRect(-this.length / 2, -this.width / 2, this.length, this.width, 6);
        ctx.fill();

        // White Doors & Roof
        if (!isCharred) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-this.length * 0.2, -this.width / 2, this.length * 0.45, this.width);
        }

        // Windshield & Rear glass
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(4, -this.width / 2 + 3, 10, this.width - 6);
        ctx.fillRect(-this.length * 0.3, -this.width / 2 + 3, 8, this.width - 6);
        break;
      }

      case 'interceptor': {
        // Sleek High-Performance Cruiser
        ctx.fillStyle = isCharred ? '#18181b' : '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-this.length / 2, -this.width / 2, this.length, this.width, [6, 12, 12, 6]);
        ctx.fill();

        // Dual blue stripes
        if (!isCharred) {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(-this.length / 2, -this.width * 0.3, this.length, 3);
          ctx.fillRect(-this.length / 2, this.width * 0.3 - 3, this.length, 3);
        }
        break;
      }

      case 'pursuit_suv': {
        // Heavy Boxy Armored SUV
        ctx.fillStyle = isCharred ? '#1c1917' : '#18181b';
        ctx.beginPath();
        ctx.roundRect(-this.length / 2, -this.width / 2, this.length, this.width, 4);
        ctx.fill();

        // Heavy front bull-bar
        ctx.fillStyle = '#52525b';
        ctx.fillRect(this.length / 2 - 3, -this.width / 2 - 2, 5, this.width + 4);
        break;
      }

      case 'heavy_pursuit': {
        // Tactical Armored Juggernaut
        ctx.fillStyle = isCharred ? '#0a0a0a' : '#020617';
        ctx.beginPath();
        ctx.roundRect(-this.length / 2, -this.width / 2, this.length, this.width, 3);
        ctx.fill();

        // Reinforced steel plating lines
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.length / 2 + 4, -this.width / 2 + 4, this.length - 8, this.width - 8);

        // Heavy steel bumper ram
        ctx.fillStyle = '#334155';
        ctx.fillRect(this.length / 2 - 4, -this.width / 2 - 4, 8, this.width + 8);
        break;
      }
    }

    // 2. Emergency Lightbar Strobe (Active red/blue flash unless destroyed)
    if (!this.isDestroyed) {
      const flashCycle = Math.floor(Date.now() / 120) % 2 === 0;

      // Strobe lightbar on roof
      const barX = -2;
      const barWidth = 6;
      const barLength = this.width - 10;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(barX, -barLength / 2, barWidth, barLength);

      // Red Strobe
      ctx.fillStyle = flashCycle ? '#ef4444' : '#7f1d1d';
      ctx.shadowColor = flashCycle ? '#ef4444' : 'transparent';
      ctx.shadowBlur = flashCycle ? 15 : 0;
      ctx.fillRect(barX, -barLength / 2, barWidth, barLength / 2);

      // Blue Strobe
      ctx.fillStyle = !flashCycle ? '#3b82f6' : '#1e3a8a';
      ctx.shadowColor = !flashCycle ? '#3b82f6' : 'transparent';
      ctx.shadowBlur = !flashCycle ? 15 : 0;
      ctx.fillRect(barX, 0, barWidth, barLength / 2);

      ctx.shadowBlur = 0; // Reset
    }

    ctx.restore();
  }
}
