# Bounded 004B40C0 generic-facility entry: independent source evidence

This directory and [`../generic-facility.json`](../generic-facility.json) add source evidence to PR #26 merged main baseline `094f94b41795169df73fe708f9bbd29083949ea1`. Earlier source bytes, production APIs and model tests remain unchanged. The two immediate inherited pins change only because P0-68 integration changed its baseline/status and its two P0-67 metadata pins; those P0-67 changes are recursively limited to three manifest metadata fields and one checker baseline assertion. The pinned raw/disassembly reports retain their historical extraction baseline. This layer does not claim its own remote publication or certify original-game equivalence. The implementation is described separately in [`../../rules/104-generic-facility.md`](../../rules/104-generic-facility.md).

## What was independently verified

- Whole-file SHA256 for both archived IDBs: S1 `c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`; S2 `aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`
- Raw bytes from fingerprinted, uncompressed IDA6 ID1 storage, taking the low byte at four-byte stride. All inherited and new selected intervals were checked: S1 612 intervals / 73,783 interval bytes; S2 624 / 74,140. Overlapping intervals can count some bytes more than once
- Twenty-two selected code intervals, eleven per source: 6,764 bytes, 2,222 instructions, 404 calls and 208 relative branches. All eleven selected source pairs are byte-identical
- The inherited, hash-pinned report records a fresh Capstone 5.0.7 x86-32 decode of those raw bytes; this integration reuses that record and does not claim a new decode. Every inherited instruction address and byte sequence matched; the two platform helper intervals per source were independently recovered. Default verification remains stdlib-only and does not require Capstone
- Five immediate old-file hashes; the frozen live-zero-refund checker and all thirteen of its tests; and its inherited evidence closure. This includes 19 inherited manifests counting live-zero-refund and officer-relocation, 622 older physical artifacts, 1,852 older physical range records, 23 legacy Python modules, 92 relocation intervals and eight zero-refund handler intervals. These are bounded dependency counts, not claims of whole-game coverage
- The full 2,285-byte main `004B40C0..004B49AD` region, all its relative calls and branches, its exact entry/continuation/epilogue partition, required pointer helpers, the caller `004A8270`, and existing live ownership primitive `004AD550`

[`raw-verification.json`](raw-verification.json) and [`disassembly-verification.json`](disassembly-verification.json) record these checks. Both reports are pinned in the new manifest and source checker. No SAN11 executable or target machine code was run. Synthetic implementation tests are a separate activity.

## Byte hashes versus artifact hashes

The exact raw byte hash for `004B40C0..004B49AD` is `722fe6179b4d9396d1c8047e2dfafea57b11d7d035398638313ee0808e96e151`, as in the preceding recommendation. The inherited assembly text artifact hash is separately `bcc81d9a373836f4c206ee8a2e8bbb424b90cb028ed886142c54898b716f5913`. These are different objects. Byte extraction must parse all byte tokens, not a fixed-width 30-character column: instructions such as `004B420D` have twelve bytes and overflow that visual column. The checker pins that row explicitly.

Similarly, `004912C0..00491308` has raw byte hash `19360d0d0373c30434cb79322992b787627daf84282d61d0511499aab5ab73d8`. The `e89e5cd5...` value cited by the preceding recommendation is an assembly text artifact hash, not its raw code hash.

## Entry validity, ordering and native result

`004B40C0` begins with a structured-exception frame and `00707D40` stack probe/allocation for `0x192C` bytes. Incoming ECX is the gameplay manager, captured into EBP. Argument one is the building pointer. The validity call at `004B40FB` precedes all object virtual calls.

`0047A630` returns zero for null, otherwise invokes `00472070(pointer, 4, 1)` and returns zero if that memory-probe helper fails. If it succeeds, it tail-jumps to virtual slot `+08`. `00472070` has two imported memory-probe calls at IAT `0074E268` and `0074E26C`. This evidence pins the instructions; the model's validity abstraction does not perform actual operating-system memory probing or execute arbitrary vtables.

If `0047A630` returns zero, `004B4105` jumps directly to `004B4988`. No old-legion query, requested-legion conversion or ownership work occurs. The normal epilogue preserves EAX, so this native result is zero.

For a valid building, `004B410F` reads its virtual `+44` legion scalar. `00490AD0` at `004B4118` constructs a pointer for IDs 0..46 and returns null for other signed IDs. It does not dereference or validate that legion. The pointer, not the raw scalar, is saved. The raw scalar may be useful diagnostic provenance but is no longer a native retained local at the canonical boundary.

`00491770` computes the building fixed-array quotient. The caller's signed comparisons at `004B412C` and `004B4131` select 87..16383. Values below 87 or above 16383 branch to `004B415D`; the source helper itself normally yields only -1 or 0..16383, so the upper rejection remains a verified source branch rather than an additional normal quotient result. This branch tests the ID, not facility kind.

## Requested-legion pointer construction and conversion

The relocation caller at `004A8347` likewise calls `00490AD0` and pushes the returned pointer without a slot read or legion-validity test. It pushes argument three as zero and forwards its saved incoming manager in EDI to ECX. An in-range identity need not already have a represented row merely to construct or forward a pointer; a later native field read still requires readable modeled state.

Only generic flow calls `004912C0` at `004B4145`. Its ECX is the object-array manager `07201958`; the legion array starts at `0720CB64`, with 80-byte stride. Null returns -1. For a canonical aligned pointer, the routine returns ID 0..46 even if that object is invalid. A quotient outside that range returns -1. It performs no target-validity test, field read or alignment test. Its two `004195D0` calls both return the constant -1, not a changing thread identity.

