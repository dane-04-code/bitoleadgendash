import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client.
 *
 * Prefers `SUPABASE_SERVICE_ROLE_KEY`, which bypasses row-level security. That
 * is deliberate: all reads and writes in this app happen on the server (server
 * actions, route handlers and `src/lib/queries.ts` — audited, the browser
 * client in `./browser.ts` has no callers), and authorization is enforced in
 * application code. Holding the service-role key here is what lets the anon key
 * be locked out by deny-by-default RLS policies without taking the app down.
 *
 * This key MUST NOT be exposed to the browser. It is intentionally not prefixed
 * `NEXT_PUBLIC_`, and this module must only ever be imported from server code.
 *
 * Falls back to the anon key when the service-role key is absent, so local and
 * existing deployments keep working — but once RLS is enabled with
 * deny-anon-by-default policies, that fallback will fail to read anything. See
 * V2_PLAN.md §6.
 */
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceRoleKey ?? anonKey;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL, or both SUPABASE_SERVICE_ROLE_KEY and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY, in env."
    );
  }

  if (!serviceRoleKey) {
    console.warn(
      "[supabase] SUPABASE_SERVICE_ROLE_KEY is not set — falling back to the " +
        "anon key. Reads will break once RLS is enabled. See V2_PLAN.md §6."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
