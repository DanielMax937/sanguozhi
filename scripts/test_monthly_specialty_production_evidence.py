#!/usr/bin/env python3
"""Contract/schema/type/identity negatives; none are executable behavior mutants."""
import copy
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from jsonschema import Draft202012Validator
import check_monthly_specialty_production as api
from oracle_monthly_specialty_production import sample
class ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc=json.loads((api.ROOT/f'docs/sources/{api.NAME}.json').read_text());cls.vi=Draft202012Validator(cls.doc['inputSchema']);cls.vr=Draft202012Validator(cls.doc['resultSchema'])
    def test_offline_source(self):self.assertTrue(api.check_source()['allBoundariesMatchObjdump'])
    def test_immutable_python_receipts(self):
        v=sample(8,80);r=api.calculate_monthly_specialty_production(v)
        with self.assertRaises(TypeError):r['supported']=False
        with self.assertRaises(TypeError):r['observations']['slots'][0]['validityEaxU32']=0
        with self.assertRaises(TypeError):r['capturedReturns'][0]['eaxU32']=0
        with self.assertRaises(TypeError):api.DOCUMENT['evidence']['stockOriginalVerified']=True
        v['slots'][0]['validityEaxU32']=0;v['governorPoliticsEaxU32']=0
        self.assertEqual(r['observations']['slots'][0]['validityEaxU32'],256);self.assertEqual(r['arithmetic']['convertedSigned32'],929)
        projected=api.receipt_to_json(r);projected['quantityRequest']['quantityU32']=0;self.assertEqual(r['quantityRequest']['quantityU32'],929)
    def test_direct_python_builtin_types(self):
        class Int(int):pass
        class Dict(dict):pass
        class List(list):pass
        class Str(str):pass
        candidates=[Dict(sample()),[],None,True]
        for key,val in [('specialtyEaxU32',True),('specialtyEaxU32',1.0),('specialtyEaxU32',Int(1)),('profile',Str(api.PROFILE)),('slots',List(sample()['slots'])),('governorPoliticsEaxU32',False)]:
            v=sample();v[key]=val;candidates.append(v)
        v=sample();v['slots'][0]=Dict(v['slots'][0]);candidates.append(v)
        v=sample();v[Str('extra')]=0;candidates.append(v)
        for v in candidates:self.assertFalse(api.calculate_monthly_specialty_production(v)['supported'])
    def test_json_input_shape_negatives(self):
        values=[]
        for key in ['profile','arithmeticProfile','equipmentType','specialtyEaxU32']:
            v=sample();del v[key];values.append(v)
        for key,val in [('profile','stock'),('arithmeticProfile','decimal'),('equipmentType',0),('equipmentType',5),('specialtyEaxU32',True),('specialtyEaxU32',-1),('specialtyEaxU32',2**32),('specialtyEaxU32',1.5),('specialtyEaxU32','1'),('slots',[]),('governorPoliticsEaxU32',True)]:
            v=sample();v[key]=val;values.append(v)
        values.extend([{**sample(),'extra':0},{**sample(),'specialtyEaxU32':256},{**sample(0),'governorPoliticsEaxU32':0}])
        v=sample();del v['governorPoliticsEaxU32'];values.append(v)
        for slot in [{},{'validityEaxU32':0,'correspondingCompletedEaxU32':0},{'validityEaxU32':1},{'validityEaxU32':True},{'validityEaxU32':1,'correspondingCompletedEaxU32':-1},{'validityEaxU32':0,'extra':1}]:
            v=sample();v['slots'][0]=slot;values.append(v)
        for v in values:
            self.assertFalse(self.vi.is_valid(v),v);r=api.calculate_monthly_specialty_production(v);self.assertFalse(r['supported'],v);self.vr.validate(api.receipt_to_json(r))
        self.assertEqual(len(values),25)
    def test_result_structural_negatives(self):
        baseline=api.receipt_to_json(api.calculate_monthly_specialty_production(sample(8,80)));values=[]
        for key,val in [('path','not-specialty'),('completedFacilityCount',None),('arithmetic',None),('quantityRequest',None),('equipmentType',5)]:
            v=copy.deepcopy(baseline);v[key]=val;values.append(v)
        for key,val in [('callAddress','00590AB3'),('target','0047A630'),('consumedWidthBits',32),('slotIndex',0),('consumedValue',256)]:
            v=copy.deepcopy(baseline);v['capturedReturns'][0][key]=val;values.append(v)
        v=copy.deepcopy(baseline);v['arithmetic']['extra']=1;values.append(v)
        v=copy.deepcopy(baseline);v['evidence']['stockOriginalVerified']=True;values.append(v)
        for v in values:self.assertFalse(self.vr.is_valid(v),v)
        self.assertEqual(len(values),12)
    def test_metadata_and_source_tamper_rejected(self):
        original_root=api.ROOT;manifest=json.loads((original_root/f'docs/sources/{api.NAME}/source-manifest.json').read_text());paths=list(api.METADATA_PINS)+[x['path']for x in manifest['files']]
        with tempfile.TemporaryDirectory(prefix='specialty-negative-materials-')as directory:
            root=Path(directory)
            for p in paths:(root/p).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(original_root/p,root/p)
            api.ROOT=root
            try:
                api.check_source()
                variants=[(f'docs/sources/{api.NAME}.schema.json',lambda b:json.dumps({**json.loads(b),'additionalProperties':True}).encode()),(f'docs/sources/{api.NAME}.json',lambda b:json.dumps({**json.loads(b),'profileId':'native'}).encode()),(f'docs/sources/{api.NAME}/source-manifest.json',lambda b:json.dumps({**json.loads(b),'files':[]}).encode()),('docs/sources/production-time-LICENSE.txt',lambda b:b+b'\n'),(f'docs/sources/{api.NAME}/slice.bin',lambda b:bytes([b[0]^1])+b[1:])]
                for path,change in variants:
                    p=root/path;old=p.read_bytes();p.write_bytes(change(old))
                    with self.assertRaises(AssertionError):api.check_source()
                    p.write_bytes(old)
            finally:api.ROOT=original_root
if __name__=='__main__':unittest.main()
