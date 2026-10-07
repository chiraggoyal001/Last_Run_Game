/**
 * SoundManager — Procedural Web Audio API Sound System
 * Synthesizes all sounds in real-time without external audio asset downloads.
 * Features:
 * - Dynamic spatial police siren modulated by distance and swarm size
 * - Velocity-linked engine rumble
 * - Heavy impacts, explosions, near-miss whooshes, health chimes
 * - Web Audio unlock on first user interaction gesture
 */
export class SoundManager {
  private static instance: SoundManager | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  // Engine Audio Nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Dynamic Siren Nodes
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private sirenLfoGain: GainNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenActive: boolean = false;

  // Boxed-In Alarm State
  private isAlarmPlaying: boolean = false;

  private constructor() {
    // Lazy initialization on first user gesture
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public unlockAudio(): void {
    if (this.isInitialized && this.ctx && this.ctx.state === 'running') {
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();

        // Master Limiter / Compressor to prevent any clipping distortion
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.setValueAtTime(-3, this.ctx.currentTime);
        this.limiter.knee.setValueAtTime(6, this.ctx.currentTime);
        this.limiter.ratio.setValueAtTime(12, this.ctx.currentTime);
        this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.limiter.release.setValueAtTime(0.1, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);

        this.masterGain.connect(this.limiter);
        this.limiter.connect(this.ctx.destination);

        this.initEngineLoop();
        this.initSirenLoop();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isInitialized = true;
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // -------------------------------------------------------------
  // CONTINUOUS ENGINE RUMBLE
  // -------------------------------------------------------------
  private initEngineLoop(): void {
    if (!this.ctx || !this.masterGain) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineFilter = this.ctx.createBiquadFilter();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      this.engineSubOsc.type = 'triangle';
      this.engineSubOsc.frequency.setValueAtTime(28, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(220, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc.start();
      this.engineSubOsc.start();
    } catch {
      // Audio graph error
    }
  }

  /**
   * Update engine pitch and filter cutoff based on vehicle forward speed & reverse state
   */
  public updateEngineSound(speedRatio: number, isReversing: boolean): void {
    if (!this.ctx || !this.engineOsc || !this.engineSubOsc || !this.engineFilter) return;

    const baseFreq = isReversing ? 40 : 45;
    const maxFreq = isReversing ? 90 : 160;
    const targetFreq = baseFreq + (maxFreq - baseFreq) * Math.abs(speedRatio);

    const now = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(200 + Math.abs(speedRatio) * 600, now, 0.08);
  }

  // -------------------------------------------------------------
  // DYNAMIC POLICE SIREN (Proximity & Density Sensitive)
  // -------------------------------------------------------------
  private initSirenLoop(): void {
    if (!this.ctx || !this.masterGain) return;

    try {
      this.sirenOsc1 = this.ctx.createOscillator();
      this.sirenOsc2 = this.ctx.createOscillator();
      this.sirenLfo = this.ctx.createOscillator();
      this.sirenLfoGain = this.ctx.createGain();
      this.sirenGain = this.ctx.createGain();

      this.sirenOsc1.type = 'triangle';
      this.sirenOsc1.frequency.setValueAtTime(750, this.ctx.currentTime);

      this.sirenOsc2.type = 'sawtooth';
      this.sirenOsc2.frequency.setValueAtTime(755, this.ctx.currentTime); // Slight detune chorus

      this.sirenLfo.type = 'sine';
      this.sirenLfo.frequency.setValueAtTime(1.8, this.ctx.currentTime); // 1.8 Hz wail

      this.sirenLfoGain.gain.setValueAtTime(320, this.ctx.currentTime); // Pitch sweep range

      this.sirenLfo.connect(this.sirenLfoGain);
      this.sirenLfoGain.connect(this.sirenOsc1.frequency);
      this.sirenLfoGain.connect(this.sirenOsc2.frequency);

      // Muffled filter for distance realism
      const sirenFilter = this.ctx.createBiquadFilter();
      sirenFilter.type = 'lowpass';
      sirenFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);

      this.sirenGain.gain.setValueAtTime(0, this.ctx.currentTime); // Start silent

      this.sirenOsc1.connect(sirenFilter);
      this.sirenOsc2.connect(sirenFilter);
      sirenFilter.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);

      this.sirenOsc1.start();
      this.sirenOsc2.start();
      this.sirenLfo.start();
      this.sirenActive = true;
    } catch {
      // Siren init failed
    }
  }

  /**
   * Modulate dynamic siren volume and wail tempo according to nearest police distance and active count
   * @param nearestDistance Distance in pixels to closest police car
   * @param activePoliceCount Number of police in chase
   * @param isTrapped Whether player is currently boxed in
   */
  public updateSiren(nearestDistance: number, activePoliceCount: number, isTrapped: boolean): void {
    if (!this.ctx || !this.sirenGain || !this.sirenLfo || !this.sirenActive) return;

    const now = this.ctx.currentTime;

    if (activePoliceCount === 0 || nearestDistance > 850) {
      // Fade out
      this.sirenGain.gain.setTargetAtTime(0, now, 0.2);
      return;
    }

    // Proximity factor: 0.0 (far away > 750px) to 1.0 (right on bumper < 100px)
    const proximity = Math.max(0, Math.min(1, 1 - (nearestDistance - 80) / 670));

    // Swarm bonus: more cars = slightly higher ceiling volume
    const swarmBonus = Math.min(0.2, (activePoliceCount - 1) * 0.05);
    const targetVolume = Math.min(0.35, (0.05 + proximity * 0.25 + swarmBonus));

    this.sirenGain.gain.setTargetAtTime(targetVolume, now, 0.1);

    // Fast urgent yelp when very close or boxed in (up to 4.5Hz)
    const lfoFreq = isTrapped ? 4.5 : 1.6 + proximity * 2.2;
    this.sirenLfo.frequency.setTargetAtTime(lfoFreq, now, 0.15);
  }

  // -------------------------------------------------------------
  // ONE-SHOT SOUND EFFECTS
  // -------------------------------------------------------------

  /**
   * Impact / Collision Thud
   */
  public playCollisionSound(intensity: number = 1.0): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 * intensity, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

      gain.gain.setValueAtTime(0.4 * Math.min(1.2, intensity), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.25);

      // Noise punch for crunch
      this.playNoiseBurst(0.12, 0.25 * intensity, 400);
    } catch {
      // Audio error
    }
  }

