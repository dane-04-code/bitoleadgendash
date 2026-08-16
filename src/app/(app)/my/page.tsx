import { redirect } from "next/navigation";
import { getCurrentRepId } from "@/lib/auth";
import { getLeadsForRep, getRepById, getRepStats } from "@/lib/queries";
import { RepLeadsView, type RepView } from "@/components/rep-leads-view";
import { StatStrip, Stat } from "@/components/stat-strip";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const view: RepView = searchParams?.view === "inbox" ? "inbox" : "board";
  const repId = await getCurrentRepId();
  if (!repId) redirect("/login");

  const [rep, leads, stats] = await Promise.all([
    getRepById(repId),
    getLeadsForRep(repId),
    getRepStats(repId),
  ]);

  if (!rep) {
    // Account was deleted while logged in
    redirect("/api/auth/logout");
  }

  // Admin reset their password — force them to choose their own before working.
  if (rep.must_change_password) redirect("/my/account");

  const liveQuotes = leads.filter((l) => l.status === "quote").length;

  return (
    <div className="animate-fade-in">
      <h1 className="sr-only">My leads — {rep.full_name}</h1>

      <StatStrip number="01" className="mb-5">
        <Stat label="In play" value={stats.open} tone="brand" />
        <Stat label="Hot · 80+" value={stats.hot} tone="warn" />
        <Stat
          label="Live quotes"
          value={liveQuotes}
          hint="Quotes you've issued that are still open"
        />
        <Stat label="Won" value={stats.won} tone="good" />
        <Stat label="Dead" value={stats.dead} tone="bad" />
        <Stat label="Total" value={stats.total} />
      </StatStrip>

      <p className="mb-5 text-[12.5px] leading-relaxed text-ink-dim">
        {view === "inbox"
          ? "The leads routed to you, hottest first. Set a stage inline, or open a lead to work it."
          : "The leads routed to you. Drag a card to move it through the stages."}
      </p>

      <RepLeadsView leads={leads} view={view} />
    </div>
  );
}
