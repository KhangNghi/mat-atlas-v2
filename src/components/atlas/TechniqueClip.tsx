import { ExternalLink } from "lucide-react";
import { videoOf } from "@/data/videos";

export function TechniqueClip({ id }: { id: string }) {
  const v = videoOf(id);
  if (!v) return null;
  const href = `https://www.youtube.com/watch?v=${v.youtube}`;
  const thumb = `https://i.ytimg.com/vi/${v.youtube}/hqdefault.jpg`;
  const mins = v.seconds ? Math.floor(v.seconds / 60) : null;
  const secs = v.seconds ? String(v.seconds % 60).padStart(2, "0") : null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-4 flex overflow-hidden rounded-lg border border-border bg-surface transition-colors duration-[var(--motion-quick)] hover:border-border-strong"
    >
      <img
        src={thumb}
        alt=""
        className="h-20 w-32 shrink-0 object-cover"
        crossOrigin="anonymous"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
        <p className="line-clamp-2 text-sm font-medium text-fg">{v.title}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <ExternalLink className="size-3" />
          Watch on YouTube
          {mins !== null ? ` · ${mins}:${secs}` : null}
          {v.channel ? ` · ${v.channel}` : null}
        </p>
      </div>
    </a>
  );
}
