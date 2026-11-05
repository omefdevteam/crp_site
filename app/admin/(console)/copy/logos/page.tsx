import type { Metadata } from "next";
import { LogoDeskView } from "@/components/admin/LogoDesk";
import { getDb } from "@/lib/db";
import { loadLogoDesk, logoStoreFromEnv } from "@/lib/logos/manage";
import { requireStaff } from "@/lib/staff/gate";
import { can } from "@/lib/staff/roles";

export const metadata: Metadata = { title: "Logos · Website text" };

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function LogosPage({ searchParams }: { searchParams: Promise<{ group?: string; error?: string; done?: string }> }) {
  const staff = await requireStaff("copy.edit");
  const params = await searchParams;
  const desk = await loadLogoDesk(getDb(), logoStoreFromEnv());
  return (
    <LogoDeskView
      desk={desk}
      canChange={can(staff.role, "copy.publish")}
      group={firstParam(params.group)}
      error={firstParam(params.error)}
      done={firstParam(params.done)}
    />
  );
}
