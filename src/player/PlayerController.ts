export interface ControlInputs {
  steerLeft: boolean;
  steerRight: boolean;
  brake: boolean;
}

export class PlayerController {
  private static instance: PlayerController | null = null;

  // Keyboard state
  private keyLeft: boolean = false;
  private keyRight: boolean = false;
  private keyBrake: boolean = false;

  // Touch / Virtual state
  private touchLeft: boolean = false;
  private touchRight: boolean = false;
  private touchBrake: boolean = false;

  // Pause / Restart callbacks
  private onPauseToggle?: () => void;
  private onRestartTrigger?: () => void;

  private isBound: boolean = false;

  private constructor() {
    this.bindKeyboardEvents();
  }

  public static getInstance(): PlayerController {
    if (!PlayerController.instance) {
      PlayerController.instance = new PlayerController();
    }
    return PlayerController.instance;
  }

  public setCallbacks(onPauseToggle: () => void, onRestartTrigger: () => void): void {
    this.onPauseToggle = onPauseToggle;
    this.onRestartTrigger = onRestartTrigger;
  }

  private bindKeyboardEvents(): void {
    if (this.isBound || typeof window === 'undefined') return;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          this.keyLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keyRight = true;
          break;
        case 'Space':
        case 'KeyS':
        case 'ArrowDown':
          this.keyBrake = true;
          break;
        case 'KeyP':
        case 'Escape':
          this.onPauseToggle?.();
          break;
        case 'KeyR':
          this.onRestartTrigger?.();
          break;
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          this.keyLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keyRight = false;
          break;
        case 'Space':
        case 'KeyS':
        case 'ArrowDown':
          this.keyBrake = false;
          break;
      }
    });

    this.isBound = true;
  }

  // Touch setters invoked by on-screen touch overlay
  public setTouchLeft(pressed: boolean): void {
    this.touchLeft = pressed;
  }

  public setTouchRight(pressed: boolean): void {
    this.touchRight = pressed;
  }

  public setTouchBrake(pressed: boolean): void {
    this.touchBrake = pressed;
  }

  public getInputs(): ControlInputs {
    return {
      steerLeft: this.keyLeft || this.touchLeft,
      steerRight: this.keyRight || this.touchRight,
      brake: this.keyBrake || this.touchBrake
    };
  }

  public reset(): void {
    this.keyLeft = false;
    this.keyRight = false;
    this.keyBrake = false;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchBrake = false;
  }
}
