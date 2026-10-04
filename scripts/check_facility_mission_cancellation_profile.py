"""P0-54 regression: source-bound gates, exact raw stores, ordered effects/replay."""
import copy
import random
import unittest
from unittest.mock import patch
import facility_mission_cancellation_profile as m
from check_mission_cancellation_profile import fixture as basic_fixture


def building(i,typ,construction=0,attachment=0xffff):
    raw=[(i+v*7+3)&255 for v in range(0x38)]
    for offset,width,value in [(0,4,m.BUILDING_VTABLE),(8,4,typ),(0x14,4,construction),(0x22,2,attachment)]:
        raw[offset:offset+width]=list((value%(1<<(width*8))).to_bytes(width,'little'))
    return {'id':i,'pointerReadable':True,'raw':raw}


def fixture(mission=0,source='S1',typ=33):
    basic,cmd,_,policy=basic_fixture(mission,source)
    p=basic['persons'][0]
    people=[dict(copy.deepcopy(p),id=i,forceId=1,missionArgs=[100,501,777,888,999]) for i in (20,10,30,40)]
    people[1]['locationId']=1;people[2]['status']=5
    state=dict(source=source,revision=0,appliedCommands=[],personsComplete=True,persons=people,
               buildings=[building(0,0),building(100,typ,1)],
               cities=[dict(id=1,valid=True,rawCountersA8AC=[0,1,127,128,255])],
               forces=[dict(id=1,valid=True)],
               buildingTypes=[dict(id=typ,valid=True,classB4=4,rawCostCA=7)],
               treasures=[dict(id=42,valid=True,ownerId=-1,cityId=12,state=2)])
    cmd.update(personId=20,id='facility-cancel-1',expectedRevision=0)
    obs=dict(provenance='synthetic helper observations; no original savegame',
             perPerson=[dict(id=i,returnDistance=2,s2Skill267=False if source=='S2' else None) for i in (10,20,30,40)],
             perBuilding=[dict(id=100,forceId=1,territorialCityId=1)])
    policy.update(id='record-facility-cancellation-v1',callbackAssumption='noninterference-v1',baseTargets='defer')
    return [state,cmd,obs,policy]


def run(f):return m.project_facility_cancellation(*f)
def person(state,i):return next(p for p in state['persons'] if p['id']==i)
def target(state):return state['buildings'][1]
def steps(t,helper):return [s for s in t['steps'] if s['helper']==helper]
def effects(t,helper):return [s for s in t['unknownEffects'] if s['helper']==helper]


