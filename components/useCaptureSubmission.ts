"use client";

import { useRef, useState } from "react";

export function useCaptureSubmission() {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [challengeKey, setChallengeKey] = useState(0);

  async function submit(action: () => Promise<{ ok: boolean }>): Promise<boolean> {
    if (busy.current) return false;
    busy.current = true;
    setPending(true);
    setError(false);
    try {
      const result = await action();
      if (!result.ok) throw new Error("Capture rejected");
      return true;
    } catch {
      setError(true);
      // Turnstile tokens are single use, even if persistence later fails.
      setChallengeKey((key) => key + 1);
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return { pending, error, challengeKey, submit };
}
