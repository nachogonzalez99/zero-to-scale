/** Whether the app should receive traffic. Turns off for good when shutdown starts. */
export interface Readiness {
  isReady: () => boolean;
  markShuttingDown: () => void;
}

export function createReadiness(): Readiness {
  let ready = true;
  return {
    isReady: () => ready,
    markShuttingDown: () => {
      ready = false;
    },
  };
}
