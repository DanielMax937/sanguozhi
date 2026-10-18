# Single council domestic episode API

Static implementation; no product, example, test, typecheck, compile, build, runtime, checker, diagnostic or schema validator was run.

Import the functions, fixed policy and types from packages/engine/src/index.ts; direct module import from packages/engine/src/single-council-lifecycle.ts is also supported. This module calls the existing public city-command API; it does not reimplement scalar kernels or alter their state format. Complete rules and boundaries: [rules](../rules/single-council-lifecycle.md). Static DTO companion: [schema](../sources/single-council-lifecycle.schema.json).

The public-entry integration baseline is PR88 main 8063d39731a42af87646168d4b36b92bd9d3ed3d / tree 5e555fcda99f97e71e50c9c8565810dca50915be. The source manifest retains its original PR86 evidence-read identity; the reused city-command source blob f07b0762e045dfb77caeb8e46c06e7cee8bd255f is unchanged.

## Entry points

- createSingleCouncilState(scenario): {ok:true,state} or Failure
- previewSingleCouncilCommand(state,envelope): {ok:true,committed:false,duplicate,projectedState,receipt} or Failure
- executeSingleCouncilCommand(state,envelope): {ok:true,committed,duplicate,state,receipt} or Failure
- querySingleCouncilState(state): {ok:true,snapshot,childState,sourceBoundary} or Failure
- saveSingleCouncilState(state): {ok:true,serialized} or Failure
- loadSingleCouncilState(serialized): {ok:true,state} or Failure
- replaySingleCouncilCommands(trace): {ok:true,state,outcomes} or {ok:false,reason,index,state}

Exported types are SingleCouncilScenarioV1, SingleCouncilStateV1, SingleCouncilEnvelopeV1, SingleCouncilReceiptV1, SingleCouncilSnapshotV1, SingleCouncilPolicyV1, SingleCouncilFailureV1, SingleCouncilResultV1, SingleCouncilPreviewV1, SingleCouncilSaveResultV1, SingleCouncilTraceV1, SingleCouncilStateResultV1, SingleCouncilQueryResultV1 and SingleCouncilReplayResultV1. SINGLE_COUNCIL_POLICY_V1 supplies the complete policy snapshot. Sources must also be supplied in full from docs/sources/single-council-lifecycle.json.

All outputs are frozen. Object inputs are non-Proxy plain/null-prototype own-data DTOs in an unpolluted realm. Caller cannot supply callbacks, choose a final command, provide success/deltas, mutate the scenario mid-episode or advance time.

## Commands

An envelope has exactly id, expectedRevision, command. Examples of command shapes only (not executed):

```json
{"type":"OpenCouncil","participantIds":["o1","o2"]}
{"type":"DecidePolicy","decision":{"kind":"accept-all"}}
{"type":"DecideConcrete","decision":{"kind":"accept-one","speechId":"concrete:1"}}
{"type":"DecideConcrete","decision":{"kind":"accept-subset","speechIds":["concrete:2","concrete:1"]}}
{"type":"DecideConcrete","decision":{"kind":"reject-all"}}
{"type":"CompleteCouncil"}
{"type":"AbortCouncil"}
```

Decisions also permit abort; both stages permit accept-one/subset/all/reject-all/abort. Generated agree speeches point to an existing proposal and never add another actor or effect. Return ordering always follows the original new proposer order, regardless of selected speechIds order.

Read the actual generated speeches before choosing. A no-legal-speech item cannot be selected. The first generated concrete speech in the full example is selected structurally, not by supplying or predicting its chosen command. Individual legal previews are not a promise that all candidates can execute together. Failure reason child-command-rejected carries proposalId and exact childReason; the original ready state is unchanged and may be reselected.

## State and accounting

State includes full genesis, snapshot, public childState, acceptedCommands, sourceBoundary. Snapshot carries phase, revision, participant IDs, both speech lists, domesticAccepted, selected proposal IDs, PRNG word/cursor and councilCompletionTechniquePoints. Complete shares one child state across all selected commands. Abort never keeps partially executed children.

Receipt contains complete envelope, before/after phases and revisions, snapshotAfter, each candidate's public preview, every RNG raw/sample/rejection record, child execution envelopes and complete receipts, council's own zero-fee writes, completion-only TP write and explicit scope boundary. Ordinary child effects are charged normally; their TP remains not-modeled. No global finalTP is exported.

A successful new command sets committed=true. Same-ID same-envelope retry returns committed=false,duplicate=true and the original receipt even after terminal state; no additional draw, child effect, reward or log entry is committed. Verification still recomputes historical PRNG draws and public child calls from genesis. A new command after completed/aborted rejects. Failures contain ok=false,committed=false,reason,commandId,proposalId,childReason,effects=[] and never expose candidate state.

## Persistence

Save text is a canonical object {tag:"san11-single-council-save-v1",state,childSave}; childSave is the unchanged public ordinary-service SaveResult. The outer SaveResult.serialized itself is budgeted with JSON escaping, including escaping of the child save string. Full replay, not hashes, is authoritative for consistency. The loader verifies each step, every previous receipt and the regenerated childSave. It does not import caller-supplied child finals or add TP to a child scenario.

Trace is {tag:"san11-single-council-trace-v1",scenario,attempts:[{envelope,expected}],expectedFinalState}. expected=null skips comparison only; an expected record never drives chooser/execution. Failed and duplicate attempts may appear. The [complete static example](../../data/scenarios/single-council-example-v1.json) is deliberately not an executed test vector.

The companion schema defines all wrapper DTOs and bounded child-service shapes. Opaque kernel input/output observation leaves are inherited child evidence and runtime full-replay checked, not new caller-configurable mechanics. Runtime additionally enforces exact policy/source constants, full roster matching, all child semantics, negative-zero/duplicate-key safety, cross-field relations and full serialization/old-receipt budgets. JSON Schema alone cannot express these checks and was not executed.
