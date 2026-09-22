import { createHmac, timingSafeEqual } from "crypto";

// Identity verification is provider-agnostic. Everything downstream (the
// webhook route, the applicant status flow) talks to this interface, so the
// provider is swapped by the IDENTITY_PROVIDER env var alone, no code change.

export type IdentityDecision = "approved" | "declined" | "review" | "pending";

export type IdentityEvent = {
  reference: string | null; // our applicant id, sent as the provider's vendor tag
  sessionId: string | null;
  decision: IdentityDecision;
  // When the provider says this happened. Used to ignore an older delivery that
  // arrives after a newer one; null when the payload carries no timestamp.
  occurredAt: Date | null;
  // The provider's own id for this delivery, if it sends one.
  eventId: string | null;
};

export interface IdentityProvider {
  readonly name: string;
  // Create a hosted verification session and return the link to send the
  // applicant. Best-effort: returns null when the provider is not configured.
  createSession(
    applicantId: string,
    callbackUrl: string,
  ): Promise<{ sessionId: string; url: string } | null>;
  // Confirm a webhook came from the provider, checked against the raw body.
  verify(rawBody: string, headers: Headers): boolean;
  // Normalize a verified webhook body into one shape.
  parse(body: unknown, headers?: Headers): IdentityEvent;
}

const asString = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;

function asDate(v: unknown): Date | null {
  if (typeof v === "number" && Number.isFinite(v)) return new Date(v < 1e12 ? v * 1000 : v);
  if (typeof v === "string" && v) {
    const n = Number(v);
    if (Number.isFinite(n)) return asDate(n);
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : new Date(t);
  }
  return null;
}

// Constant-time compare of two hex signatures, false on any length mismatch.
function hexEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// --- Didit (https://didit.me) -------------------------------------------------

const didit: IdentityProvider = {
  name: "didit",

  async createSession(applicantId, callbackUrl) {
    const apiKey = process.env.DIDIT_API_KEY;
    const workflowId = process.env.DIDIT_WORKFLOW_ID;
    if (!apiKey || !workflowId) {
      console.warn("[identity] Didit not configured; no session created");
      return null;
    }
    try {
      const res = await fetch("https://verification.didit.me/v3/session/", {
        method: "POST",
        headers: { "x-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          workflow_id: workflowId,
          vendor_data: applicantId,
          callback: callbackUrl,
        }),
      });
      if (!res.ok) {
        console.warn("[identity] Didit session create failed", res.status);
        return null;
      }
      const data = (await res.json()) as Record<string, unknown>;
      // v3 returns `url` + `session_id`; accept `session_url` too, just in case.
      const url = asString(data.url) ?? asString(data.session_url);
      const sessionId = asString(data.session_id) ?? asString(data.id);
      if (!url || !sessionId) {
        console.warn(
          "[identity] Didit response missing url/session_id; keys:",
          Object.keys(data).join(","),
        );
        return null;
      }
      return { sessionId, url };
    } catch (err) {
      console.warn("[identity] Didit session create threw", err);
      return null;
    }
  },

  verify(rawBody, headers) {
    const secret = process.env.DIDIT_WEBHOOK_SECRET;
    const signature = headers.get("x-signature");
    if (!secret || !signature) return false;

    // Reject stale deliveries (replay guard) when a timestamp is present.
    const ts = Number(headers.get("x-timestamp"));
    if (Number.isFinite(ts)) {
      const skewSeconds = Math.abs(Date.now() / 1000 - ts);
      if (skewSeconds > 300) return false;
    }

    const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    return hexEqual(signature, expected);
  },

  parse(body, headers) {
    const b = (body ?? {}) as Record<string, unknown>;
    const status = asString(b.status)?.toLowerCase() ?? "";
    const decision: IdentityDecision =
      status === "approved"
        ? "approved"
        : status === "declined"
          ? "declined"
          : status.includes("review")
            ? "review"
            : "pending";
    const occurredAt =
      asDate(b.timestamp) ?? asDate(b.created_at) ?? asDate(headers?.get("x-timestamp") ?? null);
    return {
      reference: asString(b.vendor_data),
      sessionId: asString(b.session_id),
      decision,
      occurredAt,
      eventId: asString(b.webhook_id) ?? asString(b.event_id) ?? asString(b.id),
    };
  },
};

// --- Smile ID (https://usesmileid.com) ---------------------------------------
// Adapter seam. Smile ID signs callbacks with a partner-id + timestamp scheme
// and creates sessions via Smile Links, so fill these three methods against the
// Smile ID sandbox when IDENTITY_PROVIDER=smileid is wanted. Until then the
// verify() default rejects, so no unverified webhook is ever processed.
const smileId: IdentityProvider = {
  name: "smileid",
  async createSession() {
    console.warn("[identity] SmileID adapter not implemented");
    return null;
  },
  verify() {
    return false;
  },
  parse() {
    return { reference: null, sessionId: null, decision: "pending", occurredAt: null, eventId: null };
  },
};

const providers: Record<string, IdentityProvider> = { didit, smileid: smileId };

export function getIdentityProvider(): IdentityProvider {
  const name = (process.env.IDENTITY_PROVIDER ?? "didit").toLowerCase();
  return providers[name] ?? didit;
}
