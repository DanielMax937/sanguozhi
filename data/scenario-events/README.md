# Source-qualified historical-event data

This is an inert public-guide corpus, not an event engine or original-runtime certificate. The dataset and inventory schemas keep `executionEnabled: false` and `evidence: public-guide-transcription`.

## Selected-source coverage

The fresh 2026-10-06 retrieval contains 44 event sections across the complete 12-page GamerSky article and 61 historical sections of Wiki page88. These yield 105 observations and 66 stable corpus event IDs. Counts were derived from the actual headings, not used to manufacture missing observations. All source headings, source URLs and snapshot hashes are inventoried.

The Wiki's duplicate Zhao Yun entry and six heading-only sections are retained. Its chain-plot and three-visits overview headings are separate from the Chinese guide's individual stages. The Chinese final page repeats the Wu-king title for an emperor result; both original titles survive under distinct corpus IDs.

The fresh cross-source comparison records 41 unresolved differences. It reevaluates earlier leads rather than adopting an earlier count. Differences include missing versus explicitly unchanged results, aggregate versus staged coverage, general-free versus never-served-free officers, city versus base location, numeric boundaries, branch scope, result-description order and version qualifiers.

## Format and interpretation

`eventId` is a human-assigned stable corpus key, not an original numeric runtime event ID. `observationId` identifies a source section. Person, city and force strings are source-level names or symbolic roles; they are not engine/save IDs. Traditional/source spellings are retained, including disclosed apparent typos. Roles such as player-ruler, Cao-family and Liu-family must be read within the source observation; compatibility, kinship and associated relationships are not interchangeable.

`conditions` is an ordered list of descriptive predicates. Existing top-level entries combine as stated by the guide, with explicit `all`, `any` and `if` nodes for scope. Empty conditions mean **not stated**, not unconditional eligibility. A `fact` has subject, field, operator, value, category and certainty. These fields are descriptions; the package exposes no evaluator. Array subjects normally mean each listed actor unless the operator explicitly quantifies otherwise.

Source uncertainty stays in the tree. Both Chinese Wu date clauses retain alternative groupings under an unresolved fact. Shu accession retains baseline dates and an acceleration qualifier with missing replacement thresholds; it does not unconditionally impose dates that the source says may be accelerated. No preference for one guide resolves these gaps.

`orderedResults` preserves guide-description order, not original store/callback order. `effect`, conditional `branch` and explicit `choice` nodes keep described changes, decisions and any stated AI default. Missing results and explicit no-change results differ. Death, succession, movement or faction division descriptions never call the engine.

Prerequisites preserve source event references, required/conditional/alternative/may-accelerate status, exact inequalities and original units. Do not silently convert months to30-day periods. Unknown original one-shot flags remain `onceOnly: {status: not-stated, flagId: null}`. This is neither a repeatability rule nor an invented flag write.

Most game edition/platform/build fields remain unspecified. Explicit PK Lü Meng effects and tentative console observations are locally qualified. An article title describing itself as official, or a modern PC sidebar, does not identify an original executable.

## Files

- `gamersky-2008.json`, `atwiki-88.json`: independent observations
- `inventory.json`: complete selected-source catalog, hashes and fresh differences, with direct source references
- `schema.json`, `inventory-schema.json`: closed JSON Schema2020-12 shapes
- `scripts/check_scenario_events.py`: dependency-free supported-vocabulary schema and corpus checks, not a general JSON Schema implementation
- `scripts/test_scenario_events.py` and the Node wrapper: data-only regressions and malformed-input checks

The separate [PS2 historical guide](https://w.atwiki.jp/sangokushi11/pages/100.html), generic-event sections, a complete original-game event catalog, one-shot flags, scheduling, executable outcomes and clean-stock/Vanilla/console equivalence remain outside this corpus's proof. Nothing here certifies native event execution or game-state integration.
