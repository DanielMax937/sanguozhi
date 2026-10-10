"""Boundary and counterexample tests for a static caller listing, not runtime rules."""
import copy
import itertools
import json
import unittest
from check_natural_loyalty_candidate_boundary import (
    DATA, ROOT, SNAPSHOT, EvidenceError, check_files, gate_trace, validate_source, validate_summary_text,
)


class NaturalLoyaltyCandidateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(DATA.read_text(encoding='utf-8'))
        cls.text = SNAPSHOT.read_bytes().decode('utf-8')
        cls.rows = validate_source(cls.data, cls.text)

    def trace(self, compatibility=25, duty=2, ambition=2, dislike=0, prisoner=0):
        return gate_trace(self.rows, prisoner, compatibility, duty, ambition, dislike)

    def reject_edit(self, edit):
        data = copy.deepcopy(self.data)
        edit(data)
        with self.assertRaises(EvidenceError):
            validate_source(data, self.text)

    def test_source_and_current_documentation(self):
        self.assertEqual(check_files(), {'originalInstructions': 238, 'gateInstructions': 18,
                         'excludedModSections': 2, 'auditedSummaries': 15, 'runtimeAdded': False})

    def test_strict_25_boundary(self):
        for difference, expected in [(0, False), (24, False), (25, False), (26, True), (75, True), (255, True)]:
            with self.subTest(difference=difference):
                self.assertEqual(self.trace(compatibility=difference)[0], expected)

    def test_dislike_third_clause_admits_at_zero_and_25(self):
        for difference, result in itertools.product([0, 25], [1, 256, 0x80000000, -1]):
            with self.subTest(difference=difference, result=result):
                self.assertTrue(self.trace(compatibility=difference, dislike=result)[0])

    def test_low_duty_high_ambition_at_25(self):
        self.assertTrue(self.trace(duty=1, ambition=3)[0])
        self.assertTrue(self.trace(duty=0, ambition=4)[0])
        self.assertFalse(self.trace(duty=2, ambition=3)[0])
        self.assertFalse(self.trace(duty=1, ambition=2)[0])

    def test_prisoner_skips_all_ordinary_clause_calls(self):
        for result in [1, 256, 0x80000000, -1]:
            self.assertEqual(self.trace(compatibility=0, prisoner=result), (True, ['00488C70']))

    def test_short_circuit_trace(self):
        self.assertEqual(self.trace(compatibility=26)[1], ['00488C70', '00489F80'])
        self.assertEqual(self.trace(duty=1, ambition=3)[1], ['00488C70', '00489F80'])
        self.assertEqual(self.trace()[1], ['00488C70', '00489F80', '004889E0'])
        self.assertEqual(self.trace(dislike=1)[1], ['00488C70', '00489F80', '004889E0'])

    def test_only_al_used_for_compatibility(self):
        for result, expected in [(0x100, False), (0x119, False), (0x11a, True), (-1, True), (-231, False)]:
            self.assertEqual(self.trace(compatibility=result)[0], expected)

    def test_native_signed32_traits(self):
        self.assertTrue(self.trace(duty=-1, ambition=3)[0])
        self.assertTrue(self.trace(duty=0x80000000, ambition=0x7fffffff)[0])
        self.assertFalse(self.trace(duty=0x7fffffff, ambition=0x7fffffff)[0])
        self.assertFalse(self.trace(duty=1, ambition=0x80000000)[0])
        self.assertFalse(self.trace(duty=1, ambition=-1)[0])

    def test_exhaustive_normal_trait_domain(self):
        # Independent declarative OR oracle; callee inputs are observations, not game persons.
        checked = 0
        for prisoner, difference, duty, ambition, dislike in itertools.product(
                [0, 1], range(256), range(5), range(5), [0, 1]):
            expected = bool(prisoner or difference > 25 or (duty <= 1 and ambition >= 3) or dislike)
            self.assertEqual(gate_trace(self.rows, prisoner, difference, duty, ambition, dislike)[0], expected)
            checked += 1
        self.assertEqual(checked, 25600)

    def test_sidecar_inclusive_threshold_rejected(self):
        self.reject_edit(lambda d: d['gate']['ordinaryClauses'][0].update(comparison='unsigned-ge'))

    def test_sidecar_missing_third_clause_rejected(self):
        self.reject_edit(lambda d: d['gate']['ordinaryClauses'].pop())

    def test_sidecar_prisoner_fallthrough_rejected(self):
        self.reject_edit(lambda d: d['gate'].update(prisonerBypass=False))

    def test_sidecar_callee_certification_rejected(self):
        self.reject_edit(lambda d: d['gate']['ordinaryClauses'][2].update(calleeBodyVerified=True))

    def test_sidecar_stock_certification_rejected(self):
        self.reject_edit(lambda d: d['source'].update(cleanStockCertified=True))

    def test_sidecar_runtime_and_closed_debt_rejected(self):
        self.reject_edit(lambda d: d.update(runtimeAdded=True))
        self.reject_edit(lambda d: d.update(retainedOpen=[]))
        # A separate tutorial body exists; neither blanket absence nor caller closure is accurate.
        for debt in ['00489F80 full callee and compatibility-domain semantics',
                     '00489F80 fully verified and integrated into natural loyalty']:
            with self.subTest(debt=debt):
                self.reject_edit(lambda d: d['retainedOpen'].__setitem__(0, debt))

    def test_sidecar_signedness_and_return_width_rejected(self):
        self.reject_edit(lambda d: d['gate']['ordinaryClauses'][0].update(register='EAX'))
        self.reject_edit(lambda d: d['gate']['ordinaryClauses'][1].update(dutyComparison='unsigned-le'))
        self.reject_edit(lambda d: d['gate']['ordinaryClauses'][2].update(register='AL'))

    def test_source_tampering_rejected_even_with_sidecar_hash_replaced(self):
        import hashlib
        text = self.text.replace('0058E6BF - 77 22', '0058E6BF - 73 22')
        self.assertNotEqual(text, self.text)
        data = copy.deepcopy(self.data)
        data['source']['snapshotSha256'] = hashlib.sha256(text.encode()).hexdigest()
        with self.assertRaises(EvidenceError):
            validate_source(data, text)

    def test_modification_opcode_in_original_projection_rejected(self):
        # MOD1 changes push03/call00472150 to push43/call004721D0; no later-address override is allowed.
        self.reject_edit(lambda d: d['gate']['instructions'].append({
            'address': '0058E711', 'bytes': '6a 43', 'instruction': 'push 43'}))
        self.reject_edit(lambda d: d['sectionBoundary'].update(excludedSections=[]))

    def test_changed_branch_destination_rejected(self):
        self.reject_edit(lambda d: d['gate']['instructions'][8].update(bytes='77 21'))

    def test_inclusive_branch_mutant_has_boundary_counterexample(self):
        rows = copy.deepcopy(self.rows)
        next(r for r in rows if r['address'] == '0058E6BF')['bytes'] = '73 22'
        self.assertFalse(gate_trace(self.rows, 0, 25, 2, 2, 0)[0])
        self.assertTrue(gate_trace(rows, 0, 25, 2, 2, 0)[0])

    def test_dislike_zero_sense_mutant_has_counterexamples(self):
        rows = copy.deepcopy(self.rows)
        next(r for r in rows if r['address'] == '0058E6DD')['bytes'] = '0f 85 d6 00 00 00'
        for dislike in [0, 1, 256]:
            self.assertNotEqual(gate_trace(self.rows, 0, 25, 2, 2, dislike)[0],
                                gate_trace(rows, 0, 25, 2, 2, dislike)[0])

    def test_document_threshold_wording_variants_rejected(self):
        path = 'docs/rules/14-evidence-audit-2026-09-29.md'
        original = (ROOT / path).read_text(encoding='utf-8')
        for stale in ['相性差 >=25', '相性与君主差≥25', '相性与君主差≧25']:
            validate_summary_text(path, original)
            with self.assertRaises(EvidenceError):
                validate_summary_text(path, original + '\n' + stale)

    def test_document_unqualified_rng_probability_rejected(self):
        path = 'docs/rules/22-techniques.md'
        original = (ROOT / path).read_text(encoding='utf-8')
        validate_summary_text(path, original)
        with self.assertRaises(EvidenceError):
            validate_summary_text(path, original + '\n人心掌握精确2/3免降')

    def test_document_prisoner_blanket_closure_rejected(self):
        path = 'docs/rules/03-personnel.md'
        original = (ROOT / path).read_text(encoding='utf-8')
        for stale in ['俘虏月度掉忠：不再 open', 'captorLord', 'callee-body-open',
                      '本轮未补齐callee完整体', '完整体未在本轮绑定来源内', '未取得callee完整体',
                      '教程已证明自然忠诚caller同源', '相性核已接入自然忠诚']:
            validate_summary_text(path, original)
            with self.assertRaises(EvidenceError):
                validate_summary_text(path, original + '\n' + stale)

        with self.assertRaises(EvidenceError):
            validate_summary_text(path, original.replace('affinity-distance.md', 'obsolete.md'))

    def test_unknown_sidecar_key_rejected(self):
        self.reject_edit(lambda d: d.update(assumedStock=True))


if __name__ == '__main__':
    unittest.main()
