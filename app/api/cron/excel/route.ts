import { NextResponse, type NextRequest } from "next/server";
import { secretOk } from "@/lib/api-auth";
import { graphConfigFromEnv, openGraphWorkbook } from "@/lib/graph-workbook";
import { openGoogleWorkbook, sheetsConfigFromEnv } from "@/lib/google-sheets";
import { tickExcelFromEnv, type ReviewWorkbook } from "@/lib/excel-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type OpenedWorkbook = { workbook: ReviewWorkbook; close: () => Promise<void> };

// Vercel Cron calls this every 10 minutes. A complete Graph config edits the
// SharePoint workbook. Google Sheets remains the fallback. Neither pair set is
// a skip, not a failed deploy.
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const provided = bearer ?? req.headers.get("x-cron-secret");
  if (!secretOk(provided, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let opened: OpenedWorkbook | undefined;
  try {
    const graph = graphConfigFromEnv();
    if (graph) opened = await openGraphWorkbook(graph);
    else {
      const sheets = sheetsConfigFromEnv();
      if (!sheets) return NextResponse.json({ ok: true, skipped: true });
      opened = await openGoogleWorkbook(sheets);
    }
    const summary = await tickExcelFromEnv(opened.workbook);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "excel sync failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await opened?.close();
  }
}

export const POST = GET;
