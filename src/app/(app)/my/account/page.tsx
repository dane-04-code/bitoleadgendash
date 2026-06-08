import { redirect } from "next/navigation";
import { Mail, Send, MapPin } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getRepById } from "@/lib/queries";
import { PageHeader, MetaItem } from "@/components/page-header";
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

  return (
    <div className="animate-fade-in">
      <PageHeader
        number="02"
        eyebrow="Lead Intelligence Terminal / Account"
        title={
          <>
            Your <em className="text-brand-ink">account</em>.
          </>
        }
        subtitle="Update your profile and change your sign-in password. Your name and email are managed by the admin."
        meta={
          <>
            <MetaItem label="Signed in as" value={rep.email} />
            <MetaItem
              label="Status"
              value={rep.is_active ? "Active" : "Inactive"}
              accent={rep.is_active}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        {/* MAIN */}
        <div className="space-y-10 min-w-0">
          <section>
            <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-line">
              <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
                A
              </span>
              <h2 className="display-serif text-xl text-ink leading-none">
                Profile
              </h2>
            </div>
            <div className="border border-line bg-surface p-5">
              <RepProfileForm
                fullName={rep.full_name}
                email={rep.email}
                telegramUsername={rep.telegram_username}
                speciality={rep.speciality}
                territory={rep.territory}
              />
            </div>
          </section>

          <section>
            <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-line">
              <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
                B
              </span>
              <h2 className="display-serif text-xl text-ink leading-none">
                Password
              </h2>
            </div>
            <div className="border border-line bg-surface p-5">
              <ChangePasswordForm />
            </div>
          </section>
        </div>

        {/* SIDE */}
        <aside>
          <div className="border border-line bg-surface p-5 sticky top-20">
            <div className="flex items-start gap-3 mb-4">
              <div className="display-serif text-xl text-ink-2 w-10 h-10 border border-line-strong flex items-center justify-center shrink-0 bg-surface-2">
                {initials(rep.full_name)}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-ink truncate">
                  {rep.full_name}
                </div>
                {rep.speciality && (
                  <div className="text-[12px] text-ink-dim truncate">
                    {rep.speciality}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5 pt-3 border-t border-line mono text-[11px]">
              <div className="flex items-center gap-2 text-ink-2 truncate">
                <Mail className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
                <span className="truncate">{rep.email}</span>
              </div>
              {rep.telegram_username && (
                <div className="flex items-center gap-2 text-ink-dim truncate">
                  <Send className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
                  <span className="truncate">{rep.telegram_username}</span>
                </div>
              )}
              {rep.territory && (
                <div className="flex items-center gap-2 text-ink-dim truncate">
                  <MapPin className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
                  <span className="truncate">{rep.territory}</span>
                </div>
              )}
            </div>
            <div className="pt-4 mt-4 border-t border-line">
              <p className="text-[11px] text-ink-faint leading-relaxed">
                Need to change your name, email, or territory? Ping your admin —
                only they can update those fields.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
