/**
 * Safely converts any thrown value to a readable string.
 * The ADO SDK and REST clients sometimes throw plain objects rather than Error instances.
 */

export function serializeError(err: unknown): string {
  if (err == null) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.toString();
  try {
    // Plain objects from the ADO REST client often look like { status, message, ... }
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.responseText === "string") return obj.responseText;
    return JSON.stringify(err);
  } catch {
    return Object.prototype.toString.call(err);
  }
}
