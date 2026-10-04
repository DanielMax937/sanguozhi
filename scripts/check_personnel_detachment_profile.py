"""P0-51 bounded wandering and detachment: bytes, branches, effects and replay."""
import copy
import hashlib
import json
from pathlib import Path
import unittest
from unittest.mock import patch
import personnel_detachment_profile as m
import capture_relocation_profile as relocation
from check_capture_relocation_profile import fixture as prior_fixture, by_id, read_bytes
import capture_selector_profile as common

ROOT=Path(__file__).resolve().parents[1]


def read_source_range(r):
    path=ROOT/'docs/sources/personnel-detachment-source-profile'/r['file']
    if 'lineStart' not in r:return read_bytes(path)
    lines=path.read_text().splitlines()[r['lineStart']-1:r['lineStart']-1+r['lineCount']]
    result=bytearray();start=end=None
    for line in lines:
        parts=line.split();address=int(parts[0],16);raw=[]
        for token in parts[1:]:
            if len(token)!=2 or any(c not in '0123456789abcdefABCDEF' for c in token):break
            raw.append(int(token,16))
        assert raw
        if start is None:start=address
        if end is not None:assert end==address
        result.extend(raw);end=address+len(raw)
    return start,end,bytes(result)


def fixture():
    state,_,_,_,person=prior_fixture()
    for force in state['forces']:force['advisorId']=-1
    p=by_id(state,20);p.update(status=3,legionId=1,homeBaseId=0,locationId=0,formerForceId=-1,captiveMonths=0,officeId=20)
    command={'id':'detach-1','expectedRevision':0,'kind':'detach','personIds':[20],'targetId':None,'releaseFlag':False}
    context={'troops':[],'provenance':'synthetic safe valid base/observed troop geography, not a stock savegame'}
    policy={'id':'test-detach-v1','ruleset':'PC-PK1.1','unknownEffects':'record-only','unsupportedPerson':'defer-person',
            'provenance':'explicitly partial person and role projection, callbacks disabled'}
    return state,command,context,policy


def run(f,**kw):return m.project_detachment(*f,**kw)


