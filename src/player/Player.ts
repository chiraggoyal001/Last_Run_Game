import { GAME_CONFIG } from '../game/GameConfig';
import { PlayerController } from './PlayerController';
import { PlayerHealth } from './PlayerHealth';

export interface SkidPoint {
  x: number;
  y: number;
  alpha: number;
  width: number;
}

export class Player {
  public x: number = 0;
  public y: number = 0;
  public angle: number = -Math.PI / 2; // Radians, default facing UP (-Y)
  public speed: number = 0; // Forward positive, reverse negative
  public vx: number = 0;
  public vy: number = 0;

  public health: PlayerHealth;
  public controller: PlayerController;

  public width: number = GAME_CONFIG.PLAYER.DIMENSIONS.width;
  public length: number = GAME_CONFIG.PLAYER.DIMENSIONS.length;
  public isBraking: boolean = false;
  public isReversing: boolean = false;

  // Visual effects
  public skidMarks: SkidPoint[] = [];
  private skidTimer: number = 0;

  constructor(startX: number = 0, startY: number = 0) {
    this.x = startX;
    this.y = startY;
    this.health = new PlayerHealth();
    this.controller = PlayerController.getInstance();
  }

  public update(dt: number): void {
    this.health.update(dt);
    const inputs = this.controller.getInputs();

    const maxForward = GAME_CONFIG.PLAYER.MAX_FORWARD_SPEED;
    const maxReverse = GAME_CONFIG.PLAYER.MAX_REVERSE_SPEED;

    this.isBraking = inputs.brake;

    // 1. Acceleration / Brake / Reverse Mechanics
    if (inputs.brake) {
      if (this.speed > 0) {
        // Slowing down towards zero
        this.speed = Math.max(0, this.speed - GAME_CONFIG.PLAYER.BRAKE_DECELERATION * dt);
        this.isReversing = false;
      } else {
        // Continuous hold brake transitions into reverse
        this.isReversing = true;
        this.speed = Math.max(-maxReverse, this.speed - GAME_CONFIG.PLAYER.REVERSE_ACCELERATION * dt);
      }
    } else {
      // Releasing brake: if currently in reverse, decelerate to 0 first, then forward drive auto-resumes
      if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + GAME_CONFIG.PLAYER.BRAKE_DECELERATION * dt);
        this.isReversing = this.speed < 0;
      } else {
        // Automatic forward drive force
        this.isReversing = false;
        if (this.speed < maxForward) {
          this.speed = Math.min(maxForward, this.speed + GAME_CONFIG.PLAYER.FORWARD_ACCELERATION * dt);
        }
      }
    }

    // 2. Speed-Dependent Steering Mechanics
    // Sharp turns at low speed, wider radius at top speed
    const forwardRatio = Math.max(0, Math.min(1, Math.abs(this.speed) / maxForward));
    const steerDamping = 1 - forwardRatio * GAME_CONFIG.PLAYER.HIGH_SPEED_STEER_DAMPING;
    const currentSteerRate = GAME_CONFIG.PLAYER.BASE_STEER_RATE * steerDAMPING_FORMULA(steerDamping);

    // Minimum movement needed to steer
    const canTurn = Math.abs(this.speed) > 5;
    if (canTurn) {
      const turnDirection = this.speed >= 0 ? 1 : -1; // Invert steering naturally in reverse
      if (inputs.steerValue !== 0) {
        this.angle += currentSteerRate * inputs.steerValue * turnDirection * dt;
      } else {
        if (inputs.steerLeft) {
          this.angle -= currentSteerRate * turnDirection * dt;
        }
        if (inputs.steerRight) {
          this.angle += currentSteerRate * turnDirection * dt;
        }
      }
    }

    // 3. Vehicle Kinematics: Heading vector and lateral grip
    const forwardX = Math.cos(this.angle);
    const forwardY = Math.sin(this.angle);

    // Update velocity with grip
    const targetVx = forwardX * this.speed;
    const targetVy = forwardY * this.speed;

    const grip = GAME_CONFIG.PLAYER.LATERAL_GRIP;
    this.vx = this.vx * (1 - grip) + targetVx * grip;
    this.vy = this.vy * (1 - grip) + targetVy * grip;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Strict Highway Guardrail Boundary Enforcement
    const halfRoad = GAME_CONFIG.WORLD.ROAD_WIDTH / 2;
    const minX = -halfRoad + this.width / 2 + 6;
    const maxX = halfRoad - this.width / 2 - 6;

    if (this.x < minX) {
      this.x = minX;
      this.vx = Math.abs(this.vx) * 0.25;
      this.speed *= 0.92;
      // Gently deflect heading towards highway direction
      if (Math.cos(this.angle) < -0.05) {
        this.angle = this.angle * 0.85 + (-Math.PI / 2) * 0.15;
      }
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = -Math.abs(this.vx) * 0.25;
      this.speed *= 0.92;
      if (Math.cos(this.angle) > 0.05) {
        this.angle = this.angle * 0.85 + (-Math.PI / 2) * 0.15;
      }
    }

    // 4. Skid marks on heavy braking or sharp turns
    this.updateSkids(dt, inputs);
  }

  private updateSkids(dt: number, inputs: { steerLeft: boolean; steerRight: boolean; brake: boolean }): void {
    this.skidTimer += dt;
    const isHardBraking = inputs.brake && this.speed > 160;
    const isHardTurning = (inputs.steerLeft || inputs.steerRight) && this.speed > 240;

    if ((isHardBraking || isHardTurning) && this.skidTimer > 0.05) {
      this.skidTimer = 0;
      // Calculate wheel positions behind vehicle
      const rearDist = -this.length * 0.4;
      const rearX = this.x + Math.cos(this.angle) * rearDist;
      const rearY = this.y + Math.sin(this.angle) * rearDist;

      const perpAngle = this.angle + Math.PI / 2;
      const halfWidth = this.width * 0.4;

      this.skidMarks.push({
        x: rearX + Math.cos(perpAngle) * halfWidth,
        y: rearY + Math.sin(perpAngle) * halfWidth,
        alpha: 0.5,
        width: 3.5
      });
      this.skidMarks.push({
        x: rearX - Math.cos(perpAngle) * halfWidth,
        y: rearY - Math.sin(perpAngle) * halfWidth,
        alpha: 0.5,
        width: 3.5
      });

      // Keep skid mark buffer under control
      if (this.skidMarks.length > 300) {
        this.skidMarks.splice(0, 50);
      }
    }

    // Fade old skid marks
    for (const skid of this.skidMarks) {
      skid.alpha = Math.max(0, skid.alpha - dt * 0.04);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Render skid marks first (under car)
    for (const skid of this.skidMarks) {
      if (skid.alpha <= 0) continue;
      ctx.fillStyle = `rgba(20, 20, 25, ${skid.alpha})`;
      ctx.beginPath();
      ctx.arc(skid.x, skid.y, skid.width, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // 1. Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(-this.length / 2 + 5, -this.width / 2 + 5, this.length, this.width, 6);
    ctx.fill();

    // Invulnerability Blink Feedback
    if (this.health.isInvulnerable()) {
      const blink = Math.floor(Date.now() / 80) % 2 === 0;
      if (blink) {
        ctx.globalAlpha = 0.4;
      }
    }

    // 2. Headlight Beams (Front projection onto road)
    const beamGrad = ctx.createRadialGradient(this.length / 2, 0, 10, this.length / 2 + 140, 0, 180);
    beamGrad.addColorStop(0, 'rgba(255, 255, 230, 0.4)');
    beamGrad.addColorStop(0.6, 'rgba(255, 255, 210, 0.15)');
    beamGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(this.length / 2, -this.width * 0.4);
    ctx.lineTo(this.length / 2 + 160, -this.width * 1.8);
    ctx.lineTo(this.length / 2 + 160, this.width * 1.8);
    ctx.lineTo(this.length / 2, this.width * 0.4);
    ctx.closePath();
    ctx.fill();

    // 3. Vehicle Main Chassis (Sleek Ruby Crimson Sports Coupe)
    const chassisGrad = ctx.createLinearGradient(-this.length / 2, 0, this.length / 2, 0);
    chassisGrad.addColorStop(0, '#991b1b');
    chassisGrad.addColorStop(0.4, '#dc2626');
    chassisGrad.addColorStop(0.8, '#ef4444');
    chassisGrad.addColorStop(1, '#b91c1c');

    ctx.fillStyle = chassisGrad;
    ctx.beginPath();
    ctx.roundRect(-this.length / 2, -this.width / 2, this.length, this.width, [6, 10, 10, 6]);
    ctx.fill();

    // Racing Stripes
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-this.length / 2, -3, this.length, 6);

    // Front Windshield & Rear Window
    ctx.fillStyle = '#0f172a';
    // Front windshield
    ctx.beginPath();
    ctx.roundRect(4, -this.width / 2 + 3, 14, this.width - 6, [2, 5, 5, 2]);
    ctx.fill();

    // Rear window
    ctx.beginPath();
    ctx.roundRect(-this.length * 0.35, -this.width / 2 + 4, 10, this.width - 8, 3);
    ctx.fill();

    // Roof Top
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-this.length * 0.15, -this.width / 2 + 4, 18, this.width - 8);

    // Front Headlight Lenses
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(this.length / 2 - 2, -this.width / 2 + 2, 3, 5);
    ctx.fillRect(this.length / 2 - 2, this.width / 2 - 7, 3, 5);

    // Rear Tail / Brake Lights (Bright glow when braking/reversing)
    const brakeColor = this.isBraking || this.isReversing ? '#ff0033' : '#7f1d1d';
    ctx.fillStyle = brakeColor;
    ctx.shadowColor = this.isBraking || this.isReversing ? '#ff0033' : 'transparent';
    ctx.shadowBlur = this.isBraking || this.isReversing ? 12 : 0;
    ctx.fillRect(-this.length / 2, -this.width / 2 + 2, 3, 6);
    ctx.fillRect(-this.length / 2, this.width / 2 - 8, 3, 6);
    ctx.shadowBlur = 0; // Reset shadow

    // Rear Spoiler
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-this.length / 2 - 2, -this.width / 2 + 1, 4, this.width - 2);

    ctx.restore();
  }

  public reset(x: number = 0, y: number = 0): void {
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 2;
    this.speed = 0;
    this.vx = 0;
    this.vy = 0;
    this.isBraking = false;
    this.isReversing = false;
    this.skidMarks = [];
    this.health.reset();
    this.controller.reset();
  }
}

function steerDAMPING_FORMULA(val: number): number {
  return Math.max(0.4, val);
}
