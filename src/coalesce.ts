/**
 * Coalesce a nullable value to a non-nullable value.
 */
export function c<T>(val: T | null, def: T): T {
  if (val === null) {
    return def;
  }
  return val;
}

/**
 * Coalesce a potentially undefined value to a non-undefined value.
 */
export function cu<T>(val: T | undefined, def: T): T {
  if (val === undefined) {
    return def;
  }
  return val;
}
