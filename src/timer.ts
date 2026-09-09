export type TimerMode = 'idle' | 'work' | 'break' | 'paused';

export type TimerSnapshot = {
  mode: TimerMode;
  activeMode: 'work' | 'break';
  remainingSeconds: number;
  workSeconds: number;
  breakSeconds: number;
  completedBreaks: number;
  skippedBreaks: number;
  totalFocusSeconds: number;
};

type PersistedTimer = TimerSnapshot & { savedAt: number };

export type TimerOptions = {
  workSeconds?: number;
  breakSeconds?: number;
  now?: () => number;
};

const clampDuration = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), 5), 8 * 60 * 60);
};

export class BreakTimer {
  private mode: TimerMode = 'idle';
  private activeMode: 'work' | 'break' = 'work';
  private remainingMs: number;
  private lastTickAt = 0;
  private readonly now: () => number;
  private listeners = new Set<(snapshot: TimerSnapshot) => void>();
  private completedBreaks = 0;
  private skippedBreaks = 0;
  private totalFocusSeconds = 0;
  private focusRemainderMs = 0;
  private tickHandle: ReturnType<typeof setInterval> | undefined;
  private workSeconds: number;
  private breakSeconds: number;

  constructor(options: TimerOptions = {}) {
    this.workSeconds = clampDuration(options.workSeconds ?? 60 * 60, 60 * 60);
    this.breakSeconds = clampDuration(options.breakSeconds ?? 5 * 60, 5 * 60);
    this.remainingMs = this.workSeconds * 1000;
    this.now = options.now ?? (() => Date.now());
  }

  subscribe(listener: (snapshot: TimerSnapshot) => void) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot(): TimerSnapshot {
    return {
      mode: this.mode,
      activeMode: this.activeMode,
      remainingSeconds: Math.max(0, Math.ceil(this.remainingMs / 1000)),
      workSeconds: this.workSeconds,
      breakSeconds: this.breakSeconds,
      completedBreaks: this.completedBreaks,
      skippedBreaks: this.skippedBreaks,
      totalFocusSeconds: this.totalFocusSeconds,
    };
  }

  start() {
    if (this.mode === 'work' || this.mode === 'break') return;
    this.mode = this.mode === 'paused' ? this.activeMode : 'work';
    this.activeMode = this.mode;
    this.lastTickAt = this.now();
    this.ensureTicker();
    this.emit();
  }

  pause() {
    if (this.mode !== 'work' && this.mode !== 'break') return;
    this.tick(this.now());
    this.mode = 'paused';
    this.stopTicker();
    this.emit();
  }

  reset() {
    this.stopTicker();
    this.mode = 'idle';
    this.activeMode = 'work';
    this.remainingMs = this.workSeconds * 1000;
    this.emit();
  }

  startBreakNow() {
    this.mode = 'break';
    this.activeMode = 'break';
    this.remainingMs = this.breakSeconds * 1000;
    this.lastTickAt = this.now();
    this.ensureTicker();
    this.emit();
  }

  skipBreak() {
    if (this.mode !== 'break' && !(this.mode === 'paused' && this.activeMode === 'break')) return;
    this.skippedBreaks += 1;
    this.mode = 'work';
    this.activeMode = 'work';
    this.remainingMs = this.workSeconds * 1000;
    this.lastTickAt = this.now();
    this.ensureTicker();
    this.emit();
  }

  setDurations(workSeconds: number, breakSeconds: number) {
    this.workSeconds = clampDuration(workSeconds, this.workSeconds);
    this.breakSeconds = clampDuration(breakSeconds, this.breakSeconds);
    if (this.mode === 'idle') this.remainingMs = this.workSeconds * 1000;
    this.emit();
  }

  hydrate(value: Partial<PersistedTimer>) {
    this.workSeconds = clampDuration(value.workSeconds ?? this.workSeconds, this.workSeconds);
    this.breakSeconds = clampDuration(value.breakSeconds ?? this.breakSeconds, this.breakSeconds);
    this.completedBreaks = Math.max(0, value.completedBreaks ?? 0);
    this.skippedBreaks = Math.max(0, value.skippedBreaks ?? 0);
    this.totalFocusSeconds = Math.max(0, value.totalFocusSeconds ?? 0);
    this.focusRemainderMs = 0;
    this.activeMode = value.activeMode === 'break' ? 'break' : 'work';
    this.mode = value.mode === 'work' || value.mode === 'break' || value.mode === 'paused' ? value.mode : 'idle';
    const savedRemaining = Math.max(0, value.remainingSeconds ?? this.workSeconds);
    this.remainingMs = savedRemaining * 1000;
    if (this.mode === 'work' || this.mode === 'break') {
      this.mode = 'paused';
    }
    this.emit();
  }

  serialize(): PersistedTimer {
    return { ...this.snapshot(), savedAt: Date.now() };
  }

  tick(now = this.now()) {
    if (this.mode !== 'work' && this.mode !== 'break') return;
    const elapsedMs = Math.max(0, now - this.lastTickAt);
    if (elapsedMs === 0) return;
    this.lastTickAt = now;
    if (this.mode === 'work') {
      this.focusRemainderMs += elapsedMs;
      this.totalFocusSeconds += Math.floor(this.focusRemainderMs / 1000);
      this.focusRemainderMs %= 1000;
    }
    this.remainingMs -= elapsedMs;

    if (this.remainingMs > 0) {
      this.emit();
      return;
    }

    if (this.mode === 'work') {
      this.mode = 'break';
      this.activeMode = 'break';
      this.remainingMs = this.breakSeconds * 1000;
      this.emit();
      return;
    }

    this.completedBreaks += 1;
    this.mode = 'work';
    this.activeMode = 'work';
    this.remainingMs = this.workSeconds * 1000;
    this.emit();
  }

  destroy() {
    this.stopTicker();
    this.listeners.clear();
  }

  private ensureTicker() {
    if (this.tickHandle) return;
    this.tickHandle = setInterval(() => this.tick(), 250);
  }

  private stopTicker() {
    if (!this.tickHandle) return;
    clearInterval(this.tickHandle);
    this.tickHandle = undefined;
  }

  private emit() {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
