/**
 * Source of the current time. Domain code receives the time as a value; only the
 * HTTP layer reads it from a clock, so tests can fix it.
 */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();
