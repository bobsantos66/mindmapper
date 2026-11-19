"""Script checks: --help works, every example lints clean, the bad example fails for the right reasons,
and every committed rendered output is reproduced byte-for-byte (so README numbers stay honest)."""
import glob
import json
import os
import subprocess
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "scripts", "ugc_script.py")
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import ugc_script  # noqa: E402


def run(*args):
    return subprocess.run([sys.executable, SCRIPT, *args], cwd=ROOT, capture_output=True, text=True)


def examples():
    return sorted(glob.glob(os.path.join(ROOT, "examples", "scripts", "*.json")))


class TestCli(unittest.TestCase):
    def test_help(self):
        self.assertEqual(run("--help").returncode, 0)
        for cmd in ("lint", "render", "prompts", "stats", "new"):
            self.assertEqual(run(cmd, "--help").returncode, 0, cmd)

    def test_missing_file(self):
        self.assertEqual(run("lint", "nope.json").returncode, 2)

    def test_at_least_eight_examples(self):
        self.assertGreaterEqual(len(examples()), 8)


class TestExamplesLint(unittest.TestCase):
    def test_every_example_is_clean(self):
        for path in examples():
            with self.subTest(os.path.basename(path)):
                with open(path, encoding="utf-8") as fh:
                    r = ugc_script.lint(json.load(fh))
                self.assertEqual(r.errors, [])
                self.assertEqual(r.warnings, [])

    def test_hook_inside_two_seconds(self):
        for path in examples():
            with open(path, encoding="utf-8") as fh:
                s = json.load(fh)
            self.assertLessEqual(s["shots"][0]["end_s"], 2.0, path)

    def test_verticals_are_distinct(self):
        verts = []
        for path in examples():
            with open(path, encoding="utf-8") as fh:
                verts.append(json.load(fh)["vertical"])
        self.assertEqual(len(verts), len(set(verts)), verts)


class TestBadExample(unittest.TestCase):
    def test_fake_testimonial_fails(self):
        path = os.path.join(ROOT, "examples", "bad", "fake-testimonial.json")
        with open(path, encoding="utf-8") as fh:
            r = ugc_script.lint(json.load(fh))
        msgs = " | ".join(m for _, m in r.errors)
        self.assertIn("first-person customer testimonial", msgs)
        self.assertIn("third-party endorsement", msgs)
        self.assertIn("has no evidence", msgs)
        self.assertIn("'guaranteed' is a claim", msgs)
        self.assertIn("ai_label is empty", msgs)
        self.assertIn("hook shot ends at 3s", msgs)
        self.assertIn("missing beat(s): proof", msgs)
        out = run("lint", path)
        self.assertEqual(out.returncode, 1)
        summary = out.stdout.strip().splitlines()[-1]
        self.assertTrue(summary.endswith(f"fake-testimonial.json: failed, {len(r.errors)} errors, {len(r.warnings)} warnings"), summary)
        for doc in ("README.md", "demo.txt"):
            with open(os.path.join(ROOT, doc), encoding="utf-8") as fh:
                self.assertIn(f"{len(r.errors)} errors, {len(r.warnings)} warnings", fh.read(), doc)

    def test_real_person_may_testify(self):
        s = {"presenter": {"type": "real_person"}}
        self.assertFalse(ugc_script.any_match(ugc_script.TESTIMONIAL_PATTERNS, "nothing personal here"))
        self.assertTrue(ugc_script.any_match(ugc_script.TESTIMONIAL_PATTERNS, "I've been using it for a month"))
        self.assertEqual(s["presenter"]["type"], "real_person")


class TestReproducible(unittest.TestCase):
    def test_rendered_markdown_matches(self):
        for path in examples():
            name = os.path.splitext(os.path.basename(path))[0]
            with self.subTest(name):
                expected = os.path.join(ROOT, "examples", "rendered", name + ".md")
                with open(path, encoding="utf-8") as fh:
                    got = ugc_script.render_markdown(json.load(fh))
                with open(expected, encoding="utf-8") as fh:
                    self.assertEqual(got, fh.read())

    def test_prompts_match(self):
        for path in examples():
            name = os.path.splitext(os.path.basename(path))[0]
            with self.subTest(name):
                expected = os.path.join(ROOT, "examples", "prompts", name + ".txt")
                with open(path, encoding="utf-8") as fh:
                    got = ugc_script.render_prompts(json.load(fh), "all")
                with open(expected, encoding="utf-8") as fh:
                    self.assertEqual(got, fh.read())

    def test_stats_quoted_in_readme(self):
        """README quotes stats for skincare-serum; keep them in sync."""
        with open(os.path.join(ROOT, "examples", "scripts", "skincare-serum.json"), encoding="utf-8") as fh:
            st = ugc_script.stats(json.load(fh))
        with open(os.path.join(ROOT, "README.md"), encoding="utf-8") as fh:
            readme = fh.read()
        self.assertIn(f"{st['voiceover_words']} words", readme)
        self.assertIn(f"{st['voiceover_wps']} words/s", readme)


class TestScaffold(unittest.TestCase):
    def test_scaffold_timeline_is_contiguous(self):
        s = ugc_script.scaffold("skincare", "Test Serum", 30)
        prev = 0
        for shot in s["shots"]:
            self.assertEqual(shot["start_s"], prev)
            prev = shot["end_s"]
        self.assertEqual(prev, 30)
        self.assertEqual(s["shots"][0]["end_s"], ugc_script.HOOK_MAX_S)
        self.assertEqual([x["beat"] for x in s["shots"]], ugc_script.BEATS)

    def test_scaffold_cli_is_json(self):
        out = run("new", "--vertical", "pets", "--product", "Chew", "--duration", "15")
        self.assertEqual(out.returncode, 0)
        self.assertEqual(json.loads(out.stdout)["duration_s"], 15)


if __name__ == "__main__":
    unittest.main()
