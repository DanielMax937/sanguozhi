"""P0-53 bounded S1/S2 group cancellation for mission2 and mission5.

The complete sparse person universe is an input contract, not a guessed roster.
Groups are source ID-ordered first-three matches, without owner/location filters.
Callbacks are not executed; listed scalar effects assume their noninterference.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text
import mission_cancellation_v2_profile as core

PROFILE_ID='source-idb-S1-S2-group-mission-cancellation-v1'
HANDLERS={2:'005C6AA0',5:'005D7FC0'}
COUNTER_INDEX={1:0,2:0,3:0,4:1,5:2,6:2,7:2,8:2,9:3,10:3,11:3}
FORCE_KEYS={'id','valid','query33','query38','researchId','researchDuration'}


def validate(state,command,observations,policy):
    exact_keys(state,{'source','revision','appliedCommands','persons','bases','forces',
                      'personsComplete','cities','weaponTypes','researchTypes'},'group state')
    if state['personsComplete'] is not True:raise ValueError('complete sparse person universe required')
    if type(state['persons']) is not list or type(state['forces']) is not list:
        raise ValueError('person/force lists required')
    for p in state['persons']:
        exact_keys(p,core.PERSON_KEYS|{'forceId'},'group person')
        integer(p['forceId'],'observed person virtual+40 force',-1,46)
    for f in state['forces']:
        exact_keys(f,FORCE_KEYS,'group force')
        integer(f['researchId'],'force research ID',-1,35 if state['source']=='S1' else 63)
        integer(f['researchDuration'],'force research duration byte',0,255)
    basic={k:copy.deepcopy(state[k]) for k in ('source','revision','appliedCommands','persons','bases','forces')}
    for p in basic['persons']:p.pop('forceId')
    for f in basic['forces']:f.pop('researchId');f.pop('researchDuration')
    exact_keys(observations,{'provenance','perPerson'},'group observations')
    text(observations['provenance'],'observation provenance')
    dummy={'provenance':observations['provenance'],'returnDistance':None,'s2Skill267':None,
           'targetBuildings':[],'targetCities':[]}
    core.validate(basic,command,dummy,policy)
    def rows(name,keys,hi):
        if type(state[name]) is not list:raise ValueError(name+' list required')
        seen=set()
        for row in state[name]:
            exact_keys(row,keys,name);integer(row['id'],name+' ID',0,hi);boolean(row['valid'],'valid')
            if row['id'] in seen:raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])
    rows('cities',{'id','valid','rawCountersA9AC'},41)
    for city in state['cities']:
        values=city['rawCountersA9AC']
        if type(values) is not list or len(values)!=4:raise ValueError('four signed city counters required')
        for value in values:integer(value,'city signed byte',-128,127)
    rows('weaponTypes',{'id','valid'},11)
    rows('researchTypes',{'id','valid'},35 if state['source']=='S1' else 63)
    if type(observations['perPerson']) is not list:raise ValueError('perPerson observations list required')
    seen=set()
    for row in observations['perPerson']:
        exact_keys(row,{'id','returnDistance','s2Skill267'},'perPerson observation')
        integer(row['id'],'person observation ID',0,1099)
        if row['id'] in seen:raise ValueError('duplicate perPerson observation')
        seen.add(row['id'])
        if row['returnDistance'] is not None:integer(row['returnDistance'],'0049E4D0 observed distance',-1,255)
        if row['s2Skill267'] is not None:boolean(row['s2Skill267'],'query267 observation')


def collect_group(persons,mission,group_id):
    """005B8250: known complete sparse input, fixed nonnull output capacity3.

    Mission0 uses args[1]; 2 and5 use args[2]. The public projection below only
    dispatches 2/5. Group identity is signed; neither force nor target is a key.
    """
    integer(mission,'group mission',-2**31,2**31-1)
    integer(group_id,'group identity',-2**31,2**31-1)
    if mission not in (0,2,5):return []
    slot=1 if mission==0 else 2
    found=[]
    for p in sorted(persons,key=lambda p:p['id']):
        if p['valid'] and p['missionId']==mission and p['missionArgs'][slot]==group_id:
            found.append(p['id'])
            if len(found)==3:break
    return found


def counter_after_cancel(value):
    """004B3EE0 called with +1: MOVSX byte then clamp to -1..30."""
    integer(value,'city signed byte',-128,127)
    return max(-1,min(30,value+1))


def _preflight_returns(state,persons,group,observations):
    """Engineering validation only; no simulated source effects or writes."""
    for person_id in group:
        p=persons[person_id]
        location=p['locationId'] if 0<=p['locationId']<=86 else -1
        obs=observations.get(person_id,{})
        if location!=p['homeBaseId']:
            if obs.get('returnDistance') is None:
                raise ValueError('observed return distance required for person '+str(person_id))
        elif state['source']=='S2' and obs.get('s2Skill267') is None:
            raise ValueError('observed S2 query267 required for person '+str(person_id))


def _reset_research(force,step):
    old=force['researchId'];force['researchId']=-1
    step('004B53E0/004815C0',forceId=force['id'],before=old,after=-1)
    old=force['researchDuration'];force['researchDuration']=0
    step('004815E0',forceId=force['id'],before=old,after=0)


def _return_zero(state,p,observations,step,record):
    """Known scalar-only 005B8400(person,0), with address-ordered snapshots."""
    location=p['locationId'] if 0<=p['locationId']<=86 else -1
    step('005B8400',personId=p['id'],effectiveLocationId=location,homeBaseId=p['homeBaseId'],refund=0)
    obs=observations.get(p['id'],{})
    if location!=p['homeBaseId']:
        distance=obs.get('returnDistance')
        if distance is None:raise ValueError('observed return distance required for person '+str(p['id']))
        step('0049E4D0',personId=p['id'],observedDistance=distance)
        p['missionId']=37;p['missionArgs']=[0]*5;p['acted']=True
        step('004A73A0',personId=p['id'],cancelOld=False,person=copy.deepcopy(p))
        record('00489B40/00482F80','cache/UI and active-person list not executed',personId=p['id'])
        p['missionDuration']=distance&255
        step('004A5660',personId=p['id'],person=copy.deepcopy(p))
    else:
        p['missionId']=-1;p['missionArgs']=[0]*5
        step('004A5780',personId=p['id'],person=copy.deepcopy(p))
        p['missionDuration']=0
        step('004A5660',personId=p['id'],person=copy.deepcopy(p))
        set_acted=True
        if state['source']=='S2':
            query=obs.get('s2Skill267')
            if query is None:raise ValueError('observed S2 query267 required for person '+str(p['id']))
            set_acted=not query
            step('0090CBA0',personId=p['id'],query267=query,setActed=set_acted)
        if set_acted:
            p['acted']=True
            step('004A5600/00489B40',personId=p['id'],person=copy.deepcopy(p))
            record('004A06A0/004B9480','cache/UI callbacks not executed',personId=p['id'])
        if p['status']!=5:
            record('004BF6F0','full return-home personnel/role/affiliation effects not executed',
                   personId=p['id'],homeBaseId=p['homeBaseId'],arguments=[p['id'],p['homeBaseId'],0,1])


def _project(state,command,observations,policy):
    validate(state,command,observations,policy)
    result={'profileId':PROFILE_ID,'source':state['source'],'accepted':False,'replayed':False,
            'reason':None,'after':copy.deepcopy(state),'steps':[],'unknownEffects':[],
            'evidence':{'sourceLocalOnly':True,'stockVerified':False,'vanillaVerified':False,
                        'completeGameTransaction':False,'callbacksExecuted':False,
                        'runtimeStatus':'compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption',
                        'observationProvenance':observations['provenance']},'policy':copy.deepcopy(policy)}
    digest=core._digest(command)
    prior=next((x for x in state['appliedCommands'] if x['id']==command['id']),None)
    if prior:
        result['replayed']=prior['sha256']==digest;result['accepted']=result['replayed']
        result['reason']='replay' if result['replayed'] else 'replay-payload-conflict';return result
    if state['revision']!=command['expectedRevision']:
        result['reason']='revision-conflict';return result
    if state['revision']==2**31-1:raise ValueError('revision exhausted')
    after=copy.deepcopy(state);persons=core._index(after,'persons');bases=core._index(after,'bases')
    actor=persons[command['personId']];mission=actor['missionId']
    def step(helper,**kw):result['steps'].append(dict(helper=helper,**kw))
    def record(helper,reason,**kw):
        result['unknownEffects'].append(dict(helper=helper,reason=reason,beforeStepIndex=len(result['steps']),**kw))
    step('004A57B0',personId=actor['id'],allocated=actor['allocated'],missionId=mission)
    if not actor['allocated'] or not 0<=mission<=43:
        result['reason']='entry-gate-no-op'
    elif mission not in HANDLERS:
        result['reason']='unsupported-mission';return result
    else:
        step('005B9B40',handler=HANDLERS[mission],scratch=[-1,0,0])
        gate=actor['valid'];step('0047A630',subject='actor',passed=gate)
        if gate:
            location=actor['locationId'] if 0<=actor['locationId']<=86 else -1
            gate=core._lookup(bases,location,86,'actor current building') is not None
            step('00490D00/0047A630',subject='current-building',effectiveLocationId=location,passed=gate)
        args=actor['missionArgs'][:]
        if gate:
            gate=0<=args[0]<=41
            step('004897B0/range',argumentIndex=0,value=args[0],minimum=0,maximum=41,passed=gate)
        if gate:
            name='weaponTypes' if mission==2 else 'researchTypes'
            maximum=11 if mission==2 else 35 if state['source']=='S1' else 63
            gate=core._lookup(core._index(after,name),args[1],maximum,'target '+name) is not None
            step('00490BC0/0047A630' if mission==2 else '00490C70/0047A630',
                 argumentIndex=1,targetId=args[1],maximum=maximum,passed=gate,
                 s2ExtendedHook=mission==5 and state['source']=='S2' and not 0<=args[1]<=35)
        if not gate:result['reason']='command-gate-no-op'
        else:
            group=collect_group(after['persons'],mission,args[2])
            step('005B8250',missionId=mission,groupId=args[2],argumentIndex=2,capacity=3,personIds=group[:],
                 universe='complete sparse person IDs0..1099')
            obs={r['id']:r for r in observations['perPerson']}
            _preflight_returns(after,persons,group,obs)
            if mission==2:
                city=core._lookup(core._index(after,'cities'),args[0],41,'target city subtype')
                index=COUNTER_INDEX.get(args[1])
                if city is not None and index is not None:
                    old=city['rawCountersA9AC'][index];new=counter_after_cancel(old)
                    city['rawCountersA9AC'][index]=new
                    step('004B3EE0',cityId=city['id'],weaponTypeId=args[1],offset=f'0x{0xa9+index:X}',
                         before=old,requestedDelta=1,after=new,actualDelta=new-old)
                else:step('004B3EE0',cityId=args[0],weaponTypeId=args[1],validCity=city is not None,actualDelta=0)
            else:
                force=core._lookup(core._index(after,'forces'),actor['forceId'],46,'actor force')
                step('00490AA0/0047A630',subject='actor-force',forceId=actor['forceId'],passed=force is not None)
                if force is not None:_reset_research(force,step)
            record('005B81D0/004D06A0/0063ADD0','conditional presentation and its reads not executed; noninterference assumed',
                   personId=actor['id'],missionId=mission)
            for person_id in group:
                member=persons[person_id]
                # Source rechecks every captured pointer before the return call.
                # Under explicit no-callback-interference policy validity is unchanged.
                step('0047A630',subject='captured-group-member',personId=person_id,passed=member['valid'])
                if member['valid']:_return_zero(after,member,obs,step,record)
            step(HANDLERS[mission],returnValue=1,personIds=group[:])
            result['reason']='group-and-fields-projected'
    if result['unknownEffects'] and policy['unknownEffects']=='reject':
        result['steps']=[];result['reason']='unknown-effects-rejected';return result
    after['revision']+=1;after['appliedCommands'].append({'id':command['id'],'sha256':digest})
    result['accepted']=True;result['after']=after;return result


def project_group_cancellation(state,command,observations,policy):
    result=_project(state,command,observations,policy)
    result.update(schemaVersion=1,before=copy.deepcopy(state),command=copy.deepcopy(command),observations=copy.deepcopy(observations))
    result['traceHash']=core._digest(result);return result


def replay_group_cancellation(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=core._digest(value):raise ValueError('trace hash mismatch')
    try:result=project_group_cancellation(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if trace!=result:raise ValueError('trace replay mismatch')
    return result
