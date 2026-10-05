# Native troop membership: source-local evidence

Baseline: PR #28 merged main `c190abfd43985251eee4936fdccb5d3910d4fed7`. All older source manifests,
APIs, frames and checkers remain frozen. The two immediate inherited pins change
only for formally integrated P0-70 metadata/checker baseline, its separately
fixed historical extraction assertion and recursively proven P0-69/P0-68/P0-67
metadata pins. Production, model tests, assembly/data and historical verification
reports remain byte-for-byte identical to the reviewed isolated implementation.
The raw report retains historical extraction baseline `19f72abbd6d0a9dfaccd83530de003f71fdbd1fa`;
its checker asserts that literal separately from the current integration baseline. These are the MOD-associated S1/S2 IDBs,
not independently certified clean-stock executables. Recorded executable hashes
are identity metadata, not independently reproduced executable fingerprints. No
original executable or recovered machine code was run.

## Exact membership chain

- `004891C0..0048921F`: read actor raw location `+9C` once; signed `87..1086`
  maps to troop slot `location-87`; otherwise return false. Call troop getter,
  native validity, actor pointer-to-ID, then membership in this order
- `00490E70..00490E94`: signed troop ID `0..999` produces manager-relative
  pointer `07201958 + 169730 + F4*id`; out of range returns null. The getter
  itself does not read the troop, validate it, or test whether a model row exists
- `0047A630..0047A656`: nonnull/readable pointer test through `00472070`, then
  tail-dispatch virtual `+08`. Successful unchanged platform probes and canonical
  readable pointers are explicit representation assumptions
- `00496040..00496095`: troop virtual `+24` must equal 11; read leader `+0C`,
  get person pointer and validate it; then each of exactly two deputies `+10/+14`
  must be signed `<1100`. There is no lower bound on deputy values and no deputy
  person lookup. Every branch to failure `00496091..00496095` is included
- `00490B00..00490B24`: signed person ID `0..1099` constructs pointer
  `07201958 + C0BC + 190*id`; out of range returns null
- `00491310..0049135A`: canonical actor pointer subtraction and signed division
  by `190`, after two constant `004195D0` calls, returns bounded ID `0..1099`
  or `-1`. Arbitrary/misaligned pointers are outside the represented domain
- `00495390..004953C4`: in-range actor ID matches leader `+0C`, otherwise calls
  `00495340..00495382` to compare exactly two deputies. The deputy helper also
  guards actor ID `0..1099`; negative deputy sentinels cannot match an invalid ID

All corresponding membership-function bytes are identical across S1 and S2.

## Constructors and actual virtual dispatch

`00496D90..00496DA2` calls base constructor `0047AA80..0047AA90`, which assigns
base vtable and raw `+04=4`, then assigns troop vtable `0079CC18`. It does not
initialize leader or deputy fields. They must be explicit live input state.

The common complete 26-slot dispatch block is `0079CC18..0079CC80`:

- `+04=0041C130`, a tail-dispatch to virtual `+08`
- `+08=00496040`, the native validity body above
- `+24=00468E60`, constant type 11
- `+3C=00496030`, position getter, preserved in the table but not implemented
  by this membership slice

`00496000..0049600B` is a destructor-style reassignment followed by a jump to
`0047A5E0`; it must not be mistaken for the constructor.

### Source-specific tail: do not claim a complete shared vtable extent

The raw block `0079CC80..0079CC8C` is additionally pinned in both sources. S1
starts with float 50 (`42480000`), followed by `3F2AAAAB`, `3DCCCCCD`. S2 changes
that first dword to code pointer `00911B50`; the next two words remain identical.
The S2 target's complete IDB function `00911B50..00911B69` is also pinned, with
its direct call to `008E8930`. No valid virtual-`+68` call site has been proven
by this bounded investigation. The complete S2 vtable tail extent therefore
remains unproven; the common block is not promoted to a universal 26-slot ABI.
The extra target's business behavior is not implemented or executed. None of
the newly closed membership dispatches reaches that slot.

## Person validity is derived from raw live state

Canonical person vtable prefix `0079C780..0079C7D0`, constructor
`00489F10..00489F22`, and base constructor `0047A5D0..0047A5D9` establish:

- `+04=004883F0..00488422`: call virtual `+2C` with type10;
  `004883D0..004883EB` accepts type10 or type26. Then raw `+17C != 0` is
  allocated, otherwise signed status `+A0` must be `0..8`
- `+08=00488430..00488461`: call the allocation virtual, reread raw `+17C`;
  nonzero is valid, otherwise reject status6 and status8
- `+24=0067F810..0067F816`: constant10

Thus canonical validity is `rawDword17C != 0` or `(0 <= status <= 8 and status
not in {6,8})`. Existing frame `allocated/valid` fields are checked aliases of
these raw fields, never independent membership inputs. All reads resolve live
state after any enclosing authorized callback. Missing reached in-range rows
are model evidence gaps, not native null or native-invalid objects.

## Independent verification

`check_native_troop_membership_source.py` checks hardcoded body hashes, complete
IDB function-region endpoints, raw byte/artifact hashes, full call/branch
ledgers, constructors, dispatch slots, signed predicates, both return paths,
source differences and production AST wiring without importing production.
It reruns the frozen previous source checker and accepts optional full IDBs to
check whole-file SHA256 plus every inherited and new selected interval through
an independent raw ID1 low-byte mapping. Historical per-source recovery JSON records the
ID0 function regions and agreement of IDAPython bytes with raw ID1, with a full
Capstone 5.0.7 x86-32 linear decode. Formal integration repeats whole-IDB/raw-ID1
checks; the historical Capstone reports are hash-checked, not newly decoded.
None of these steps executes target instructions.

The manifest's `rangeBudget` separates reused exact inherited intervals, new
unique interval boundaries, and newly recovered machine-code bytes. Interval
byte totals count selected intervals; they are not a claim of distinct bytes.

## Deliberately open

Non-base position virtual `+3C`, mutable fallback `06EE794C`, custom vtable/IAT
behavior, arbitrary pointers and process memory probes, S2 extended-tail
business, canonical capture/surrender/extinction, event9 tail reactions,
unrepresented resources/platform/RNG, presentation and stock/runtime
certification remain outside this closure. No coordinate or fallback value is
seeded from incidental IDB data.
