import { DOMAIN_META, type DomainId } from "@/data/types";
import { DOMAINS } from "@/data";
import { domainColor } from "@/lib/domain-color";
import { useAtlas } from "@/store/atlas";
import { cn } from "@/lib/utils";

export function Legend() {
  const focusOn = useAtlas((s) => s.focusOn);
  const focusId = useAtlas((s) => s.focusId);

  return (
    <aside className="pointer-events-none absolute bottom-3 right-3 z-10 hidden w-44 md:block">
      <div className="pointer-events-auto rounded-xl border border-border bg-bg/90 p-3 backdrop-blur-sm">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-subtle">Jump</p>
        <ul className="grid grid-cols-1 gap-0.5">
          {DOMAINS.map((d) => {
            const id = d.domain === "hub" ? "fundamentals" : d.domain;
            const on = focusId === d.id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => focusOn(d.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-1 py-1 text-left text-xs",
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
