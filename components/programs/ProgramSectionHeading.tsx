/** Small centred uppercase label above a /programs section (Figma 33:771, 32:316). */
export function ProgramSectionHeading({ children }: { children: string }) {
  return (
    <h2 className="px-6 text-center text-[13.5px] font-semibold uppercase leading-[0.9] tracking-[0.54px] text-black desk:px-0 desk:text-[16px] desk:tracking-[1.28px]">
      {children}
    </h2>
  );
}
