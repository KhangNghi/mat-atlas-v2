import { CHAINS } from "@/data/chains";
import { SKILL_BY_ID } from "@/data";
import { useAtlas } from "@/store/atlas";
import { domainColor } from "@/lib/domain-color";

export function LadderView() {
  const select = useAtlas((s) => s.select);
  const selectedId = useAtlas((s) => s.selectedId);

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-3 py-4 md:px-8">
      <p className="mb-6 max-w-xl text-sm text-muted">
        Twelve chains that connect the atlas. Tap a step to open it on the map.
      </p>
      <ol className="space-y-8">
        {CHAINS.map((chain) => (
          <li key={chain.id}>
            <h2 className="font-display text-2xl tracking-tight text-fg">{chain.name}</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">{chain.blurb}</p>
            <ol className="mt-4 flex flex-wrap items-center gap-2">
              {chain.steps.map((id, i) => {
                const s = SKILL_BY_ID[id];
                if (!s) return null;
                const on = selectedId === id;
                const domain = s.domain === "hub" ? "fundamentals" : s.domain;
                return (
                  <li key={id} className="flex items-center gap-2">
                    {i > 0 ? <span className="text-subtle">→</span> : null}
                    <button
                      type="button"
                      onClick={() => select(id)}
                      className={
                        on
                          ? "rounded-full bg-accent px-3 py-2 text-sm text-accent-fg"
                          : "rounded-full border border-border px-3 py-2 text-sm text-fg hover:border-border-strong"
                      }
                    >
                      <span
                        className="mr-2 inline-block size-2 rounded-full"
                        style={{ background: domainColor(domain) }}
                      />
                      {s.name}
                    </button>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}