  /**
   * Tire Screech / Drift Squeal
   */
  public playTireSkidSound(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.playNoiseBurst(0.15, 0.18, 1800);
  }

  /**
   * Police Vehicle Explosion
   */
  public playExplosionSound(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;

      // Heavy sub bass thud
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(90, now);
      subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.45);

      subGain.gain.setValueAtTime(0.7, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 0.55);

      // Debris explosion noise rumble
      this.playNoiseBurst(0.65, 0.45, 600);
    } catch {
      // Audio error
    }
  }

  /**
   * Health Pickup Chime (+50 HP)
   */
  public playHealthPickupSound(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.28, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    } catch {
      // Audio error
    }
  }

  /**
   * Near Miss Whistle / Zing (+25 pts)
   */
  public playNearMissSound(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Audio error
    }
  }

  /**
   * Boxed In Warning Pulse
   */
  public playBoxedInWarning(): void {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isAlarmPlaying) return;

    try {
      this.isAlarmPlaying = true;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.15);

      setTimeout(() => {
        this.isAlarmPlaying = false;
      }, 200);
    } catch {
      this.isAlarmPlaying = false;
    }
  }

  /**
   * Game Over Busted Tone
   */
  public playGameOverSound(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const chordFrequencies = [220, 174.61, 146.83, 110]; // Minor descending doom

      chordFrequencies.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.75, now + idx * 0.18 + 0.8);

        gain.gain.setValueAtTime(0.3, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 1.3);
      });
    } catch {
      // Audio error
    }
  }

  /**
   * Helper: White Noise Generator with bandpass filter
   */
  private playNoiseBurst(duration: number, volume: number, cutoffFreq: number): void {
    if (!this.ctx || !this.masterGain) return;

    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoffFreq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      whiteNoise.start(this.ctx.currentTime);
    } catch {
      // Audio error
    }
  }

  public stopAll(): void {
    if (this.sirenGain && this.ctx) {
      this.sirenGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public resumeLoops(): void {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    }
  }
}
