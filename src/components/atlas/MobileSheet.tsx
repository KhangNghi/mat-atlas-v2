import { DetailPanel } from "./DetailPanel";
import { useAtlas } from "@/store/atlas";

export function MobileSheet() {
  const selectedId = useAtlas((s) => s.selectedId);
  const view = useAtlas((s) => s.view);
  if (!selectedId) return null;
  if (view === "library" || view === "ladder") {
    return (
      <div className="absolute inset-0 z-30 bg-bg md:hidden">
        <DetailPanel />
      </div>
    );
  }
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 flex max-h-[58%] flex-col rounded-t-xl border-t border-border bg-bg-elevated md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong" />
      <div className="min-h-0 flex-1 overflow-hidden">
        <DetailPanel />
      </div>
    </div>
  );
}
