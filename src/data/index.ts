import { CORE } from "./part-core";
import { ESCAPES_LEGS_CONCEPTS } from "./part-escapes-legs-concepts";
import { GUARD } from "./part-guard";
import { HALF_PASS } from "./part-half-pass";
import { PINS_BACK } from "./part-pins-back";
import { STANDING } from "./part-standing";
import { SUBMISSIONS } from "./part-submissions";
import { SWEEPS } from "./part-sweeps";
import { CHAINS } from "./chains";
import type { DomainId, Skill } from "./types";

export * from "./types";
export { CHAINS } from "./chains";

export const SKILLS: Skill[] = [
  ...CORE,
  ...STANDING,
  ...GUARD,
  ...HALF_PASS,
  ...PINS_BACK,
  ...SWEEPS,
  ...SUBMISSIONS,
  ...ESCAPES_LEGS_CONCEPTS,
];

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export const DOMAINS: Skill[] = SKILLS.filter((s) => s.kind === "domain");

function edgeKey(a: string, b: string) {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

const edgeSet = new Set<string>();
for (const s of SKILLS) {
  if (s.parent) edgeSet.add(edgeKey(s.id, s.parent));
  for (const id of [...(s.from ?? []), ...(s.to ?? []), ...(s.related ?? [])]) {
    if (SKILL_BY_ID[id]) edgeSet.add(edgeKey(s.id, id));
  }
}

export const EDGES: [string, string][] = [...edgeSet].map((k) => {
  const [a, b] = k.split("::");
  return [a, b];
});

export const STATS = {
  skills: SKILLS.length,
  connections: EDGES.length,
  chains: CHAINS.length,
};

export function childrenOf(id: string): Skill[] {
  return SKILLS.filter((s) => s.parent === id);
}

export function ancestorsOf(id: string): Skill[] {
  const out: Skill[] = [];
  let cur = SKILL_BY_ID[id];
  while (cur?.parent) {
    const p = SKILL_BY_ID[cur.parent];
    if (!p) break;
    out.push(p);
    cur = p;
  }
  return out;
}

export function neighborsOf(id: string): Skill[] {
  const s = SKILL_BY_ID[id];
  if (!s) return [];
  const ids = new Set<string>([...(s.from ?? []), ...(s.to ?? []), ...(s.related ?? [])]);
  for (const [a, b] of EDGES) {
    if (a === id) ids.add(b);
    if (b === id) ids.add(a);
  }
  ids.delete(id);
  return [...ids].map((x) => SKILL_BY_ID[x]).filter(Boolean) as Skill[];
}

export function searchSkills(q: string): Skill[] {
  const n = q.trim().toLowerCase();
  if (!n) return SKILLS.filter((s) => s.kind !== "hub");
  return SKILLS.filter((s) => {
    const hay = [s.name, s.summary, ...(s.aka ?? []), s.kind, s.domain].join(" ").toLowerCase();
    return hay.includes(n);
  });
}

export function skillsInDomain(d: DomainId): Skill[] {
  return SKILLS.filter((s) => s.domain === d);
}
