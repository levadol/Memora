export interface SoundSystem {
  playBlockTone(blockIndex: number): void;
  playCorrect(): void;
  playIncorrect(): void;
  playLevelUp(): void;
  playNewRecord(): void;
  playTap(): void;
  playTick(): void;
  unlock(): void;
  setVolume(v: number): void;
  setMuted(m: boolean): void;
}
