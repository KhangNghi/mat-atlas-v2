import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { searchSkills, SKILL_BY_ID } from "@/data";
import { KIND_LABEL } from "@/data/types";
import { Input } from "@/components/ui/input";
import { useAtlas } from "@/store/atlas";

export function SearchPalette() {
  const open = useAtlas((s) => s.paletteOpen);
  const setOpen = useAtlas((s) => s.setPaletteOpen);
  const query = useAtlas((s) => s.query);
  const setQuery = useAtlas((s) => s.setQuery);
  const reveal = useAtlas((s) => s.reveal);
  const recents = useAtlas((s) => s.recents);
  const inputRef = useRef<HTMLInputElement>(null);
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
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
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

  const results = useMemo(() => {
    if (query.trim()) return searchSkills(query).slice(0, 20);
    return recents.map((id) => SKILL_BY_ID[id]).filter(Boolean).slice(0, 10);
  }, [query, recents]);

  if (!open) return null;

  const compactStyle =
    vv.height > 0 ? { top: vv.top, height: vv.height } : undefined;

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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the map"
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
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted">No matches.</li>
          ) : (
            results.map((s) =>
              s ? (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => reveal(s.id)}
                    className="flex w-full flex-col rounded-md px-3 py-2.5 text-left hover:bg-surface"
                  >
                    <span className="text-sm text-fg">{s.name}</span>
                    <span className="text-xs text-subtle">
                      {KIND_LABEL[s.kind]} · {s.summary.slice(0, 80)}
                    </span>
                  </button>
                </li>
              ) : null,
            )
          )}
        </ul>
      </div>
    </div>
  );
}
