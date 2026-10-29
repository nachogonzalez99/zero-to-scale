import { STATUS_CODES } from 'node:http';
import type { FastifyError, FastifyInstance, FastifyReply } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod';
import { DomainError, type DomainErrorCode } from './errors.ts';
import { PROBLEM_CONTENT_TYPE, type Problem } from './problem.ts';

const DOMAIN_ERROR_STATUS: Record<DomainErrorCode, number> = {
  ZONE_NOT_FOUND: 404,
  ZONE_NOT_COVERED: 422,
  DISTANCE_EXCEEDED: 422,
  INVALID_DELIVERY_TIME: 422,
};

/** Codes for client errors raised by the framework itself (bad JSON, wrong content type…). */
const CLIENT_ERROR_CODES: Record<number, string> = {
  400: 'MALFORMED_REQUEST',
  404: 'NOT_FOUND',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
};

function problem(
  status: number,
  code: string,
  detail: string,
  errors?: Problem['errors'],
): Problem {
  return {
    type: 'about:blank',
    title: STATUS_CODES[status] ?? 'Error',
    status,
    code,
    detail,
    ...(errors ? { errors } : {}),
  };
}

function sendProblem(reply: FastifyReply, body: Problem): FastifyReply {
  return reply.code(body.status).type(PROBLEM_CONTENT_TYPE).send(body);
}

function toPath(context: string | undefined, instancePath: string): string {
  const segments = instancePath.split('/').filter(Boolean);
  return [context ?? 'request', ...segments].join('.');
}

/**
 * Every error leaves the API as an RFC 9457 Problem with a stable `code`.
 * Internal details are logged, never sent to the client.
 */
export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      const errors = error.validation.map((issue) => ({
        path: toPath(error.validationContext, issue.instancePath),
        message: issue.message ?? 'Invalid value',
      }));
      return sendProblem(
        reply,
        problem(400, 'VALIDATION_ERROR', 'The request does not match the expected format.', errors),
      );
    }

    if (error instanceof DomainError) {
      return sendProblem(
        reply,
        problem(DOMAIN_ERROR_STATUS[error.code], error.code, error.message),
      );
    }

    if (isResponseSerializationError(error)) {
      request.log.error({ err: error }, 'Response does not match its schema');
      return sendProblem(reply, problem(500, 'INTERNAL_ERROR', 'An unexpected error occurred.'));
    }

    const status = error.statusCode ?? 500;
    if (status >= 400 && status < 500) {
      return sendProblem(
        reply,
        problem(status, CLIENT_ERROR_CODES[status] ?? 'CLIENT_ERROR', error.message),
      );
    }

    request.log.error({ err: error }, 'Unhandled error');
    return sendProblem(reply, problem(500, 'INTERNAL_ERROR', 'An unexpected error occurred.'));
  });

  app.setNotFoundHandler((request, reply) =>
    sendProblem(
      reply,
      problem(404, 'NOT_FOUND', `Route ${request.method} ${request.url} does not exist.`),
    ),
  );
}