class Detachment(unittest.TestCase):
    def test_singleton_neighbor_consumes_no_rng(self):
        f=fixture();before=copy.deepcopy(f);tr=run(f,rolls=[]);p=by_id(tr['after'],20)
        self.assertEqual((p['homeBaseId'],p['locationId'],p['legionId'],p['status'],p['loyalty'],p['officeId']),(1,0,-1,4,0,80))
        self.assertEqual((p['missionId'],p['missionArgs'],p['missionDuration'],p['acted']),(37,[0]*5,1,True))
        self.assertEqual(tr['rng']['calls'],[{'bound':1,'value':0,'consumed':False}]);self.assertEqual(f,before)
        self.assertEqual([e['event'] for e in tr['events']],[2,5,21]);self.assertFalse(tr['evidence']['forceExtinctionImplemented'])

    def test_neighbors_are_id_order_and_do_not_filter_owner(self):
        f=fixture();by_id(f[0],20)['homeBaseId']=1
        tr=run(f,rolls=[2]);selection=tr['steps'][0]['details'][1]
        self.assertEqual(selection['candidates'],[0,2,3]);self.assertEqual(by_id(tr['after'],20)['homeBaseId'],3)
        self.assertEqual(tr['rng']['calls'][0]['bound'],3)

    def test_table_orientation_is_candidate_row_anchor_column(self):
        f=fixture();by_id(f[0],20)['homeBaseId']=2
        seen=[]
        def distance(a,b):seen.append((a,b));return 1 if (a,b)==(7,2) else 9
        with patch.object(relocation,'city_distance',distance):
            selection=m.choose_wandering_home(f[0],20,f[2],relocation.Draws([],None))
        self.assertEqual(selection['candidates'],[7]);self.assertEqual(seen,[(i,2) for i in range(42)])

    def test_no_affiliation_keeps_anchor_without_neighbor_draw(self):
        f=fixture();p=by_id(f[0],20);p.update(legionId=-1,homeBaseId=2)
        tr=run(f,rolls=[]);self.assertEqual(by_id(tr['after'],20)['homeBaseId'],2)
        self.assertEqual(tr['rng']['calls'],[]);self.assertEqual([e['event'] for e in tr['events']],[5])

    def test_selector_numeric_force_gate_differs_from_saved_force_validity(self):
        f=fixture();f[0]['forces'][0]['valid']=False
        tr=run(f,rolls=[]);self.assertEqual(by_id(tr['after'],20)['homeBaseId'],1)
        self.assertEqual([e['event'] for e in tr['events']],[5])

    def test_invalid_home_uses_actual_territory(self):
        f=fixture();by_id(f[0],20).update(homeBaseId=-1,locationId=24)
        tr=run(f,rolls=[]);self.assertEqual(by_id(tr['after'],20)['homeBaseId'],23)

    def test_invalid_anchor_draw_survives_troop_override(self):
        f=fixture();by_id(f[0],20).update(homeBaseId=0,locationId=87,troopMember=True);f[0]['bases'][0]['territorialCityId']=-1
        f[2]['troops']=[{'id':0,'valid':True,'coordinatesValid':True,'territorialCityId':1}]
        tr=run(f,rolls=[40,1]);self.assertEqual([c['bound'] for c in tr['rng']['calls']],[42,3])
        p=by_id(tr['after'],20);self.assertEqual((p['homeBaseId'],p['locationId'],p['troopMember']),(2,1,False))
        self.assertEqual(p['missionDuration'],1)

    def test_troop_encoded_location_branch_does_not_require_member_flag(self):
        f=fixture();by_id(f[0],20).update(locationId=1086,troopMember=False)
        f[2]['troops']=[{'id':999,'valid':True,'coordinatesValid':True,'territorialCityId':24}]
        tr=run(f,rolls=[]);self.assertEqual((by_id(tr['after'],20)['homeBaseId'],by_id(tr['after'],20)['locationId']),(23,24))

    def test_no_neighbors_uses_all_42_city_fallback(self):
        f=fixture();by_id(f[0],20)['locationId']=87
        f[2]['troops']=[{'id':0,'valid':True,'coordinatesValid':True,'territorialCityId':-1}]
        tr=run(f,rolls=[41]);p=by_id(tr['after'],20)
        self.assertEqual((p['homeBaseId'],p['locationId'],p['missionDuration']),(41,-1,255))
        self.assertEqual(tr['rng']['calls'][0]['bound'],42)

    def test_nonaffiliated_invalid_anchor_only_one_random_draw(self):
        f=fixture();p=by_id(f[0],20);p.update(legionId=-1);f[0]['bases'][0]['territorialCityId']=-1
        tr=run(f,rolls=[10]);self.assertEqual(by_id(tr['after'],20)['homeBaseId'],10)
        self.assertEqual(len(tr['rng']['rolls']),1)

    def test_port_and_gate_actual_location_normalize_to_city(self):
        for base in [42,51,52,86]:
            f=fixture();by_id(f[0],20)['locationId']=base;f[0]['bases'][base]['territorialCityId']=24
            tr=run(f,rolls=[]);self.assertEqual(by_id(tr['after'],20)['locationId'],24)
            self.assertEqual(by_id(tr['after'],20)['missionDuration'],relocation.city_distance(24,1))

    def test_old_mission_reset_precedes_set37_without_cancel_refund(self):
        for mission in range(-1,44):
            f=fixture();by_id(f[0],20).update(missionId=mission,missionArgs=[10,987,30,40,50])
            tr=run(f,rolls=[]);details=tr['steps'][0]['details']
            reset=next(d for d in details if d.get('helper')=='004A5780')
            setting=next(d for d in details if d.get('helper')=='004A0CB0/004A7410/004A5660')
            self.assertEqual(reset['oldMissionId'],mission);self.assertFalse(reset['cancellationHandlerCalled']);self.assertFalse(setting['cancellationHandlerCalled'])
            self.assertLess(details.index(reset),details.index(setting))

    def test_advisor_governor_and_legion_leader_order(self):
        f=fixture();p=by_id(f[0],20);p['status']=1;f[0]['bases'][0]['governorId']=20
        f[0]['legions'][0]['leaderId']=20;f[0]['forces'][0]['advisorId']=20
        tr=run(f,rolls=[]);self.assertEqual([e['event'] for e in tr['events']],[2,8,5,21])
        before,e8,e5,_=tr['events'];self.assertEqual(before['personProjectionAtEmission']['status'],1)
        self.assertEqual(e8['personProjectionAtEmission']['status'],4)
        self.assertEqual(e8['roleProjectionAtEmission']['governors'],{'0':20})
        self.assertEqual(e8['roleProjectionAtEmission']['legionLeaders']['1'],20)
        self.assertEqual(e8['roleProjectionAtEmission']['advisors']['1'],-1)
        self.assertEqual(e5['roleProjectionAtEmission']['governors'],{})
        self.assertEqual(e5['roleProjectionAtEmission']['legionLeaders']['1'],-1)
        self.assertEqual(tr['after']['forces'][0]['rulerId'],901);self.assertTrue(tr['after']['forces'][0]['valid'])

    def test_role_clear_uses_old_status_not_new_wander_status(self):
        for status in range(6):
            f=fixture();by_id(f[0],20)['status']=status;f[0]['bases'][0]['governorId']=20;f[0]['legions'][0]['leaderId']=901
            tr=run(f,rolls=[])
            self.assertEqual(tr['after']['bases'][0]['governorId'],-1 if status<=2 else 20)
            # Source has no old leader identity equality check here.
            self.assertEqual(tr['after']['legions'][0]['leaderId'],-1 if status<=1 else 901)

    def test_other_advisor_and_governor_unchanged(self):
        f=fixture();by_id(f[0],20)['status']=0;f[0]['bases'][0]['governorId']=901;f[0]['forces'][0]['advisorId']=901
        tr=run(f,rolls=[]);self.assertEqual(tr['after']['bases'][0]['governorId'],901);self.assertEqual(tr['after']['forces'][0]['advisorId'],901)
        self.assertNotIn(8,[e['event'] for e in tr['events']])

    def test_detach_does_not_invent_captive_or_forbidden_cleanup(self):
        f=fixture();p=by_id(f[0],20);p.update(status=5,formerForceId=3,captiveMonths=9,forbiddenLordId=902,forbiddenMonths=6)
        q=by_id(run(f,rolls=[])['after'],20)
        self.assertEqual((q['formerForceId'],q['captiveMonths'],q['forbiddenLordId'],q['forbiddenMonths']),(3,9,902,6))

    def test_invalid_former_release_tail_and_event4(self):
        f=fixture();p=by_id(f[0],20);p.update(status=5,formerForceId=-1,captiveMonths=9,forbiddenLordId=902,forbiddenMonths=7,rawF0=2)
        f[1]['kind']='release-invalid-former-force';tr=run(f,rolls=[])
        self.assertEqual([e['event'] for e in tr['events']],[2,5,21,4])
        e4=tr['events'][-1]['personProjectionAtEmission'];self.assertEqual((e4['formerForceId'],e4['captiveMonths'],e4['forbiddenMonths']),(-1,0,3))
        q=by_id(tr['after'],20);self.assertEqual((q['forbiddenLordId'],q['forbiddenMonths']),(901,3))
        self.assertEqual(tr['events'][0]['personProjectionAtEmission']['forbiddenLordId'],902)

    def test_invalid_former_without_home_force_keeps_adjustment(self):
        for raw,months,expected in [(0,7,0),(1,7,0),(2,7,3),(2,1,1),(3,7,7),(-1,7,7)]:
            f=fixture();p=by_id(f[0],20);p.update(status=5,formerForceId=-1,homeBaseId=24,forbiddenLordId=902,forbiddenMonths=months,rawF0=raw)
            f[1]['kind']='release-invalid-former-force';q=by_id(run(f,rolls=[])['after'],20);self.assertEqual(q['forbiddenMonths'],expected)

    def test_last_city_caller_uses_detach_before_old_destination_shortcut(self):
        f=fixture();f[0]['bases'][1]['legionId']=-1;by_id(f[0],20)['homeBaseId']=24
        f[1].update(kind='last-city-escape',targetId=0,releaseFlag=True)
        tr=run(f,rolls=[]);self.assertEqual(by_id(tr['after'],20)['homeBaseId'],23)
        self.assertEqual(tr['steps'][0]['details'][0]['helper'],'004A9120')
        f[0]['bases'][1]['legionId']=1
        with self.assertRaises(ValueError):run(f,rolls=[])

    def test_unsupported_person_preflight_and_atomic_rejection(self):
        f=fixture();f[1]['personIds']=[20,10];by_id(f[0],10)['locationId']=-1
        f[3]['unsupportedPerson']='reject';tr=run(f,rolls=[])
        self.assertFalse(tr['accepted']);self.assertEqual(tr['after'],f[0]);self.assertEqual(tr['rng']['calls'],[])
        f[3]['unsupportedPerson']='defer-person';tr=run(f,rolls=[])
        self.assertEqual(tr['deferredIds'],[10]);self.assertEqual(by_id(tr['after'],10),by_id(f[0],10));self.assertEqual(by_id(tr['after'],20)['status'],4)

    def test_unsafe_troop_coordinates_defer(self):
        f=fixture();by_id(f[0],20)['locationId']=87
        for troops in [[],[{'id':0,'valid':False,'coordinatesValid':True,'territorialCityId':1}],
                       [{'id':0,'valid':True,'coordinatesValid':False,'territorialCityId':-1}]]:
            f[2]['troops']=troops;self.assertEqual(run(f,rolls=[])['deferredIds'],[20])

    def test_unknown_effect_rejection_and_metadata(self):
        f=fixture();f[3]['unknownEffects']='reject';tr=run(f,rolls=[])
        self.assertFalse(tr['accepted']);self.assertEqual(tr['after'],f[0]);self.assertEqual(tr['rng']['calls'],[])
        f[3]['unknownEffects']='record-only';f[3]['ruleset']='PC-Vanilla-assumed';tr=run(f,rolls=[])
        self.assertEqual(tr['evidence']['runtimeStatus'],'compatibility-assumption');self.assertFalse(tr['evidence']['stockOriginalVerified'])
        self.assertIn('callback non-interference',tr['fallbacks'][0]['reason'])

    def test_replay_seed_json_and_resigned_tampering(self):
        f=fixture();by_id(f[0],20)['homeBaseId']=1
        for seed in [0,1,0x80000000,0xffffffff]:
            tr=run(f,source_rng_state=seed);self.assertEqual(m.replay_detachment(json.loads(json.dumps(tr))),tr)
            expected=(seed*0x6c078965+0x3039)&0xffffffff
            self.assertEqual(tr['rng']['finalState'],expected);self.assertEqual(tr['rng']['rolls'],[(expected>>16)%3])
        tr=run(f,rolls=[1]);bad=copy.deepcopy(tr);bad['after']['persons'][1]['loyalty']=99
        with self.assertRaises(ValueError):m.replay_detachment(bad)
        bad.pop('traceHash');bad['traceHash']=common._digest(bad)
        with self.assertRaises(ValueError):m.replay_detachment(bad)

    def test_late_rng_error_is_atomic(self):
        f=fixture();f[1]['personIds']=[20,10];by_id(f[0],10)['homeBaseId']=1;before=copy.deepcopy(f)
        with self.assertRaises(ValueError):run(f,rolls=[])
        self.assertEqual(f,before)
        with self.assertRaises(ValueError):run(f,rolls=[3])
        self.assertEqual(f,before)

    def test_revision_guards_and_strict_inputs(self):
        for mode in ['duplicate','stale','overflow']:
            f=fixture()
            if mode=='duplicate':f[0]['appliedIds']=['detach-1']
            elif mode=='stale':f[1]['expectedRevision']=1
            else:f[0]['revision']=f[1]['expectedRevision']=2**31-1
            tr=run(f,rolls=[]);self.assertFalse(tr['accepted']);self.assertEqual(tr['after'],f[0])
        mutations=[lambda f:f[0].update(extra=1),lambda f:by_id(f[0],20).update(missionId=True),
                   lambda f:by_id(f[0],20).update(missionArgs=[0]*6),lambda f:f[0]['bases'].pop(),
                   lambda f:f[0]['bases'][0].update(valid=False),lambda f:f[3].update(ruleset='Vanilla'),
                   lambda f:f[1].update(personIds=[20,20]),lambda f:f[2].update(provenance='')]
        for mutate in mutations:
            f=fixture();mutate(f)
            with self.assertRaises(ValueError):run(f,rolls=[])

    def test_all_anchor_city_options_and_replay(self):
        count=0
        for anchor in range(42):
            candidates=[i for i in range(42) if relocation.city_distance(i,anchor)==1]
            for index,expected in enumerate(candidates):
                f=fixture();by_id(f[0],20)['homeBaseId']=anchor
                tr=run(f,rolls=[index] if len(candidates)>1 else [])
                self.assertEqual(by_id(tr['after'],20)['homeBaseId'],expected);self.assertEqual(m.replay_detachment(tr),tr);count+=1
        self.assertEqual(count,146)


