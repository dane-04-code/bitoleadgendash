import { redirect } from "next/navigation";
import {
  Sidebar,
  MobileTopbar,
  type SidebarUser,
  type NavCounts,
} from "@/components/sidebar";
import { TopUtilityBar } from "@/components/top-utility-bar";
import { getSession } from "@/lib/auth";
import {
  getRepById,
  getActiveLeadCount,
  getAssignedLeadCount,
} from "@/lib/queries";
import { CommandPaletteProvider } from "@/components/command-palette";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  let user: SidebarUser;
  let counts: NavCounts | undefined;

  if (session.role === "admin") {
    user = { role: "admin", label: "Admin" };
    // Two cheap count queries so the rail carries live weight rather than
    // decorative numerals. Reps get no badges — their counts would cost a full
    // lead fetch on every page.
    const [inbox, pipeline] = await Promise.all([
      getActiveLeadCount(),
      getAssignedLeadCount(),
    ]);
    counts = { "/dashboard": inbox, "/pipeline": pipeline };
  } else {
    const rep = await getRepById(session.subject);
    if (!rep) redirect("/api/auth/logout");
    user = {
      role: "rep",
      label: rep.full_name,
      email: rep.email,
      territory: rep.territory,
    };
  }

  return (
    <CommandPaletteProvider role={session.role}>
      <div className="flex min-h-screen">
        <Sidebar user={user} counts={counts} />
        <div className="flex flex-1 flex-col min-w-0">
          <MobileTopbar user={user} />
          <main className="flex flex-col flex-1 min-h-0 min-w-0 w-full px-4 sm:px-6 lg:px-[30px] pt-5 lg:pt-[26px] pb-8">
            <TopUtilityBar role={session.role} />
            {children}
          </main>
          <footer className="px-4 sm:px-6 lg:px-[30px] py-4 mono text-[9.5px] uppercase tracking-[0.14em] text-ink-ghost flex items-center justify-between gap-4">
            <span>BITO UAE / LeadIntelligence v0.1.0</span>
            <span>{new Date().getFullYear()} · GCC Region</span>
          </footer>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
