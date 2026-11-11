import type { ReactNode } from "react";
import { AdminFrame } from "@/components/admin/marks";
import { AdminNav } from "@/components/admin/AdminNav";
import { countNewMessages } from "@/lib/contact/messages";
import { countWaiting } from "@/lib/ambassador/review";
import { getDb } from "@/lib/db";
import { requireStaff } from "@/lib/staff/gate";
import { can } from "@/lib/staff/roles";
import { AREA_HREF, consoleAreas, type ConsoleArea } from "@/lib/admin/access";
import { signOut } from "./actions";

const NAV: readonly { readonly area: ConsoleArea; readonly label: string }[] = [
  { area: "dashboard", label: "Dashboard" },
  { area: "records", label: "Records" },
  { area: "stories", label: "Stories" },
  { area: "copy", label: "Website text" },
  { area: "staff", label: "Staff" },
  { area: "activity", label: "Activity" },
];

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff("dashboard.read");
  const [messages, waiting] = await Promise.all([
    can(staff.role, "messages.read") ? countNewMessages(getDb()) : 0,
    // A missing stories table (migration 0021 not applied yet) must not take the console down.
    can(staff.role, "stories.review") ? countWaiting(getDb()).catch(() => 0) : 0,
  ]);
  const areas = consoleAreas(staff.role);
  const items = NAV.filter((item) => areas.includes(item.area)).map((item) => ({
    href: AREA_HREF[item.area],
    label: item.label,
    badge: item.area === "records" && messages > 0 ? messages : item.area === "stories" && waiting > 0 ? waiting : undefined,
    badgeLabel: item.area === "stories" ? "stories waiting for review" : "new messages",
  }));
  return (
    <AdminFrame>
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-black focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Skip to content
      </a>
      <AdminNav email={staff.email} items={items} signOut={signOut} />
      <main id="admin-main">{children}</main>
    </AdminFrame>
  );
}
