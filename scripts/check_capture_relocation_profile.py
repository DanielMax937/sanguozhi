"""P0-50: byte corpus, ordered prelude, migration, RNG and replay regression."""
import copy
import hashlib
import json
from pathlib import Path
import re
import struct
import unittest
import capture_relocation_profile as m
import capture_selector_profile as common

ROOT=Path(__file__).resolve().parents[1]


def fixture():
    def person(i,**kw):
        return dict({'id':i,'valid':True,'status':3,'legionId':1,'homeBaseId':0,'locationId':0,
                     'formerForceId':-1,'officeId':20,'loyalty':90,'captiveMonths':0,'acted':False,
                     'missionDuration':0,'missionId':-1,'missionArgs':[0]*5,'forbiddenLordId':-1,
                     'forbiddenMonths':0,'rawF0':2,'troopMember':False},**kw)
    bases=[{'id':i,'valid':True,'legionId':-1,'territorialCityId':i if i<42 else 0,'governorId':-1} for i in range(87)]
    for i,legion in [(0,1),(1,1),(2,2),(3,3)]:bases[i]['legionId']=legion
    state={'revision':0,'appliedIds':[],
           'persons':[person(10,status=5,legionId=2,formerForceId=2,officeId=80,captiveMonths=5),
                      person(20,status=5,legionId=3,formerForceId=3,officeId=80,captiveMonths=9,missionId=4),
                      person(901,status=0),person(902,status=0,legionId=2,homeBaseId=2,locationId=2),
                      person(903,status=0,legionId=3,homeBaseId=3,locationId=3)],
           'bases':bases,'legions':[{'id':i,'valid':True,'forceId':i,'ordinal':1,'leaderId':900+i} for i in (1,2,3)],
           'forces':[{'id':i,'valid':True,'rulerId':900+i} for i in (1,2,3)]}
    command={'id':'release-1','expectedRevision':0,'kind':'old-captive-prelude','personIds':[],'releaseFlag':False}
    context={'targetId':0,'sourceLegionId':2,'homeRosterIds':[20,901,10],'regionBaseByPerson':{},
             'provenance':'synthetic complete sparse persons and 87 base slots; explicit observed roster order'}
    policy={'id':'test-partial-release','ruleset':'PC-PK1.1','unknownEffects':'record-only','unresolvedPerson':'defer-person',
            'provenance':'synthetic local projection; callbacks disabled, not source game execution'}
    return state,command,context,policy,person


def run(f,**kw):return m.project_personnel(*f[:4],**kw)


def by_id(state,pid):return next(p for p in state['persons'] if p['id']==pid)


def read_bytes(path):
    result=bytearray();start=end=None
    for line in path.read_text().splitlines():
        parts=line.split()
        if not parts or not re.fullmatch('[0-9A-F]{8}',parts[0]):continue
        addr=int(parts[0],16);raw=[]
        for token in parts[1:]:
            if not re.fullmatch('[0-9A-Fa-f]{2}',token):break
            raw.append(int(token,16))
        if start is None:start=addr
        if end is not None:assert end==addr
        result.extend(raw);end=addr+len(raw)
    return start,end,bytes(result)


