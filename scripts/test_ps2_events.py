"""Independent PS2 guide transcription regressions and fail-closed input probes.

These tests exercise inert source data, never an engine, trigger evaluator or native
event implementation. The optional external rendered snapshot is not a CI input.
"""
import ast
import copy
import hashlib
import json
import shutil
import tempfile
import unittest
from collections import Counter
from pathlib import Path

from check_ps2_events import (
    ROOT, DataError, check_files, load_json, schema_contract, shape,
    source_structure, validate_corpus,
)

DATA = ROOT / 'data/ps2-scenario-events'
SNAPSHOT_NAME = 'atwiki-100-ps2-rendered-lines.txt'
# Independently recorded before adding this corpus; neither inventory nor checker
# constants are used to supply the expected old file set or expected bytes.
PRESERVED_FILES = {
    'data/scenario-events/README.md': 'd88fccc00f9c3257588d2847e6a0dd38a166a13a3d6ee28707dfb290abdac453',
    'data/scenario-events/atwiki-88.json': 'c309ed1024df30e62f5a7ff6f4f16bb82fd98cac3e7aed19f80a833afe746552',
    'data/scenario-events/gamersky-2008.json': '45cb47718d2e90eebd59b06fcc81ea24972852bcae2dc436aa60e45c8fa1c8e5',
    'data/scenario-events/inventory-schema.json': '5024d96e8235c25244406a077844f53cc4f522c83793efbc29401e2452633168',
    'data/scenario-events/inventory.json': 'fc3d85dd243b37be9068960198787b64a871168469cae28576dd070b84763ce4',
    'data/scenario-events/schema.json': '1f691e5a1276b292ad8a63534489992a5db6eb49dadc1e3a62a2667b4d2e2ccb',
    'data/generic-events/README.md': 'fa384f796eac4bad72f245bb25fa888f9d5192eebcd8d3211bc0b3caa1ddfe39',
    'data/generic-events/atwiki-88.json': 'cd76844fe0b6f8417acea0f84fbeaf3f94d5b2edfc51b645ce07be026e330d28',
    'data/generic-events/gamersky-2009.json': '1285ebb2097ef373b9404316aa47977df7d501b9c9d62768def80da31ca7c29d',
    'data/generic-events/inventory-schema.json': '0c033b181e12293baf481d0da4b90995b83edc72b95391880b41fc4610149edf',
    'data/generic-events/inventory.json': '0d819b4a2f3252ca3b5a0794a88aea540fba13ff2c18974c94cbc71988d3bc53',
    'data/generic-events/schema.json': 'f1aa0986c587a43f6d69356b96b3a922f5626a11dde62520e843d26eca48a9c6',
}

# Literal rendered lines, including indentation, independently read from the
# selected source. Translation is not substituted for the source fingerprint.
REVIEWED_SOURCE_LINES = {
    296: '      * 董卓勢力に呂布、貂蝉、張遼、高順、候成、魏続、宋憲、曹性、王允、李粛および、その有縁関係にある武将がいた場合、呂布勢力所属に',
    374: '    * 張闓が陶謙勢力に所属していて、行動済みだった場合、下野される',
    424: '    * 孫策勢力が紫桑、建業、呉の3都市すべてを支配',
    456: '    * 顧雍が配下になり忠誠100、功績500（孫権が君主の場合、功績+2000）',
    482: '    * 魯粛が配下になり忠誠100、功績500（孫権が君主の場合、功績+2000）',
    493: '    * 諸葛瑾が配下になり忠誠100、功績500（孫権が君主の場合、功績+2000）',
    809: '      * 魯粛の功績が周瑜の功績より低い場合、功績が周瑜と同じ値になる',
    810: '      * 魯粛の功績が周瑜の功績より高い場合、功績+2000',
    936: '    * 曹家勢力がCOM、あるいは「帝位に登る」を選択した場合',
    939: '    * 曹家勢力の支配都市の治安、気力に+20',
    950: '    * シナリオ開始年が220年12月以前で180日以上経過、イベント「魏帝即位」が発生済みの場合、発生時期が早まる',
    1061: '    * 姜維の功績が諸葛亮以下の場合、諸葛亮と同じ値になる、以上の場合+4000になり、諸葛亮のアイテムが姜維に移動',
}


def assign(value, path, replacement):
    for key in path[:-1]:
        value = value[key]
    value[path[-1]] = replacement


