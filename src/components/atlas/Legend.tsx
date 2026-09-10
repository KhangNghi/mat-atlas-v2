import { DOMAIN_META, type DomainId } from "@/data/types";
import { DOMAINS } from "@/data";
import { domainColor } from "@/lib/domain-color";
import { useAtlas } from "@/store/atlas";
import { cn } from "@/lib/utils";

export function Legend() {
  const domainFilter = useAtlas((s) => s.domainFilter);
  const setDomainFilter = useAtlas((s) => s.setDomainFilter);

  return (
    <aside className="pointer-events-none absolute bottom-3 left-3 z-10 hidden max-w-xs md:block">
      <div className="pointer-events-auto rounded-lg border border-border bg-bg/90 p-3 backdrop-blur-sm">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-subtle">Domains</p>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
          {DOMAINS.map((d) => {
            const id = d.domain === "hub" ? "fundamentals" : d.domain;
            const on = domainFilter === id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setDomainFilter(on ? "all" : (id as DomainId))}
                  className={cn(
                    "flex w-full items-center gap-2 py-0.5 text-left text-xs",
                    on ? "text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: domainColor(id as DomainId) }}
                  />
                  {DOMAIN_META[id as DomainId]?.label ?? d.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
