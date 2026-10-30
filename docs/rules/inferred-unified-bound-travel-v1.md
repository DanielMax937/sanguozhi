# Same synthetic actor: city, field and city-graph travel

Optional stable-v3 capability `travelBindingConfig={profile:'same-actor-bound-travel-v1',bindings:[{travelerId,actorId}]}` is appended after researchConfig. It applies to a new full genesis+journal, not an inferred migration of an old current snapshot. Without the field, the old independent-traveler behavior and exact root shape remain unchanged.

## Identity and one travel owner

Every existing traveler must be bound exactly once to a distinct existing same-city officer which also has a field template. Initial travelers must all be at the named home city and the exact city turn/date. Explicit bindings are synthetic scenario choices, not evidence that a native original officer is traveling. The old inferred city-graph planner and travel service remain unchanged.

The bounded private timeline receives the outer immutable travelScenario/homeCity by reference in its validated configuration, creates the travel genesis itself and folds every relevant command. Its `boundTravel.state` is the ONE live travel state. When enabled, the outer world reads that result and NEVER separately advances or starts another traveler state. The outer compatibility `travel` view is an alias/projection, not a second independently mutable history.

There is no persisted parallel role flag. Availability is derived from the existing field role and current journey/city:
- deployed: existing field allocation;
- traveling: current journey is not null, even if an intermediate edge passes home;
- away: journey is null but city is not home;
- resident: field resident, no journey, home city.

An away/traveling actor cannot also be deployed. The final invariant rejects such a conflict. City actions, piece production, Grant/Confiscate, Train, Forge, research selection and Deploy intersect their existing eligibility with the actual current nonresident gate. Existing resource-action fees and existing acted semantics are not rewritten.

## Start, return and arrival are real writes

Existing `StartTravel` becomes an actual timeline command in this profile. Departure requires a bound actor, available/unreserved/unacted city row, resident field role and no current journey. From home it may choose a valid graph destination; from away it may ONLY return home, and cannot start until a later turn than its last acted marker. No away-to-third-city relocation is added.

A successful departure marks the SAME city officer's actedTurn. Each WorldTick advances the travel service once after other private city-side phases and before the field Tick; every completed arrival, including away, marks the SAME city actedTurn. Therefore immediate same-turn return or city work is impossible. A route passing home midway does not release the nonresident gate. Full arrival home restores residence naturally by current travel state, with the arrival turn still acted. There is no person ownership/force/city identity mutation; the traveler location is an explicit temporary synthetic travel status.

No extra AP/gold costs or rewards are invented. Route/edge duration is still the documented graph plus existing inferred one-edge-per-xun planner, not recovered original travel timing. The new role/acted/return admission rules are named compatibility inferences.

## Finite return capacity

The owner checks the actual directed return path using the existing planner, not an assumed symmetric edge count. For an outbound journey it reserves its remaining outward edges, one next-turn cooldown, the return-path edges and one future StartTravel command. For an already-away traveler it reserves any still-required cooldown, return edges and return-start command. For a journey already returning home it reserves remaining edges only. Multiple travelers use the maximum shared Tick tail and the sum of their required future Start commands; this is conservative and may reject a crowded finite episode rather than strand it.

The tail is combined with outstanding production/forge/research ticks. Every accepted unrelated action must retain sufficient absolute city horizon and outer32/field32/privatecity64 slots. Start commands consume no extra clock tick. Under the optional research profile the horizon is21; otherwise the original supplied<=12 horizon is honored. This is not unlimited travel or cross-map movement.

Each failed start, arrival, city/field step, date equality, capacity or result-budget check rejects the whole outer event; no partial acted/travel/current-city state is published. Saving stores full initial facts plus accepted commands, never a current-role patch. Existing active job snapshots and reservations are preserved. All validation here is static; no tests/build/typecheck or candidate execution was performed.

No real people or ownership changes, P078, Closing, casualty/zero-troop terminal effects or original-map claims are introduced.
