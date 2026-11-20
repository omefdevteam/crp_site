"use client";

import { privacyDoc } from "@/lib/legal/privacy";
import { useCopy } from "../LanguageProvider";
import { CookieSection } from "./CookieSection";
import { LegalPage } from "./LegalPage";

export function PrivacyPage() {
  const { privacyPage: page } = useCopy();
  return (
    <LegalPage title={page.title} doc={privacyDoc}>
      <CookieSection />
    </LegalPage>
  );
}
