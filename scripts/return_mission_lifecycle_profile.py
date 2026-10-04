"""P0-56 source-local mission37 completion and one observed list-member step.

This is NOT a scheduler: membership/order and external acted resets are not
invented. Source callbacks are recorded under explicit noninterference, and
only valid canonical homes are accepted for dereferencing completion routes.
Earlier cancellation APIs and trace versions are unchanged.
"""
from __future__ import annotations
import copy
import mission_cancellation_v2_profile as core
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text
from capture_relocation_profile import source_data

PROFILE_ID='source-idb-S1-S2-return-mission-lifecycle-v1'
DISTANCE_HASHES={
    'S1':'deda8ff7828a2c42df89457adcec1b36df55f7ff78337be347e94698dc6b3e8f',
    'S2':'edd622ed95be439d7a5eee27fc429937e5224a1dd0fa296859e95863eee667ff'}


def city_distance(source, origin, target):
    """Source-selected 0047B480 row-major unsigned byte table, never RNG."""
    if source not in DISTANCE_HASHES:raise ValueError('source S1/S2 required')
    integer(origin,'origin city',-1,41);integer(target,'target city',-1,41)
    if origin<0 or target<0:return -1
    raw=source_data(source+'-0079B830.data.txt',1764,DISTANCE_HASHES[source])
    return raw[origin*42+target]


def validate(state,command,observations,policy):
    exact_keys(state,{'source','revision','appliedCommands','persons','bases','forces','rngState'},'return mission state')
    integer(state['rngState'],'entry RNG state',0,0xffffffff)
    exact_keys(command,{'id','expectedRevision','personId','kind'},'return mission command')
    if command['kind'] not in ('complete','advance'):raise ValueError('return mission kind')
    exact_keys(policy,{'id','ruleset','unknownEffects','provenance','callbackAssumption','homeDomain','memberSelection'},'return mission policy')
    if policy['callbackAssumption']!='noninterference-v1':raise ValueError('explicit callback noninterference required')
    if policy['homeDomain']!='valid-canonical-only-v1':raise ValueError('explicit bounded home domain required')
    if policy['memberSelection']!='supplied-node-v1':raise ValueError('explicit supplied-node boundary required')
    # Reuse the established strict scalar representation without changing its
    # contract. Only the new API accepts raw generic-building home references.
    basic={k:copy.deepcopy(v) for k,v in state.items() if k!='rngState'}
    if type(basic['persons']) is not list:raise ValueError('persons list required')
    for p in basic['persons']:
        exact_keys(p,core.PERSON_KEYS,'return mission person')
        integer(p['homeBaseId'],'raw home reference',-1,16383)
        p['homeBaseId']=-1
    core.validate(basic,{k:v for k,v in command.items() if k!='kind'},
        dict(provenance='structural validation',returnDistance=None,s2Skill267=None,targetBuildings=[],targetCities=[]),
        {k:v for k,v in policy.items() if k not in ('callbackAssumption','homeDomain','memberSelection')})
    exact_keys(observations,{'source','provenance','globalStop','territories','cities'},'return mission observations')
    if observations['source']!=state['source']:raise ValueError('observation source mismatch')
    text(observations['provenance'],'observations provenance')
    if observations['globalStop'] is not None:boolean(observations['globalStop'],'global stop flag')
    for name,keys,hi in [('territories',{'id','cityId'},86),('cities',{'id','valid','neighbors'},41)]:
        if type(observations[name]) is not list:raise ValueError(name+' list required')
        seen=set()
        for row in observations[name]:
            exact_keys(row,keys,name);integer(row['id'],name+' ID',0,hi)
            if row['id'] in seen:raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])
            if name=='territories':integer(row['cityId'],'territorial city',-1,41)
            else:
                boolean(row['valid'],'city subtype valid')
                if row['neighbors'] is not None:
                    if type(row['neighbors']) is not list or len(row['neighbors'])!=6:raise ValueError('six neighbor slots required')
                    for n in row['neighbors']:integer(n,'raw neighbor city',-2**31,2**31-1)


def _territory(base_id,bases,observations):
    base=core._lookup(bases,base_id,86,'building')
    if not base:return -1
    rows={r['id']:r['cityId'] for r in observations['territories']}
    if base_id not in rows:raise ValueError('missing observed territorial city for base '+str(base_id))
    return rows[base_id]


