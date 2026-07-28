type CriticalErrorContext = {
  buyOrder?: string | null;
  error: unknown;
  path: string;
};

/**
 * Logs a stable, machine-readable event for failures that can affect payments
 * or a critical upstream dependency. Do not add tokens, card data, or payloads
 * to this event.
 */
export function logCriticalError({
  buyOrder,
  error,
  path,
}: CriticalErrorContext): void {
  const event = {
    level: "[CRITICAL_ERROR]",
    timestamp: new Date().toISOString(),
    path,
    error_message: getErrorMessage(error),
    ...(buyOrder ? { buyOrder } : {}),
  };

  console.error(JSON.stringify(event));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Error no serializable";
  }
}
