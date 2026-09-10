export type DomainId =
  | "fundamentals"
  | "standing"
  | "guard"
  | "half"
  | "passing"
  | "pins"
  | "back"
  | "sweeps"
  | "subs"
  | "escapes"
  | "legs"
  | "concepts";

export type Gi = "both" | "gi" | "nogi";
export type Kind = "hub" | "domain" | "group" | "position" | "technique" | "concept";
export type Level = "beginner" | "intermediate" | "advanced";

export interface Skill {
  id: string;
  name: string;
  kind: Kind;
  parent: string | null;
  domain: DomainId | "hub";
  gi: Gi;
  level: Level;
  summary: string;
  mechanics?: string[];
  mistakes?: string[];
  related?: string[];
  from?: string[];
  to?: string[];
  aka?: string[];
  scoring?: string;
  legal?: string;
}

export interface LaidOutNode {
  id: string;
  x: number;
  y: number;
  r: number;
  skill: Skill;
}

export const DOMAIN_META: Record<DomainId, { label: string; blurb: string }> = {
  fundamentals: { label: "Fundamentals", blurb: "Movement, frames, posture, base." },
  standing: { label: "Standing", blurb: "Ties, takedowns, pulls." },
  guard: { label: "Guard", blurb: "Closed, open, gi, inverted." },
  half: { label: "Half Guard", blurb: "The modern battleground." },
  passing: { label: "Passing", blurb: "Pressure and movement." },
  pins: { label: "Pins", blurb: "Side, mount, rides." },
  back: { label: "The Back", blurb: "Take, ride, finish." },
  sweeps: { label: "Sweeps", blurb: "Bottom becomes top." },
  subs: { label: "Submissions", blurb: "Chokes and joint locks." },
  escapes: { label: "Escapes", blurb: "Leave the bad spots." },
  legs: { label: "Leg Entanglements", blurb: "Ashi, saddle, 50/50." },
  concepts: { label: "Concepts", blurb: "Hierarchy and hidden mechanics." },
};

export const KIND_LABEL: Record<Kind, string> = {
  hub: "Atlas",
  domain: "Domain",
  group: "Family",
  position: "Position",
  technique: "Technique",
  concept: "Concept",
};

export const GI_LABEL: Record<Gi, string> = {
  both: "Gi & No-Gi",
  gi: "Gi",
  nogi: "No-Gi",
};

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
