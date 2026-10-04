"""P0-52 S1/S2 cancellation projection with six dedicated zero-refund handlers.

Separate v2 preserves P0-51's immutable v1 interface and replay semantics.
00490D00 building slots and 00490A10 city-subtype slots are not conflated.
Presentation/list/return callbacks remain explicit record/reject boundaries.
"""
from __future__ import annotations
import copy
import hashlib
import json
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text

PROFILE_ID = 'source-idb-S1-S2-mission-cancellation-v2'
ZERO_REFUND_MISSIONS = (9,10,12,22,23,24)
HANDLERS = (
    '005BBE30','00441880','005C6AA0','00441880','00441880','005D7FC0',
    '00441880','00441880','00441880','005CB050','005D5DD0','00441880',
    '005C4E70','00441880','00441880','005BA560','005BA5F0','005BA680',
    '005BA710','005BA7A0','005BA830','005BA8C0','005BEDA0','005B6D00',
    '005CFB70','00441880','00441880','00441880','00441880','00441880',
    '00441880','00441880','00441880','00441880','00441880','00441880',
    '00441880',None,'005D69D0','00441880','00441880','005D9C60',
    '005D9C60','005D9C60')
NOOP_MISSIONS = tuple(i for i, target in enumerate(HANDLERS) if target == '00441880')
REFUND_ARG = {15:1,16:1,17:None,18:1,19:None,20:2,21:2}
PERSON_KEYS = {'id','allocated','valid','status','homeBaseId','locationId',
               'missionId','missionArgs','missionDuration','acted'}


def s32(n):
    return ((n + 2**31) % 2**32) - 2**31


def money_capacity(source, kind, force_valid, query33, query38):
    """00486D30/0048D820: query booleans are observations, not tech formulas."""
    if source not in ('S1','S2'): raise ValueError('source S1/S2 required')
    integer(kind,'base kind',0,2)
    for flag in (force_valid,query33,query38): boolean(flag,'capacity-query observation')
    if kind == 0: return 100000 if source == 'S1' else 200000
    if source == 'S1': return 40000 if force_valid and query33 else 10000
    return 100000 if force_valid and query38 else 50000


def money_after_refund(old, amount, capacity):
    """004AE2A0 signed ADD and clamp; called only for positive refunds."""
    integer(old,'money',0,2**31-1); integer(amount,'positive refund',1,2**31-1)
    integer(capacity,'money capacity',0,2**31-1)
    total = s32(old + amount)
    return 0 if total <= 0 else min(total,capacity)


def _index(state,name): return {x['id']:x for x in state[name]}


def _lookup(table,key,maximum,label):
    if not 0 <= key <= maximum: return None
    if key not in table: raise ValueError('missing observed '+label+' slot '+str(key))
    row=table[key]
    return row if row['valid'] else None


