"""P0-55 contiguous textual-byte/provenance/opcode checks without EXE execution."""
import hashlib
import json
from pathlib import Path
import struct
import unittest
from check_facility_mission_cancellation_evidence import read_range

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'docs/sources/special-mission-cancellation.json'


def load_evidence():
    e=json.loads(MANIFEST.read_text());raw={};prior={}
    for ref in e['priorEvidence']:
        path=ROOT/ref['path'];assert hashlib.sha256(path.read_bytes()).hexdigest()==ref['sha256']
        prior[ref['id']]=(path.with_suffix(''),json.loads(path.read_text()))
    for ref in e['referencedRanges']:
        directory,data=prior[ref['evidence']]
        row=next(r for r in data.get('ranges',data.get('newRanges',[]))
                 if (r['source'],r['start'])==(ref['source'],ref['start']))
        assert all(row[k]==ref[k] for k in ('source','start','endExclusive','sha256'))
        key=ref['source'],ref['start'];assert key not in raw;raw[key]=read_range(directory,row)
    for c in e['containers']:
        path=MANIFEST.with_suffix('')/c['file']
        assert hashlib.sha256(path.read_bytes()).hexdigest()==c['sha256']
        assert len(path.read_text().splitlines())==c['lineCount']
    for row in e['newRanges']:
        key=row['source'],row['start'];assert key not in raw
        raw[key]=read_range(MANIFEST.with_suffix(''),row)
    for row in e['comparisons']:
        assert row['identical']==(raw['S1',row['start']]==raw['S2',row['start']])
        for source in ('S1','S2'):
            assert hashlib.sha256(raw[source,row['start']]).hexdigest()==row[source+'sha256']
    return e,raw


