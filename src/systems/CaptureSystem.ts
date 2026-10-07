import { GAME_CONFIG } from '../game/GameConfig';
import { Player } from '../player/Player';
import { Police } from '../police/Police';

export class CaptureSystem {
  public isTrapped: boolean = false;
  public trapProgress: number = 0; // 0.0 to 1.0
  private captureDuration: number;

  constructor() {
    this.captureDuration = GAME_CONFIG.CAPTURE.CAPTURE_TIME_SEC;
  }

  public update(dt: number, player: Player, policeList: Police[]): { isTrapped: boolean; isBusted: boolean } {
    const isStalled = Math.abs(player.speed) < GAME_CONFIG.CAPTURE.STALL_SPEED_THRESHOLD;
    const trapRadius = GAME_CONFIG.CAPTURE.PROXIMITY_RADIUS;

    // Filter active police within proximity radius
    const nearbyPolice = policeList.filter((p) => {
      if (p.isDestroyed) return false;
      const d = Math.hypot(player.x - p.x, player.y - p.y);
      return d <= trapRadius;
    });

    // Check angular distribution to confirm genuine box-in (not just 3 cars all behind)
    const hasEnoughPolice = nearbyPolice.length >= GAME_CONFIG.CAPTURE.REQUIRED_POLICE_COUNT;
    const isAngularlySurrounded = hasEnoughPolice && this.checkAngularEnclosure(player, nearbyPolice);

    const currentlyTrapped = isStalled && isAngularlySurrounded;

    if (currentlyTrapped) {
      this.isTrapped = true;
      // Increase capture meter
      this.trapProgress = Math.min(1.0, this.trapProgress + dt / this.captureDuration);

      if (this.trapProgress >= 1.0) {
        return { isTrapped: true, isBusted: true }; // BUSTED!
      }
    } else {
      // If player accelerates away, reverses, or slips through, meter rapidly decays
      this.isTrapped = false;
      this.trapProgress = Math.max(0, this.trapProgress - dt * 2.2);
    }

    return { isTrapped: this.isTrapped, isBusted: false };
  }

  /**
   * Tests whether nearby police surround player across multiple angular sectors
   */
  private checkAngularEnclosure(player: Player, policeList: Police[]): boolean {
    const sectors = new Set<number>();
    for (const p of policeList) {
      const angleToPolice = Math.atan2(p.y - player.y, p.x - player.x);
      // Map angle relative to player heading into 4 quadrants
      let relAngle = angleToPolice - player.angle;
      while (relAngle > Math.PI) relAngle -= Math.PI * 2;
      while (relAngle < -Math.PI) relAngle += Math.PI * 2;

      // 0 = Front, 1 = Right, 2 = Rear, 3 = Left
      const quadrant = Math.floor(((relAngle + Math.PI) / (Math.PI * 2)) * 4);
      sectors.add(quadrant);
    }

    // Surrounded if police cover at least 2 distinct quadrants
    return sectors.size >= 2;
  }

  public reset(): void {
    this.isTrapped = false;
    this.trapProgress = 0;
  }
}
