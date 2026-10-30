import { z } from 'zod';

export const AppEnvSchema = z.enum(['local', 'staging', 'production']);

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  /** Where the app runs. Not NODE_ENV, which says how libraries behave. */
  APP_ENV: AppEnvSchema.default('local'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  /** Set by the image build. */
  APP_VERSION: z.string().min(1).default('0.0.0-dev'),
  APP_COMMIT: z.string().min(1).default('unknown'),
  /** Time to keep serving after readiness turns off, so the platform stops routing here. */
  SHUTDOWN_DRAIN_MS: z.coerce.number().int().min(0).default(0),
  /** Time allowed for in-flight requests to finish before forcing the exit. */
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1).default(8000),
});

export type Env = z.infer<typeof EnvSchema>;

/** What is running and where. Reported by the health endpoints. */
export interface BuildInfo {
  version: string;
  commit: string;
  environment: z.infer<typeof AppEnvSchema>;
}

/** Validates configuration. Fails at startup if anything is missing or invalid. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  return EnvSchema.parse(source);
}

export function buildInfo(config: Env): BuildInfo {
  return { version: config.APP_VERSION, commit: config.APP_COMMIT, environment: config.APP_ENV };
}

/** The only place where environment variables are read. */
export const env = parseEnv(process.env);
