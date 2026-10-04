"""Source-S1 old-captive prelude and escape relocation, bounded person projection.

This is not a full capture transaction. Event/mission/city/force callbacks are
recorded, not executed. Static S1 bytes are MOD-associated, not stock proof.
"""
from __future__ import annotations
import copy
import hashlib
from pathlib import Path

import capture_selector_profile as common
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text, ids

PROFILE_ID = 'source-idb-30d33b44-capture-relocation-v1'
PERSON_KEYS = {'id','valid','status','legionId','homeBaseId','locationId','formerForceId',
               'officeId','loyalty','captiveMonths','acted','missionDuration','missionId','missionArgs',
               'forbiddenLordId','forbiddenMonths','rawF0','troopMember'}


def source_data(name, size, digest):
    path = Path(__file__).resolve().parents[1] / 'docs/sources/capture-relocation-source-profile' / name
    data = bytes(int(b,16) for line in path.read_text().splitlines() for b in line.split()[1:])
    if len(data) != size or hashlib.sha256(data).hexdigest() != digest:
        raise ValueError('source data fingerprint mismatch')
    return data


# Fixed source-profile data, independently fingerprinted by the evidence validator.
_DISTANCE = None
_RANKS = (0,1,2,3,5,4,6,7,8)


def city_distance(from_city, to_city):
    """0047B480: ordered row-major byte table, -1 for invalid territory IDs."""
    global _DISTANCE
    integer(from_city,'origin territory',-1,41); integer(to_city,'destination territory',-1,41)
    if from_city < 0 or to_city < 0: return -1
    if _DISTANCE is None:
        _DISTANCE = source_data('S1-0079B830.data.txt',1764,'deda8ff7828a2c42df89457adcec1b36df55f7ff78337be347e94698dc6b3e8f')
    return _DISTANCE[from_city*42+to_city]


