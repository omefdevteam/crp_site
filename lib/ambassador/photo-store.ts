import { del, get, put } from "@vercel/blob";
import { getVercelOidcToken } from "@vercel/oidc";

// Story photos live in their own private Vercel Blob store, never in the
// identity and clip store (BLOB_READ_WRITE_TOKEN). The site serves a photo
// through /api/stories/[id]/photo, which checks the story first: anyone once it
// is approved, otherwise only its Ambassador and staff.
//
// On Vercel the store is connected as STORY_STORE_ID and reached with the
// deployment's OIDC token, passed with the store id so the SDK can never fall
// back to the identity store's token. STORY_BLOB_READ_WRITE_TOKEN wins when set.
export type StoryPhotoStore = {
  put(pathname: string, bytes: Uint8Array, contentType: string): Promise<void>;
  read(pathname: string): Promise<ReadableStream<Uint8Array> | null>;
  remove(pathname: string): Promise<void>;
};

type Auth = { readonly token: string } | { readonly storeId: string; readonly oidcToken: string };

export function storyPhotoStoreFromEnv(env: Readonly<Record<string, string | undefined>> = process.env): StoryPhotoStore | null {
  const token = env.STORY_BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = env.STORY_STORE_ID?.trim();
  let auth: () => Promise<Auth>;
  if (token) auth = async () => ({ token });
  else if (storeId) auth = async () => {
    const oidcToken = (await getVercelOidcToken()).trim();
    if (!oidcToken) throw new Error("No Vercel OIDC token");
    return { storeId, oidcToken };
  };
  else return null;
  return {
    async put(pathname, bytes, contentType) {
      await put(pathname, Buffer.from(bytes), { ...(await auth()), access: "private", contentType, addRandomSuffix: false, allowOverwrite: false });
    },
    async read(pathname) {
      const result = await get(pathname, { ...(await auth()), access: "private", useCache: false });
      return result?.stream ?? null;
    },
    async remove(pathname) {
      try {
        await del(pathname, await auth());
      } catch (err) {
        if (err instanceof Error && err.name === "BlobNotFoundError") return;
        throw err;
      }
    },
  };
}