def _plan(state,command,observations):
    """Resolve ALL reached observations before any scalar writer is called."""
    p=core._index(state,'persons')[command['personId']];bases=core._index(state,'bases')
    plan={'route':'complete','capacity':None,'neighborScores':[]}
    if command['kind']=='advance':
        if observations['globalStop'] is None:raise ValueError('observed global stop flag required')
        if observations['globalStop']:return dict(plan,route='global-stop-no-op')
        if not p['valid'] or not 0<=p['missionId']<=43 or p['acted']:
            return dict(plan,route='active-filter-no-op')
    elif not p['valid']:return dict(plan,route='invalid-actor-no-op')
    if p['missionId']!=37:return dict(plan,route='unsupported-mission')
    home=p['homeBaseId']
    # An out-of-range route target takes the non-routed duration branch. A
    # positive duration only waits; no decrement occurs in this person pass.
    if command['kind']=='advance' and home<0 and p['missionDuration']!=0:
        return dict(plan,route='nonrouted-duration-wait')
    if not 0<=home<=86:return dict(plan,route='unsupported-home-domain')
    base=core._lookup(bases,home,86,'home building')
    if not base:return dict(plan,route='unsupported-home-domain')
    if command['kind']=='advance':
        target=_territory(home,bases,observations)
        if target<0:return dict(plan,route='unsupported-target-geography')
        location=p['locationId'] if 0<=p['locationId']<=86 else -1
        current=_territory(location,bases,observations)
        plan.update(targetCity=target,currentCity=current,homeId=home)
        if current==target:next_city=target
        else:
            cities={r['id']:r for r in observations['cities']}
            city=core._lookup(cities,current,41,'current city subtype')
            next_city=-1;best=2**31-1
            if city:
                if city['neighbors'] is None:raise ValueError('observed six neighbor slots required')
                for slot,neighbor in enumerate(city['neighbors']):
                    if not 0<=neighbor<=41:continue
                    distance=city_distance(state['source'],neighbor,target)
                    choose=distance<best
                    plan['neighborScores'].append(dict(slot=slot,cityId=neighbor,distance=distance,selected=choose))
                    if choose:best=distance;next_city=neighbor
        plan['nextCity']=next_city
        if next_city<0:return dict(plan,route='no-next-city-reset')
        if next_city!=target:
            return dict(plan,route='move-one-city',distance=city_distance(state['source'],next_city,target))
        plan['route']='arrival-completion'
    if p['missionArgs'][0]>0:
        if not base['resourceValid']:return dict(plan,route='unsupported-home-resource')
        force=core._lookup(core._index(state,'forces'),base['forceId'],46,'home force') if base['kind'] else None
        plan['capacity']=core.money_capacity(state['source'],base['kind'],force is not None,
                         force['query33'] if force else False,force['query38'] if force else False)
    return plan


def _reset_mission(person,step):
    person['missionId']=-1;person['missionArgs']=[0]*5
    step('004A5780',personId=person['id'],missionId=-1,missionArgs=[0]*5,person=copy.deepcopy(person))


def _duration(person,value,step,helper='004A5660'):
    person['missionDuration']=value&255
    step(helper,personId=person['id'],missionDuration=person['missionDuration'],person=copy.deepcopy(person))


def _completion(after,person,plan,step,record):
    base=core._index(after,'bases')[person['homeBaseId']]
    record('005B9B90/virtual+44',
           'person/home virtual legion reads have unused results; transitive callbacks not executed',
           personId=person['id'],homeBaseId=base['id'],legionEqualityGate=False)
    refund=person['missionArgs'][0]
    step('004897B0',argumentIndex=0,value=refund,positive=refund>0)
    if refund>0:
        if base['kind']:
            record('0048D820/00483660','subtype force/query reads represented by stable observations; dispatch not executed',baseId=base['id'])
        old=base['money'];base['money']=core.money_after_refund(old,refund,plan['capacity'])
        step('004AE2A0',personId=person['id'],baseId=base['id'],requestedRefund=refund,
             capacity=plan['capacity'],beforeMoney=old,afterMoney=base['money'],actualDelta=base['money']-old,
             person=copy.deepcopy(person))
    _reset_mission(person,step)
    _duration(person,0,step)
    step('005B9B90',returnValue=1)


