"""P0-49 independent-boundary, replay and source-byte regression tests."""
import copy
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import re
import struct
import unittest

import capture_personnel_profile as m
import capture_selector_profile as s

ROOT = Path(__file__).resolve().parents[1]


def fixture():
    def person(i, **overrides):
        return dict({'id':i, 'valid':True, 'status':3, 'forceId':1, 'locationId':0,
                     'skillId':-1, 'ability171':80, 'ability172':60, 'horseTreasure':False,
                     'formerForceId':-1, 'officeId':20}, **overrides)
    state = {'revision':0, 'appliedIds':[], 'persons':[person(9),person(2),person(900,forceId=2,locationId=90)]}
    command = {'id':'personnel-1','expectedRevision':0}
    context = {'targetId':0,'targetForceId':1,'sourceForceId':2,'sourceKind':'troop',
               'sourceLocationId':90,'sourcePersonIds':[900],'captorRepresentativeId':900,
               'cities':[{'id':0,'valid':True,'forceId':1},{'id':1,'valid':True,'forceId':1}],
               'difficulty':1,'sourcePlayer':True,'targetPlayer':False,'scenarioOption18':False,
               'inRange':True,'nearbySourceTroops':1,'terrain':0,'modeArgument':0,'extraModifier':False,
               'provenance':'synthetic complete sparse world at 004B3180 after prior prisoner release; range/count observed'}
    policy = {'id':'test-personnel-projection-v1','ruleset':'PC-PK1.1','unknownEffects':'record-only',
              'disposition':'hold-captive-v1','observedCodes':{},'provenance':'explicit fixture policy, not a game save or original AI'}
    return state,command,context,policy,person


def run(f, **kwargs): return m.capture_personnel(*f[:4],**kwargs)


def bytes_at(path):
    out = bytearray(); start = end = None
    for line in path.read_text().splitlines():
        parts=line.split()
        if not parts or not re.fullmatch('[0-9A-F]{8}',parts[0]): continue
        addr=int(parts[0],16);row=[]
        for token in parts[1:]:
            if not re.fullmatch('[0-9a-fA-F]{2}',token):break
            row.append(int(token,16))
        if start is None:start=addr
        if end is not None: assert addr==end
        out.extend(row);end=addr+len(row)
    return start,end,bytes(out)


