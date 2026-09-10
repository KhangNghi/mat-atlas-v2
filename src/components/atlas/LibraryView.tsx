import { SKILLS, DOMAINS } from "@/data";
import { videoOf } from "@/data/videos";
import { GI_LABEL, KIND_LABEL, type DomainId } from "@/data/types";
import { domainColor } from "@/lib/domain-color";
import { useAtlas } from "@/store/atlas";
import { cn } from "@/lib/utils";

export function LibraryView() {
  const select = useAtlas((s) => s.select);
  const giFilter = useAtlas((s) => s.giFilter);
  const levelFilter = useAtlas((s) => s.levelFilter);
  const domainFilter = useAtlas((s) => s.domainFilter);
  const bookmarks = useAtlas((s) => s.bookmarks);
  const query = useAtlas((s) => s.query);
  const setDomainFilter = useAtlas((s) => s.setDomainFilter);

  const list = SKILLS.filter((s) => {
    if (s.kind === "hub" || s.kind === "domain" || s.kind === "group") return false;
    if (giFilter === "gi" && s.gi === "nogi") return false;
    if (giFilter === "nogi" && s.gi === "gi") return false;
    if (levelFilter !== "all" && s.level !== levelFilter) return false;
    if (domainFilter !== "all" && s.domain !== domainFilter) return false;
    if (query.trim()) {
      const hay = `${s.name} ${s.summary}`.toLowerCase();
      if (!hay.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-3 py-4 md:px-6">
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip label="All" on={domainFilter === "all"} onClick={() => setDomainFilter("all")} />
        {DOMAINS.map((d) => {
          const id = d.domain === "hub" ? "fundamentals" : (d.domain as DomainId);
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
      </div>

      {bookmarks.length > 0 ? (
        <p className="mb-3 text-xs text-subtle">{bookmarks.length} bookmarked</p>
      ) : null}

      {DOMAINS.map((domainNode) => {
        const id = domainNode.domain === "hub" ? "fundamentals" : domainNode.domain;
        const items = list.filter((s) => s.domain === id);
        if (items.length === 0) return null;
        return (
          <section key={domainNode.id} className="mb-8">
            <h2 className="font-display text-2xl tracking-tight text-fg">{domainNode.name}</h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {items.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => select(s.id)}
                    className="flex w-full flex-col rounded-lg border border-border bg-bg-elevated p-3 text-left transition-colors duration-[var(--motion-quick)] hover:border-border-strong hover:bg-surface"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{
                          background: domainColor(s.domain === "hub" ? "fundamentals" : s.domain),
                        }}
                      />
                      <span className="font-display text-lg leading-tight tracking-tight">{s.name}</span>
                    </span>
                    {videoOf(s.id) ? (
                      <span className="mt-1 text-xs text-subtle">Has technique video</span>
                    ) : null}
                    <p className="mt-1 line-clamp-3 text-sm text-muted">{s.summary}</p>
                    <p className="mt-2 text-xs text-subtle">
                      {KIND_LABEL[s.kind]} · {GI_LABEL[s.gi]}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
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
