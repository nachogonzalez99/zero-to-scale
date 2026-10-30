import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { systemClock } from '../src/shared/clock.ts';
import { buildInfo, parseEnv } from '../src/shared/config.ts';

describe('parseEnv', () => {
  it('applies local development defaults', () => {
    expect(parseEnv({})).toEqual({
      PORT: 3000,
      APP_ENV: 'local',
      LOG_LEVEL: 'info',
      APP_VERSION: '0.0.0-dev',
      APP_COMMIT: 'unknown',
      SHUTDOWN_DRAIN_MS: 0,
      SHUTDOWN_TIMEOUT_MS: 8000,
    });
  });

  it('coerces values from strings', () => {
    expect(parseEnv({ PORT: '8080', SHUTDOWN_DRAIN_MS: '5000' })).toMatchObject({
      PORT: 8080,
      SHUTDOWN_DRAIN_MS: 5000,
    });
  });

  it('fails fast on invalid values', () => {
    expect(() => parseEnv({ PORT: 'eighty' })).toThrow(ZodError);
    expect(() => parseEnv({ PORT: '70000' })).toThrow(ZodError);
    expect(() => parseEnv({ APP_ENV: 'prod' })).toThrow(ZodError);
    expect(() => parseEnv({ LOG_LEVEL: 'verbose' })).toThrow(ZodError);
  });
});

describe('buildInfo', () => {
  it('takes what is running and where from the configuration', () => {
    const config = parseEnv({ APP_ENV: 'production', APP_VERSION: '1.0.0', APP_COMMIT: 'abc' });
    expect(buildInfo(config)).toEqual({
      version: '1.0.0',
      commit: 'abc',
      environment: 'production',
    });
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
