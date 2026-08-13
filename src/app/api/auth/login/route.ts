import { NextRequest, NextResponse } from "next/server";
import {
  checkAdminPassword,
  createAdminSession,
  createRepSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifyPasswordHash,
} from "@/lib/auth-edge";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode, MOCK_REPS } from "@/lib/mock-data";

/**
 * Demo-mode rep password. Only ever consulted when isMockMode() is true —
 * i.e. no real Supabase project is configured — so it cannot be used against
 * live data. It exists so the rep-side of the app (their board, account page,
 * marketplace claiming) is reachable in a local demo.
 */
const MOCK_REP_PASSWORD = "bito-demo";

type LoginBody = { email?: string; password?: string };

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
  let body: LoginBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const password = body?.password ?? "";
  const email = (body?.email ?? "").trim().toLowerCase();

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  // Rep login (email present)
  if (email) {
    if (isMockMode()) {
      const rep = MOCK_REPS.find(
        (r) => r.email?.toLowerCase() === email && r.is_active
      );
      if (!rep || password !== MOCK_REP_PASSWORD) {
        return NextResponse.json(
          { error: "No active rep with that email, or wrong password." },
          { status: 401 }
        );
      }
      const token = await createRepSession(rep.id);
      const res = NextResponse.json({ ok: true, role: "rep" });
      setCookie(res, token);
      return res;
    }

    const supabase = getSupabaseServerClient();
    const { data: rep, error } = await supabase
      .from("reps")
      .select("id, password, is_active")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      console.error("rep lookup error", error);
      return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
    if (!rep || !rep.is_active) {
      return NextResponse.json(
        { error: "No active rep with that email" },
        { status: 401 }
      );
    }
    if (!rep.password) {
      return NextResponse.json(
        { error: "Your account has no password set yet. Ask the admin." },
        { status: 401 }
      );
    }

    const ok = await verifyPasswordHash(password, rep.password as string);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    const token = await createRepSession(rep.id as string);
    const res = NextResponse.json({ ok: true, role: "rep" });
    setCookie(res, token);
    return res;
  }

  // Admin login (password only)
  if (!checkAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await createAdminSession();
  const res = NextResponse.json({ ok: true, role: "admin" });
  setCookie(res, token);
  return res;
}
