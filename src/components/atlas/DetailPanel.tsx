import { Bookmark, ChevronLeft, ChevronRight, MapPinned, X } from "lucide-react";
import { CHAINS } from "@/data/chains";
import { SKILL_BY_ID, ancestorsOf, childrenOf, neighborsOf, siblingsOf } from "@/data";
import { canDrill } from "@/data/layout";
import { videoOf } from "@/data/videos";
import { DOMAIN_META, GI_LABEL, KIND_LABEL, LEVEL_LABEL } from "@/data/types";
import { TechniqueClip } from "./TechniqueClip";
import { Button } from "@/components/ui/button";
import { domainColor } from "@/lib/domain-color";
import { cn } from "@/lib/utils";
import { useAtlas, type Proficiency } from "@/store/atlas";
import type { Skill } from "@/data/types";

export function DetailPanel() {
  const id = useAtlas((s) => s.selectedId);
  const select = useAtlas((s) => s.select);
  const focusOn = useAtlas((s) => s.focusOn);
  const reveal = useAtlas((s) => s.reveal);
  const toggleBookmark = useAtlas((s) => s.toggleBookmark);
  const bookmarks = useAtlas((s) => s.bookmarks);
  const status = useAtlas((s) => (id ? s.status[id] : undefined));
  const setStatus = useAtlas((s) => s.setStatus);
  const setHighlightedChain = useAtlas((s) => s.setHighlightedChain);
  const setView = useAtlas((s) => s.setView);
  const focusId = useAtlas((s) => s.focusId);
  const skill = id ? SKILL_BY_ID[id] : null;
  if (!skill) return null;

  const saved = bookmarks.includes(skill.id);
  const domain = skill.domain === "hub" ? "fundamentals" : skill.domain;
  const from = (skill.from ?? []).map((x) => SKILL_BY_ID[x]).filter(Boolean) as Skill[];
  const connected = neighborsOf(skill.id).slice(0, 14);
  const kids = childrenOf(skill.id);
  const crumbs = [...ancestorsOf(skill.id)].reverse();
  const chains = CHAINS.filter((c) => c.steps.includes(skill.id));
  const sibs = siblingsOf(skill.id);
  const idx = sibs.findIndex((s) => s.id === skill.id);
  const prev = idx > 0 ? sibs[idx - 1] : null;
  const next = idx >= 0 && idx < sibs.length - 1 ? sibs[idx + 1] : null;
  const drillable = canDrill(skill.id);

  return (
    <div key={skill.id} className="atlas-panel flex h-full min-h-0 flex-col bg-bg-elevated">
      <div className="flex items-start gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-subtle">
            {crumbs.map((c, i) => (
              <span key={c.id}>
                {i > 0 ? " / " : null}
                <button type="button" className="hover:text-fg" onClick={() => focusOn(c.id)}>
                  {c.name}
                </button>
              </span>
            ))}
          </p>
          <h2 className="font-display text-2xl leading-tight tracking-tight text-fg">{skill.name}</h2>
          <p className="mt-1 text-xs text-muted">
            {KIND_LABEL[skill.kind]} · {GI_LABEL[skill.gi]} · {LEVEL_LABEL[skill.level]}
            {DOMAIN_META[domain] ? ` · ${DOMAIN_META[domain].label}` : null}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Bookmark"
          onClick={() => toggleBookmark(skill.id)}
        >
          <Bookmark className={cn("size-4", saved && "fill-accent text-accent")} />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => select(null)}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <span className="mb-3 inline-block size-2 rounded-full" style={{ background: domainColor(domain) }} />
        <p className="text-sm text-fg">{skill.summary}</p>

        {videoOf(skill.id) ? <TechniqueClip id={skill.id} /> : null}

        {drillable && focusId !== skill.id ? (
          <Button className="mt-4 w-full" onClick={() => focusOn(skill.id)}>
            Step into {skill.name}
          </Button>
        ) : !drillable ? (
          <Button variant="outline" className="mt-4 w-full" onClick={() => reveal(skill.id)}>
            <MapPinned className="size-4" />
            Show on map
          </Button>
        ) : null}

        {skill.mechanics && skill.mechanics.length > 0 ? (
          <section className="mt-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-subtle">Mechanics</h3>
            <ol className="mt-2 space-y-2">
              {skill.mechanics.map((m, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted">
                  <span className="w-4 shrink-0 font-mono text-xs text-subtle tabular-nums">{i + 1}</span>
                  {m}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {skill.mistakes && skill.mistakes.length > 0 ? (
          <section className="mt-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-subtle">Common mistakes</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              {skill.mistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {skill.aka && skill.aka.length > 0 ? (
          <p className="mt-4 text-xs text-subtle">Also: {skill.aka.join(", ")}</p>
        ) : null}

        <section className="mt-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-subtle">On the mat</h3>
          <div className="mt-2 flex gap-1">
            {(["unseen", "training", "solid"] as Proficiency[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setStatus(skill.id, p)}
                className={cn(
                  "h-9 rounded-full px-3 text-xs capitalize",
                  (status ?? "unseen") === p
                    ? "bg-accent text-accent-fg"
                    : "border border-border text-muted hover:text-fg",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {from.length > 0 ? <ChipRow title="From" items={from} onPick={reveal} /> : null}
        {connected.length > 0 ? <ChipRow title="Connected" items={connected} onPick={reveal} /> : null}
        {kids.length > 0 ? <ChipRow title="Inside" items={kids} onPick={reveal} /> : null}

        {chains.length > 0 ? (
          <section className="mt-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-subtle">Chains</h3>
            <ul className="mt-2 space-y-2">
              {chains.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setHighlightedChain(c.id);
                      setView("ladder");
                    }}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-left hover:border-border-strong"
                  >
                    <p className="text-sm font-medium text-fg">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{c.blurb}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {sibs.length > 1 ? (
        <div className="flex items-center gap-2 border-t border-border px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!prev}
            onClick={() => prev && select(prev.id)}
            aria-label="Previous sibling"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden max-w-[7rem] truncate sm:inline">{prev?.name ?? "—"}</span>
          </Button>
          <span className="ml-auto" />
          <Button
            variant="ghost"
            size="sm"
            disabled={!next}
            onClick={() => next && select(next.id)}
            aria-label="Next sibling"
          >
            <span className="hidden max-w-[7rem] truncate sm:inline">{next?.name ?? "—"}</span>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ChipRow({
  title,
  items,
  onPick,
}: {
  title: string;
  items: Skill[];
  onPick: (id: string) => void;
}) {
  return (
    <section className="mt-5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-subtle">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(s.id)}
            className="h-8 rounded-full border border-border px-3 text-xs text-muted hover:text-fg"
          >
            {s.name}
          </button>
        ))}
      </div>
    </section>
  );
}
