import { GAME_CONFIG } from '../game/GameConfig';

export class PlayerHealth {
  private currentHealth: number;
  private maxHealth: number;
  private invulnerabilityTimer: number = 0;
  private cooldownDuration: number;

  constructor() {
    this.maxHealth = GAME_CONFIG.PLAYER.MAX_HEALTH;
    this.currentHealth = this.maxHealth;
    this.cooldownDuration = GAME_CONFIG.PLAYER.COLLISION_COOLDOWN_SEC;
  }

  public update(dt: number): void {
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - dt);
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.invulnerabilityTimer > 0 || this.currentHealth <= 0) {
      return false; // Protected by collision cooldown
    }

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.invulnerabilityTimer = this.cooldownDuration;
    return true; // Damage successfully registered
  }

  public heal(amount: number): number {
    const previous = this.currentHealth;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    return this.currentHealth - previous;
  }

  public getHealth(): number {
    return this.currentHealth;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public isAlive(): boolean {
    return this.currentHealth > 0;
  }

  public isInvulnerable(): boolean {
    return this.invulnerabilityTimer > 0;
  }

  public reset(): void {
    this.currentHealth = this.maxHealth;
    this.invulnerabilityTimer = 0;
  }
}
