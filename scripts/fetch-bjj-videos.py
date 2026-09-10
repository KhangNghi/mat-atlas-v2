#!/usr/bin/env python3
"""Fetch a short public YouTube instructional for each Mat Atlas skill."""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path("/workspace")
OUT_JSON = ROOT / "src/data/videos.json"
OUT_TS = ROOT / "src/data/videos.ts"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# Prefer concise instructionals over hour-long digital courses.
PREFERRED_CHANNELS = {
    "chewjitsu",
    "corepro bjj",
    "graciebreakdown",
    "gracie barra",
    "stephan kesting",
    "grappling interlinked",
    "knight jiu-jitsu",
    "jordan teaches jiu jitsu",
    "the grappling academy",
    "lachlan giles",
    "bjj globetrotters",
    "bernardofaria",
    "bernardo faria bjj fanatics",
    "fighttips",
    "howcast",
    "judo fanatics",
    "bjj fanatics",
    "danaher",
    "john danaher",
    "gordon ryan",
    "newwavejiujitsu",
    "bjj scout",
    "submeta",
    "the bjj project",
    "pagano bjj",
    "combat girls",
    "bjj school online",
    "flowrestling",
    "flowrestling",
    "kit dale",
    "keenan online",
    "cobrinha",
    "atosaa",
    "joel hougard",
    "priit mihkelson",
    "bjj after dark",
    "zombieproofbjj",
    "jon thomas bjj",
    "emily kwok",
    "the grappling lab",
}

SKIP_TITLE = re.compile(
    r"\b(full course|entire instructional|8 hour|10 hour|hour long|digital course|buy now)\b",
    re.I,
)


def parse_skills() -> list[dict]:
    skills = []
    for path in sorted((ROOT / "src/data").glob("part-*.ts")):
        text = path.read_text()
        for m in re.finditer(
            r'skill\("([^"]+)",\s*"([^"]+)",\s*\{(.*?)\n  \}\)', text, re.S
        ):
            sid, name, body = m.group(1), m.group(2), m.group(3)
            km = re.search(r'kind:\s*"([^"]+)"', body)
            kind = km.group(1) if km else "technique"
            skills.append({"id": sid, "name": name, "kind": kind})
    return skills


QUERY_OVERRIDES = {
    "esc-back-chin": "BJJ escape back control chin down hands to choke",
    "esc-back-peel": "BJJ peel hooks escape back control tutorial",
    "esc-armbar": "BJJ armbar defense escape stacked tutorial",
    "esc-side-granby": "BJJ granby roll escape side control",
    "leg-pass-entry": "BJJ failed pass to ashi garami leg entanglement entry",
    "con-head-hips": "BJJ control the head and hips concept",
    "con-risk": "BJJ risk versus reward strategy",
    "con-cooking": "BJJ cooking stalling pressure concept",
    "pos-high-half": "BJJ high half coyote guard explained",
    "half-underhook": "BJJ underhook from half guard tutorial",
    "pass-split-sit": "BJJ split squat sit butterfly pass tutorial",
    "sweep-k-invert": "BJJ K guard inversion sweep tutorial",
    "pos-saddle": "BJJ saddle 411 honey hole explained",
    "pos-high-guard": "BJJ high guard explained tutorial",
    "pos-williams": "BJJ Williams guard 10th planet explained",
    "pos-x-guard": "BJJ x-guard basics explained",
    "pos-worm": "BJJ worm guard keenan explained",
    "pass-float": "BJJ float pass tutorial",
    "pos-kesa": "BJJ kesa gatame explained",
    "back-cowboy": "BJJ cowboy position back control",
    "stand-body-lock": "BJJ standing body lock takedown tutorial",
    "sub-sliding-collar": "BJJ sliding collar choke tutorial",
    "sub-anaconda": "How to do the anaconda choke BJJ tutorial",
    "sub-toe-hold": "How to do a toe hold BJJ tutorial",
    "sweep-dlr": "BJJ de la riva sweep tutorial",
    "pos-closed-guard": "BJJ closed guard basics explained",
    "pos-half-guard": "BJJ half guard bottom explained",
    "pos-deep-half": "BJJ deep half guard explained tutorial",
    "pass-leg-drag": "BJJ leg drag pass tutorial",
    "sub-cross-collar": "BJJ cross collar choke from mount tutorial",
    "stand-jump-closed": "BJJ jumping closed guard pull tutorial",
    "con-scoring": "IBJJF scoring system explained BJJ points",
    "pos-gift-wrap": "BJJ gift wrap position tutorial",
    "pass-vs-dlr": "BJJ how to pass de la riva guard",
    "esc-side-underhook": "BJJ side control underhook escape turn in",
    "sub-von-flue": "BJJ von flue choke tutorial",
    "half-top": "BJJ top half guard passing explained",
}


