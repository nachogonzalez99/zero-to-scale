import { z } from 'zod';

export const Problem = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    code: z.string(),
    detail: z.string().optional(),
  })
  .meta({ id: 'Problem', description: 'Error response (RFC 9457)' });

export type Problem = z.infer<typeof Problem>;
