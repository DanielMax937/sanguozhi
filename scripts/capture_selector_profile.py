"""Bounded, source-bound SAN11 capture-selector reference model (P0-46).

This is NOT a stock PC-PK1.1 rule or a complete capture engine. The IDB records
an input under ``血色5.0公测``. The caller must provide its already-qualified,
ordered, unique candidate IDs (at most 30) and explain their provenance. We do
not reconstruct eligibility, container enumeration, capture side effects, or
harbor/gate equivalence. The caller must also resolve the commander pointer;
None is accepted only with the explicit source-default-20 policy. In particular
we do not silently substitute a sovereign's charm.

00689BF0 makes one full-range swap per index, NOT Fisher-Yates. 004B3532 calls
it even when every candidate will be kept/destroyed. 004B3559's capturing force
outside 0..41 overrides the result to destroy all AFTER those draws.

Randomness modes are deliberately distinct:
* raw_draws: recorded/injected returned indices at 00472150 call boundaries;
* seed: a self-authored SHA-256 counter adapter, never the game's RNG;
* source_rng_state: decoded IDB LCG from an explicitly supplied 32-bit state.
The last mode does not recover initial seeding or surrounding global calls.
Replay consumes recorded draws only and never calls either RNG adapter. Hashes
bind a trace to its inputs and profile; they are consistency checks, not an
adversarial signature or proof of the recorded seed's provenance.

All functions use the Python standard library. No game binary is executed.
"""
from __future__ import annotations

import copy
import hashlib
import json
from collections.abc import Mapping, Sequence
from typing import Any

PROFILE_ID = "source-idb-30d33b44-capture-selector-v1"
ALGORITHM_ID = "full-range-swap-destroy-prefix-v1"
TRACE_SCHEMA_VERSION = 1
ENGINEERING_RNG_ID = "sha256-counter-rejection-v1"
SOURCE_RNG_ID = "source-idb-lcg32-high16-mod-v1"
RAW_RNG_ID = "injected-source-call-draws-v1"
MAX_CANDIDATES = 30
EVIDENCE = {
    "status": "opcode-exact",
    "scope": "fixed-idb-selector-only",
    "stockOriginalVerified": False,
    "stockUseStatus": "compatibility-reconstruction",
    "vanillaUseStatus": "compatibility-assumption",
    "candidateQualification": "caller-supplied-prequalified",
    "globalRngInitializationRecovered": False,
    "engineeringSeedIsOriginalRng": False,
}

# These are recorded/extracted source identifiers, not a verified stock EXE.
SOURCE_IDENTITY = {
    "repository": "sjn4048/311MemoryResearch",
    "commit": "66e167e40c3440929ec016f3872aefc3486434c1",
    "archivePath": "IDA Related/san11pk.zip",
    "archiveSha256": "47beee4ac990869694a5e6f7577947cd6b34a41aefe60bace3af3350c682ce5a",
    "idbSha256": "c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab",
    "idbRecordedInputPath": r"D:\Games\三国志11\血色5.0公测\san11pk.exe",
    "idbRecordedInputSha256": "30d33b44876b84a8e87570873a86de88c65d2491c7e1cdeeb5883dc4b12feefb",
    "functionRawSha256": {
        "004B2CA0": "88ad5211c4484037aad336c7cd3ef0dbd1fc0c1091a00627d67986c222caa5af",
        "00689BF0": "d310580f70eee5d7ee2e63fcd165fad3f62cb7b383f3940c53dacce6ed20a79e",
        "00472150": "82bef9b78dc532adc5b0405a42da040048639dfee9ff2be22ed8d043c21140d0",
    },
}