class Personnel(unittest.TestCase):
    def test_capacity_first_nonzero_bytes(self):
        self.assertEqual(m.city_troop_capacity([0]*6)['troops'],150000)
        for index in range(6):
            for value in [1,127,128,255]:
                v=[0]*6;v[index]=value
                got=m.city_troop_capacity(v)
                self.assertEqual(got['specialtyIndex'],index)
                self.assertEqual(got['troops'],100000)
        self.assertEqual(m.city_troop_capacity([0,128,0,1,255,0])['specialtyIndex'],1)

    def test_capacity_invalid(self):
        for v in [None,[0]*5,[0]*7,[False]*6,[0,0,0,0,0,256],[-1]*6]:
            with self.assertRaises(ValueError):m.city_troop_capacity(v)

    def test_probability_stored_float32_not_decimal_percent(self):
        self.assertEqual(m.SCALE,Fraction(struct.unpack('<f',bytes.fromhex('0ad7233c'))[0]))
        self.assertEqual(m.probability(100,60,1,-1,0,False,False)['probability'],5)
        self.assertEqual(m.probability(0,0,1,-1,0,False,False)['probability'],39)
        self.assertEqual(m.probability(0,0,1,-1,3,False,False)['probability'],59)
        self.assertEqual(m.probability(80,60,0,-1,0,False,False)['probability'],0)

    def test_probability_signed_truncation(self):
        self.assertEqual(m.probability(121,60,1,-1,0,False,False)['quotient'],0)
        self.assertEqual(m.probability(123,60,1,-1,0,False,False)['probability'],0)
        self.assertEqual(m.probability(126,60,1,-1,0,False,False)['probability'],-1)
        self.assertEqual(m.probability(255,60,18,-1,3,False,False)['probability'],-1214)

    def test_probability_guards_order_and_extra(self):
        self.assertEqual(m.probability(80,80,6,29,0,False,False)['probability'],12)
        self.assertEqual(m.probability(80,80,6,-1,0,False,False)['probability'],77)
        self.assertEqual(m.probability(80,80,6,-1,0,False,True)['probability'],38)
        self.assertEqual(m.probability(80,80,6,-1,0,True,True)['probability'],100)
        self.assertEqual(m.probability(255,255,18,-1,3,True,False,True)['probability'],-1084)

    def test_arithmetic_grid_matches_independent_binary_float(self):
        scale=struct.unpack('<f',bytes.fromhex('0ad7233c'))[0]
        checks=0
        for ability in range(256):
            for count in range(19):
                for terrain in (0,3,4,31):
                    for divisor in (1,2):
                        for skill in (-1,29):
                            q=int((120-ability)/3)
                            mult=1 if count==0 else 100*(1 if skill==29 else count)
                            expected=min(100,int(q*mult*(1.5 if terrain in (3,4) else 1)*scale/divisor))
                            got=m.probability(ability,0,count,skill,terrain,False,divisor==2)
                            self.assertEqual(got['probability'],expected)
                            checks+=1
        self.assertEqual(checks,77824)

    def test_full_sparse_collection_is_id_order_not_input_order(self):
        f=fixture();state,_,ctx,_,person=f
        state['persons'] += [person(5,status=5),person(6,status=4),person(7,locationId=1),
                            person(8,forceId=2),person(10,valid=False),person(1099)]
        got=run(f,rolls=[0,99,0])
        self.assertEqual(got['candidateIds'],[2,9,1099])
        self.assertEqual(got['capturedIds'],[2,1099]);self.assertEqual(got['escapedIds'],[9])
        self.assertEqual([r['code'] for r in got['dispositions']],[1,5,1])

    def test_status_boundaries(self):
        for status in range(-1,9):
            f=fixture();f[0]['persons']=f[0]['persons'][1:]
            f[0]['persons'][0]['status']=status
            got=run(f,rolls=[0] if 0<=status<=3 else [])
            self.assertEqual(got['candidateIds'],[2] if 0<=status<=3 else [])

    def test_other_city_gate_before_treasure_skill(self):
        f=fixture();f[2]['cities']=f[2]['cities'][:1]
        f[0]['persons'][0]['horseTreasure']=True;f[0]['persons'][1]['skillId']=32
        got=run(f,rolls=[])
        self.assertEqual(got['capturedIds'],[2,9]);self.assertEqual(got['rng']['rolls'],[])
        self.assertEqual([r['reason'] for r in got['decisions']],['no-other-owned-city']*2)

    def test_gate_harbor_does_not_remove_mother_city(self):
        for target in (42,51,52,86):
            f=fixture();f[2]['targetId']=target
            for p in f[0]['persons'][:2]:p['locationId']=target
            self.assertEqual(run(f,rolls=[99,99])['otherTargetCityIds'],[0,1])

    def test_force_and_option_gates_before_no_city(self):
        for source in (-1,0,41,42,46):
            for target in (-1,0,41,42,46):
                f=fixture();f[2].update(sourceForceId=source,targetForceId=target,cities=[{'id':0,'valid':True,'forceId':target}])
                for p in f[0]['persons'][:2]:p['forceId']=target
                f[0]['persons'][2]['forceId']=source
                got=run(f,rolls=[])
                self.assertEqual(got['capturedIds'],[2,9] if 0<=source<=41 and 0<=target<=41 else [])
        f=fixture();f[2].update(scenarioOption18=True,cities=f[2]['cities'][:1])
        self.assertEqual(run(f,rolls=[])['capturedIds'],[])

    def test_treasure_and_skill_guarantee_escape(self):
        f=fixture();f[0]['persons'][0]['horseTreasure']=True;f[0]['persons'][1]['skillId']=32
        got=run(f,rolls=[])
        self.assertEqual(got['escapedIds'],[2,9])
        self.assertEqual([r['reason'] for r in got['decisions']],['skill32','treasure-type0'])

    def test_empty_building_captor_gate_and_owned_person_arrest(self):
        f=fixture();f[2].update(sourceKind='building',sourceLocationId=2,sourcePersonIds=[],captorRepresentativeId=None)
        self.assertEqual(run(f,rolls=[])['escapedIds'],[2,9])
        p=f[0]['persons'][2];p.update(locationId=2,skillId=19);f[2]['captorRepresentativeId']=900
        self.assertEqual(run(f,rolls=[99,99])['capturedIds'],[2,9])
        p['forceId']=3;f[2]['captorRepresentativeId']=None
        self.assertEqual(run(f,rolls=[])['capturedIds'],[])

    def test_representative_and_source_coherence_before_rng(self):
        for mutate in [lambda f:f[2].update(sourcePersonIds=[]),
                       lambda f:f[2].update(sourceLocationId=86),
                       lambda f:f[0]['persons'][2].update(status=5),
                       lambda f:f[0]['persons'][2].update(forceId=3),
                       lambda f:f[0]['persons'][2].update(locationId=91),
                       lambda f:f[2].update(captorRepresentativeId=None),
                       lambda f:f[2].update(captorRepresentativeId=999)]:
            f=fixture();mutate(f);before=copy.deepcopy(f)
            with self.assertRaises(ValueError):run(f,source_rng_state=1)
            self.assertEqual(f,before)
        f=fixture();f[2].update(sourceKind='building',sourceLocationId=1,sourcePersonIds=[],captorRepresentativeId=None)
        f[0]['persons'][2].update(locationId=1)
        with self.assertRaises(ValueError):run(f,source_rng_state=1)
        f[2]['captorRepresentativeId']=900
        self.assertTrue(run(f,source_rng_state=1)['accepted'])

    def test_troop_location_encoding_boundaries(self):
        for location in (87,1086):
            f=fixture();f[2]['sourceLocationId']=location;f[0]['persons'][2]['locationId']=location
            self.assertTrue(run(f,rolls=[0,99])['accepted'])
        for location in (0,86,1087):
            f=fixture();f[2]['sourceLocationId']=location;f[0]['persons'][2]['locationId']=location
            with self.assertRaises(ValueError):run(f,rolls=[0,99])

    def test_arrest_requires_range_and_reads_all_troop_members(self):
        f=fixture();f[0]['persons'][2]['skillId']=19
        self.assertEqual(run(f,rolls=[99,99])['capturedIds'],[2,9])
        f[2]['inRange']=False
        self.assertEqual(run(f,rolls=[99,99])['capturedIds'],[])

    def test_super_halving_direction_only(self):
        for source_player in (False,True):
            for target_player in (False,True):
                for difficulty in (0,1,2):
                    f=fixture();f[2].update(difficulty=difficulty,sourcePlayer=source_player,targetPlayer=target_player)
                    got=run(f,rolls=[10,10])
                    self.assertEqual(got['decisions'][0]['arithmetic']['difficultyDivisor'],2 if difficulty==2 and source_player and not target_player else 1)

    def test_mode_argument_preserved_without_invented_effect(self):
        a=fixture();b=fixture();b[2]['modeArgument']=1
        x=run(a,rolls=[0,99]);y=run(b,rolls=[0,99])
        self.assertEqual(x['decisions'],y['decisions']);self.assertNotEqual(x['traceHash'],y['traceHash'])

    def test_p100_still_consumes_lcg_and_zero_consumes_none(self):
        f=fixture();f[0]['persons'][2]['skillId']=19
        got=run(f,source_rng_state=1)
        a=(1*0x6c078965+0x3039)&0xffffffff;b=(a*0x6c078965+0x3039)&0xffffffff
        self.assertEqual(got['rng']['rolls'],[(a>>16)%100,(b>>16)%100])
        self.assertEqual(got['rng']['finalState'],b)
        f[0]['persons'][2]['skillId']=-1;f[2]['nearbySourceTroops']=0
        got=run(f,source_rng_state=1)
        self.assertEqual(got['rng']['rolls'],[]);self.assertEqual(got['rng']['finalState'],1)

    def test_strict_roll_less_than_probability(self):
        f=fixture();got=run(f,rolls=[11,12])
        self.assertEqual(got['capturedIds'],[2]);self.assertEqual(got['escapedIds'],[9])

    def test_hold_partial_projection_preserves_input(self):
        f=fixture();before=copy.deepcopy(f)
        got=run(f,rolls=[0,99]);person=next(p for p in got['after']['persons'] if p['id']==2)
        self.assertEqual((person['status'],person['formerForceId'],person['officeId']),(5,1,80))
        self.assertEqual((person['forceId'],person['locationId']),(1,0))
        self.assertEqual(f,before);self.assertEqual(got['after']['revision'],1)
        self.assertTrue(got['fallbacks']);self.assertFalse(got['evidence']['completeGameTransaction'])

    def test_observed_disposition_routes_not_guessed_ai(self):
        for code,route in m.DISPATCH.items():
            f=fixture();f[3].update(disposition='observed-codes',observedCodes={'2':code,'9':code})
            got=run(f,rolls=[0,99]);self.assertEqual(got['dispositions'][0]['route'],route)
            self.assertEqual(got['dispositions'][1]['route'],'escape')
            self.assertEqual(bool(got['dispositions'][0]['writes']),code==1)

    def test_reject_duplicate_stale_and_exhaustion(self):
        for reason in ('duplicate-command','stale-revision','revision-exhausted','unmodelled-effects','disposition-unresolved'):
            f=fixture()
            if reason=='duplicate-command':f[0]['appliedIds']=['personnel-1']
            if reason=='stale-revision':f[1]['expectedRevision']=1
            if reason=='revision-exhausted':f[0]['revision']=f[1]['expectedRevision']=2**31-1
            if reason=='unmodelled-effects':f[3]['unknownEffects']='reject'
            if reason=='disposition-unresolved':f[3]['disposition']='reject'
            got=run(f,source_rng_state=12)
            self.assertFalse(got['accepted']);self.assertEqual(got['reason'],reason)
            self.assertEqual(got['before'],got['after']);self.assertEqual(got['rng']['finalState'],12)
            self.assertEqual(m.replay_capture_personnel(got),got)

    def test_replay_both_modes_json_roundtrip_and_tamper(self):
        for args in ({'rolls':[0,99]},{'source_rng_state':0xffffffff}):
            got=run(fixture(),**args);encoded=json.loads(json.dumps(got))
            self.assertEqual(m.replay_capture_personnel(encoded),got)
            encoded['after']['persons'][0]['status']=8
            with self.assertRaises(ValueError):m.replay_capture_personnel(encoded)
            encoded['traceHash']=s._digest({k:v for k,v in encoded.items() if k!='traceHash'})
            with self.assertRaises(ValueError):m.replay_capture_personnel(encoded)

    def test_version_separation(self):
        f=fixture();f[3]['ruleset']='PC-Vanilla-assumed'
        self.assertEqual(run(f,rolls=[0,99])['evidence']['runtimeStatus'],'compatibility-assumption')
        f[3]['ruleset']='PC-Vanilla'
        with self.assertRaises(ValueError):run(f,rolls=[0,99])

    def test_input_validation_atomic(self):
        mutations=[lambda f:f[0]['persons'].append(copy.deepcopy(f[0]['persons'][0])),
                   lambda f:f[0]['persons'][0].update(valid=1),lambda f:f[0]['persons'][0].update(ability171=256),
                   lambda f:f[2].update(nearbySourceTroops=19),lambda f:f[2].update(sourcePersonIds=[899]),
                   lambda f:f[2]['cities'][0].update(forceId=3),lambda f:f[3].update(observedCodes={'2':1}),
                   lambda f:f[3].update(disposition='observed-codes',observedCodes={'2':1}),
                   lambda f:f[2].update(provenance=''),lambda f:f[2]['cities'].append(copy.deepcopy(f[2]['cities'][0]))]
        for mutate in mutations:
            f=fixture();mutate(f);snapshot=copy.deepcopy(f)
            with self.assertRaises(ValueError):run(f,rolls=[0,99])
            self.assertEqual(f,snapshot)
        for args in ({},{'rolls':[]},{'rolls':[0,99,0]},{'rolls':[True,99]},{'rolls':[0,100]},
                     {'source_rng_state':-1},{'source_rng_state':2**32},{'rolls':[0,99],'source_rng_state':1}):
            with self.assertRaises(ValueError):run(fixture(),**args)


