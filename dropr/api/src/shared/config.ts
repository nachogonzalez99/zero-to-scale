import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export type Env = z.infer<typeof EnvSchema>;

/** Validates configuration. Fails at startup if anything is missing or invalid. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  return EnvSchema.parse(source);
}

/** The only place where environment variables are read. */
export const env = parseEnv(process.env);
