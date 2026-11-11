"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/admin/Button";
import { useText } from "@/lib/ui-text";

const MAX_EDGE = 2000;
const MAX_BYTES = 4 * 1024 * 1024;

// Phone photos are often 5–12 MB. Redraw the photo at most 2000px on its long
// edge as a JPEG before upload. That also drops the camera's location data.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("encode");
  return blob;
}

export function PhotoField({ storyId, version, hasPhoto, editable }: { storyId: string; version: number; hasPhoto: boolean; editable: boolean }) {
  const tr = useText();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const problem = (reason: string | undefined) => {
    if (reason === "photo_size") return tr("That photo is too large. Try a smaller one.");
    if (reason === "photo_type") return tr("Use a JPEG, PNG or WebP photo.");
    if (reason === "no_store") return tr("Photo uploads aren't switched on yet. You can send your story without one.");
    if (reason === "locked") return tr("This story can't be changed right now.");
    if (reason === "busy") return tr("Too many uploads. Try again later.");
    return tr("The photo didn't upload. Try again.");
  };

  const upload = async (file: File) => {
    setBusy(true);
    setMessage(null);
    try {
      let body: Blob = file;
      try {
        body = await shrink(file);
      } catch {
        // A format the browser can't draw goes as it is; the server checks it.
      }
      if (body.size > MAX_BYTES) {
        setMessage(problem("photo_size"));
        return;
      }
      const form = new FormData();
      form.append("photo", body, "photo.jpg");
      const response = await fetch(`/api/stories/${storyId}/photo`, { method: "POST", body: form });
      const data = (await response.json().catch(() => ({}))) as { reason?: string };
      if (!response.ok) {
        setMessage(problem(data.reason));
        return;
      }
      router.refresh();
    } catch {
      setMessage(problem(undefined));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/stories/${storyId}/photo`, { method: "DELETE" });
      if (!response.ok) setMessage(problem(((await response.json().catch(() => ({}))) as { reason?: string }).reason));
      else router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold">{tr("Photo (optional)")}</p>
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- a private, per-person image the optimiser must not cache
        <img src={`/api/stories/${storyId}/photo?v=${version}`} alt="" className="aspect-[4/3] w-full rounded-3xl bg-cream object-cover" />
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center rounded-3xl border border-dashed border-black/20 bg-cream text-sm text-black/50">
          {tr("No photo yet")}
        </div>
      )}
      {editable ? (
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            id={`photo-${storyId}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? tr("Uploading") : hasPhoto ? tr("Replace photo") : tr("Add a photo")}
          </Button>
          {hasPhoto ? <Button type="button" variant="ghost" disabled={busy} onClick={() => void remove()}>{tr("Remove photo")}</Button> : null}
        </div>
      ) : null}
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-magenta">{message}</p>
      {editable ? <p className="text-xs text-black/50">{tr("Only use photos you took, or have permission to share. Avoid showing faces of people who haven't agreed.")}</p> : null}
    </div>
  );
}
