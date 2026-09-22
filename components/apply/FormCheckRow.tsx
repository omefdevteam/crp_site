import { LimeCheck } from "./LimeCheck";

export function FormCheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="flex w-full items-center gap-4 rounded-[28px] bg-cream p-5 text-left desk:rounded-[32px] desk:p-6"
    >
      <span
        aria-hidden
        className={`grid size-6 shrink-0 place-items-center rounded-[8px] border-2 border-black ${
          checked ? "bg-black text-lime" : "bg-transparent"
        }`}
      >
        {checked ? <LimeCheck className="size-3.5" /> : null}
      </span>
      <span className="text-[16px] leading-[1.2] tracking-[-0.8px] text-black desk:text-[20px]">
        {label}
      </span>
    </button>
  );
}
