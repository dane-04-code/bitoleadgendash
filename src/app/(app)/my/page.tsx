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

  const firstName = rep.full_name.split(/\s+/)[0] || rep.full_name;

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
        subtitle="The leads routed to you. Triage, work them, update their status as they move."
        meta={
          <>
            <MetaItem label="Open" value={stats.open} accent />
            <MetaItem label="Hot" value={stats.hot} />
            <MetaItem label="Won" value={stats.won} />
            <MetaItem label="Total assigned" value={stats.total} />
          </>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 border-y border-line divide-x divide-line bg-surface mb-10">
        <Stat label="In play" value={stats.open} accent="ink" />
        <Stat label="Hot · 80+" value={stats.hot} accent="hot" />
        <Stat label="Won" value={stats.won} accent="good" />
        <Stat label="Dead" value={stats.dead} accent="faint" />
      </section>

      <RepLeadsView leads={leads} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "ink" | "hot" | "warm" | "good" | "cold" | "faint";
}) {
  const colorMap: Record<typeof accent, string> = {
    ink: "text-ink",
    hot: "text-signal-hot",
    warm: "text-signal-warm",
    good: "text-signal-good",
    cold: "text-signal-cold",
    faint: "text-ink-faint",
  };
  return (
    <div className="px-5 sm:px-6 py-5 sm:py-6">
      <div className="eyebrow mb-3">{label}</div>
      <div className={`display-number text-5xl sm:text-6xl ${colorMap[accent]}`}>
        {value}
      </div>
    </div>
  );
}
