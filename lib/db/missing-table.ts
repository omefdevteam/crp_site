// Postgres "undefined_table" (42P01): a table that a migration adds is not in
// this database yet. Drivers sometimes wrap the error, so causes are followed.
export function isMissingTable(err: unknown): boolean {
  for (let current: unknown = err, depth = 0; current && depth < 5; depth++) {
    const record = current as { code?: unknown; cause?: unknown };
    if (record.code === "42P01") return true;
    current = record.cause;
  }
  return false;
}
