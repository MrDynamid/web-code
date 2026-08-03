// Lightweight client-side error reporting. This used to forward errors to the
// Lovable editor's telemetry; it now simply logs to the console so React error
// boundaries still surface useful detail in production.
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  // Loaders and server fns commonly throw a raw Response; String(it) is the
  // opaque "[object Response]", so pull out the status and URL instead.
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[app] Unhandled UI error:", message, {
    route: window.location.pathname,
    ...context,
  });
}
