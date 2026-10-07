import { GAME_CONFIG } from '../game/GameConfig';

export class DecorationGenerator {
  /**
   * Render continuous asphalt road, lane lines, rumble strips, off-road terrain,
   * and heavy steel highway crash guardrails along both sides of the track.
   */
  public static renderChunkTerrain(
    ctx: CanvasRenderingContext2D,
    chunkX: number,
    chunkY: number,
    chunkSize: number
  ): void {
    const minX = chunkX * chunkSize;
    const minY = chunkY * chunkSize;
    const roadWidth = GAME_CONFIG.WORLD.ROAD_WIDTH;
    const halfRoad = roadWidth / 2;

    const roadLeft = -halfRoad;
    const roadRight = halfRoad;

    // 1. Off-Road Dirt & Gravel Verge (Terrain background)
    ctx.fillStyle = '#1c1917'; // Dark stone/dirt ground
    ctx.fillRect(minX, minY, chunkSize, chunkSize);

    // Subtle off-road grit / terrain variations
    ctx.fillStyle = '#292524';
    const gritStep = 160;
    for (let gx = minX + 20; gx < minX + chunkSize; gx += gritStep) {
      for (let gy = minY + 30; gy < minY + chunkSize; gy += gritStep) {
        if (gx < roadLeft - 30 || gx > roadRight + 30) {
          ctx.beginPath();
          ctx.arc(gx + (Math.sin(gy) * 20), gy, 18, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Asphalt Road Surface
    // Check if chunk overlaps the road horizontally [-halfRoad, halfRoad]
    if (minX + chunkSize >= roadLeft && minX <= roadRight) {
      const renderLeft = Math.max(minX, roadLeft);
      const renderRight = Math.min(minX + chunkSize, roadRight);
      const renderWidth = renderRight - renderLeft;

      // Dark asphalt highway surface
      ctx.fillStyle = '#18181b';
      ctx.fillRect(renderLeft, minY, renderWidth, chunkSize);

      // Rumble Strips on Outer Shoulders (Alternating Red and White teeth)
      const rumbleWidth = 14;
      const toothLength = 24;

      // Left Shoulder Rumble Strip
      if (minX <= roadLeft && minX + chunkSize >= roadLeft) {
        for (let y = Math.floor(minY / toothLength) * toothLength; y < minY + chunkSize + toothLength; y += toothLength) {
          const isRed = Math.floor(y / toothLength) % 2 === 0;
          ctx.fillStyle = isRed ? '#dc2626' : '#f8fafc';
          ctx.fillRect(roadLeft, y, rumbleWidth, toothLength);
        }
        // Solid white outer line
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(roadLeft + rumbleWidth + 2, minY, 5, chunkSize);
      }

      // Right Shoulder Rumble Strip
      if (minX <= roadRight && minX + chunkSize >= roadRight) {
        for (let y = Math.floor(minY / toothLength) * toothLength; y < minY + chunkSize + toothLength; y += toothLength) {
          const isRed = Math.floor(y / toothLength) % 2 === 0;
          ctx.fillStyle = isRed ? '#dc2626' : '#f8fafc';
          ctx.fillRect(roadRight - rumbleWidth, y, rumbleWidth, toothLength);
        }
        // Solid white outer line
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(roadRight - rumbleWidth - 7, minY, 5, chunkSize);
      }

      // Dashed Lane Dividers
      const laneCount = GAME_CONFIG.WORLD.LANE_COUNT;
      const laneWidth = roadWidth / laneCount;
      const dashLength = 34;
      const dashGap = 30;
      const dashCycle = dashLength + dashGap;

      ctx.fillStyle = 'rgba(250, 204, 21, 0.45)'; // Amber/yellow dashed lines

      for (let l = 1; l < laneCount; l++) {
        const lineX = roadLeft + l * laneWidth;
        if (lineX >= minX && lineX <= minX + chunkSize) {
          const startOffset = Math.floor(minY / dashCycle) * dashCycle;
          for (let y = startOffset; y < minY + chunkSize + dashCycle; y += dashCycle) {
            ctx.fillRect(lineX - 2, y, 4, dashLength);
          }
        }
      }

      // 3. Heavy Crash Guardrails (Steel W-beam + Posts + Reflectors)
      const postSpacing = 48;

      // LEFT GUARDRAIL
      if (minX <= roadLeft && minX + chunkSize >= roadLeft) {
        // Inner shadow on asphalt
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(roadLeft, minY, 10, chunkSize);

        // Concrete curb base
        ctx.fillStyle = '#334155';
        ctx.fillRect(roadLeft - 8, minY, 12, chunkSize);

        // Steel rail main beam
        ctx.fillStyle = '#64748b';
        ctx.fillRect(roadLeft - 6, minY, 8, chunkSize);

        // Steel rail top metallic highlight
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(roadLeft - 4, minY, 3, chunkSize);

        // Support posts and amber hazard reflectors
        for (let y = Math.floor(minY / postSpacing) * postSpacing; y < minY + chunkSize + postSpacing; y += postSpacing) {
          // Post
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(roadLeft - 12, y, 14, 8);

          // Amber Reflector
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 4;
          ctx.fillRect(roadLeft - 2, y + 2, 3, 4);
          ctx.shadowBlur = 0;
        }
      }

      // RIGHT GUARDRAIL
      if (minX <= roadRight && minX + chunkSize >= roadRight) {
        // Inner shadow on asphalt
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(roadRight - 10, minY, 10, chunkSize);

        // Concrete curb base
        ctx.fillStyle = '#334155';
        ctx.fillRect(roadRight - 4, minY, 12, chunkSize);

        // Steel rail main beam
        ctx.fillStyle = '#64748b';
        ctx.fillRect(roadRight - 2, minY, 8, chunkSize);

        // Steel rail top metallic highlight
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(roadRight + 1, minY, 3, chunkSize);

        // Support posts and amber hazard reflectors
        for (let y = Math.floor(minY / postSpacing) * postSpacing; y < minY + chunkSize + postSpacing; y += postSpacing) {
          // Post
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(roadRight - 2, y, 14, 8);

          // Amber Reflector
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 4;
          ctx.fillRect(roadRight - 1, y + 2, 3, 4);
          ctx.shadowBlur = 0;
        }
      }
    }
  }
}
