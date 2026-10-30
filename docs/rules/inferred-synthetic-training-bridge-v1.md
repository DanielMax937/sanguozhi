# Synthetic owner Train bridge (opt-in, domain100)

This private helper is not yet a public world command. `planSyntheticTrainingBridge(gameState, bindings, action)` returns a derived patch plus complete calculation/evidence receipt. Its caller must reconstruct inputs from the sole replay-owned current ledger, validate output budget and commit atomically with outer journal. The helper owns no account, save or clock. Old engine/default profiles remain unchanged.

## Exact interface

Action: `{kind:'Train',officerIds:string[]}` (1..3 unique).
Bindings: `{cityId,forceId,turn,trainingUsedTurn:number|null,officers:[{id,role:'resident'|'deployed',reservationJobId:string|null,actedTurn:number|null}]}`. Exactly one row per GameState officer; current acted flags and city training flag must match these authoritative turn markers. Nonselected reserved actors remain valid; selected reserved/deployed/acted actors reject. Existing engine additionally rejects absent/on-mission/inactive actors.

GameState is the actual engine/types.ts schema, not a newly normalized state:

```
schemaVersion:2, scope:'synthetic-training-sandbox', originProfile:'native-v2',
ruleset:RULESET, date:{year,month,day:1|11|21}, turn, revision,
force:{id,rulerId,adviserId:null|string,techniqueIds:[],techniquePoints},
corps:{id,forceId,isFirst:true,actionPoints},
bases:[{id,name,kind:'city',ownerForceId,corpsId,parentCityId:null,
 troops,morale,gold,trainingCompleted,
 facilities:{drillGround:'none'|'building'|'complete',
 militaryOffice:'none'|'building'|'complete',completedTalismanPlatforms:number}}],
officers:[{id,name,forceId,baseId,war,warBase,leadership,charisma,intelligence,
 warXp,merit,acted,identity:0|1|2|3|5,location:'base'|'away'|'unit',onMission:boolean}],
rng:{algorithm:DEFAULT_ADAPTERS.random.id,seed,draws}
```

This helper accepts either engine-recognized origin tag, but the owner should choose native-v2 as a schema tag only, NOT claim original simulation provenance. RULESET is imported unchanged from rules.ts. There are no implicit missing-field defaults or normalization. Names/identity/ruler choices must be explicit fixed synthetic configuration; they are not real person identifiers. Max32 officers here, one city, all entity IDs synthetic and pairwise distinct. Use current shared date/turn/AP/gold/morale/TP and progress, current role/locks, fixed existing leadership/charm→charisma/intelligence. WAR must be derived from the SAME cumulative warXp and warBase used by all future writers. Use actual derivedWar/default growth configuration, not duplicated manually rounded math. No old standalone saved snapshot may be authoritative.

The old engine only accepts technique16; this domain100 bridge rejects moraleCap>100, therefore technique16 is currently incompatible. Other research unlocks belong in owner metadata; owner must project precisely engine-relevant IDs and not silently drop technique16. All merit must be ≤60000 as required by existing Train engine. No existing merit, XP or morale is clamped to manufacture compatibility. `validateState` rejects inconsistent derived WAR, missing ruler/adviser, invalid AP/TP/profile/shape.

Success patch is precisely `{morale,actionPoints,techniquePoints,trainingUsedTurn,officers:[{id,warXp,war,merit,actedTurn}]}`; rows are selected actors only. Receipt retains actual `calculation`, `evidence`, `rngDraws` from executeCommand. Owner must atomically apply ALL outputs: morale gain, AP debit, capped TP gain, WAR XP/growth, capped merit and action/once-per-city markers. Other balances, person identities and reservations are untouched. Old training cap saturation is kept, but incompatible preexisting balances reject.

## Evidence and inference

Read fixed main f132870bb58505acd0572c23e3ba91592eefa849:
- packages/engine/src/engine.ts: previewCommand and executeCommand Train, actual AP/TP/morale/XP/merit/acted effects. Calls default adapters only. EndTurn never called.
- packages/engine/src/calculations.ts: calculateTraining, moraleCap, derivedWar/calculateWarGrowth.
- packages/engine/src/state.ts: validateState (strict full shape, cumulative WAR consistency, resource bounds).
- packages/engine/src/types.ts and rules.ts: exact GameState/RULESET.

No new game formula introduced. One-city synthetic binding, domain100 cap and cross-ledger locks are named engineering integration restrictions, not claimed recovered native behavior. Engine evidence levels remain in the returned receipt. Ordinary synthetic training rewards are not Closing combat settlement. No real-person mutation, injury, zero terminal finalizer, health/season, P078, standalone AP recovery, or presentation RNG.

Validation performed: static source reading only. No tests/typecheck/build or candidate execution. Requires independent review and owner integration before claiming usable world Train.