class Facilities(unittest.TestCase):
    def test_four_source_mission_paths(self):
        for source in ('S1','S2'):
            for mission in (0,38):
                f=fixture(mission,source);before=copy.deepcopy(f);t=run(f)
                self.assertTrue(t['accepted']);self.assertEqual(t['reason'],'facility-cancellation-projected')
                selected=[10,20,30] if mission==0 else [20]
                self.assertEqual([s['personId'] for s in steps(t,'005B8400')],selected)
                for i in selected:self.assertIn(person(t['after'],i)['missionId'],(-1,37))
                for p in f[0]['persons']:
                    if p['id'] not in selected:self.assertEqual(p,person(t['after'],p['id']))
                self.assertEqual(t['after']['cities'][0]['rawCountersA8AC'],[255,1,127,128,255])
                self.assertEqual(t['after']['forces'],f[0]['forces']);self.assertEqual(t['after']['treasures'],f[0]['treasures'])
                self.assertEqual(target(t['after'])['raw'],m.reset_raw_building(target(f[0])['raw']))
                self.assertFalse(m.building_valid(target(t['after'])));self.assertEqual(f,before)
                self.assertEqual(m.replay_facility_cancellation(t),t)

    def test_group_key_slot_one_first_three_actor_can_be_absent(self):
        f=fixture();f[1]['personId']=40;person(f[0],10)['missionArgs'][0]=-1;person(f[0],20)['forceId']=45
        t=run(f);self.assertEqual(steps(t,'005B8250')[0]['personIds'],[10,20,30])
        self.assertEqual(person(t['after'],40),person(f[0],40))
        self.assertEqual(steps(t,'005B8250')[0]['argumentIndex'],1)
        retry=m.project_facility_cancellation(t['after'],dict(f[1],id='new-cancel',expectedRevision=1),*f[2:])
        self.assertEqual(retry['reason'],'invalid-target-no-op');self.assertEqual(person(retry['after'],40)['missionId'],0)
        f=fixture();person(f[0],10)['missionArgs'][1]=502;person(f[0],30)['valid']=False
        self.assertEqual(steps(run(f),'005B8250')[0]['personIds'],[20,40])

    def test_gate_order_and_short_circuit(self):
        for mission in (0,38):
            for what in ('unallocated','invalid','troop','current-invalid','current-port'):
                f=fixture(mission);p=person(f[0],20);f[2]['perPerson']=[];f[0]['buildingTypes']=[]
                if what=='unallocated':p.update(allocated=False,valid=False);f[0]['buildings']=[]
                elif what=='invalid':p['valid']=False;f[0]['buildings']=[]
                elif what=='troop':p['locationId']=87;f[0]['buildings']=[]
                elif what=='current-invalid':f[0]['buildings'][0]['pointerReadable']=False
                else:f[0]['buildings'][0]=building(0,1)
                t=run(f);self.assertTrue(t['accepted']);self.assertEqual(t['unknownEffects'],[])
                self.assertEqual(t['after']['persons'],f[0]['persons']);self.assertNotIn('005B8250',[s['helper'] for s in t['steps']])
                self.assertIn(t['reason'],('entry-gate-no-op','command-gate-no-op'))

    def test_invalid_target_returns_one_without_cancelling_group(self):
        for mission in (0,38):
            for value in (-2**31,-1,16384,2**31-1,100):
                f=fixture(mission);person(f[0],20)['missionArgs'][0]=value
                target(f[0])['pointerReadable']=False;f[2]['perPerson']=[];f[2]['perBuilding']=[];f[0]['buildingTypes']=[]
                t=run(f);self.assertEqual(t['reason'],'invalid-target-no-op');self.assertEqual(t['unknownEffects'],[])
                self.assertEqual(t['after']['persons'],f[0]['persons']);self.assertEqual(t['after']['buildings'],f[0]['buildings'])
                self.assertEqual(steps(t,m.HANDLERS[mission])[-1]['returnValue'],1)
                if mission==0:
                    names=[s['helper'] for s in t['steps']]
                    self.assertLess(names.index('005B8250'),len(names)-2)

    def test_target_domains_and_missing_slots(self):
        for value in (87,16383):
            f=fixture();person(f[0],20)['missionArgs'][0]=value;target(f[0])['id']=value;f[2]['perBuilding'][0]['id']=value
            self.assertTrue(run(f)['accepted'])
        for row in ('buildings','buildingTypes','cities','forces','treasures'):
            f=fixture(0,typ=30 if row=='treasures' else 33)
            if row=='forces':f[0]['buildingTypes'][0]['classB4']=0
            f[0][row]=[]
            with self.assertRaisesRegex(ValueError,'missing observed'):run(f)
        f=fixture();f[2]['perBuilding']=[]
        with self.assertRaisesRegex(ValueError,'dependencies'):run(f)

    def test_raw_stores_preserve_every_other_byte(self):
        changed={i for off,width,_ in m.RESET_STORES for i in range(off,off+width)}
        for seed in range(32):
            rng=random.Random(seed);raw=[rng.randrange(256) for _ in range(56)]
            expected=raw[:]
            for off,width,val in m.RESET_STORES:
                expected[off:off+width]=list((val%(2**(8*width))).to_bytes(width,'little'))
            self.assertEqual(m.reset_raw_building(raw),expected)
            for i in set(range(56))-changed:self.assertEqual(expected[i],raw[i])
        f=fixture();t=run(f)
        self.assertEqual([(s['offset'],s['width'],s['value']) for s in steps(t,'00486430')],list(m.RESET_STORES))
        for off in (4,5,6,7,0x12,0x13,0x1d,0x22,0x23,0x24,0x25,0x26,0x27,0x30,0x34):
            self.assertEqual(target(t['after'])['raw'][off],target(f[0])['raw'][off])
        self.assertTrue(target(t['after'])['pointerReadable']) # reset invalidates type, not pointer readability

    def test_all_counter_types_construction_and_wrapping(self):
        for source in ('S1','S2'):
            for typ in range(3,64):
                for construction in (0,1,0xffffffff):
                    f=fixture(38,source,typ);target(f[0])['raw'][20:24]=list(construction.to_bytes(4,'little'))
                    f[0]['cities'][0]['rawCountersA8AC']=[0]*5;t=run(f);want=[0]*5
                    if typ in m.COUNTER_INDEX and (construction or (source=='S1' and typ>=54)):
                        want[m.COUNTER_INDEX[typ]]=255
                    self.assertEqual(t['after']['cities'][0]['rawCountersA8AC'],want,(source,typ,construction))
        for source in ('S1','S2'):
            for value in range(256):
                f=fixture(38,source,54)
                f[0]['cities'][0]['rawCountersA8AC'][0]=value
                self.assertEqual(run(f)['after']['cities'][0]['rawCountersA8AC'][0],(value-1)&255)

    def test_domestic_predicate_uses_class_even_invalid_type_definition(self):
        f=fixture();f[0]['buildingTypes'][0]['valid']=False;f[0]['forces']=[]
        self.assertEqual(run(f)['after']['cities'][0]['rawCountersA8AC'][0],255)
        f=fixture();f[0]['cities'][0]['valid']=False
        self.assertEqual(run(f)['after']['cities'],f[0]['cities'])
        f=fixture();f[2]['perBuilding'][0]['territorialCityId']=-1;f[0]['cities']=[]
        self.assertTrue(run(f)['accepted'])

    def test_force_adjustment_request_exact_no_invented_scalar(self):
        for cost in (0,1,255):
            f=fixture(38);f[0]['buildingTypes'][0].update(classB4=0,rawCostCA=cost);f[0]['cities']=[]
            t=run(f);self.assertEqual(effects(t,'004B6580/004B6460')[0]['arguments'],[1,-cost,0])
            self.assertEqual(t['after']['forces'],f[0]['forces'])
        for what in ('force-invalid','type-invalid','force-sentinel'):
            f=fixture(38);f[0]['buildingTypes'][0]['classB4']=0;f[0]['cities']=[]
            if what=='force-invalid':f[0]['forces'][0]['valid']=False
            elif what=='type-invalid':f[0]['buildingTypes'][0]['valid']=False
            else:f[2]['perBuilding'][0]['forceId']=-1;f[0]['forces']=[]
            self.assertEqual(effects(run(f),'004B6580/004B6460'),[])

    def test_treasure42_only_mission0_type30_and_before_destroy(self):
        for source in ('S1','S2'):
            f=fixture(0,source,30);t=run(f);treasure=t['after']['treasures'][0]
            self.assertEqual((treasure['ownerId'],treasure['cityId'],treasure['state']),(-1,-1,0))
            names=[s['helper'] for s in t['steps']]
            self.assertLess(names.index('005B8400'),names.index('00490B30/+40'))
            self.assertLess(names.index('00484E20'),names.index('004B09B0'))
            self.assertEqual(steps(t,'00484DE0')[0]['treasure']['state'],2)
            self.assertEqual(len(steps(t,'008EA230')),source=='S2')
            if source=='S2':self.assertFalse(steps(t,'008EA230')[0]['personRefreshExecuted'])
        for mission,typ in ((38,30),(0,29),(38,33)):
            f=fixture(mission,typ=typ);f[0]['treasures']=[]
            self.assertTrue(run(f)['accepted']);self.assertEqual(steps(run(f),'00490B30/+40'),[])

    def test_treasure_owner_numeric_gate_does_not_query_person_validity(self):
        for owner in (0,42,1099):
            for valid in (False,True):
                f=fixture(0,'S2',30);f[0]['treasures'][0].update(ownerId=owner,valid=valid)
                t=run(f);self.assertEqual(t['after']['treasures'],f[0]['treasures'])
                self.assertEqual(steps(t,'004A0F00/0047A630'),[])
        for owner in (-2**31,-1,1100,2**31-1):
            f=fixture(0,'S2',30);f[0]['treasures'][0]['ownerId']=owner;t=run(f)
            self.assertEqual(t['after']['treasures'][0]['ownerId'],-1)
            self.assertFalse(steps(t,'008EA230')[0]['resolvedPerson'])
        f=fixture(0,typ=30);f[0]['treasures'][0]['valid']=False
        self.assertEqual(run(f)['after']['treasures'],f[0]['treasures'])

    def test_home_reference_uses_allocated_not_valid(self):
        for source in ('S1','S2'):
            f=fixture(38,source);extra=copy.deepcopy(person(f[0],40));extra.update(id=50,homeBaseId=100,valid=False,status=0)
            f[0]['persons'].append(extra);t=run(f)
            self.assertEqual(person(t['after'],50)['homeBaseId'],-1)
            self.assertFalse(person(t['after'],50)['valid'])
            extra['allocated']=False;self.assertEqual(person(run(f)['after'],50)['homeBaseId'],100)

    def test_home_reference_status_force_and_source_exclusion_domains(self):
        base=person(fixture()[0],20)
        for source in ('S1','S2'):
            lo,hi=(700,799) if source=='S1' else (704,753)
            for i in (0,699,700,703,704,753,754,799,800,1099):
                for status in range(-1,9):
                    for force in (-1,0,41,42,45,46):
                        p=dict(base,id=i,status=status,forceId=force)
                        want=[i] if 0<=status<=5 and not lo<=i<=hi and force<42 else []
                        self.assertEqual(m.home_reference_candidates([p],source),want)
        for source,want in [('S1',100),('S2',-1)]:
            f=fixture(38,source);p=dict(copy.deepcopy(base),id=700,homeBaseId=100,forceId=1);f[0]['persons'].append(p)
            self.assertEqual(person(run(f)['after'],700)['homeBaseId'],want)

    def test_returns_precede_home_reference_clearing(self):
        f=fixture();person(f[0],20)['homeBaseId']=100;t=run(f)
        ret=next(s for s in steps(t,'005B8400') if s['personId']==20)
        self.assertEqual(ret['homeBaseId'],100);self.assertEqual(person(t['after'],20)['missionId'],37)
        self.assertEqual(person(t['after'],20)['homeBaseId'],-1)
        names=[s['helper'] for s in t['steps']];self.assertLess(names.index('005B8400'),names.index('004B0C08'))

    def test_precise_unknown_effect_order_and_snapshots(self):
        f=fixture();target(f[0])['raw'][0x22:0x24]=[3,0];t=run(f);u=t['unknownEffects']
        attachment=effects(t,'00588D20')[0];refresh=effects(t,'004B06E0');unlink=effects(t,'004A1E40/004A2370')[0]
        self.assertEqual(len(refresh),2);self.assertLess(attachment['beforeStepIndex'],refresh[0]['beforeStepIndex'])
        self.assertEqual(refresh[0]['beforeStepIndex'],unlink['beforeStepIndex'])
        self.assertEqual(m.building_type(refresh[0]['snapshot']['target']),33)
        self.assertEqual(m.building_type(refresh[1]['snapshot']['target']),-1)
        self.assertEqual(refresh[1]['snapshot']['target']['raw'][0x22:0x24],[3,0])
        self.assertTrue(all(u[i]['beforeStepIndex']<=u[i+1]['beforeStepIndex'] for i in range(len(u)-1)))
        self.assertEqual(steps(t,'scratch[0]!=12')[0]['scratch0'],-1)

    def test_base_targets_explicit_defer_or_atomic_reject(self):
        for typ in (0,1,2):
            f=fixture(38,typ=typ);f[0]['buildingTypes']=[];f[0]['cities']=[];f[2]['perBuilding']=[]
            t=run(f);self.assertEqual(t['reason'],'people-projected-base-destruction-deferred')
            self.assertEqual(t['after']['buildings'],f[0]['buildings']);self.assertEqual(person(t['after'],20)['missionId'],-1)
            self.assertEqual(steps(t,'00486430'),[]);self.assertEqual(steps(t,'004CF270'),[])
            f[3]['baseTargets']='reject';f[2]['perPerson']=[];t=run(f)
            self.assertFalse(t['accepted']);self.assertEqual(t['after'],f[0]);self.assertEqual(t['steps'],[])
            self.assertEqual(m.replay_facility_cancellation(t),t)

    def test_preflight_all_required_observations_before_any_scalar_writer(self):
        for missing in ('distance','skill','treasure','type','dependencies','city','force'):
            f=fixture(0,'S2',30 if missing=='treasure' else 33)
            if missing=='distance':f[2]['perPerson'][0]['returnDistance']=None
            elif missing=='skill':f[2]['perPerson'][2]['s2Skill267']=None
            elif missing=='dependencies':f[2]['perBuilding']=[]
            elif missing=='force':f[0]['buildingTypes'][0]['classB4']=0;f[0]['forces']=[]
            else:f[0][{'treasure':'treasures','type':'buildingTypes','city':'cities'}[missing]]=[]
            before=copy.deepcopy(f)
            with patch.object(m,'_return_zero') as ret,patch.object(m,'_destroy') as destroy,patch.object(m,'_treasure_tail') as treasure:
                with self.assertRaises(ValueError,msg=missing):run(f)
                ret.assert_not_called();destroy.assert_not_called();treasure.assert_not_called()
            self.assertEqual(f,before)

    def test_only_reached_return_observations_required(self):
        f=fixture(38,'S2');f[2]['perPerson']=[dict(id=20,returnDistance=None,s2Skill267=True)];t=run(f)
        self.assertFalse(person(t['after'],20)['acted'])
        f=fixture(0,'S2');f[2]['perPerson']=[r for r in f[2]['perPerson'] if r['id']!=40]
        for r in f[2]['perPerson']:
            if r['id']==10:r['s2Skill267']=None
            else:r['returnDistance']=None
        self.assertTrue(run(f)['accepted'])

    def test_away_distance_low_byte_and_status5_tail(self):
        f=fixture();f[2]['perPerson'][0]['returnDistance']=-1;t=run(f)
        self.assertEqual(person(t['after'],10)['missionDuration'],255)
        self.assertEqual([x['personId'] for x in effects(t,'004BF6F0')],[20])
        self.assertEqual(person(t['after'],10)['locationId'],1)

    def test_unknown_reject_idempotency_and_revision(self):
        f=fixture();f[3]['unknownEffects']='reject';t=run(f)
        self.assertFalse(t['accepted']);self.assertEqual(t['after'],f[0]);self.assertEqual(t['steps'],[])
        self.assertEqual(m.replay_facility_cancellation(t),t)
        f[3]['unknownEffects']='record-only';t=run(f)
        again=m.project_facility_cancellation(t['after'],*f[1:]);self.assertTrue(again['replayed'])
        conflict=m.project_facility_cancellation(t['after'],dict(f[1],personId=10),*f[2:])
        self.assertEqual(conflict['reason'],'replay-payload-conflict')
        stale=m.project_facility_cancellation(t['after'],dict(f[1],id='other'),*f[2:])
        self.assertEqual(stale['reason'],'revision-conflict')
        f[0]['revision']=2**31-1;f[1]['expectedRevision']=2**31-1
        with self.assertRaisesRegex(ValueError,'exhausted'):run(f)

    def test_trace_tampering_even_resigned_is_rejected(self):
        t=run(fixture())
        for name in ('after','steps','unknownEffects','reason','evidence'):
            bad=copy.deepcopy(t)
            if name=='after':target(bad['after'])['raw'][4]^=1
            elif name in ('steps','unknownEffects'):bad[name].reverse()
            elif name=='reason':bad[name]='invented'
            else:bad[name]['stockVerified']=True
            unsigned=copy.deepcopy(bad);unsigned.pop('traceHash');bad['traceHash']=m.core._digest(unsigned)
            with self.assertRaisesRegex(ValueError,'replay mismatch'):m.replay_facility_cancellation(bad)
        bad=copy.deepcopy(t);bad['traceHash']='0'*64
        with self.assertRaisesRegex(ValueError,'hash mismatch'):m.replay_facility_cancellation(bad)

    def test_invalid_shapes_domains_and_duplicate_ids(self):
        cases=[lambda f:f[0].update(personsComplete=False),lambda f:target(f[0])['raw'].pop(),
               lambda f:target(f[0])['raw'].__setitem__(4,True),lambda f:target(f[0])['raw'].__setitem__(0,0),
               lambda f:person(f[0],20).update(homeBaseId=16384),lambda f:f[3].update(callbackAssumption='guessed'),
               lambda f:f[0]['cities'][0]['rawCountersA8AC'].__setitem__(0,-1),
               lambda f:f[2]['perBuilding'][0].update(forceId=47)]
        for key in ('persons','buildings','cities','forces','buildingTypes','treasures'):
            cases.append(lambda f,k=key:f[0][k].append(copy.deepcopy(f[0][k][0])))
        for key in ('perPerson','perBuilding'):
            cases.append(lambda f,k=key:f[2][k].append(copy.deepcopy(f[2][k][0])))
        for mutate in cases:
            f=fixture();mutate(f);before=copy.deepcopy(f)
            with self.assertRaises(ValueError):run(f)
            self.assertEqual(f,before)

    def test_source_ruleset_isolation_unsupported_and_alias(self):
        f=fixture();f[3]['ruleset']='PC-Vanilla-assumed';t=run(f)
        self.assertEqual(t['evidence']['runtimeStatus'],'compatibility-assumption');self.assertFalse(t['evidence']['vanillaVerified'])
        for mission in (2,5,9,37,41):
            f=fixture(mission);t=run(f);self.assertFalse(t['accepted']);self.assertEqual(t['reason'],'unsupported-mission')
        f=fixture();before=copy.deepcopy(f);t=run(f)
        target(t['after'])['raw'][4]=0;t['unknownEffects'][0]['snapshot']['persons'][0]['missionArgs'][0]=-55
        self.assertEqual(f,before)

    def test_deterministic_fuzz_oracle(self):
        rng=random.Random(540038)
        for _ in range(128):
            source=rng.choice(('S1','S2'));mission=rng.choice((0,38));typ=rng.randrange(3,64)
            f=fixture(mission,source,typ);raw=target(f[0])['raw'];before_raw=raw[:]
            val=rng.randrange(256);f[0]['cities'][0]['rawCountersA8AC']=[val]*5
            complete=rng.choice((0,1));raw[20:24]=list(complete.to_bytes(4,'little'));before_raw=raw[:]
            t=run(f);expected=before_raw[:]
            for off,width,value in ((8,4,-1),(12,4,-1),(16,2,0),(20,4,0),(24,4,0),(28,1,0),(30,2,-1),(32,2,-1),(40,4,0),(44,4,0)):
                expected[off:off+width]=list((value%(1<<(8*width))).to_bytes(width,'little'))
            self.assertEqual(target(t['after'])['raw'],expected)
            self.assertEqual(t,m.replay_facility_cancellation(t))


if __name__=='__main__':unittest.main()