def query_for(skill: dict) -> str:
    if skill["id"] in QUERY_OVERRIDES:
        return QUERY_OVERRIDES[skill["id"]]
    name = skill["name"].replace("/", " ").replace("&", " ")
    kind = skill["kind"]
    if kind == "technique":
        return f"BJJ {name} tutorial"
    if kind == "position":
        return f"BJJ {name} explained"
    if kind == "concept":
        return f"BJJ {name} concept explained"
    if kind in {"group", "domain"}:
        return f"BJJ {name} overview tutorial"
    return f"BJJ {name}"


def parse_seconds(text: str) -> int | None:
    if not text:
        return None
    parts = text.strip().split(":")
    try:
        nums = [int(p) for p in parts]
    except ValueError:
        return None
    if len(nums) == 3:
        return nums[0] * 3600 + nums[1] * 60 + nums[2]
    if len(nums) == 2:
        return nums[0] * 60 + nums[1]
    if len(nums) == 1:
        return nums[0]
    return None


def extract_videos(html: str) -> list[dict]:
    videos = []
    seen: set[str] = set()
    for m in re.finditer(r'"videoRenderer":\{"videoId":"([A-Za-z0-9_-]{11})"', html):
        vid = m.group(1)
        if vid in seen:
            continue
        seen.add(vid)
        chunk = html[m.start() : m.start() + 6500]
        tm = re.search(r'"title":\{"runs":\[\{"text":"([^"]+)"', chunk)
        lm = re.search(
            r'"lengthText":\{"accessibility":\{"accessibilityData":\{"label":"[^"]+"\}\},"simpleText":"([^"]+)"\}',
            chunk,
        )
        if not lm:
            lm = re.search(r'"simpleText":"(\d{1,2}:\d{2}(?::\d{2})?)"', chunk)
        om = re.search(r'"ownerText":\{"runs":\[\{"text":"([^"]+)"', chunk)
        if not om:
            om = re.search(r'"shortBylineText":\{"runs":\[\{"text":"([^"]+)"', chunk)
        title = clean_json_str(tm.group(1) if tm else "")
        channel = clean_json_str(om.group(1) if om else "")
        videos.append(
            {
                "youtube": vid,
                "title": title,
                "channel": channel,
                "length": lm.group(1) if lm else "",
                "seconds": parse_seconds(lm.group(1) if lm else ""),
            }
        )
    return videos


def clean_json_str(s: str) -> str:
    s = s.replace('\\"', '"').replace("\\/", "/")
    s = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), s)
    # Drop leaked innertube JSON if a regex overran.
    s = s.split('","')[0].split('","navigationEndpoint')[0]
    return s.strip()


