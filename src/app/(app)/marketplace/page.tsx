import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getLeadInbox, getRepById, type LeadInboxRow } from "@/lib/queries";
import { PageHeader, MetaItem } from "@/components/page-header";
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

  return (
    <div className="animate-fade-in">
      <PageHeader
        number={isAdmin ? "·" : "02"}
        eyebrow="Lead Intelligence Terminal / Marketplace"
        title={
          <>
            The lead <em className="text-brand-ink">marketplace</em>.
          </>
        }
        subtitle={
          isAdmin
            ? "Leads you've listed for the whole team. Any rep can claim one — it then moves into their pipeline. Unlist to pull it back."
            : "Unassigned leads up for grabs. Claim one to take ownership — it moves straight into your board. Changed your mind later? Unclaim it and it comes back here."
        }
        meta={<MetaItem label="On the market" value={leads.length} accent />}
      />

      {leads.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-20 text-center">
          <div className="display-serif text-6xl text-ink-faint/30 mb-3">∅</div>
          <h3 className="display-serif text-2xl text-ink mb-2">
            Nothing listed right now.
          </h3>
          <p className="text-[13px] text-ink-dim max-w-sm mx-auto leading-relaxed">
            {isAdmin
              ? "List a lead from its detail page and it'll appear here for any rep to claim."
              : "No leads are on the marketplace yet. Check back soon — the admin lists fresh ones here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-line border border-line">
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
    <div className="bg-surface p-5 flex flex-col gap-3 hover:bg-surface-2 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/leads/${lead.id}`}
          className="text-[15px] font-medium leading-tight text-ink hover:text-brand-ink transition-colors line-clamp-2"
        >
          {lead.company_name}
        </Link>
        <ScoreBadge score={lead.score} size="sm" showLabel={false} />
      </div>

      {lead.signal_summary && (
        <p className="text-[12px] text-ink-dim line-clamp-3 leading-snug">
          {lead.signal_summary}
        </p>
      )}

      <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mono text-[10px] uppercase tracking-wider text-ink-faint mt-auto pt-2 border-t border-line">
        {lead.location && <span className="truncate">{lead.location}</span>}
        {lead.signal_type && (
          <span className="text-brand-ink/80">
            {String(lead.signal_type).replace(/_/g, " ")}
          </span>
        )}
        <span className="tabular ml-auto">{formatRelative(lead.created_at)}</span>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
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
