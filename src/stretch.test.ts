import { describe, expect, it } from 'vitest';
import { stretchFrame } from './stretch';

describe('stretch playback timing', () => {
  it('moves slowly, holds for five seconds, then returns', () => {
    expect(stretchFrame(0).amount).toBe(0);
    expect(stretchFrame(3000)).toMatchObject({ amount: 1, cue: 1 });
    expect(stretchFrame(7999).amount).toBe(1);
    expect(stretchFrame(11000)).toMatchObject({ amount: 0, direction: 1, cue: 3 });
  });
  it('cycles through all three groups and starts again', () => {
    expect([0, 44000, 88000, 132000].map(t => stretchFrame(t).index)).toEqual([0, 1, 2, 0]);
    expect(stretchFrame(43999).remaining).toBe(1);
  });
});
