import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getLeadInbox, getRepById, type LeadInboxRow } from "@/lib/queries";
import { StatStrip, Stat } from "@/components/stat-strip";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Button } from "@/components/ui/button";
import { ClaimButton } from "@/components/claim-button";
import { ListToggleButton } from "@/components/list-toggle-button";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MarketplacePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "admin";
  if (!isAdmin) {
    const rep = await getRepById(session.subject);
    if (rep?.must_change_password) redirect("/my/account");
  }

  const leads = await getLeadInbox(100, "listed");

  // The claim mechanic is not self-evident from the board, so the rule stays
  // on the page rather than living only in onboarding.
  const blurb = isAdmin
    ? "Leads you've listed for the whole team. Any rep can claim one — it then moves into their pipeline. Unlist to pull it back."
    : "Unassigned leads up for grabs. Claim one to take ownership — it moves straight into your board. Changed your mind later? Unclaim it and it comes back here.";

  return (
    <div className="animate-fade-in">
      <h1 className="sr-only">Marketplace — leads listed for the team to claim</h1>

      <StatStrip number={isAdmin ? "03" : "02"} className="mb-5">
        <Stat label="On the market" value={leads.length} tone="brand" />
      </StatStrip>

      <p className="mb-5 max-w-2xl text-[12.5px] leading-relaxed text-ink-dim">
        {blurb}
      </p>

      {leads.length === 0 ? (
        <div className="panel px-6 py-20 text-center">
          <div className="display-serif mb-3 text-6xl text-ink-ghost">∅</div>
          <h2 className="display-serif mb-2 text-2xl text-ink">
            Nothing listed right now.
          </h2>
          <p className="mx-auto max-w-sm text-[12.5px] leading-relaxed text-ink-dim">
            {isAdmin
              ? "List a lead from its detail page and it'll appear here for any rep to claim."
              : "No leads are on the marketplace yet. Check back soon — the admin lists fresh ones here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {leads.map((lead) => (
            <MarketCard key={lead.id} lead={lead} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}

function MarketCard({
  lead,
  isAdmin,
}: {
  lead: LeadInboxRow;
  isAdmin: boolean;
}) {
  return (
    <div className="panel flex flex-col gap-3 p-[18px] transition-colors hover:bg-surface-2">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/leads/${lead.id}`}
          className="line-clamp-2 text-[14px] font-medium leading-tight text-ink transition-colors hover:text-brand-ink"
        >
          {lead.company_name}
        </Link>
        <ScoreBadge score={lead.score} size="sm" showLabel={false} />
      </div>

      {lead.signal_summary && (
        <p className="line-clamp-3 text-[12px] leading-snug text-ink-dim">
          {lead.signal_summary}
        </p>
      )}

      <div className="eyebrow mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line-soft pt-2.5">
        {lead.location && <span className="truncate">{lead.location}</span>}
        {lead.signal_type && (
          <span className="text-brand-ink">
            {String(lead.signal_type).replace(/_/g, " ")}
          </span>
        )}
        <span className="tabular ml-auto">{formatRelative(lead.created_at)}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/leads/${lead.id}`}>
            Open
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </Button>
        {isAdmin ? (
          <ListToggleButton leadId={lead.id} isListed />
        ) : (
          <ClaimButton leadId={lead.id} redirectTo={`/leads/${lead.id}`} />
        )}
      </div>
    </div>
  );
}
