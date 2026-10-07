# Independent generic-event public-guide data

Status: `public-guide-transcription`; `executionEnabled: false`. This package is descriptive source data. It supplies no condition evaluator, scheduler, effect executor, engine dependency or original-runtime certificate.

## Exact selected scope

The complete generic section of [Wiki88](https://w.atwiki.jp/sangokushi11/pages/88.html), rendered lines1126–1287, contains31 headings. Each is retained under a new `generic.*` corpus ID. [GamerSky's2009 PK article](https://www.gamersky.com/handbook/200902/134257.shtml) contributes its bronze-sparrow supplement, and [page13](https://www.gamersky.com/handbook/200902/134257_13.shtml) contributes Taishan. There are33 source observations,31 event IDs and10 explicitly unresolved comparison/interpretation issues.

Wiki-only coverage, denominator31:

- 6 substantive condition/result sections
- 2 conditions-only sections
- 1 explicitly unverified civil-officer recommendation anecdote
- 1 praise section with only a qualitative result
- 21 heading-only sections, with empty conditions, results and annotations

The two GamerSky observations are separately classified as supplementary. No empty heading is counted as a complete rule. The GamerSky2009 article is distinct from the older2008 historical article. Its other historical sections are outside this batch; only selected pages1 and13 are snapshotted here. Previous research reported reading13 pages but did not preserve those tool outputs, so complete13-page archived coverage is not claimed.

The historical package in `data/scenario-events` remains byte-for-byte unchanged at105 observations,66 corpus IDs and41 differences. Similar emperor, recommendation, marriage or sworn-brother headings do not establish shared identity. The nine-rank system, Wei duke/king and other historical entries are excluded. A volunteer result inside the Yu Ji observation does not fill the separate volunteer heading.

## Descriptive contract

`eventId` is a human-assigned corpus label, never an original numeric ID. `observationId` identifies one selected source section. `sourceOrdinal` is local to the selected Wiki generic section or selected observations on a GamerSky page; it is not an original event number or whole-article ordinal. Source names remain source-level strings and are not engine/save IDs.

`conditions`, `results` and `annotations` are ordered descriptive claims. Each claim has a scope label, factual paraphrase, source certainty, line locator and any stated quantities. Scope labels describe branches or candidate groups; they have no executable interpretation. Results preserve guide-description order, not native writes/callbacks. Conditions are partial source descriptions, never a necessary-and-sufficient rule set. Missing conditions mean not stated, not unconditional eligibility or proof that omitted conditions are false. Empty results mean not stated, not a no-change result.

Unknown original IDs, one-shot flags and trigger probabilities remain null. Qualitative increases and unknown thresholds explicitly retain null values. No reward clipping, XP conversion, rank ordering, city normalization, probability formula, exact write order or choice AI default is inferred. The civil-officer anecdote remains only unverified annotations, including its claimed debate result and possible compatibility relation.

Key retained uncertainties:

- Bronze sparrow: Wiki's `大将軍`/duke/king/emperor list differs from GamerSky's `大司马`; GamerSky's location is literally `邻`, unresolved and not corrected to Ye. Omitted conditions are not negations. Wiki's post-acquisition development/technology note is recorded as a result explanation, not eligibility
- Five Tigers: first ten-day period of the selected months is not changed to day1. The estimated relation to level4 technology research is not converted into an XP number
- Guan Lu: the relationship conjunction and unspecified low-level probability remain unresolved. Disaster conditions in Guan Lu/Xu Shao are not silently assigned Yu Ji's explicit city scope
- Yu Ji: the “either choice” XP wording and later third execute option do not establish a known common effect for all three options
- Taishan: at least one Xu-region city versus Xiaopei remains a difference. Ability+2, troop-type XP, qualitative aptitude and tentative subordinate merit remain separate source claims

Wiki's edition is unspecified. GamerSky's title/introduction says PK, but original platform and patch are unknown. Modern site sidebars do not establish runtime version, and source independence is not established. GamerSky's introductory caveat says some conditions may be unnecessary or unclear; it applies to its selected observations.

## Provenance and checks

The inventory pins source URLs, exact selected boundaries, original titles, mappings and SHA256 of three rendered-text snapshots obtained on2026-10-07. These are web-tool line numbers, not raw HTML lines. The tool reported crawl ages of “yesterday” and “last week”; no origin freshness is inferred. A direct HTML request returned403 and was not retried. Raw HTML was not obtained. The separate review/recovery package retains the rendered snapshots and original tool outputs; the repository retains their verifiable hashes and selection metadata.

- `schema.json`, `inventory-schema.json`: closed JSON Schema2020-12 shapes
- `atwiki-88.json`, `gamersky-2009.json`: independent observations
- `inventory.json`: exact source catalog, mapping, categories and unresolved issues
- `scripts/check_generic_events.py`: dependency-free static checker for the schemas' explicit supported vocabulary; not a general JSON Schema implementation
- `scripts/test_generic_events.py`:78 data-only tests, including malformed identities, references, unknown quantities, source categories, differences and execution flags
- `packages/engine/test/generic-event-data.test.mjs`: static-check wrapper only, no engine imports

Run from repository root:

```sh
python scripts/check_generic_events.py
python scripts/test_generic_events.py
python scripts/check_generic_events.py --snapshots /path/to/review-package/sources
npm run check
```

Without `--snapshots`, source-byte retrieval is not reverified; schema, catalog and historical byte preservation still are. The optional snapshot check verifies hashes and every selected rendered line. Manual source review remains necessary: shape and pinned quantities alone do not prove all prose interpretations correct.

Complete original-game coverage, missing conditions/results, unresolved comparisons, original flags, global RNG, original saves, historical-event toggle behavior, native execution and stock/Vanilla/console equivalence remain open.
