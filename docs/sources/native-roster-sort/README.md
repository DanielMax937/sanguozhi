# P0-63 exact source findings (2026-10-04)

## Verified evidence and scope

`../native-roster-sort.json` pins 56 new contiguous code/data ranges and references the complete 611-range P0-62 union. The 667 selected intervals total65,134 bytes (overlaps counted by interval width):330 same-shape source pairs,321 equal and9 different, plus7 unpaired shapes. The extraction checks both complete IDB fingerprints, uses python-idb/Capstone for disassembly, and independently rereads raw low bytes at four-byte flag stride from the uncompressed ID1 section. New byte columns are in `S1-new.asm.txt` and `S2-new.asm.txt`; previous byte columns remain hash-pinned through their original manifests. No game EXE or target machine code was run. S1/S2 are separately pinned MOD-associated sources, not clean binaries. Evidence breadth does not expand semantic adoption beyond reached flags/types/paths.

## Roster 0047CD50 flags (1,0,0,0)

- Signed entry `list.count < 2` returns1 immediately, no filtering/key/allocator/clear.
- Allocate `entryCount*8+4`; null returns0. Array header stores original count. Every entry initialized to `{null,0}` with005C2430; destructor00505E50 is RET.
- Save receiver pointer; initialize temporary linked list at local+1C with vtable0079BF24.
- Walk SOURCE nodes in their current next-link order:0047BED0 advances local iterator to current node.next BEFORE caller reads current node.value. First allocated check0047A600; rejected entries never receive keys.
- For each accepted occurrence store its person pointer in a distinct8-byte array entry, invoke virtual+14(person,field=0,ascending=1,arg=0), save returned32-bit key, append entry pointer to temporary list. Every duplicate occurrence gets its own entry and key call.
- flags[0]=1 selects0047C6A0; flags[2]=0 selects004A6960. Thus roster is QUICKSORT0047B910, not mergesort.
- Wrapper0047C6A0 copies temporary list entry pointers into array in list order; entry count<2 skips allocator/sort/rebuild. With>=2 it calls0047B910(array,0,count-1,comparator,0,0), clears temporary list, reappends all sorted pointers, releases array.
- After wrapper returns,0047CD50 clears SAVED ORIGINAL RECEIVER, then walks sorted temp entry nodes. Nonnull entry→get saved person pointer→recheck0047A600→append if allocated. No deduplication. Finally destroys initial key-entry allocation and temp list, returns1.
- This domain assumes coherent list count/head/tail metadata and occurrence-linked acyclic live nodes, fixed canonical readable slots, successful allocation and unmodified successful platform memory probes. Count/link inconsistency, allocation/probe failure, use-after-free and pointer reuse are outside the representation. Clear0047BE50 zeros count/free/head/tail then list virtual+08 frees pool. Append0047C1B0 uses list virtual+00 allocator, stores value, links tail; allocator increments count. Temporary role list uses equivalent004A67B0/004A6850/004A8090.

## Scalar field0 closure

Person vtable0079C780+14 points00488720, +28 points004883C0. For `(0,1,0)`:

1.00488720 calls004C9610(person,0,1,0)
2.004C9610 checks allocated then `(field-21)` unsigned range sends0 to004C9759→004C90E0
3.004C90E0 checks allocated; field0 dispatch byte004C94D8[0]=0→table004C94AC[0]=004C9484→004C8720(person,0)
4.004C8720 checks allocated; byte004C8FD8[0]=0→table004C8E88[0]=004C8E72→00491310(person)
5.00491310 returns canonical fixed person index (base0720DA14, stride0x190, index0..1099), otherwise-1
6.00488720 transforms-1 to0x7FFFFFFF when ascending flag is nonzero (or0x80000000 when zero), except field73. In bounded canonical allocated field0 domain result is ID, so no transform.

No capacity/ability/hook callback is reached along this field0 path. Other fields and two S2 patched alternate branches in004C8720/004C90E0 remain outside adoption. Do not generalize entire scalar dispatcher as pure.

## Roster comparator004A6960

Arguments are entry pointers(left,right), two unused extras. If either entry pointer null return unsigned leftEntryPtr<rightEntryPtr. Otherwise save leftPerson/rightPerson; check allocated(left) then, only if left true, allocated(right). If either fails return unsigned leftPersonPtr<rightPersonPtr. If both allocated, load COPIED signed32 keys. Unequal: leftKey<rightKey signed. Equal: call RIGHT person's virtual+28 first, save result, then LEFT person's virtual+28; return signed leftID<savedRightID. Canonical+28 is004883C0→00491310 ID. Equality gives false. No stable-tie guarantee.

## Exact quicksort topology0047B910 / role004A69E0

Source functions are instruction-shape identical with relocated calls. Given array A inclusive lo,hi and comparator C:

