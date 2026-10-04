"""P0-55 bounded source-local mission41..43 capability-training cancellation.

Unlike the earlier dedicated handlers, actual-base validity is not a gate.
Explicit noninterference bounds unexecuted presentation/cache/return effects.
Existing cancellation APIs and their traces retain their original contracts.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text
import mission_cancellation_v2_profile as core
from group_mission_cancellation_profile import _preflight_returns, _return_zero

PROFILE_ID='source-idb-S1-S2-special-mission-cancellation-v1'
HANDLERS={41:'005D9C60',42:'005D9C60',43:'005D9C60'}
PRESENTATION_SLOTS={41:'0084CE00',42:'0084CE60',43:'0084CE7C'}


def validate(state,command,observations,policy):
    exact_keys(state,{'source','revision','appliedCommands','persons','buildings',
                      'capabilityTraining'},'special cancellation state')
    if type(state['persons']) is not list:raise ValueError('persons list required')
    people=copy.deepcopy(state['persons'])
    for p in people:
        exact_keys(p,core.PERSON_KEYS,'special cancellation person')
        # Raw home is a building reference, not restricted to city/port/gate.
        integer(p['homeBaseId'],'raw home reference',-1,16383)
        p['homeBaseId']=-1
    exact_keys(policy,{'id','ruleset','unknownEffects','provenance','callbackAssumption'},'special cancellation policy')
    if policy['callbackAssumption']!='noninterference-v1':
        raise ValueError('explicit callback noninterference assumption required')
    core_policy={k:v for k,v in policy.items() if k!='callbackAssumption'}
    exact_keys(observations,{'provenance','returnDistance','s2Skill267'},'special cancellation observations')
    text(observations['provenance'],'observations provenance')
    basic={k:copy.deepcopy(state[k]) for k in ('source','revision','appliedCommands')}
    basic.update(persons=people,bases=[],forces=[])
    core.validate(basic,command,dict(observations,targetBuildings=[],targetCities=[]),core_policy)
    for name,maximum in (('buildings',16383),('capabilityTraining',97)):
        if type(state[name]) is not list:raise ValueError(name+' list required')
        seen=set()
        for row in state[name]:
            exact_keys(row,{'id','valid'},name)
            integer(row['id'],name+' ID',0,maximum);boolean(row['valid'],name+' valid')
            if row['id'] in seen:raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])


def _project(state,command,observations,policy):
    validate(state,command,observations,policy)
    result={'profileId':PROFILE_ID,'source':state['source'],'accepted':False,'replayed':False,
            'reason':None,'after':copy.deepcopy(state),'steps':[],'unknownEffects':[],
            'policy':copy.deepcopy(policy),'evidence':{
                'sourceLocalOnly':True,'stockVerified':False,'vanillaVerified':False,
                'completeGameTransaction':False,'callbacksExecuted':False,'rngExecuted':False,
                'runtimeStatus':'compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption',
                'observationProvenance':observations['provenance'],
                'callbackAssumption':policy['callbackAssumption']}}
    digest=core._digest(command)
    prior=next((x for x in state['appliedCommands'] if x['id']==command['id']),None)
    if prior:
        result['replayed']=prior['sha256']==digest;result['accepted']=result['replayed']
        result['reason']='replay' if result['replayed'] else 'replay-payload-conflict';return result
    if state['revision']!=command['expectedRevision']:
        result['reason']='revision-conflict';return result
    if state['revision']==2**31-1:raise ValueError('revision exhausted')
    after=copy.deepcopy(state);people=core._index(after,'persons');actor=people[command['personId']]
    mission=actor['missionId']
    def step(helper,**kw):result['steps'].append(dict(helper=helper,**kw))
    def record(helper,reason,**kw):
        result['unknownEffects'].append(dict(helper=helper,reason=reason,
            beforeStepIndex=len(result['steps']),snapshot=copy.deepcopy(after),**kw))
    step('004A57B0',personId=actor['id'],allocated=actor['allocated'],missionId=mission)
    if not actor['allocated'] or not 0<=mission<=43:
        result['reason']='entry-gate-no-op'
    elif mission not in HANDLERS:
        result['reason']='unsupported-mission';return result
    else:
        step('005B9B40',handler=HANDLERS[mission],scratch=[-1,0,0])
        gate=actor['valid'];step('0047A630',subject='actor',passed=gate)
        args=actor['missionArgs'][:]
        if gate:
            gate=core._lookup(core._index(after,'buildings'),args[1],16383,'target building') is not None
            step('00490D00/0047A630',subject='target-building',argumentIndex=1,
                 targetId=args[1],minimum=0,maximum=16383,passed=gate)
        if gate:
            gate=core._lookup(core._index(after,'capabilityTraining'),args[0],97,'capability training') is not None
            step('00490F50/0047A630',subject='capability-training',argumentIndex=0,
                 targetId=args[0],minimum=0,maximum=97,passed=gate)
        if not gate:
            step(HANDLERS[mission],returnValue=0);result['reason']='command-gate-no-op'
        else:
            # All needed return observations are checked before any scalar write.
            # No current/home building validity is invented here: the source
            # compares normalized location to raw home, including -1 == -1.
            obs={actor['id']:dict(id=actor['id'],returnDistance=observations['returnDistance'],
                                 s2Skill267=observations['s2Skill267'])}
            _preflight_returns(after,people,[actor['id']],obs)
            record('005B81D0/005DA320/0063B180',
                   'conditional presentation and its force/legion/text reads not executed; assumed noninterfering',
                   personId=actor['id'],missionId=mission,capabilityTrainingId=args[0],
                   vtableSlot=PRESENTATION_SLOTS[mission],notificationHomeId=actor['homeBaseId'],
                   notificationHomeValidityChecked=False,conditionEvaluated=False)
            _return_zero(after,actor,obs,step,record)
            step(HANDLERS[mission],returnValue=1,refund=0)
            result['reason']='special-cancellation-projected'
    if result['unknownEffects'] and policy['unknownEffects']=='reject':
        result['steps']=[];result['reason']='unknown-effects-rejected';return result
    after['revision']+=1;after['appliedCommands'].append({'id':command['id'],'sha256':digest})
    result['accepted']=True;result['after']=after;return result


def project_special_cancellation(state,command,observations,policy):
    """Return complete isolated inputs, decisions, stages and projected state."""
    result=_project(state,command,observations,policy)
    result.update(schemaVersion=1,before=copy.deepcopy(state),command=copy.deepcopy(command),
                  observations=copy.deepcopy(observations))
    result['traceHash']=core._digest(result);return result


def replay_special_cancellation(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=core._digest(value):raise ValueError('trace hash mismatch')
    try:result=project_special_cancellation(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
