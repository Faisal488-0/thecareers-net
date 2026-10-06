#!/usr/bin/env python3
import html
import json
import pathlib
import re
import time
import urllib.error
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGETS = json.loads((ROOT / "targets.json").read_text(encoding="utf-8"))
OUT = ROOT / "generated"
OUT.mkdir(parents=True, exist_ok=True)

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "noscript", "svg"}:
            self.skip += 1
    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript", "svg"} and self.skip:
            self.skip -= 1
    def handle_data(self, data):
        if not self.skip:
            s = re.sub(r"\s+", " ", html.unescape(data)).strip()
            if s:
                self.parts.append(s)

def fetch(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 MiroFish-Site-Lab/1.0",
            "Accept": "text/html,application/xhtml+xml"
        },
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        raw = r.read(2_000_000)
        charset = r.headers.get_content_charset() or "utf-8"
        return r.geturl(), raw.decode(charset, errors="replace")

def clean_html(doc):
    p = TextExtractor()
    p.feed(doc)
    text = "\n".join(p.parts)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text[:120_000]

summary = []
for target in TARGETS["targets"]:
    attempts = [target["url"], *target.get("fallback_urls", [])]
    used = None
    page_text = ""
    errors = []
    for url in attempts:
        try:
            used, body = fetch(url)
            page_text = clean_html(body)
            if page_text:
                break
        except Exception as exc:
            errors.append(f"{url}: {type(exc).__name__}: {exc}")
    seed = [
        f"# Live-site seed: {target['name']}",
        "",
        f"Repository: {target['repo']}",
        f"Primary URL: {target['url']}",
        f"Fetched URL: {used or 'UNAVAILABLE'}",
        f"Audience: {', '.join(target['audiences'])}",
        f"Goal: {target['goal']}",
        "",
    ]
    if page_text:
        seed += ["## Captured public text", "", page_text]
        status = "captured"
    else:
        seed += ["## Capture failure", "", *[f"- {e}" for e in errors], "", "Do not infer unseen live-page content from this seed."]
        status = "fetch_failed"
    (OUT / f"{target['id']}.md").write_text("\n".join(seed), encoding="utf-8")
    summary.append({"id": target["id"], "status": status, "fetched_url": used, "errors": errors})
    time.sleep(1)

(OUT / "snapshot-status.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(summary, ensure_ascii=False, indent=2))
