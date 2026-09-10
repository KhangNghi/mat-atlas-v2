export interface Chain {
  id: string;
  name: string;
  blurb: string;
  steps: string[];
}

export const CHAINS: Chain[] = [
  {
    id: "closed-trinity",
    name: "Closed Guard Trinity",
    blurb: "Break posture, then attack in a circle: triangle, armbar, omoplata. Each defense opens the next.",
    steps: ["pos-closed-guard", "sub-triangle", "sub-armbar", "sub-omoplata"],
  },
  {
    id: "mount-attacks",
    name: "Mount Attack Series",
    blurb: "High mount or S-mount, then armbar, collar choke, or take the back when they turn.",
    steps: ["pos-mount", "pos-high-mount", "pos-s-mount", "sub-armbar", "sub-cross-collar", "back-from-mount"],
  },
  {
    id: "back-finishes",
    name: "Back Control Finishes",
    blurb: "Hooks and seatbelt first. RNC if the neck is free; bow-and-arrow if they hide it in the gi.",
    steps: ["back-hooks", "back-seatbelt", "pos-back", "sub-rnc", "sub-bow-arrow"],
  },
  {
    id: "half-battle",
    name: "Half Guard Battle",
    blurb: "Underhook vs knee-shield. Old school or dogfight if you win the underhook; knee slice if you don’t.",
    steps: ["pos-half-guard", "pos-knee-shield", "half-underhook", "sweep-old-school", "half-dogfight", "pass-knee-slice"],
  },
  {
    id: "pass-ladder",
    name: "Passing Ladder",
    blurb: "Toreando to force a hip reaction, long-step or leg-drag the opening, pin the result.",
    steps: ["pass-toreando", "pass-long-step", "pass-leg-drag", "pos-side-control", "pos-mount"],
  },
  {
    id: "butterfly-x",
    name: "Butterfly to X",
    blurb: "Off-balance from butterfly, enter X or SLX, stand them up or take the back.",
    steps: ["pos-butterfly", "sweep-butterfly", "pos-x-guard", "pos-slx", "sweep-x", "back-from-x"],
  },
  {
    id: "berimbolo",
    name: "Berimbolo System",
    blurb: "De La Riva to inversion, bolo to the back, or kiss-of-the-dragon if they roll through.",
    steps: ["pos-dlr", "pos-rdlr", "back-berimbolo", "back-kiss-dragon", "pos-back"],
  },
  {
    id: "front-headlock",
    name: "Front Headlock Chain",
    blurb: "Snap or sprawl to front headlock. Guillotine, anaconda, D’Arce — pick by which arm is in.",
    steps: ["stand-snapdown", "stand-front-headlock", "pos-front-headlock", "sub-guillotine", "sub-anaconda", "sub-darce"],
  },
  {
    id: "leg-pipeline",
    name: "Leg Entanglement Pipeline",
    blurb: "K-guard or RDLR into ashi, saddle for the inside heel, outside ashi or 50/50 for the other.",
    steps: ["pos-k-guard", "leg-k-entry", "pos-inside-ashi", "pos-saddle", "sub-inside-heel", "pos-5050"],
  },
  {
    id: "side-attacks",
    name: "Side Control Attacks",
    blurb: "Pin the far hip, then americana, kimura, arm triangle, or knee-on-belly to mount.",
    steps: ["pos-side-control", "sub-americana", "sub-kimura", "sub-arm-triangle", "pos-knee-on-belly", "pos-mount"],
  },
  {
    id: "escape-hierarchy",
    name: "Escape Hierarchy",
    blurb: "Frame, shrimp, recover a knee. Bridge-and-roll if they post wrong. Half guard is a win.",
    steps: ["fund-frames", "fund-shrimp", "esc-elbow-escape", "esc-upa", "pos-half-guard", "pos-closed-guard"],
  },
  {
    id: "stand-to-guard",
    name: "Standing to Guard",
    blurb: "If the takedown isn’t there, pull sitting or closed and start the bottom game on your terms.",
    steps: ["pos-neutral", "stand-single-leg", "stand-sprawl", "stand-guard-pull", "stand-sitting-pull", "pos-closed-guard"],
  },
];
