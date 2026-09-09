import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BreakTimer } from './timer';

describe('BreakTimer', () => {
  let now: number;

  beforeEach(() => {
    now = 0;
  });

  it('transitions from work to break and back after the configured durations', () => {
    const timer = new BreakTimer({ workSeconds: 10, breakSeconds: 5, now: () => now });
    timer.start();
    now = 10_000;
    timer.tick();
    expect(timer.snapshot()).toMatchObject({ mode: 'break', remainingSeconds: 5, totalFocusSeconds: 10 });

    now = 15_000;
    timer.tick();
    expect(timer.snapshot()).toMatchObject({ mode: 'work', completedBreaks: 1, remainingSeconds: 10 });
  });

  it('pauses without losing the remaining time', () => {
    const timer = new BreakTimer({ workSeconds: 60, now: () => now });
    timer.start();
    now = 17_500;
    timer.pause();
    expect(timer.snapshot()).toMatchObject({ mode: 'paused', remainingSeconds: 43 });

    now = 90_000;
    timer.start();
    timer.tick();
    expect(timer.snapshot()).toMatchObject({ mode: 'work', remainingSeconds: 43 });
  });

  it('records skipped breaks and starts a fresh work interval', () => {
    const timer = new BreakTimer({ workSeconds: 10, breakSeconds: 5, now: () => now });
    timer.startBreakNow();
    timer.skipBreak();
    expect(timer.snapshot()).toMatchObject({ mode: 'work', skippedBreaks: 1, remainingSeconds: 10 });
  });

  it('persists and restores paused state', () => {
    const timer = new BreakTimer({ workSeconds: 120, breakSeconds: 30, now: () => now });
    timer.start();
    now = 20_000;
    timer.pause();
    const restored = new BreakTimer({ now: () => now });
    restored.hydrate(timer.serialize());
    expect(restored.snapshot()).toMatchObject({ mode: 'paused', remainingSeconds: 100, workSeconds: 120, breakSeconds: 30 });
  });

  it('uses a real interval when running and clears it on destroy', () => {
    vi.useFakeTimers();
    const timer = new BreakTimer({ workSeconds: 10 });
    timer.start();
    vi.advanceTimersByTime(500);
    expect(timer.snapshot().mode).toBe('work');
    timer.destroy();
    vi.useRealTimers();
  });
});
