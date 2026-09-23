import { createHash } from "crypto";
import { secretOk } from "@/lib/api-auth";

type Operator = { id: string; tokenHash: string };
export function operationsCredentials(): Operator[] {
  let raw: unknown;
  try { raw = JSON.parse(process.env.OPERATIONS_TOKENS ?? "[]"); } catch { return []; }
  if (!Array.isArray(raw) || !raw.length) return [];
  const seenIds = new Set<string>();
  const seenHashes = new Set<string>();
  const result: Operator[] = [];
  for (const item of raw) {
    if (!item || typeof item.id !== "string" || !item.id.trim() || item.id.length > 120 ||
      typeof item.tokenHash !== "string" || !/^[a-f0-9]{64}$/.test(item.tokenHash) || seenIds.has(item.id) || seenHashes.has(item.tokenHash)) return [];
    seenIds.add(item.id); seenHashes.add(item.tokenHash);
    result.push({ id: item.id, tokenHash: item.tokenHash });
  }
  return result;
}
// Each credential belongs to one configured principal. Caller-supplied names
// never participate in authorization or audit attribution.
export function authenticateOperator(headers: Headers): string | null {
  const token = headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || token.length < 32 || token.length > 256) return null;
  const hash = createHash("sha256").update(token).digest("hex");
  return operationsCredentials().find((operator) => secretOk(hash, operator.tokenHash))?.id ?? null;
}
