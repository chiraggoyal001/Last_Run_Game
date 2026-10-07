import { Player } from '../player/Player';

export type AIState = 'CHASE' | 'INTERCEPT' | 'FLANK' | 'RECOVER';

export class PoliceAI {
  public state: AIState = 'CHASE';
  private recoverTimer: number = 0;
  private flankSide: number = 1; // +1 or -1 for left/right flank

  constructor(initialState: AIState = 'CHASE') {
    this.state = initialState;
    this.flankSide = Math.random() < 0.5 ? 1 : -1;
  }

  public triggerRecovery(durationSec: number = 0.5): void {
    this.state = 'RECOVER';
    this.recoverTimer = durationSec;
  }

  /**
   * Calculates target position (x, y) based on current AI state and archetype behavior
   */
  public getTargetPosition(
    policeX: number,
    policeY: number,
    policeSpeed: number,
    player: Player,
    dt: number
  ): { targetX: number; targetY: number } {
    if (this.state === 'RECOVER') {
      this.recoverTimer -= dt;
      if (this.recoverTimer <= 0) {
        this.state = 'CHASE';
      } else {
        // Steer slightly away from player during recovery
        const dx = policeX - player.x;
        const dy = policeY - player.y;
        const dist = Math.hypot(dx, dy) || 1;
        return {
          targetX: policeX + (dx / dist) * 120,
          targetY: policeY + (dy / dist) * 120
        };
      }
    }

    switch (this.state) {
      case 'INTERCEPT': {
        // Predictive lead-pursuit: calculate intercept point ahead of player
        const dx = player.x - policeX;
        const dy = player.y - policeY;
        const dist = Math.hypot(dx, dy);
        const lookaheadTime = Math.min(1.4, Math.max(0.2, dist / (policeSpeed || 300)));

        const predictX = player.x + player.vx * lookaheadTime;
        const predictY = player.y + player.vy * lookaheadTime;

        return { targetX: predictX, targetY: predictY };
      }

      case 'FLANK': {
        // Flank alongside player to box or pin them
        const playerHeading = player.angle;
        const flankDistance = 65; // Side offset
        const perpAngle = playerHeading + (Math.PI / 2) * this.flankSide;

        const flankX = player.x + Math.cos(perpAngle) * flankDistance + Math.cos(playerHeading) * 40;
        const flankY = player.y + Math.sin(perpAngle) * flankDistance + Math.sin(playerHeading) * 40;

        return { targetX: flankX, targetY: flankY };
      }

      case 'CHASE':
      default: {
        // Direct tracking of player's center
        return { targetX: player.x, targetY: player.y };
      }
    }
  }

  /**
   * Returns steering angle adjustment needed to turn towards target
   */
  public calculateSteer(
    currentAngle: number,
    currentX: number,
    currentY: number,
    targetX: number,
    targetY: number,
    steerRate: number,
    dt: number
  ): number {
    const desiredAngle = Math.atan2(targetY - currentY, targetX - currentX);
    let angleDiff = desiredAngle - currentAngle;

    // Normalize angle to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const maxTurn = steerRate * dt;
    const actualTurn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

    return currentAngle + actualTurn;
  }
}
