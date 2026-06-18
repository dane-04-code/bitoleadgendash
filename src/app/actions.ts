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
} from "@/lib/mock-data";
import type { LeadStatus } from "@/lib/supabase/types";

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

  // bump status to "assigned" if currently "new"
  const { data: lead } = await supabase
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .maybeSingle();

  if (lead?.status === "new") {
    await supabase
      .from("leads")
      .update({ status: "assigned", updated_at: new Date().toISOString() })
      .eq("id", leadId);
    await supabase.from("pipeline_updates").insert({
      lead_id: leadId,
      rep_id: repId,
      old_status: "new",
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
  const { error } = await supabase
    .from("reps")
    .update({ password: passwordHash })
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

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("reps")
    .update({
      telegram_username: telegram,
      speciality,
      territory,
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
  const { error: updateErr } = await supabase
    .from("reps")
    .update({ password: newHash })
    .eq("id", repId);
  if (updateErr) {
    console.error("changeMyPassword update", updateErr);
    return { ok: false, error: updateErr.message };
  }
  revalidatePath("/my/account");
  return { ok: true };
}
