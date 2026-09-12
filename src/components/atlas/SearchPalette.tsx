import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CHAINS } from "@/data/chains";
import { searchSkills, SKILL_BY_ID } from "@/data";
import { KIND_LABEL } from "@/data/types";
import { Input } from "@/components/ui/input";
import { domainColor } from "@/lib/domain-color";
import { useAtlas } from "@/store/atlas";
import { cn } from "@/lib/utils";

export function SearchPalette() {
  const open = useAtlas((s) => s.paletteOpen);
  const setOpen = useAtlas((s) => s.setPaletteOpen);
  const query = useAtlas((s) => s.query);
  const setQuery = useAtlas((s) => s.setQuery);
  const reveal = useAtlas((s) => s.reveal);
  const setView = useAtlas((s) => s.setView);
  const setHighlightedChain = useAtlas((s) => s.setHighlightedChain);
  const recents = useAtlas((s) => s.recents);
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(0);
  const [vv, setVv] = useState({ top: 0, height: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
        e.preventDefault();
        setOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setActive(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const v = window.visualViewport;
    if (!v) return;
    const sync = () => setVv({ top: v.offsetTop, height: v.height });
    sync();
    v.addEventListener("resize", sync);
    v.addEventListener("scroll", sync);
    return () => {
      v.removeEventListener("resize", sync);
      v.removeEventListener("scroll", sync);
    };
  }, [open]);

  const skills = useMemo(() => {
    if (query.trim()) return searchSkills(query).slice(0, 18);
    return recents.map((id) => SKILL_BY_ID[id]).filter(Boolean).slice(0, 10);
  }, [query, recents]);

  const chains = useMemo(() => {
    const n = query.trim().toLowerCase();
    if (!n) return [];
    return CHAINS.filter((c) => `${c.name} ${c.blurb}`.toLowerCase().includes(n)).slice(0, 4);
  }, [query]);

  type Row =
    | { type: "skill"; id: string }
    | { type: "chain"; id: string };

  const rows: Row[] = [
    ...skills.filter(Boolean).map((s) => ({ type: "skill" as const, id: s!.id })),
    ...chains.map((c) => ({ type: "chain" as const, id: c.id })),
  ];

  function pick(row: Row) {
    if (row.type === "skill") reveal(row.id);
    else {
      const c = CHAINS.find((x) => x.id === row.id);
      setHighlightedChain(row.id);
      setView("ladder");
      setOpen(false);
      if (c?.steps[0]) reveal(c.steps[0]);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(rows.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[active];
      if (row) pick(row);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  if (!open) return null;

  const compactStyle = vv.height > 0 ? { top: vv.top, height: vv.height } : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-bg md:items-start md:justify-center md:bg-bg/70 md:px-4 md:pt-24"
      style={compactStyle}
      onClick={() => setOpen(false)}
    >
      <div
        className="flex h-full w-full flex-col bg-bg md:h-auto md:max-h-[min(32rem,80vh)] md:max-w-lg md:overflow-hidden md:rounded-xl md:border md:border-border md:bg-bg-elevated md:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-subtle" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search skills, aka, chains"
            className="h-12 border-0 bg-transparent focus-visible:ring-0"
          />
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="grid size-10 place-items-center text-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {!query.trim() && recents.length > 0 ? (
            <li className="px-3 pb-1 pt-2 text-xs uppercase tracking-wider text-subtle">Recent</li>
          ) : null}
          {rows.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted">No matches.</li>
          ) : (
            rows.map((row, i) => {
              if (row.type === "chain") {
                const c = CHAINS.find((x) => x.id === row.id);
                if (!c) return null;
                return (
                  <li key={`c-${c.id}`}>
                    <button
                      type="button"
                      onClick={() => pick(row)}
                      className={cn(
                        "flex w-full flex-col rounded-md px-3 py-2.5 text-left",
                        i === active ? "bg-surface" : "hover:bg-surface",
                      )}
                    >
                      <span className="text-sm text-fg">{c.name}</span>
                      <span className="text-xs text-subtle">Chain · {c.steps.length} steps</span>
                    </button>
                  </li>
                );
              }
              const s = SKILL_BY_ID[row.id];
              if (!s) return null;
              const domain = s.domain === "hub" ? "fundamentals" : s.domain;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => pick(row)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-left",
                      i === active ? "bg-surface" : "hover:bg-surface",
                    )}
                  >
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ background: domainColor(domain) }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-fg">{s.name}</span>
                      <span className="block truncate text-xs text-subtle">
                        {KIND_LABEL[s.kind]} · {s.summary}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <p className="hidden border-t border-border px-3 py-2 text-xs text-subtle md:block">
          ↑↓ to move · Enter to open · Esc to close
        </p>
      </div>
    </div>
  );
}
