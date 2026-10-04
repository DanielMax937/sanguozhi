# P0-64 exact route and target-force evidence

Static verification date: 2026-10-04 UTC. Baseline: `28d0b0b8aa6e2c781b791886093b806e6e3d1ad3`. The [manifest](../return-route-target-force.json) and [byte-only checker](../../../scripts/check_return_route_target_force_source.py) do not execute a game EXE, machine code, native allocator or query hook.

## Source identities and evidence budget

- S1 public [MemoryResearch archive](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/IDA%20Related/san11pk.zip): whole IDB SHA256 `c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`; metadata names a 血色5.0公测 executable
- S2 public [Sire package archive](https://github.com/sean2077/311SireCustomizedPackageDev/blob/43afe4efe273cf3b6ab7833b9b6f5822bd331fd4/ida-db/san11pk_dump.exe.idb.7z): whole IDB SHA256 `aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`; metadata names a 血色衣冠6.0sp5 executable
- Both are separately fingerprinted MOD-associated sources. Recorded EXE hashes remain IDB metadata and were not independently authenticated against EXE files. No clean-stock PC-PK1.1, Vanilla, console or actual-save equivalence follows
- The complete667-interval P0-63 union is referenced through its SHA256-pinned manifest, without copying its byte corpus. The new source corpus adds14 intervals, seven per source, for681 intervals totaling65,834 selected bytes. Overlapping selections are counted by interval width. There are337 same-shape pairs:328 identical,9 different;7 source-specific interval shapes remain unpaired
- All681 intervals were reread from the full-fingerprint-checked IDBs and independently compared with raw ID1 low bytes at four-byte flag stride. The optional checker independently parses uncompressed IDAv6 section layout with mmap, without python-idb or Capstone

New intervals, identical in both sources:

| Start | End exclusive | Purpose |
| --- | --- | --- |
| 00481870 | 00481898 | Force allocated differs from force valid |
| 00490B90 | 00490BB2 | Facility metadata canonical pointer |
| 005584E0 | 005584E6 | Constant force type1 |
| 005733A0 | 005733A6 | Constant legion type2 |
| 0079BF58 | 0079BFB0 | City virtual table through governor slot |
| 0079C170 | 0079C1C8 | Gate virtual table through governor slot |
| 0079C7D0 | 0079C828 | Port virtual table through governor slot |

Important complete reused function ranges, identical S1/S2: `005BA320..005BA3D9`, `004896C0..00489728`, `00489730..0048977E`, `004897B0..004897CD`, `00487EB0..00488008`, `00487B30..00487BB3`, `0049E450..0049E4C4`, `004839F0..004839FC`, `00487DC0..00487DC4`, `0047B2B0..0047B2DD`, `0047C320..0047C324`, `00483810..00483814`, `0065D6C0..0065D6C4`, `00480FF0..00481018`, `0047E070..0047E099`. Their exact hashes and containing original manifests resolve recursively through P0-63. The new manifest carries complete CALL ledgers for11 selected helpers per source, including caller004BF6F0, preserving instruction site/encoding and exact direct destination or indirect marker.

## 005BA320: route target, optional outputs

The byte dispatch table `005BA3F0..005BA40D` and pointer table `005BA3DC..005BA3F0` give:

```text
read current person.mission (+13C)
9,10,23,24: target = mission_arg(person,0)
12: target = mission_arg(person,1)
15..22:
    forceID = mission_arg(person,0)
    if forceID outside signed0..46: return0
    force = GetForcePtr(forceID)
    ruler = GetPersonPtr(force.raw+04)    # no force.valid check
    if not valid(ruler): return0
    target = ruler.home (+98)
37: target = person.home (+98)
other: return0
if target outside signed0..16383: return0
if targetOutput nonnull: *targetOutput = target
if territoryOutput nonnull:
    building = GetBuildingPtr(target)
    *territoryOutput = territory(building)
return1
```

The actor is not validated inside this function. The numeric target range is not a target-building validity test. Null outputs skip their operations, so a null territory output does not read a building or map cell. Failure does not store into either output. `004897B0` accepts native indices0..5, but route only requests0/1; the frame's existing five-argument schema does not pretend to represent index5.

For nonnull output exposure, the API admits separate caller-owned scalar cells, disjoint from each other, frame, code/data and saved locals. Arbitrary output aliasing would create additional writes and is outside this bounded projection. Unwritten outputs are recorded as unwritten; their returned None placeholders are not native zeroing.

`004896C0` caches raw home and location, maps home0..86 to itself and all other homes to-1, and compares BEFORE calling route(person,null,null). A mismatch skips route. True route means false at-home. Only false route reaches `00489730`'s fresh home load, GetBuildingPtr/valid, building virtual44 then person virtual44 comparison. Earlier UI/events/S2 hooks can change these live inputs; they cannot be replaced by a transaction-entry snapshot.

## 00487EB0: category priority before subtype

There is no entry valid(building) test.

1. Call `00487B30`. Its ordered tests are facility category1, then (unless kind24) category3, then category2. Every facility read is indexed by live kind0..63 through `00490B90`, with no facility-valid check. Categories are arbitrary signed dwords at metadata+B4. A positive result returns raw building+0C unchanged, including negative/out-of-force-range values
2. Otherwise, if kind0..63 category4: building virtual3C=`00487DC0` returns address+1E, holding signed16 x/y. Read dword at `06FB0E6C + 20*(200*x+y)`, take bits5..11, and MOVZX the byte at `0079C2B0+index`. GetCityPtr(result), check city valid, and tailcall city virtual40 if valid
3. Otherwise, or if that territorial city is invalid, get canonical generic building slot ID via00491770. Read kind: kind0 requires ID0..41→city; kind1 requires42..51→gate indexID-42; kind2 requires52..86→port indexID-52. Test the subtype pointer's validity, then tailcall subtype virtual40. Mismatched/unsupported kind, noncanonical ID, or invalid subtype returns-1

Raw-owner categories take precedence even for a canonical base whose legion disagrees with raw owner. The territorial-city branch does not recheck that city's generic building kind or generic building.valid: the city and generic building are distinct native objects. The provided city/subtype alias is what supplies city validity.

Gate/port terminology follows the public corpus's `GetPassPtrFromID=00490A40` (10 gates) and `GetHarborPtrFromID=00490A70` (35 ports). The source-authoritative behavior is their exact index ranges and pointers.

## Subtype force and exposed validity aliases

City79BF58, gate79C170, port79C7D0 all install virtual40=`0047B2B0`. It first calls virtual44: city uses `0047C320` raw+38; gate/port use `00483810` raw+20. It resolves that legion0..46, validates it, and tailcalls legion virtual40=`0065D6C0`, which returns raw legion+04. It does not validate the returned force object.

Force79C0E8 virtual08=`00480FF0`: virtual2C(type1)=`00480FD0` accepts type1/26, then signed raw+04 must be0..1099. Thus newly exposed rulerId and force.valid have an exact alias. Legion79BFB0 virtual08=`0047E070`: virtual2C(type2)=`0047E050` accepts type2/26, then virtual40 raw force must be0..46. Thus legion.valid is also derived. Fixed canonical pointer/type/readability assumptions are essential to these equalities.

Legion virtual04=`0041C130` delegates virtual08, so legion allocated=valid. Force virtual04=`00481870` differs: it accepts valid force OR canonical force ID42..45. There is no force.allocated field in this new schema; do not incorrectly equate it with force.valid in future extensions.

## Two map-access rules and a source-specific byte range

`0049E450` checks valid(building), then explicitly tests each signed coordinate0..199. Invalid building or coordinate returns-1. Success reads the packed map and byte range, without validating the returned city's numeric range or object. MOVZX makes byte255 return255, never-1.

The category4 path inside00487EB0 has NO coordinate bounds checks. Its declared readable map-allocation domain admits linear index0..39999, including x=-1/y=200→index0 or other individually unusual coordinates. Addresses outside this modeled allocation cause atomic defer, not an invented native return-1. Missing reached map cells reject as insufficient input; Python negative-index wrapping is prohibited.

The readable `0079C2B0..0079C330`128-byte selection is source-specific: S1/S2 differ in42..86, while0..41 are identity and87..127 are equal. The tail includes adjacent constants, so do not label all128 bytes meaningful territories. Exactly the byte requested by the7-bit index is used. IDB metadata places the range in `.rdata`, with a recorded reference from004839F4; this does not prove live protection or absence of arbitrary writes. The explicit policy freezes these source bytes. `scripts/return_route_tables.py` contains literal tuples independently checked against the selected raw ranges without importing model code.

## Callers, mutation and limits

`004BF6F0` saves old force pointer before the current ruler predicate. At004BF7F7 it compares a previously saved person-force result to the freshly computed target force; at004BF883 it does this again after home/location effects. Neither target-force result should be cached across calls. Earlier display/observer/query effects can change facility categories, raw owner, ruler, home, legion and map fields. Saved target pointer, old status/home/legion/force and comparison scalars remain saved in their original caller context.

The selected route/geography/subtype paths have no reached opaque gameplay query under fixed canonical vtables and unmodified successful platform probes. This is a local proof, not permission to declare unknown queries pure. Inherited S2 capacity377/278, observer/UI/event effects, actual troop-membership and other observation boundaries remain distinct. Whole-frame before/after, source, precise call stack, result and RNG evidence still apply wherever those boundaries are reached.

Clean-stock equality, arbitrary vtable/IAT rewriting, output pointer aliasing, unmodeled map memory, force extinction, empty-legion redistribution, ruler ownership/capture, base destruction, the full scheduler and global RNG remain open. New bytes do not expand adopted semantics to every branch of inherited helpers.

## Verification

```sh
python scripts/check_return_route_target_force_source.py
python scripts/check_return_route_target_force_source.py --idb-s1 /path/to/S1.idb --idb-s2 /path/to/S2.idb
```

The source-only checker verifies18 byte-level contracts, complete byte resolution/overlap consistency, pinned prior sources, whole-range comparison statistics, source table literal equality and frozen inherited implementation dependencies. Optional dual-IDB verification additionally checks both whole-file fingerprints and every selected raw-ID1 interval. Model/runtime and full regression results are reported in the main P0-64 rule document.
