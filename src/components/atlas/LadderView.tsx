import { ChevronRight, MapPinned } from "lucide-react";
import { CHAINS } from "@/data/chains";
import { SKILL_BY_ID } from "@/data";
import { useAtlas } from "@/store/atlas";
import { domainColor } from "@/lib/domain-color";
import { videoOf } from "@/data/videos";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LadderView() {
  const select = useAtlas((s) => s.select);
  const reveal = useAtlas((s) => s.reveal);
  const selectedId = useAtlas((s) => s.selectedId);
  const highlightedChain = useAtlas((s) => s.highlightedChain);
  const setHighlightedChain = useAtlas((s) => s.setHighlightedChain);
  const active = CHAINS.find((c) => c.id === highlightedChain) ?? CHAINS[0];

  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border p-3 md:block">
        <p className="mb-2 px-2 text-xs uppercase tracking-wider text-subtle">Twelve chains</p>
        {CHAINS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setHighlightedChain(c.id)}
            className={cn(
              "mb-1 w-full rounded-lg px-3 py-2.5 text-left",
              active?.id === c.id ? "bg-surface text-fg" : "text-muted hover:text-fg",
            )}
          >
            <p className="text-sm font-medium">{c.name}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-subtle">{c.blurb}</p>
          </button>
        ))}
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 md:px-8">
        <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar md:hidden">
          {CHAINS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setHighlightedChain(c.id)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3 text-xs",
                active?.id === c.id ? "bg-accent text-accent-fg" : "border border-border text-muted",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {active ? (
          <article className="mx-auto max-w-2xl">
            <h2 className="font-display text-3xl tracking-tight text-fg">{active.name}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">{active.blurb}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setHighlightedChain(active.id);
                const first = active.steps[0];
                if (first) reveal(first);
              }}
            >
              <MapPinned className="size-4" />
              Walk this on the map
            </Button>

            <ol className="relative mt-8 space-y-0">
              <span className="absolute bottom-4 left-[15px] top-4 w-px bg-border" />
              {active.steps.map((id, i) => {
                const s = SKILL_BY_ID[id];
                if (!s) return null;
                const on = selectedId === id;
                const domain = s.domain === "hub" ? "fundamentals" : s.domain;
                return (
                  <li key={id} className="relative flex gap-4 pb-6">
                    <span
                      className={cn(
                        "relative z-[1] grid size-8 shrink-0 place-items-center rounded-full border text-xs font-mono tabular-nums",
                        on
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-border bg-bg text-subtle",
                      )}
                    >
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => select(id)}
                      className={cn(
                        "min-w-0 flex-1 rounded-xl border p-4 text-left transition-colors duration-[var(--motion-quick)]",
                        on
                          ? "border-border-strong bg-surface"
                          : "border-border bg-bg-elevated hover:border-border-strong",
                      )}
                    >
                      <p className="flex items-center gap-2 text-sm font-medium text-fg">
                        <span className="size-2 rounded-full" style={{ background: domainColor(domain) }} />
                        {s.name}
                        {videoOf(id) ? <span className="text-xs font-normal text-subtle">Clip</span> : null}
                      </p>
                      <p className="mt-1 text-sm text-muted">{s.summary}</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs text-subtle">
                        Open
                        <ChevronRight className="size-3" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </article>
        ) : null}
      </div>
    </div>
  );
}
