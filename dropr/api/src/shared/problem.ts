import { z } from 'zod';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

export const ProblemSchema = z
  .object({
    type: z.string().describe('Problem type. Always `about:blank`: `code` identifies the error.'),
    title: z.string().describe('HTTP status phrase.'),
    status: z.number().int().describe('HTTP status code.'),
    code: z.string().describe('Stable, machine-readable error code.'),
    detail: z.string().optional().describe('Human-readable explanation of this occurrence.'),
    errors: z
      .array(
        z.object({
          path: z.string().describe('Location of the invalid value, e.g. `body.pickup.lat`.'),
          message: z.string(),
        }),
      )
      .optional()
      .describe('Individual validation errors. Only for `VALIDATION_ERROR`.'),
  })
  .meta({ id: 'Problem', description: 'Error response (RFC 9457 Problem Details).' });

export type Problem = z.infer<typeof ProblemSchema>;
