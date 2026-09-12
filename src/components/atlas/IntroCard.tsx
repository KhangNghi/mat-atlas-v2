import { X } from "lucide-react";
import { STATS } from "@/data";
import { useAtlas } from "@/store/atlas";

export function IntroCard() {
  const dismissed = useAtlas((s) => s.introDismissed);
  const dismiss = useAtlas((s) => s.dismissIntro);
  const view = useAtlas((s) => s.view);
  if (dismissed || view !== "map") return null;

  return (
    <div className="flex shrink-0 items-start gap-3 border-b border-border bg-bg-elevated px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="font-display text-base tracking-tight md:text-lg">Step in. Don't get lost.</p>
        <p className="mt-0.5 text-xs text-muted md:text-sm">
          {STATS.techniques} techniques, {STATS.chains} chains. Click a domain to drill in, Esc to
          step back, / to search.
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="grid size-9 shrink-0 place-items-center rounded-sm text-muted hover:text-fg"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
