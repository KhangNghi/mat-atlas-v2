import { X } from "lucide-react";
import { STATS } from "@/data";
import { useAtlas } from "@/store/atlas";

export function IntroCard() {
  const dismissed = useAtlas((s) => s.introDismissed);
  const dismiss = useAtlas((s) => s.dismissIntro);
  if (dismissed) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-4 md:top-20">
      <div className="pointer-events-auto flex max-w-lg items-start gap-3 rounded-lg border border-border bg-bg-elevated px-4 py-3 shadow-lg">
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg tracking-tight">The whole art, connected.</p>
          <p className="mt-1 text-sm text-muted">
            {STATS.skills} skills, {STATS.connections} links, {STATS.chains} chains. Drag the map,
            tap a node, or search. Library has a clip for every technique.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="grid size-8 shrink-0 place-items-center rounded-sm text-muted hover:text-fg"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
