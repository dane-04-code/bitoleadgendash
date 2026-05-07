import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  checkAdminPassword,
  checkPassword,
  createAdminSession,
  createRepSession,
  createSession,
  createSessionToken,
  hashPassword,
  readSession,
  verifyPasswordHash,
  verifySessionToken,
  type Role,
  type Session,
} from "./auth-edge";

export async function getSession(): Promise<Session | null> {
  const store = cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return readSession(token);
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === "admin";
}

export async function getCurrentRepId(): Promise<string | null> {
  const session = await getSession();
  return session?.role === "rep" ? session.subject : null;
}

export {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  checkAdminPassword,
  checkPassword,
  createAdminSession,
  createRepSession,
  createSession,
  createSessionToken,
  hashPassword,
  readSession,
  verifyPasswordHash,
  verifySessionToken,
};
export type { Role, Session };
