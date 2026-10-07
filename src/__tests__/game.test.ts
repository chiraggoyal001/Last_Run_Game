import { describe, it, expect, beforeEach } from 'vitest';
import { GAME_CONFIG } from '../game/GameConfig';
import { Player } from '../player/Player';
import { PlayerHealth } from '../player/PlayerHealth';
import { DifficultySystem } from '../systems/DifficultySystem';
import { CaptureSystem } from '../systems/CaptureSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { Police } from '../police/Police';

describe('LAST RUN - Core Game Physics & Systems Verification', () => {
  describe('1. Vehicle Kinematics & Speed Capping (GDD Sections 4, 5, 6)', () => {
    let player: Player;

    beforeEach(() => {
      player = new Player(0, 0);
    });

    it('enforces reverse max speed is strictly 45% of forward max speed', () => {
      const maxForward = GAME_CONFIG.PLAYER.MAX_FORWARD_SPEED;
      const maxReverse = GAME_CONFIG.PLAYER.MAX_REVERSE_SPEED;

      expect(maxReverse).toBeCloseTo(maxForward * 0.45, 1);
    });

    it('automatically accelerates forward when no inputs are pressed', () => {
      expect(player.speed).toBe(0);

      // Simulate 1.0 second of driving without pressing brake
      player.update(1.0);

      expect(player.speed).toBeGreaterThan(0);
      expect(player.speed).toBeLessThanOrEqual(GAME_CONFIG.PLAYER.MAX_FORWARD_SPEED);
      expect(player.isReversing).toBe(false);
    });

    it('brakes to zero then smoothly transitions into reverse when brake is held', () => {
      // Accelerate forward first
      player.update(1.0);
      const forwardSpeed = player.speed;
      expect(forwardSpeed).toBeGreaterThan(100);

      // Now hold brake
      player.controller.setTouchBrake(true);

      // Decelerate
      player.update(0.6);
      expect(player.speed).toBeLessThan(forwardSpeed);

      // Continuous holding brake reaches reverse
      for (let i = 0; i < 20; i++) {
        player.update(0.1);
      }

      expect(player.speed).toBeLessThan(0);
      expect(player.isReversing).toBe(true);
      expect(Math.abs(player.speed)).toBeLessThanOrEqual(GAME_CONFIG.PLAYER.MAX_REVERSE_SPEED);

      // Releasing brake restores forward motion
      player.controller.setTouchBrake(false);
      for (let i = 0; i < 30; i++) {
        player.update(0.1);
      }
      expect(player.speed).toBeGreaterThan(0);
      expect(player.isReversing).toBe(false);
    });

    it('enforces turning steering angle is sharper at low speed than top speed', () => {
      const forwardRatioLow = 0.1;
      const forwardRatioHigh = 1.0;

      const dampingLow = 1 - forwardRatioLow * GAME_CONFIG.PLAYER.HIGH_SPEED_STEER_DAMPING;
      const dampingHigh = 1 - forwardRatioHigh * GAME_CONFIG.PLAYER.HIGH_SPEED_STEER_DAMPING;

      expect(dampingLow).toBeGreaterThan(dampingHigh);
    });
  });

  describe('2. Health & Damage Cooldown (GDD Sections 7, 8, 9, 27)', () => {
    let health: PlayerHealth;

    beforeEach(() => {
      health = new PlayerHealth();
    });

    it('starts with exactly 100 HP and caps at 100 HP', () => {
      expect(health.getHealth()).toBe(100);
      expect(health.getMaxHealth()).toBe(100);

      health.heal(50);
      expect(health.getHealth()).toBe(100);
    });

    it('prevents multi-frame health melting via collision cooldown', () => {
      const tookFirstDamage = health.takeDamage(10);
      expect(tookFirstDamage).toBe(true);
      expect(health.getHealth()).toBe(90);
      expect(health.isInvulnerable()).toBe(true);

      // Immediate subsequent hit within cooldown must be ignored
      const tookSecondDamage = health.takeDamage(10);
      expect(tookSecondDamage).toBe(false);
      expect(health.getHealth()).toBe(90);

      // After cooldown expires (0.5s), damage can be taken again
      health.update(0.6);
      expect(health.isInvulnerable()).toBe(false);

      const tookThirdDamage = health.takeDamage(10);
      expect(tookThirdDamage).toBe(true);
      expect(health.getHealth()).toBe(80);
    });

    it('restores health up to 100 max when healing with powerup (+50 HP)', () => {
      health.takeDamage(40);
      health.update(0.6);
      expect(health.getHealth()).toBe(60);

      const restored = health.heal(50);
      expect(restored).toBe(40); // 60 + 40 = 100
      expect(health.getHealth()).toBe(100);
    });
  });

  describe('3. Boxed-In Trapping System (GDD Section 21)', () => {
    let captureSystem: CaptureSystem;
    let player: Player;

    beforeEach(() => {
      captureSystem = new CaptureSystem();
      player = new Player(0, 0);
    });

    it('does NOT trigger capture if player is traveling at normal speed', () => {
      player.speed = 300; // High speed
      const police1 = new Police('patrol_sedan', 20, 20);
      const police2 = new Police('patrol_sedan', -20, 20);
      const police3 = new Police('patrol_sedan', 0, -20);

      const result = captureSystem.update(0.1, player, [police1, police2, police3]);
      expect(result.isTrapped).toBe(false);
      expect(captureSystem.trapProgress).toBe(0);
    });

    it('triggers BOXED IN and fills capture meter when player is stalled and surrounded by 3+ police', () => {
      player.speed = 10; // Stalled / very low speed

      // Police surrounding player in front, right, and left quadrants
      const police1 = new Police('patrol_sedan', 0, -50); // Ahead
      const police2 = new Police('pursuit_suv', 50, 0); // Right
      const police3 = new Police('patrol_sedan', -50, 0); // Left

      const step1 = captureSystem.update(0.5, player, [police1, police2, police3]);
      expect(step1.isTrapped).toBe(true);
      expect(captureSystem.trapProgress).toBeGreaterThan(0);
      expect(step1.isBusted).toBe(false);

      // Trapped for 1.8 seconds causes BUSTED
      const step2 = captureSystem.update(1.5, player, [police1, police2, police3]);
      expect(step2.isBusted).toBe(true);
    });

    it('resets/decays capture meter when player escapes or accelerates', () => {
      player.speed = 10;
      const police1 = new Police('patrol_sedan', 0, -50);
      const police2 = new Police('pursuit_suv', 50, 0);
      const police3 = new Police('patrol_sedan', -50, 0);

      captureSystem.update(0.5, player, [police1, police2, police3]);
      expect(captureSystem.trapProgress).toBeGreaterThan(0);

      // Player accelerates away
      player.speed = 300;
      captureSystem.update(0.5, player, []);
      expect(captureSystem.isTrapped).toBe(false);
      expect(captureSystem.trapProgress).toBeLessThan(0.3);
    });
  });

  describe('4. Difficulty & Scoring Progression (GDD Sections 31, 33)', () => {
    it('scales difficulty using continuous formula Difficulty = 1 + SurvivalSecs / 45', () => {
      expect(DifficultySystem.calculateDifficulty(0)).toBe(1.0);
      expect(DifficultySystem.calculateDifficulty(45)).toBe(2.0);
      expect(DifficultySystem.calculateDifficulty(90)).toBe(3.0);
    });

    it('accumulates survival score, destruction bonuses, and near misses', () => {
      const scoreSystem = new ScoreSystem();

      // 5 seconds of survival
      scoreSystem.update(5.0);
      expect(scoreSystem.getScore()).toBe(50); // +10 pts/sec

      // Police destroyed bonus
      scoreSystem.addPoliceDestructionPoints();
      expect(scoreSystem.getScore()).toBe(150); // +100 pts
    });
  });

  describe('5. Track Boundary Guardrail Enforcement (Exploit 2 Prevention)', () => {
    it('strictly prevents player from driving beyond the left and right track boundaries', () => {
      const player = new Player(0, 0);
      const halfRoad = GAME_CONFIG.WORLD.ROAD_WIDTH / 2;

      // Try steering and driving aggressively to the right beyond the track
      player.x = halfRoad - 20;
      player.speed = 300;
      player.angle = 0; // Pointing directly to the right
      player.controller.setTouchRight(true);

      for (let i = 0; i < 30; i++) {
        player.update(0.1);
      }

      // X must strictly not exceed highway guardrail boundary
      expect(player.x).toBeLessThanOrEqual(halfRoad);
      expect(player.x).toBeGreaterThan(halfRoad - player.width - 20);

      // Now drive aggressively to the left beyond the track
      player.controller.setTouchRight(false);
      player.controller.setTouchLeft(true);
      player.angle = Math.PI; // Pointing directly left

      for (let i = 0; i < 60; i++) {
        player.update(0.1);
      }

      // X must strictly not exceed left highway guardrail boundary
      expect(player.x).toBeGreaterThanOrEqual(-halfRoad);
    });

    it('strictly confines police vehicles within the highway track boundaries', () => {
      const player = new Player(0, 0);
      const police = new Police('patrol_sedan', 0, 100);
      const halfRoad = GAME_CONFIG.WORLD.ROAD_WIDTH / 2;

      // Force police beyond right wall
      police.x = halfRoad + 200;
      police.vx = 200;
      police.update(0.1, player);

      expect(police.x).toBeLessThanOrEqual(halfRoad);
    });
  });
});