class Evidence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.profile=json.loads((ROOT/'docs/sources/capture-personnel-source-profile.json').read_text())
        cls.corpus=ROOT/'docs/sources/capture-personnel-source-profile'

    def test_all_ranges_byte_exact_and_comparisons_recomputed(self):
        self.assertEqual(len(self.profile['ranges']),142)
        for row in self.profile['ranges']:
            a,b,raw=bytes_at(self.corpus/row['file'])
            self.assertEqual(f'{a:08X}',row['start']);self.assertEqual(f'{b:08X}',row['endExclusive'])
            self.assertEqual(hashlib.sha256(raw).hexdigest(),row['sha256'])
        for row in self.profile['comparisons']:
            a=bytes_at(self.corpus/row['S1file'])[2];b=bytes_at(self.corpus/row['S2file'])[2]
            self.assertEqual(a==b,row['identical'])
            self.assertEqual(sum(x!=y for x,y in zip(a,b)),row['overlapByteDifferences'])
        self.assertEqual(sum(r['identical'] for r in self.profile['comparisons']),61)

    def test_critical_switch_tables_and_scale(self):
        _,_,raw=bytes_at(self.corpus/'S1-004B2C84.data.txt')
        self.assertEqual(struct.unpack('<6I',raw),(0x4b2a67,0x4b2b30,0x4b2b64,0x4b2bda,0x4b2c4c,0x4b2a51))
        _,_,raw=bytes_at(self.corpus/'S1-00488B9C.data.txt')
        self.assertEqual(struct.unpack('<10I',raw),(0x488b8d,0x488b41,0x488b49,0x488b51,0x488b59,0x488b61,0x488b69,0x488b71,0x488b79,0x488b83))
        self.assertEqual(bytes_at(self.corpus/'S1-004C16B8_case26_slot.data.txt')[2],bytes.fromhex('d6114c00'))
        self.assertEqual(bytes_at(self.corpus/'S1-0077AA88.data.txt')[2],bytes.fromhex('0ad7233c'))
        self.assertEqual(struct.unpack('<2I',bytes_at(self.corpus/'S1-0079CC70.data.txt')[2]),(0x47a8a0,0x495600))

    def test_opcode_anchors(self):
        checks={'S1-004B1280.asm.txt':{0x4b1784:'0f8541010000',0x4b178e:'750c',0x4b1884:'e8eb612500',0x4b18ac:'e81f09fcff'},
                'S1-004721D0.asm.txt':{0x4721d6:'7f03',0x4721e0:'69c06589076c',0x472202:'3bd1'},
                'S1-0047B330.asm.txt':{0x47b345:'05f0490200'},
                'S2-0047B330.asm.txt':{0x47b345:'8b413c9090'},
                'S1-004A93B0.asm.txt':{0x4a9720:'6a05',0x4a97c2:'6a50'}}
        for filename,anchors in checks.items():
            start,_,raw=bytes_at(self.corpus/filename)
            for address,hexstr in anchors.items():self.assertEqual(raw[address-start:address-start+len(bytes.fromhex(hexstr))],bytes.fromhex(hexstr))

    def test_source_scope_and_unresolved_contract(self):
        self.assertFalse(self.profile['stockOriginalVerified'])
        self.assertFalse(self.profile['originalExeExecuted'])
        self.assertFalse(self.profile['recordedExeHashesIndependentlyVerified'])
        self.assertIn('血色5.0',self.profile['sources'][0]['recordedInputPath'])
        self.assertIn('血色衣冠6.0',self.profile['sources'][1]['recordedInputPath'])
        self.assertEqual(self.profile['adoption']['PC-Vanilla-assumed'],'compatibility-assumption')
        self.assertGreaterEqual(len(self.profile['unresolved']),8)
        differing={x['start'] for x in self.profile['comparisons'] if not x['identical']}
        self.assertTrue({'004B1280','004721D0','004890F0','0047B330','004C0C30'}.issubset(differing))


if __name__=='__main__': unittest.main()
