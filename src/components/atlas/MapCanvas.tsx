import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHAINS } from "@/data/chains";
import { SKILL_BY_ID, childrenOf } from "@/data";
import { canDrill, fitCamera, layoutFocus, wrapLabel } from "@/data/layout";
import type { LaidOutNode } from "@/data/types";
import { domainColor } from "@/lib/domain-color";
import { clampK, easeOutCubic, lerpCam, zoomAround, type Cam } from "@/lib/map-camera";
import { useAtlas } from "@/store/atlas";
import { MapHUD } from "./MapHUD";

function colorOf(n: LaidOutNode): string {
  if (n.skill.kind === "hub") return "var(--color-accent)";
  const d = n.skill.domain === "hub" ? "fundamentals" : n.skill.domain;
  return domainColor(d);
}

function isLeaf(n: LaidOutNode) {
  return n.skill.kind === "technique" || n.skill.kind === "position" || n.skill.kind === "concept";
}

function nodeFromEvent(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  return target.closest("[data-node]")?.getAttribute("data-node") ?? null;
}

export function MapCanvas() {
  const selectedId = useAtlas((s) => s.selectedId);
  const select = useAtlas((s) => s.select);
  const focusId = useAtlas((s) => s.focusId);
  const focusOn = useAtlas((s) => s.focusOn);
  const reveal = useAtlas((s) => s.reveal);
  const goUp = useAtlas((s) => s.goUp);
  const giFilter = useAtlas((s) => s.giFilter);
  const flyNonce = useAtlas((s) => s.flyNonce);
  const highlightedChain = useAtlas((s) => s.highlightedChain);
  const status = useAtlas((s) => s.status);
  const wrap = useRef<HTMLDivElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const cam = useRef<Cam>({ x: 0, y: 0, k: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; cam: Cam } | null>(null);
  const drag = useRef<{ x: number; y: number; cam: Cam } | null>(null);
  const vel = useRef({ x: 0, y: 0 });
  const lastMove = useRef({ t: 0, x: 0, y: 0 });
  const moved = useRef(false);
  const anim = useRef<{ from: Cam; to: Cam; t0: number; dur: number } | null>(null);
  const inertia = useRef(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [camTick, setCamTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const compact = size.w > 0 && size.w < 720;
  const layout = useMemo(() => layoutFocus(focusId, compact), [focusId, compact]);
  const nodes = layout.nodes;

  const visible = useMemo(() => {
    if (giFilter === "all") return nodes;
    return nodes.filter((n) => {
      if (n.skill.kind === "hub" || n.skill.kind === "domain" || n.skill.kind === "group") return true;
      if (giFilter === "gi") return n.skill.gi !== "nogi";
      return n.skill.gi !== "gi";
    });
  }, [nodes, giFilter]);

  const byId = useMemo(() => Object.fromEntries(visible.map((n) => [n.id, n])), [visible]);
  const drawNodes = useMemo(
    () => [...visible].sort((a, b) => a.r - b.r),
    [visible],
  );

  const chainIds = useMemo(() => {
    if (!highlightedChain) return new Set<string>();
    const c = CHAINS.find((x) => x.id === highlightedChain);
    return new Set(c?.steps ?? []);
  }, [highlightedChain]);

  const apply = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    const { x, y, k } = cam.current;
    g.setAttribute("transform", `translate(${size.w / 2 + x} ${size.h / 2 + y}) scale(${k})`);
  }, [size.w, size.h]);

  const loop = useCallback(
    (now: number) => {
      const a = anim.current;
      if (a) {
        const t = Math.min(1, (now - a.t0) / a.dur);
        cam.current = lerpCam(a.from, a.to, easeOutCubic(t));
        apply();
        if (t < 1) requestAnimationFrame(loop);
        else {
          anim.current = null;
          setCamTick((n) => n + 1);
        }
        return;
      }
      if (inertia.current) {
        cam.current.x += vel.current.x;
        cam.current.y += vel.current.y;
        vel.current.x *= 0.92;
        vel.current.y *= 0.92;
        apply();
        if (Math.hypot(vel.current.x, vel.current.y) < 0.15) inertia.current = 0;
        else requestAnimationFrame(loop);
      }
    },
    [apply],
  );

  const fly = useCallback(
    (to: Cam, dur = 380) => {
      anim.current = { from: { ...cam.current }, to, t0: performance.now(), dur };
      inertia.current = 0;
      requestAnimationFrame(loop);
    },
    [loop],
  );

  useEffect(() => {
    apply();
  }, [apply, camTick]);

  useEffect(() => {
    if (size.w < 40 || size.h < 40) return;
    const to = fitCamera(visible, size.w, size.h);
    fly(to);
  }, [focusId, flyNonce, size.w, size.h, visible, fly]);

  function isChrome(target: EventTarget | null) {
    return target instanceof Element && Boolean(target.closest("[data-hud]"));
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    moved.current = false;
    if (isChrome(e.target) || nodeFromEvent(e.target)) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    anim.current = null;
    inertia.current = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(a!.x - b!.x, a!.y - b!.y),
        cam: { ...cam.current },
      };
      drag.current = null;
    } else {
      drag.current = { x: e.clientX, y: e.clientY, cam: { ...cam.current } };
      lastMove.current = { t: performance.now(), x: e.clientX, y: e.clientY };
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const factor = dist / Math.max(pinch.current.dist, 1);
      const mx = (a!.x + b!.x) / 2;
      const my = (a!.y + b!.y) / 2;
      const rect = wrap.current?.getBoundingClientRect();
      cam.current = zoomAround(
        pinch.current.cam,
        factor,
        mx,
        my,
        (rect?.left ?? 0) + size.w / 2,
        (rect?.top ?? 0) + size.h / 2,
      );
      moved.current = true;
      apply();
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.hypot(dx, dy) > 12) moved.current = true;
    cam.current = { x: d.cam.x + dx, y: d.cam.y + dy, k: d.cam.k };
    const now = performance.now();
    const dt = Math.max(8, now - lastMove.current.t);
    vel.current = {
      x: ((e.clientX - lastMove.current.x) / dt) * 16,
      y: ((e.clientY - lastMove.current.y) / dt) * 16,
    };
    lastMove.current = { t: now, x: e.clientX, y: e.clientY };
    apply();
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
    if (pointers.current.size === 0) {
      drag.current = null;
      if (moved.current && Math.hypot(vel.current.x, vel.current.y) > 0.8) {
        inertia.current = 1;
        requestAnimationFrame(loop);
      }
    }
  }

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      anim.current = null;
      const rect = el.getBoundingClientRect();
      const factor = e.deltaY > 0 ? 0.92 : 1.09;
      cam.current = zoomAround(
        cam.current,
        factor,
        e.clientX,
        e.clientY,
        rect.left + size.w / 2,
        rect.top + size.h / 2,
      );
      apply();
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [apply, size.w, size.h]);

  function activate(n: LaidOutNode) {
    if (n.id === focusId) {
      select(n.id);
      return;
    }
    if (canDrill(n.id) && !isLeaf(n)) {
      focusOn(n.id);
      return;
    }
    if (isLeaf(n) && n.skill.parent && n.skill.parent !== focusId) {
      reveal(n.id);
      return;
    }
    select(n.id);
  }

  function onNodeActivate(n: LaidOutNode, e: React.SyntheticEvent) {
    e.stopPropagation();
    if (moved.current) return;
    activate(n);
  }

  function onSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (moved.current) return;
    if (nodeFromEvent(e.target)) return;
    select(null);
  }

  const parentSkill = layout.parentId ? SKILL_BY_ID[layout.parentId] : null;
  const parentY = -(layout.orbitR + 56);
  const hitMin = compact ? 22 : 18;

  return (
    <div
      ref={wrap}
      className="absolute inset-0 touch-none overflow-hidden bg-bg"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg className="h-full w-full" aria-label="BJJ mind map" onClick={onSvgClick}>
        {mounted && size.w > 40 ? (
        <>
        <defs>
          <radialGradient id="atlas-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-surface)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-bg)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g ref={gRef}>
          <circle
            r={layout.orbitR}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
            opacity="0.7"
            pointerEvents="none"
          />
          <circle
            r={Math.max(40, layout.orbitR * 0.45)}
            fill="url(#atlas-glow)"
            pointerEvents="none"
          />

          {parentSkill ? (
            <g
              data-node={parentSkill.id}
              transform={`translate(0 ${parentY})`}
              className="cursor-pointer"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (moved.current) return;
                goUp();
              }}
            >
              <circle r={20} fill="none" pointerEvents="all" />
              <circle
                r={14}
                fill="var(--color-bg-elevated)"
                stroke="var(--color-border-strong)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              <line
                x1="0"
                y1="14"
                x2="0"
                y2={-parentY - (byId[focusId]?.r ?? 40)}
                stroke="var(--color-border)"
                strokeDasharray="3 4"
                pointerEvents="none"
              />
              <text
                y={-22}
                textAnchor="middle"
                style={{ fontSize: 10, fill: "var(--color-muted)", fontFamily: "var(--font-sans)" }}
              >
                {parentSkill.name}
              </text>
            </g>
          ) : null}

          {visible.map((n) => {
            if (n.id === focusId) return null;
            const parent = n.skill.parent === focusId ? byId[focusId] : null;
            if (!parent) return null;
            const onChain = chainIds.has(n.id) && chainIds.has(focusId);
            return (
              <line
                key={`e-${n.id}`}
                x1={parent.x}
                y1={parent.y}
                x2={n.x}
                y2={n.y}
                stroke={onChain ? colorOf(n) : "var(--color-border-strong)"}
                strokeWidth={onChain ? 1.8 : 1}
                opacity={isLeaf(n) && n.r < 8 ? 0.25 : 0.55}
                pointerEvents="none"
              />
            );
          })}

          {drawNodes.map((n) => {
            const fill = colorOf(n);
            const on = selectedId === n.id;
            const focused = n.id === focusId;
            const onChain = chainIds.has(n.id);
            const st = status[n.id];
            const leaf = isLeaf(n);
            const tiny = n.r < 7;
            const label = tiny ? [] : wrapLabel(n.skill.name, n.skill.kind === "hub" ? 22 : compact ? 12 : 15);
            const ang = Math.atan2(n.y, n.x);
            const outside = !focused && !tiny;
            const labelDist = n.r + (compact ? 14 : 18);
            const lx = outside ? Math.cos(ang) * labelDist : 0;
            const ly = outside ? Math.sin(ang) * labelDist : leaf ? n.r + 13 : 4;
            const anchor: "start" | "middle" | "end" = !outside
              ? "middle"
              : Math.cos(ang) > 0.4
                ? "start"
                : Math.cos(ang) < -0.4
                  ? "end"
                  : "middle";
            const kids =
              compact || n.skill.kind !== "domain" && n.skill.kind !== "group"
                ? 0
                : childrenOf(n.id).length;
            const hitR = Math.max(n.r + 2, hitMin);
            const labelW = Math.min(
              150,
              Math.max(...label.map((l) => l.length), 4) * 6.4 + 12,
            );
            const labelH = label.length * 12 + (kids > 0 && !tiny ? 12 : 0) + 10;
            const labelX =
              anchor === "start" ? lx - 6 : anchor === "end" ? lx - labelW + 6 : lx - labelW / 2;
            const labelY = ly - 14;

            return (
              <g
                key={n.id}
                data-node={n.id}
                role="button"
                aria-label={n.skill.name}
                transform={`translate(${n.x} ${n.y})`}
                className="cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => onNodeActivate(n, e)}
              >
                <circle r={hitR} fill="none" pointerEvents="all" />
                {outside && label.length > 0 ? (
                  <rect
                    x={labelX}
                    y={labelY}
                    width={labelW}
                    height={labelH}
                    fill="none"
                    pointerEvents="all"
                  />
                ) : null}
                {on ? (
                  <circle
                    r={n.r + 7}
                    fill="none"
                    stroke={fill}
                    strokeWidth="1.2"
                    className="map-pulse"
                    opacity="0.7"
                    pointerEvents="none"
                  />
                ) : null}
                <circle
                  r={n.r}
                  fill={focused || n.skill.kind === "hub" ? "var(--color-bg-elevated)" : "var(--color-bg)"}
                  stroke={onChain ? fill : fill}
                  strokeWidth={on ? 3 : focused ? 2.6 : tiny ? 1 : 1.6}
                  opacity={tiny && !on && !onChain ? 0.7 : 1}
                />
                {st === "solid" ? (
                  <circle r={Math.max(2, n.r * 0.22)} fill={fill} pointerEvents="none" />
                ) : st === "training" ? (
                  <circle
                    r={Math.max(2, n.r * 0.22)}
                    fill="none"
                    stroke={fill}
                    strokeWidth="1.2"
                    pointerEvents="none"
                  />
                ) : null}
                {label.map((line, i) => (
                  <text
                    key={line + i}
                    x={lx}
                    y={ly + i * 12}
                    textAnchor={anchor}
                    style={{
                      fontSize: n.skill.kind === "hub" ? 15 : n.skill.kind === "domain" ? 11.5 : tiny ? 0 : 9.5,
                      fontFamily:
                        n.skill.kind === "hub" || n.skill.kind === "domain"
                          ? "var(--font-display)"
                          : "var(--font-sans)",
                      fill: "var(--color-fg)",
                      paintOrder: "stroke",
                      stroke: "var(--color-bg)",
                      strokeWidth: 3,
                    }}
                  >
                    {line}
                  </text>
                ))}
                {kids > 0 && n.id !== focusId && n.skill.kind !== "hub" && !tiny ? (
                  <text
                    x={lx}
                    y={ly + label.length * 12}
                    textAnchor={anchor}
                    style={{
                      fontSize: 8,
                      fill: "var(--color-subtle)",
                      fontFamily: "var(--font-sans)",
                      paintOrder: "stroke",
                      stroke: "var(--color-bg)",
                      strokeWidth: 3,
                    }}
                  >
                    {kids}
                  </text>
                ) : null}
                <title>{n.skill.name}</title>
              </g>
            );
          })}
        </g>
        </>
        ) : null}
      </svg>
      {mounted ? (
      <MapHUD
        onFit={() => fly(fitCamera(visible, size.w, size.h))}
        onZoom={(dir) => {
          const next = clampK(cam.current.k * (dir > 0 ? 1.18 : 0.84));
          fly({ ...cam.current, k: next }, 180);
        }}
      />
      ) : null}
    </div>
  );
}