class Relocation(unittest.TestCase):
    def test_prelude_linked_roster_order_and_local_writes(self):
        f=fixture();before=copy.deepcopy(f);tr=run(f,rolls=[])
        self.assertEqual(tr['personIds'],[20,10]);self.assertEqual([x['personId'] for x in tr['events']],[20,10])
        a=by_id(tr['after'],10);b=by_id(tr['after'],20)
        self.assertEqual((a['status'],a['legionId'],a['formerForceId'],a['captiveMonths'],a['acted']),(3,2,-1,0,True))
        self.assertEqual((b['homeBaseId'],b['locationId'],b['missionId'],b['missionArgs']),(3,0,37,[0]*5))
        self.assertEqual((b['forbiddenLordId'],b['forbiddenMonths']),(901,3))
        self.assertEqual(b['missionDuration'],m.city_distance(0,3))
        self.assertEqual(f,before);self.assertTrue(tr['accepted']);self.assertFalse(tr['evidence']['completeGameTransaction'])

    def test_release_event_precedes_forbidden_tail(self):
        f=fixture();by_id(f[0],20).update(forbiddenLordId=902,forbiddenMonths=9)
        tr=run(f,rolls=[])
        event=tr['events'][0]
        self.assertEqual(event['personProjectionAtEmission']['forbiddenMonths'],9)
        self.assertEqual(event['personProjectionAtEmission']['forbiddenLordId'],902)
        self.assertEqual(by_id(tr['after'],20)['forbiddenMonths'],3)

    def test_own_affiliation_shortcut_does_not_run_full_release(self):
        f=fixture();p=by_id(f[0],10);p.update(missionId=6,missionArgs=[1,2,3,4,5],missionDuration=9,forbiddenLordId=903,forbiddenMonths=7)
        tr=run(f,rolls=[]);q=by_id(tr['after'],10)
        for field in ('homeBaseId','locationId','officeId','loyalty','missionId','missionArgs','missionDuration','forbiddenLordId','forbiddenMonths'):
            self.assertEqual(q[field],p[field])
        self.assertEqual(tr['rng']['calls'],[])

    def test_prelude_filters_identity_validity_actual_location(self):
        for status in range(-1,9):
            f=fixture();by_id(f[0],20)['status']=status
            self.assertEqual(20 in run(f,rolls=[])['personIds'],status==5)
        for field,val in [('valid',False),('locationId',1)]:
            f=fixture();by_id(f[0],20)[field]=val
            self.assertNotIn(20,run(f,rolls=[])['personIds'])

    def test_former_force_first_ordinal_legion_is_id_order(self):
        f=fixture();f[0]['legions'].insert(0,{'id':4,'valid':True,'forceId':3,'ordinal':1,'leaderId':903})
        self.assertEqual(by_id(run(f,rolls=[])['after'],20)['legionId'],3)
        f[0]['legions'][3]['ordinal']=2
        self.assertEqual(by_id(run(f,rolls=[])['after'],20)['legionId'],4)

    def test_invalid_former_force_defer_and_strict_atomic_rejection(self):
        for mutate in [lambda f:by_id(f[0],20).update(formerForceId=-1),
                       lambda f:f[0]['forces'][2].update(valid=False),
                       lambda f:by_id(f[0],903).update(valid=False),
                       lambda f:f[0]['legions'][2].update(ordinal=2),
                       lambda f:f[0]['bases'][3].update(valid=False)]:
            f=fixture();mutate(f);tr=run(f,rolls=[])
            self.assertEqual(tr['deferredIds'],[20]);self.assertEqual(by_id(tr['after'],20),by_id(f[0],20))
            f[3]['unresolvedPerson']='reject';tr=run(f,rolls=[])
            self.assertFalse(tr['accepted']);self.assertEqual(tr['after'],f[0]);self.assertEqual(tr['rng']['calls'],[])

    def test_no_old_home_force_no_invented_forbidden_tail(self):
        f=fixture();f[0]['bases'][0]['legionId']=-1
        by_id(f[0],20).update(forbiddenLordId=902,forbiddenMonths=8)
        q=by_id(run(f,rolls=[])['after'],20)
        self.assertEqual((q['forbiddenLordId'],q['forbiddenMonths']),(902,8))

    def test_forbidden_adjustment_all_bytes_and_raw_branch_limits(self):
        for months in range(256):
            for raw in (-1,0,1,2,3):
                for valid in (False,True):
                    got=m.forbidden_adjustment(901,months,raw,valid)
                    expected=(901,months)
                    if months and raw in (0,1):expected=(-1,0)
                    if months and raw==2:expected=(901,max(1,months//2)) if valid else (-1,0)
                    self.assertEqual((got['forbiddenLordId'],got['forbiddenMonths']),expected)

    def test_absent_home_roster_preserves_observed_order(self):
        f=fixture();person=f[4]
        f[0]['persons'] += [person(30,locationId=3),person(40,locationId=90,troopMember=True),
                            person(50,locationId=90),person(60,legionId=3,locationId=3),person(70,status=4,locationId=3)]
        f[2]['homeRosterIds']=[50,20,40,901,30,10,60,70]
        m.validate(*f[:4]);self.assertEqual(m.absent_home_roster(f[0],f[2]),[50,30])

    def test_dispatch_rank_is_transformed_and_stable_not_id_tie(self):
        person=fixture()[4];persons=[person(i,status=s) for i,s in enumerate([-1,0,1,2,3,4,5,6,7,8])]
        self.assertEqual(m.dispatcher_order(persons,[1,2,3,4,5,6,7,8,9,0]),[9,8,7,5,6,4,3,2,1,0])
        persons += [person(55,status=3),person(50,status=3)]
        self.assertEqual(m.dispatcher_order(persons,[55,4,50,1]),[55,4,50,1])

    def test_dispatch_sort_all_permutations_and_merge_equivalence(self):
        import itertools
        person=fixture()[4];persons=[person(i,status=s) for i,s in enumerate((3,0,3,5,4))]
        def merge(a):
            if len(a)<2:return a
            n=(len(a)-1)//2+1;l=merge(a[:n]);r=merge(a[n:]);o=[]
            while l and r:o.append(l.pop(0) if m._RANKS[persons[l[0]]['status']]>=m._RANKS[persons[r[0]]['status']] else r.pop(0))
            return o+l+r
        for order in itertools.permutations(range(5)):
            self.assertEqual(m.dispatcher_order(persons,list(order)),merge(list(order)))

    def _choose(self,f,pid=901,release=False,rolls=None,seed=None):
        rng=m.Draws(rolls,seed);answer=m.choose_destination(f[0],pid,f[2]['targetId'],release,rng)
        return answer,rng.finish()

    def test_existing_home_precedes_all_destination_candidates(self):
        f=fixture();by_id(f[0],901)['homeBaseId']=52
        plan,rng=self._choose(f,rolls=[])
        self.assertEqual((plan['destinationId'],plan['reason']),(52,'existing-home'));self.assertEqual(rng['calls'],[])

    def test_release_flag_prefers_different_valid_legion_leader_home(self):
        f=fixture();p=f[4](7);f[0]['persons'].append(p);by_id(f[0],901)['homeBaseId']=52
        yes,_=self._choose(f,7,True,rolls=[]);no,_=self._choose(f,7,False,rolls=[])
        self.assertEqual((yes['destinationId'],yes['reason']),(52,'legion-leader-home'))
        self.assertEqual((no['destinationId'],no['reason']),(1,'legion-cities'))

    def test_legion_city_before_force_city_and_singleton_zero_rng(self):
        f=fixture();f[0]['legions'].append({'id':4,'valid':True,'forceId':1,'ordinal':2,'leaderId':901});f[0]['bases'][2]['legionId']=4
        plan,rng=self._choose(f,seed=17)
        self.assertEqual((plan['destinationId'],plan['reason']),(1,'legion-cities'))
        self.assertEqual(rng['initialState'],rng['finalState']);self.assertEqual(rng['calls'],[{'bound':1,'value':0,'consumed':False}])

    def test_force_city_fallback(self):
        f=fixture();f[0]['legions'].append({'id':4,'valid':True,'forceId':1,'ordinal':2,'leaderId':901});f[0]['bases'][1]['legionId']=4
        plan,rng=self._choose(f,rolls=[])
        self.assertEqual((plan['destinationId'],plan['reason']),(1,'force-cities'))

    def test_ruler_home_and_random_city_final_fallback(self):
        f=fixture();f[0]['bases'][1]['legionId']=-1;f[0]['persons'].append(f[4](7));by_id(f[0],901)['homeBaseId']=52
        plan,rng=self._choose(f,7,rolls=[]);self.assertEqual((plan['destinationId'],plan['reason']),(52,'force-ruler-home'))
        by_id(f[0],901)['homeBaseId']=0
        plan,rng=self._choose(f,7,rolls=[41]);self.assertEqual((plan['destinationId'],plan['reason']),(41,'random-city-fallback'))
        self.assertEqual(rng['calls'][0]['bound'],42)

    def test_ties_id_order_selects_injected_index_and_consumes_lcg(self):
        f=fixture();f[0]['bases'][2].update(legionId=1,territorialCityId=1)
        plan,rng=self._choose(f,rolls=[1]);self.assertEqual(plan['stages'][0]['tiedIds'],[1,2]);self.assertEqual(plan['destinationId'],2)
        plan,rng=self._choose(f,seed=12);expected=(12*0x6c078965+0x3039)&0xffffffff
        self.assertEqual(rng['finalState'],expected);self.assertEqual(plan['destinationId'],[1,2][(expected>>16)%2])

    def test_nearest_uses_table_and_invalid_minus_one_is_not_infinity(self):
        f=fixture();f[0]['bases'][2].update(legionId=1,territorialCityId=-1)
        plan,rng=self._choose(f,rolls=[]);self.assertEqual(plan['destinationId'],2)
        self.assertEqual(plan['stages'][0]['scores'][-1]['distance'],-1)

    def test_harbor_target_keeps_mother_city_candidate(self):
        f=fixture();f[2]['targetId']=42;f[0]['bases'][42]['legionId']=1;by_id(f[0],901)['homeBaseId']=42
        plan,rng=self._choose(f,rolls=[]);self.assertEqual(plan['destinationId'],0)
        self.assertEqual([x['id'] for x in plan['stages'][0]['scores']],[0,1])

    def _escape(self,f,pid=901):
        f[1].update(kind='escape-relocation',personIds=[pid]);return f

    def test_escape_preserves_ruler_legion_and_actual_location(self):
        f=self._escape(fixture());tr=run(f,rolls=[]);p=by_id(tr['after'],901)
        self.assertEqual((p['status'],p['legionId'],p['homeBaseId'],p['locationId']),(0,1,1,0))
        self.assertEqual((p['missionId'],p['acted']),(37,True))
        self.assertEqual(tr['events'],[])

    def test_escape_legion_leader_demoted_and_new_legion_assigned(self):
        f=fixture();by_id(f[0],901)['status']=1
        f[0]['legions'].append({'id':4,'valid':True,'forceId':1,'ordinal':2,'leaderId':902});f[0]['bases'][1]['legionId']=4
        tr=run(self._escape(f),rolls=[]);p=by_id(tr['after'],901)
        self.assertEqual((p['status'],p['legionId'],p['homeBaseId'],p['locationId']),(3,4,1,0))

    def test_escape_old_governor_demoted_even_same_legion(self):
        f=fixture();by_id(f[0],901)['status']=2;f[0]['bases'][0]['governorId']=901
        p=by_id(run(self._escape(f),rolls=[])['after'],901);self.assertEqual(p['status'],3)

    def test_last_city_gate_precedes_existing_home_and_random(self):
        f=fixture();f[0]['bases'][1]['legionId']=-1;by_id(f[0],901)['homeBaseId']=52;f[2]['homeRosterIds']=[20,10]
        tr=run(self._escape(f),source_rng_state=12)
        self.assertEqual(tr['deferredIds'],[901]);self.assertEqual(tr['rng']['calls'],[])
        self.assertEqual(by_id(tr['after'],901),by_id(f[0],901))

    def test_non_base_location_region_required_and_not_written_in_base_escape(self):
        f=fixture();by_id(f[0],901).update(locationId=90,troopMember=True)
        self._escape(f)
        with self.assertRaises(ValueError):run(f,rolls=[])
        f[2]['regionBaseByPerson']={'901':2}
        tr=run(f,rolls=[]);p=by_id(tr['after'],901)
        self.assertEqual(p['locationId'],90);self.assertEqual(p['missionDuration'],m.city_distance(2,1))
        f[2]['regionBaseByPerson']={'901':-1}
        self.assertEqual(by_id(run(f,rolls=[])['after'],901)['missionDuration'],1)

    def test_mission_duration_negative_distance_stores_low_byte(self):
        f=fixture();f[0]['bases'][3]['territorialCityId']=-1
        self.assertEqual(by_id(run(f,rolls=[])['after'],20)['missionDuration'],255)

    def test_invalid_origin_pointer_returns_minus_one_distance(self):
        f=self._escape(fixture());by_id(f[0],901)['locationId']=2
        f[0]['bases'][2].update(valid=False,territorialCityId=2)
        tr=run(f,rolls=[]);p=by_id(tr['after'],901)
        self.assertEqual(p['missionDuration'],255)
        self.assertEqual(tr['steps'][0]['details'][1]['distanceResult'],-1)

    def test_release_flag_does_not_invent_technique_points_or_forbidden(self):
        f=self._escape(fixture());f[1]['releaseFlag']=True
        tr=run(f,rolls=[]);p=by_id(tr['after'],901)
        self.assertEqual((p['forbiddenLordId'],p['forbiddenMonths']),(-1,0))
        self.assertEqual(tr['steps'][0]['details'][0]['helper'],'004A9120')
        self.assertIn('destinationId',tr['steps'][0]['details'][1])

    def test_rng_input_validation_and_bounded_consumption(self):
        for rolls,seed in [(None,None),([],1),([True],None),([42],None)]:
            with self.assertRaises(ValueError):m.Draws(rolls,seed)
        for values in ([],[2],[0,1]):
            r=m.Draws(values,None)
            with self.assertRaises(ValueError):r.take(2);r.finish()
        for bound in (0,43,False):
            with self.assertRaises(ValueError):m.Draws([],None).take(bound)

    def test_duplicate_revision_and_strict_effects_are_atomic(self):
        for reason in ('duplicate-command','stale-revision','revision-exhausted','unmodelled-effects'):
            f=fixture()
            if reason=='duplicate-command':f[0]['appliedIds']=['release-1']
            if reason=='stale-revision':f[1]['expectedRevision']=1
            if reason=='revision-exhausted':f[0]['revision']=f[1]['expectedRevision']=2**31-1
            if reason=='unmodelled-effects':f[3]['unknownEffects']='reject'
            tr=run(f,rolls=[]);self.assertEqual(tr['reason'],reason);self.assertEqual(tr['after'],f[0])
            self.assertEqual(tr['rng']['calls'],[])

    def test_versions_and_replay_accept_reject_and_tamper(self):
        for kind in ('old-captive-prelude','escape-relocation'):
            for version in ('PC-PK1.1','PC-Vanilla-assumed'):
                f=fixture();f[3]['ruleset']=version
                if kind=='escape-relocation':self._escape(f)
                tr=run(f,source_rng_state=11);self.assertEqual(m.replay_personnel(json.loads(json.dumps(tr))),tr)
                self.assertEqual(tr['evidence']['runtimeStatus'],'compatibility-assumption' if version.endswith('assumed') else 'compatibility-reconstruction')
                edited=copy.deepcopy(tr);edited['after']['persons'][0]['loyalty']+=1
                with self.assertRaises(ValueError):m.replay_personnel(edited)
                edited['traceHash']=common._digest({k:v for k,v in edited.items() if k!='traceHash'})
                with self.assertRaises(ValueError):m.replay_personnel(edited)
        f=fixture();f[3]['unknownEffects']='reject';tr=run(f,rolls=[]);self.assertEqual(m.replay_personnel(tr),tr)

    def test_ordered_migration_changes_later_leader_home_and_rng(self):
        for order,expected in [([901,7],[1]),([7,901],[1,0])]:
            f=fixture();f[0]['persons'].append(f[4](7));f[2]['homeRosterIds'].append(7)
            f[0]['bases'][2].update(legionId=1,territorialCityId=1)
            f[1].update(kind='escape-relocation',personIds=order,releaseFlag=True)
            tr=run(f,source_rng_state=11)
            self.assertEqual(tr['rng']['rolls'],expected)
            self.assertEqual(m.replay_personnel(json.loads(json.dumps(tr))),tr)
            if order[0]==901:
                self.assertEqual(tr['steps'][1]['details'][1]['reason'],'legion-leader-home')
            for key in ('rolls','calls','finalState'):
                edited=copy.deepcopy(tr)
                if key=='rolls':edited['rng']['rolls'][0]^=1
                elif key=='calls':edited['rng']['calls'][0]['bound']=3
                else:edited['rng']['finalState']^=1
                edited['traceHash']=common._digest({k:v for k,v in edited.items() if k!='traceHash'})
                with self.assertRaises(ValueError):m.replay_personnel(edited)

    def test_invalid_inputs_never_mutate(self):
        for mutate in [lambda f:f[0]['bases'].pop(),lambda f:f[0]['persons'].append(copy.deepcopy(f[0]['persons'][0])),
                       lambda f:f[2].update(homeRosterIds=[20,10]),lambda f:f[2].update(homeRosterIds=[20,901,10,10]),
                       lambda f:f[3].update(ruleset='PC-Vanilla'),lambda f:by_id(f[0],10).update(acted=1),
                       lambda f:by_id(f[0],10).update(missionArgs=[]),lambda f:f[1].update(personIds=[10]),
                       lambda f:f[2].update(sourceLegionId=44),lambda f:f[2].update(regionBaseByPerson={'999':1})]:
            f=fixture();mutate(f);before=copy.deepcopy(f)
            with self.assertRaises(ValueError):run(f,rolls=[])
            self.assertEqual(f,before)

    def test_full_source_corpus_and_comparisons(self):
        profile=json.loads((ROOT/'docs/sources/capture-relocation-source-profile.json').read_text());out=ROOT/'docs/sources/capture-relocation-source-profile';raw={}
        self.assertFalse(profile['stockOriginalVerified']);self.assertFalse(profile['originalExeExecuted'])
        self.assertEqual(len(profile['ranges']),126);self.assertEqual(len(profile['comparisons']),63)
        for r in profile['ranges']:
            start,end,data=read_bytes(out/r['file']);self.assertEqual((start,end),(int(r['start'],16),int(r['endExclusive'],16)))
            self.assertEqual(hashlib.sha256(data).hexdigest(),r['sha256']);raw[(r['source'],r['start'])]=data
        for c in profile['comparisons']:self.assertEqual(c['identical'],raw[('S1',c['start'])]==raw[('S2',c['start'])])
        self.assertEqual([c['start'] for c in profile['comparisons'] if not c['identical']],['004C8720','004C90E0','00472150','0079B830','004C8E88'])
        self.assertEqual(tuple(struct.unpack('<9i',raw[('S1','008AB728')])),m._RANKS)
        for a in range(42):
            for b in range(42):self.assertEqual(m.city_distance(a,b),raw[('S1','0079B830')][a*42+b])
        self.assertEqual(m.city_distance(-1,0),-1)

    def test_source_dispatch_tables_and_opcode_boundaries(self):
        profile=json.loads((ROOT/'docs/sources/capture-relocation-source-profile.json').read_text());out=ROOT/'docs/sources/capture-relocation-source-profile'
        raw={r['start']:read_bytes(out/r['file'])[2] for r in profile['ranges'] if r['source']=='S1'}
        get_table=raw['004C8FD8'];dest=raw['004C8E88']
        for prop,target in [(4,0x4c885e),(20,0x4c891c),(75,0x4c8d13)]:self.assertEqual(struct.unpack_from('<I',dest,get_table[prop]*4)[0],target)
        self.assertEqual(struct.unpack_from('<I',raw['004C94AC'],raw['004C94D8'][20]*4)[0],0x4c9400)
        self.assertIn(bytes.fromhex('8b34b528b78a00'),raw['004C90E0'])
        self.assertIn(bytes.fromhex('b801000000'),raw['006599E0']) # equal comparator returns true
        self.assertIn(bytes.fromhex('85c0740a'),raw['0047BAA0']) # left item selected on true
        self.assertIn(bytes.fromhex('6a2ae8110ffc'),raw['004B0F50'])
        self.assertIn(bytes.fromhex('888158010000'),raw['0048A8B0'])
        self.assertIn(bytes.fromhex('6a03'),raw['004A8970'])


if __name__=='__main__':unittest.main(verbosity=2)
