import { useState } from "react";
import {
  Bookmark,
  Expand,
  List,
  Map as MapIcon,
  Minimize2,
  Search,
  SlidersHorizontal,
  Waypoints,
} from "lucide-react";
import { STATS } from "@/data";
import { Button } from "@/components/ui/button";
import { MobileFilters } from "./MobileFilters";
import { cn } from "@/lib/utils";
import { useAtlas, type ViewMode } from "@/store/atlas";

const VIEWS: { id: ViewMode; label: string; icon: typeof MapIcon }[] = [
  { id: "map", label: "Map", icon: MapIcon },
  { id: "ladder", label: "Ladder", icon: Waypoints },
  { id: "library", label: "Library", icon: List },
];

export function TopBar() {
  const view = useAtlas((s) => s.view);
  const setView = useAtlas((s) => s.setView);
  const setPaletteOpen = useAtlas((s) => s.setPaletteOpen);
  const expandAllTechniques = useAtlas((s) => s.expandAllTechniques);
  const collapseTechniques = useAtlas((s) => s.collapseTechniques);
  const giFilter = useAtlas((s) => s.giFilter);
  const setGiFilter = useAtlas((s) => s.setGiFilter);
  const levelFilter = useAtlas((s) => s.levelFilter);
  const domainFilter = useAtlas((s) => s.domainFilter);
  const bookmarks = useAtlas((s) => s.bookmarks);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersOn = giFilter !== "all" || levelFilter !== "all" || domainFilter !== "all";

  return (
    <header
      className="flex shrink-0 items-center gap-2 border-b border-border bg-bg/90 px-3 py-2 backdrop-blur-sm md:gap-4 md:px-5 md:py-3"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
      }}
    >
      <div className="min-w-0 shrink-0">
        <p className="font-display text-xl leading-none tracking-tight text-fg md:text-2xl">
          Mat Atlas
        </p>
        <p className="mt-1 hidden text-xs text-subtle md:block">
          {STATS.skills} skills · {STATS.connections} links · {STATS.chains} chains
        </p>
      </div>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-subtle transition-colors duration-[var(--motion-quick)] hover:text-muted md:h-10 md:max-w-xl"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search techniques</span>
        <kbd className="ml-auto hidden rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs text-subtle md:inline">
          /
        </kbd>
      </button>

      <button
        type="button"
        aria-label="Filters"
        onClick={() => setFiltersOpen(true)}
        className="relative grid size-11 shrink-0 place-items-center rounded-md text-fg md:hidden"
      >
        <SlidersHorizontal className="size-5" />
        {filtersOn || bookmarks.length > 0 ? (
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
        ) : null}
      </button>

      <div className="hidden items-center gap-2 md:flex">
        <div className="flex rounded-md border border-border p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-xs",
                view === v.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
              )}
            >
              <v.icon className="size-3.5" />
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-md border border-border p-0.5">
          {(["all", "gi", "nogi"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGiFilter(g)}
              className={cn(
                "h-8 px-2.5 text-xs",
                giFilter === g ? "rounded-sm bg-surface-2 text-fg" : "text-muted",
              )}
            >
              {g === "all" ? "All" : g === "gi" ? "Gi" : "No-Gi"}
            </button>
          ))}
        </div>

        {view === "map" ? (
          <>
            <Button variant="ghost" size="icon-sm" aria-label="Expand all" onClick={expandAllTechniques}>
              <Expand className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Collapse" onClick={collapseTechniques}>
              <Minimize2 className="size-4" />
            </Button>
          </>
        ) : null}

        {bookmarks.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setView("library")}>
            <Bookmark className="size-3.5" />
            {bookmarks.length}
          </Button>
        ) : null}
      </div>

      <MobileFilters open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </header>
  );
}