def _digest(command):
    return hashlib.sha256(json.dumps(command,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def validate(state,command,observations,policy):
    exact_keys(state,{'source','revision','appliedCommands','persons','bases','forces'},'state')
    if state['source'] not in ('S1','S2'):raise ValueError('source S1/S2 required')
    integer(state['revision'],'revision',0,2**31-1)
    if type(state['appliedCommands']) is not list:raise ValueError('appliedCommands list required')
    applied=set()
    for entry in state['appliedCommands']:
        exact_keys(entry,{'id','sha256'},'applied command');text(entry['id'],'applied id')
        if type(entry['sha256']) is not str or len(entry['sha256'])!=64 or any(c not in '0123456789abcdef' for c in entry['sha256']):raise ValueError('applied digest')
        if entry['id'] in applied:raise ValueError('duplicate applied id')
        applied.add(entry['id'])
    def rows(name,keys,hi):
        if type(state[name]) is not list:raise ValueError(name+' list required')
        seen=set()
        for row in state[name]:
            exact_keys(row,keys,name);integer(row['id'],name+' ID',0,hi);boolean(row['valid'],'valid')
            if row['id'] in seen:raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])
    rows('persons',PERSON_KEYS,1099)
    for p in state['persons']:
        boolean(p['allocated'],'allocated');boolean(p['acted'],'acted')
        if p['valid'] and not p['allocated']:raise ValueError('valid person must be allocated')
        for k,lo,hi in [('status',-1,8),('homeBaseId',-1,86),('locationId',-1,1086),
                         ('missionId',-2**31,2**31-1),('missionDuration',0,255)]:integer(p[k],k,lo,hi)
        if type(p['missionArgs']) is not list or len(p['missionArgs'])!=5:raise ValueError('five mission args required')
        for a in p['missionArgs']:integer(a,'mission arg',-2**31,2**31-1)
    rows('bases',{'id','valid','resourceValid','kind','forceId','money'},86)
    for b in state['bases']:
        boolean(b['resourceValid'],'resourceValid');integer(b['kind'],'kind',0,2)
        integer(b['forceId'],'base force',-1,46);integer(b['money'],'base money',0,2**31-1)
        if b['kind'] != (0 if b['id']<42 else 1 if b['id']<52 else 2):raise ValueError('base type/ID mismatch')
    rows('forces',{'id','valid','query33','query38'},46)
    for f in state['forces']:
        boolean(f['query33'],'query33');boolean(f['query38'],'query38')
    exact_keys(command,{'id','expectedRevision','personId'},'command')
    text(command['id'],'command ID');integer(command['expectedRevision'],'expected revision',0,2**31-1)
    integer(command['personId'],'person ID',0,1099)
    if command['personId'] not in _index(state,'persons'):raise ValueError('person slot observation required')
    exact_keys(observations,{'provenance','returnDistance','s2Skill267','targetBuildings','targetCities'},'observations')
    text(observations['provenance'],'observations provenance')
    if observations['returnDistance'] is not None:integer(observations['returnDistance'],'0049E4D0 observed result',-1,255)
    if observations['s2Skill267'] is not None:boolean(observations['s2Skill267'],'004890F0(person,267) result')
    # Buildings (0..16383) and cities (0..41) are different source arrays.
    # Only additional building slots are needed; overlap must agree with bases.
    for name,hi in [('targetBuildings',16383),('targetCities',41)]:
        if type(observations[name]) is not list:raise ValueError(name+' list required')
        seen=set()
        for row in observations[name]:
            exact_keys(row,{'id','valid'},name)
            integer(row['id'],name+' ID',0,hi);boolean(row['valid'],name+' valid')
            if row['id'] in seen:raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])
            base=_index(state,'bases').get(row['id'])
            if name=='targetBuildings' and base and base['valid']!=row['valid']:
                raise ValueError('conflicting observation of same building slot')
    exact_keys(policy,{'id','ruleset','unknownEffects','provenance'},'policy')
    text(policy['id'],'policy ID');text(policy['provenance'],'policy provenance')
    if policy['ruleset'] not in ('PC-PK1.1','PC-Vanilla-assumed'):raise ValueError('separate requested ruleset required')
    if policy['unknownEffects'] not in ('record-only','reject'):raise ValueError('unknown-effects policy')


