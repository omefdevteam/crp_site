import { createSign } from "crypto";
import type { Cell } from "@/lib/excel-rows";
import type { ReviewWorkbook, TableSnapshot } from "@/lib/excel-sync";

export type SheetsConfig = {
  sheetId: string;
  clientEmail: string;
  privateKey: string;
};

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function accountField(parsed: object, key: string): string {
  const value = Object.fromEntries(Object.entries(parsed))[key];
  return typeof value === "string" ? value : "";
}

function readAccount(raw: string): Pick<SheetsConfig, "clientEmail" | "privateKey"> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const clientEmail = accountField(parsed, "client_email");
  const privateKey = accountField(parsed, "private_key").replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey.includes("PRIVATE KEY")) return null;
  return { clientEmail, privateKey };
}

export function sheetsConfigFromEnv(): SheetsConfig | null {
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim() ?? "";
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ?? "";
  if (!sheetId && !raw) return null;
  if (!sheetId || !raw) throw new Error("Google Sheets sync requires GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON");
  const account = readAccount(raw);
  if (!account) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must include client_email and private_key");
  return { sheetId, ...account };
}

function columnName(index: number): string {
  let name = "";
  let n = index;
  while (n > 0) {
    const mod = (n - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function cellValue(value: unknown): Cell {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value == null) return "";
  return "";
}

function pad(values: Cell[], length: number): Cell[] {
  const copy = values.slice(0, length);
  while (copy.length < length) copy.push("");
  return copy;
}

async function accessToken(config: SheetsConfig): Promise<string> {
  const cached = tokenCache.get(config.clientEmail);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(JSON.stringify({
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(config.privateKey).toString("base64url")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google token ${res.status}: ${text.slice(0, 200)}`);
  const parsed: unknown = JSON.parse(text);
  const token = typeof parsed === "object" && parsed !== null ? accountField(parsed, "access_token") : "";
  const expiresIn = typeof parsed === "object" && parsed !== null ? Number(accountField(parsed, "expires_in") || "3600") : 3600;
  if (!token) throw new Error("Google token response had no access_token");
  tokenCache.set(config.clientEmail, { token, expiresAt: Date.now() + Math.max(30, expiresIn - 60) * 1000 });
  return token;
}

async function sheetsFetch(url: string, token: string, init?: RequestInit): Promise<unknown> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body) headers.set("Content-Type", "application/json");
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`Sheets ${res.status} ${new URL(url).pathname}: ${text.slice(0, 200)}`);
  if (!text) return null;
  const parsed: unknown = JSON.parse(text);
  return parsed;
}

function rangeFor(name: string, index: number, width: number): string {
  const quoted = name.replaceAll("'", "''");
  const row = index + 2;
  return `'${quoted}'!A${row}:${columnName(Math.max(1, width))}${row}`;
}

export async function openGoogleWorkbook(config: SheetsConfig): Promise<{ workbook: ReviewWorkbook; close: () => Promise<void> }> {
  const token = await accessToken(config);
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.sheetId)}`;
  const pending = new Map<string, Map<number, Cell[]>>();
  const rowCounts = new Map<string, number>();

  function queue(name: string, index: number, values: Cell[]) {
    const rows = pending.get(name) ?? new Map<number, Cell[]>();
    rows.set(index, values);
    pending.set(name, rows);
  }

  async function readTable(name: string): Promise<TableSnapshot> {
    const url = `${base}/values/${encodeURIComponent(name)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`;
    let data: unknown;
    try {
      data = await sheetsFetch(url, token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("Unable to parse range") || message.startsWith("Sheets 400") || message.startsWith("Sheets 404")) {
        throw new Error(`Workbook is missing table ${name}`);
      }
      throw err;
    }
    const record = typeof data === "object" && data !== null ? Object.fromEntries(Object.entries(data)) : {};
    const grid = record.values;
    if (!Array.isArray(grid) || !Array.isArray(grid[0]) || grid[0].length === 0) {
      throw new Error(`Workbook is missing table ${name}`);
    }
    const headers = grid[0].map((value) => {
      if (typeof value === "string") return value.trim();
      const cell = cellValue(value);
      return cell === "" ? "" : String(cell);
    });
    if (headers.some((header) => header === "")) throw new Error(`Workbook is missing table ${name}`);
    const rows = grid.slice(1).map((row, index) => ({
      index,
      values: pad(Array.isArray(row) ? row.map(cellValue) : [], headers.length),
    }));
    const overlay = pending.get(name);
    if (overlay) {
      for (const [index, values] of overlay) {
        while (rows.length < index) rows.push({ index: rows.length, values: headers.map(() => "") });
        const next = { index, values: pad(values, headers.length) };
        if (rows.length === index) rows.push(next);
        else rows[index] = next;
      }
    }
    rowCounts.set(name, rows.length);
    return { headers, rows };
  }

  function writeRow(name: string, index: number, values: Cell[]): Promise<void> {
    queue(name, index, values);
    return Promise.resolve();
  }

  function addRow(name: string, values: Cell[]): Promise<void> {
    const index = rowCounts.get(name) ?? 0;
    rowCounts.set(name, index + 1);
    queue(name, index, values);
    return Promise.resolve();
  }

  return {
    workbook: { readTable, writeRow, addRow },
    close: async () => {
      const data = [...pending.entries()].flatMap(([name, rows]) =>
        [...rows.entries()].map(([index, values]) => ({
          range: rangeFor(name, index, values.length),
          values: [values.map((value) => value ?? "")],
        })),
      );
      if (!data.length) return;
      await sheetsFetch(`${base}/values:batchUpdate`, token, {
        method: "POST",
        body: JSON.stringify({ valueInputOption: "RAW", data }),
      });
      pending.clear();
    },
  };
}
