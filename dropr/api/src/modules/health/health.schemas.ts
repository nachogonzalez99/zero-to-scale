import { z } from 'zod';
import { AppEnvSchema } from '../../shared/config.ts';

export const HealthSchema = z.object({
  status: z.enum(['ok', 'shutting_down']),
  version: z.string(),
  commit: z.string(),
  environment: AppEnvSchema,
});
