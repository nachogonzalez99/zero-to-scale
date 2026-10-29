import type { z } from 'zod';
import { PROBLEM_CONTENT_TYPE, ProblemSchema } from './problem.ts';

/** Successful JSON response, with its own description in the contract. */
export function jsonResponse<T extends z.ZodType>(description: string, schema: T) {
  return { description, content: { 'application/json': { schema } } } as const;
}

/** Error response, documented as `application/problem+json`. */
export function problemResponse(description: string) {
  return {
    description,
    content: { [PROBLEM_CONTENT_TYPE]: { schema: ProblemSchema } },
  } as const;
}

/** Error responses every route can return. */
export const commonErrorResponses = {
  401: problemResponse('Missing or invalid API key.'),
  500: problemResponse('Unexpected server error.'),
} as const;