def _canonical(value: Any) -> bytes:
    """Canonical JSON v1: UTF-8, sorted keys, compact, non-ASCII unescaped."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False, allow_nan=False).encode("utf-8")


def _digest(value: Any) -> str:
    return hashlib.sha256(_canonical(value)).hexdigest()


SOURCE_FINGERPRINT = _digest(SOURCE_IDENTITY)


def _integer(value: Any, name: str, minimum: int, maximum: int) -> int:
    if type(value) is not int or not minimum <= value <= maximum:
        raise ValueError(f"{name} must be an integer in {minimum}..{maximum}")
    return value


def _inputs(candidate_ids: Sequence[int | str], *, provenance: Mapping[str, str],
            commander_charm: int | None, capturing_force_id: int,
            missing_charm_policy: str, profile_id: str,
            source_fingerprint: str) -> dict[str, Any]:
    if profile_id != PROFILE_ID or source_fingerprint != SOURCE_FINGERPRINT:
        raise ValueError("source profile/version/fingerprint mismatch")
    # Reject unordered collections, iterators, strings and silent truncation.
    if type(candidate_ids) not in (list, tuple):
        raise ValueError("candidate_ids must be an explicitly ordered list/tuple")
    ids = list(candidate_ids)
    if len(ids) > MAX_CANDIDATES:
        raise ValueError("prequalified source array exceeds 30 candidates")
    for candidate in ids:
        if not ((type(candidate) is int and candidate >= 0) or
                (type(candidate) is str and bool(candidate))):
            raise ValueError("candidate IDs must be nonnegative ints or nonempty strings")
    if len(set(ids)) != len(ids):
        raise ValueError("duplicate candidate IDs are not allowed by this adapter")
    required = {"qualification", "ordering", "source"}
    if not isinstance(provenance, Mapping) or set(provenance) != required:
        raise ValueError("provenance needs exactly qualification, ordering and source")
    if any(type(value) is not str or not value.strip() for value in provenance.values()):
        raise ValueError("provenance fields must be nonempty strings")
    if missing_charm_policy not in ("reject", "source-default-20"):
        raise ValueError("unknown missing_charm_policy")
    if commander_charm is None:
        if missing_charm_policy == "reject":
            raise ValueError("missing commander charm requires explicit source-default-20")
        effective_charm = 20
    else:
        _integer(commander_charm, "commander_charm", 0, 255)
        effective_charm = max(20, commander_charm)
    _integer(capturing_force_id, "capturing_force_id", -(2**31), 2**31 - 1)
    return {
        "candidateIds": ids,
        "provenance": dict(provenance),
        "commanderCharm": commander_charm,
        "missingCharmPolicy": missing_charm_policy,
        "effectiveCharm": effective_charm,
        "capturingForceId": capturing_force_id,
    }


def engineering_draws(seed: str, bound: int, count: int) -> list[int]:
    """Engineering-only, stable SHA-256 counter/rejection adapter.

    Hash canonical [adapterId, seed, counter], counter starting at zero; read
    big-endian unsigned 256-bit words, reject >= floor(2**256/bound)*bound,
    emit word % bound. Rejected words advance the counter but not source calls.
    """
    if type(seed) is not str:
        raise ValueError("engineering seed must be a string")
    _integer(bound, "bound", 1, MAX_CANDIDATES)
    _integer(count, "count", 0, MAX_CANDIDATES)
    limit = (2**256 // bound) * bound
    draws: list[int] = []
    counter = 0
    while len(draws) < count:
        word = int.from_bytes(hashlib.sha256(
            _canonical([ENGINEERING_RNG_ID, seed, counter])).digest(), "big")
        counter += 1
        if word < limit:
            draws.append(word % bound)
    return draws


def source_lcg_draws(state: int, bound: int, count: int) -> tuple[list[int], int]:
    """Decoded 00472150 for the model's 1..30 bounds; no global seeding claim.

    For bound < 2 the helper returns zero without advancing its state. For
    bound >= 2 it updates state FIRST, then returns high16 % bound. Modulo
    reduction is preserved, including its bias; this is not randrange().
    """
    _integer(state, "source RNG state", 0, 0xFFFFFFFF)
    _integer(bound, "bound", 1, MAX_CANDIDATES)
    _integer(count, "count", 0, MAX_CANDIDATES)
    draws = []
    for _ in range(count):
        if bound < 2:
            draws.append(0)
        else:
            state = (state * 0x6C078965 + 0x3039) & 0xFFFFFFFF
            draws.append((state >> 16) % bound)
    return draws, state


def _raw_draws(draws: Sequence[int], n: int) -> list[int]:
    if type(draws) not in (list, tuple):
        raise ValueError("raw_draws must be an ordered list/tuple")
    expected = n if n > 1 else 0
    if len(draws) != expected:
        raise ValueError(f"selector needs exactly {expected} source-call draws")
    return [_integer(draw, "raw draw", 0, n - 1) for draw in draws]


def _rng_metadata(metadata: Any) -> dict[str, Any]:
    if type(metadata) is not dict:
        raise ValueError("malformed RNG metadata")
    adapter = metadata.get("adapter")
    if adapter == RAW_RNG_ID and set(metadata) == {"adapter"}:
        return dict(metadata)
    if adapter == ENGINEERING_RNG_ID and set(metadata) == {"adapter", "seed"}:
        if type(metadata["seed"]) is str:
            return dict(metadata)
    if adapter == SOURCE_RNG_ID and set(metadata) == {"adapter", "initialState", "finalState"}:
        _integer(metadata["initialState"], "initialState", 0, 0xFFFFFFFF)
        _integer(metadata["finalState"], "finalState", 0, 0xFFFFFFFF)
        return dict(metadata)
    raise ValueError("unknown or malformed RNG adapter/version")


def _trace(inputs: dict[str, Any], metadata: dict[str, Any],
           raw_draws: Sequence[int]) -> dict[str, Any]:
    shuffled = list(inputs["candidateIds"])
    n = len(shuffled)
    draws = _raw_draws(raw_draws, n)
    calls = []
    # 00689BF0: one pass, each index draws from the SAME whole-array bound.
    for index, draw in enumerate(draws):
        shuffled[index], shuffled[draw] = shuffled[draw], shuffled[index]
        calls.append({"index": index, "bound": n, "value": draw})
    nominal_keep = min(n, inputs["effectiveCharm"] // 20)
    forced_all = not 0 <= inputs["capturingForceId"] <= 41
    destroy_count = n if forced_all else n - nominal_keep
    trace = {
        "schemaVersion": TRACE_SCHEMA_VERSION,
        "profileId": PROFILE_ID,
        "sourceFingerprint": SOURCE_FINGERPRINT,
        "algorithmId": ALGORITHM_ID,
        "evidence": dict(EVIDENCE),
        "orderedCandidatesHash": _digest(inputs["candidateIds"]),
        "inputsHash": _digest(inputs),
        "inputs": copy.deepcopy(inputs),
        "rng": _rng_metadata(metadata),
        "draws": calls,
        "outcome": {
            "nominalKeepCount": nominal_keep,
            "keepCount": n - destroy_count,
            "destroyCount": destroy_count,
            "forceIdOverride": forced_all,
            "shuffleHelperInvocations": 1,
            "rngCallCount": len(draws),
            "shuffledIds": shuffled,
            "destroyedIds": shuffled[:destroy_count],
            "retainedIds": shuffled[destroy_count:],
        },
    }
    trace["traceHash"] = _digest(trace)
    return trace


def select_capture_facilities(candidate_ids: Sequence[int | str], *,
                              provenance: Mapping[str, str],
                              commander_charm: int | None,
                              capturing_force_id: int,
                              profile_id: str, source_fingerprint: str,
                              missing_charm_policy: str = "reject",
                              raw_draws: Sequence[int] | None = None,
                              seed: str | None = None,
                              source_rng_state: int | None = None) -> dict[str, Any]:
    """Return a JSON-safe trace/results for an explicitly opted-in source profile.

    Exactly one draw mode is required, including for zero/one candidates.
    IDs/uniqueness/provenance are engineering input constraints, not a claim
    that the source game has the same validation. No input is mutated.
    """
    inputs = _inputs(candidate_ids, provenance=provenance,
                     commander_charm=commander_charm,
                     capturing_force_id=capturing_force_id,
                     missing_charm_policy=missing_charm_policy,
                     profile_id=profile_id, source_fingerprint=source_fingerprint)
    if sum(value is not None for value in (raw_draws, seed, source_rng_state)) != 1:
        raise ValueError("choose exactly one of raw_draws, seed, source_rng_state")
    n = len(inputs["candidateIds"])
    count = n if n > 1 else 0
    if raw_draws is not None:
        metadata = {"adapter": RAW_RNG_ID}
        draws = _raw_draws(raw_draws, n)
    elif seed is not None:
        metadata = {"adapter": ENGINEERING_RNG_ID, "seed": seed}
        _rng_metadata(metadata)
        draws = engineering_draws(seed, n, count) if count else []
    else:
        _integer(source_rng_state, "source RNG state", 0, 0xFFFFFFFF)
        draws, final_state = (source_lcg_draws(source_rng_state, n, count)
                              if count else ([], source_rng_state))
        metadata = {"adapter": SOURCE_RNG_ID, "initialState": source_rng_state,
                    "finalState": final_state}
    return _trace(inputs, metadata, draws)


def replay_capture_facilities(trace: Mapping[str, Any],
                              candidate_ids: Sequence[int | str], *,
                              provenance: Mapping[str, str],
                              commander_charm: int | None,
                              capturing_force_id: int,
                              profile_id: str, source_fingerprint: str,
                              missing_charm_policy: str = "reject") -> dict[str, Any]:
    """Validate/replay recorded source-call draws, without invoking any RNG.

    Independently supplied input context must exactly match the recorded one.
    Candidate membership AND order, provenance, source version, charm policy,
    force override, draw bounds/count and outputs are all checked. Seed/state
    metadata (including finalState) is descriptive; replay does not regenerate
    it or attest its origin. A caller requiring seed/state attestation must
    separately validate that externally supplied RNG provenance.
    """
    inputs = _inputs(candidate_ids, provenance=provenance,
                     commander_charm=commander_charm,
                     capturing_force_id=capturing_force_id,
                     missing_charm_policy=missing_charm_policy,
                     profile_id=profile_id, source_fingerprint=source_fingerprint)
    if type(trace) is not dict:
        raise ValueError("trace must be a JSON object")
    if (type(trace.get("schemaVersion")) is not int or
            trace["schemaVersion"] != TRACE_SCHEMA_VERSION or
            trace.get("profileId") != PROFILE_ID or
            trace.get("sourceFingerprint") != SOURCE_FINGERPRINT or
            trace.get("algorithmId") != ALGORITHM_ID):
        raise ValueError("trace schema/profile/source/algorithm mismatch")
    metadata = _rng_metadata(trace.get("rng"))
    calls = trace.get("draws")
    if type(calls) is not list:
        raise ValueError("trace draws must be a list")
    draws = []
    for index, call in enumerate(calls):
        if type(call) is not dict or set(call) != {"index", "bound", "value"}:
            raise ValueError("malformed source-call record")
        if (type(call["index"]) is not int or call["index"] != index or
                type(call["bound"]) is not int or
                call["bound"] != len(inputs["candidateIds"])):
            raise ValueError("source-call index/bound mismatch")
        draws.append(call["value"])
    expected = _trace(inputs, metadata, draws)
    try:
        equal = _canonical(trace) == _canonical(expected)
    except (TypeError, ValueError):
        raise ValueError("trace is not canonical JSON data") from None
    if not equal:
        raise ValueError("trace input/order/hash/output mismatch")
    return expected
