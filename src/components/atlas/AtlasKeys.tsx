import { useEffect } from "react";
import { SKILL_BY_ID, siblingsOf } from "@/data";
import { useAtlas } from "@/store/atlas";

export function AtlasKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      const s = useAtlas.getState();
      if (s.paletteOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        s.goUp();
        return;
      }
      if (typing) return;

      if (e.key === "1") s.setView("map");
      if (e.key === "2") s.setView("ladder");
      if (e.key === "3") s.setView("library");
      if (e.key === "f" || e.key === "F") s.requestFit();
      if (e.key === "b" || e.key === "B") {
        if (s.selectedId) s.toggleBookmark(s.selectedId);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const id = s.selectedId ?? s.focusId;
        const sibs = siblingsOf(id);
        if (sibs.length < 2) return;
        e.preventDefault();
        const i = sibs.findIndex((x) => x.id === id);
        const next =
          e.key === "ArrowRight"
            ? sibs[(i + 1 + sibs.length) % sibs.length]
            : sibs[(i - 1 + sibs.length) % sibs.length];
        if (!next) return;
        if (SKILL_BY_ID[next.id]?.kind === "domain" || SKILL_BY_ID[next.id]?.kind === "group") {
          s.focusOn(next.id);
        } else {
          s.select(next.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
