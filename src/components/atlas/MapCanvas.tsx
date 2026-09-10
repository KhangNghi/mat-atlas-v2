import { useEffect, useMemo, useRef, useState } from "react";
import { EDGES } from "@/data";
import { layoutAtlas } from "@/data/layout";
import type { LaidOutNode } from "@/data/types";
import { domainColor } from "@/lib/domain-color";
import { useAtlas } from "@/store/atlas";

export function MapCanvas() {
  const selectedId = useAtlas((s) => s.selectedId);
  const select = useAtlas((s) => s.select);
  const toggleExpanded = useAtlas((s) => s.toggleExpanded);
  const expanded = useAtlas((s) => s.expanded);
  const cam = useAtlas((s) => s.cam);
  const setCam = useAtlas((s) => s.setCam);
  const giFilter = useAtlas((s) => s.giFilter);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{ cx: number; cy: number; x: number; y: number } | null>(null);
  const moved = useRef(false);
  const lastTap = useRef(0);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const nodes = useMemo(() => layoutAtlas(new Set(expanded)), [expanded]);
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const visible = useMemo(() => {
    if (giFilter === "all") return nodes;
    return nodes.filter((n) => {
      const g = n.skill.gi;
      if (n.skill.kind === "hub" || n.skill.kind === "domain" || n.skill.kind === "group") return true;
      if (giFilter === "gi") return g !== "nogi";
      return g !== "gi";
    });
  }, [nodes, giFilter]);

  const vis = useMemo(() => new Set(visible.map((n) => n.id)), [visible]);

  const lines = useMemo(() => {
    const out: { a: LaidOutNode; b: LaidOutNode }[] = [];
    for (const [x, y] of EDGES) {
      if (!vis.has(x) || !vis.has(y)) continue;
      const a = byId[x];
      const b = byId[y];
      if (a && b) out.push({ a, b });
    }
    return out;
  }, [byId, vis]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { cx: cam.x, cy: cam.y, x: e.clientX, y: e.clientY };
    moved.current = false;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.hypot(dx, dy) > 8) moved.current = true;
    setCam({ x: d.cx + dx, y: d.cy + dy, k: cam.k });
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const next = Math.min(2.4, Math.max(0.35, cam.k * factor));
    setCam({ x: cam.x, y: cam.y, k: next });
  }

  function onDoubleClick() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setCam({ x: 0, y: 0, k: 1 });
  }

  function onNodeClick(n: LaidOutNode, e: React.MouseEvent) {
    e.stopPropagation();
    if (moved.current) return;
    const now = Date.now();
    if (now - lastTap.current < 350 && n.skill.kind !== "hub") {
      toggleExpanded(n.id);
    }
    lastTap.current = now;
    select(n.id);
  }

  return (
    <div
      ref={wrap}
      className="absolute inset-0 touch-none overflow-hidden bg-bg"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
    >
      <svg className="h-full w-full" aria-label="BJJ mind map">
        <g transform={`translate(${size.w / 2 + cam.x} ${size.h / 2 + cam.y}) scale(${cam.k})`}>
          {lines.map(({ a, b }) => (
            <line
              key={`${a.id}-${b.id}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--color-border-strong)"
              strokeWidth="1"
              opacity="0.7"
            />
          ))}
          {visible.map((n) => {
            const domain = n.skill.domain === "hub" ? "fundamentals" : n.skill.domain;
            const fill = domainColor(n.skill.kind === "hub" ? "hub" : domain);
            const on = selectedId === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                className="cursor-pointer"
                onClick={(e) => onNodeClick(n, e)}
              >
                <circle
                  r={n.r}
                  fill={n.skill.kind === "hub" ? "var(--color-bg-elevated)" : "var(--color-bg)"}
                  stroke={fill}
                  strokeWidth={on ? 3 : n.skill.kind === "hub" ? 2.4 : 1.6}
                />
                <text
                  y={n.skill.kind === "technique" || n.skill.kind === "position" ? n.r + 12 : 4}
                  textAnchor="middle"
                  style={{
                    fontSize: n.skill.kind === "hub" ? 13 : n.skill.kind === "domain" ? 11 : 9,
                    fontFamily:
                      n.skill.kind === "hub" || n.skill.kind === "domain"
                        ? "var(--font-display)"
                        : "var(--font-sans)",
                    fill: "var(--color-fg)",
                  }}
                >
                  {n.skill.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
