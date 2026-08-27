# -*- coding: utf-8 -*-
"""
Analyse statistique des sessions Claude Code du projet (transcripts .jsonl).
Parcourt en STREAMING (jamais de chargement complet) et compte :
  - la frequence d'usage des outils (tool_use)
  - les motifs recurrents dans les commandes shell (Bash/PowerShell)
  - les fichiers les plus edites (Edit/Write)
But : objectiver les redondances -> justifier les skills Claude Code du projet.
Usage :  python scripts_doc/session_stats.py [dossier_projects]
Sortie : tableau texte sur stdout + JSON a cote (session_stats.json en scratchpad ou cwd).
"""
import json, sys, os, re, glob
from collections import Counter

DEFAULT_DIR = os.path.expanduser(r"~/.claude/projects/E--ERP-derniere-version")

PATTERNS = [
    ("verify: tsc (typecheck)",          re.compile(r"\btsc\b")),
    ("verify: npm run build",            re.compile(r"npm run build")),
    ("verify: harnais esbuild+node",     re.compile(r"esbuild .*--bundle")),
    ("verify: e2e app.request",          re.compile(r"app\.request")),
    ("db: DDL Management API",           re.compile(r"api\.supabase\.com")),
    ("db: sonde REST anon",              re.compile(r"rest/v1")),
    ("db: NOTIFY pgrst",                 re.compile(r"notify pgrst", re.I)),
    ("deploy/dev: wrangler",             re.compile(r"wrangler")),
    ("git: add/commit",                  re.compile(r"git (add|commit)")),
    ("rtk (economie tokens)",            re.compile(r"\brtk\b")),
    ("python inline (sondes/imports)",   re.compile(r"python -")),
]

def main():
    d = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DIR
    files = sorted(glob.glob(os.path.join(d, "*.jsonl")))
    tools, cmds, edits, lines = Counter(), Counter(), Counter(), 0
    per_session = {}
    for f in files:
        n_tools = 0
        with open(f, "r", encoding="utf-8", errors="replace") as fh:
            for line in fh:
                lines += 1
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                msg = obj.get("message") or {}
                content = msg.get("content")
                if not isinstance(content, list):
                    continue
                for blk in content:
                    if not isinstance(blk, dict) or blk.get("type") != "tool_use":
                        continue
                    name = blk.get("name", "?")
                    tools[name] += 1
                    n_tools += 1
                    inp = blk.get("input") or {}
                    if name in ("Bash", "PowerShell"):
                        cmd = str(inp.get("command", ""))
                        for label, rx in PATTERNS:
                            if rx.search(cmd):
                                cmds[label] += 1
                    elif name in ("Edit", "Write"):
                        fp = str(inp.get("file_path", ""))
                        if fp:
                            edits[os.path.basename(fp)] += 1
        per_session[os.path.basename(f)] = n_tools
    out = {
        "sessions": len(files), "events_jsonl": lines,
        "tool_calls_total": sum(tools.values()),
        "tools": dict(tools.most_common()),
        "commande_motifs": dict(cmds.most_common()),
        "fichiers_les_plus_edites": dict(edits.most_common(25)),
        "par_session": per_session,
    }
    dst = os.path.join(os.getcwd(), "session_stats.json")
    with open(dst, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
    print("== %d sessions, %d evenements, %d appels d'outils ==" % (len(files), lines, out["tool_calls_total"]))
    print("\n-- Outils --")
    for k, v in tools.most_common(15):
        print("  %-28s %5d" % (k, v))
    print("\n-- Motifs de commandes (redondances -> skills) --")
    for k, v in cmds.most_common():
        print("  %-34s %5d" % (k, v))
    print("\n-- Fichiers les plus edites --")
    for k, v in edits.most_common(15):
        print("  %-34s %5d" % (k, v))
    print("\nJSON -> %s" % dst)

if __name__ == "__main__":
    main()
