import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="display-number text-[140px] text-ink-faint/30 leading-none mb-4">
          404
        </div>
        <div className="eyebrow text-brand-ink mb-3">Off the grid</div>
        <h1 className="text-2xl font-medium tracking-tight text-ink mb-3">
          That page is not on file.
        </h1>
        <p className="text-[13px] text-ink-dim mb-8 leading-relaxed">
          The route you tried to reach doesn&apos;t exist in this terminal.
          Head back to the inbox and pick up where you left off.
        </p>
        <Button asChild>
          <Link href="/dashboard">Return to inbox</Link>
        </Button>
      </div>
    </div>
  );
}