def forbidden_adjustment(lord_id, months, raw_f0, lord_valid):
    """004A89F0..8ADA invalid-former-force prelude; later tail may overwrite."""
    integer(lord_id,'forbidden lord',-1,1099);integer(months,'forbidden months',0,255)
    integer(raw_f0,'raw F0',-(2**31),2**31-1);boolean(lord_valid,'lord valid')
    if lord_valid and lord_id<0:raise ValueError('valid forbidden lord cannot be sentinel -1')
    if months > 0 and raw_f0 in (0,1): return {'forbiddenLordId':-1,'forbiddenMonths':0}
    if months > 0 and raw_f0 == 2:
        return {'forbiddenLordId':lord_id if lord_valid else -1,
                'forbiddenMonths':max(1,months//2) if lord_valid else 0}
    return {'forbiddenLordId':lord_id,'forbiddenMonths':months}


class Draws:
    """00472150 semantics in bounds 1..42; p=100 helper is a different API."""
    def __init__(self, rolls, seed):
        if (rolls is None) == (seed is None): raise ValueError('exactly one RNG input required')
        if rolls is not None:
            if type(rolls) is not list: raise ValueError('rolls list required')
            for value in rolls: integer(value,'roll',0,41)
        else: integer(seed,'seed',0,0xffffffff)
        self.rolls = rolls; self.state = seed; self.initial = seed; self.used = []; self.calls = []
    def take(self, bound):
        integer(bound,'RNG bound',1,42)
        if bound == 1:
            self.calls.append({'bound':1,'value':0,'consumed':False}); return 0
        if self.rolls is not None:
            if len(self.used) == len(self.rolls): raise ValueError('missing destination roll')
            value = self.rolls[len(self.used)]; integer(value,'bounded roll',0,bound-1)
        else:
            self.state = (self.state*0x6c078965+0x3039)&0xffffffff
            value = (self.state>>16)%bound
        self.used.append(value); self.calls.append({'bound':bound,'value':value,'consumed':True})
        return value
    def finish(self):
        if self.rolls is not None and len(self.used) != len(self.rolls): raise ValueError('unused destination rolls')
        return {'kind':'injected-rolls' if self.rolls is not None else 'source-LCG-at-entry',
                'initialState':self.initial,'finalState':self.state,'rolls':self.used,'calls':self.calls,
                'coverage':'only modelled 00472150 calls; callbacks and deferred persons excluded'}


def _index(state, name): return {p['id']:p for p in state[name]}


def _valid(table, key):
    row = table.get(key)
    return row if row is not None and row['valid'] else None


def force_of(row, legions):
    legion = _valid(legions,row['legionId'])
    return legion['forceId'] if legion else -1


def validate(state, command, context, policy):
    exact_keys(state,{'revision','appliedIds','persons','bases','legions','forces'},'state')
    integer(state['revision'],'revision',0,2**31-1)
    if type(state['appliedIds']) is not list: raise ValueError('appliedIds list')
    for s in state['appliedIds']: text(s,'applied id')
    if len(state['appliedIds']) != len(set(state['appliedIds'])): raise ValueError('duplicate applied id')
    def rows(name, keys, max_id):
        if type(state[name]) is not list: raise ValueError(name+' list')
        seen=set()
        for p in state[name]:
            exact_keys(p,keys,name);integer(p['id'],name+' id',0,max_id);boolean(p['valid'],'valid')
            if p['id'] in seen: raise ValueError('duplicate '+name+' id')
            seen.add(p['id'])
        return seen
    rows('persons',PERSON_KEYS,1099)
    for p in state['persons']:
        for key,lo,hi in [('status',-1,8),('legionId',-1,46),('homeBaseId',-1,86),('locationId',-1,1086),
                          ('formerForceId',-1,46),('officeId',-1,80),('loyalty',0,255),('captiveMonths',0,100),
                          ('missionDuration',0,255),('missionId',-1,43),('forbiddenLordId',-1,1099),
                          ('forbiddenMonths',0,255),('rawF0',-(2**31),2**31-1)]: integer(p[key],key,lo,hi)
        boolean(p['acted'],'acted');boolean(p['troopMember'],'troopMember')
        if p['troopMember'] and p['locationId']<87: raise ValueError('actual troop member needs encoded troop location')
        if type(p['missionArgs']) is not list or len(p['missionArgs'])!=5: raise ValueError('five raw mission args')
        for v in p['missionArgs']:integer(v,'mission argument',-(2**31),2**31-1)
    base_ids=rows('bases',{'id','valid','legionId','territorialCityId','governorId'},86)
    if base_ids != set(range(87)): raise ValueError('complete 87 base-slot observations required')
    for b in state['bases']:
        integer(b['legionId'],'base legion',-1,46);integer(b['territorialCityId'],'territory',-1,41)
        integer(b['governorId'],'governor',-1,1099)
    rows('legions',{'id','valid','forceId','ordinal','leaderId'},46)
    for g in state['legions']:
        integer(g['forceId'],'legion force',-1,46);integer(g['ordinal'],'legion ordinal',1,8)
        integer(g['leaderId'],'legion leader',-1,1099)
    rows('forces',{'id','valid','rulerId'},46)
    for f in state['forces']:integer(f['rulerId'],'ruler',-1,1099)
    exact_keys(command,{'id','expectedRevision','kind','personIds','releaseFlag'},'command')
    text(command['id'],'command id');integer(command['expectedRevision'],'expected revision',0,2**31-1)
    ids(command['personIds'],'person IDs',0,1099);boolean(command['releaseFlag'],'release flag')
    if command['kind'] not in ('old-captive-prelude','escape-relocation'):raise ValueError('command kind')
    if command['kind']=='old-captive-prelude' and (command['personIds'] or command['releaseFlag']):
        raise ValueError('prelude selects roster itself and has no release flag')
    exact_keys(context,{'targetId','sourceLegionId','homeRosterIds','regionBaseByPerson','provenance'},'context')
    integer(context['targetId'],'target base',0,86);integer(context['sourceLegionId'],'source legion',0,46)
    text(context['provenance'],'provenance');ids(context['homeRosterIds'],'home roster IDs',0,1099)
    persons=_index(state,'persons');bases=_index(state,'bases');legions=_index(state,'legions')
    if not _valid(bases,context['targetId']) or not _valid(legions,context['sourceLegionId']): raise ValueError('valid target and source legion required')
    if set(context['homeRosterIds'])!={p['id'] for p in state['persons'] if p['homeBaseId']==context['targetId']}:
        raise ValueError('complete observed home-roster membership required, order preserved')
    for pid in command['personIds']:
        if not _valid(persons,pid):raise ValueError('escape person must be valid')
        if not 0<=persons[pid]['status']<=3:raise ValueError('bounded escape caller needs serving status')
    if type(context['regionBaseByPerson']) is not dict:raise ValueError('geography observations dict')
    for pid,base in context['regionBaseByPerson'].items():
        if type(pid) is not str or pid not in {str(x) for x in persons}:raise ValueError('unknown geography person')
        integer(base,'observed region base',-1,86)
    exact_keys(policy,{'id','ruleset','unknownEffects','unresolvedPerson','provenance'},'policy')
    text(policy['id'],'policy ID');text(policy['provenance'],'policy provenance')
    if policy['ruleset'] not in ('PC-PK1.1','PC-Vanilla-assumed'):raise ValueError('separate ruleset required')
    if policy['unknownEffects'] not in ('record-only','reject'):raise ValueError('unknown effects')
    if policy['unresolvedPerson'] not in ('defer-person','reject'):raise ValueError('unresolved person')


def dispatcher_order(persons, ordered_ids):
    """004B2971: stable descending transformed identity rank; no ID tie-break."""
    table={p['id']:p for p in persons}
    ids(ordered_ids,'dispatcher IDs',0,1099)
    for pid in ordered_ids:
        if pid not in table or not table[pid]['valid']:raise ValueError('valid dispatcher person required')
        integer(table[pid]['status'],'identity',-1,8)
    def rank(pid):
        s=table[pid]['status'];return -(2**31) if s==-1 else _RANKS[s]
    return sorted(ordered_ids,key=rank,reverse=True)


def absent_home_roster(state, context):
    """004B31B3: preserve supplied post-release roster order, filter actual members."""
    persons=_index(state,'persons');legions=_index(state,'legions');bases=_index(state,'bases')
    target=context['targetId'];owner=force_of(bases[target],legions)
    return [pid for pid in context['homeRosterIds'] if (p:=persons[pid])['valid'] and 0<=p['status']<=3
            and force_of(p,legions)==owner and p['locationId']!=target and not p['troopMember']]


def choose_destination(state, person_id, target_id, release_flag, rng):
    """004B0F50, safe base-pointer domain. Standalone entry bypasses context+8 gate."""
    integer(person_id,'person id',0,1099);integer(target_id,'target base',0,86);boolean(release_flag,'release flag')
    persons=_index(state,'persons');bases=_index(state,'bases');legions=_index(state,'legions');forces=_index(state,'forces')
    if not _valid(persons,person_id) or not _valid(bases,target_id):raise ValueError('valid person and target required')
    p=persons[person_id];target=bases[target_id]
    trace={'personId':person_id,'releaseFlag':release_flag,'stages':[],'destinationId':None,'reason':None}
    def result(dest,reason):
        if not _valid(bases,dest):raise ValueError('selected destination outside safe valid-base domain')
        trace.update(destinationId=dest,reason=reason);return trace
    if p['homeBaseId']!=target_id:return result(p['homeBaseId'],'existing-home')
    legion=_valid(legions,p['legionId'])
    def nearest(candidates,stage):
        candidates=sorted(candidates,key=lambda b:b['id'])
        scored=[{'id':b['id'],'distance':city_distance(target['territorialCityId'],b['territorialCityId'])} for b in candidates]
        # Invalid territory -1 is an actual helper output, not infinite distance.
        best=min(x['distance'] for x in scored);ties=[x['id'] for x in scored if x['distance']==best]
        trace['stages'].append({'stage':stage,'scores':scored,'tiedIds':ties})
        return result(ties[rng.take(len(ties))],stage)
    if legion:
        leader=_valid(persons,legion['leaderId'])
        if release_flag and leader and leader['id']!=person_id and leader['homeBaseId']>=0 and leader['homeBaseId']!=target_id:
            return result(leader['homeBaseId'],'legion-leader-home')
        cities=[b for b in bases.values() if b['valid'] and b['id']<42 and b['legionId']==legion['id'] and b['id']!=target_id]
        if cities:return nearest(cities,'legion-cities')
    force=_valid(forces,force_of(target,legions))
    if force:
        cities=[b for b in bases.values() if b['valid'] and b['id']<42 and force_of(b,legions)==force['id'] and b['id']!=target_id]
        if cities:return nearest(cities,'force-cities')
        ruler=_valid(persons,force['rulerId'])
        if ruler and ruler['id']!=person_id and ruler['homeBaseId']!=target_id:
            return result(ruler['homeBaseId'],'force-ruler-home')
    return result(rng.take(42),'random-city-fallback')


def _prepare_migration(p, destination, state, context, steps):
    """004A7990 with arg4=0. Returns origin; does not teleport to destination."""
    bases=_index(state,'bases');legions=_index(state,'legions')
    old=p['locationId']
    origin=old if 0<=old<=86 else context['regionBaseByPerson'].get(str(p['id']))
    if origin is None:raise ValueError('non-base person needs observed region-base mapping')
    origin_base=_valid(bases,origin)
    origin_territory=origin_base['territorialCityId'] if origin_base else -1
    distance=1 if origin<0 else city_distance(origin_territory,bases[destination]['territorialCityId'])
    p['acted']=True;p['missionDuration']=distance&255
    refresh=[]
    owner=force_of(p,legions)
    if 0<=owner<=46:
        current=_valid(bases,old) if 0<=old<=86 else None
        if current and force_of(current,legions)==owner:refresh.append(old)
        home=_valid(bases,p['homeBaseId'])
        if home and home['id'] not in refresh:refresh.append(home['id'])
    steps.append({'helper':'004A7990','destinationId':destination,'originId':origin,'distanceResult':distance,
                  'durationByte':p['missionDuration'],'governorRefreshIds':refresh,'arg3':-1,'arg4':0})
    return origin


def project_personnel(state, command, context, policy, *, rolls=None, source_rng_state=None):
    validate(state,command,context,policy)
    rng=Draws(rolls,source_rng_state)
    tr={'schemaVersion':1,'profileId':PROFILE_ID,'before':copy.deepcopy(state),'command':copy.deepcopy(command),
        'context':copy.deepcopy(context),'policy':copy.deepcopy(policy),'accepted':False,'reason':None,
        'personIds':[],'steps':[],'deferredIds':[],'events':[],'fallbacks':[],
        'evidence':{'stockOriginalVerified':False,'completeGameTransaction':False,
                    'runtimeStatus':'compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption'},
        'after':copy.deepcopy(state)}
    reason=('duplicate-command' if command['id'] in state['appliedIds'] else
            'stale-revision' if command['expectedRevision']!=state['revision'] else
            'revision-exhausted' if state['revision']==2**31-1 else
            'unmodelled-effects' if policy['unknownEffects']=='reject' else None)
    def finish():
        tr['rng']=rng.finish();tr['traceHash']=common._digest(tr);return tr
    if reason:tr['reason']=reason;return finish()
    after=tr['after'];persons=_index(after,'persons');bases=_index(after,'bases');legions=_index(after,'legions');forces=_index(after,'forces')
    target=context['targetId'];new_force=legions[context['sourceLegionId']]['forceId']
    targets=([pid for pid in context['homeRosterIds'] if persons[pid]['valid'] and persons[pid]['status']==5 and persons[pid]['locationId']==target]
             if command['kind']=='old-captive-prelude' else command['personIds'])
    tr['personIds']=targets.copy()
    unresolved=[]
    # Preflight all unsupported people before any draw/projection.
    for pid in targets:
        p=persons[pid]
        if command['kind']=='old-captive-prelude':
            if force_of(p,legions)==new_force:continue
            former=_valid(forces,p['formerForceId'])
            ruler=_valid(persons,former['rulerId']) if former else None
            first=next((g for g in sorted(legions.values(),key=lambda x:x['id']) if g['valid'] and g['forceId']==p['formerForceId'] and g['ordinal']==1),None)
            if not former or not ruler or not _valid(bases,ruler['homeBaseId']) or not first:
                unresolved.append(pid)
        else:
            # 004B1950 tests target's OTHER OWNED CITIES, before 004B0F50.
            owner=force_of(bases[target],legions)
            if not _valid(forces,owner) or not any(b['valid'] and b['id']<42 and b['id']!=target and force_of(b,legions)==owner for b in bases.values()):unresolved.append(pid)
    if unresolved and policy['unresolvedPerson']=='reject':
        tr['reason']='unsupported-person-route';tr['deferredIds']=unresolved;return finish()
    tr['deferredIds']=unresolved
    for pid in targets:
        if pid in unresolved:
            tr['steps'].append({'personId':pid,'route':'deferred-004BBB00-or-invalid-return-context','writes':{}});continue
        p=persons[pid];before=copy.deepcopy(p);steps=[]
        if command['kind']=='old-captive-prelude':
            if force_of(p,legions)==new_force:
                route='liberate-own-affiliation';p.update(status=3,formerForceId=-1,captiveMonths=0,acted=True,legionId=context['sourceLegionId'])
            else:
                route='return-former-force';old_home=_valid(bases,p['homeBaseId']);old_owner=_valid(forces,force_of(old_home,legions)) if old_home else None
                former=forces[p['formerForceId']];ruler=persons[former['rulerId']]
                first=next(g for g in sorted(legions.values(),key=lambda x:x['id']) if g['valid'] and g['forceId']==former['id'] and g['ordinal']==1)
                destination=ruler['homeBaseId'];p.update(legionId=first['id'],homeBaseId=destination,status=3)
                p['locationId']=_prepare_migration(p,destination,after,context,steps)
                p.update(missionId=37,missionArgs=[0]*5,formerForceId=-1,captiveMonths=0,acted=True)
                tr['events'].append({'event':4,'personId':pid,'argument':0,'effectStatus':'record-only',
                                     'phase':'after release fields before forbidden tail','personProjectionAtEmission':copy.deepcopy(p)})
                if old_owner:
                    p.update(forbiddenLordId=old_owner['rulerId'],forbiddenMonths=3)
                steps.append({'helper':'004A8970','missionCancellation':'004A57B0 record-only before mission37',
                              'forbiddenTailOwnerId':old_owner['id'] if old_owner else None})
            if route=='liberate-own-affiliation':
                tr['events'].append({'event':4,'personId':pid,'argument':0,'effectStatus':'record-only',
                                     'phase':'after source legion assignment','personProjectionAtEmission':copy.deepcopy(p)})
        else:
            route='escape-release' if command['releaseFlag'] else 'escape'
            if command['releaseFlag']:
                steps.append({'helper':'004A9120','effectStatus':'record-only before 004B1950; no invented TP reward or forbidden flag'})
            selection=choose_destination(after,pid,target,command['releaseFlag'],rng);steps.append(selection);dest=selection['destinationId']
            if p['legionId']!=bases[dest]['legionId']:
                if p['status']==1:p['status']=3;steps.append({'helper':'004A0940','oldLeaderClear':'record-only'})
                if p['status']!=0:p['legionId']=bases[dest]['legionId']
            old_home=_valid(bases,p['homeBaseId'])
            if p['status']!=0 and old_home and old_home['governorId']==pid:p['status']=3
            p['homeBaseId']=dest
            origin=_prepare_migration(p,dest,after,context,steps)
            # Base-capture context: target is not a troop; 004B1A75 skips 004A0CB0.
            # Actual location is not rewritten, unlike 004A8970 return-former-force.
            steps[-1]['returnedOriginNotWrittenForBaseCapture']=origin
            p.update(missionId=37,missionArgs=[0]*5,acted=True)
        writes={k:v for k,v in p.items() if v!=before[k]}
        tr['steps'].append({'personId':pid,'route':route,'writes':writes,'details':steps})
    tr['fallbacks']=[{'id':'record-person-callbacks-v1','status':'provisional-engine-rule',
                     'reason':'roster/legion lists, availability flag, mission cancellation/resources, governor/leader, event and force callbacks are not executed; after is a local projection, not original final state'}]
    if unresolved:tr['fallbacks'].append({'id':'defer-unresolved-person-v1','status':'provisional-engine-rule','personIds':unresolved,
                                        'reason':'004BBB00 wandering selector/force callbacks or invalid return context; preserve all this person fields without treating them as original invariants'})
    after['revision']+=1;after['appliedIds'].append(command['id']);tr['accepted']=True
    return finish()


def replay_personnel(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=common._digest(value):raise ValueError('trace hash mismatch')
    rng=trace['rng'];kw={'rolls':rng['rolls']} if rng['kind']=='injected-rolls' else {'source_rng_state':rng['initialState']}
    if rng['kind'] not in ('injected-rolls','source-LCG-at-entry'):raise ValueError('RNG kind')
    result=project_personnel(trace['before'],trace['command'],trace['context'],trace['policy'],**kw)
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
