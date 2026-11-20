"use client";

import type { ReactNode } from "react";
import type { LegalDoc } from "@/lib/legal/types";
import { useCopy } from "../LanguageProvider";

const BODY =
  "text-[15px] leading-[1.2] tracking-[-0.6px] text-black/84 desk:text-[20px] desk:tracking-[-0.8px]";
const EMAIL_RE = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

/** Wraps email addresses in mailto links; a trailing sentence full stop stays outside the link. */
function withEmailLinks(text: string): ReactNode[] {
  return text.split(EMAIL_RE).map((part, index) =>
    index % 2 === 1 ? (
      <a key={index} href={`mailto:${part}`} className="underline underline-offset-4 [overflow-wrap:anywhere]">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

/** Shared layout for the legal pages: title column on the left, English legal text in a white card. */
export function LegalPage({ title, doc, children }: { title: string; doc: LegalDoc; children?: ReactNode }) {
  const { privacyPage: page } = useCopy();

  return (
    <section className="bg-cream px-[12px] pb-[76px] pt-[68px] desk:px-16 desk:pb-24 desk:pt-[120px]">
      <div className="mx-auto flex w-full max-w-[1072px] flex-col gap-[32px] desk:flex-row desk:items-stretch desk:gap-12">
        <div className="flex flex-col justify-between gap-[24px] px-[10px] text-black desk:gap-10 desk:px-0 desk:h-[589px] desk:min-w-0 desk:flex-1">
          <h1 className="text-[48px] leading-[0.8] tracking-[-1.92px] desk:text-[96px] desk:tracking-[-3.84px]">
            {title}
          </h1>
          <p className="text-[12px] font-semibold uppercase leading-[0.9] tracking-[0.96px] desk:text-[16px] desk:tracking-[1.28px]">
            {page.updated}
          </p>
        </div>
        <article lang="en" className="flex w-full shrink-0 flex-col gap-6 rounded-[44px] bg-white px-[24px] py-[32px] desk:p-8 desk:w-[678px]">
          <div className="flex flex-col gap-3">
            <h2 className="text-[28px] leading-[0.9] tracking-[-1.12px] text-black desk:text-[48px] desk:tracking-[-1.92px]">
              {doc.title}
            </h2>
            <p className={BODY}>{doc.subtitle}</p>
          </div>
          {doc.sections.map((section, sectionIndex) => (
            <div key={section.heading ?? sectionIndex} className="flex flex-col gap-6">
              {section.heading ? (
                <h3 className="text-[20px] leading-[0.9] tracking-[-0.8px] text-black desk:text-[32px] desk:tracking-[-1.28px]">
                  {section.heading}
                </h3>
              ) : null}
              <div className={`${BODY} flex flex-col gap-[8px] desk:gap-3`}>
                {section.blocks.map((block, blockIndex) =>
                  block.type === "p" ? (
                    <p key={blockIndex}>{withEmailLinks(block.text)}</p>
                  ) : (
                    <ul key={blockIndex} className="list-disc pl-6 marker:text-black/60">
                      {block.items.map((item) => (
                        <li key={item}>{withEmailLinks(item)}</li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </div>
          ))}
          {children}
        </article>
      </div>
    </section>
  );
}
