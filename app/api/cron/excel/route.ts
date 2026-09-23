import { NextResponse, type NextRequest } from "next/server";
import { secretOk } from "@/lib/api-auth";
import { graphConfigFromEnv, openGraphWorkbook } from "@/lib/excel-graph";
import { tickExcelFromEnv } from "@/lib/excel-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Vercel Cron calls this every 10 minutes. Missing Graph env is a skip, not a
// failed deploy: the rest of the site does not require the workbook sync.
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const provided = bearer ?? req.headers.get("x-cron-secret");
  if (!secretOk(provided, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const config = graphConfigFromEnv();
  if (!config) return NextResponse.json({ ok: true, skipped: true });

  let opened: Awaited<ReturnType<typeof openGraphWorkbook>> | undefined;
  try {
    opened = await openGraphWorkbook(config);
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
