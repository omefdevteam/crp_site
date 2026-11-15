import { randomUUID } from "crypto";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeskView } from "@/components/admin/DeskView";
import { adjacentDetailHrefs, parseRecordQuery } from "@/lib/admin/records";
import { recordsHref } from "@/lib/admin/return";
import { loadDetail } from "@/lib/desk/case";
import { getDb } from "@/lib/db";
import { RepeatsPanel } from "@/components/admin/RepeatsPanel";
import { decideRepeatAction } from "@/app/admin/(console)/records/repeats/actions";
import { canDecide, matchesFor } from "@/lib/duplicates/review";
import { requireStaff } from "@/lib/staff/gate";
import { addPartnerNote, assignPartner, movePartner } from "./actions";

export const metadata: Metadata = { title: "Partner inquiry" };

export default async function PartnerDeskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff("partners.read");
  const { id } = await params;
  const listQuery = { ...parseRecordQuery(flat(await searchParams)), list: "partners" as const };
  const db = getDb();
  const detail = await loadDetail(db, staff, "partner", id);
  if (!detail) notFound();
  const repeats = await matchesFor(db, "partners", detail.recordId);
  const neighbors = await adjacentDetailHrefs(db, listQuery, { id: detail.recordId, createdAt: detail.createdAt }, staff);
  return (
    <DeskView
      repeats={<RepeatsPanel matches={repeats} path={`/admin/records/partners/${detail.recordId}`} canDecide={canDecide(staff.role, "partners")} action={decideRepeatAction} />}
      detail={detail}
      listHref={recordsHref(listQuery)}
      backLabel="Back to partners"
      previous={neighbors.previous}
      next={neighbors.next}
      noteId={randomUUID()}
      noteAction={addPartnerNote}
      moveAction={movePartner}
      assignAction={assignPartner}
    />
  );
}

function flat(query: Record<string, string | string[] | undefined>): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) raw[key] = Array.isArray(value) ? value[0] ?? "" : value ?? "";
  return raw;
}
