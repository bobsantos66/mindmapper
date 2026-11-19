"""Structure checks: SKILL.md frontmatter, adapters point at it, versions agree, no forbidden strings."""
import json
import os
import re
import subprocess
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = "ugc-ad-director"
FORBIDDEN = ["aeoria", "richpeach", "/Users/", "/Volumes/", "node_modules", "sk-ant-", "sk_live",
             "api_key=", "API_KEY=<real", "TODO: fill", "lorem ipsum"]
TEXT_EXT = {".md", ".py", ".json", ".yml", ".yaml", ".mdc", ".txt", ".svg", ".cff", ""}


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return fh.read()


def frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    assert m, "SKILL.md has no YAML frontmatter"
    out = {}
    for line in m.group(1).split("\n"):
        if ":" in line and not line.startswith(" "):
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip()
        elif line.strip().startswith("version:"):
            out["version"] = line.split(":", 1)[1].strip()
    return out


def tracked_files():
    try:
        out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
        files = [f for f in out.split("\n") if f]
        if files:
            return files
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    files = []
    for base, dirs, names in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in (".git", "__pycache__")]
        for n in names:
            files.append(os.path.relpath(os.path.join(base, n), ROOT))
    return files


class TestSkill(unittest.TestCase):
    def setUp(self):
        self.fm = frontmatter(read("SKILL.md"))

    def test_name_matches_repo(self):
        self.assertEqual(self.fm["name"], REPO)
        self.assertRegex(self.fm["name"], r"^[a-z0-9-]{1,64}$")

    def test_description(self):
        d = self.fm["description"]
        self.assertTrue(1 <= len(d) <= 1024, len(d))
        self.assertNotIn("\n", d)
        for word in ("UGC", "hook", "shot list"):
            self.assertIn(word, d)

    def test_body_under_500_lines(self):
        self.assertLess(len(read("SKILL.md").split("\n")), 500)

    def test_versions_agree(self):
        plugin = json.loads(read(".claude-plugin/plugin.json"))
        self.assertEqual(plugin["name"], REPO)
        self.assertEqual(plugin["version"], self.fm["version"])
        top = re.search(r"^## \[(\d+\.\d+\.\d+)\]", read("CHANGELOG.md"), re.M)
        self.assertEqual(top.group(1), self.fm["version"])


class TestAdapters(unittest.TestCase):
    def test_cursor_rule(self):
        text = read(f".cursor/rules/{REPO}.mdc")
        self.assertIn("@SKILL.md", text)
        self.assertTrue(text.startswith("---\n"))

    def test_agents_and_codex(self):
        self.assertIn("SKILL.md", read("AGENTS.md"))
        self.assertIn("SKILL.md", read("codex/INSTRUCTIONS.md"))

    def test_repo_metadata(self):
        meta = json.loads(read(".github/repo.json"))
        self.assertTrue(meta["description"])
        self.assertLessEqual(len(meta["topics"]), 20)
        self.assertIn("utm_campaign=" + REPO, meta["homepage"])

    def test_readme_links_and_footer(self):
        readme = read("README.md")
        links = re.findall(r"https://uniqai\.app[^\s)\"'>]*", readme)
        self.assertLessEqual(len(links), 3, links)
        for link in links:
            self.assertIn("utm_source=github", link)
            self.assertIn(f"utm_campaign={REPO}", link)
        self.assertEqual(readme.count("Made by"), 1)
        for rel in re.findall(r"\]\((?!http)([^)#]+)\)", readme):
            self.assertTrue(os.path.exists(os.path.join(ROOT, rel)), f"README links to missing {rel}")


class TestForbidden(unittest.TestCase):
    def test_no_forbidden_strings(self):
        hits = []
        for rel in tracked_files():
            ext = os.path.splitext(rel)[1]
            if ext not in TEXT_EXT or rel.startswith("assets/") and ext == ".png":
                continue
            try:
                text = read(rel)
            except UnicodeDecodeError:
                continue
            for i, line in enumerate(text.split("\n"), 1):
                low = line.lower()
                if "conventions-allow: abs-path" in low:
                    continue
                for bad in FORBIDDEN:
                    if bad.lower() in low and not (rel.startswith("tests/") and "FORBIDDEN" in text and bad in line):
                        hits.append(f"{rel}:{i}: {bad}")
        self.assertEqual(hits, [])

    def test_copyright_is_brand(self):
        for rel in tracked_files():
            if os.path.splitext(rel)[1] in TEXT_EXT and not rel.startswith("tests/"):
                try:
                    text = read(rel)
                except UnicodeDecodeError:
                    continue
                for line in text.split("\n"):
                    if "Copyright (c)" in line:
                        self.assertIn("UniqAI", line, f"{rel}: {line}")


if __name__ == "__main__":
    unittest.main()
