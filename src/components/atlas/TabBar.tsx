import { List, Map as MapIcon, Waypoints } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAtlas, type ViewMode } from "@/store/atlas";

const TABS: { id: ViewMode; label: string; icon: typeof MapIcon }[] = [
  { id: "map", label: "Map", icon: MapIcon },
  { id: "ladder", label: "Chains", icon: Waypoints },
  { id: "library", label: "Library", icon: List },
];

export function TabBar() {
  const view = useAtlas((s) => s.view);
  const setView = useAtlas((s) => s.setView);
  const select = useAtlas((s) => s.select);
  const selectedId = useAtlas((s) => s.selectedId);
  const paletteOpen = useAtlas((s) => s.paletteOpen);

  if (paletteOpen) return null;

  return (
    <nav
      className="z-40 shrink-0 border-t border-border bg-bg/95 backdrop-blur-sm md:hidden"
      style={{
        paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <ul className="grid grid-cols-3">
        {TABS.map((tab) => {
          const on = view === tab.id;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => {
                  if (on && selectedId) {
                    select(null);
                    return;
                  }
                  setView(tab.id);
                }}
                className={cn(
                  "flex h-14 w-full flex-col items-center justify-center gap-0.5 text-xs",
                  on ? "text-fg" : "text-subtle",
                )}
              >
                <tab.icon className="size-5" strokeWidth={on ? 2.4 : 1.8} />
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
