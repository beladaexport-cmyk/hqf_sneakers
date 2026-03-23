/**
 * Recursively removes all undefined values from an object before writing to Firestore.
 * Firebase rejects undefined field values, so this ensures all data is safe to write.
 */
export function sanitizeForFirestore<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [
        k,
        v !== null && typeof v === 'object' && !Array.isArray(v)
          ? sanitizeForFirestore(v as Record<string, unknown>)
          : v,
      ])
  ) as T;
}