- Reject null C/A or invalid endpoint addresses; if lo>=hi return
- If hi-lo==1, invoke C(A[lo],A[hi],extra1,extra2) once unconditionally; if result0 swap, else leave; return
- Else pivot=A[(lo+hi)//2], i=lo,j=hi
- Scan left: while A[i] != pivot AND C(A[i],pivot,extra1,extra2)!=0: i++
- Scan right: while pivot != A[j] AND C(pivot,A[j],extra1,extra2)!=0: j--
- If i>=j stop partition
- Else swap A[i],A[j], i++,j--, repeat scans
- Decrement i; if lo<i recurse(lo,i)
- Increment j; if j<hi set lo=j and tail-loop whole body; otherwise return

Pivot is a SAVED POINTER VALUE, not an index that tracks swaps. Roster A entries are unique key-entry pointers: same person in two nodes does not identity-skip except exact pivot occurrence. Role A entries are person pointers: ANY duplicate of pivot person identity-skips during scan. Two-element base case never identity-skips, even same pointer.

Array copied pointer order and key array are caller-local, unaffected by whole-frame hook observations; person data accessed by comparators is live. Pure Python `.sort` cannot reproduce comparison sequence or duplicate occurrence movement.

## Role wrapper004AA200

Signature `(sortFlag, comparator, extra1, extra2)`; null comparator returns0 BEFORE count shortcut. count<2 returns1 no filtering or comparison. Else copy currently allocated person occurrences into local list using004A67B0; preserves duplicates. sortFlag nonzero uses004A8F40→004A69E0 quicksort, zero uses004A8FF0→004A6B70 merge. Wrapper then clears its saved receiver list and rechecks allocated per sorted pointer before append, destroys temp list and returns1. In this composition receiver is caller-local candidate list, not necessarily a mutable frame roster field.

Role leader caller uses flag1 +004CEF90; governor caller uses flag0 +004CF160.

## Exact merge004A6B70

Inclusive lo,hi; if lo>=hi or null comparator/A return; bounds checked. mid=(lo+hi)//2. Recursively sort LEFT `[lo,mid]` first then RIGHT `[mid+1,hi]`. Copy entire sorted left half into reusable scratch buffer starting index0. Then compare scratch[leftIndex] with live local array[rightIndex], left argument FIRST. Nonzero C selects left; zero selects right. Increment output index. If left exhausted return; if right exhausted copy remaining scratch left. Untouched right tail requires no copying.

Saved scratch/array are local pointer lists. Comparator can mutate frame, but cannot replace copied local arrays or caller comparator/extra args. False-on-equal means right-side occurrence wins; this is not stable for equal pointer occurrences.

## Leader comparator004CEF90

- Check valid(left), then valid(right); failure returns unsigned pointer left<right (canonical person indices monotonic)
- Read ruler predicate left then right (status==0). Exactly one ruler: left ruler wins. Both rulers or neither continues
- Capacity left0048A4F0→save low16; capacity right0048A4F0→low16; different: left capacity greater wins (both zero-extended)
- AFTER BOTH mutable capacity paths, read LIVE left office signed32 then right office; smaller office wins
- Equal office: leadership left00489070 then right; low8 higher wins
- Final unsigned pointer left<right
- NO same-pointer shortcut; duplicate person pair in two-element quicksort base case can execute two distinct mutable capacity runs

## Governor comparator004CF160

- valid(left), valid(right); failure unsigned pointer fallback
- If same person pointer return0 (AFTER both validity calls)
- Read live signed statuses: if either<=1 and statuses differ, lower status wins; else continue
- Capacity LEFT then RIGHT; compare low16 unsigned; greater left wins
- On capacity equality call leadership left then right and compare low8 equality. If unequal, call leadership left AGAIN then right AGAIN, and use latest unsigned left>right. If equal use strength analogous double-read-on-inequality pattern
- If equal strength, rawWordAE left then right uint16; greater left wins
- If equal rawWordAE, virtual+28 LEFT first then RIGHT, signed leftID<rightID. Opposite +28 order from roster key comparator
- No later valid recheck after capacity; the already-saved people remain even if hook changes validity/status/force

## Capacity0048A4F0→0049D540→0049D420

0048A4F0 forwards same person pointer;0049D420 uses caller EDI person as a saved register-local, not a normal independent public call contract. Model by semantic saved person.

Base common:
- valid(person); resolve person LIVE virtual+40 force then canonical00490AA0 (numeric0..46) and valid(force), else base0
- Save force pointer (EBX)
- S1 reads force+40; saved boolean `(force40==5)`
- S2 BEFORE force40 read invokes query377 via0090E8D8→004890F0(saved person,377), mutable boundary
  - Nonzero: read LIVE ruler status after callback; status0→15000 else12000 from0090E908 table, then base returns
  - Zero: read saved force pointer's LIVE+40, no person/force revalidation and no fresh force resolution; continue common saved boolean
- Read LIVE ruler predicate(person=status0). If ruler: read saved force's LIVE title raw+3C via00436740; if saved special boolean choose title0, else normalize outside signed0..9 to9. Resolve title0..9 by00490BF0, test title valid; valid→uint16 title+2E base return
- Nonruler OR invalid chosen title fallback: save LIVE person office raw+A4
  - special force40==5: resolve person403 by00490B00, read saved person's LIVE raw+54 and403 raw+54 without403 valid check
    - S1 equality: resolve title0, valid→uint16+2E return, else office20
    - S2 executes same lookup and raw comparison, but unconditional JMP ignores match and always office20
  - otherwise force00481350 calls force virtual+28 ID and tests signed0..41. Outside: office44 S1 / office0 S2. Inside: normalize saved office outside signed0..80 to80
- Resolve office with00490C10 (0..80, stride0x3C), test valid; valid→uint16+2C, invalid→0

Augmentation0049D540:
- Save returned base in EBX
- Recheck LIVE valid(saved person). If false return base, NO final query278
- Resolve person's LIVE force again, save pointer; check force valid
- If valid query force technique via004811E0: S1 bit18; S2 bit3. Nonzero add3000 uint32
- S2 query278 via0090D1A8→004890F0(saved person,278), executes even if second force invalid. Nonzero add2000 uint32. No revalidation or re-resolution after query
- Return uint32; role comparators then use low16

004811E0 uses force+58 bitset and00472590. S1 accepts indices0..35; S2 indices0..63 and special index64→1. Only18/3 adopted here.00472590 reads dword at+4*(index>>5), mask1<<(index&31) after readable-memory check; pointer/readability guaranteed by bounded domain. It is not an external hook for reached bit3/18.

Title/office capacities are LIVE table fields after mutable377; same table IDs/pointer identity retained across observations. Canonical title ctor00494C60 installs0079CB80, whose virtual+08=00494CB0 tests virtual+24 type15. Canonical office ctor0048E0A0 installs0079C864, whose virtual+08=0048E0F0 tests virtual+24 type16. Virtual+24 getters005BA520/005BA5B0 return constant15/16. Therefore provided fixed canonical table records must have valid=true. Missing reached slots are insufficient evidence, never implied invalid. A changed raw capacity cannot change their type-based validity. Force validity00480FF0 instead checks type1 and raw+04 in0..1099; none of the newly modeled raw40/title/technique fields is a dependency. Existing explicit force-valid inputs are not promoted into independently stored native bits.

## Mutable boundary and aliasing implications

Native roster flags1,0,0,0 itself has no reached gameplay callbacks under fixed canonical type10/list/readability/successful-allocation domain. Role sort comparator capacity S2 query377 and278 are true mutable effect-query boundaries, each call requires whole evolving frame and precise saved locals. Left capacity snapshot remains saved across right capacity; current office/leadership/rawAE/status reads occur at their actual source points. Role sorting works on copied candidate local pointers while queries may change frame rosters, force/title/office/person data. It must clear/reappend its caller-local list after comparisons with a second allocated filter.

Unknown query internals must not be silently considered pure, noninterfering or zero RNG. Memory validity/allocation/critical-section primitives are representation assumptions separate from gameplay hook effects. No target EXE was executed.

## Reproduce source checks

```sh
python scripts/check_native_roster_sort_source.py
python scripts/check_native_roster_sort_source.py \
  --idb-s1 /path/to/S1.idb --idb-s2 /path/to/S2.idb
```

The standard-library-only checker verifies20 groups of byte obligations, complete per-source call ledgers for20 selected helpers, all range/container hashes, source fingerprints, overlap consistency, jump tables, signed/unsigned branch and argument order, fixed vtables and the bounded adoption contract. It imports no semantic model or target code. The optional raw reader validates both entire IDB SHA256 values and every selected interval without IDAPython or Capstone.

## Platform imports and inherited code boundary

00472590 calls indirect slot0074E268 before reading a technique dword.00472070 calls the same slot, then0074E26C when its write-check flag is nonzero; sorting uses flag1. IDB symbol metadata labels these IsBadReadPtr and IsBadWritePtr. Slots0074E360/0074E35C are labeled EnterCriticalSection/LeaveCriticalSection. Import-cell raw ID1 low bytes are not authenticated resolved runtime addresses, so these labels do not prove a live IAT is unmodified. This model explicitly assumes ordinary unmodified successful platform probes, allocation and synchronization, and excludes arbitrary IAT/vtable hooks. No OS probe or game EXE was executed.

Eight inherited Python source dependencies are SHA-pinned: the three unchanged P0-62 controller/role/frame files plus its five already-adopted primitive/adapter dependencies. The source checker verifies their file bytes without importing or executing them. This is a bounded adoption/drift check, not a claim of complete Python transitive closure. New P0-63 model/checker files are not circularly self-pinned.

The new API requires explicit policy `nativePlatform=unmodified-successful-probes-allocator-locks-v1`. Omitting it or supplying another value is rejected. This selects the representation assumptions above rather than claiming arbitrary platform/IAT calls are pure. A mutable comparator may violate normal ordering consistency; native scans have no per-step array bounds check. If such a scan leaves the allocated logical pointer array, the model must reject atomically instead of using Python negative-index wrapping or inventing out-of-array memory. The bound is the allocation, not merely the current recursive subrange.

The direct diagnostic building roster entry is restricted to the canonical city/port/gate kind/ID and subtype-valid receiver domain before the count shortcut. Generic building schema placeholders are not physical native lists. This is an API support boundary, not an invented gate inside 0047CD50; integrated callers and sort algorithms are unchanged.
