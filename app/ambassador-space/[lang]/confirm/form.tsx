"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/admin/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { memberPath } from "@/lib/ambassador/link";
import { readFragmentToken } from "@/lib/staff/link";
import { useText } from "@/lib/ui-text";
import { completeMemberSignIn } from "./actions";

// Spending the link takes a click, so a mail scanner that opens the link
// cannot use it up first.
export function MemberConfirmForm() {
  const tr = useText();
  const router = useRouter();
  const { locale } = useLanguage();
  const [token, setToken] = useState<string | null>(null);
  const read = useRef(false);

  useEffect(() => {
    // Read once: a re-run would find the cleared address and bounce to sign-in.
    if (read.current) return;
    read.current = true;
    const found = readFragmentToken(window.location.hash);
    // Drop the code from the address bar and history straight away.
    window.history.replaceState(null, "", memberPath(locale, "/confirm"));
    if (!found) {
      router.replace(memberPath(locale, "/sign-in?error=link"));
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the fragment only exists in the browser
    setToken(found);
  }, [router, locale]);

  return (
    <form action={completeMemberSignIn} className="mt-8">
      <input type="hidden" name="token" value={token ?? ""} />
      <input type="hidden" name="locale" value={locale} />
      <Button variant="primary" type="submit" disabled={!token}>{tr("Finish signing in")}</Button>
    </form>
  );
}
