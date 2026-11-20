export type LegalBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };
export type LegalSection = { heading?: string; blocks: LegalBlock[] };
export type LegalDoc = {
  title: string;
  subtitle: string;
  /** Date text only, e.g. "29th September 2026". */
  updated: string;
  sections: LegalSection[];
};
