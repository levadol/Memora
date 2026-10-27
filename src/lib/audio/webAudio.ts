"use client";

import type { SoundSystem } from "./types";

// C major pentatonic, octaves 4–5
const BLOCK_FREQS = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 784.0];

class WebAudioSoundSystem implements SoundSystem {
  private ctx: AudioContext | null = null;
  private volume = 0.7;
  private muted = false;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  unlock(): void {
    const ctx = this.getCtx();
    if (ctx.state === "suspended") void ctx.resume();
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }

  setMuted(m: boolean): void {
    this.muted = m;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    gain = 0.18
  ): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(gain * this.volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.01);
  }

  playBlockTone(blockIndex: number): void {
    this.tone(BLOCK_FREQS[blockIndex % BLOCK_FREQS.length] ?? 440, 0.35);
  }

  playCorrect(): void {
    this.tone(523.25, 0.12);
    setTimeout(() => this.tone(659.25, 0.15), 100);
  }

  playIncorrect(): void {
    this.tone(220, 0.25, "sawtooth", 0.12);
  }

  playLevelUp(): void {
    [523.25, 659.25, 784.0].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.2), i * 120)
    );
  }

  playNewRecord(): void {
    [523.25, 659.25, 784.0, 1046.5].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.25), i * 100)
    );
  }

  playTap(): void {
    this.tone(880, 0.06, "sine", 0.1);
  }

  playTick(): void {
    this.tone(1047, 0.05, "sine", 0.08);
  }
}

export const soundSystem: SoundSystem = new WebAudioSoundSystem();
