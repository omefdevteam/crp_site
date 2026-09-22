"use client";

// Shared Continue control for apply / nominate forms (Figma 2184:4918):
// gradient pill with optional "N selected" count on the right.
export function ContinueButton({
  label,
  selectedCount,
  disabled,
  onClick,
  className = "",
}: {
  label: string;
  selectedCount?: number;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  const ready = !disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex h-14 w-full max-w-[632px] items-center overflow-hidden rounded-full transition-[filter,opacity] desk:h-16 ${
        ready ? "gradient-brand" : "bg-black opacity-[0.32]"
      } ${className}`}
    >
      <span className="flex-1 text-center text-[16px] font-semibold uppercase leading-[0.9] tracking-[0.64px] text-white mix-blend-hard-light desk:text-[18px]">
        {label}
      </span>
      {typeof selectedCount === "number" ? (
        <span
          className={`absolute right-0 top-0 flex h-full min-w-[120px] items-center justify-center px-5 text-[13px] font-semibold uppercase tracking-[0.04em] text-white ${
            ready ? "bg-black/25" : "bg-black/40"
          }`}
        >
          {selectedCount} selected
        </span>
      ) : null}
    </button>
  );
}
