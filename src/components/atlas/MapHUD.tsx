import { CornerLeftUp, Minus, Plus, Scan } from "lucide-react";
import { SKILL_BY_ID, ancestorsOf } from "@/data";
import { descendantLeafCount } from "@/data/layout";
import { Button } from "@/components/ui/button";
import { useAtlas } from "@/store/atlas";
import { cn } from "@/lib/utils";

export function MapHUD({
  onFit,
  onZoom,
}: {
  onFit: () => void;
  onZoom: (dir: 1 | -1) => void;
}) {
  const focusId = useAtlas((s) => s.focusId);
  const focusOn = useAtlas((s) => s.focusOn);
  const goUp = useAtlas((s) => s.goUp);
  const skill = SKILL_BY_ID[focusId];
  const crumbs = skill ? [...ancestorsOf(focusId)].reverse().concat(skill) : [];
  const count = descendantLeafCount(focusId);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
        <nav
          className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-bg/90 px-2 py-1 shadow-sm backdrop-blur-sm no-scrollbar"
          aria-label="Location"
        >
          {crumbs.map((c, i) => (
            <span key={c.id} className="flex shrink-0 items-center gap-1">
              {i > 0 ? <span className="text-subtle">/</span> : null}
              <button
                type="button"
                onClick={() => focusOn(c.id)}
                className={cn(
                  "h-8 rounded-full px-2.5 text-xs",
                  c.id === focusId ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
                )}
              >
                {c.name}
              </button>
            </span>
          ))}
        </nav>
      </div>

      <div
        className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-col gap-2 md:left-3 md:right-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="pointer-events-auto flex flex-col overflow-hidden rounded-lg border border-border bg-bg/90 shadow-sm backdrop-blur-sm">
          <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => onZoom(1)}>
            <Plus className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={() => onZoom(-1)}>
            <Minus className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Fit view" onClick={onFit}>
            <Scan className="size-4" />
          </Button>
          {skill?.parent ? (
            <Button variant="ghost" size="icon-sm" aria-label="Step back" onClick={goUp}>
              <CornerLeftUp className="size-4" />
            </Button>
          ) : null}
        </div>
        {skill ? (
          <p className="pointer-events-none hidden max-w-[12rem] text-xs text-subtle md:block">
            {skill.kind === "hub"
              ? "Click a domain to step in"
              : `${count} skills · Esc steps back`}
          </p>
        ) : null}
      </div>
    </>
  );
}
