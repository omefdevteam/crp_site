import sharp from "sharp";
import { PHOTO_MAX_BYTES, type PhotoType } from "@/lib/ambassador/story-model";

export type CleanPhoto = { readonly bytes: Uint8Array; readonly type: PhotoType; readonly size: number };
export type CleanFailure = { readonly reason: "photo_type" | "photo_size" };

// Phone photos carry EXIF: GPS location, camera serials, capture time. Story
// photos can end up on the public globe, so every upload is decoded and
// written out again with no metadata at all. rotate() first applies the EXIF
// orientation to the pixels, so the photo still looks the right way up once
// the orientation tag is gone. sharp drops all metadata unless asked to keep
// it, so withMetadata/withExif are deliberately never called here.
export async function cleanPhoto(bytes: Uint8Array, type: PhotoType): Promise<CleanPhoto | CleanFailure> {
  let out: Buffer;
  try {
    // limitInputPixels guards against "decompression bombs": tiny files that
    // expand to huge images. 50 MP is above any phone camera in use today.
    const image = sharp(bytes, { failOn: "error", limitInputPixels: 50_000_000 }).rotate();
    if (type === "image/jpeg") out = await image.jpeg({ quality: 85 }).toBuffer();
    else if (type === "image/png") out = await image.png({ compressionLevel: 9 }).toBuffer();
    else out = await image.webp({ quality: 85 }).toBuffer();
  } catch {
    // Not a decodable image, even though its first bytes looked like one.
    return { reason: "photo_type" };
  }
  if (out.length <= 0 || out.length > PHOTO_MAX_BYTES) return { reason: "photo_size" };
  return { bytes: new Uint8Array(out.buffer, out.byteOffset, out.length), type, size: out.length };
}
