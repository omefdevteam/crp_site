import type { Cell } from "@/lib/excel-rows";
import type { ReviewWorkbook, TableSnapshot } from "@/lib/excel-sync";

export type GraphConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  driveId: string;
  itemId: string;
};

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export function graphConfigFromEnv(): GraphConfig | null {
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;
  const driveId = process.env.GRAPH_DRIVE_ID;
  const itemId = process.env.GRAPH_ITEM_ID;
  if (!tenantId || !clientId || !clientSecret || !driveId || !itemId) return null;
  return { tenantId, clientId, clientSecret, driveId, itemId };
}

function workbookBase(config: GraphConfig): string {
  return `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(config.driveId)}/items/${encodeURIComponent(config.itemId)}/workbook`;
}

async function graphFetch(url: string, token: string, sessionId: string | null | undefined, init?: RequestInit): Promise<unknown> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body) headers.set("Content-Type", "application/json");
  if (sessionId) headers.set("workbook-session-id", sessionId);
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`Graph ${res.status} ${new URL(url).pathname}: ${text.slice(0, 200)}`);
  if (!text) return null;
  return JSON.parse(text) as unknown;
}

async function accessToken(config: GraphConfig): Promise<string> {
  const key = `${config.tenantId}:${config.clientId}`;
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const res = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Graph token ${res.status}: ${text.slice(0, 200)}`);
  const parsed = JSON.parse(text) as { access_token?: string; expires_in?: number };
  if (!parsed.access_token) throw new Error("Graph token response had no access_token");
  const expiresIn = parsed.expires_in ?? 3600;
  tokenCache.set(key, { token: parsed.access_token, expiresAt: Date.now() + Math.max(30, expiresIn - 60) * 1000 });
  return parsed.access_token;
}

function unwrapRow(values: unknown): Cell[] {
  if (!Array.isArray(values)) return [];
  if (values.length === 1 && Array.isArray(values[0])) return values[0] as Cell[];
  return values as Cell[];
}

export async function openGraphWorkbook(config: GraphConfig): Promise<{ workbook: ReviewWorkbook; close: () => Promise<void> }> {
  const token = await accessToken(config);
  const base = workbookBase(config);
  const created = await graphFetch(`${base}/createSession`, token, null, {
    method: "POST",
    body: JSON.stringify({ persistChanges: true }),
  }) as { id?: string } | null;
  const sessionId = created?.id;
  if (!sessionId) throw new Error("Graph workbook session had no id");

  async function readTable(name: string): Promise<TableSnapshot> {
    const encoded = encodeURIComponent(name);
    const columns = await graphFetch(`${base}/tables/${encoded}/columns`, token, sessionId) as { value?: { name?: string }[] } | null;
    const headers = (columns?.value ?? []).map((column) => column.name ?? "").filter(Boolean);
    if (!headers.length) throw new Error(`Workbook is missing table ${name}`);

    const rows: TableSnapshot["rows"] = [];
    let url = `${base}/tables/${encoded}/rows?$top=500`;
    for (let page = 0; page < 20 && url; page++) {
      const data = await graphFetch(url, token, sessionId) as {
        value?: { index?: number; values?: unknown }[];
        "@odata.nextLink"?: string;
      } | null;
      for (const row of data?.value ?? []) {
        rows.push({ index: row.index ?? rows.length, values: unwrapRow(row.values) });
      }
      url = data?.["@odata.nextLink"] ?? "";
    }
    return { headers, rows };
  }

  async function writeRow(name: string, index: number, values: Cell[]): Promise<void> {
    await graphFetch(`${base}/tables/${encodeURIComponent(name)}/rows/itemAt(index=${index})`, token, sessionId, {
      method: "PATCH",
      body: JSON.stringify({ values: [values] }),
    });
  }

  async function addRow(name: string, values: Cell[]): Promise<void> {
    await graphFetch(`${base}/tables/${encodeURIComponent(name)}/rows/add`, token, sessionId, {
      method: "POST",
      body: JSON.stringify({ values: [values] }),
    });
  }

  return {
    workbook: { readTable, writeRow, addRow },
    close: async () => {
      await graphFetch(`${base}/closeSession`, token, sessionId, { method: "POST" }).catch(() => undefined);
    },
  };
}
