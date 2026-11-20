"use client";

import { termsDoc } from "@/lib/legal/terms";
import { LegalPage } from "./LegalPage";

export function TermsPage() {
  return <LegalPage title="Terms of use" doc={termsDoc} />;
}
