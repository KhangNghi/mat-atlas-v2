import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { videoOf } from "@/data/videos";

export function TechniqueClip({ id }: { id: string }) {
  const v = videoOf(id);
  const [playing, setPlaying] = useState(false);
  if (!v) return null;
  const href = `https://www.youtube.com/watch?v=${v.youtube}`;
  const thumb = `https://i.ytimg.com/vi/${v.youtube}/hqdefault.jpg`;
  const mins = v.seconds ? Math.floor(v.seconds / 60) : null;
  const secs = v.seconds ? String(v.seconds % 60).padStart(2, "0") : null;

  if (playing) {
    return (
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
        <div className="relative aspect-video bg-bg">
          <iframe
            title={v.title}
            src={`https://www.youtube-nocookie.com/embed/${v.youtube}?autoplay=1&rel=0`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted hover:text-fg"
        >
          <ExternalLink className="size-3" />
          Open on YouTube
          {v.channel ? ` · ${v.channel}` : null}
        </a>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="mt-4 flex w-full overflow-hidden rounded-lg border border-border bg-surface text-left transition-colors duration-[var(--motion-quick)] hover:border-border-strong"
    >
      <span className="relative h-20 w-32 shrink-0">
        <img
          src={thumb}
          alt=""
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        <span className="absolute inset-0 grid place-items-center bg-bg/40">
          <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-fg">
            <Play className="size-3.5 fill-current" />
          </span>
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
        <span className="line-clamp-2 text-sm font-medium text-fg">{v.title}</span>
        <span className="mt-1 text-xs text-muted">
          Play clip
          {mins !== null ? ` · ${mins}:${secs}` : null}
          {v.channel ? ` · ${v.channel}` : null}
        </span>
      </span>
    </button>
  );
}
