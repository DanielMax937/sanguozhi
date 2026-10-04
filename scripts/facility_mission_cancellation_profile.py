"""P0-54 source-local mission0/38 cancellation and bounded facility destruction.

Concrete building slots retain all 0x38 raw bytes; only witnessed-width stores
are applied. Unexecuted callbacks explicitly assume noninterference. City/base
(type0..2) destruction is deferred or rejected, never called a complete result.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text
import mission_cancellation_v2_profile as core
from group_mission_cancellation_profile import collect_group, _preflight_returns, _return_zero

PROFILE_ID='source-idb-S1-S2-facility-mission-cancellation-v1'
HANDLERS={0:'005BBE30',38:'005D69D0'}
BUILDING_VTABLE=0x0079C718
RESET_STORES=((8,4,-1),(12,4,-1),(16,2,0),(20,4,0),(24,4,0),
              (28,1,0),(30,2,-1),(32,2,-1),(40,4,0),(44,4,0))
COUNTER_INDEX={33:0,34:1,35:2,36:3,37:4,54:0,55:0,56:1,57:1,58:2,59:2}


def raw_read(raw,offset,width,signed=False):
    return int.from_bytes(bytes(raw[offset:offset+width]),'little',signed=signed)


def building_type(building):return raw_read(building['raw'],8,4,True)
def building_valid(building):return building['pointerReadable'] and 0<=building_type(building)<=63


def reset_raw_building(raw):
    """00486430: exact little-endian byte widths; all other bytes survive."""
    out=raw[:]
    for offset,width,value in RESET_STORES:
        out[offset:offset+width]=list((value%(1<<(8*width))).to_bytes(width,'little'))
    return out


def home_reference_candidates(persons,source):
    """004CF270(mask63): allocated, statuses0..5, source exclusions, force."""
    if source not in ('S1','S2'):raise ValueError('source S1/S2 required')
    lo,hi=(700,799) if source=='S1' else (704,753)
    return [p['id'] for p in sorted(persons,key=lambda p:p['id'])
            if p['allocated'] and 0<=p['status']<=5 and not lo<=p['id']<=hi
            and not 42<=p['forceId']<=46]


def validate(state,command,observations,policy):
    exact_keys(state,{'source','revision','appliedCommands','personsComplete','persons',
                      'buildings','cities','forces','buildingTypes','treasures'},'facility state')
    if state['personsComplete'] is not True:raise ValueError('complete sparse person universe required')
    if type(state['persons']) is not list:raise ValueError('persons list required')
    people=[]
    for p in state['persons']:
        exact_keys(p,core.PERSON_KEYS|{'forceId'},'facility person')
        integer(p['forceId'],'person virtual+40 force',-1,46)
        integer(p['homeBaseId'],'person raw home reference',-1,16383)
        q=copy.deepcopy(p);q.pop('forceId');q['homeBaseId']=-1;people.append(q)
    exact_keys(policy,{'id','ruleset','unknownEffects','provenance','callbackAssumption','baseTargets'},'facility policy')
    if policy['callbackAssumption']!='noninterference-v1':raise ValueError('explicit callback noninterference assumption required')
    if policy['baseTargets'] not in ('defer','reject'):raise ValueError('baseTargets defer/reject required')
    core_policy={k:v for k,v in policy.items() if k not in ('callbackAssumption','baseTargets')}
    exact_keys(observations,{'provenance','perPerson','perBuilding'},'facility observations')
    text(observations['provenance'],'observations provenance')
    basic={k:copy.deepcopy(state[k]) for k in ('source','revision','appliedCommands')}
    basic.update(persons=people,bases=[],forces=[])
    core.validate(basic,command,dict(provenance=observations['provenance'],returnDistance=None,
                                   s2Skill267=None,targetBuildings=[],targetCities=[]),core_policy)
    def rows(container,name,keys,maximum,has_valid=True):
        if type(container[name]) is not list:raise ValueError(name+' list required')
        seen=set()
        for row in container[name]:
            exact_keys(row,keys,name);integer(row['id'],name+' ID',0,maximum)
            if row['id'] in seen:raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])
            if has_valid:boolean(row['valid'],name+' valid')
    rows(state,'buildings',{'id','pointerReadable','raw'},16383,False)
    for b in state['buildings']:
        boolean(b['pointerReadable'],'building pointer readable')
        if type(b['raw']) is not list or len(b['raw'])!=0x38:raise ValueError('building raw0x38 required')
        for v in b['raw']:integer(v,'building raw byte',0,255)
        if raw_read(b['raw'],0,4)!=BUILDING_VTABLE:raise ValueError('concrete building vtable required')
    rows(state,'cities',{'id','valid','rawCountersA8AC'},41)
    for c in state['cities']:
        if type(c['rawCountersA8AC']) is not list or len(c['rawCountersA8AC'])!=5:raise ValueError('five raw city bytes required')
        for v in c['rawCountersA8AC']:integer(v,'raw city byte',0,255)
    rows(state,'forces',{'id','valid'},46)
    rows(state,'buildingTypes',{'id','valid','classB4','rawCostCA'},63)
    for t in state['buildingTypes']:
        integer(t['classB4'],'building type classB4',-2**31,2**31-1)
        integer(t['rawCostCA'],'type-data byteCA',0,255)
    rows(state,'treasures',{'id','valid','ownerId','cityId','state'},99)
    for t in state['treasures']:
        for k in ('ownerId','cityId','state'):integer(t[k],'treasure raw '+k,-2**31,2**31-1)
    rows(observations,'perPerson',{'id','returnDistance','s2Skill267'},1099,False)
    for p in observations['perPerson']:
        if p['returnDistance'] is not None:integer(p['returnDistance'],'observed return distance',-1,255)
        if p['s2Skill267'] is not None:boolean(p['s2Skill267'],'observed query267')
    rows(observations,'perBuilding',{'id','forceId','territorialCityId'},16383,False)
    for b in observations['perBuilding']:
        integer(b['forceId'],'observed building virtual+40 force',-1,46)
        integer(b['territorialCityId'],'observed territorial city',-1,41)


def _slot(table,key,maximum,label):
    if not 0<=key<=maximum:return None
    if key not in table:raise ValueError('missing observed '+label+' slot '+str(key))
    return table[key]


def _building(table,key,label):
    row=_slot(table,key,16383,label)
    return row if row is not None and building_valid(row) else None


def _preflight_destruction(after,target,observations):
    """Validate only needed scalar branches before any return/reset writes."""
    typ=building_type(target)
    if typ<=2:return None
    definition=_slot(core._index(after,'buildingTypes'),typ,63,'building type')
    dependencies=_slot({b['id']:b for b in observations['perBuilding']},target['id'],16383,'building dependencies')
    city=force=None
    if definition['classB4']==4:
        city=core._lookup(core._index(after,'cities'),dependencies['territorialCityId'],41,'territorial city subtype')
    else:
        force=core._lookup(core._index(after,'forces'),dependencies['forceId'],46,'building force')
    return dict(definition=definition,dependencies=dependencies,city=city,force=force)


def _treasure_tail(t,step):
    owner=t['ownerId'];in_range=0<=owner<=1099
    step('00490B30/+40',treasureId=42,ownerId=owner,ownerInPersonRange=in_range,personValidityChecked=False)
    if in_range:return
    step('004A0F00/0047A630',treasureId=42,valid=t['valid'])
    if not t['valid']:return
    t['ownerId']=-1;t['cityId']=-1
    step('00484DE0',treasure=copy.deepcopy(t),oldOwnerId=owner,arguments=[-1,-1])
    return owner


def _destroy(after,target,context,step,record):
    typ=building_type(target);definition=context['definition'];city=context['city'];force=context['force']
    step('004B09B0',buildingId=target['id'],arguments=[target['id'],1],valid=True,building=copy.deepcopy(target))
    if raw_read(target['raw'],0x22,2)!=0xffff:
        record('00588D20','attachment cleanup not executed',buildingId=target['id'])
    # For type3..63 no type0 presentation/event12/city-owner force branch runs.
    domestic=definition['classB4']==4
    step('00487A30',buildingId=target['id'],classB4=definition['classB4'],domestic=domestic,
         typeDefinitionValid=definition['valid'])
    if domestic:
        index=COUNTER_INDEX.get(typ)
        construction=raw_read(target['raw'],0x14,4)
        decrement=city is not None and index is not None and ((after['source']=='S1' and typ>=54) or construction!=0)
        if decrement:
            old=city['rawCountersA8AC'][index];new=(old-1)&255;city['rawCountersA8AC'][index]=new
            step(f'{0x47B820+index*0x20:08X}',cityId=city['id'],byteOffset=0xA8+index,
                 requestedDelta=-1,before=old,after=new,city=copy.deepcopy(city))
        else:step('004B0ACD/switch',buildingId=target['id'],cityValid=city is not None,
                  buildingType=typ,constructionRaw=construction,decrement=False)
    elif force is not None and definition['valid']:
        record('004B6580/004B6460','force adjustment scalar/callbacks not executed',
               arguments=[force['id'],-definition['rawCostCA'],0],sourceTypeByteCA=definition['rawCostCA'])
    candidates=home_reference_candidates(after['persons'],after['source'])
    step('004CF270',mask=63,personIds=candidates,universe='complete sparse person IDs0..1099',usesAllocatedNotValid=True)
    people=core._index(after,'persons')
    for person_id in candidates:
        p=people[person_id]
        if p['homeBaseId']==target['id']:
            p['homeBaseId']=-1
            step('004B0C08',personId=person_id,oldHomeBaseId=target['id'],person=copy.deepcopy(p))
    record('004B06E0','pre-reset spatial/AI refresh not executed',arguments=[target['id'],1])
    record('004A1E40/004A2370','conditional world-list unlink not executed',buildingId=target['id'])
    step('00423230',arguments=[0],effect='RET4 no-op')
    for offset,width,value in RESET_STORES:
        old=target['raw'][offset:offset+width]
        target['raw'][offset:offset+width]=list((value%(1<<(8*width))).to_bytes(width,'little'))
        step('00486430',buildingId=target['id'],offset=offset,width=width,value=value,
             beforeBytes=old,afterBytes=target['raw'][offset:offset+width],building=copy.deepcopy(target))
    record('004B06E0','post-reset spatial/AI refresh not executed',arguments=[target['id'],1])


def _project(state,command,observations,policy):
    validate(state,command,observations,policy)
    result={'profileId':PROFILE_ID,'source':state['source'],'accepted':False,'replayed':False,'reason':None,
            'after':copy.deepcopy(state),'steps':[],'unknownEffects':[],'policy':copy.deepcopy(policy),
            'evidence':{'sourceLocalOnly':True,'stockVerified':False,'vanillaVerified':False,
                        'completeGameTransaction':False,'callbacksExecuted':False,'rngExecuted':False,
                        'runtimeStatus':'compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption',
                        'observationProvenance':observations['provenance'],
                        'callbackAssumption':policy['callbackAssumption']}}
    digest=core._digest(command)
    prior=next((x for x in state['appliedCommands'] if x['id']==command['id']),None)
    if prior:
        result['replayed']=prior['sha256']==digest;result['accepted']=result['replayed']
        result['reason']='replay' if result['replayed'] else 'replay-payload-conflict';return result
    if state['revision']!=command['expectedRevision']:result['reason']='revision-conflict';return result
    if state['revision']==2**31-1:raise ValueError('revision exhausted')
    after=copy.deepcopy(state);people=core._index(after,'persons');buildings=core._index(after,'buildings')
    actor=people[command['personId']];mission=actor['missionId'];target=None
    def step(helper,**kw):result['steps'].append(dict(helper=helper,**kw))
    def record(helper,reason,**kw):
        snapshot={'persons':copy.deepcopy(after['persons']),'target':copy.deepcopy(target),
                  'cities':copy.deepcopy(after['cities']),'treasures':copy.deepcopy(after['treasures'])}
        result['unknownEffects'].append(dict(helper=helper,reason=reason,beforeStepIndex=len(result['steps']),snapshot=snapshot,**kw))
    step('004A57B0',personId=actor['id'],allocated=actor['allocated'],missionId=mission)
    if not actor['allocated'] or not 0<=mission<=43:result['reason']='entry-gate-no-op'
    elif mission not in HANDLERS:result['reason']='unsupported-mission';return result
    else:
        step('005B9B40',handler=HANDLERS[mission],scratch=[-1,0,0])
        gate=actor['valid'];step('0047A630',subject='actor',passed=gate)
        if gate:
            location=actor['locationId'] if 0<=actor['locationId']<=86 else -1
            current=_building(buildings,location,'actor current building')
            gate=current is not None
            step('00490D00/0047A630',subject='current-building',effectiveLocationId=location,passed=gate)
            if gate:
                gate=building_type(current)==0
                step('current-building/+08',buildingType=building_type(current),requiredType=0,passed=gate)
        if not gate:
            step(HANDLERS[mission],returnValue=0);result['reason']='command-gate-no-op'
        else:
            args=actor['missionArgs'][:]
            selected=collect_group(after['persons'],0,args[1]) if mission==0 else [actor['id']]
            if mission==0:step('005B8250',missionId=0,groupId=args[1],argumentIndex=1,capacity=3,personIds=selected[:])
            target=_building(buildings,args[0],'target building')
            step('00490D00/0047A630',subject='target-building',targetId=args[0],passed=target is not None)
            if target is None:result['reason']='invalid-target-no-op'
            else:
                typ=building_type(target)
                if typ<=2 and policy['baseTargets']=='reject':
                    record('004B09B0','source-accepted base target outside bounded destruction',buildingId=target['id'],buildingType=typ)
                    result['steps']=[];result['reason']='base-target-rejected';return result
                obs={r['id']:r for r in observations['perPerson']}
                _preflight_returns(after,people,selected,obs)
                treasure=_slot(core._index(after,'treasures'),42,99,'treasure') if mission==0 and typ==30 else None
                context=_preflight_destruction(after,target,observations)
                record('005B81D0/004D0570/005C1A40/0063ADD0','conditional presentation not executed; assumed noninterfering',missionId=mission)
                for person_id in selected:
                    p=people[person_id];step('0047A630',subject='selected-person',personId=person_id,passed=p['valid'])
                    if p['valid']:_return_zero(after,p,obs,step,record)
                if treasure is not None:
                    old_owner=_treasure_tail(treasure,step)
                    if old_owner is not None:
                        if after['source']=='S2':step('008EA230',oldOwnerId=old_owner,resolvedPerson=False,personRefreshExecuted=False)
                        treasure['state']=0;step('00484E20',treasure=copy.deepcopy(treasure),argument=0)
                step('scratch[0]!=12',scratch0=-1,destroy=True)
                if context is None:
                    record('004B09B0','source-accepted base target destruction entirely deferred',buildingId=target['id'],buildingType=typ,arguments=[target['id'],1])
                    result['reason']='people-projected-base-destruction-deferred'
                else:
                    _destroy(after,target,context,step,record);result['reason']='facility-cancellation-projected'
            step(HANDLERS[mission],returnValue=1,personIds=selected[:],targetValid=target is not None)
    if result['unknownEffects'] and policy['unknownEffects']=='reject':
        result['steps']=[];result['reason']='unknown-effects-rejected';return result
    after['revision']+=1;after['appliedCommands'].append({'id':command['id'],'sha256':digest})
    result['accepted']=True;result['after']=after;return result


def project_facility_cancellation(state,command,observations,policy):
    result=_project(state,command,observations,policy)
    result.update(schemaVersion=1,before=copy.deepcopy(state),command=copy.deepcopy(command),observations=copy.deepcopy(observations))
    result['traceHash']=core._digest(result);return result


def replay_facility_cancellation(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=core._digest(value):raise ValueError('trace hash mismatch')
    try:result=project_facility_cancellation(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
