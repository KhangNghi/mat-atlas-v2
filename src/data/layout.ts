import { SKILL_BY_ID, childrenOf } from "./index";
import type { LaidOutNode, Skill } from "./types";

export function descendantLeafCount(id: string): number {
  let n = 0;
  const stack = [...childrenOf(id)];
  while (stack.length) {
    const s = stack.pop()!;
    if (s.kind === "technique" || s.kind === "position" || s.kind === "concept") n += 1;
    else stack.push(...childrenOf(s.id));
  }
  return n;
}

export function drillFocusFor(id: string): string {
  const s = SKILL_BY_ID[id];
  if (!s) return "bjj";
  if (s.kind === "hub" || s.kind === "domain" || s.kind === "group") return s.id;
  return s.parent ?? "bjj";
}

export function canDrill(id: string): boolean {
  const s = SKILL_BY_ID[id];
  if (!s) return false;
  if (s.kind === "technique" || s.kind === "position" || s.kind === "concept") return false;
  return childrenOf(id).length > 0;
}

export function wrapLabel(name: string, max = 16): string[] {
  if (name.length <= max) return [name];
  const words = name.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function radiusForCount(n: number, nodeR: number, minR: number): number {
  if (n <= 1) return minR;
  const needed = (nodeR * 2 + 36) * n / (2 * Math.PI);
  return Math.max(minR, needed);
}

function placeRing(n: number, r: number, start = -Math.PI / 2): { x: number; y: number; a: number }[] {
  if (n === 0) return [];
  return Array.from({ length: n }, (_, i) => {
    const a = start + (i * 2 * Math.PI) / n;
    return { x: +Math.cos(a).toFixed(2) * r, y: +Math.sin(a).toFixed(2) * r, a };
  });
}

export interface LayoutResult {
  nodes: LaidOutNode[];
  orbitR: number;
  parentId: string | null;
}

export function layoutFocus(focusId: string, compact: boolean): LayoutResult {
  const focus = SKILL_BY_ID[focusId] ?? SKILL_BY_ID.bjj;
  if (!focus) return { nodes: [], orbitR: 160, parentId: null };

  const kids = childrenOf(focus.id);
  const nodes: LaidOutNode[] = [];
  const scale = compact ? 0.62 : 1;

  const focusR =
    focus.kind === "hub" ? 52 * scale : focus.kind === "domain" ? 40 * scale : 28 * scale;

  nodes.push({ id: focus.id, x: 0, y: 0, r: focusR, skill: focus });

  const childR =
    focus.kind === "hub" ? 32 * scale : focus.kind === "domain" ? 22 * scale : 13 * scale;
  const minOrbit = (focus.kind === "hub" ? (compact ? 132 : 200) : focus.kind === "domain" ? (compact ? 118 : 172) : (compact ? 108 : 148));
  const split = kids.length > 14;
  const innerKids = split ? kids.slice(0, Math.ceil(kids.length / 2)) : kids;
  const outerKids = split ? kids.slice(Math.ceil(kids.length / 2)) : [];
  const innerR = radiusForCount(innerKids.length, childR, minOrbit);
  const outerR = radiusForCount(outerKids.length, childR, innerR + 92 * scale);

  const placeKids = (list: Skill[], r: number) => {
    const pts = placeRing(list.length, r);
    list.forEach((s, i) => {
      const p = pts[i]!;
      nodes.push({ id: s.id, x: p.x, y: p.y, r: childR, skill: s });

      if (!compact && focus.kind === "hub") {
        const previews = childrenOf(s.id).slice(0, 7);
        if (previews.length === 0) return;
        const pr = childR + 22 * scale;
        previews.forEach((leaf, li) => {
          const la = p.a + ((li - (previews.length - 1) / 2) * 0.22);
          nodes.push({
            id: leaf.id,
            x: p.x + Math.cos(la) * pr,
            y: p.y + Math.sin(la) * pr,
            r: 4.5 * scale,
            skill: leaf,
          });
        });
      }
    });
  };

  placeKids(innerKids, innerR);
  if (outerKids.length) placeKids(outerKids, outerR);

  return {
    nodes,
    orbitR: outerKids.length ? outerR : innerR,
    parentId: focus.parent,
  };
}

export function boundsOf(nodes: LaidOutNode[]): { x: number; y: number; w: number; h: number } {
  if (nodes.length === 0) return { x: -200, y: -200, w: 400, h: 400 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
  const pad = n.r + 64;
    minX = Math.min(minX, n.x - pad);
    minY = Math.min(minY, n.y - pad);
    maxX = Math.max(maxX, n.x + pad);
    maxY = Math.max(maxY, n.y + pad);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function fitCamera(
  nodes: LaidOutNode[],
  w: number,
  h: number,
): { x: number; y: number; k: number } {
  const b = boundsOf(nodes);
  const k = Math.min(w / Math.max(b.w, 1), h / Math.max(b.h, 1), 1.45) * 0.86;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return { x: -cx * k, y: -cy * k, k: Math.max(0.42, k) };
}

/** @deprecated kept so old imports don't break during the rewrite */
export function defaultExpanded(): string[] {
  return ["bjj"];
}

export function expandToReveal(id: string, expanded: string[]): string[] {
  return [...new Set([...expanded, drillFocusFor(id), "bjj"])];
}
