import { GameScene } from './GameScene';
import { PlayerController } from '../player/PlayerController';

export class GameManager {
  private static instance: GameManager | null = null;
  private scene: GameScene | null = null;

  private constructor() {
    // Connect controller global callbacks
    PlayerController.getInstance().setCallbacks(
      () => this.togglePause(),
      () => this.restartGame()
    );
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public attachCanvas(canvas: HTMLCanvasElement): void {
    if (this.scene) {
      this.scene.destroy();
    }
    this.scene = new GameScene(canvas);
  }

  public startGame(): void {
    if (this.scene) {
      this.scene.start();
    }
  }

  public togglePause(): void {
    if (this.scene) {
      this.scene.pause();
    }
  }

  public restartGame(): void {
    if (this.scene) {
      this.scene.start();
    }
  }

  public getScene(): GameScene | null {
    return this.scene;
  }

  public destroy(): void {
    if (this.scene) {
      this.scene.destroy();
      this.scene = null;
    }
  }
}
