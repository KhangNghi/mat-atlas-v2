import { X } from "lucide-react";
import { DOMAIN_META, LEVEL_LABEL, type DomainId, type Level } from "@/data/types";
import { DOMAINS } from "@/data";
import { Button } from "@/components/ui/button";
import { useAtlas } from "@/store/atlas";
import { cn } from "@/lib/utils";

export function MobileFilters({ open, onClose }: { open: boolean; onClose: () => void }) {
  const giFilter = useAtlas((s) => s.giFilter);
  const setGiFilter = useAtlas((s) => s.setGiFilter);
  const levelFilter = useAtlas((s) => s.levelFilter);
  const setLevelFilter = useAtlas((s) => s.setLevelFilter);
  const domainFilter = useAtlas((s) => s.domainFilter);
  const setDomainFilter = useAtlas((s) => s.setDomainFilter);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-bg/80 md:hidden" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-border bg-bg-elevated p-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-xl">Filters</p>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <p className="text-xs uppercase tracking-wider text-subtle">Gi</p>
        <div className="mt-2 flex gap-2">
          {(["all", "gi", "nogi"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGiFilter(g)}
              className={cn(
                "h-11 rounded-full px-4 text-sm",
                giFilter === g ? "bg-accent text-accent-fg" : "border border-border text-muted",
              )}
            >
              {g === "all" ? "All" : g === "gi" ? "Gi" : "No-Gi"}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs uppercase tracking-wider text-subtle">Level</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip on={levelFilter === "all"} onClick={() => setLevelFilter("all")}>
            All
          </Chip>
          {(Object.keys(LEVEL_LABEL) as Level[]).map((lv) => (
            <Chip key={lv} on={levelFilter === lv} onClick={() => setLevelFilter(lv)}>
              {LEVEL_LABEL[lv]}
            </Chip>
          ))}
        </div>
        <p className="mt-4 text-xs uppercase tracking-wider text-subtle">Domain</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip on={domainFilter === "all"} onClick={() => setDomainFilter("all")}>
            All
          </Chip>
          {DOMAINS.map((d) => {
            const id = (d.domain === "hub" ? "fundamentals" : d.domain) as DomainId;
            return (
              <Chip key={d.id} on={domainFilter === id} onClick={() => setDomainFilter(id)}>
                {DOMAIN_META[id]?.label ?? d.name}
              </Chip>
            );
          })}
        </div>
        <Button className="mt-5 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-full px-3 text-sm",
        on ? "bg-accent text-accent-fg" : "border border-border text-muted",
      )}
    >
      {children}
    </button>
  );
}
