#!/usr/bin/env python3
"""Discoverable product-specific evidence/byte-oracle regression tests."""
import json
import unittest
from copy import deepcopy
from jsonschema import Draft202012Validator
import check_captive_escape_roll_argument as check
import oracle_captive_escape_roll_argument as oracle


class CaptiveEscapeArgumentEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.profile=json.loads(check.PROFILE_FILE.read_text())
        cls.schema=json.loads(check.SCHEMA_FILE.read_text())
        cls.utf8=oracle.SOURCE.read_bytes();cls.gbk=oracle.GBK_FILE.read_bytes()
        cls.listing=oracle.load_listing()

    def test_fixed_source_schema_and_static_disassembly(self):
        check.check(self.profile,self.schema,self.utf8,self.gbk)
        result=oracle.independently_disassemble(self.listing)
        self.assertEqual((result['callerInstructions'],result['callerBytes']),(266,902))
        self.assertEqual((result['arithmeticInstructions'],result['arithmeticBytes']),(26,77))
        self.assertEqual(result['typoDecodedFromBytes'],'SAR EDX,4')

    def test_source_schema_and_material_mutation_guards(self):
        result=check.mutation_checks(self.profile,self.schema,self.utf8,self.gbk)
        self.assertTrue(result['allRejected'])
        self.assertEqual(result['individualArgumentByteMutations'],77)
        self.assertEqual(result['individualInstructionMutations'],266)
        self.assertGreater(result['standardsSchemaNegativeCases'],100)

    def test_input_schema_and_actual_typescript_rejections(self):
        result=check.input_schema_checks(self.profile)
        self.assertEqual(result['validJsonShapes'],768)
        self.assertEqual(result['actualTypeScriptRejections'],result['invalidJsonShapes'])

    def test_factorized_byte_domain_and_actual_public_api(self):
        pairs,suffixes,coverage=oracle.verify_factorization(self.listing)
        result=oracle.compare_api(self.listing,pairs,suffixes)
        self.assertEqual(coverage['attributeBytePairs'],65536)
        self.assertEqual(coverage['maximumByteLateMonthSuffixes'],65536)
        self.assertFalse(coverage['everyScalarTupleExecutedAsFullByteSegment'])
        self.assertEqual(result['actualPublicTypeScriptComparisons'],131128)

    def test_false_claims_are_typed_closed_constants(self):
        validator=Draft202012Validator(self.schema)
        for key in check.FALSE_EVIDENCE:
            for value in (True,0,'false',None):
                forged=deepcopy(self.profile);forged['evidence'][key]=value
                self.assertFalse(validator.is_valid(forged),(key,value))
        forged=deepcopy(self.profile);forged['evidence']['extra']=False
        self.assertFalse(validator.is_valid(forged))

    def test_cli_coverage_output_and_malformed_argument_rejection(self):
        result=check.check_cli()
        self.assertTrue(result['outputFileMatchesStdout'])
        self.assertEqual(result['malformedArgumentCasesRejected'],5)


if __name__=='__main__':unittest.main()
