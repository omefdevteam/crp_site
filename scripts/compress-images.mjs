import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const roots = [path.join(root, "public", "images"), path.join(root, "public", "textures")];
const MIN_BYTES = 400 * 1024;

async function walk(dir, out = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (/\.(jpe?g|png)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

async function compress(file) {
  const stat = await fs.stat(file);
  if (stat.size < MIN_BYTES) return null;
  const ext = path.extname(file).toLowerCase();
  const tmp = `${file}.tmp${ext}`;
  const image = sharp(file).rotate();
  if (ext === ".png") {
    await image.png({ compressionLevel: 9, effort: 10 }).toFile(tmp);
  } else {
    await image.jpeg({ quality: 80, mozjpeg: true }).toFile(tmp);
  }
  const next = await fs.stat(tmp);
  if (next.size >= stat.size) {
    await fs.unlink(tmp);
    return { file, before: stat.size, after: stat.size, skipped: true };
  }
  await fs.rename(tmp, file);
  return { file, before: stat.size, after: next.size, skipped: false };
}

const files = [];
for (const dir of roots) await walk(dir, files);
files.sort();

let saved = 0;
for (const file of files) {
  const result = await compress(file);
  if (!result) continue;
  const rel = path.relative(root, result.file);
  const beforeKb = (result.before / 1024).toFixed(0);
  const afterKb = (result.after / 1024).toFixed(0);
  if (result.skipped) {
    console.log(`skip ${rel} (${beforeKb}KB, no gain)`);
    continue;
  }
  saved += result.before - result.after;
  console.log(`${beforeKb}KB -> ${afterKb}KB  ${rel}`);
}
console.log(`saved ${(saved / 1024 / 1024).toFixed(2)}MB`);
