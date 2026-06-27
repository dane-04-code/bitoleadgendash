"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentRepId, getSession } from "@/lib/auth";
import { hashPassword, verifyPasswordHash } from "@/lib/auth";
import {
  isMockMode,
  MOCK_REPS,
  mockAddLeadNote,
  mockDeleteLeadNote,
  mockSaveLeadReview,
  mockAddFeedback,
  mockUpdateFeedbackStatus,
} from "@/lib/mock-data";
import type {
  LeadStatus,
  FeedbackCategory,
  FeedbackStatus,
} from "@/lib/supabase/types";
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from "@/lib/supabase/types";

/**
 * Display name for whoever is acting now — "Admin" for the admin session, the
 * rep's full name for a rep. Used to stamp notes and reviews.
 */
async function currentActorName(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.role === "admin") return "Admin";
  if (isMockMode()) {
    return MOCK_REPS.find((r) => r.id === session.subject)?.full_name ?? "Rep";
  }
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("reps")
    .select("full_name")
    .eq("id", session.subject)
    .maybeSingle();
  return (data?.full_name as string | undefined) ?? "Rep";
}

export async function assignLeadToRep(formData: FormData) {
  const leadId = String(formData.get("leadId") || "");
  const repId = String(formData.get("repId") || "");
  const notes = String(formData.get("notes") || "") || null;

  if (!leadId || !repId) {
    return { ok: false, error: "Lead and rep are required." };
  }

  const supabase = getSupabaseServerClient();
  const { error: insertErr } = await supabase.from("assignments").insert({
    lead_id: leadId,
    rep_id: repId,
    notes,
  });
  if (insertErr) {
    console.error("assignLeadToRep insert", insertErr);
    return { ok: false, error: insertErr.message };
  }

  // Assigning makes a lead owned — bump any unowned status (new / listed /
  // returned) to "assigned" and pull it off the marketplace / main list.
  const { data: lead } = await supabase
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .maybeSingle();

  const oldStatus = lead?.status as string | undefined;
  if (oldStatus && ["new", "listed", "returned"].includes(oldStatus)) {
    await supabase
      .from("leads")
      .update({ status: "assigned", updated_at: new Date().toISOString() })
      .eq("id", leadId);
    await supabase.from("pipeline_updates").insert({
      lead_id: leadId,
      rep_id: repId,
      old_status: oldStatus,
      new_status: "assigned",
      note: "Auto-updated on assignment",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function updateLeadStatus(formData: FormData) {
  const leadId = String(formData.get("leadId") || "");
  const newStatus = String(formData.get("status") || "") as LeadStatus;
  const note = String(formData.get("note") || "") || null;

  if (!leadId || !newStatus) {
    return { ok: false, error: "Lead and status are required." };
  }

  const supabase = getSupabaseServerClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .maybeSingle();
  const oldStatus = (lead?.status as LeadStatus | undefined) ?? null;

  const { error } = await supabase
    .from("leads")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) {
    console.error("updateLeadStatus update", error);
    return { ok: false, error: error.message };
  }

  if (oldStatus !== newStatus) {
    await supabase.from("pipeline_updates").insert({
      lead_id: leadId,
      old_status: oldStatus,
      new_status: newStatus,
      note,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

/**
 * A rep returns a lead they own back to the admin. Removes the rep's assignment
 * (so it leaves their board), sets the lead to "returned" so it surfaces in the
 * admin's Returned inbox, logs the stage change, and saves the rep's reason as a
 * note. A reason is required.
 */
export async function returnLead(formData: FormData) {
  const repId = await getCurrentRepId();
  if (!repId) return { ok: false, error: "Not signed in as a rep." };

  const leadId = String(formData.get("leadId") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!leadId) return { ok: false, error: "Missing lead." };
  if (!reason) {
    return { ok: false, error: "Please give a reason for returning this lead." };
  }

  const supabase = getSupabaseServerClient();

  // Only the owning rep may return a lead.
  const { count: ownsCount } = await supabase
    .from("assignments")
    .select("*", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .eq("rep_id", repId);
  if (!ownsCount) {
    return { ok: false, error: "This lead is not assigned to you." };
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .maybeSingle();
  const oldStatus = (lead?.status as LeadStatus | undefined) ?? null;

  // Drop the rep's assignment(s) so the lead leaves their inbox.
  const { error: delErr } = await supabase
    .from("assignments")
    .delete()
    .eq("lead_id", leadId)
    .eq("rep_id", repId);
  if (delErr) {
    console.error("returnLead delete assignment", delErr);
    return { ok: false, error: delErr.message };
  }

  const { error: updErr } = await supabase
    .from("leads")
    .update({ status: "returned", updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (updErr) {
    console.error("returnLead update lead", updErr);
    return { ok: false, error: updErr.message };
  }

  await supabase.from("pipeline_updates").insert({
    lead_id: leadId,
    rep_id: repId,
    old_status: oldStatus,
    new_status: "returned",
    note: `Returned by rep: ${reason}`,
  });

  const author = await currentActorName();
  await supabase
    .from("lead_notes")
    .insert({ lead_id: leadId, body: `Returned lead — ${reason}`, author });

  revalidatePath("/my");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// ─── Lead marketplace ──────────────────────────────────────────────────────

/** Admin publishes an unowned lead to the marketplace (status → listed). */
export async function listLead(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "admin") return { ok: false, error: "Admins only." };
  const leadId = String(formData.get("leadId") || "");
  if (!leadId) return { ok: false, error: "Missing lead." };

  const supabase = getSupabaseServerClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .maybeSingle();
  const oldStatus = (lead?.status as LeadStatus | undefined) ?? null;
  if (oldStatus && !["new", "returned", "listed"].includes(oldStatus)) {
    return {
      ok: false,
      error: "This lead has an owner — it can't be listed.",
    };
  }

  const { error } = await supabase
    .from("leads")
    .update({ status: "listed", updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) {
    console.error("listLead", error);
    return { ok: false, error: error.message };
  }
  await supabase.from("pipeline_updates").insert({
    lead_id: leadId,
    old_status: oldStatus,
    new_status: "listed",
    note: "Listed on marketplace",
  });

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

/** Admin pulls a lead back off the marketplace (status → new). */
export async function unlistLead(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "admin") return { ok: false, error: "Admins only." };
  const leadId = String(formData.get("leadId") || "");
  if (!leadId) return { ok: false, error: "Missing lead." };

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: "new", updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("status", "listed");
  if (error) {
    console.error("unlistLead", error);
    return { ok: false, error: error.message };
  }
  await supabase.from("pipeline_updates").insert({
    lead_id: leadId,
    old_status: "listed",
    new_status: "new",
    note: "Removed from marketplace",
  });

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

/** A rep claims a listed lead — self-assigns it and pulls it off the market. */
export async function claimLead(formData: FormData) {
  const repId = await getCurrentRepId();
  if (!repId) return { ok: false, error: "Not signed in as a rep." };
  const leadId = String(formData.get("leadId") || "");
  if (!leadId) return { ok: false, error: "Missing lead." };

  const supabase = getSupabaseServerClient();

  // Flip listed → assigned atomically; if no row changed, someone beat us to it.
  const { data: claimed, error: updErr } = await supabase
    .from("leads")
    .update({ status: "assigned", updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("status", "listed")
    .select("id");
  if (updErr) {
    console.error("claimLead update", updErr);
    return { ok: false, error: updErr.message };
  }
  if (!claimed || claimed.length === 0) {
    return { ok: false, error: "This lead was just claimed by someone else." };
  }

  const { error: insErr } = await supabase.from("assignments").insert({
    lead_id: leadId,
    rep_id: repId,
    notes: "Claimed from marketplace",
  });
  if (insErr) {
    console.error("claimLead assignment", insErr);
    return { ok: false, error: insErr.message };
  }
  await supabase.from("pipeline_updates").insert({
    lead_id: leadId,
    rep_id: repId,
    old_status: "listed",
    new_status: "assigned",
    note: "Claimed from marketplace",
  });

  revalidatePath("/marketplace");
  revalidatePath("/my");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

/**
 * A rep releases a lead they hold (claimed or admin-assigned). Drops their
 * assignment and puts the lead back on the marketplace (status → listed) for
 * anyone to claim. No reason required — distinct from "Return lead".
 */
export async function unclaimLead(formData: FormData) {
  const repId = await getCurrentRepId();
  if (!repId) return { ok: false, error: "Not signed in as a rep." };
  const leadId = String(formData.get("leadId") || "");
  if (!leadId) return { ok: false, error: "Missing lead." };

  const supabase = getSupabaseServerClient();
  const { count: ownsCount } = await supabase
    .from("assignments")
    .select("*", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .eq("rep_id", repId);
  if (!ownsCount) {
    return { ok: false, error: "This lead is not assigned to you." };
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .maybeSingle();
  const oldStatus = (lead?.status as LeadStatus | undefined) ?? null;

  const { error: delErr } = await supabase
    .from("assignments")
    .delete()
    .eq("lead_id", leadId)
    .eq("rep_id", repId);
  if (delErr) {
    console.error("unclaimLead delete", delErr);
    return { ok: false, error: delErr.message };
  }

  const { error: updErr } = await supabase
    .from("leads")
    .update({ status: "listed", updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (updErr) {
    console.error("unclaimLead update", updErr);
    return { ok: false, error: updErr.message };
  }
  await supabase.from("pipeline_updates").insert({
    lead_id: leadId,
    rep_id: repId,
    old_status: oldStatus,
    new_status: "listed",
    note: "Unclaimed — back on marketplace",
  });

  revalidatePath("/marketplace");
  revalidatePath("/my");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function killLead(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session?.role !== "admin") return { ok: false, error: "Admins only." };

  const leadId = String(formData.get("leadId") || "");
  if (!leadId) return { ok: false, error: "Missing lead." };

  const supabase = getSupabaseServerClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .maybeSingle();
  const oldStatus = (lead?.status as LeadStatus | undefined) ?? null;

  const { error } = await supabase
    .from("leads")
    .update({ status: "dead", updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) {
    console.error("killLead", error);
    return { ok: false, error: error.message };
  }

  await supabase.from("pipeline_updates").insert({
    lead_id: leadId,
    old_status: oldStatus,
    new_status: "dead",
    note: "Killed by admin",
  });

  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function markOutreachUsed(outreachId: string, leadId: string, used: boolean) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("outreach")
    .update({ used })
    .eq("id", outreachId);
  if (error) {
    console.error("markOutreachUsed", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// ─── Lead notes ──────────────────────────────────────────────────────────────

export async function addLeadNote(formData: FormData) {
  const leadId = String(formData.get("leadId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!leadId || !body) return { ok: false, error: "Note text is required." };

  const author = await currentActorName();

  if (isMockMode()) {
    mockAddLeadNote(leadId, body, author);
    revalidatePath(`/leads/${leadId}`);
    return { ok: true };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("lead_notes")
    .insert({ lead_id: leadId, body, author });
  if (error) {
    console.error("addLeadNote", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function deleteLeadNote(noteId: string, leadId: string) {
  if (!noteId) return { ok: false, error: "Missing note id." };

  if (isMockMode()) {
    mockDeleteLeadNote(noteId);
    revalidatePath(`/leads/${leadId}`);
    return { ok: true };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("lead_notes").delete().eq("id", noteId);
  if (error) {
    console.error("deleteLeadNote", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// ─── Manual review scorecard (temporary) ──────────────────────────────────────

export async function saveLeadReview(formData: FormData) {
  const leadId = String(formData.get("leadId") || "");
  if (!leadId) return { ok: false, error: "Missing lead id." };

  const parseScore = (key: string): number | null => {
    const raw = formData.get(key);
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
  };

  const review = {
    lead_id: leadId,
    contact_accuracy: parseScore("contact_accuracy"),
    relevancy: parseScore("relevancy"),
    score_accuracy: parseScore("score_accuracy"),
    gut_feel: parseScore("gut_feel"),
    comment: String(formData.get("comment") || "").trim() || null,
    reviewed_by: await currentActorName(),
  };

  if (isMockMode()) {
    mockSaveLeadReview(review);
    revalidatePath(`/leads/${leadId}`);
    return { ok: true };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("lead_reviews")
    .upsert(
      { ...review, updated_at: new Date().toISOString() },
      { onConflict: "lead_id" }
    );
  if (error) {
    console.error("saveLeadReview", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// ─── Feedback / suggestions ────────────────────────────────────────────────

export async function submitFeedback(formData: FormData) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const categoryRaw = String(formData.get("category") || "idea");
  const category: FeedbackCategory = FEEDBACK_CATEGORIES.includes(
    categoryRaw as FeedbackCategory
  )
    ? (categoryRaw as FeedbackCategory)
    : "idea";
  const body = String(formData.get("body") || "").trim();
  if (!body) return { ok: false, error: "Please enter your feedback." };

  const author = await currentActorName();
  const author_role = session.role;

  if (isMockMode()) {
    mockAddFeedback({ author, author_role, category, body, status: "new" });
    revalidatePath("/feedback");
    return { ok: true };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("feedback")
    .insert({ author, author_role, category, body });
  if (error) {
    console.error("submitFeedback", error);
    return { ok: false, error: error.message };
  }
  revalidatePath("/feedback");
  return { ok: true };
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus) {
  const session = await getSession();
  if (session?.role !== "admin") return { ok: false, error: "Admins only." };
  if (!id) return { ok: false, error: "Missing feedback id." };
  if (!FEEDBACK_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status." };
  }

  if (isMockMode()) {
    mockUpdateFeedbackStatus(id, status);
    revalidatePath("/feedback");
    return { ok: true };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("feedback")
    .update({ status })
    .eq("id", id);
  if (error) {
    console.error("updateFeedbackStatus", error);
    return { ok: false, error: error.message };
  }
  revalidatePath("/feedback");
  return { ok: true };
}

export async function createRep(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const telegram = String(formData.get("telegram_username") || "").trim() || null;
  const speciality = String(formData.get("speciality") || "").trim() || null;
  const territory = String(formData.get("territory") || "").trim() || null;
  const password = String(formData.get("password") || "");

  if (!fullName || !email) {
    return { ok: false, error: "Name and email are required." };
  }
  if (password && password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const passwordHash = password ? await hashPassword(password) : null;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("reps").insert({
    full_name: fullName,
    email,
    telegram_username: telegram,
    speciality,
    territory,
    is_active: true,
    password: passwordHash,
  });
  if (error) {
    console.error("createRep", error);
    return { ok: false, error: error.message };
  }
  revalidatePath("/reps");
  return { ok: true };
}

export async function setRepPassword(formData: FormData) {
  const repId = String(formData.get("repId") || "");
  const password = String(formData.get("password") || "");

  if (!repId) return { ok: false, error: "Missing rep id." };
  if (!password || password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const passwordHash = await hashPassword(password);
  const supabase = getSupabaseServerClient();
  // Every admin-set password is temporary: the rep is forced to choose their
  // own on next login, so the admin never holds the rep's permanent password.
  const { error } = await supabase
    .from("reps")
    .update({ password: passwordHash, must_change_password: true })
    .eq("id", repId);
  if (error) {
    console.error("setRepPassword", error);
    return { ok: false, error: error.message };
  }
  revalidatePath("/reps");
  return { ok: true };
}

export async function clearRepPassword(formData: FormData) {
  const repId = String(formData.get("repId") || "");
  if (!repId) return { ok: false, error: "Missing rep id." };
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("reps")
    .update({ password: null })
    .eq("id", repId);
  if (error) {
    console.error("clearRepPassword", error);
    return { ok: false, error: error.message };
  }
  revalidatePath("/reps");
  return { ok: true };
}

export async function toggleRepActive(repId: string, isActive: boolean) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("reps")
    .update({ is_active: isActive })
    .eq("id", repId);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/reps");
  return { ok: true };
}

export async function deleteRep(repId: string) {
  if (!repId) return { ok: false, error: "Missing rep id." };
  const supabase = getSupabaseServerClient();

  // Remove this rep's lead assignments first so the delete can't trip a
  // foreign-key constraint. The leads themselves stay — they just become
  // unassigned and can be routed to someone else.
  const { error: assignErr } = await supabase
    .from("assignments")
    .delete()
    .eq("rep_id", repId);
  if (assignErr) {
    console.error("deleteRep assignments", assignErr);
    return { ok: false, error: assignErr.message };
  }

  const { error } = await supabase.from("reps").delete().eq("id", repId);
  if (error) {
    console.error("deleteRep", error);
    return { ok: false, error: error.message };
  }
  revalidatePath("/reps");
  return { ok: true };
}

// ─── Rep self-service ──────────────────────────────────────────────────────

export async function updateMyProfile(formData: FormData) {
  const repId = await getCurrentRepId();
  if (!repId) return { ok: false, error: "Not signed in as a rep." };

  const telegram =
    String(formData.get("telegram_username") || "").trim() || null;
  const speciality = String(formData.get("speciality") || "").trim() || null;
  const territory = String(formData.get("territory") || "").trim() || null;
  const availabilityRaw = String(formData.get("availability") || "").trim();
  const availability =
    availabilityRaw === "not_looking" ? "not_looking" : "looking";

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("reps")
    .update({
      telegram_username: telegram,
      speciality,
      territory,
      availability,
    })
    .eq("id", repId);
  if (error) {
    console.error("updateMyProfile", error);
    return { ok: false, error: error.message };
  }
  revalidatePath("/my/account");
  revalidatePath("/my");
  return { ok: true };
}

export async function changeMyPassword(formData: FormData) {
  const repId = await getCurrentRepId();
  if (!repId) return { ok: false, error: "Not signed in as a rep." };

  const current = String(formData.get("current_password") || "");
  const next = String(formData.get("new_password") || "");
  const confirm = String(formData.get("confirm_password") || "");

  if (!current) return { ok: false, error: "Enter your current password." };
  if (!next || next.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  if (next !== confirm) {
    return { ok: false, error: "New passwords do not match." };
  }
  if (next === current) {
    return { ok: false, error: "New password must differ from the current one." };
  }

  const supabase = getSupabaseServerClient();
  const { data: rep, error: fetchErr } = await supabase
    .from("reps")
    .select("password")
    .eq("id", repId)
    .maybeSingle();
  if (fetchErr || !rep) {
    console.error("changeMyPassword fetch", fetchErr);
    return { ok: false, error: "Could not load your account." };
  }
  if (!rep.password) {
    return {
      ok: false,
      error: "Your account has no password yet — ask the admin to set one first.",
    };
  }

  const ok = await verifyPasswordHash(current, rep.password as string);
  if (!ok) return { ok: false, error: "Current password is incorrect." };

  const newHash = await hashPassword(next);
  // The rep has now chosen their own password — clear the forced-change flag.
  const { error: updateErr } = await supabase
    .from("reps")
    .update({ password: newHash, must_change_password: false })
    .eq("id", repId);
  if (updateErr) {
    console.error("changeMyPassword update", updateErr);
    return { ok: false, error: updateErr.message };
  }
  revalidatePath("/my/account");
  revalidatePath("/my");
  return { ok: true };
}
