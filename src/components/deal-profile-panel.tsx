"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Loader2, Save } from "lucide-react";
import { saveDealProfile } from "@/app/actions";
import type { DealProfile, DealSale } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DealProfileDialog({
  leadId,
  leadStatus,
  profile,
  sale,
}: {
  leadId: string;
  leadStatus: string;
  profile: DealProfile | null;
  sale: DealSale | null;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveDealProfile(formData);
      if (!result.ok) {
        setError(result.error || "Could not save the deal profile.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={profile ? "secondary" : "outline"} size="sm">
          <BriefcaseBusiness className="h-3.5 w-3.5" strokeWidth={1.75} />
          {profile ? "Deal profile" : "Add deal profile"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <div className="eyebrow mb-1 text-brand-ink">Sales workspace</div>
          <DialogTitle>Deal profile</DialogTitle>
          <DialogDescription>
            Capture the commercial picture without altering the sourced lead data.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-7" onSubmit={handleSubmit}>
          <input type="hidden" name="leadId" value={leadId} />

          <FormSection title="Opportunity" description="The basic shape and value of the opportunity.">
            <Grid>
              <Field label="Deal name" name="dealName" value={profile?.deal_name} placeholder="e.g. Dubai South racking project" />
              <Field label="Opportunity / CRM reference" name="opportunityReference" value={profile?.opportunity_reference} placeholder="e.g. OPP-2026-0142" />
              <Field label="Project type" name="projectType" value={profile?.project_type} placeholder="New build, expansion, retrofit…" />
              <Field label="Sales stage" name="projectStage" value={profile?.project_stage} placeholder="Discovery, design, tender…" />
              <Field label="Estimated value" name="estimatedValue" value={profile?.estimated_value} type="number" step="0.01" min="0" placeholder="0.00" />
              <Field label="Currency" name="currency" value={profile?.currency} placeholder="AED" maxLength={3} />
              <Field label="Win probability (%)" name="winProbability" value={profile?.win_probability} type="number" min="0" max="100" placeholder="0–100" />
              <Field label="Expected close date" name="expectedCloseDate" value={profile?.expected_close_date} type="date" />
              <Field label="Budget status" name="budgetStatus" value={profile?.budget_status} placeholder="Approved, requested, unknown…" />
            </Grid>
          </FormSection>

          <FormSection title="Site & scope" description="Where the work is happening and what the customer needs.">
            <Grid>
              <Field label="Country" name="country" value={profile?.country} placeholder="UAE" />
              <Field label="City / emirate" name="city" value={profile?.city} placeholder="Dubai" />
              <Field label="Facility type" name="facilityType" value={profile?.facility_type} placeholder="DC, cold store, manufacturing…" />
              <Field label="Site address" name="siteAddress" value={profile?.site_address} placeholder="Dubai South Logistics District" />
            </Grid>
            <Field label="Products of interest" name="productsOfInterest" value={profile?.products_of_interest?.join(", ")} placeholder="Pallet racking, mezzanine, shuttle system" hint="Separate products with commas." />
            <Field label="Project summary" name="projectSummary" value={profile?.project_summary} textarea placeholder="What is being built or changed? Include the customer's situation, goals and scale." />
            <Field label="Requirements & technical scope" name="requirements" value={profile?.requirements} textarea placeholder="Capacity, dimensions, temperatures, load types, throughput, integration needs, standards…" />
          </FormSection>

          <FormSection title="People & buying process" description="Who matters, and how the customer will make the decision.">
            <Grid>
              <Field label="Decision maker" name="decisionMaker" value={profile?.decision_maker} placeholder="Name / role" />
              <Field label="Technical contact" name="technicalContact" value={profile?.technical_contact} placeholder="Name / role" />
              <Field label="Procurement method" name="procurementMethod" value={profile?.procurement_method} placeholder="Direct, tender, framework…" />
              <Field label="Tender / RFP reference" name="tenderReference" value={profile?.tender_reference} placeholder="Reference number or name" />
              <Field label="Tender deadline" name="tenderDeadline" value={profile?.tender_deadline} type="date" />
              <Field label="Target installation date" name="targetInstallationDate" value={profile?.target_installation_date} type="date" />
            </Grid>
          </FormSection>

          <FormSection title="Proposal & commercial position" description="Track the offer, competition and important commercial terms.">
            <Grid>
              <Field label="Proposal / quote reference" name="proposalReference" value={profile?.proposal_reference} placeholder="e.g. BITO-Q-1048" />
              <Field label="Proposal sent date" name="proposalSentDate" value={profile?.proposal_sent_date} type="date" />
              <Field label="Incumbent supplier" name="incumbentSupplier" value={profile?.incumbent_supplier} placeholder="Current provider, if known" />
              <Field label="Competitors" name="competitors" value={profile?.competitors} placeholder="Names of competing vendors" />
            </Grid>
            <Field label="Commercial terms / considerations" name="commercialTerms" value={profile?.commercial_terms} textarea placeholder="Payment terms, warranty, delivery expectations, discount position or other deal terms." />
          </FormSection>

          <FormSection title="Next steps & risks" description="Keep the deal moving and record why it may stall or be lost.">
            <Grid>
              <Field label="Next action" name="nextAction" value={profile?.next_action} placeholder="Arrange site survey" />
              <Field label="Next-action date" name="nextActionDueDate" value={profile?.next_action_due_date} type="date" />
              <Field label="Lost reason" name="deathReason" value={profile?.death_reason} placeholder="Only if the deal is lost" />
            </Grid>
            <Field label="Risks & blockers" name="risksAndBlockers" value={profile?.risks_and_blockers} textarea placeholder="Timing, budget, technical concerns, stakeholder gaps, competitive threats…" />
            <Field label="Lost-deal notes" name="deathNotes" value={profile?.death_notes} textarea placeholder="Why the opportunity was lost and what we learned." />
            <Field label="Internal notes" name="internalNotes" value={profile?.internal_notes} textarea placeholder="Private sales context, agreed actions and useful background." />
          </FormSection>

          {leadStatus === "won" ? (
            <FormSection title="Won deal" description="Record the final project and financial result for this sale.">
              <Grid>
                <Field label="Project / PO reference" name="saleProjectReference" value={sale?.project_reference} placeholder="Customer PO or project number" />
                <Field label="Sale / contract date" name="saleDate" value={sale?.sale_date} type="date" />
                <Field label="Sale value" name="saleValue" value={sale?.sale_value} type="number" step="0.01" min="0" placeholder="0.00" />
                <Field label="Currency" name="saleCurrency" value={sale?.currency || profile?.currency} placeholder="AED" maxLength={3} />
                <Field label="Gross profit" name="grossProfit" value={sale?.gross_profit} type="number" step="0.01" min="0" placeholder="0.00" />
                <Field label="Profit margin (%)" name="profitMarginPercent" value={sale?.profit_margin_percent} type="number" step="0.01" min="0" max="100" placeholder="0–100" />
              </Grid>
              <Field label="Sale notes" name="saleNotes" value={sale?.notes} textarea placeholder="Scope sold, commercial outcome, delivery commitments and useful learnings." />
            </FormSection>
          ) : (
            <div className="border border-line bg-surface-2 px-4 py-3 text-[12px] text-ink-dim">
              Mark this lead as <span className="font-medium text-ink">Won</span> to record the final sale value, project reference and profit margin here.
            </div>
          )}

          {error && <p className="border-l-2 border-signal-hot bg-signal-hot/[0.06] px-3 py-2 mono text-[12px] text-signal-hot">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {pending ? "Saving…" : "Save deal profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="space-y-4 border-t border-line pt-5 first:border-t-0 first:pt-0"><div><h3 className="text-[14px] font-medium text-ink">{title}</h3><p className="mt-1 text-[12px] text-ink-dim">{description}</p></div>{children}</section>;
}

function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>; }

function Field({ label, name, value, placeholder, type = "text", textarea = false, hint, ...inputProps }: { label: string; name: string; value?: string | number | null; placeholder?: string; type?: string; textarea?: boolean; hint?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "defaultValue" | "type">) {
  const valueString = value == null ? "" : String(value);
  return <label className={textarea ? "block" : "block min-w-0"}><span className="eyebrow mb-2 block">{label}</span>{textarea ? <Textarea name={name} defaultValue={valueString} rows={3} placeholder={placeholder} /> : <Input name={name} type={type} defaultValue={valueString} placeholder={placeholder} {...inputProps} />}{hint && <span className="mt-1.5 block text-[11px] text-ink-faint">{hint}</span>}</label>;
}
