export type EmailInput = { to: string; subject: string; html: string };

export type DeliveryResult =
  | { ok: true; id: string | null; skipped?: boolean }
  | { ok: false; error: string; retryable: boolean };

// Talks to Resend once. Callers are the job worker, never a request handler: an
// email is first stored as a job in the same transaction as the record it
// belongs to, and this function is retried from there until it is accepted.
// The idempotency key is the job's dedupe key, so a retry after a timeout does
// not deliver twice within Resend's 24-hour idempotency window.
export async function deliverEmail(input: EmailInput, idempotencyKey: string): Promise<DeliveryResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    console.warn("[email] RESEND_API_KEY/RESEND_FROM unset; skipped:", input.subject);
    return { ok: true, id: null, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ from, ...input }),
    });
    if (!res.ok) {
      const text = await res.text();
      // 4xx other than rate limiting is a bad request that will never succeed.
      const retryable = res.status === 429 || res.status >= 500;
      return { ok: false, error: `resend ${res.status}: ${text.slice(0, 500)}`, retryable };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: unknown };
    return { ok: true, id: typeof data.id === "string" ? data.id : null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), retryable: true };
  }
}
