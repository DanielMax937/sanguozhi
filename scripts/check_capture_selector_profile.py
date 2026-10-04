"""Validate P0-46's source-bound reference model, not an original game EXE.

Run: python scripts/check_capture_selector_profile.py
Optional local evidence check (no game execution):
  python scripts/check_capture_selector_profile.py --source-dir /path/to/idb_static
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import itertools
import json
import re
import unittest
from collections import Counter
from pathlib import Path
from unittest.mock import patch

import capture_selector_profile as model

ROOT = Path(__file__).resolve().parents[1]
PROVENANCE = {
    "qualification": "synthetic fixture: already-qualified selector candidates",
    "ordering": "fixture sequence; never sorted by ID/type/level/price/location",
    "source": "self-authored bounded reference tests; not a game capture",
}


def context(**changes):
    options = {
        "provenance": PROVENANCE,
        "commander_charm": 60,
        "capturing_force_id": 0,
        "profile_id": model.PROFILE_ID,
        "source_fingerprint": model.SOURCE_FINGERPRINT,
    }
    options.update(changes)
    return options


def select(ids, *, draws=None, **changes):
    if draws is None:
        draws = list(range(len(ids))) if len(ids) > 1 else []
    return model.select_capture_facilities(ids, raw_draws=draws, **context(**changes))


class CaptureSelectorChecks(unittest.TestCase):
    def test_source_identity_is_mod_associated_not_stock_verified(self):
        self.assertIn("血色5.0公测", model.SOURCE_IDENTITY["idbRecordedInputPath"])
        self.assertEqual(model.SOURCE_FINGERPRINT,
                         "c6dc72a39ec2a0c09844ce81f6984701bc6490e6676a9311234d4a3c2e9c00a4")
        d = json.loads((ROOT / "docs/sources/capture-selector-source-profile.json")
                       .read_text(encoding="utf-8"))
        self.assertEqual(d["schemaVersion"], 1)
        self.assertEqual(d["audit"], "P0-46")
        self.assertEqual(d["profile"]["id"], model.PROFILE_ID)
        self.assertEqual(d["algorithm"]["id"], model.ALGORITHM_ID)
        self.assertEqual(d["profile"]["stockPcPk11Equivalence"], "open")
        self.assertEqual(d["referenceModel"]["rngAdapter"], model.ENGINEERING_RNG_ID)
        self.assertEqual(d["referenceModel"]["traceSchemaVersion"], model.TRACE_SCHEMA_VERSION)
        self.assertEqual(d["sourceFingerprint"], model.SOURCE_FINGERPRINT)
        self.assertEqual(d["sourceIdentity"], model.SOURCE_IDENTITY)
        canonical = json.dumps(d["sourceIdentity"], sort_keys=True, separators=(",", ":"),
                               ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.assertEqual(hashlib.sha256(canonical).hexdigest(), model.SOURCE_FINGERPRINT)

    def test_committed_opcode_excerpt_hashes_and_call_targets(self):
        d = json.loads((ROOT / "docs/sources/capture-selector-source-profile.json")
                       .read_text(encoding="utf-8"))
        excerpt = (ROOT / "docs/sources" / d["checkedInExcerpt"]["path"]).read_bytes()
        self.assertEqual(hashlib.sha256(excerpt).hexdigest(), d["checkedInExcerpt"]["sha256"])
        instructions = {}
        memory = {}
        for line in excerpt.decode("utf-8").splitlines():
            match = re.match(r"^([0-9A-F]{8})\s+((?:[0-9a-f]{2} )*[0-9a-f]{2})\s{2,}", line)
            if not match:
                continue
            address = int(match.group(1), 16)
            raw = bytes.fromhex(match.group(2))
            self.assertNotIn(address, instructions)
            instructions[address] = raw
            for offset, value in enumerate(raw):
                self.assertNotIn(address + offset, memory)
                memory[address + offset] = value
        functions = {item["start"]: item for item in d["functions"]}
        for address in d["checkedInExcerpt"]["fullFunctionStarts"]:
            item = functions[address]
            start, end = int(address, 16), int(item["endExclusive"], 16)
            raw = bytes(memory[at] for at in range(start, end))
            self.assertEqual(len(raw), item["byteCount"])
            self.assertEqual(len(raw), item["decodedByteCount"])
            self.assertEqual(hashlib.sha256(raw).hexdigest(), item["rawSha256"])
        for address, digest in model.SOURCE_IDENTITY["functionRawSha256"].items():
            self.assertEqual(functions[address]["rawSha256"], digest)
        for address, target in ((0x004B3532, 0x00689BF0), (0x00689C17, 0x00472150),
                                (0x004B357D, 0x004B09B0), (0x004B3511, 0x004890B0),
                                (0x005926DC, 0x004B2CA0), (0x00597E94, 0x004B2CA0),
                                (0x005B1BF5, 0x004B2CA0)):
            raw = instructions[address]
            self.assertEqual((len(raw), raw[0]), (5, 0xE8))
            self.assertEqual(address + 5 + int.from_bytes(raw[1:], "little", signed=True), target)

    def test_full_range_swap_exact_vector_and_suffix(self):
        t = select(list("abcdef"), draws=[1, 3, 2, 3, 0, 1])
        self.assertEqual(t["outcome"]["shuffledIds"], list("efcabd"))
        self.assertEqual(t["outcome"]["destroyedIds"], list("efc"))
        self.assertEqual(t["outcome"]["retainedIds"], list("abd"))
        self.assertEqual(t["draws"], [
            {"index": i, "bound": 6, "value": r}
            for i, r in enumerate([1, 3, 2, 3, 0, 1])])

    def test_charm_byte_bins_and_no_artificial_five_cap(self):
        for charm, expected in [(0, 1), (19, 1), (20, 1), (39, 1), (40, 2),
                                (59, 2), (60, 3), (79, 3), (80, 4), (99, 4),
                                (100, 5), (119, 5), (120, 6), (255, 12)]:
            with self.subTest(charm=charm):
                t = select(list(range(30)), commander_charm=charm)
                self.assertEqual(t["outcome"]["keepCount"], expected)
        for n in range(31):
            for charm in range(256):
                t = select(list(range(n)), commander_charm=charm)
                self.assertEqual(t["outcome"]["keepCount"], min(n, max(20, charm) // 20))

    def test_zero_and_one_candidates_make_no_rng_calls(self):
        for ids in ([], ["only"]):
            for force in (0, 41, -1, 42):
                for draw_mode in ({"seed": "fixture"}, {"source_rng_state": 1}):
                    with patch.object(model, "engineering_draws", side_effect=AssertionError("RNG called")), \
                         patch.object(model, "source_lcg_draws", side_effect=AssertionError("RNG called")):
                        t = model.select_capture_facilities(ids, **context(capturing_force_id=force),
                                                            **draw_mode)
                    self.assertEqual(t["draws"], [])
                    self.assertEqual(t["outcome"]["rngCallCount"], 0)
                    self.assertEqual(t["outcome"]["shuffleHelperInvocations"], 1)
                    self.assertEqual(t["outcome"]["keepCount"], len(ids) if 0 <= force <= 41 else 0)

    def test_all_retained_still_shuffles_and_consumes_n_draws(self):
        t = select(list("abcdef"), draws=[1, 3, 2, 3, 0, 1], commander_charm=120)
        self.assertEqual(t["outcome"]["destroyedIds"], [])
        self.assertEqual(t["outcome"]["retainedIds"], list("efcabd"))
        self.assertEqual(t["outcome"]["rngCallCount"], 6)
        with self.assertRaises(ValueError):
            select(list("abcdef"), draws=[], commander_charm=120)

    def test_runtime_evidence_labels_and_source_state_metadata(self):
        t = model.select_capture_facilities(list("abcdef"), source_rng_state=1, **context())
        self.assertEqual(t["evidence"], model.EVIDENCE)
        self.assertEqual(t["evidence"]["scope"], "fixed-idb-selector-only")
        self.assertFalse(t["evidence"]["stockOriginalVerified"])
        bad = copy.deepcopy(t)
        bad["rng"]["finalState"] = 0
        with self.assertRaises(ValueError):
            model.replay_capture_facilities(bad, list("abcdef"), **context())
        for ids in ([], ["a"]):
            empty = model.select_capture_facilities(ids, source_rng_state=123, **context())
            self.assertEqual(empty["rng"]["finalState"], 123)

    def test_force_id_override_after_shuffle(self):
        for force in (-2**31, -1, 42, 46, 2**31 - 1):
            t = select(list("abcdef"), draws=[1, 3, 2, 3, 0, 1],
                       commander_charm=255, capturing_force_id=force)
            self.assertEqual(t["outcome"]["nominalKeepCount"], 6)
            self.assertEqual(t["outcome"]["retainedIds"], [])
            self.assertEqual(t["outcome"]["destroyedIds"], list("efcabd"))
            self.assertEqual(t["outcome"]["rngCallCount"], 6)
        for force in (0, 41):
            self.assertEqual(select(list("abc"), capturing_force_id=force)["outcome"]["keepCount"], 3)

    def test_missing_person_requires_explicit_policy(self):
        with self.assertRaises(ValueError):
            select(list("abcd"), commander_charm=None)
        t = select(list("abcd"), commander_charm=None, missing_charm_policy="source-default-20")
        self.assertEqual(t["inputs"]["effectiveCharm"], 20)
        self.assertEqual(t["outcome"]["keepCount"], 1)
        self.assertEqual(t["outcome"], select(list("abcd"), commander_charm=20)["outcome"])
        with self.assertRaises(ValueError):
            select(list("abcd"), commander_charm=None, missing_charm_policy="sovereign")

    def test_source_lcg_golden_vectors_update_before_output_and_wrap(self):
        self.assertEqual(model.source_lcg_draws(1, 6, 6),
                         ([1, 3, 2, 3, 0, 1], 0xF01FBD9B))
        self.assertEqual(model.source_lcg_draws(0, 7, 7),
                         ([0, 0, 6, 5, 0, 2, 5], 1862864275))
        self.assertEqual(model.source_lcg_draws(0xFFFFFFFF, 7, 7),
                         ([3, 4, 4, 3, 3, 6, 4], 2446797254))
        self.assertEqual(model.source_lcg_draws(123, 1, 3), ([0, 0, 0], 123))
        t = model.select_capture_facilities(list("abcdef"), source_rng_state=1, **context())
        self.assertEqual(t["outcome"]["retainedIds"], list("abd"))
        self.assertEqual(t["rng"]["adapter"], model.SOURCE_RNG_ID)
        self.assertEqual(t["rng"]["finalState"], 0xF01FBD9B)

    def test_engineering_seed_adapter_has_stable_golden_vector(self):
        self.assertEqual(model.engineering_draws("P0-46 example", 7, 7), [4, 4, 3, 4, 3, 1, 6])
        a = model.select_capture_facilities(list("abcdefg"), seed="P0-46 example", **context())
        b = model.select_capture_facilities(list("abcdefg"), seed="P0-46 example", **context())
        self.assertEqual(a, b)
        self.assertEqual(a["rng"]["adapter"], model.ENGINEERING_RNG_ID)
        self.assertNotEqual(model.ENGINEERING_RNG_ID, model.SOURCE_RNG_ID)

    def test_source_swaps_are_not_uniform_subset_sampling(self):
        # Under even the stronger hypothetical of independent uniform draws,
        # the source's 27 equally weighted n=3 paths are not Fisher-Yates.
        # This is a combinatorial fixture, not a claim about game RNG statistics.
        first_destroyed = Counter()
        for draws in itertools.product(range(3), repeat=3):
            t = select(list("abc"), draws=draws, commander_charm=40)
            first_destroyed[t["outcome"]["destroyedIds"][0]] += 1
        self.assertEqual(first_destroyed, Counter({"a": 9, "b": 10, "c": 8}))

    def test_order_is_preserved_and_hash_bound(self):
        a = select(["z", "a", "m", "b"], commander_charm=20)
        b = select(["a", "b", "m", "z"], commander_charm=20)
        self.assertEqual(a["outcome"]["shuffledIds"], ["z", "a", "m", "b"])
        self.assertNotEqual(a["orderedCandidatesHash"], b["orderedCandidatesHash"])
        self.assertEqual(a["outcome"]["retainedIds"], ["b"])
        with self.assertRaises(ValueError):
            model.replay_capture_facilities(a, ["a", "b", "m", "z"], **context(commander_charm=20))

    def test_replay_all_modes_without_any_rng(self):
        for mode in ({"seed": "fixture"}, {"source_rng_state": 1}, {"raw_draws": [1, 3, 2, 3, 0, 1]}):
            t = model.select_capture_facilities(list("abcdef"), **context(), **mode)
            wire = json.loads(json.dumps(t))
            with patch.object(model, "engineering_draws", side_effect=AssertionError("RNG called")), \
                 patch.object(model, "source_lcg_draws", side_effect=AssertionError("RNG called")):
                self.assertEqual(model.replay_capture_facilities(wire, list("abcdef"), **context()), t)

    def test_replay_rejects_version_hash_context_and_output_mismatch(self):
        t = select(list("abcd"))
        mutations = [
            ("schemaVersion", 2), ("schemaVersion", True),
            ("algorithmId", "fisher-yates-v1"), ("profileId", "stock-pk1.1"),
            ("sourceFingerprint", "0" * 64), ("orderedCandidatesHash", "0" * 64),
            ("inputsHash", "0" * 64), ("traceHash", "0" * 64),
        ]
        for key, value in mutations:
            bad = copy.deepcopy(t)
            bad[key] = value
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                model.replay_capture_facilities(bad, list("abcd"), **context())
        for field, value in (("commander_charm", 59), ("capturing_force_id", 42),
                             ("missing_charm_policy", "source-default-20"),
                             ("profile_id", "other"), ("source_fingerprint", "0" * 64),
                             ("provenance", {**PROVENANCE, "ordering": "another source order"})):
            with self.subTest(field=field), self.assertRaises(ValueError):
                model.replay_capture_facilities(t, list("abcd"), **context(**{field: value}))
        for change in (lambda d: d["evidence"].update(stockOriginalVerified=True),
                       lambda d: d["outcome"]["retainedIds"].reverse(),
                       lambda d: d["inputs"]["candidateIds"].reverse(),
                       lambda d: d.update(extra="unknown field"),
                       lambda d: d["rng"].update(adapter="future-rng-v2")):
            bad = copy.deepcopy(t)
            change(bad)
            with self.assertRaises(ValueError):
                model.replay_capture_facilities(bad, list("abcd"), **context())

    def test_replay_rejects_draw_tampering(self):
        t = select(list("abcd"))
        for key, value in (("index", 1), ("index", False), ("bound", 3),
                           ("bound", 4.0), ("value", -1), ("value", 4),
                           ("value", True), ("value", 0.0)):
            bad = copy.deepcopy(t)
            bad["draws"][0][key] = value
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                model.replay_capture_facilities(bad, list("abcd"), **context())
        bad = copy.deepcopy(t)
        bad["draws"].pop()
        with self.assertRaises(ValueError):
            model.replay_capture_facilities(bad, list("abcd"), **context())

    def test_invalid_input_bounds_and_duplicate_ids(self):
        for ids in ([1, 1], [True], [-1], [""], [1.0], [{"id": 1}], list(range(31)),
                    {1, 2}, "abc", iter([1, 2])):
            with self.subTest(ids=repr(ids)), self.assertRaises(ValueError):
                model.select_capture_facilities(ids, raw_draws=[], **context())
        for charm in (-1, 256, True, 40.0, "40"):
            with self.subTest(charm=charm), self.assertRaises(ValueError):
                select([1], commander_charm=charm)
        for force in (-2**31 - 1, 2**31, True, 0.0, None):
            with self.subTest(force=force), self.assertRaises(ValueError):
                select([1], capturing_force_id=force)
        for provenance in ({}, {**PROVENANCE, "ordering": " "}, {**PROVENANCE, "extra": "x"}):
            with self.assertRaises(ValueError):
                select([1], provenance=provenance)
        for profile_change in ({"profile_id": "PC-PK1.1"}, {"source_fingerprint": "0" * 64}):
            with self.assertRaises(ValueError):
                select([1], **profile_change)

    def test_invalid_draws_and_ambiguous_rng_modes(self):
        for draws in ([], [0], [0, 1, 2], [-1, 0], [0, 2], [True, 0], [0.0, 1], {0, 1}):
            with self.subTest(draws=draws), self.assertRaises(ValueError):
                select(["a", "b"], draws=draws)
        for modes in ({}, {"seed": "x", "raw_draws": [0, 1]},
                      {"seed": "x", "source_rng_state": 1},
                      {"seed": 1}, {"source_rng_state": -1},
                      {"source_rng_state": 2**32}, {"source_rng_state": True}):
            with self.subTest(modes=modes), self.assertRaises(ValueError):
                model.select_capture_facilities(["a", "b"], **context(), **modes)
        for ids in ([], ["a"]):
            with self.assertRaises(ValueError):
                select(ids, draws=[0])

    def test_input_objects_are_never_mutated(self):
        ids, provenance, draws = list("abcdef"), dict(PROVENANCE), [1, 3, 2, 3, 0, 1]
        before = copy.deepcopy((ids, provenance, draws))
        t = model.select_capture_facilities(ids, provenance=provenance, raw_draws=draws,
                                            **{k: v for k, v in context().items() if k != "provenance"})
        model.replay_capture_facilities(t, ids, **context())
        self.assertEqual((ids, provenance, draws), before)


def check_local_static_evidence(source_dir: Path) -> None:
    """Only hash inert extracted bytes/metadata. Never load or run a binary."""
    d = json.loads((source_dir / "manifest.json").read_text(encoding="utf-8"))
    identity = model.SOURCE_IDENTITY
    assert d["source_commit"] == identity["commit"]
    assert d["source_repo"] == identity["repository"]
    assert d["source_path"] == identity["archivePath"]
    assert d["zip_sha256"] == identity["archiveSha256"]
    assert d["idb_sha256"] == identity["idbSha256"]
    assert d["idb_input_metadata"]["input_file_path"] == identity["idbRecordedInputPath"]
    assert d["idb_input_metadata"]["sha256"] == identity["idbRecordedInputSha256"]
    functions = {item["start"]: item for item in d["functions"]}
    for address, expected_hash in identity["functionRawSha256"].items():
        assert functions[address]["sha256"] == expected_hash
        assert hashlib.sha256((source_dir / f"{address}.raw").read_bytes()).hexdigest() == expected_hash
    print("PASS: source-bound metadata and three extracted function byte hashes match.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path,
                        help="optional directory of inert IDB extraction evidence")
    args = parser.parse_args()
    result = unittest.TextTestRunner(verbosity=2).run(
        unittest.defaultTestLoader.loadTestsFromTestCase(CaptureSelectorChecks))
    if not result.wasSuccessful():
        raise SystemExit(1)
    if args.source_dir is not None:
        check_local_static_evidence(args.source_dir)
    print("PASS: P0-46 source-profile model/trace checks; stock-PC-PK1.1 equivalence remains OPEN.")


if __name__ == "__main__":
    main()
