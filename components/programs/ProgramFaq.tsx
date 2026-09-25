"use client";

import { useState } from "react";
import { programIcons } from "@/lib/program-assets";
import { useCopy } from "../LanguageProvider";
import { FigmaImg } from "./FigmaImg";

function PlusMinus({ open }: { open: boolean }) {
  return (
    <FigmaImg
      src={programIcons.plus}
      alt=""
      width={24}
      height={24}
      className={`size-[24px] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        open ? "rotate-45" : "rotate-0"
      }`}
    />
  );
}

export function ProgramFaq() {
  const copy = useCopy();
  const faqs = copy.programs.faq.items;
  const [open, setOpen] = useState(0);

  return (
    <section className="mx-auto flex max-w-[680px] flex-col items-center gap-16 px-6 py-16 desk:py-[120px]">
      <h2 className="w-full text-[32px] font-normal leading-none tracking-[-1.28px] text-black desk:text-[48px] desk:leading-[0.9] desk:tracking-[-1.92px]">
        {copy.programs.faq.heading}
      </h2>

      <div className="flex w-full flex-col gap-8">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="flex flex-col gap-8">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="group flex w-full items-center gap-6 text-left"
              >
                <span className="flex-1 text-[20px] font-normal leading-none tracking-[-0.8px] text-black transition-colors group-hover:text-black/60 desk:text-[32px] desk:tracking-[-1.28px]">
                  {item.q}
                </span>
                <PlusMinus open={isOpen} />
              </button>
              {(
                <p hidden={!isOpen} className="text-[15px] font-normal leading-[1.2] tracking-[-0.6px] text-black desk:text-[20px] desk:tracking-[-0.8px] desk:text-black/84">
                  {item.a}
                </p>
              )}
              <div className="h-px w-full bg-black/15" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
