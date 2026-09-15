import { describe, expect, it } from 'vitest';
import { shouldAutoStartTimer } from './startup';

describe('startup timer policy', () => {
  it('starts the timer for a background Tauri launch', () => {
    expect(shouldAutoStartTimer({ isTauri: true, isBackgroundLaunch: true })).toBe(true);
  });

  it('does not start a manually opened desktop app', () => {
    expect(shouldAutoStartTimer({ isTauri: true, isBackgroundLaunch: false })).toBe(false);
  });

  it('starts automatically in the browser preview', () => {
    expect(shouldAutoStartTimer({ isTauri: false, isBackgroundLaunch: false })).toBe(true);
  });
});
