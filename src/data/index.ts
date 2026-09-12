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
  techniques: SKILLS.filter((s) => s.kind === "technique" || s.kind === "position" || s.kind === "concept")
    .length,
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

export function siblingsOf(id: string): Skill[] {
  const s = SKILL_BY_ID[id];
  if (!s?.parent) return [];
  return childrenOf(s.parent);
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

function subseq(hay: string, q: string): boolean {
  let i = 0;
  for (const ch of hay) {
    if (ch === q[i]) i += 1;
    if (i === q.length) return true;
  }
  return false;
}

export function searchSkills(q: string): Skill[] {
  const n = q.trim().toLowerCase();
  const pool = SKILLS.filter((s) => s.kind !== "hub");
  if (!n) return pool;
  const scored = pool
    .map((s) => {
      const name = s.name.toLowerCase();
      const aka = (s.aka ?? []).join(" ").toLowerCase();
      let score = 0;
      if (name === n) score = 1000;
      else if (name.startsWith(n)) score = 850;
      else if (name.includes(n)) score = 620;
      else if (aka.includes(n)) score = 540;
      else if (s.summary.toLowerCase().includes(n)) score = 280;
      else if (s.domain.includes(n) || s.kind.includes(n)) score = 180;
      else if (subseq(name, n) && n.length >= 3) score = 120;
      return { s, score };
    })
    .filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name));
  return scored.map((x) => x.s);
}

export function skillsInDomain(d: DomainId): Skill[] {
  return SKILLS.filter((s) => s.domain === d);
}

export function passesGi(s: Skill, gi: "all" | "gi" | "nogi"): boolean {
  if (gi === "all") return true;
  if (s.kind === "hub" || s.kind === "domain" || s.kind === "group") return true;
  if (gi === "gi") return s.gi !== "nogi";
  return s.gi !== "gi";
}
