# T07/T32 fixed-home-site positive attack: unified owner v3

## Opt-in and scope
Append `siteStrikeConfig` to the existing mobile-world and private timeline creators:

```
{ profile: 'inferred-fixed-home-site-positive-strike-v1',
  responses: [{siteId, baseCounterDamage: null /* or integer 1..1000000 */}] }
```

Every existing `repairConfig.sites` ID must occur exactly once; missing, duplicate, foreign IDs and unknown keys reject. This capability requires the existing repair sites, distinct-owner encounter and PK current-person facts. It does not create a second durability ledger, defending unit, owner or governor. Omission preserves old defaults and root shape. Config is immutable initial scenario data retained through full outer genesis+journal replay, not a command-time knob.

The new public world action is exactly `AttackSite {actorId, siteId}`. Only an actually deployed actor from the encounter's independent enemy-owner roster can attack a home site; it cannot relabel a city officer as hostile. Site identity, owner, home cell, capacity and current durability come from the one `repairs.sites` owner. The field private step constructs actual attack troop count, position, acted/condition, availability, fixed resolved normal attack panel, equipment, skill keys, actual owner techniques and combat geometry. It does not clear unsupported techniques/skills to get a neutral result. The supported first profile is ordinary adjacent melee in a neutral scenario; unsupported modifiers explicitly fail. It does not call a fake unit battle to obtain durability damage.

## Evidence and explicit inference
The normal durability reconstruction recorded by `05-combat.md` and `77-siege-durability-inner-helper-boundary.md` is used by the dedicated pure proposal: square-root troop dependence, attack panel, 1/1500 factor and adjacent power 15; gate factor 0.6 / port factor 0.8, then floor. This is reconstructed/empirical evidence, not recovered native inner-body or x87 exactness. A computed zero damage explicitly rejects the whole action in this positive-strike profile: no acted marker, governor response or durability change is committed. This conservative named policy differs from a possible native legal zero-damage action; no minimum-one hit is fabricated. No siege weapon, tactic, critical, capture, garrison loss, ownership transfer, destruction or fire-damage rule is silently added.

A non-null `baseCounterDamage` is an explicit, user-visible **synthetic scenario response strength**. It is not native site base damage, a hidden defending troop count or a durability-to-troop conversion. The bound governor's current base-PK WAR (not an invented new stat or equipment-effective modifier) is read from the sole person owner. Only current home resident, available, not-away governor eligibility can produce the optional response. The proposal reuses `projectInferredGovernorCounterattack` and labels its response scheduling as inference. For a non-null response, genesis additionally requires the bound governor to be among the existing home field templates, enabling field-side role and base-PK WAR cross-checks. A null response does not impose that field-template requirement on otherwise valid repair governors. A skipped governor does not create a substitute. No governor ordinary action, wages, AP, strategy energy, support, response-fire recursion or rewards are added.

## Atomic connection, history and proof boundary
One world command calls one private field `OuterStep` with `fieldAction:null` and a typed `siteStrike`. Public generic Field commands cannot supply this private context. The field derives its own attacker facts and changes only that same roster actor's acted flag and, if a positive response is valid, troop count. It returns one `AttackSite` receipt keyed by the deterministic internal field-source ID and a proposed site patch. The timeline selects that exact receipt, checks site ID and current `before`, requires `after > 0`, and verifies `after = before - requestedLoss` before committing to its unique site owner. The field never claims to authenticate persistent site history by itself; only the outer replay establishes current site/governor/config provenance.

Any zero/negative resulting durability or attacker troop count, invalid adjacency/qualification, unsupported modifier, mismatch, downstream invariant or output/history budget failure rejects the **entire** outer command, including site loss, response troop loss and acted. There is no clamp-to-one, partial hit, duplicate response, extra clock or independent save. Existing 32-command / field-entry limits and reserved job/travel completion slots apply. The ordinary WorldTick still repairs the same sites exactly once through the already-connected T32 repair phase; AttackSite cannot trigger a separate repair tick.

Current governor reservation/acted state is not consumed as another action: this optional response is a passive resident-role scenario policy, explicitly not a proven native governor caller. Zero durability/zero troop finalizers, real-person changes, Closing and P078 remain excluded. T09 support is not part of this batch.

## Verification status
Local candidate only, based on the frozen Merchant final chain. No tests, typecheck, build, candidate execution or remote write. Independent final whole-owner review is required; pure-leaf or field-only review cannot establish world durability provenance or atomic settlement.
