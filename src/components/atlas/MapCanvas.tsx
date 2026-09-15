import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CHAINS } from "@/data/chains";
import { SKILL_BY_ID, childrenOf } from "@/data";
import { canDrill, fitCamera, layoutFocus, wrapLabel } from "@/data/layout";
import type { LaidOutNode } from "@/data/types";
import { domainColor } from "@/lib/domain-color";
import { clampK, easeOutCubic, lerpCam, zoomAround, type Cam } from "@/lib/map-camera";
import { MOBILE_SHEET_MAX } from "@/lib/mobile-sheet";
import { useAtlas } from "@/store/atlas";
import { MapHUD } from "./MapHUD";

/**
 * Camera fly time for a focus change. Slightly longer than the layout morph
 * (--motion-morph in styles.css, 460ms) so the camera settles last.
 */
const FLY_MS = 520;
/** Finger travel (px) before a press stops counting as a tap. */
const TAP_SLOP = 10;
/** Longest press (ms) that still counts as a tap. */
const TAP_MAX_MS = 700;

type Pt = { x: number; y: number };

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

function isChrome(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("[data-hud]"));
}

/**
 * Where the previous layout's world sits inside the new layout's world.
 * Drill-in: the new focus was at `b` in the old frame, so old → new is `-b`.
 * Step-out: the old focus now sits at `a` in the new frame, so old → new is `+a`.
 * Any other jump has no shared frame and returns null.
 */
function frameOffset(
  prevFocus: string,
  nextFocus: string,
  prevNodes: LaidOutNode[],
  nextNodes: LaidOutNode[],
): Pt | null {
  const drilledInto = prevNodes.find((n) => n.id === nextFocus);
  if (drilledInto) return { x: -drilledInto.x, y: -drilledInto.y };
  const steppedOutTo = nextNodes.find((n) => n.id === prevFocus);
  if (steppedOutTo) return { x: steppedOutTo.x, y: steppedOutTo.y };
  return null;
}

interface Ghost {
  id: string;
  x: number;
  y: number;
  r: number;
  color: string;
}

interface MorphPlan {
  /** Layout generation; bumps on every focus change so node animations restart. */
  gen: number;
  offset: Pt | null;
  /** Where each surviving node was, expressed in the new frame. */
  prevPos: Map<string, Pt>;
  ghosts: Ghost[];
  /** Where ghosts collapse to, in the new frame. */
  ghostTarget: Pt;
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
  const pointers = useRef(new Map<number, Pt>());
  const pinch = useRef<{ dist: number; cam: Cam } | null>(null);
  const drag = useRef<{ x: number; y: number; cam: Cam } | null>(null);
  const tap = useRef<{ id: number; x: number; y: number; t: number; node: string | null } | null>(
    null,
  );
  const vel = useRef({ x: 0, y: 0 });
  const lastMove = useRef({ t: 0, x: 0, y: 0 });
  const moved = useRef(false);
  const anim = useRef<{ from: Cam; to: Cam; t0: number; dur: number } | null>(null);
  const inertia = useRef(0);
  const settled = useRef(false);
  const prevLayout = useRef<{ focusId: string; nodes: LaidOutNode[]; gen: number } | null>(null);
  const shiftedFor = useRef<number>(-1);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const [camTick, setCamTick] = useState(0);

  useEffect(() => {
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

  /**
   * Work out how the previous layout maps onto this one so nodes can slide
   * instead of popping. `prevLayout` is only written in an effect, so at render
   * time it still describes the layout that is on screen.
   */
  const plan = useMemo<MorphPlan>(() => {
    const prev = prevLayout.current;
    const none: Pt = { x: 0, y: 0 };
    if (!prev) return { gen: 0, offset: null, prevPos: new Map(), ghosts: [], ghostTarget: none };
    if (prev.focusId === focusId) {
      // Same focus, new geometry (e.g. the viewport crossed the compact breakpoint).
      return {
        gen: prev.gen + 1,
        offset: null,
        prevPos: new Map(prev.nodes.map((n) => [n.id, { x: n.x, y: n.y }])),
        ghosts: [],
        ghostTarget: none,
      };
    }
    const offset = frameOffset(prev.focusId, focusId, prev.nodes, nodes);
    if (!offset) {
      // A jump across the tree: nothing shared, so everything blooms from the centre.
      return { gen: prev.gen + 1, offset: null, prevPos: new Map(), ghosts: [], ghostTarget: none };
    }
    const nextIds = new Set(nodes.map((n) => n.id));
    const prevPos = new Map<string, Pt>();
    const ghosts: Ghost[] = [];
    for (const n of prev.nodes) {
      const at = { x: n.x + offset.x, y: n.y + offset.y };
      if (nextIds.has(n.id)) prevPos.set(n.id, at);
      else ghosts.push({ id: n.id, x: at.x, y: at.y, r: n.r, color: colorOf(n) });
    }
    return { gen: prev.gen + 1, offset, prevPos, ghosts, ghostTarget: offset };
  }, [focusId, nodes]);

  const visible = useMemo(() => {
    if (giFilter === "all") return nodes;
    return nodes.filter((n) => {
      if (n.skill.kind === "hub" || n.skill.kind === "domain" || n.skill.kind === "group") return true;
      if (giFilter === "gi") return n.skill.gi !== "nogi";
      return n.skill.gi !== "gi";
    });
  }, [nodes, giFilter]);

  const byId = useMemo(() => Object.fromEntries(visible.map((n) => [n.id, n])), [visible]);
  const drawNodes = useMemo(() => [...visible].sort((a, b) => a.r - b.r), [visible]);

  const chainIds = useMemo(() => {
    if (!highlightedChain) return new Set<string>();
    const c = CHAINS.find((x) => x.id === highlightedChain);
    return new Set(c?.steps ?? []);
  }, [highlightedChain]);

  /** Push the camera into the DOM. Reads refs only, so it is safe from any callback. */
  const apply = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    const { x, y, k } = cam.current;
    const { w, h } = sizeRef.current;
    g.setAttribute("transform", `translate(${w / 2 + x} ${h / 2 + y}) scale(${k})`);
  }, []);

