import type { DomainId } from "@/data/types";
import { DOMAIN_META } from "@/data/types";

const VARS: Record<string, string> = {
  fundamentals: "var(--color-domain-fundamentals)",
  standing: "var(--color-domain-standing)",
  guard: "var(--color-domain-guard)",
  half: "var(--color-domain-half)",
  passing: "var(--color-domain-passing)",
  pins: "var(--color-domain-pins)",
  back: "var(--color-domain-back)",
  sweeps: "var(--color-domain-sweeps)",
  subs: "var(--color-domain-subs)",
  escapes: "var(--color-domain-escapes)",
  legs: "var(--color-domain-legs)",
  concepts: "var(--color-domain-concepts)",
};

export function domainColor(id: DomainId | "hub"): string {
  if (id === "hub") return "var(--color-accent)";
  return VARS[id] ?? "var(--color-accent)";
}

export function domainLabel(id: DomainId): string {
  return DOMAIN_META[id]?.label ?? id;
}