class SourceEvidence(unittest.TestCase):
    def test_all_range_bytes_and_same_address_comparisons(self):
        evidence=json.loads((ROOT/'docs/sources/personnel-detachment-source-profile.json').read_text())
        self.assertFalse(evidence['stockOriginalVerified']);self.assertFalse(evidence['originalExeExecuted'])
        ranges={}
        for c in evidence.get('containers',[]):
            path=ROOT/'docs/sources/personnel-detachment-source-profile'/c['file']
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),c['sha256'])
            self.assertEqual(len(path.read_text().splitlines()),c['lineCount'])
        for r in evidence['ranges']:
            start,end,raw=read_source_range(r)
            self.assertEqual(start,int(r['start'],16));self.assertEqual(end,int(r['endExclusive'],16));self.assertEqual(hashlib.sha256(raw).hexdigest(),r['sha256'])
            ranges[(r['source'],r['start'])]=raw
        for c in evidence['comparisons']:
            a=ranges[('S1',c['start'])];b=ranges[('S2',c['start'])]
            self.assertEqual(c['identical'],a==b);self.assertTrue(c['sameAddressWindow'])
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in evidence['sources']))

    def test_decisive_opcode_and_order_anchors(self):
        evidence=json.loads((ROOT/'docs/sources/personnel-detachment-source-profile.json').read_text())
        def raw(addr):
            r=next(r for r in evidence['ranges'] if r['source']=='S1' and r['start']==addr)
            return read_source_range(r)[2]
        self.assertIn(bytes.fromhex('83 f8 01 75 05'),raw('004B94E0'))
        self.assertIn(bytes.fromhex('0f b6 84 08 30 b8 79 00'),raw('0047BC70'))
        body=raw('004BBB00')
        def target_at(offset):
            self.assertEqual(body[offset],0xe8);return 0x4bbb00+offset+5+int.from_bytes(body[offset+1:offset+5],'little',signed=True)
        self.assertEqual(target_at(0xf6),0x4a5780);self.assertEqual(target_at(0x1ad),0x4a7410)
        self.assertIn(bytes.fromhex('6a ff'),raw('004A5780'))
        self.assertIn(bytes.fromhex('c7 41 08 ff ff ff ff'),raw('004813E0'))
        self.assertIn(bytes.fromhex('89 41 0c'),raw('0047E110'))


if __name__=='__main__':unittest.main()
