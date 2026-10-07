import { GAME_CONFIG } from '../game/GameConfig';
import { Player } from '../player/Player';
import { Police } from '../police/Police';
import { Obstacle } from '../world/ObstacleSpawner';

export interface CollisionEvent {
  type: 'PLAYER_OBSTACLE' | 'PLAYER_POLICE' | 'POLICE_OBSTACLE' | 'POLICE_POLICE';
  damageDealt: number;
  x: number;
  y: number;
  intensity: number;
}

export class CollisionSystem {
  public static checkAndResolveCollisions(
    player: Player,
    policeList: Police[],
    obstacles: Obstacle[],
    onPoliceDestroyed: (police: Police) => void
  ): CollisionEvent[] {
    const events: CollisionEvent[] = [];

    // 0. Player vs Highway Guardrail Impact
    const halfRoad = GAME_CONFIG.WORLD.ROAD_WIDTH / 2;
    const leftLimit = -halfRoad + player.width / 2 + 7;
    const rightLimit = halfRoad - player.width / 2 - 7;

    if (player.x <= leftLimit || player.x >= rightLimit) {
      const hitWallX = player.x <= leftLimit ? leftLimit : rightLimit;
      const isHardImpact = Math.abs(player.vx) > 35 || Math.abs(player.speed) > 240;
      if (isHardImpact) {
        const tookDmg = player.health.takeDamage(GAME_CONFIG.OBSTACLES.DAMAGE);
        if (tookDmg) {
          events.push({
            type: 'PLAYER_OBSTACLE',
            damageDealt: GAME_CONFIG.OBSTACLES.DAMAGE,
            x: hitWallX,
            y: player.y,
            intensity: 0.85
          });
        }
      }
    }

    // 1. Player vs Obstacles
    for (const obs of obstacles) {
      const dx = player.x - obs.x;
      const dy = player.y - obs.y;
      const dist = Math.hypot(dx, dy);
      const minDistance = player.width * 0.45 + obs.radius;

      if (dist < minDistance && dist > 0.001) {
        // Resolve penetration
        const overlap = minDistance - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        player.x += nx * overlap;
        player.y += ny * overlap;
        player.speed *= 0.5; // Decelerate on crash

        // Apply obstacle collision damage (10 HP)
        const tookDmg = player.health.takeDamage(GAME_CONFIG.OBSTACLES.DAMAGE);
        if (tookDmg) {
          events.push({
            type: 'PLAYER_OBSTACLE',
            damageDealt: GAME_CONFIG.OBSTACLES.DAMAGE,
            x: obs.x,
            y: obs.y,
            intensity: 1.0
          });
        }
      }
    }

    // 2. Player vs Police
    for (const p of policeList) {
      if (p.isDestroyed) continue;

      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const dist = Math.hypot(dx, dy);
      const minDistance = (player.width + p.width) * 0.5;

      if (dist < minDistance && dist > 0.001) {
        // Push apart
        const overlap = minDistance - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        player.x += nx * overlap * 0.5;
        player.y += ny * overlap * 0.5;
        p.x -= nx * overlap * 0.5;
        p.y -= ny * overlap * 0.5;

        // Apply impulse
        const impactSpeed = Math.abs(player.speed - p.speed) + 100;
        p.applyImpulse(-nx * impactSpeed * 0.4, -ny * impactSpeed * 0.4);

        // Player takes archetype damage (8, 12, 18, 25)
        const damageToPlayer = p.archetype.damage;
        const tookDmg = player.health.takeDamage(damageToPlayer);

        // Police takes collision damage from player
        const damageToPolice = 10 + Math.floor(Math.abs(player.speed) / 35);
        const wasKilled = p.takeDamage(damageToPolice);
        if (wasKilled) {
          onPoliceDestroyed(p);
        }

        if (tookDmg || wasKilled) {
          events.push({
            type: 'PLAYER_POLICE',
            damageDealt: damageToPlayer,
            x: (player.x + p.x) / 2,
            y: (player.y + p.y) / 2,
            intensity: Math.min(1.5, impactSpeed / 250)
          });
        }
      }
    }

    // 3. Police vs Obstacles
    for (const p of policeList) {
      if (p.isDestroyed) continue;

      for (const obs of obstacles) {
        const dx = p.x - obs.x;
        const dy = p.y - obs.y;
        const dist = Math.hypot(dx, dy);
        const minDistance = p.width * 0.45 + obs.radius;

        if (dist < minDistance && dist > 0.001) {
          const overlap = minDistance - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          p.x += nx * overlap;
          p.y += ny * overlap;
          p.applyImpulse(nx * 120, ny * 120);

          const wasKilled = p.takeDamage(15);
          if (wasKilled) {
            onPoliceDestroyed(p);
          }

          events.push({
            type: 'POLICE_OBSTACLE',
            damageDealt: 15,
            x: obs.x,
            y: obs.y,
            intensity: 0.8
          });
        }
      }
    }

    // 4. Police vs Police (Mutual inter-police crashes!)
    for (let i = 0; i < policeList.length; i++) {
      const p1 = policeList[i];
      if (p1.isDestroyed) continue;

      for (let j = i + 1; j < policeList.length; j++) {
        const p2 = policeList[j];
        if (p2.isDestroyed) continue;

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.hypot(dx, dy);
        const minDistance = (p1.width + p2.width) * 0.48;

        if (dist < minDistance && dist > 0.001) {
          const overlap = minDistance - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          p1.x += nx * overlap * 0.5;
          p1.y += ny * overlap * 0.5;
          p2.x -= nx * overlap * 0.5;
          p2.y -= ny * overlap * 0.5;

          p1.applyImpulse(nx * 90, ny * 90);
          p2.applyImpulse(-nx * 90, -ny * 90);

          const killed1 = p1.takeDamage(12);
          const killed2 = p2.takeDamage(12);

          if (killed1) onPoliceDestroyed(p1);
          if (killed2) onPoliceDestroyed(p2);

          events.push({
            type: 'POLICE_POLICE',
            damageDealt: 12,
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
            intensity: 0.9
          });
        }
      }
    }

    return events;
  }
}
