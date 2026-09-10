import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DetailPanel } from "@/components/atlas/DetailPanel";
import { IntroCard } from "@/components/atlas/IntroCard";
import { LadderView } from "@/components/atlas/LadderView";
import { Legend } from "@/components/atlas/Legend";
import { LibraryView } from "@/components/atlas/LibraryView";
import { MapCanvas } from "@/components/atlas/MapCanvas";
import { MobileSheet } from "@/components/atlas/MobileSheet";
import { SearchPalette } from "@/components/atlas/SearchPalette";
import { TabBar } from "@/components/atlas/TabBar";
import { TopBar } from "@/components/atlas/TopBar";
import { useAtlas } from "@/store/atlas";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const view = useAtlas((s) => s.view);
  const selectedId = useAtlas((s) => s.selectedId);
  const showDesktopPanel = Boolean(selectedId) && view !== "library";

  useEffect(() => {
    void useAtlas.persist.rehydrate();
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <TopBar />
      <IntroCard />
      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          {view === "map" ? (
            <>
              <MapCanvas />
              <Legend />
            </>
          ) : null}
          {view === "ladder" ? <LadderView /> : null}
          {view === "library" ? <LibraryView /> : null}
          <MobileSheet />
        </div>

        {showDesktopPanel ? (
          <div className="relative hidden h-full w-96 shrink-0 border-l border-border bg-bg-elevated md:block">
            <DetailPanel />
          </div>
        ) : null}
      </div>
      <TabBar />
      <SearchPalette />
    </div>
  );
}