def _apply(after,person,plan,step,record):
    route=plan['route']
    if route=='no-next-city-reset':
        _reset_mission(person,step)
        return
    if route in ('move-one-city','arrival-completion'):
        destination=plan['nextCity'] if route=='move-one-city' else person['homeBaseId']
        # In this bounded domain valid implies allocated, and canonical actual
        # location implies 004891C0=false. Invalid actual location cannot select
        # a next city. All 004A0CF0/00488350 guards are therefore preserved.
        person['locationId']=destination
        step('004A0CF0/00488350/004A0CB0',personId=person['id'],targetId=destination,
             allocated=True,troopMember=False,locationId=destination,person=copy.deepcopy(person))
        record('004B9480','location/UI callback not executed',personId=person['id'])
        if route=='move-one-city':
            person['acted']=True
            step('00489B40',personId=person['id'],acted=True,person=copy.deepcopy(person))
            record('004A06A0/004B9480','acted/cache/UI callbacks not executed',personId=person['id'])
            _duration(person,plan['distance'],step)
            return
        _duration(person,0,step)
        step('005B9E10',phase='enter',missionId=37,dispatchTarget='005B9B90')
    _completion(after,person,plan,step,record)
    if route=='arrival-completion':
        step('005B9E10',phase='exit',returnValue=0,temporaryActorCleared=True)
        # canonical home was valid and movement wrote that exact ID. Captive
        # skips return-home but still receives direct acted/duration resets.
        if person['status']!=5:
            record('004BF6F0','full home/legion/bit9/roster/role/force/notice return not executed',
                   personId=person['id'],arguments=[person['id'],person['locationId'],1,1])
        person['acted']=False
        step('00489B40',personId=person['id'],acted=False,viaS2Query267Hook=False,person=copy.deepcopy(person))
        record('004A06A0/004B9480','acted/cache/UI callbacks not executed',personId=person['id'])
        _duration(person,0,step,helper='0048A8B0')


def project_return_mission(state,command,observations,policy):
    """Atomic independent trace; complete=helper, advance=one observed member.

    advance applies the live active getter scalar filters, but assumes this
    person is a supplied node. It does not manufacture membership or reorder
    the linked list, reset acted, decrement time, or process other missions.
    """
    validate(state,command,observations,policy)
    result={'schemaVersion':1,'profileId':PROFILE_ID,'source':state['source'],
        'accepted':False,'replayed':False,'reason':None,'before':copy.deepcopy(state),
        'after':copy.deepcopy(state),'command':copy.deepcopy(command),
        'observations':copy.deepcopy(observations),'policy':copy.deepcopy(policy),
        'steps':[],'unknownEffects':[],'plan':None,
        'rng':{'kind':'zero-local-calls','initialState':state['rngState'],'finalState':state['rngState'],
               'calls':[],'consumed':0,'unexecutedCallbacksCovered':False},
        'evidence':{'sourceLocalOnly':True,'stockVerified':False,'vanillaVerified':False,
            'completeGameTransaction':False,'wholeActiveListExecuted':False,'schedulerExecuted':False,
            'callbacksExecuted':False,'listMembershipVerified':False,'runtimeStatus':'compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption',
            'observationProvenance':observations['provenance'],'callbackAssumption':policy['callbackAssumption']}}
    def finish():
        result['traceHash']=core._digest(result);return result
    digest=core._digest(command)
    prior=next((x for x in state['appliedCommands'] if x['id']==command['id']),None)
    if prior:
        result['replayed']=prior['sha256']==digest;result['accepted']=result['replayed']
        result['reason']='replay' if result['replayed'] else 'replay-payload-conflict';return finish()
    if state['revision']!=command['expectedRevision']:
        result['reason']='revision-conflict';return finish()
    if state['revision']==2**31-1:raise ValueError('revision exhausted')
    plan=_plan(state,command,observations);result['plan']=copy.deepcopy(plan);result['reason']=plan['route']
    if plan['route'].startswith('unsupported-'):return finish()
    after=copy.deepcopy(state);person=core._index(after,'persons')[command['personId']]
    def step(helper,**details):result['steps'].append(dict(helper=helper,**details))
    def record(helper,reason,**details):
        result['unknownEffects'].append(dict(helper=helper,reason=reason,beforeStepIndex=len(result['steps']),
                                             snapshot=copy.deepcopy(after),**details))
    if command['kind']=='advance':
        step('00599E12',globalStop=observations['globalStop'])
        if not observations['globalStop']:
            step('00482F20',personId=person['id'],valid=person['valid'],missionId=person['missionId'],
                 acted=person['acted'],membershipAssumption=policy['memberSelection'],wholeListExecuted=False)
    if plan['route']=='invalid-actor-no-op':step('005B9B90',valid=False,returnValue=1)
    elif plan['route'] not in ('global-stop-no-op','active-filter-no-op','nonrouted-duration-wait'):
        if command['kind']=='advance':
            step('005BA320',missionId=37,targetBase=person['homeBaseId'],targetCity=plan['targetCity'])
            step('00598D60',currentCity=plan['currentCity'],targetCity=plan['targetCity'],
                 nextCity=plan['nextCity'],neighborScores=copy.deepcopy(plan['neighborScores']))
        _apply(after,person,plan,step,record)
    if result['unknownEffects'] and policy['unknownEffects']=='reject':
        result['steps']=[];result['reason']='unknown-effects-rejected';return finish()
    after['revision']+=1;after['appliedCommands'].append(dict(id=command['id'],sha256=digest))
    result['after']=after;result['accepted']=True;return finish()


def replay_return_mission(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=core._digest(value):raise ValueError('trace hash mismatch')
    try:result=project_return_mission(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
