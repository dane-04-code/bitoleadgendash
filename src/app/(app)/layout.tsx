import { redirect } from "next/navigation";
import { Sidebar, MobileTopbar, type SidebarUser } from "@/components/sidebar";
import { TopUtilityBar } from "@/components/top-utility-bar";
import { getSession } from "@/lib/auth";
import { getRepById } from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  let user: SidebarUser;
  if (session.role === "admin") {
    user = { role: "admin", label: "Admin" };
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
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col min-w-0">
        <MobileTopbar user={user} />
        <TopUtilityBar role={session.role} />
        <main className="flex-1 min-w-0 px-5 sm:px-8 lg:px-10 py-6 lg:py-8 w-full">
          {children}
        </main>
        <footer className="border-t border-line px-5 sm:px-8 lg:px-10 py-3 mono text-[10px] uppercase tracking-wider text-ink-faint flex items-center justify-between">
          <span>BITO UAE / LeadIntelligence v0.1.0</span>
          <span>{new Date().getFullYear()} · GCC Region</span>
        </footer>
      </div>
    </div>
  );
}
