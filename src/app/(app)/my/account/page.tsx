import { redirect } from "next/navigation";
import { Mail, Send, MapPin } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getRepById } from "@/lib/queries";
import { StatStrip, Stat } from "@/components/stat-strip";
import { RepProfileForm } from "@/components/rep-profile-form";
import { ChangePasswordForm } from "@/components/change-password-form";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyAccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Admins don't have a personal account record — bounce to dashboard.
  if (session.role !== "rep") redirect("/dashboard");

  const rep = await getRepById(session.subject);
  if (!rep) redirect("/login");

  const forced = Boolean(rep.must_change_password);

  return (
    <div className="animate-fade-in">
      <h1 className="sr-only">Your account — profile and password</h1>

      {/* 04 matches the rail's code for Account on the rep nav. */}
      <StatStrip number="04" className="mb-5">
        <Stat label="Signed in as" value={rep.email} />
        <Stat
          label="Status"
          value={rep.is_active ? "Active" : "Inactive"}
          tone={rep.is_active ? "brand" : "quiet"}
        />
      </StatStrip>

      <p className="mb-5 max-w-2xl text-[12.5px] leading-relaxed text-ink-dim">
        Update your profile and change your sign-in password. Your name and email
        are managed by the admin.
      </p>

      {forced && (
        <div className="mb-4 rounded-lg bg-surface-2 px-4 py-3">
          <div className="mono flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-signal-hot">
            <span className="dot bg-signal-hot" />
            Temporary password
          </div>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-2">
            You&apos;re signed in with a temporary password set by your admin.
            Choose your own password below to continue to your leads.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* MAIN */}
        <div className="flex min-w-0 flex-col gap-4">
          <section className="panel p-[18px] lg:p-5">
            <h2 className="mb-3.5 text-[13.5px] font-bold text-ink">Profile</h2>
            <RepProfileForm
              fullName={rep.full_name}
              email={rep.email}
              telegramUsername={rep.telegram_username}
              speciality={rep.speciality}
              territory={rep.territory}
              availability={rep.availability ?? "looking"}
            />
          </section>

          <section className="panel p-[18px] lg:p-5">
            <h2 className="mb-3.5 text-[13.5px] font-bold text-ink">Password</h2>
            <ChangePasswordForm forced={forced} />
          </section>
        </div>

        {/* SIDE */}
        <aside>
          <section className="panel sticky top-5 p-[18px] lg:p-5">
            <div className="mb-3.5 flex items-start gap-3">
              <div className="display-serif flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-[16px] text-ink-2">
                {initials(rep.full_name)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-ink">
                  {rep.full_name}
                </div>
                {rep.speciality && (
                  <div className="truncate text-[12px] text-ink-dim">
                    {rep.speciality}
                  </div>
                )}
              </div>
            </div>
            <div className="mono space-y-1.5 border-t border-line-soft pt-3 text-[11px]">
              <div className="flex items-center gap-2 truncate text-ink-2">
                <Mail className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
                <span className="truncate">{rep.email}</span>
              </div>
              {rep.telegram_username && (
                <div className="flex items-center gap-2 truncate text-ink-dim">
                  <Send className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
                  <span className="truncate">{rep.telegram_username}</span>
                </div>
              )}
              {rep.territory && (
                <div className="flex items-center gap-2 truncate text-ink-dim">
                  <MapPin className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
                  <span className="truncate">{rep.territory}</span>
                </div>
              )}
            </div>
            <div className="mt-4 border-t border-line-soft pt-4">
              <p className="text-[11px] leading-relaxed text-ink-faint">
                Need to change your name, email, or territory? Ping your admin —
                only they can update those fields.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
