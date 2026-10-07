# Independent PS2 historical-guide transcription

This is inert `public-guide-transcription` data with `executionEnabled: false`. It contains no evaluator, scheduler or outcome executor and is not imported by the engine. PS2 is identified by the [AtWiki page100 title](https://w.atwiki.jp/sangokushi11/pages/100.html), not by an original executable or tested stock build.

## Selected coverage

All 64 body headings at web-rendered lines191–1061 have separate observations and `ps2.historical.*` corpus keys. These are human-assigned source IDs, not native event/save IDs:

- 59 sections describe conditions and results, including two whose result only says another event follows (`連環の計②鳳儀亭`, `三顧の礼②`). Continuation is neither a no-op nor a complete state transition
- Four openings contain conditions but no stated result (`黄巾の乱`, `桃園の誓い`, `反董卓連合`, `孫策出陣`)
- `孫策の死` only references another page. Its destination is recorded, but no destination content or other corpus rules are imported

741 ordered source nodes include 123 condition/result labels, 360 condition nodes, 254 result nodes, three explanatory annotations and one reference. This is not a count of independent predicates or original game events.

The page says blue text is PK-only, but the retained web text has no color. Every observation therefore keeps edition unspecified and `editionBasis: rendered-text-lacks-color`. Platform PS2 is a source-title claim; patch, original ID, one-shot flag and probability remain null/not-stated. The older historical105/66/41 and generic33/31/10 corpora retain their complete six-file sets and exact bytes, separately counted. No PS2 description overwrites PC rules.

## Reading the records

`sourceSection` retains the Japanese title and `text` is a Chinese factual paraphrase. `sourceLine`, `depth`, and `parentLine` retain the rendered list structure. Source indentation is not a resolved AND/OR or executable effect tree: siblings may be alternatives, controller branches or ambiguously scoped results. Order is guide-description order, not native stores/callbacks. Each node's `sourceLineSha256` binds the original selected line text including indentation, without its L-number prefix. Dataset-level source URL and snapshot hash qualify every observation.

Missing conditions/results mean not stated, never unconditional eligibility, denial or no change. Explicit no-change branches remain separate. Keep months distinct from days, source inequalities, assignment versus addition notation, city-priority lists and historical/event-person alternatives. Names remain source-level strings; `候成` and `紫桑` are not silently normalized to engine IDs. 留守 is paraphrased as “不在” while retaining the original status term, without inferring a runtime status code.

`source-stated` means the guide states it, not that independent/native evidence verifies it. Editorial comparisons and summaries, conjectures and ambiguity have separate certainty labels. The 24 unresolved source limitations include lost PK membership, missing branches/results, reference-only coverage, spelling/action-status anomalies, ambiguous Sun Quan merit arithmetic, Zhou Yu's missing equal-merit case, Zhuge Liang's overlapping equal-merit cases and item-transfer scope, Wei accession indentation and Shu accession acceleration without a replacement threshold. Artifact hashes prevent transcription drift; they do not establish that the source is true.

## Recovery provenance and checks

The selected snapshot covers L116–1061, with page metadata, color note, contents and body; comments are excluded. It is normalized web-rendered text, not raw HTML. The original tool combined some L-numbered rows onto single physical lines; normalization split row boundaries, removed tool wrappers and trailing whitespace, without inventing text. The source displays last updated2010-03-09 16:52, timezone unspecified, and the earlier tool reported “Crawled: last month”; neither proves live-origin freshness.

The first local candidate and its review bundle/logs became unavailable before publication. This rebuild uses the retained `ps2-review-lines.txt` and `ps2-paired-review.txt`, with original retained-byte hashes in the review package's recovery manifest. Re-extracting L116–1061 reproduced the prior snapshot SHA256 `f1ab94d5e25170370285523cd90ab212099e4bd8515c00faffa2641e57fac40e`; rebuilding the 64 observations reproduced the prior data SHA256 `b52d8a2a710e8bc359648d7df753caf492cd334611bde4f4f9618443c6724658`. Original raw tool responses and old validation logs are not claimed recovered. This rebuilt candidate requires fresh checks and independent review; an old passing result is not new validation.

- `atwiki-100.json`: inert observations and ordered descriptive nodes
- `inventory.json`: exact catalog, provenance, 24 source limitations and preserved-corpus hashes
- `schema.json`, `inventory-schema.json`: closed JSON Schema2020-12 shapes
- `scripts/check_ps2_events.py`: standard-library validator for this package's explicit schema vocabulary, catalog/hierarchy/pins, old-corpus bytes and runtime-reference guard; not a general JSON Schema implementation
- `scripts/test_ps2_events.py` and Node wrapper: static regression/malformed-input checks, including nonfinite numeric overflow

Run `python -B scripts/check_ps2_events.py` and `python -B scripts/test_ps2_events.py`. Add `--snapshots /path/to/sources` to the checker to verify the actual snapshot bytes and each line/hierarchy; without that option it reports zero verified snapshots. `npm run check` includes the Node wrapper. The runtime-reference scan is a lexical guard, not a complete dependency resolver; an unchanged runtime is also established from the repository diff.

Only the selected guide-body transcription gap is closed. The reference destination, missing source details, 24 limitations, original-game catalog, native flags/callers/results, PK applicability, PC/PS2/Vanilla/patch equivalence, original saves, global RNG and execution remain open. P0-78 and work depending on capture, force extinction or native transactions are excluded.