class SpecialEvidence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.e,cls.raw=load_evidence()
    def at(self,source,fn,address,hexbytes):
        expected=bytes.fromhex(hexbytes);off=address-int(fn,16)
        self.assertEqual(self.raw[source,fn][off:off+len(expected)],expected)
    def call_at(self,source,fn,address,target,opcode=0xe8):
        off=address-int(fn,16);raw=self.raw[source,fn]
        self.assertEqual(raw[off],opcode)
        self.assertEqual(address+5+struct.unpack_from('<i',raw,off+1)[0],target)

    def test_fingerprints_and_provenance_boundaries(self):
        self.assertEqual(len(self.e['newRanges']),10);self.assertEqual(len(self.e['referencedRanges']),47)
        self.assertEqual(len(self.e['comparisons']),28);self.assertEqual(len(self.e['containers']),2)
        self.assertEqual([r['start'] for r in self.e['comparisons'] if not r['identical']],['004A5600'])
        for flag in ('stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified'):
            self.assertFalse(self.e[flag])
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        self.assertEqual(self.e['adoption']['PC-PK1.1'],'compatibility-reconstruction')
        self.assertEqual(self.e['adoption']['PC-Vanilla-assumed'],'compatibility-assumption')
        self.assertEqual(self.e['baselineCommit'],'8dd3a566b3d4627657ab2cbe9c50ccb3c9c84fdb')

    def test_model_and_manifest_contract(self):
        import special_mission_cancellation_profile as m
        self.assertEqual(self.e['profileId'],m.PROFILE_ID)
        self.assertEqual(self.e['contracts']['missions'],list(m.HANDLERS))
        self.assertFalse(self.e['contracts']['actualLocationValidityGate'])
        self.assertEqual({int(k):v for k,v in self.e['contracts']['presentation']['vtableSlots'].items()},m.PRESENTATION_SLOTS)

    def test_ordered_full_handler_gate_and_conditional_virtual(self):
        for source in ('S1','S2'):
            fn='005D9C60';self.assertEqual(len(self.raw[source,fn]),0x93)
            for address,target in ((0x5d9c69,0x47a630),(0x5d9c79,0x4897b0),
                    (0x5d9c84,0x490d00),(0x5d9c8a,0x47a630),(0x5d9ca2,0x4897b0),
                    (0x5d9cad,0x490f50),(0x5d9cb5,0x47a630),(0x5d9cc8,0x5b81d0),(0x5d9ce0,0x5b8400)):
                self.call_at(source,fn,address,target)
            self.at(source,fn,0x5d9c75,'6a 01 8b ce')
            self.at(source,fn,0x5d9c9e,'6a 00 8b ce')
            self.at(source,fn,0x5d9cd0,'85 c0 74 09 8b 03 57 56 8b cb ff 50 18')
            self.at(source,fn,0x5d9cdd,'6a 00 56')
            self.at(source,fn,0x5d9cea,'b8 01 00 00 00 5b c2 08 00')
            # The complete accepted gate contains no actual-location (+9c)
            # normalization or extra current/home-building validity read.
            self.assertNotIn(bytes.fromhex('9c 00 00 00'),self.raw[source,fn])
            self.assertEqual(self.raw[source,fn],self.raw['S1',fn])

    def test_getters_exact_domains_and_stride(self):
        expected='8b 44 24 04 85 c0 7c 12 83 f8 61 7f 0d 6b c0 6c 8d 84 08 d8 6d 08 00 c2 04 00 33 c0 c2 04 00'
        for source in ('S1','S2'):
            self.assertEqual(self.raw[source,'00490F50'],bytes.fromhex(expected))
            self.at(source,'00490D00',0x490d00,'8b 44 24 04 85 c0 7c 14 3d ff 3f 00 00 7f 0d')
            self.at(source,'004897B0',0x4897bd,'8b 84 81 40 01 00 00')

    def test_constructor_cancel_and_new_presentation_slots(self):
        for source in ('S1','S2'):
            for fn,table,cancel_slot,presentation_slot in (
                    ('005D9070',0x84cde8,'0084CDF4','0084CE00'),
                    ('005D9F90',0x84ce48,'0084CE54','0084CE60'),
                    ('005DA8B0',0x84ce64,'0084CE70','0084CE7C')):
                self.assertIn(bytes.fromhex('c7 06')+struct.pack('<I',table),self.raw[source,fn])
                self.assertEqual(struct.unpack_from('<I',self.raw[source,cancel_slot])[0],0x5d9c60)
                self.assertEqual(struct.unpack('<I',self.raw[source,presentation_slot])[0],0x5da320)
                self.assertEqual(int(presentation_slot,16)-table,0x18)

    def test_notification_home_read_without_validation_and_message(self):
        for source in ('S1','S2'):
            fn='005DA320';self.assertEqual(len(self.raw[source,fn]),0xd0)
            self.at(source,fn,0x5da351,'8b 4d 0c 51')
            self.call_at(source,fn,0x5da35d,0x4905b0)
            self.at(source,fn,0x5da365,'68 b0 20 00 00')
            self.at(source,fn,0x5da373,'8b 5d 08')
            self.at(source,fn,0x5da3b4,'8b 9b 98 00 00 00 83 c4 04 6a 00 50 53')
            self.call_at(source,fn,0x5da3c6,0x490d00)
            self.at(source,fn,0x5da3cb,'50 b9 00 4e c2 09')
            self.call_at(source,fn,0x5da3d1,0x63b180)
            self.at(source,fn,0x5da3ed,'c2 08 00')
            self.assertEqual(self.raw[source,fn],self.raw['S1',fn])

    def test_return_comparison_sentinel_and_store_order(self):
        for source in ('S1','S2'):
            fn='005B8400'
            self.at(source,fn,0x5b8405,'8b 86 9c 00 00 00 85 c0 57 7c 05 83 f8 56 7e 03 83 c8 ff 8b be 98 00 00 00 3b c7 74 53')
            for address,target in ((0x5b8442,0x49e4d0),(0x5b8460,0x4a73a0),(0x5b846c,0x4a5660),
                    (0x5b847b,0x4a5780),(0x5b8488,0x4a5660),(0x5b8495,0x4a5600),(0x5b84da,0x4bf6f0)):
                self.call_at(source,fn,address,target)
            self.at(source,fn,0x5b849e,'85 c0 7e 17')
            self.at(source,fn,0x5b84cf,'6a 01 6a 00 50 56')
        self.call_at('S2','004A5600',0x4a5619,0x90cba0)
        self.assertNotEqual(self.raw['S1','004A5600'],self.raw['S2','004A5600'])

    def test_dispatch_entry_and_observed_presentation_gate(self):
        for source in ('S1','S2'):
            self.call_at(source,'004A57B0',0x4a57b6,0x47a600)
            self.at(source,'004A57B0',0x4a57cc,'83 f8 2b 7f 0b')
            self.at(source,'005B9B40',0x5b9b7b,'ff 50 0c')
            self.at(source,'005B81D0',0x5b81e9,'ff 50 40')
            self.at(source,'005B81D0',0x5b820a,'ff 52 48')
            self.at(source,'005B81D0',0x5b8215,'ff 50 44')
            self.call_at(source,'005B81D0',0x5b821e,0x490ad0)


if __name__=='__main__':unittest.main()
