"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useCopy } from "./LanguageProvider";
import { WaitlistForm } from "./WaitlistForm";

// Homepage waitlist block (Figma 124:221): the garden photo in a rounded square
// with one gradient "Join the waitlist" button. The button opens the waitlist
// page (Figma 124:227), which is built from the apply form's parts.
export function Waitlist() {
  const copy = useCopy();
  const reduceMotion = useReducedMotion() === true;
  const [open, setOpen] = useState(false);

  return (
    <section id="waitlist" data-nav-tone="dark" className="bg-ink px-5 py-16 text-white desk:px-16 desk:py-24">
      <h2 className="sr-only">{copy.waitlist.title}</h2>
      <div className="relative mx-auto h-[484px] w-[298px] max-w-full overflow-hidden rounded-[88px] desk:aspect-square desk:h-auto desk:w-full desk:max-w-[536px] desk:rounded-[154px]">
        <Image
          src="/images/waitlist.jpg"
          alt={copy.waitlist.photoAlt}
          fill
          sizes="(min-width: 900px) 536px, 90vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 flex items-center justify-center p-6 desk:p-10">
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="gradient-brand flex h-16 w-full max-w-[250px] items-center justify-center rounded-full px-6 text-[15px] font-semibold uppercase leading-[0.9] tracking-[0.6px] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white desk:h-20 desk:max-w-[360px] desk:px-8 desk:text-[20px] desk:tracking-[0.8px]"
          >
            <span className="mix-blend-hard-light">{copy.waitlist.title}</span>
          </motion.button>
        </div>
      </div>
      {open ? <WaitlistForm onClose={() => setOpen(false)} /> : null}
    </section>
  );
}
