import { redirect } from "next/navigation";
import { getCurrentRepId } from "@/lib/auth";
import { getLeadsForRep, getRepById, getRepStats } from "@/lib/queries";
import { RepLeadsView } from "@/components/rep-leads-view";
import { PageHeader, MetaItem } from "@/components/page-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyPage() {
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

  const firstName = rep.full_name.split(/\s+/)[0] || rep.full_name;
  const liveQuotes = leads.filter((l) => l.status === "quote").length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        number="A"
        eyebrow={`Sales rep · ${rep.full_name}`}
        title={
          <>
            Welcome back, <em className="text-brand-ink">{firstName}</em>.
          </>
        }
        subtitle="The leads routed to you. Drag a card to move it through the stages."
        meta={
          <>
            <MetaItem label="In play" value={stats.open} accent />
            <MetaItem label="Hot · 80+" value={stats.hot} tone="warn" />
            <MetaItem
              label="Live quotes"
              value={liveQuotes}
              hint="Quotes you've issued that are still open"
            />
            <MetaItem label="Won" value={stats.won} tone="good" />
            <MetaItem label="Dead" value={stats.dead} tone="bad" />
            <MetaItem label="Total" value={stats.total} />
          </>
        }
      />

      <RepLeadsView leads={leads} />
    </div>
  );
}
