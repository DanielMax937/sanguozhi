# D: permanent cultivation and live equipment-effective attributes

## Two views, one provenance owner

This optional ninth creator parameter is independent of A's eighth energy parameter:
```
effectiveProfile:{profile:'live-equipment-effective255-v1',
 effectiveBaseline:[{actorId,stats:{leadership,war,intelligence,politics,charisma}}]}
```
The baseline covers exactly home templates in order. The enemy effective view derives from its immutable separate encounter facts; no home update may modify it. Each effective stat is an integer0..255. This is a temporary read projection, not talent, XP, an inventory bonus account or an authorization to change real people.

Existing `cultivationBaseline`, `currentFacts` and OuterStep `factsUpdates` remain unchanged: permanent ordinary PK stats1..100, before exact, nondecreasing stats/aptitudes, actual completion job required for metadata changes, completed job IDs single-use. They are never replaced with equipment-effective values. All original fire/position/troop/energy/action/status/history remains in place.

A profile-enabled private OuterStep must additionally contain:
```
effectiveFactsUpdates:[{before:{actorId,stats},after:{actorId,stats}}]
```
The before value must equal the previous current effective view exactly; actor IDs unique and home-only. After values can increase **or decrease** within0..255: removing or transferring an item is not negative cultivation and must not fail a monotonic PK rule. Empty updates are legal when nothing changed. The outer world must compute these from its actual current item holders plus actual permanent getter on **every** command, including Grant/Confiscate, research XP, cultivation, city actions and no-field-action entries. It must not accept them in public World commands. The field only validates its internal proposal history; enclosing root replay proves the inventory/PK provenance and rejects omitted, fabricated or stale synchronization.

The phase remains field action first using the previous entry's current facts, then permanent facts and effective view synchronization, with resident completion acted lock. The current field damage phase of a Tick therefore uses entry-time facts; growth/item changes from that same outer entry apply to following field actions. There is no additional clock or extra command per changed stat. `currentEffectiveFacts` is a derived output; full original baseline and typed updates are retained for replay. Ordinary public field execution cannot inject OuterStep, and effective-profile history rejects ordinary actions without owner synchronization.

## Actual consumers versus retained metadata

All four named strategy hit callers and effect-service validation use current effective intelligence on **both** caster and target sides, including maximum target intelligence for multi-target casts. Actual neutral FalseReport receives current effective intelligence and charisma. The actual old combat kernel already accepts charisma0..255; its former wrapper100 was not a kernel limit.

Physical attack/defense panels are still the explicit fixed scenario panels. Leadership/war/politics are retained in the effective view but do not generate new physical panels or passive effects. Aptitudes/skills remain in the permanent metadata; existing learned-skill/unsupported-neutral guards still reject unsupported effects. No magical conversion from a skill name to native passive behavior is introduced. Food politics is an outer G consumer with its own nonnegative formula decision, not changed here.

## Named intelligence255 extension, not native evidence

The old `field-combat-lifecycle.ts` accepts intelligence0..100 for both unit and members and charisma0..255. New optional immutable context `intelligenceProfile:'same-formula-intelligence255-v1'` extends **both** intelligence validators to255. Without it they stay100. The context is canonicalized, saved and replayed; arbitrary profile strings reject. No existing physical/strategy formula, cost, RNG rule, skill ordering, duration, positivity or T21 food obligation is changed.

Actual FalseReport formula remains:
* `denominator=a*a+b*b`; both intelligence0 still rejects before division.
* `v1=.3*a-.2*b+.05*charm+personality+70+abnormal`.
* `fraction=a*a*(100-.9*b)*100/denominator/55`.
* `v2=fraction-(100-a)*.1+.05*charm+personality-penalty+abnormal`.
* raw success=min(v1,v2), existing beauty and floor/clip0..100, deterministic0/100 uses no draw.
* critical keeps original half-target/truncation/minimum3 and independent duration draw.

For the bounded domain0..255 every intermediate is finite, denominator nonzero except the still-rejected both-zero case; squares<=65025. **For high target intelligence, `100-.9*b` can be negative.** This extension deliberately preserves the formula then the existing probability clamp; it does not invent a monotonic buff curve, remove negative intermediate values, clamp intelligence to100, or claim original >100 caller evidence. Negative raw probabilities become0 through the actual existing boundedRate. Counterintuitive results are part of this explicitly named engineering extension and must not be described as verified original behavior.

The inferred four-strategy request service adds `decideInferredStrategyHitEffective255`. It shares the original formula `base+floor((a-b)/2)`, pre-skill clamp5..95, same immune-before-guaranteed and beauty rules, but gives the extension a distinct policy ID `inferred-strategy-intelligence-linear255-v1`. The old export stays100. Ambush/discord/sorcery effects add optional immutable `intelligenceProfile:'same-formula-intelligence255-v1'`, validating every history/execute command at the matching domain and calling that extended request function; old absent-profile ledgers stay unchanged. Troop damage/status definitions do not change. The field's temporary strategy-effect projections select the explicit profile rather than pretending255 was valid in an old100 state.

The neutral combat helper's private effective-attribute entry also preserves A's independently selected actual-tech energy cap. Charisma/intelligence expansion does not grant energy, clear actual techniques, remove skill gates or drop food requests.

## Sources and static acceptance

Cumulative D is based on frozen A field `3e994e43676d25a4bda0022e48d7e68c1523a23076bfab513c0d470c1f0f9432`, A helper `9c2bce173bd036391cf2f556f32f98652d917af0f4fd0bb1ab3572fc8028e48f`; actual combat259bf801 source; actual request source SHA2564902841a5e0720fe096a6c1983bd719b7d42917a1ced1f6b9316c6ad539a5b2c; strategy-effects65dd2a64e0d9edd4b714dabf611f87b5d18090c4cdcfd257a64f4832129dfb1b. The A derived-cap/hazard files remain unchanged dependencies. Source evidence is the local main-ref evidence in `san11-ad-domain-contract-20261030`, not an invented source-reading claim.

Combined owner review must trace: base80 + live item20 → effective100; grant additional actual permitted item → new effective; confiscation → lawful lower effective with the identical permanent80/XP/job metadata; next fire/FalseReport caster **and target** each read the new value; all history replays identically. Also trace effective255 through field parser, helper, unit/member validators, actual formula and inferred request/effect parsers; reject256, stale before, foreign enemy updates, duplicate actor/job, tampered derived snapshot, public arbitrary deltas and zero termination. Old profile100 still rejects101 in intelligence kernels; old default save shape is unchanged.

Static-only candidate: no tests/typecheck/build/candidate execution or remote writes. No global ownership change, P078, Closing, death, reward or new AI. Final closure requires the independent review of the actual sole world owner effective getter, item transactions and field synchronization, not this private module alone.
