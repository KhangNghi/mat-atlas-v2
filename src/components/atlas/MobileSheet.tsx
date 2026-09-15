import { useRef, useState } from "react";
import { DetailPanel } from "./DetailPanel";
import { MOBILE_SHEET_MAX } from "@/lib/mobile-sheet";
import { useAtlas } from "@/store/atlas";

/** Drag distance (px) past which letting go closes the sheet. */
const DISMISS_PX = 90;
/** Flick speed (px/ms) past which letting go closes the sheet. */
const DISMISS_VEL = 0.55;

export function MobileSheet() {
  const selectedId = useAtlas((s) => s.selectedId);
  const view = useAtlas((s) => s.view);
  const select = useAtlas((s) => s.select);
  const [dragY, setDragY] = useState(0);
  const [settling, setSettling] = useState(false);
  const drag = useRef<{ id: number; y: number; t: number; lastY: number; lastT: number } | null>(
    null,
  );

  if (!selectedId) return null;

  if (view === "library" || view === "ladder") {
    return (
      <div key={selectedId} className="atlas-sheet-full absolute inset-0 z-30 bg-bg md:hidden">
        <DetailPanel />
      </div>
    );
  }

  function onHandleDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    drag.current = { id: e.pointerId, y: e.clientY, t: now, lastY: e.clientY, lastT: now };
    setSettling(false);
  }

  function onHandleMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dy = Math.max(0, e.clientY - d.y);
    d.lastY = e.clientY;
    d.lastT = performance.now();
    setDragY(dy);
  }

  function onHandleUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const dy = Math.max(0, e.clientY - d.y);
    const dt = Math.max(1, performance.now() - d.lastT);
    const v = (e.clientY - d.lastY) / dt;
    if (dy > DISMISS_PX || v > DISMISS_VEL) {
      select(null);
      setDragY(0);
      return;
    }
    setSettling(true);
    setDragY(0);
  }

  return (
    <div
      className="atlas-sheet absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl border-t border-border bg-bg-elevated md:hidden"
      style={{
        maxHeight: `${MOBILE_SHEET_MAX * 100}%`,
        paddingBottom: "env(safe-area-inset-bottom)",
        transform: dragY ? `translateY(${dragY}px)` : undefined,
        transition: settling ? "transform var(--motion-fast) var(--ease-smooth-out)" : undefined,
      }}
      onTransitionEnd={() => setSettling(false)}
    >
      <div
        className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        role="button"
        aria-label="Drag down to close"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleUp}
        onClick={() => select(null)}
      >
        <div className="h-1 w-10 rounded-full bg-border-strong" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <DetailPanel />
      </div>
    </div>
  );
}
