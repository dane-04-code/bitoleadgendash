import { NextRequest, NextResponse } from "next/server";
import {
  createRepSession,
  hashPassword,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth-edge";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SignupBody = {
  full_name?: string;
  email?: string;
  password?: string;
  code?: string;
};

function setCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function POST(req: NextRequest) {
  let body: SignupBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const fullName = (body.full_name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const code = (body.code ?? "").trim();

  // ── Gate: shared signup code ────────────────────────────────────────────
  const expectedCode = process.env.REP_SIGNUP_CODE;
  if (!expectedCode) {
    return NextResponse.json(
      { error: "Sign-ups are currently closed. Ask your admin." },
      { status: 503 }
    );
  }
  if (code !== expectedCode) {
    return NextResponse.json({ error: "Incorrect sign-up code." }, { status: 401 });
  }

  // ── Validate input ──────────────────────────────────────────────────────
  if (!fullName || !email) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 400 }
    );
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  // ── Reject duplicate email ──────────────────────────────────────────────
  const { data: existing, error: lookupError } = await supabase
    .from("reps")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("signup lookup error", lookupError);
    return NextResponse.json({ error: "Sign-up failed." }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists. Try signing in." },
      { status: 409 }
    );
  }

  // ── Create the rep ──────────────────────────────────────────────────────
  const passwordHash = await hashPassword(password);
  const { data: created, error: insertError } = await supabase
    .from("reps")
    .insert({
      full_name: fullName,
      email,
      is_active: true,
      password: passwordHash,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    console.error("signup insert error", insertError);
    return NextResponse.json({ error: "Sign-up failed." }, { status: 500 });
  }

  // ── Sign them in immediately ────────────────────────────────────────────
  const token = await createRepSession(created.id as string);
  const res = NextResponse.json({ ok: true, role: "rep" });
  setCookie(res, token);
  return res;
}
