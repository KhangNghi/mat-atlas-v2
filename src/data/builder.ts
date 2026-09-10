import type { DomainId, Gi, Kind, Level, Skill } from "./types";

export function skill(
  id: string,
  name: string,
  opts: {
    kind?: Kind;
    parent: string | null;
    domain: DomainId | "hub";
    gi?: Gi;
    level?: Level;
    summary: string;
    mechanics?: string[];
    mistakes?: string[];
    related?: string[];
    from?: string[];
    to?: string[];
    aka?: string[];
    scoring?: string;
    legal?: string;
  },
): Skill {
  return {
    id,
    name,
    kind: opts.kind ?? "technique",
    parent: opts.parent,
    domain: opts.domain,
    gi: opts.gi ?? "both",
    level: opts.level ?? "intermediate",
    summary: opts.summary,
    mechanics: opts.mechanics,
    mistakes: opts.mistakes,
    related: opts.related,
    from: opts.from,
    to: opts.to,
    aka: opts.aka,
    scoring: opts.scoring,
    legal: opts.legal,
  };
}