The raw routine subtracts the array base with machine integer semantics and performs signed division by 80, truncating toward zero, before checking the quotient. It is therefore incorrect to assert that every arbitrary or misaligned pointer maps to -1. For example, a non-null pointer one byte below the array base produces quotient zero. The implementation's canonical aligned-pointer/null domain deliberately excludes such raw machine pointers. An out-of-range ID passed to `00490AD0` becomes null before conversion; this differs from passing an arbitrary address directly to `004912C0`.

At `004B414E`, the caller passes its original building pointer and converted requested-legion ID to `004AD550`, with the same incoming gameplay manager as ECX. It then executes `MOV EAX,1` and jumps to `004B4988`. Thus a normally returning ownership early exit or callback cannot change this caller's final result of one. The existing ownership primitive's generic force stores and event9/10 dispatch remain part of the same mutable-frame operation; this evidence does not license suppressing them.

## Exact canonical continuation boundary

The open segment starts immediately before `PUSH EDI` at `004B415D` and ends immediately before the common epilogue at `004B4988`. It includes canonical requested-legion validity, capture, effects and cleanup; those are not newly implemented native logic. An exact full-frame/RNG effect-query observation or atomic rejection is required.

Let `entryESP` be ESP when `004B40C0` is entered, pointing at the return address, and let `B = entryESP - 0x1940` be ESP at `004B415D`. On the verified normal prelude:

- ESI is the original building pointer; EBP is the incoming gameplay manager
- EAX is the just-computed `00491770` building ID, not an old/requested-legion scalar
- ECX is `07201958`, the object-array manager used by the ID getter; it is distinct from the incoming gameplay manager held in EBP
- `[B+0x10]` is the saved old-legion pointer constructed before branch selection
- `[B+0x14]` is the incoming gameplay manager
- `[B+0x1930]` is the entry security cookie; `[B+0x1934]` is the previous FS:[0]; `[B+0x1938]` is handler `0072F946`; `[B+0x193C]` is initial exception state -1
- `[B+0x1940]` is the return address; original arguments are building pointer at `+0x1944`, requested-legion pointer at `+0x1948`, and untouched third dword at `+0x194C`

The requested pointer has not yet been validated or converted; the saved old-legion pointer has not been validated. No later continuation scratch locals or force scalars have been initialized. The old raw virtual44 scalar is not a retained machine local. The incoming manager is an opaque same-entry identity: the source does not establish that it equals the separate literal `07999808` used later as another helper's receiver. The implementation's `entry-gameplay-manager` token records this identity relationship, not a physical memory address.

A boundary observation must retain original argument identities and the saved old pointer independently of later live-frame replacements. It binds source, call order/scope, complete modeled before/after frame and RNG effects. This is a semantic continuation contract, not an emulator capable of resuming a raw CPU/stack snapshot; caller-volatile register/flag contents, arbitrary stack bytes and manager memory are not modeled.

On normal source completion, canonical continuation EAX is restricted to 0 or 1: the failed requested-legion validity gate at `004B4170` reaches `004B4987` with zero; all other normal exits run `MOV EAX,1` at `004B4981`. The source checker pins all branches into those exit sites and the absence of an earlier return inside the segment. An arbitrary signed observation would be a broader conservative abstraction, not an additional source-native return possibility.

## Normal epilogue and deliberately excluded platform paths

The newly recovered helpers are byte-identical across S1/S2:

- `00707D40..00707D7D`, 61 bytes, hash `f36f56e85a3b8f0b9f0aaa3f1a49f9bda1143c728ff69d6c27517e4f359a69b8`: page probing and stack allocation, preserving incoming ECX on the successful path used here
- `00707B1A..00707B28`, 14 bytes, hash `c2f499d23d185ab906a17d4ae0e659346458674eea7f37bf0933e090773e3f48`: compare ECX with security cookie `[008E0BAC]`; matching cookie returns without changing EAX; mismatch jumps to `00707AE9`

The common epilogue restores FS:[0], saved registers and stack, checks the saved cookie, then returns with `RET 0x0C`. Native result claims assume this normal path returns. Stack faults, guard-page behavior, cookie mismatch, security termination, SEH unwinding and nonlocal control transfers are not executed or certified. The inherited `0072F930` cleanup regions already differ between S1 and S2; equal main-body bytes cannot establish exception-path equivalence.

## Source domain and unresolved behavior

S1 records a Blood Color 5.0 MOD-associated input path; S2 records a Blood Color 6.0sp5 MOD-associated dumped executable. Their executable SHA256 fields are IDB metadata, not independently authenticated game executables. Selected byte equality does not prove clean-stock PC-PK1.1, Vanilla, console, callback/vtable/hook or runtime equivalence. PC-PK1.1 remains a compatibility reconstruction, PC-Vanilla an explicit compatibility assumption, and consoles remain open.

Full canonical-base capture/force extinction, surrender/captive policy, troop reaction and actual membership, recursive-return ruler ownership, physical pointer/process validity, callback-observation authenticity and real/global RNG behavior remain uncovered. Inherited open presentation and other effect boundaries remain open. This evidence closes only the bounded generic-facility entry and normal return contract, not all ruler transfer.

## Repeat verification

From the repository root:

```sh
python scripts/check_generic_facility_source.py
```

That command checks committed evidence, exact control flow, contracts and old-file pins. It does not reopen IDBs unless explicitly given paths. To repeat whole-file and full raw-ID1 closure verification:

```sh
python scripts/check_generic_facility_source.py \
  --idb-s1 /path/to/S1/san11pk.idb \
  --idb-s2 /path/to/S2/san11pk_dump.exe.idb \
  --report /tmp/generic-facility-verification.json
```

The checker uses only stdlib and frozen source checkers, never production model modules. It downloads nothing, publishes nothing, accesses no remote environment and executes no target machine code. Report byte totals refer to selected intervals, not unique address-space coverage.
