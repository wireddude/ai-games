#!/usr/bin/env python3
"""
Regenerate the static manifest.json from the .html files in this folder.

Run it whenever you're ready to "promote" new games so the static
manifest.json (used by GitHub Pages / any non-server deployment) stays in
sync with the files on disk:

    python3 update_manifest.py

It uses the exact same discovery logic as server.py (same title regex,
fields, and sort order), so the on-disk manifest matches what the live
server serves.

After it runs, review and commit:

    git diff manifest.json
    git add manifest.json
    git -c commit.gpgsign=false commit -m "Update manifest.json"

No dependencies — Python standard library only.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
MANIFEST = os.path.join(ROOT, "manifest.json")
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)


def discover():
    """Scan ROOT for .html files (excluding index.html) and return a manifest."""
    items = []
    for fn in sorted(os.listdir(ROOT)):
        if not fn.lower().endswith(".html") or fn.lower() == "index.html":
            continue
        path = os.path.join(ROOT, fn)
        if not os.path.isfile(path):
            continue
        title = fn
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                head = fh.read(8192)
            m = TITLE_RE.search(head)
            if m:
                title = m.group(1).strip()
        except OSError:
            pass
        st = os.stat(path)
        items.append(
            {
                "name": fn,
                "title": title,
                "size": st.st_size,
                "modified": int(st.st_mtime),
            }
        )
    return items


def existing_names():
    """Return the set of names already in manifest.json (empty if missing)."""
    try:
        with open(MANIFEST, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return {item["name"] for item in data if "name" in item}
    except (OSError, ValueError):
        return set()


def main():
    items = discover()
    new_names = {item["name"] for item in items}

    with open(MANIFEST, "w", encoding="utf-8") as fh:
        json.dump(items, fh, indent=2)
        fh.write("\n")

    old = existing_names()
    added = sorted(new_names - old)
    removed = sorted(old - new_names)

    print("Wrote %d entries to %s" % (len(items), MANIFEST))
    if added:
        print("\nAdded %d:" % len(added))
        for n in added:
            print("  + " + n)
    if removed:
        print("\nRemoved %d:" % len(removed))
        for n in removed:
            print("  - " + n)
    if not added and not removed:
        print("No entries added or removed (sizes/timestamps may still have refreshed).")

    print("\nNext:")
    print("  git diff manifest.json")
    print("  git add manifest.json")
    print("  git -c commit.gpgsign=false commit -m \"Update manifest.json\"")
    return 0


if __name__ == "__main__":
    sys.exit(main())
