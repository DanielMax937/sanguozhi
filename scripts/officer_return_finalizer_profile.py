"""P0-57 separate source-local 004BF6F0 scalar projection.

Home/location/rawlegion/bit9 writes retain the caller and roster-call order.
Lists, notices, UI and complete role reconciliation are NOT executed. The
ruler ownership/capture branch is always deferred rather than omitted. This
module never changes the contract or replay of earlier cancellation APIs.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text
from mission_cancellation_v2_profile import _digest

PROFILE_ID = 'source-idb-S1-S2-officer-return-finalizer-v1'
I32_MIN, I32_MAX = -2**31, 2**31-1
PERSON_KEYS = {'id','allocated','valid','status','homeBaseId','locationId',
    'rawLegionId','flags124','missionId','missionArgs','missionDuration','acted'}


def _index(state, name): return {r['id']:r for r in state[name]}


def _slot(table, key, high, label):
    """Array getter returns a pointer for every in-domain slot, even invalid."""
    if not 0 <= key <= high: return None
    if key not in table: raise ValueError('missing observed '+label+' slot '+str(key))
    return table[key]


def _valid(row): return row is not None and row['valid']


def validate(state, command, observations, policy):
    exact_keys(state, {'source','revision','appliedCommands','persons','buildings','legions','forces','rngState'}, 'officer return state')
    if state['source'] not in ('S1','S2'): raise ValueError('source S1/S2 required')
    integer(state['revision'],'revision',0,I32_MAX)
    integer(state['rngState'],'entry RNG state',0,0xffffffff)
    if type(state['appliedCommands']) is not list: raise ValueError('appliedCommands list required')
    seen=set()
    for row in state['appliedCommands']:
        exact_keys(row, {'id','sha256'}, 'applied command');text(row['id'],'applied ID')
        if type(row['sha256']) is not str or len(row['sha256'])!=64 or any(c not in '0123456789abcdef' for c in row['sha256']):
            raise ValueError('applied digest')
        if row['id'] in seen: raise ValueError('duplicate applied ID')
        seen.add(row['id'])
    for name, keys, high in (
        ('persons',PERSON_KEYS,1099),
        ('buildings',{'id','valid','kind','legionId','subtypeValid'},16383),
        ('legions',{'id','valid','forceId'},46),
        ('forces',{'id','valid','field128'},46)):
        if type(state[name]) is not list: raise ValueError(name+' list required')
        seen=set()
        for row in state[name]:
            exact_keys(row,keys,name);integer(row['id'],name+' ID',0,high);boolean(row['valid'],name+' valid')
            if row['id'] in seen: raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])
    for p in state['persons']:
        boolean(p['allocated'],'allocated');boolean(p['acted'],'acted')
        if p['valid'] and not p['allocated']: raise ValueError('valid person must be allocated')
        for k in ('status','homeBaseId','locationId','rawLegionId','missionId'): integer(p[k],k,I32_MIN,I32_MAX)
        integer(p['flags124'],'flags124',0,0xffffffff);integer(p['missionDuration'],'duration byte',0,255)
        if p['acted']!=bool(p['flags124']&1): raise ValueError('acted must match flags124 bit0')
        if type(p['missionArgs']) is not list or len(p['missionArgs'])!=5: raise ValueError('five mission args required')
        for a in p['missionArgs']: integer(a,'mission arg',I32_MIN,I32_MAX)
    for b in state['buildings']:
        integer(b['kind'],'building kind',I32_MIN,I32_MAX);integer(b['legionId'],'building legion',I32_MIN,I32_MAX)
        if b['subtypeValid'] is not None: boolean(b['subtypeValid'],'subtype valid')
    for r in state['legions']:
        integer(r['forceId'],'legion force',I32_MIN,I32_MAX)
        if r['valid'] and not 0<=r['forceId']<=46: raise ValueError('valid legion requires numeric force0..46')
    for r in state['forces']: integer(r['field128'],'force field128',I32_MIN,I32_MAX)
    exact_keys(command,{'id','expectedRevision','personId','targetBuildingId','showNotice','noticeVariant'},'officer return command')
    text(command['id'],'command ID');integer(command['expectedRevision'],'expected revision',0,I32_MAX)
    integer(command['personId'],'person ID',0,1099)
    integer(command['targetBuildingId'],'target building ID',-1,16383)
    integer(command['showNotice'],'showNotice',I32_MIN,I32_MAX);integer(command['noticeVariant'],'noticeVariant',I32_MIN,I32_MAX)
    if command['personId'] not in _index(state,'persons'): raise ValueError('person slot observation required')
    exact_keys(observations,{'source','provenance','noticeEligible','actualTroopMember','oldLegionRosterContains','targetForceId'},'officer return observations')
    if observations['source']!=state['source']: raise ValueError('observation source mismatch')
    text(observations['provenance'],'observation provenance')
    if observations['targetForceId'] is not None: integer(observations['targetForceId'],'observed target force',I32_MIN,I32_MAX)
    for k in ('noticeEligible','actualTroopMember','oldLegionRosterContains'):
        if observations[k] is not None: boolean(observations[k],k)
    exact_keys(policy,{'id','ruleset','unknownEffects','provenance','callbackAssumption','pointerDomain'},'officer return policy')
    for k in ('id','provenance'): text(policy[k],'policy '+k)
    if policy['ruleset'] not in ('PC-PK1.1','PC-Vanilla-assumed'): raise ValueError('separate ruleset required')
    if policy['unknownEffects'] not in ('record-only','reject'): raise ValueError('unknown-effects policy')
    if policy['callbackAssumption']!='noninterference-v1': raise ValueError('explicit callback noninterference required')
    if policy['pointerDomain']!='array-slots-v1': raise ValueError('explicit array pointer domain required')


def _base_id(building):
    if building is None: return -1
    i,k=building['id'],building['kind']
    return i if (k==0 and 0<=i<=41) or (k==1 and 42<=i<=51) or (k==2 and 52<=i<=86) else -1


def _roster(building):
    if _base_id(building)<0: return None
    if building['subtypeValid'] is None: raise ValueError('observed building subtype valid required')
    if not building['subtypeValid']: return None
    return dict(buildingId=building['id'],kind=building['kind'],offset='0xB4' if building['kind']==0 else '0x70')


def _required(observations, name):
    value=observations[name]
    if value is None: raise ValueError('observed '+name+' required')
    return value


def _plan(state, command, observations):
    """Preflight every reached dependency before _apply or any scalar write."""
    p=_index(state,'persons')[command['personId']]
    plan={'route':'return','oldStatus':p['status']}
    if not p['valid']: return dict(plan,route='invalid-actor-no-op')
    buildings=_index(state,'buildings');legions=_index(state,'legions');forces=_index(state,'forces')
    target=_slot(buildings,command['targetBuildingId'],16383,'target building')
    if not _valid(target): return dict(plan,route='invalid-target-no-op')
    old_home=_slot(buildings,p['homeBaseId'],16383,'old home building')
    old_legion=_slot(legions,p['rawLegionId'],46,'old legion')
    old_force_id=old_legion['forceId'] if _valid(old_legion) else -1
    # Generic building +40 has facility/territory branches, unlike the
    # person getter; keep its reached result as a source-bound observation.
    target_force_id=_required(observations,'targetForceId') if p['status']==0 or 0<=old_force_id<=46 else None
    notice_eligible=_required(observations,'noticeEligible') if command['showNotice']!=0 else False
    plan.update(oldHomeId=p['homeBaseId'],oldLegionId=p['rawLegionId'],oldForceId=old_force_id,
        targetForceId=target_force_id,noticeEligible=notice_eligible,
        notice=notice_eligible and p['status']!=5)
    if p['status']==0 and old_force_id==target_force_id:
        force=_slot(forces,old_force_id,46,'old force')
        if _valid(force) and force['field128']==0: return dict(plan,route='unsupported-ruler-ownership')
    # 004A31E0 resolves both home subobjects even if the old building is invalid.
    plan['oldHomeRoster']=_roster(old_home);plan['targetHomeRoster']=_roster(target)
    plan['troopMember']=_required(observations,'actualTroopMember') if 87<=p['locationId']<=1086 else False
    plan['newLocationId']=_base_id(target)
    plan['affiliationGate']=0<=old_force_id<=46 and old_force_id==target_force_id
    if plan['affiliationGate']:
        requested=target['legionId'] if plan['targetHomeRoster'] else -1
        target_legion=_slot(legions,requested,46,'target legion')
        plan['targetLegionId']=requested
        plan['oldLegionValid']=_valid(old_legion)
        plan['oldLegionRosterContains']=_required(observations,'oldLegionRosterContains') if _valid(old_legion) else False
        plan['newLegionValid']=_valid(target_legion)
        plan['reconcileOldLegion']=p['status']<=1 and _valid(old_legion) and p['rawLegionId']!=requested
        old_home_legion=old_home['legionId'] if plan['oldHomeRoster'] else -1
        plan['oldHomeValid']=_valid(old_home)
        plan['oldHomeLegionId']=old_home_legion
        plan['reconcileOldHome']=_valid(old_home) and old_home_legion!=requested
    return plan


def _apply(after, command, plan, step, record):
    p=_index(after,'persons')[command['personId']];target=_index(after,'buildings')[command['targetBuildingId']]
    step('004BF6F0/save',oldStatus=plan['oldStatus'],oldHomeId=plan['oldHomeId'],oldLegionId=plan['oldLegionId'],targetBuildingId=target['id'])
    record('00486890/00490B00','target governor lookup result unused; getter/UI effects not executed',targetBuildingId=target['id'],resultUsed=False)
    if command['showNotice']!=0:
        step('0047A6D0',noticeEligible=plan['noticeEligible'])
        if plan['noticeEligible']: step('00488C70',captive=p['status']==5)
    if plan['notice']:
        record('004B93D0','notice text formatter not executed',messageId=0x175d,arguments=[0x175d,p['id'],target['id'],command['noticeVariant']])
        record('004F55E0','notice display not executed',arguments=['unexecuted-formatted-text',target['id'],1,-1])
    step('0047B2B0/virtual+40',callSite='004BF7CD',personForceId=plan['oldForceId'])
    step('00490AA0',forceId=plan['oldForceId'],purpose='save-old-force-pointer')
    step('00488C00',ruler=p['status']==0)
    if p['status']==0:
        step('0047B2B0/virtual+40',callSite='004BF7EE',personForceId=plan['oldForceId'])
        step('00487EB0/virtual+40',callSite='004BF7F7',targetForceId=plan['targetForceId'],observed=True)
    step('004BF7C8/force-gate',ruler=p['status']==0,ownershipCall=False)
    step('004A31E0/entry',allocated=p['allocated'],requestedHomeId=target['id'])
    if plan['oldHomeRoster']:
        record('004A2CB0','old home roster find/remove not executed',personId=p['id'],roster=plan['oldHomeRoster'])
    p['homeBaseId']=target['id'];step('004A3272',field='homeBaseId',value=p['homeBaseId'],person=copy.deepcopy(p))
    if plan['targetHomeRoster']:
        record('0047C1B0','new home roster append not executed',personId=p['id'],roster=plan['targetHomeRoster'])
        record('0047CD50','new home roster sort not executed',roster=plan['targetHomeRoster'],arguments=[1,0,0,0])
    step('004891C0',locationId=p['locationId'],actualTroopMember=plan['troopMember'])
    if not plan['troopMember']:
        step('00486680',buildingId=target['id'],kind=target['kind'],baseId=plan['newLocationId'])
        p['locationId']=plan['newLocationId'];step('004A0CB0',field='locationId',value=p['locationId'],person=copy.deepcopy(p))
        record('004B9480','location/UI callback not executed',personId=p['id'])
    step('0047B2B0/virtual+40',callSite='004BF862',personForceId=plan['oldForceId'])
    if 0<=plan['oldForceId']<=46:
        step('0047B2B0/virtual+40',callSite='004BF87A',personForceId=plan['oldForceId'])
        step('00487EB0/virtual+40',callSite='004BF883',targetForceId=plan['targetForceId'],observed=True)
    step('004BF85E/affiliation-gate',personForceId=plan['oldForceId'],targetForceId=plan['targetForceId'],passed=plan['affiliationGate'],forceObjectValidityGate=False)
    if not plan['affiliationGate']: return
    requested=plan['targetLegionId']
    step('004867D0/virtual+44',callSite='004BF892',targetLegionId=requested)
    step('004A32F0/entry',allocated=p['allocated'],requestedLegionId=requested)
    if plan['oldLegionValid']:
        record('00482AF0','old legion roster search observed, not executed',legionId=p['rawLegionId'],personId=p['id'],found=plan['oldLegionRosterContains'],arguments=[p['id'],0])
        if plan['oldLegionRosterContains']:
            record('00482FC0','old legion roster erase not executed',legionId=p['rawLegionId'],personId=p['id'])
    if requested==-1 or 0<=requested<=46:
        p['rawLegionId']=requested;step('004A3355',field='rawLegionId',value=requested,person=copy.deepcopy(p))
        if 0<=requested<=46:
            p['flags124']|=1<<9;step('00489E70/00472520',bit=9,value=True,flags124=p['flags124'],person=copy.deepcopy(p))
    if plan['newLegionValid']:
        record('0047C1B0','new legion roster append not executed',legionId=requested,personId=p['id'])
        record('0047CD50','new legion roster sort not executed',legionId=requested,arguments=[1,0,0,0])
    step('004867D0/virtual+44',callSite='004BF8A2',targetLegionId=requested)
    if plan['reconcileOldLegion']:
        record('004BE2A0','old legion complete role reconciliation not executed',legionId=plan['oldLegionId'],refreshFlag=0,subject='old')
    record('004BE2A0','new legion complete role reconciliation not executed',legionId=requested,refreshFlag=0,subject='new',legionValid=plan['newLegionValid'])
    if plan['oldHomeValid']:
        step('004867D0/virtual+44',callSite='004BF8F7',targetLegionId=requested)
        step('004867D0/virtual+44',callSite='004BF900',oldHomeId=plan['oldHomeId'],oldHomeLegionId=plan['oldHomeLegionId'])
    if plan['reconcileOldHome']:
        record('004BCA30','old home complete governor reconciliation not executed',buildingId=plan['oldHomeId'],refreshFlag=0)


def project_officer_return(state, command, observations, policy):
    """Atomic separate scalar API; accepted never means complete source return."""
    validate(state,command,observations,policy)
    result=dict(schemaVersion=1,profileId=PROFILE_ID,source=state['source'],accepted=False,replayed=False,
        reason=None,before=copy.deepcopy(state),after=copy.deepcopy(state),command=copy.deepcopy(command),
        observations=copy.deepcopy(observations),policy=copy.deepcopy(policy),plan=None,steps=[],unknownEffects=[],
        rng=dict(kind='zero-local-calls',initialState=state['rngState'],finalState=state['rngState'],calls=[],consumed=0,unexecutedCallbacksCovered=False),
        evidence=dict(sourceLocalOnly=True,stockVerified=False,vanillaVerified=False,completeGameTransaction=False,
            fullReturnExecuted=False,callbacksExecuted=False,rostersExecuted=False,roleReconciliationExecuted=False,
            runtimeStatus='compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption',
            observationProvenance=observations['provenance'],callbackAssumption=policy['callbackAssumption']))
    def finish(): result['traceHash']=_digest(result);return result
    digest=_digest(command)
    prior=next((r for r in state['appliedCommands'] if r['id']==command['id']),None)
    if prior:
        result['replayed']=prior['sha256']==digest;result['accepted']=result['replayed']
        result['reason']='replay' if result['replayed'] else 'replay-payload-conflict';return finish()
    if state['revision']!=command['expectedRevision']: result['reason']='revision-conflict';return finish()
    if state['revision']==I32_MAX: raise ValueError('revision exhausted')
    plan=_plan(state,command,observations);result['plan']=copy.deepcopy(plan);result['reason']=plan['route']
    if plan['route'].startswith('unsupported-'): return finish()
    after=copy.deepcopy(state)
    def step(helper,**details): result['steps'].append(dict(helper=helper,**copy.deepcopy(details)))
    def record(helper,reason,**details):
        result['unknownEffects'].append(dict(helper=helper,reason=reason,beforeStepIndex=len(result['steps']),snapshot=copy.deepcopy(after),**copy.deepcopy(details)))
    step('0047A630',subject='actor',passed=plan['route']!='invalid-actor-no-op')
    if plan['route']!='invalid-actor-no-op': step('0047A630',subject='target',passed=plan['route']!='invalid-target-no-op')
    if plan['route']=='return': _apply(after,command,plan,step,record)
    if result['unknownEffects'] and policy['unknownEffects']=='reject':
        result['steps']=[];result['reason']='unknown-effects-rejected';return finish()
    after['revision']+=1;after['appliedCommands'].append(dict(id=command['id'],sha256=digest))
    result['after']=after;result['accepted']=True;return finish()


def replay_officer_return(trace):
    if type(trace) is not dict: raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=_digest(value): raise ValueError('trace hash mismatch')
    try: result=project_officer_return(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error: raise ValueError('invalid trace inputs') from error
    if result!=trace: raise ValueError('trace replay mismatch')
    return result
