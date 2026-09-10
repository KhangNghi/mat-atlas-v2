import { SKILL_BY_ID, SKILLS, childrenOf } from "./index";
import type { LaidOutNode, Skill } from "./types";

const DOMAIN_R = 280;
const GROUP_R = 150;
const LEAF_R = 110;

export function defaultExpanded(): string[] {
  return ["bjj", ...SKILLS.filter((s) => s.kind === "domain").map((s) => s.id)];
}

export function expandToReveal(id: string, expanded: string[]): string[] {
  const next = new Set(expanded);
  let cur: Skill | undefined = SKILL_BY_ID[id];
  while (cur) {
    next.add(cur.id);
    if (cur.parent) next.add(cur.parent);
    cur = cur.parent ? SKILL_BY_ID[cur.parent] : undefined;
  }
  next.add("bjj");
  return [...next];
}

export function layoutAtlas(expanded: Set<string>): LaidOutNode[] {
  const nodes: LaidOutNode[] = [];
  const hub = SKILL_BY_ID.bjj;
  if (!hub) return nodes;
  nodes.push({ id: hub.id, x: 0, y: 0, r: 46, skill: hub });

  const domains = childrenOf("bjj");
  const n = domains.length || 1;
  domains.forEach((d, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const x = Math.cos(a) * DOMAIN_R;
    const y = Math.sin(a) * DOMAIN_R;
    nodes.push({ id: d.id, x, y, r: 28, skill: d });
    if (!expanded.has(d.id)) return;
    const groups = childrenOf(d.id);
    groups.forEach((g, gi) => {
      const ga = a + ((gi - (groups.length - 1) / 2) * 0.55);
      const gx = x + Math.cos(ga) * GROUP_R;
      const gy = y + Math.sin(ga) * GROUP_R;
      nodes.push({ id: g.id, x: gx, y: gy, r: 18, skill: g });
      if (!expanded.has(g.id)) return;
      const leaves = childrenOf(g.id);
      leaves.forEach((leaf, li) => {
        const la = ga + ((li - (leaves.length - 1) / 2) * 0.22);
        const lx = gx + Math.cos(la) * LEAF_R;
        const ly = gy + Math.sin(la) * LEAF_R;
        nodes.push({ id: leaf.id, x: lx, y: ly, r: 11, skill: leaf });
      });
    });
  });
  return nodes;
}
