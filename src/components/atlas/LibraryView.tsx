import { Bookmark, MapPinned } from "lucide-react";
import { SKILLS, DOMAINS, childrenOf, passesGi } from "@/data";
import { videoOf } from "@/data/videos";
import { GI_LABEL, KIND_LABEL, type DomainId } from "@/data/types";
import { domainColor } from "@/lib/domain-color";
import { useAtlas } from "@/store/atlas";
import { cn } from "@/lib/utils";

export function LibraryView() {
  const select = useAtlas((s) => s.select);
  const reveal = useAtlas((s) => s.reveal);
  const giFilter = useAtlas((s) => s.giFilter);
  const levelFilter = useAtlas((s) => s.levelFilter);
  const domainFilter = useAtlas((s) => s.domainFilter);
  const setDomainFilter = useAtlas((s) => s.setDomainFilter);
  const bookmarks = useAtlas((s) => s.bookmarks);
  const savedOnly = useAtlas((s) => s.savedOnly);
  const setSavedOnly = useAtlas((s) => s.setSavedOnly);
  const query = useAtlas((s) => s.query);
  const status = useAtlas((s) => s.status);
  const selectedId = useAtlas((s) => s.selectedId);

  const list = SKILLS.filter((s) => {
    if (s.kind === "hub" || s.kind === "domain" || s.kind === "group") return false;
    if (!passesGi(s, giFilter)) return false;
    if (levelFilter !== "all" && s.level !== levelFilter) return false;
    if (domainFilter !== "all" && s.domain !== domainFilter) return false;
    if (savedOnly && !bookmarks.includes(s.id)) return false;
    if (query.trim()) {
      const hay = `${s.name} ${s.summary} ${(s.aka ?? []).join(" ")}`.toLowerCase();
      if (!hay.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-52 shrink-0 overflow-y-auto border-r border-border p-3 md:block">
        <p className="mb-2 px-2 text-xs uppercase tracking-wider text-subtle">Domains</p>
        <button
          type="button"
          onClick={() => setDomainFilter("all")}
          className={cn(
            "mb-1 flex h-9 w-full items-center rounded-md px-2 text-left text-sm",
            domainFilter === "all" ? "bg-surface text-fg" : "text-muted hover:text-fg",
          )}
        >
          All
        </button>
        {DOMAINS.map((d) => {
          const id = (d.domain === "hub" ? "fundamentals" : d.domain) as DomainId;
          const n = list.filter((s) => s.domain === id).length;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setDomainFilter(id)}
              className={cn(
                "mb-0.5 flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm",
                domainFilter === id ? "bg-surface text-fg" : "text-muted hover:text-fg",
              )}
            >
              <span className="size-2 rounded-full" style={{ background: domainColor(id) }} />
              <span className="min-w-0 flex-1 truncate">{d.name}</span>
              <span className="font-mono text-xs text-subtle tabular-nums">{n}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSavedOnly(!savedOnly)}
          className={cn(
            "mt-4 flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm",
            savedOnly ? "bg-surface text-fg" : "text-muted hover:text-fg",
          )}
        >
          <Bookmark className="size-3.5" />
          Bookmarks
          <span className="ml-auto font-mono text-xs text-subtle tabular-nums">{bookmarks.length}</span>
        </button>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 md:px-6">
        <div className="mb-4 flex flex-wrap gap-2 md:hidden">
          <FilterChip label="All" on={domainFilter === "all"} onClick={() => setDomainFilter("all")} />
          {DOMAINS.map((d) => {
            const id = (d.domain === "hub" ? "fundamentals" : d.domain) as DomainId;
            return (
              <FilterChip
                key={d.id}
                label={d.name}
                on={domainFilter === id}
                color={domainColor(id)}
                onClick={() => setDomainFilter(id)}
              />
            );
          })}
          <FilterChip label="Saved" on={savedOnly} onClick={() => setSavedOnly(!savedOnly)} />
        </div>

        {list.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">Nothing matches those filters.</p>
        ) : null}

        {DOMAINS.map((domainNode) => {
          const id = domainNode.domain === "hub" ? "fundamentals" : domainNode.domain;
          const items = list.filter((s) => s.domain === id);
          if (items.length === 0) return null;
          const groups = childrenOf(domainNode.id);
          return (
            <section key={domainNode.id} className="mb-8">
              <h2 className="sticky top-0 z-[1] bg-bg/90 py-2 font-display text-2xl tracking-tight text-fg backdrop-blur-sm">
                {domainNode.name}
                <span className="ml-2 font-sans text-sm text-subtle">{items.length}</span>
              </h2>
              <ul className="mt-1 divide-y divide-border rounded-lg border border-border bg-bg-elevated">
                {items.map((s) => {
                  const st = status[s.id];
                  const group = groups.find((g) => g.id === s.parent);
                  return (
                    <li key={s.id}>
                      <div
                        className={cn(
                          "flex items-stretch gap-2",
                          selectedId === s.id ? "bg-surface" : "hover:bg-surface/60",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => select(s.id)}
                          className="min-w-0 flex-1 px-3 py-3 text-left"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ background: domainColor(s.domain === "hub" ? "fundamentals" : s.domain) }}
                            />
                            <span className="font-medium text-fg">{s.name}</span>
                            {bookmarks.includes(s.id) ? <Bookmark className="size-3 fill-accent text-accent" /> : null}
                          </span>
                          <p className="mt-1 line-clamp-2 text-sm text-muted">{s.summary}</p>
                          <p className="mt-1 text-xs text-subtle">
                            {group ? `${group.name} · ` : ""}
                            {KIND_LABEL[s.kind]} · {GI_LABEL[s.gi]}
                            {videoOf(s.id) ? " · Clip" : ""}
                            {st && st !== "unseen" ? ` · ${st}` : ""}
                          </p>
                        </button>
                        <button
                          type="button"
                          aria-label="Show on map"
                          onClick={() => reveal(s.id)}
                          className="grid w-11 shrink-0 place-items-center text-subtle hover:text-fg"
                        >
                          <MapPinned className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  on,
  onClick,
  color,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs",
        on ? "bg-accent text-accent-fg" : "border border-border text-muted hover:text-fg",
      )}
    >
      {color ? <span className="size-1.5 rounded-full" style={{ background: color }} /> : null}
      {label}
    </button>
  );
}
