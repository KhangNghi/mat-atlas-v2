import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SKILL_BY_ID } from "@/data";
import { defaultExpanded, expandToReveal } from "@/data/layout";
import type { DomainId, Gi, Level } from "@/data/types";

export type ViewMode = "map" | "ladder" | "library";
export type Proficiency = "unseen" | "training" | "solid";

interface AtlasState {
  view: ViewMode;
  selectedId: string | null;
  query: string;
  giFilter: Gi | "all";
  levelFilter: Level | "all";
  domainFilter: DomainId | "all";
  bookmarks: string[];
  recents: string[];
  paletteOpen: boolean;
  expanded: string[];
  cam: { x: number; y: number; k: number };
  status: Record<string, Proficiency>;
  introDismissed: boolean;
  select: (id: string | null) => void;
  reveal: (id: string) => void;
  setView: (view: ViewMode) => void;
  setQuery: (query: string) => void;
  setGiFilter: (gi: Gi | "all") => void;
  setLevelFilter: (level: Level | "all") => void;
  setDomainFilter: (domain: DomainId | "all") => void;
  toggleBookmark: (id: string) => void;
  setPaletteOpen: (open: boolean) => void;
  toggleExpanded: (id: string) => void;
  expandAllTechniques: () => void;
  collapseTechniques: () => void;
  setCam: (cam: { x: number; y: number; k: number }) => void;
  setStatus: (id: string, status: Proficiency) => void;
  dismissIntro: () => void;
}

function rec(id: string, list: string[]) {
  return [id, ...list.filter((x) => x !== id)].slice(0, 12);
}

export const useAtlas = create<AtlasState>()(
  persist(
    (set) => ({
      view: "map",
      selectedId: null,
      query: "",
      giFilter: "all",
      levelFilter: "all",
      domainFilter: "all",
      bookmarks: [],
      recents: [],
      paletteOpen: false,
      expanded: defaultExpanded(),
      cam: { x: 0, y: 0, k: 1 },
      status: {},
      introDismissed: false,
      select: (id) =>
        set((s) => ({
          selectedId: id,
          recents: id ? rec(id, s.recents) : s.recents,
          paletteOpen: false,
        })),
      reveal: (id) => {
        if (!SKILL_BY_ID[id]) return;
        set((s) => ({
          selectedId: id,
          view: "map",
          expanded: expandToReveal(id, s.expanded),
          recents: rec(id, s.recents),
          paletteOpen: false,
        }));
      },
      setView: (view) => set({ view }),
      setQuery: (query) => set({ query }),
      setGiFilter: (giFilter) => set({ giFilter }),
      setLevelFilter: (levelFilter) => set({ levelFilter }),
      setDomainFilter: (domainFilter) => set({ domainFilter }),
      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id)
            ? s.bookmarks.filter((x) => x !== id)
            : [...s.bookmarks, id],
        })),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      toggleExpanded: (id) =>
        set((s) => ({
          expanded: s.expanded.includes(id)
            ? s.expanded.filter((x) => x !== id)
            : [...s.expanded, id],
        })),
      expandAllTechniques: () => set({ expanded: Object.keys(SKILL_BY_ID) }),
      collapseTechniques: () => set({ expanded: defaultExpanded() }),
      setCam: (cam) => set({ cam }),
      setStatus: (id, status) => set((s) => ({ status: { ...s.status, [id]: status } })),
      dismissIntro: () => set({ introDismissed: true }),
    }),
    {
      name: "atlas-v1",
      skipHydration: true,
      partialize: (s) => ({
        bookmarks: s.bookmarks,
        recents: s.recents,
        status: s.status,
        introDismissed: s.introDismissed,
      }),
    },
  ),
);
