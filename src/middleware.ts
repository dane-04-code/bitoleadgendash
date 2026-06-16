import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/auth-edge";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
];

// Pages that only admins (the manager) may visit.
const ADMIN_ONLY = ["/dashboard", "/pipeline", "/reps", "/settings"];

// The rep landing page.
const REP_HOME = "/my";

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminOnly(pathname: string) {
  return ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await readSession(token);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Root → role-aware home
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = session.role === "admin" ? "/dashboard" : REP_HOME;
    return NextResponse.redirect(url);
  }

  // Rep tried to reach an admin-only page → bounce to their home
  if (session.role === "rep" && isAdminOnly(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = REP_HOME;
    return NextResponse.redirect(url);
  }

  // Admin tried to reach /my (which is rep-only) → send to dashboard
  if (session.role === "admin" && (pathname === REP_HOME || pathname.startsWith(`${REP_HOME}/`))) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