def score(video: dict, skill: dict) -> float:
    title = (video.get("title") or "").lower()
    channel = (video.get("channel") or "").lower()
    name = skill["name"].lower()
    tokens = [t for t in re.split(r"[^a-z0-9]+", name) if len(t) > 2]
    s = 0.0
    hits = sum(1 for t in tokens if t in title)
    if tokens:
        s += 12 * hits / len(tokens)
    if SKIP_TITLE.search(title):
        s -= 12
    if any(
        w in title
        for w in (
            "tutorial",
            "how to",
            "fundamentals",
            "explained",
            "breakdown",
            "step by step",
        )
    ):
        s += 5
    if any(
        w in title
        for w in ("bjj", "jiu jitsu", "jiujitsu", "judo", "grappling", "nogi", "no-gi")
    ):
        s += 2
    secs = video.get("seconds")
    if secs is None:
        s -= 1
    elif 45 <= secs <= 480:
        s += 10
    elif 20 <= secs < 45:
        s += 5
    elif 480 < secs <= 900:
        s += 6
    elif 900 < secs <= 1500:
        s += 2
    else:
        s -= 4
    if any(p in channel for p in PREFERRED_CHANNELS):
        s += 4
    return s


def search_youtube(query: str) -> list[dict]:
    url = (
        "https://www.youtube.com/results?search_query="
        + urllib.parse.quote(query)
        + "&sp=EgIQAQ%3D%3D"
    )
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"}
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        html = resp.read().decode("utf-8", "replace")
    return extract_videos(html)


def pick_for(skill: dict) -> dict | None:
    q = query_for(skill)
    try:
        videos = search_youtube(q)
    except Exception as exc:
        print(f"ERR {skill['id']}: {exc}")
        return None
    if not videos:
        return None
    ranked = sorted(videos, key=lambda v: score(v, skill), reverse=True)
    best = ranked[0]
    return {
        "youtube": best["youtube"],
        "title": best["title"][:160],
        "channel": best["channel"][:80],
        "seconds": best.get("seconds"),
        "query": q,
    }


def write_ts(mapping: dict) -> None:
    lines = [
        "export interface TechniqueVideo {",
        "  youtube: string;",
        "  title: string;",
        "  channel: string;",
        "  seconds?: number;",
        "}",
        "",
        "export const VIDEOS: Record<string, TechniqueVideo> = {",
    ]
    for sid in sorted(mapping):
        v = mapping[sid]
        title = json.dumps(v["title"], ensure_ascii=False)
        channel = json.dumps(v["channel"], ensure_ascii=False)
        extra = (
            f", seconds: {int(v['seconds'])}"
            if v.get("seconds") is not None
            else ""
        )
        lines.append(
            f"  {json.dumps(sid)}: {{ youtube: {json.dumps(v['youtube'])}, title: {title}, channel: {channel}{extra} }},"
        )
    lines.append("};")
    lines.append("")
    lines.append("export function videoOf(id: string): TechniqueVideo | undefined {")
    lines.append("  return VIDEOS[id];")
    lines.append("}")
    lines.append("")
    OUT_TS.write_text("\n".join(lines))


def main() -> None:
    skills = parse_skills()
    wanted = [s for s in skills if s["kind"] in {"technique", "position", "concept"}]
    existing: dict = {}
    # Always rewrite titles/channels with the fixed parser.
    todo = wanted
    print(f"skills={len(wanted)} already={len(existing)} todo={len(todo)}")

    def work(skill: dict) -> tuple[str, dict | None]:
        time.sleep(0.05)
        return skill["id"], pick_for(skill)

    done = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = [pool.submit(work, s) for s in todo]
        for fut in as_completed(futs):
            sid, vid = fut.result()
            done += 1
            if vid:
                existing[sid] = vid
                print(
                    f"OK  {done}/{len(todo)} {sid} -> {vid['youtube']}  {vid['title'][:70]}"
                )
            else:
                print(f"MISS {done}/{len(todo)} {sid}")
            if done % 20 == 0:
                OUT_JSON.write_text(json.dumps(existing, indent=2))
                write_ts(existing)

    OUT_JSON.write_text(json.dumps(existing, indent=2))
    write_ts(existing)
    print(f"wrote {len(existing)} videos")


if __name__ == "__main__":
    main()