def _project_cancellation(state,command,observations,policy):
    """Atomic, replay-protected local projection of one 004A57B0 invocation.

    allocated/valid are distinct observations of 0047A600/0047A630. Missing
    referenced slots raise rather than being guessed invalid. ID-range misses
    model sentinel getters. Presentation, caches, lists and return callbacks
    remain explicit unknown effects even when person/money writes are known.
    """
    validate(state,command,observations,policy)
    result={'profileId':PROFILE_ID,'source':state['source'],'accepted':False,'replayed':False,
            'reason':None,'after':copy.deepcopy(state),'steps':[],'unknownEffects':[],
            'evidence':{'sourceLocalOnly':True,'stockVerified':False,'vanillaVerified':False,
                        'completeGameTransaction':False,'callbacksExecuted':False,
                        'runtimeStatus':'compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption',
                        'rulesetEvidence':'MOD-associated source reuse; stock PK and Vanilla are unverified',
                        'observationProvenance':observations['provenance']},'policy':copy.deepcopy(policy)}
    digest=_digest(command)
    prior=next((x for x in state['appliedCommands'] if x['id']==command['id']),None)
    if prior:
        result['replayed']=prior['sha256']==digest
        result['accepted']=result['replayed'];result['reason']='replay' if result['replayed'] else 'replay-payload-conflict'
        return result
    if state['revision'] != command['expectedRevision']:
        result['reason']='revision-conflict';return result
    if state['revision']==2**31-1:raise ValueError('revision exhausted')
    after=copy.deepcopy(state);persons=_index(after,'persons');bases=_index(after,'bases');forces=_index(after,'forces')
    p=persons[command['personId']];mission=p['missionId'];steps=result['steps'];unknown=result['unknownEffects']
    def record(address,reason,**details):unknown.append(dict({'helper':address,'reason':reason},**details))
    def step(address,**details):steps.append(dict({'helper':address},**details))
    step('004A57B0',personId=p['id'],allocated=p['allocated'],missionId=mission)
    if not p['allocated'] or not 0<=mission<=43:
        result['reason']='entry-gate-no-op'
    elif mission==37:
        step('005B9B40',mission37Skip=True);result['reason']='mission37-no-op'
    elif HANDLERS[mission]=='00441880':
        step('005B9B40',handler='00441880',scratch=[-1,0,0],returnValue=0)
        result['reason']='registered-no-op'
    elif mission not in REFUND_ARG and mission not in ZERO_REFUND_MISSIONS:
        step('005B9B40',handler=HANDLERS[mission],scratch=[-1,0,0])
        record(HANDLERS[mission],'command-specific cancellation not projected',missionId=mission)
        result['reason']='unresolved-handler'
    else:
        step('005B9B40',handler=HANDLERS[mission],scratch=[-1,0,0])
        args=p['missionArgs'][:]
        if mission in ZERO_REFUND_MISSIONS:
            gate=p['valid']
            step('0047A630',subject='actor',personId=p['id'],passed=gate)
            if gate:
                # Every one of these handlers normalizes the actual location
                # before reading the target argument. Troop IDs are not bases.
                location=p['locationId'] if 0<=p['locationId']<=86 else -1
                current=_lookup(bases,location,86,'current building')
                gate=current is not None
                step('00490D00/0047A630',subject='current-building',
                     effectiveLocationId=location,passed=gate)
            if gate:
                arg=args[0]
                if mission in (9,10,12):
                    hi=1099 if mission==12 else 16383
                    gate=0<=arg<=hi
                    step('004897B0/range',argumentIndex=0,value=arg,
                         minimum=0,maximum=hi,passed=gate,
                         targetValidityChecked=False)
                elif mission==22:
                    gate=_lookup(forces,arg,46,'target force') is not None
                    step('00490AA0/0047A630',targetId=arg,passed=gate)
                elif mission==23:
                    cities={r['id']:r for r in observations['targetCities']}
                    gate=_lookup(cities,arg,41,'target city subtype') is not None
                    step('00490A10/0047A630',targetId=arg,passed=gate)
                else:
                    buildings=dict(bases)
                    buildings.update({r['id']:r for r in observations['targetBuildings']})
                    gate=_lookup(buildings,arg,16383,'target building') is not None
                    step('00490D00/0047A630',targetId=arg,passed=gate)
        else:
            target_force=_lookup(forces,args[0],46,'target force') if p['valid'] else None
            gate=p['valid'] and target_force is not None
            if gate and mission==20:
                # 00572680 short-circuits below 1000, before target-person validity.
                gate=args[2]>=1000 and _lookup(persons,args[1],1099,'target person') is not None
            if gate and mission==21:
                gate=_lookup(bases,args[1],86,'first target base') is not None
                if gate:gate=_lookup(bases,args[3],86,'second target base') is not None
            step('005725A0' if mission<20 else '00572680' if mission==20 else '00572760',passed=gate)
        if not gate:result['reason']='command-gate-no-op'
        else:
            if mission in ZERO_REFUND_MISSIONS:
                record('005B81D0/004D06A0/0063ADD0',
                       'conditional presentation and its force/legion/target reads not executed; assumed noninterfering',
                       missionId=mission,personId=p['id'])
                refund=0
                step(HANDLERS[mission],passed=True,refund=0,
                     targetArgument=args[0],presentationExecuted=False)
            else:
                record('005BC590/005BCA20','conditional presentation and notification effects not executed')
                refund=0 if REFUND_ARG[mission] is None else args[REFUND_ARG[mission]]
                step('005BC9F0',refund=refund)
            location=p['locationId'] if 0<=p['locationId']<=86 else -1
            step('005B8400',effectiveLocationId=location,homeBaseId=p['homeBaseId'],refund=refund)
            if location != p['homeBaseId']:
                if observations['returnDistance'] is None:raise ValueError('observed 0049E4D0 return distance required')
                p['missionId']=37;p['missionArgs']=[refund,0,0,0,0];p['acted']=True
                step('004A73A0',cancelOld=False,missionId=37,missionArgs=p['missionArgs'][:],acted=True)
                record('00489B40/00482F80','cache, UI and active-person-list effects not executed')
                p['missionDuration']=observations['returnDistance']&255
                step('004A5660',missionDuration=p['missionDuration'],observedDistance=observations['returnDistance'])
                result['reason']='return-mission-projected'
            else:
                p['missionId']=-1;p['missionArgs']=[0]*5
                step('004A5780',missionId=-1,missionArgs=[0]*5)
                p['missionDuration']=0;step('004A5660',missionDuration=0)
                set_acted=True
                if state['source']=='S2':
                    if observations['s2Skill267'] is None:raise ValueError('S2 observed 004890F0(person,267) result required')
                    set_acted=not observations['s2Skill267']
                    step('0090CBA0',query267=observations['s2Skill267'],setActed=set_acted)
                if set_acted:
                    p['acted']=True;step('004A5600/00489B40',acted=True)
                    record('004A06A0/004B9480','cache and UI effects not executed; later scalar writes are local projection')
                if refund>0:
                    base=_lookup(bases,p['homeBaseId'],86,'refund base')
                    if base and base['resourceValid']:
                        force=_lookup(forces,base['forceId'],46,'base force') if base['kind'] else None
                        cap=money_capacity(state['source'],base['kind'],force is not None,
                                           force['query33'] if force else False,force['query38'] if force else False)
                        old=base['money'];base['money']=money_after_refund(old,refund,cap)
                        step('004AE2A0',baseId=base['id'],requestedRefund=refund,capacity=cap,
                             beforeMoney=old,afterMoney=base['money'],actualDelta=base['money']-old)
                    elif base:
                        record('00487310','base/subtype validity mismatch outside bounded resource projection',baseId=base['id'])
                    else:step('004AE2A0',requestedRefund=refund,validBase=False,actualDelta=0)
                if p['status']!=5:
                    record('004BF6F0','return-home personnel/roster/affiliation callbacks not executed',personId=p['id'],homeBaseId=p['homeBaseId'])
                result['reason']='home-reset-projected' if mission in ZERO_REFUND_MISSIONS else 'home-reset-and-refund-projected'
    if unknown and policy['unknownEffects']=='reject':
        result['reason']='unknown-effects-rejected';result['steps']=[];return result
    after['revision']+=1;after['appliedCommands'].append({'id':command['id'],'sha256':digest})
    result['accepted']=True;result['after']=after
    return result


def project_cancellation(state,command,observations,policy):
    """Return a self-contained deterministic trace, including denied requests."""
    result=_project_cancellation(state,command,observations,policy)
    result.update(schemaVersion=2,before=copy.deepcopy(state),command=copy.deepcopy(command),
                  observations=copy.deepcopy(observations))
    result['traceHash']=_digest(result)
    return result


def replay_cancellation(trace):
    """Verify integrity then independently recompute every decision and write.

    A hash is not a source signature. Re-signing altered outcomes cannot make
    them consistent with the embedded inputs; changing those inputs defines a
    different simulation and is not authenticated as an original observation.
    """
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=_digest(value):raise ValueError('trace hash mismatch')
    try:result=project_cancellation(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