  /** Attach the world group and paint the camera the instant it exists. */
  const setGroup = useCallback(
    (el: SVGGElement | null) => {
      gRef.current = el;
      if (el) apply();
    },
    [apply],
  );

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
  }, [apply, camTick, size.w, size.h]);

  /**
   * The moment a new layout is committed, shift the camera by the frame offset
   * so the shared node (the domain you drilled into, or the family you stepped
   * out of) stays exactly where it was on screen. The fly effect below then
   * eases from there to the fitted view — no pop between frames.
   */
  useLayoutEffect(() => {
    if (plan.offset && shiftedFor.current !== plan.gen) {
      const k = cam.current.k;
      cam.current = {
        k,
        x: cam.current.x - plan.offset.x * k,
        y: cam.current.y - plan.offset.y * k,
      };
      apply();
    }
    shiftedFor.current = plan.gen;
    prevLayout.current = { focusId, nodes, gen: plan.gen };
    // Cheap insurance: a freshly mounted <g> always carries the camera before paint.
    apply();
  }, [plan, focusId, nodes, apply]);

  useEffect(() => {
    if (size.w < 40 || size.h < 40) return;
    let to = fitCamera(visible, size.w, size.h);
    // On a phone the detail sheet covers the bottom of the map, so frame the
    // node whose card is open in the strip that stays visible above it.
    const sel = selectedId ? byId[selectedId] : null;
    if (compact && sel) {
      const stripH = size.h * (1 - MOBILE_SHEET_MAX);
      to = { k: to.k, x: -sel.x * to.k, y: stripH / 2 - size.h / 2 - sel.y * to.k };
    }
    if (!settled.current) {
      // First paint: land on the fitted view instead of flying in from origin.
      settled.current = true;
      cam.current = to;
      apply();
      return;
    }
    fly(to, FLY_MS);
  }, [focusId, flyNonce, size.w, size.h, visible, fly, apply, compact, selectedId, byId]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isChrome(e.target)) return;
    const el = e.currentTarget as HTMLElement;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail on a pointer that is already gone; taps still work.
    }
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
      tap.current = null;
      moved.current = true;
      return;
    }
    moved.current = false;
    tap.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      node: nodeFromEvent(e.target),
    };
    drag.current = { x: e.clientX, y: e.clientY, cam: { ...cam.current } };
    vel.current = { x: 0, y: 0 };
    lastMove.current = { t: performance.now(), x: e.clientX, y: e.clientY };
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
    if (!moved.current && Math.hypot(dx, dy) <= TAP_SLOP) return;
    moved.current = true;
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
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    pinch.current = null;
    const t = tap.current;
    const isTap =
      e.type === "pointerup" &&
      t !== null &&
      t.id === e.pointerId &&
      !moved.current &&
      pointers.current.size === 0 &&
      performance.now() - t.t < TAP_MAX_MS;
    tap.current = null;
    if (pointers.current.size === 0) {
      drag.current = null;
      if (moved.current && Math.hypot(vel.current.x, vel.current.y) > 0.8) {
        inertia.current = 1;
        requestAnimationFrame(loop);
      }
    }
    if (isTap) activateId(t.node);
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

  function activateId(id: string | null) {
    if (!id) {
      select(null);
      return;
    }
    if (id === layout.parentId) {
      goUp();
      return;
    }
    const n = byId[id];
    if (n) activate(n);
  }

  function onNodeKey(n: LaidOutNode, e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(n);
    }
  }

  const parentSkill = layout.parentId ? SKILL_BY_ID[layout.parentId] : null;
  const parentY = -(layout.orbitR + 56);
  const hitMin = compact ? 22 : 18;
  const firstPaint = plan.gen === 0;

  return (
    <div
      ref={wrap}
      className="absolute inset-0 touch-none overflow-hidden bg-bg select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg className="h-full w-full atlas-map-enter" aria-label="BJJ mind map">
        {size.w > 40 && size.h > 40 ? (
          <>
            <defs>
              <radialGradient id="atlas-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--color-surface)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="var(--color-bg)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g ref={setGroup}>
              <circle
                key={`orbit-${plan.gen}`}
                r={layout.orbitR}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="1"
                opacity="0.7"
                pointerEvents="none"
                className="atlas-orbit"
              />
              <circle
                r={Math.max(40, layout.orbitR * 0.45)}
                fill="url(#atlas-glow)"
                pointerEvents="none"
                className="atlas-orbit"
              />

              {plan.ghosts.map((g) => (
                <g
                  key={`ghost-${g.id}-${plan.gen}`}
                  className="atlas-ghost"
                  style={
                    {
                      transform: `translate(${g.x}px, ${g.y}px)`,
                      "--to-x": `${plan.ghostTarget.x}px`,
                      "--to-y": `${plan.ghostTarget.y}px`,
                    } as React.CSSProperties
                  }
                  pointerEvents="none"
                >
                  <circle r={g.r} fill="var(--color-bg)" stroke={g.color} strokeWidth="1.4" />
                </g>
              ))}

              {parentSkill ? (
                <g
                  key={`parent-${plan.gen}`}
                  data-node={parentSkill.id}
                  role="button"
                  aria-label={`Back to ${parentSkill.name}`}
                  tabIndex={0}
                  className="cursor-pointer atlas-fade-in focus:outline-none"
                  style={{ transform: `translate(0px, ${parentY}px)` }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goUp();
                    }
                  }}
                >
                  <circle r={compact ? 24 : 20} fill="none" pointerEvents="all" />
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
                    style={{
                      fontSize: 10,
                      fill: "var(--color-muted)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {parentSkill.name}
                  </text>
                </g>
              ) : null}

              {visible.map((n) => {
                if (n.id === focusId) return null;
                if (n.skill.parent !== focusId || !byId[focusId]) return null;
                const onChain = chainIds.has(n.id) && chainIds.has(focusId);
                return (
                  <line
                    key={`e-${n.id}-${plan.gen}`}
                    x1={0}
                    y1={0}
                    x2={n.x}
                    y2={n.y}
                    stroke={onChain ? colorOf(n) : "var(--color-border-strong)"}
                    strokeWidth={onChain ? 1.8 : 1}
                    opacity={isLeaf(n) && n.r < 8 ? 0.25 : 0.55}
                    pointerEvents="none"
                    className="atlas-edge"
                  />
                );
              })}

              {drawNodes.map((n, i) => {
                const fill = colorOf(n);
                const on = selectedId === n.id;
                const focused = n.id === focusId;
                const onChain = chainIds.has(n.id);
                const st = status[n.id];
                const leaf = isLeaf(n);
                const tiny = n.r < 7;
                const label = tiny
                  ? []
                  : wrapLabel(n.skill.name, n.skill.kind === "hub" ? 22 : compact ? 12 : 15);
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
                  compact || (n.skill.kind !== "domain" && n.skill.kind !== "group")
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
                // One hit box from the node centre out to the label, so there is
                // no dead gap between the ring and its name.
                const hitX = Math.min(labelX, 0);
                const hitY = Math.min(labelY, 0);
                const hitW = Math.max(labelX + labelW, 0) - hitX;
                const hitH = Math.max(labelY + labelH, 0) - hitY;
                // Every node animates in from where it was a frame ago (mapped into
                // this layout's frame), or from the focus centre if it is new.
                const was = plan.prevPos.get(n.id);
                const from = was ?? { x: 0, y: 0 };

                return (
                  <g
                    key={`${n.id}-${plan.gen}`}
                    data-node={n.id}
                    role="button"
                    aria-label={n.skill.name}
                    aria-pressed={on}
                    tabIndex={tiny ? -1 : 0}
                    className="atlas-node cursor-pointer focus:outline-none"
                    style={
                      {
                        transform: `translate(${n.x}px, ${n.y}px)`,
                        "--from-x": `${from.x}px`,
                        "--from-y": `${from.y}px`,
                        "--from-o": was ? 1 : 0,
                        animationDelay: firstPaint ? `${Math.min(i, 24) * 14}ms` : undefined,
                      } as React.CSSProperties
                    }
                    onKeyDown={(e) => onNodeKey(n, e)}
                  >
                    <circle r={hitR} fill="none" pointerEvents="all" />
                    {outside && label.length > 0 ? (
                      <rect
                        x={hitX}
                        y={hitY}
                        width={hitW}
                        height={hitH}
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
                      fill={
                        focused || n.skill.kind === "hub"
                          ? "var(--color-bg-elevated)"
                          : "var(--color-bg)"
                      }
                      stroke={fill}
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
                    {label.map((line, li) => (
                      <text
                        key={line + li}
                        x={lx}
                        y={ly + li * 12}
                        textAnchor={anchor}
                        style={{
                          fontSize:
                            n.skill.kind === "hub"
                              ? 15
                              : n.skill.kind === "domain"
                                ? 11.5
                                : tiny
                                  ? 0
                                  : 9.5,
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
      {size.w > 0 ? (
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
