import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { systemClock } from '../src/shared/clock.ts';
import { parseEnv } from '../src/shared/config.ts';

describe('parseEnv', () => {
  it('applies defaults', () => {
    expect(parseEnv({})).toEqual({ PORT: 3000 });
  });

  it('coerces values from strings', () => {
    expect(parseEnv({ PORT: '8080' })).toEqual({ PORT: 8080 });
  });

  it('fails fast on invalid values', () => {
    expect(() => parseEnv({ PORT: 'eighty' })).toThrow(ZodError);
    expect(() => parseEnv({ PORT: '70000' })).toThrow(ZodError);
  });
});

describe('systemClock', () => {
  it('returns the current time', () => {
    const before = Date.now();
    const now = systemClock().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});
