import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SKILL_BY_ID } from "@/data";
import { drillFocusFor } from "@/data/layout";
import type { DomainId, Level } from "@/data/types";

export type ViewMode = "map" | "ladder" | "library";
export type Proficiency = "unseen" | "training" | "solid";

interface AtlasState {
  view: ViewMode;
  selectedId: string | null;
  focusId: string;
  query: string;
  giFilter: "all" | "gi" | "nogi";
  levelFilter: Level | "all";
  domainFilter: DomainId | "all";
  savedOnly: boolean;
  bookmarks: string[];
  recents: string[];
  paletteOpen: boolean;
  status: Record<string, Proficiency>;
  introDismissed: boolean;
  highlightedChain: string | null;
  flyNonce: number;
  select: (id: string | null) => void;
  focusOn: (id: string) => void;
  reveal: (id: string) => void;
  goUp: () => void;
  setView: (view: ViewMode) => void;
  setQuery: (query: string) => void;
  setGiFilter: (gi: "all" | "gi" | "nogi") => void;
  setLevelFilter: (level: Level | "all") => void;
  setDomainFilter: (domain: DomainId | "all") => void;
  setSavedOnly: (on: boolean) => void;
  toggleBookmark: (id: string) => void;
  setPaletteOpen: (open: boolean) => void;
  setStatus: (id: string, status: Proficiency) => void;
  dismissIntro: () => void;
  setHighlightedChain: (id: string | null) => void;
  requestFit: () => void;
}

function rec(id: string, list: string[]) {
  return [id, ...list.filter((x) => x !== id)].slice(0, 16);
}

export const useAtlas = create<AtlasState>()(
  persist(
    (set, get) => ({
      view: "map",
      selectedId: null,
      focusId: "bjj",
      query: "",
      giFilter: "all",
      levelFilter: "all",
      domainFilter: "all",
      savedOnly: false,
      bookmarks: [],
      recents: [],
      paletteOpen: false,
      status: {},
      introDismissed: false,
      highlightedChain: null,
      flyNonce: 0,
      select: (id) =>
        set((s) => ({
          selectedId: id,
          recents: id ? rec(id, s.recents) : s.recents,
          paletteOpen: false,
        })),
      focusOn: (id) => {
        if (!SKILL_BY_ID[id]) return;
        set((s) => ({
          focusId: id,
          selectedId: id,
          recents: rec(id, s.recents),
          paletteOpen: false,
          flyNonce: s.flyNonce + 1,
          view: "map",
        }));
      },
      reveal: (id) => {
        if (!SKILL_BY_ID[id]) return;
        const focusId = drillFocusFor(id);
        set((s) => ({
          selectedId: id,
          focusId,
          view: "map",
          recents: rec(id, s.recents),
          paletteOpen: false,
          query: "",
          flyNonce: s.flyNonce + 1,
        }));
      },
      goUp: () => {
        const { focusId, selectedId } = get();
        if (selectedId && selectedId !== focusId) {
          set({ selectedId: focusId });
          return;
        }
        const cur = SKILL_BY_ID[focusId];
        const parent = cur?.parent;
        if (!parent) {
          set({ selectedId: null });
          return;
        }
        set((s) => ({
          focusId: parent,
          selectedId: parent,
          flyNonce: s.flyNonce + 1,
        }));
      },
      setView: (view) => set({ view }),
      setQuery: (query) => set({ query }),
      setGiFilter: (giFilter) => set({ giFilter }),
      setLevelFilter: (levelFilter) => set({ levelFilter }),
      setDomainFilter: (domainFilter) => set({ domainFilter }),
      setSavedOnly: (savedOnly) => set({ savedOnly }),
      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id)
            ? s.bookmarks.filter((x) => x !== id)
            : [...s.bookmarks, id],
        })),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      setStatus: (id, status) => set((s) => ({ status: { ...s.status, [id]: status } })),
      dismissIntro: () => set({ introDismissed: true }),
      setHighlightedChain: (highlightedChain) => set({ highlightedChain }),
      requestFit: () => set((s) => ({ flyNonce: s.flyNonce + 1 })),
    }),
    {
      name: "atlas-v2",
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


