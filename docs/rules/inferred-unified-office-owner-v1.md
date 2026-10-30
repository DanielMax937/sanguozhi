# Unified named office → salary and deployment capacity

Optional `officeConfig` extends the existing mobile-resource-world-v3, after pkConfig, without changing old roots/defaults. It is based on the verified unified PK owner main `f3dcd8d3121808dbaff41471b802b94d27081687` (PR174). This is synthetic metadata/ordinary resource integration, not a native person appointment or ownership writer. No candidate execution, build, typecheck or tests.

## Fixed facts and one office owner

Exact configuration:

```
{profile:'unified-office-salary-command-v1',titleKey,
 mode:'weighted-threshold'|'role-affinity',unassignedCommandCapacity,
 officers:[{id,personId}]}
```

Progress capability is required. The list contains all1..8 city officers in identical order, with distinct numeric personId0..65535 selector keys. These are explicit synthetic keys, not recovered native person indices. Every office initially is null; no existing appointment is fabricated. The force ruler comes only from the bound resource/personnel facts, never from the action. The actual helper passes ruler role through to the original allocator, so a ruler cannot be reclassified as ordinary or receive a named office.

TitleKey must exist in the actual named-office catalog. It is a fixed scenario fact, not an automatic territory-based title promotion. A genesis validation-only proposal confirms the complete selector domain and title; its proposed changes are discarded, so creation does not appoint or pay anyone. Current assignment ownership is only the new `offices` projection rebuilt from full history. It contains office IDs and fixed selector facts, not a salary or resource copy.

## Actual assignment and payroll consumer

`AssignOffices {kind:'AssignOffices'}` has no caller-supplied candidate, salary, title, loyalty or eligibility data. The owner derives eligibility from current available/resident/unacted/unreserved state, including field deployment and bound travel. Current merit comes from the city ledger, true loyalty and salary from the existing single metadata owner, and selector attributes from the live T28 effective projection (which uses PK-grown bases when enabled).

The helper calls actual createOfficeAssignmentState→planOfficeAssignments→applyOfficeAssignmentPlan, using fill-vacancies-v1 only, then the actual named-office payroll catalog. Existing assignments are retained; no dismissal or rebuild-all operation is exposed. The selector's supported stats1..100/merit≤60000 domains are checked, not silently clipped from a wider view. Unsupported later values reject this command, not unrelated world actions.

A successful proposal commits officeId and the SAME metadata.officers[].salary together. The existing monthly salary bridge subsequently consumes the changed salary from that one field. Assignment does not pay a month immediately, restart payroll dates, refund old wages, modify loyalty/merit, or store a second wage total. No extra AP/gold discount, bonus-text numeric effect or acted cost is invented. Qualification requires the existing unacted gate, but assignment itself retains the source metadata-only action behavior rather than adding an unsupported action consumption.

No new future-affordability promise is made: existing monthly whole-facility payment/shortfall and positive-loyalty atomic gates still apply. Income, other spending and later salaries remain real current values; ordinary insufficient-fund behavior is not bypassed by a new balance.

## Actual deployment capacity consumer

On Deploy the owner computes the actor's current cap:
- fixed ruler: actual title row `rulerCommand`;
- assigned ordinary officer: actual office row `command`;
- unassigned ordinary officer: explicit `unassignedCommandCapacity`, positive≤60000.

The last value is a named supplied inference because the inspected allocation/catalog sources did not establish an unassigned original-game cap. No default5000/6000 is claimed. The existing standalone synthetic upper bound60000 also remains, and the city's positive remaining troops/capacity/AP/role gates still apply. The capacity limits the actual positive quantity before any city deduction or field allocation. Existing deployed units are not forcibly shrunk and no zero/finalizer path is introduced; unavailable/deployed officers cannot be newly assigned by this command. No AP/production discount is inferred from descriptive office bonus text.

This is not just an office label in a view: the same committed assignment controls both later monthly salary and later Deploy admission. Boundaries remain explicit: title changes, dismissals, unnamed salary formulas and full native office passive effects are not implemented here.

## Atomic replay

The action occupies the normal outer slot and participates in all existing pending-job/travel return budget reservations. With PK enabled it also produces the normal one-per-outer field facts step; no second appointment clock is created. Any assignment/payroll proposal, downstream invariant or output-budget error rejects the whole command. The saved root retains only immutable config and full accepted commands, not uploaded office/current-salary snapshots.

The imported internal personnel scalar module also contains a rumor proposal, but this world routes ONLY the office function in this batch; no target city/enemy is generated or relabeled. No real-person/force changes, P078, Closing, health/age or zero-troop termination are invoked.

## Existing receipt compatibility label

The retained Deploy receipt `officePolicy:no-military-office-profile-v2` describes only the existing no-military-office AP-discount profile. It does NOT mean office-based troop capacity is disabled. This capability checks the actual catalog-derived command cap separately before the deployment transaction; the compatibility label is deliberately unchanged.
