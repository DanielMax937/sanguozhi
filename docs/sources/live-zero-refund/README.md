# Live zero-refund cancellation: selected source evidence

This directory accompanies [`../live-zero-refund.json`](../live-zero-refund.json) and [`../../rules/103-live-zero-refund.md`](../../rules/103-live-zero-refund.md). It adds a versioned implementation-evidence layer on PR #25 merged main commit `e8bae319e5d1b08057fd091a90d305d58c9d7669`. The inherited P0-66/P0-67 production APIs, model tests and raw source bytes are unchanged. The new pins reflect P0-67 integration metadata only: three prior-manifest fields and one checker baseline assertion. This layer does not certify original-game equivalence or claim its own remote publication.

## What was actually checked

- Eight recovered complete handler intervals, four per source: `005CB050..005CB177`, `005D5DD0..005D5EF7`, `005C4E70..005C4F7E`, `005BEDA0..005BEEE2` (end-exclusive)
- 2,364 bytes, 864 x86 instructions, 130 callsites and 56 direct conditional branches across both sources
- Continuous emitted byte columns, exact interval lengths, independently declared SHA256 values, every relative call target and every direct branch target
- The selected S1 and S2 bodies are byte-identical to one another and to the existing personnel-detachment source ranges
- Six directly pinned inherited files, plus the officer-relocation checker's existing bounded closure: 17 earlier manifests, 622 physical artifacts, 1,852 physical range records, 23 Python modules and 92 officer-relocation ranges. The current manifest therefore depends on 18 inherited manifests including officer-relocation
- Both whole-IDB fingerprints were checked, then raw ID1 low bytes were checked at four-byte stride. The closure has 610 unique selected intervals / 73,708 interval bytes for S1 and 622 / 74,065 for S2. Interval byte sums can count overlapping bytes more than once. The four bodies were already present in this inherited closure; these are not counts of newly discovered code
- A fresh Capstone 5.0.7 x86-32 decode of the four raw handler bodies matched every committed instruction address and length. The regular source checker remains stdlib-only and does not require Capstone

The historical results are in [`raw-verification.json`](raw-verification.json) and [`disassembly-verification.json`](disassembly-verification.json); their hashes are pinned in the manifest and source checker. A check without IDB arguments verifies the recorded artifacts and committed source, but does not repeat whole-IDB access. Independent runtime/model tests are a different check and are not described here as machine-code execution.

## Repeat the static check

From the repository root:

```sh
python scripts/check_live_zero_refund_source.py
```

To recheck locally held, fingerprint-matching source IDBs and create a fresh report outside the committed evidence directory:

```sh
python scripts/check_live_zero_refund_source.py \
  --idb-s1 /path/to/S1/san11pk.idb \
  --idb-s2 /path/to/S2/san11pk_dump.exe.idb \
  --report /tmp/live-zero-refund-verification.json
```

Only files explicitly supplied through these arguments are opened as IDBs. The script does not download anything, execute game code, inspect a user's computer, or access a remote repository.

## Source domain, separate from original-game claims

S1 records a Blood Color 5.0 MOD-associated executable path; S2 records a Blood Color 6.0sp5 MOD-associated dumped executable path. The whole-IDB hashes authenticate the same archived source artifacts. The `recordedExeSha256` values are IDB metadata; this work has no independently verified executable corresponding to those values.

Selected body equality proves only selected source byte equality. It does not prove clean original PK behavior, unmodified vtables, transitive renderer/callback/hook equality, runtime reachability, frame-observation authenticity, global RNG consumption, real savefile behavior, Vanilla equivalence, or console equivalence. PC-PK1.1 remains a compatibility reconstruction; PC-Vanilla remains an explicit compatibility assumption; console behavior remains open.

The opaque presentation ranges are effect boundaries with exact full-frame/RNG observations or atomic rejection. They are not assumed noninterfering. No target code was executed.
