"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth";
import type { LeadStatus } from "@/lib/supabase/types";

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
