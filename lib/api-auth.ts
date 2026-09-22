import { timingSafeEqual } from "crypto";

// Constant-time compare so a wrong secret can't be guessed by timing.
export function secretOk(provided: string | null, expected: string | undefined): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
