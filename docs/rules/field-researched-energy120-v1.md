# A: researched energy 120, one current field balance

This additive private owner profile extends the already explicit synthetic field. It does not prove an original battlefield caller, add energy on research, invent an energy reserve, reset fire/history, or change ownership. The default absent profile remains energy <=100, including old standalone entry points.

## Evidence and boundaries

Base cumulative field SHA256 `54d5b8684e9568d3858c30662b466e7d6f4ec9b21400087b6c14547839feec39`, actual combat kernel `259bf801425ff4bdb38ed6de42180f4fe8b09658cd51d360202795a53574a5b5`, neutral combat wrapper `4023ea85c4696c1807f81bbf144742bc8efb45d11efaf3ea8537b7ebeadf3389` are the frozen F/H/G source, not modified in place.

`field-combat-lifecycle.ts` already validates energy <=120 and energyCap exactly `(techniques.includes(16)?120:100)`, then energy <=that cap. That kernel needs no formula or cap change. Its unchanged source is an explicit dependency, not a new implementation. Existing `terrain-hazard-lifecycle.ts` accepts energy <=255; entry/status transitions preserve energy. Actual inferred fire lifecycle and strategy effects only project troop balances/conditions, never energy: current energy stays on the unique outer roster. Actual multi-rockfall projects troop balances only. These callers must not fake energy100 to pass a wrapper.

The training and owner-side research evidence is separately documented in the A/D contract and the complete city Train/Transfer batch. This file is the field side, not a standalone claim that city Train120/Return/Transfer has been delivered. All publication requires combined owner-path review.

## Exact interface and phase order

Creator optional eighth parameter:
```
energyProfile: {
 profile:'researched-morale120-v1', homeOwnerId,
 homeTechniqueIds:number[], enemyTechniqueIds:number[]
}
```
The enclosing world supplies initial actual research; its current genesis starts home techniques empty. Enemy IDs must equal the immutable encounter enemy list, or [] without an encounter. Home owner must equal encounter home owner when present. No enemy is manufactured in a single-owner field.

Every command in this profile must be an internal `OuterStep`, with mandatory `energyHomeTechniquesAfter:number[]` containing the complete actual post-command research list. IDs are unique 0..35; removing an acquired ID rejects. Field action executes using the previous entry's current techniques. Only after the action/facts/completion effects succeed is the new list synchronized. A Tick that completes technique16 therefore uses entry-time facts for its field phase, then unlocks120 for the next command. Neither phase grants energy. This phase choice is the existing named synthetic ordering, not a recovered native ordering.

All action-start and final deployed energy values are validated against `capFor(actorId)`, derived solely from this current home list or the fixed enemy list. Deploy validates its actual input against the current cap; Return emits unchanged remaining energy for the outer weighted morale transaction. The only persistent field energy is `roles[].energy`. `energyCapsByActor` and `currentEnergyTechniquesByOwner` are derived output, not stored extra balances. Research lists belong to history provenance, not caller-chosen caps. Wrong owner, stale combat lists, cap mismatch, missing research synchronization, duplicate ID/revision, unsupported passive or zero termination reject the whole candidate.

Public field execution cannot supply OuterStep; profile-enabled public ordinary actions fail replay because the required owner step is absent. The world must never expose arbitrary `energyProfile` or after-technique overrides as actions. Standalone field replay proves its own history consistency only; outer root replay must regenerate all research lists from genuine successful research.

## All supported leaves retain the same domain

Private additive exports `projectRosterTerrainEntryWithEnergyCaps`, `projectRosterRockfallWithEnergyCaps`, `projectNeutralFireEntryWithEnergyCaps`, and `projectRosterRecoveryAfterFireWithEnergyCaps` take the existing input plus derived `[{actorId,cap:100|120}]`. Their descriptor-safe detached context must cover exactly the actual deployed roster, unique IDs, no omissions or extras. The field constructs this temporary list from its single owner-technique authority; these functions are not independent research authorization APIs. Original exports still use100. Existing retreat/apply-status legacy helpers not used by the composed field stay100; the actual composed after-fire recovery and combat FalseReport paths are upgraded.

`projectNeutralFieldActionWithResearchedEnergy` derives both accepted input energy and actual kernel `energyCap` directly from its actual complete per-owner technique list. It retains full learned technique effects, RNG tape, preflight, positive-only response and T21 food request logic. Ordinary wrapper exports remain unchanged. Under the new field profile an Attack/FalseReport technique snapshot must match the entry-time current lists, not the post-Tick list. Encounter without the existing actual-tech profile cannot erase learned techniques to get a neutral attack through: unsupported actual-tech context rejects instead. Nonempty researched combat is supported through the existing explicit actual-tech encounter profile, whose real food request must still be consumed atomically by G.

Move, nonfire terrain, named per-visit fire entry, fixed rockfall, stationed fire, false-report recovery, all four strategy costs, Attack and Return preserve or reduce the unique actual energy. No clamp, extra credit, new RNG sample, double status countdown, reset of a fire ID/lifetime, troop copy, or replay rebase is introduced. Existing 32 commands, 256 hazard events, positive troops and 100k save bounds remain.

## Static acceptance paths for full owner review

* No16, Deploy101 rejects even though syntax recognizes up to120; old absent-profile101 still rejects.
* Complete16 while current100: current stays100; next actual Train may create101..120 via the city owner, then Deploy preserves that value.
* At120, Cast charges its existing10/20/30; miss also charges. Terrain/fire/rockfall/status preserve energy; actual FalseReport costs15; actual physical attack keeps its prior energy behavior.
* Mixed owners do not borrow home16. Enemy declared120 without its own fixed16 fails genesis. Exact roster caps reject an unrelated or omitted actor.
* Actual combat sees tech16 and energyCap120 together, including a current energy value below100; it no longer contradicts its own immutable technique fact.
* The same pre-action owner lists are used for T21 and cap; an actual food request remains an obligation, not a cap-related waiver.
* Save/load reconstructs every previous cap phase and value from original genesis plus all OuterSteps. Forged derived snapshots cannot substitute for history.

No tests, typecheck, build, candidate execution or remote mutation. This is a static candidate pending independent combined review. P078, Closing, real-person effects and terminal zero remain excluded.