class PS2EventTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = load_json(DATA / 'atwiki-100.json')
        cls.original_inventory = load_json(DATA / 'inventory.json')
        cls.schema = load_json(DATA / 'schema.json')
        cls.inventory_schema = load_json(DATA / 'inventory-schema.json')

    def setUp(self):
        self.ds = copy.deepcopy(self.original)
        self.inventory = copy.deepcopy(self.original_inventory)

    def valid(self):
        return validate_corpus(self.ds, self.inventory, self.schema, self.inventory_schema)

    def rejected(self):
        with self.assertRaises(DataError):
            self.valid()

    def observation(self, ordinal):
        return self.ds['observations'][ordinal - 1]

    def clause(self, line):
        found = [n for e in self.ds['observations'] for n in e['clauses'] if n['sourceLine'] == line]
        self.assertEqual(len(found), 1, f'source line {line} must appear exactly once')
        return found[0]

    def test_complete_independent_catalog(self):
        summary = self.valid()
        for key, value in {
            'sources': 1, 'observations': 64, 'events': 64, 'clauses': 741,
            'conditionsAndResults': 59, 'conditionsOnly': 4, 'referenceOnly': 1,
            'continuationOnlyResults': 2, 'executionEnabled': False,
        }.items():
            self.assertIs(type(summary[key]), type(value))
            self.assertEqual(summary[key], value)
        self.assertEqual(summary['unresolvedIssues'], len(self.inventory['unresolvedIssues']))
        self.assertEqual(summary['unresolvedIssues'], 24)
        self.assertEqual([e['sourceOrdinal'] for e in self.ds['observations']], list(range(1, 65)))
        self.assertEqual(self.observation(1)['sourceLocator']['startLine'], 191)
        self.assertEqual(self.observation(64)['sourceLocator']['endLine'], 1061)

    def test_independent_ids_do_not_merge_old_corpora(self):
        old = set()
        for folder, names, field in (
            ('scenario-events', ('atwiki-88.json', 'gamersky-2008.json'), 'events'),
            ('generic-events', ('atwiki-88.json', 'gamersky-2009.json'), 'observations'),
        ):
            for name in names:
                old.update(e['eventId'] for e in load_json(ROOT / 'data' / folder / name)[field])
        current = {e['eventId'] for e in self.ds['observations']}
        self.assertEqual(len(current), 64)
        self.assertFalse(current & old)

    def test_ps2_version_and_runtime_unknowns_remain_unknown(self):
        for e in self.ds['observations']:
            with self.subTest(observation=e['observationId']):
                self.assertEqual(e['versionScope'], {
                    'platform': 'PS2', 'edition': 'unspecified', 'patch': None,
                    'editionBasis': 'rendered-text-lacks-color',
                })
                self.assertIs(e['executionEnabled'], False)
                self.assertIsNone(e['nativeEventId'])
                self.assertIsNone(e['triggerProbability'])
                self.assertEqual(e['onceOnly'], {'status': 'not-stated', 'flagId': None})
                self.assertEqual(e['evidence'], 'public-guide-transcription')
        self.assertEqual(self.inventory['sourceIndependence'], 'not-established')
        self.assertIs(self.inventory['source']['colorInformationRetained'], False)

    def test_coverage_is_description_not_complete_rules(self):
        counts = Counter(e['coverageKind'] for e in self.ds['observations'])
        self.assertEqual(counts, {'conditions-and-results': 59, 'conditions-only': 4, 'reference-only': 1})
        self.assertEqual([e['sourceOrdinal'] for e in self.ds['observations'] if e['coverageKind'] == 'conditions-only'], [1, 2, 4, 19])
        for e in self.ds['observations']:
            roles = {n['role'] for n in e['clauses']}
            self.assertEqual(e['conditionCompleteness'], 'partial-source-description' if 'condition' in roles else 'not-stated')
            self.assertEqual(e['resultCompleteness'], 'partial-source-description' if 'result' in roles else 'not-stated')
            if e['coverageKind'] == 'conditions-only':
                self.assertNotIn('result', roles)
                self.assertNotIn('result-label', roles)

    def test_reference_only_does_not_import_external_rules(self):
        e = self.observation(34)
        self.assertEqual(e['coverageKind'], 'reference-only')
        self.assertEqual([(n['sourceLine'], n['role']) for n in e['clauses']], [(610, 'reference')])
        self.assertEqual(e['references'], [{
            'sourceLine': 610, 'label': '于吉の呪い',
            'url': 'https://www4.atwiki.jp/sangokushi11/pages/5.html',
            'status': 'not-transcribed',
        }])
        self.assertTrue(all(not e['references'] for e in self.ds['observations'] if e['sourceOrdinal'] != 34))

    def test_continuation_results_are_not_noops(self):
        self.assertEqual(self.inventory['continuationOnlyResultObservationIds'], ['ps2.atwiki100.08', 'ps2.atwiki100.40'])
        for ordinal, line in ((8, 275), (40, 678)):
            e = self.observation(ordinal)
            self.assertEqual([n['sourceLine'] for n in e['clauses'] if n['role'] == 'result'], [line])
            text = self.clause(line)['text']
            self.assertRegex(text, r'继续|接续|接着|续接|続く|衔接')
            self.assertNotRegex(text, r'无变化|没有变化|no.?op|nothing happens')

    def test_reviewed_source_fingerprints_include_indentation(self):
        for line, original in REVIEWED_SOURCE_LINES.items():
            with self.subTest(line=line):
                self.assertEqual(self.clause(line)['sourceLineSha256'], hashlib.sha256(original.encode()).hexdigest())
        for e in self.ds['observations']:
            lines = [n['sourceLine'] for n in e['clauses']]
            self.assertEqual(lines, sorted(set(lines)))
            for n in e['clauses']:
                self.assertRegex(n['sourceLineSha256'], r'^[a-f0-9]{64}$')

    def test_wei_emperor_common_results_preserve_sibling_scope(self):
        branch = self.clause(936)
        shared = self.clause(939)
        self.assertEqual((branch['depth'], branch['parentLine']), (1, 934))
        self.assertEqual((shared['depth'], shared['parentLine']), (1, 934))
        self.assertEqual((self.clause(938)['depth'], self.clause(938)['parentLine']), (2, 936))
        self.assertEqual(self.clause(939)['role'], 'result')

    def test_lusu_strict_branches_have_no_equality_branch(self):
        lower, higher = self.clause(809), self.clause(810)
        self.assertEqual((lower['depth'], lower['parentLine']), (2, 808))
        self.assertEqual((higher['depth'], higher['parentLine']), (2, 808))
        self.assertRegex(lower['text'], r'低于|低於|低い|小于')
        self.assertRegex(higher['text'], r'高于|高於|高い|大于')
        self.assertNotRegex(lower['text'], r'不高于|不超过|以下|≤')
        self.assertNotRegex(higher['text'], r'不低于|至少|以上|≥')
        self.assertIn('2000', higher['text'])

    def test_literal_source_names_are_not_silently_corrected(self):
        self.assertIn('候成', self.clause(296)['text'])
        self.assertIn('紫桑', self.clause(424)['text'])

    def test_acted_condition_is_not_inverted(self):
        text = self.clause(374)['text']
        self.assertRegex(text, r'已行动|已经行动|行动済み|已行動')
        self.assertNotRegex(text, r'未行动|尚未行动|没有行动|未行動')

    def test_recruitment_parenthetical_2000_is_not_replaced_with_2500(self):
        for line in (456, 482, 493):
            with self.subTest(line=line):
                text = self.clause(line)['text']
                self.assertIn('500', text)
                self.assertIn('+2000', text)
                self.assertNotIn('2500', text)
                self.assertRegex(text, r'[（(].*2000.*[）)]')

    def test_shu_emperor_early_timing_is_not_a_new_threshold(self):
        text = self.clause(950)['text']
        self.assertRegex(text, r'提前|早まる')
        self.assertIn('220', text)
        self.assertIn('180', text)
        self.assertEqual(self.clause(950)['role'], 'condition')
        self.assertNotRegex(text, r'提前(?:30|60|90|180)日|必定|必然|立即触发')

    def test_jiang_wei_inclusive_equality_conflict_is_preserved(self):
        text = self.clause(1061)['text']
        self.assertRegex(text, r'以下|不高于|小于等于|≤')
        self.assertRegex(text, r'以上|不低于|大于等于|≥')
        self.assertIn('4000', text)
        self.assertRegex(text, r'物品|道具|宝物|アイテム')

    def test_unresolved_issues_keep_source_targets(self):
        ids = {e['observationId'] for e in self.ds['observations']}
        issues = self.inventory['unresolvedIssues']
        self.assertEqual(len({i['id'] for i in issues}), len(issues))
        for issue in issues:
            self.assertEqual(issue['status'], 'unresolved')
            self.assertTrue(issue['observationIds'])
            self.assertTrue(set(issue['observationIds']) <= ids)
            self.assertTrue(issue['sourceLines'])
            self.assertTrue(issue['description'].strip())

    def test_material_ambiguities_are_explicitly_tracked(self):
        by_id = {i['id']: i for i in self.inventory['unresolvedIssues']}
        expected = {
            'pk-color-loss': [126],
            'relay-effects-not-stated': [275, 678],
            'sun-ce-death-reference-only': [608, 610],
            'hou-cheng-source-spelling': [296, 301],
            'zhang-kai-action-status-anomaly': [374],
            'zi-sang-source-spelling': [424],
            'sun-quan-recommendation-merit': [456, 482, 493],
            'zhou-yu-equal-merit-gap': [808, 809, 810],
            'wei-emperor-branch-scope': list(range(935, 947)),
            'shu-emperor-accelerated-timing': [950],
            'zhuge-liang-equal-merit-overlap': [1061],
            'zhuge-liang-item-transfer-scope': [1061],
        }
        for key, lines in expected.items():
            with self.subTest(issue=key):
                self.assertIn(key, by_id)
                self.assertEqual(by_id[key]['sourceLines'], lines)

    def test_ambiguous_clauses_are_not_promoted_to_confirmed_rules(self):
        for line in (296, 424, 456, 482, 493, 809, 810, 939, 950, 1061):
            with self.subTest(line=line):
                self.assertEqual(self.clause(line)['certainty'], 'source-ambiguous')

    def test_reject_inference_repairs_to_material_ambiguities(self):
        replacements = {
            296: self.clause(296)['text'].replace('候成', '侯成'),
            374: self.clause(374)['text'].replace('已行动', '未行动'),
            424: self.clause(424)['text'].replace('紫桑', '柴桑'),
            456: '孙权为君主时功绩固定为2500',
            809: '若鲁肃功绩低于或等于周瑜，则设为相同值',
            810: '若鲁肃功绩高于或等于周瑜，则功绩+2000',
            950: '魏帝即位后立即触发本事件',
            1061: '若姜维功绩严格高于诸葛亮，则功绩+4000',
        }
        for line, text in replacements.items():
            with self.subTest(line=line):
                self.setUp()
                self.clause(line)['text'] = text
                self.rejected()

    def test_reject_wei_emperor_shared_result_nested_under_choice(self):
        self.clause(939)['depth'] = 2
        self.clause(939)['parentLine'] = 936
        self.rejected()

    def test_reject_source_ambiguity_resolved_without_new_evidence(self):
        for line in (296, 424, 456, 482, 493, 809, 810, 939, 950, 1061):
            with self.subTest(line=line):
                self.setUp()
                self.clause(line)['certainty'] = 'source-stated'
                self.rejected()

    def test_reject_missing_required_dataset_fields(self):
        for key in self.schema['required']:
            with self.subTest(key=key):
                self.setUp()
                del self.ds[key]
                self.rejected()

    def test_reject_missing_required_observation_fields(self):
        for key in self.schema['properties']['observations']['items']['required']:
            with self.subTest(key=key):
                self.setUp()
                del self.observation(1)[key]
                self.rejected()

    def test_reject_missing_required_clause_fields(self):
        fields = self.schema['properties']['observations']['items']['properties']['clauses']['items']['required']
        for key in fields:
            with self.subTest(key=key):
                self.setUp()
                del self.observation(1)['clauses'][0][key]
                self.rejected()

    def test_reject_missing_required_inventory_fields(self):
        for key in self.inventory_schema['required']:
            with self.subTest(key=key):
                self.setUp()
                del self.inventory[key]
                self.rejected()

    def test_reject_unknown_keys_at_every_dataset_object_boundary(self):
        for path in ((), ('observations', 0), ('observations', 0, 'sourceLocator'),
                     ('observations', 0, 'versionScope'), ('observations', 0, 'onceOnly'),
                     ('observations', 0, 'clauses', 0), ('observations', 33, 'references', 0)):
            with self.subTest(path=path):
                self.setUp()
                assign(self.ds, (*path, 'handler'), 'apply_event')
                self.rejected()

    def test_reject_unknown_keys_at_every_inventory_object_boundary(self):
        for path in ((), ('source',), ('coverageCounts',), ('catalog', 0),
                     ('catalog', 0, 'sourceLocator'), ('unresolvedIssues', 0),
                     ('preservedCorpora',), ('preservedCorpora', 'files', 0),
                     ('preservedCorpora', 'historicalCounts'), ('preservedCorpora', 'genericCounts')):
            with self.subTest(path=path):
                self.setUp()
                assign(self.inventory, (*path, 'unexpected'), True)
                self.rejected()

    def test_reject_missing_repeated_reordered_observations(self):
        for operation in ('missing', 'duplicate', 'reordered', 'extra'):
            with self.subTest(operation=operation):
                self.setUp()
                events = self.ds['observations']
                if operation == 'missing': events.pop()
                if operation == 'duplicate': events[-1] = copy.deepcopy(events[0])
                if operation == 'reordered': events[:2] = reversed(events[:2])
                if operation == 'extra': events.append(copy.deepcopy(events[0]))
                self.inventory['observationCount'] = len(events)
                self.rejected()

    def test_reject_missing_repeated_reordered_clauses(self):
        for operation in ('missing', 'duplicate', 'reordered', 'extra'):
            with self.subTest(operation=operation):
                self.setUp()
                nodes = self.observation(5)['clauses']
                if operation == 'missing': nodes.pop()
                if operation == 'duplicate': nodes[-1] = copy.deepcopy(nodes[-2])
                if operation == 'reordered': nodes[1:3] = reversed(nodes[1:3])
                if operation == 'extra': nodes.append(copy.deepcopy(nodes[-1]))
                self.rejected()

    def test_reject_missing_repeated_reordered_inventory_catalog(self):
        for operation in ('missing', 'duplicate', 'reordered'):
            with self.subTest(operation=operation):
                self.setUp()
                catalog = self.inventory['catalog']
                if operation == 'missing': catalog.pop()
                if operation == 'duplicate': catalog[-1] = copy.deepcopy(catalog[0])
                if operation == 'reordered': catalog[:2] = reversed(catalog[:2])
                self.rejected()

    def test_reject_reference_only_filled_with_borrowed_rules(self):
        ref = self.observation(34)
        ref['clauses'].append({**copy.deepcopy(self.observation(1)['clauses'][1]),
                               'sourceLine': 611, 'parentLine': 610})
        ref['coverageKind'] = 'conditions-only'
        ref['conditionCompleteness'] = 'partial-source-description'
        self.rejected()

    def test_reject_reference_only_relabelled_as_condition(self):
        self.clause(610)['role'] = 'condition'
        self.rejected()

    def test_reject_condition_only_invented_result(self):
        self.observation(1)['clauses'].append({**copy.deepcopy(self.clause(193)),
                                              'sourceLine': 195, 'role': 'result-label', 'text': '结果'})
        self.rejected()

    def test_reject_continuations_rewritten_as_noop(self):
        for line in (275, 678):
            with self.subTest(line=line):
                self.setUp()
                self.clause(line)['text'] = '无变化'
                self.rejected()

    def test_reject_changed_transcription_even_with_updated_inventory_hash(self):
        self.clause(374)['text'] = '张闿未行动时下野'
        e = self.observation(15)
        forged = hashlib.sha256(json.dumps(e, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        self.inventory['catalog'][14]['reviewedObservationSha256'] = forged
        self.rejected()

    def test_reject_reference_destination_change(self):
        self.observation(34)['references'][0]['url'] = 'https://example.invalid/borrowed-rules'
        self.rejected()

    def test_reject_unresolved_issues_deleted_duplicated_reordered(self):
        for operation in ('missing', 'duplicate', 'reordered', 'empty'):
            with self.subTest(operation=operation):
                self.setUp()
                issues = self.inventory['unresolvedIssues']
                if operation == 'missing': issues.pop()
                if operation == 'duplicate': issues[-1] = copy.deepcopy(issues[0])
                if operation == 'reordered': issues.reverse()
                if operation == 'empty': issues.clear()
                self.rejected()


# Each assignment is its own named unittest, with a fresh corpus. Most values
# remain schema-valid, so these exercise semantic pins instead of only shape.
DATASET_MUTATIONS = {
    'dataset_execution': (('executionEnabled',), True),
    'false_as_zero': (('executionEnabled',), 0),
    'boolean_schema_version': (('schemaVersion',), True),
    'float_schema_version': (('schemaVersion',), 1.0),
    'dataset_evidence_upgrade': (('evidence',), 'native-exact'),
    'source_url_change': (('sourceURL',), 'https://w.atwiki.jp/sangokushi11/pages/88.html'),
    'snapshot_change': (('snapshotSha256',), 'a' * 64),
    'empty_condition_meaning': (('conditionMeaning',), ''),
    'empty_result_order_meaning': (('resultOrderMeaning',), ''),
    'observation_execution': (('observations', 0, 'executionEnabled'), True),
    'observation_false_as_zero': (('observations', 0, 'executionEnabled'), 0),
    'native_event_id': (('observations', 0, 'nativeEventId'), 125),
    'native_once_flag': (('observations', 0, 'onceOnly', 'flagId'), 0),
    'once_only_claim': (('observations', 0, 'onceOnly', 'status'), 'once-only'),
    'trigger_probability': (('observations', 0, 'triggerProbability'), 0.5),
    'observation_evidence_upgrade': (('observations', 0, 'evidence'), 'native-exact'),
    'pc_platform_inference': (('observations', 0, 'versionScope', 'platform'), 'PC'),
    'pk_edition_inference': (('observations', 0, 'versionScope', 'edition'), 'PK'),
    'base_edition_inference': (('observations', 0, 'versionScope', 'edition'), 'base'),
    'patch_inference': (('observations', 0, 'versionScope', 'patch'), '1.1'),
    'color_claim': (('observations', 0, 'versionScope', 'editionBasis'), 'blue-text-PK'),
    'historical_id_merge': (('observations', 0, 'eventId'), 'depose-shao-emperor'),
    'generic_id_merge': (('observations', 0, 'eventId'), 'generic.atwiki88.01'),
    'duplicate_event_id': (('observations', 1, 'eventId'), 'ps2.historical.01'),
    'duplicate_observation_id': (('observations', 1, 'observationId'), 'ps2.atwiki100.01'),
    'ordinal_reassignment': (('observations', 0, 'sourceOrdinal'), 2),
    'ordinal_bool': (('observations', 0, 'sourceOrdinal'), True),
    'ordinal_float': (('observations', 0, 'sourceOrdinal'), 1.0),
    'invented_heading': (('observations', 0, 'sourceSection'), '不存在的事件'),
    'shifted_heading_line': (('observations', 0, 'sourceLocator', 'startLine'), 192),
    'reversed_section_range': (('observations', 0, 'sourceLocator', 'endLine'), 190),
    'outside_section_range': (('observations', 63, 'sourceLocator', 'endLine'), 1062),
    'complete_conditions_claim': (('observations', 0, 'conditionCompleteness'), 'complete'),
    'partial_conditions_hidden': (('observations', 0, 'conditionCompleteness'), 'not-stated'),
    'invented_result_completeness': (('observations', 0, 'resultCompleteness'), 'partial-source-description'),
    'clause_line_outside_section': (('observations', 0, 'clauses', 1, 'sourceLine'), 999),
    'clause_on_heading_line': (('observations', 0, 'clauses', 0, 'sourceLine'), 191),
    'clause_line_bool': (('observations', 0, 'clauses', 0, 'sourceLine'), True),
    'clause_line_float': (('observations', 0, 'clauses', 0, 'sourceLine'), 193.0),
    'clause_fingerprint_change': (('observations', 0, 'clauses', 0, 'sourceLineSha256'), 'b' * 64),
    'clause_fingerprint_invalid': (('observations', 0, 'clauses', 0, 'sourceLineSha256'), 'not-a-sha'),
    'clause_depth_bool': (('observations', 0, 'clauses', 1, 'depth'), True),
    'negative_depth': (('observations', 0, 'clauses', 1, 'depth'), -1),
    'skipped_depth': (('observations', 0, 'clauses', 1, 'depth'), 2),
    'root_has_parent': (('observations', 0, 'clauses', 0, 'parentLine'), 191),
    'child_without_parent': (('observations', 0, 'clauses', 1, 'parentLine'), None),
    'nonlocal_parent': (('observations', 0, 'clauses', 1, 'parentLine'), 198),
    'parent_line_bool': (('observations', 0, 'clauses', 1, 'parentLine'), True),
    'condition_moved_to_result': (('observations', 0, 'clauses', 1, 'role'), 'result'),
    'rule_moved_to_root': (('observations', 0, 'clauses', 0, 'role'), 'condition'),
    'empty_transcription': (('observations', 0, 'clauses', 1, 'text'), ''),
    'source_text_change': (('observations', 0, 'clauses', 1, 'text'), '全部事件无条件触发'),
    'certainty_promotion': (('observations', 0, 'clauses', 1, 'certainty'), 'native-exact'),
    'erased_reference': (('observations', 33, 'references'), []),
    'reference_status_upgrade': (('observations', 33, 'references', 0, 'status'), 'verified-rules'),
}
INVENTORY_MUTATIONS = {
    'inventory_execution': (('executionEnabled',), True),
    'inventory_false_as_zero': (('executionEnabled',), 0),
    'inventory_boolean_schema_version': (('schemaVersion',), True),
    'inventory_boolean_count': (('observationCount',), True),
    'inventory_float_count': (('eventCount',), 64.0),
    'inventory_wrong_count': (('observationCount',), 65),
    'inventory_wrong_clause_count': (('clauseCount',), 740),
    'inventory_coverage_mix': (('coverageCounts', 'conditions-and-results'), 60),
    'continuation_ids_erased': (('continuationOnlyResultObservationIds',), []),
    'continuation_ids_reassigned': (('continuationOnlyResultObservationIds',), ['ps2.atwiki100.09', 'ps2.atwiki100.40']),
    'source_independence_upgrade': (('sourceIndependence',), 'independently-confirmed'),
    'source_color_restored_claim': (('source', 'colorInformationRetained'), True),
    'source_comments_imported': (('source', 'commentsIncluded'), True),
    'raw_html_claim': (('source', 'snapshotFormat'), 'raw-html'),
    'live_freshness_claim': (('source', 'toolFreshness'), 'verified-live-origin'),
    'source_observation_count_change': (('source', 'expectedObservationCount'), 125),
    'source_snapshot_change': (('source', 'snapshotSha256'), 'a' * 64),
    'catalog_clause_count_change': (('catalog', 0, 'clauseCount'), 3),
    'catalog_review_hash_change': (('catalog', 0, 'reviewedObservationSha256'), 'a' * 64),
    'issue_resolved_claim': (('unresolvedIssues', 0, 'status'), 'resolved'),
    'issue_description_change': (('unresolvedIssues', 0, 'description'), 'All ambiguity resolved by inference.'),
    'issue_empty_targets': (('unresolvedIssues', 0, 'observationIds'), []),
    'issue_dangling_target': (('unresolvedIssues', 0, 'observationIds'), ['ps2.atwiki100.99']),
    'issue_duplicate_target': (('unresolvedIssues', 0, 'observationIds'), ['ps2.atwiki100.01', 'ps2.atwiki100.01']),
    'issue_empty_lines': (('unresolvedIssues', 0, 'sourceLines'), []),
    'issue_line_outside_selection': (('unresolvedIssues', 0, 'sourceLines'), [1062]),
    'preserved_historical_counts': (('preservedCorpora', 'historicalCounts', 'observations'), 169),
    'preserved_generic_counts': (('preservedCorpora', 'genericCounts', 'events'), 95),
    'preserved_file_hash': (('preservedCorpora', 'files', 0, 'sha256'), 'a' * 64),
    'preserved_file_set_erased': (('preservedCorpora', 'files'), []),
}


def mutation_test(target, path, replacement):
    def run(self):
        assign(getattr(self, target), path, copy.deepcopy(replacement))
        self.rejected()
    return run


for _name, (_path, _replacement) in DATASET_MUTATIONS.items():
    setattr(PS2EventTests, 'test_reject_' + _name, mutation_test('ds', _path, _replacement))
for _name, (_path, _replacement) in INVENTORY_MUTATIONS.items():
    setattr(PS2EventTests, 'test_reject_' + _name, mutation_test('inventory', _path, _replacement))


class ValidatorPrimitiveTests(unittest.TestCase):
    def test_boolean_integer_null_and_float_are_not_interchangeable(self):
        for bad, schema in (
            (True, {'type': 'integer'}), (False, {'type': 'integer'}), (1.0, {'type': 'integer'}),
            (0, {'type': 'boolean'}), (1, {'type': 'boolean'}), (0, {'type': 'null'}),
            (True, {'const': 1}), (0, {'const': False}), (1.0, {'const': 1}),
            ([True], {'const': [1]}), ({'v': 0}, {'const': {'v': False}}),
            (True, {'enum': [1]}), (0, {'enum': [False]}),
            (False, {'anyOf': [{'type': 'integer'}, {'type': 'null'}]}),
        ):
            with self.subTest(bad=bad, schema=schema), self.assertRaises(DataError):
                shape(bad, schema)
        for good, schema in ((1, {'type': 'integer'}), (False, {'type': 'boolean'}),
                             (None, {'type': 'null'}), (False, {'enum': [False, 0]})):
            shape(good, schema)
        schema_contract({'enum': [False, 0, True, 1]})

    def test_reject_unknown_schema_vocabulary_recursively(self):
        for keyword, value in (('$ref', '#/defs/a'), ('$defs', {}), ('oneOf', []),
                               ('allOf', []), ('not', {}), ('maximum', 10),
                               ('uniqueItems', True), ('format', 'uri'),
                               ('unevaluatedProperties', False)):
            for schema in ({keyword: value}, {'properties': {'nested': {keyword: value}}}):
                with self.subTest(keyword=keyword, schema=schema), self.assertRaises(DataError):
                    schema_contract(schema)

    def test_reject_malformed_schema_contract(self):
        malformed = [
            [], True, {'type': 'number'}, {'type': ['integer', 'null']},
            {'required': ['a', 'a']}, {'required': 'a'}, {'required': [1]},
            {'properties': []}, {'items': True}, {'additionalProperties': 0},
            {'anyOf': []}, {'anyOf': [False]}, {'enum': []}, {'enum': [1, 1]},
            {'enum': [{'x': 1}, {'x': 1}]}, {'minItems': True}, {'minimum': -1},
            {'minLength': 1.0}, {'pattern': '('}, {'pattern': 1}, {'title': 1},
        ]
        for schema in malformed:
            with self.subTest(schema=schema), self.assertRaises(DataError):
                schema_contract(schema)

    def test_shape_enforces_all_supported_constraints(self):
        for value, schema in (
            ({}, {'required': ['x']}), ({'x': 1}, {'additionalProperties': False}),
            ([], {'minItems': 1}), (['a'], {'items': {'type': 'integer'}}),
            ('', {'minLength': 1}), ('abc', {'pattern': '^[0-9]+$'}),
            (0, {'minimum': 1}), ('x', {'anyOf': [{'type': 'integer'}, {'type': 'null'}]}),
        ):
            with self.subTest(value=value, schema=schema), self.assertRaises(DataError):
                shape(value, schema)
        with self.assertRaises(DataError):
            shape(1, {}, depth=100)

    def test_reject_duplicate_json_keys_at_any_depth(self):
        for text in ('{"a":1,"a":2}', '{"a":{"b":1,"b":2}}', '[{"x":false,"x":0}]'):
            with self.subTest(text=text), tempfile.TemporaryDirectory() as tmp:
                p = Path(tmp) / 'bad.json'
                p.write_text(text, encoding='utf-8')
                with self.assertRaises(DataError):
                    load_json(p)

    def test_reject_nonfinite_json(self):
        # Numeric exponent overflow is valid JSON syntax but must not become an
        # accepted infinite Python float through json.loads' default parse_float.
        for number in ('NaN', 'Infinity', '-Infinity', '1e999', '-1e999'):
            with self.subTest(number=number), tempfile.TemporaryDirectory() as tmp:
                p = Path(tmp) / 'bad.json'
                p.write_text('{"number":' + number + '}', encoding='utf-8')
                with self.assertRaises(DataError):
                    load_json(p)

    def test_finite_json_floats_load_but_do_not_satisfy_integer_schema(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'finite.json'
            p.write_text('{"values":[1.0,1.5,1e-300,-2.5]}', encoding='utf-8')
            values = load_json(p)['values']
        self.assertEqual(values, [1.0, 1.5, 1e-300, -2.5])
        for value in values:
            with self.subTest(value=value):
                self.assertIs(type(value), float)
                with self.assertRaises(DataError):
                    shape(value, {'type': 'integer'})

    def test_source_structure_preserves_siblings_and_sections(self):
        lines = {
            1: '### Example', 2: '  * 条件', 3: '    * parent', 4: '      * child',
            5: '    * sibling', 6: '  * 結果', 7: '    * result',
            8: 'annotation', 9: '', 10: '  * external reference',
        }
        got = source_structure(lines, 1, 10)
        self.assertEqual([(n, d, p, r) for n, _, d, p, r in got], [
            (2, 0, None, 'condition-label'), (3, 1, 2, 'condition'),
            (4, 2, 3, 'condition'), (5, 1, 2, 'condition'),
            (6, 0, None, 'result-label'), (7, 1, 6, 'result'),
            (8, 0, None, 'annotation'), (10, 0, None, 'reference'),
        ])
        for line, sha, *_ in got:
            self.assertEqual(sha, hashlib.sha256(lines[line].encode()).hexdigest())

    def test_reject_invalid_source_indentation(self):
        for text in ('* no indent', ' * one space', '   * three spaces'):
            with self.subTest(text=text), self.assertRaises(DataError):
                source_structure({1: '### Heading', 2: text}, 1, 2)

    def test_checker_imports_only_standard_library(self):
        tree = ast.parse((ROOT / 'scripts/check_ps2_events.py').read_text(encoding='utf-8'))
        imports = {n.module.split('.')[0] for n in ast.walk(tree) if isinstance(n, ast.ImportFrom)}
        imports |= {a.name.split('.')[0] for n in ast.walk(tree) if isinstance(n, ast.Import) for a in n.names}
        self.assertLessEqual(imports, {'__future__', 'argparse', 'hashlib', 'json', 'math', 're', 'collections', 'pathlib'})


class FileBoundaryTests(unittest.TestCase):
    def fixture(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        for name in ('ps2-scenario-events', 'scenario-events', 'generic-events'):
            shutil.copytree(ROOT / 'data' / name, root / 'data' / name)
        (root / 'apps/text').mkdir(parents=True)
        (root / 'packages/engine/src').mkdir(parents=True)
        return root

    def test_all_twelve_old_files_have_unchanged_names_and_bytes(self):
        actual = {}
        for folder in ('data/scenario-events', 'data/generic-events'):
            for p in (ROOT / folder).iterdir():
                self.assertTrue(p.is_file())
                self.assertFalse(p.is_symlink())
                actual[str(p.relative_to(ROOT))] = hashlib.sha256(p.read_bytes()).hexdigest()
        self.assertEqual(actual, PRESERVED_FILES)
        self.assertEqual(len(actual), 12)

    def test_default_check_does_not_require_external_snapshot(self):
        summary = check_files()
        self.assertEqual(summary['verifiedSnapshots'], 0)
        self.assertIs(summary['executionEnabled'], False)

    def test_reject_modified_old_file_bytes(self):
        root = self.fixture()
        path = root / 'data/scenario-events/README.md'
        path.write_bytes(path.read_bytes() + b'\n')
        with self.assertRaises(DataError):
            check_files(root=root)

    def test_reject_missing_old_file(self):
        root = self.fixture()
        (root / 'data/generic-events/README.md').unlink()
        with self.assertRaises(DataError):
            check_files(root=root)

    def test_reject_extra_old_file(self):
        root = self.fixture()
        (root / 'data/generic-events/copied.json').write_text('{}', encoding='utf-8')
        with self.assertRaises(DataError):
            check_files(root=root)

    def test_reject_old_directory_replaced_by_file(self):
        root = self.fixture()
        folder = root / 'data/generic-events'
        shutil.rmtree(folder)
        folder.write_text('{}', encoding='utf-8')
        with self.assertRaises((DataError, OSError)):
            check_files(root=root)

    def test_reject_extra_directory_in_old_corpus(self):
        root = self.fixture()
        (root / 'data/scenario-events/extra').mkdir()
        with self.assertRaises(DataError):
            check_files(root=root)

    def test_reject_symlink_even_when_bytes_match(self):
        root = self.fixture()
        path = root / 'data/scenario-events/README.md'
        path.unlink()
        path.symlink_to(ROOT / 'data/scenario-events/README.md')
        with self.assertRaises(DataError):
            check_files(root=root)

    def test_reject_missing_new_dataset_or_inventory(self):
        for name in ('atwiki-100.json', 'inventory.json', 'schema.json', 'inventory-schema.json'):
            with self.subTest(name=name):
                root = self.fixture()
                (root / 'data/ps2-scenario-events' / name).unlink()
                with self.assertRaises((DataError, OSError)):
                    check_files(root=root)

    def test_reject_runtime_dependency_in_apps_and_engine(self):
        for path in ('apps/text/injected.mjs', 'packages/engine/src/injected.ts'):
            with self.subTest(path=path):
                root = self.fixture()
                (root / path).write_text("import data from '../../../data/ps2-scenario-events/atwiki-100.json';\n", encoding='utf-8')
                with self.assertRaises(DataError):
                    check_files(root=root)

    def test_explicit_missing_snapshot_directory_is_not_ignored(self):
        with tempfile.TemporaryDirectory() as tmp, self.assertRaises((DataError, OSError)):
            check_files(snapshots=Path(tmp) / 'missing')

    def test_explicit_missing_snapshot_file_is_not_ignored(self):
        with tempfile.TemporaryDirectory() as tmp, self.assertRaises((DataError, OSError)):
            check_files(snapshots=Path(tmp))

    def test_explicit_corrupt_snapshot_is_not_ignored(self):
        for content in (b'corrupt', b'', b'L116: # forged\nL116: duplicate\n', b'\xff'):
            with self.subTest(content=content), tempfile.TemporaryDirectory() as tmp:
                (Path(tmp) / SNAPSHOT_NAME).write_bytes(content)
                with self.assertRaises(DataError):
                    check_files(snapshots=Path(tmp))

    def test_external_review_snapshot_when_available(self):
        folder = ROOT.parent / 'sources'
        if not (folder / SNAPSHOT_NAME).is_file():
            self.skipTest('external review snapshot is optional; no source verification claimed')
        self.assertEqual(check_files(snapshots=folder)['verifiedSnapshots'], 1)


if __name__ == '__main__':
    unittest.main()
