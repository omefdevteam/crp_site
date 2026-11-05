"use client";

import { useId, useState } from "react";
import { field } from "@/components/admin/marks";
import { LOGO_BYTE_CAP, LOGO_PROBLEM_TEXT } from "@/lib/logos/model";

const ACCEPT = "image/png,image/jpeg,image/svg+xml,image/webp,.png,.jpg,.jpeg,.svg,.webp";
const TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);

/** File picker that catches a wrong type or an oversized file before it is sent. The server checks again. */
export function LogoFileField({ id, label, required = true }: { id: string; label: string; required?: boolean }) {
  const [problem, setProblem] = useState("");
  const helpId = useId();
  return (
    <div className="grid gap-1">
      <label className="text-sm font-semibold" htmlFor={id}>{label}</label>
      <input
        id={id}
        name="file"
        type="file"
        accept={ACCEPT}
        required={required}
        aria-describedby={helpId}
        aria-invalid={problem ? true : undefined}
        className={`${field} h-auto py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white`}
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          let message = "";
          if (file && file.type && !TYPES.has(file.type)) message = LOGO_PROBLEM_TEXT["file-type"];
          else if (file && file.size > LOGO_BYTE_CAP) message = LOGO_PROBLEM_TEXT["file-too-big"];
          input.setCustomValidity(message);
          setProblem(message);
        }}
      />
      <p id={helpId} className={`text-sm ${problem ? "font-semibold text-magenta" : "text-black/60"}`}>
        {problem || "PNG, JPG, SVG or WebP, up to 500 KB. A square logo on a plain or see-through background works best."}
      </p>
    </div>
  );
}
