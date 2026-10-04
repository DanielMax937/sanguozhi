"""Bounded S1 004BBB00 detachment and its invalid-former/last-city callers.

Snapshots are conditional local projections with callbacks disabled, not full
force extinction. MOD-associated bytes are not independently verified stock.
"""
from __future__ import annotations
import copy
import capture_selector_profile as common
import capture_relocation_profile as relocation
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text, ids

PROFILE_ID='source-idb-30d33b44-personnel-detachment-v1'


def _index(state, name):return {x['id']:x for x in state[name]}
def _valid(table, key):return relocation._valid(table,key)
def force_of(person, legions):return relocation.force_of(person,legions)


def validate(state, command, context, policy):
    exact_keys(state,{'revision','appliedIds','persons','bases','legions','forces'},'state')
    integer(state['revision'],'revision',0,2**31-1)
    if type(state['appliedIds']) is not list:raise ValueError('appliedIds list')
    for x in state['appliedIds']:text(x,'applied id')
    if len(set(state['appliedIds']))!=len(state['appliedIds']):raise ValueError('duplicate applied ID')
    def rows(name, keys, maximum):
        if type(state[name]) is not list:raise ValueError(name+' list')
        seen=set()
        for row in state[name]:
            exact_keys(row,keys,name);integer(row['id'],name+' ID',0,maximum);boolean(row['valid'],'valid')
            if row['id'] in seen:raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])
        return seen
    rows('persons',relocation.PERSON_KEYS,1099)
    for p in state['persons']:
        for key,low,high in [('status',-1,8),('legionId',-1,46),('homeBaseId',-1,86),('locationId',-1,1086),
                              ('formerForceId',-1,46),('officeId',-1,80),('loyalty',0,255),('captiveMonths',0,100),
                              ('missionDuration',0,255),('missionId',-1,43),('forbiddenLordId',-1,1099),
                              ('forbiddenMonths',0,255),('rawF0',-(2**31),2**31-1)]:integer(p[key],key,low,high)
        boolean(p['acted'],'acted');boolean(p['troopMember'],'troopMember')
        if p['troopMember'] and p['locationId']<87:raise ValueError('troop member requires encoded location')
        if type(p['missionArgs']) is not list or len(p['missionArgs'])!=5:raise ValueError('five raw mission args')
        for value in p['missionArgs']:integer(value,'mission argument',-(2**31),2**31-1)
    bs=rows('bases',{'id','valid','legionId','territorialCityId','governorId'},86)
    if bs!=set(range(87)):raise ValueError('complete 87 base-slot observations required')
    for b in state['bases']:
        integer(b['legionId'],'base legion',-1,46);integer(b['territorialCityId'],'territory',-1,41);integer(b['governorId'],'governor',-1,1099)
        if b['id']<42 and not b['valid']:raise ValueError('bounded selector requires all 42 valid city slots')
    rows('legions',{'id','valid','forceId','ordinal','leaderId'},46)
    for g in state['legions']:
        integer(g['forceId'],'force ID',-1,46);integer(g['ordinal'],'ordinal',1,8);integer(g['leaderId'],'leader ID',-1,1099)
    rows('forces',{'id','valid','rulerId','advisorId'},46)
    for f in state['forces']:
        integer(f['rulerId'],'ruler ID',-1,1099);integer(f['advisorId'],'advisor ID',-1,1099)
    exact_keys(command,{'id','expectedRevision','kind','personIds','targetId','releaseFlag'},'command')
    text(command['id'],'command ID');integer(command['expectedRevision'],'expected revision',0,2**31-1)
    ids(command['personIds'],'person IDs',0,1099);boolean(command['releaseFlag'],'release flag')
    if command['kind'] not in ('detach','release-invalid-former-force','last-city-escape'):raise ValueError('command kind')
    if command['kind']=='last-city-escape':integer(command['targetId'],'capture target',0,86)
    elif command['targetId'] is not None or command['releaseFlag']:raise ValueError('unused capture context must be absent')
    exact_keys(context,{'troops','provenance'},'context');text(context['provenance'],'context provenance')
    if type(context['troops']) is not list:raise ValueError('troop observations list')
    seen=set()
    for t in context['troops']:
        exact_keys(t,{'id','valid','coordinatesValid','territorialCityId'},'troop observation')
        integer(t['id'],'troop ID',0,999);boolean(t['valid'],'troop valid');boolean(t['coordinatesValid'],'coordinate validity')
        integer(t['territorialCityId'],'troop territory',-1,41)
        if t['id'] in seen:raise ValueError('duplicate troop ID')
        if not t['coordinatesValid'] and t['territorialCityId']!=-1:raise ValueError('invalid coordinates cannot supply a territory')
        seen.add(t['id'])
    exact_keys(policy,{'id','ruleset','unknownEffects','unsupportedPerson','provenance'},'policy')
    text(policy['id'],'policy ID');text(policy['provenance'],'policy provenance')
    if policy['ruleset'] not in ('PC-PK1.1','PC-Vanilla-assumed'):raise ValueError('separate ruleset required')
    if policy['unknownEffects'] not in ('record-only','reject'):raise ValueError('unknown effects policy')
    if policy['unsupportedPerson'] not in ('defer-person','reject'):raise ValueError('unsupported person policy')
    persons=_index(state,'persons');bases=_index(state,'bases');legions=_index(state,'legions');forces=_index(state,'forces')
    for pid in command['personIds']:
        p=_valid(persons,pid)
        if not p or not 0<=p['status']<=5:raise ValueError('bounded command requires valid living person status0..5')
        if command['kind']=='release-invalid-former-force' and (p['status']!=5 or _valid(forces,p['formerForceId'])):
            raise ValueError('invalid-former release requires captive with absent former force')
        if command['kind']=='last-city-escape' and p['status']>3:raise ValueError('escape requires serving status')
    if command['kind']=='last-city-escape':
        target=_valid(bases,command['targetId'])
        if not target:raise ValueError('valid capture target required')
        owner=force_of(target,legions)
        if _valid(forces,owner) and any(b['valid'] and b['id']<42 and b['id']!=target['id'] and force_of(b,legions)==owner for b in bases.values()):
            raise ValueError('004B1950 last-city gate is not satisfied')


def _location_observation(p, state, context):
    bases=_index(state,'bases');loc=p['locationId']
    if 0<=loc<=86:
        base=_valid(bases,loc)
        return ('base',base['territorialCityId']) if base else None
    if 87<=loc<=1086:
        troop=_valid(_index(context,'troops'),loc-87)
        # 00495A50 has an unchecked coordinate lookup: reject bad troop coordinates.
        return ('troop',troop['territorialCityId']) if troop and troop['coordinatesValid'] else None
    return None


def choose_wandering_home(state, person_id, context, rng):
    """004BA520: anchor then incoming distance==1 candidates, no ownership filter."""
    integer(person_id,'person ID',0,1099)
    persons=_index(state,'persons');bases=_index(state,'bases');legions=_index(state,'legions')
    p=_valid(persons,person_id)
    if not p:return {'homeCityId':rng.take(42),'anchorId':None,'candidates':[],'reason':'invalid-person-random','steps':[]}
    position=_location_observation(p,state,context)
    if position is None:raise ValueError('unsupported location observation')
    home=_valid(bases,p['homeBaseId']);anchor=home['territorialCityId'] if home else position[1]
    steps=[{'helper':'004BA490','anchorId':anchor,'source':'home-territory' if home else 'actual-location-territory'}]
    if not 0<=anchor<42:
        anchor=rng.take(42);steps.append({'helper':'00472150','reason':'invalid-anchor','bound':42,'result':anchor})
    if not 0<=force_of(p,legions)<=46:
        return {'homeCityId':anchor,'anchorId':anchor,'candidates':[],'reason':'no-affiliation-anchor','steps':steps}
    if position[0]=='troop':
        # This override is AFTER invalid-anchor RNG, so the earlier draw remains consumed.
        anchor=position[1];steps.append({'helper':'004BA58B','reason':'troop-position-override','anchorId':anchor})
    candidates=[i for i in range(42) if relocation.city_distance(i,anchor)==1]
    if candidates:
        chosen=candidates[rng.take(len(candidates))];reason='incoming-distance-one'
    else:
        chosen=rng.take(42);reason='no-neighbor-random-city'
    return {'homeCityId':chosen,'anchorId':anchor,'candidates':candidates,'reason':reason,'steps':steps}


def project_detachment(state, command, context, policy, *, rolls=None, source_rng_state=None):
    validate(state,command,context,policy);rng=relocation.Draws(rolls,source_rng_state)
    tr={'schemaVersion':1,'profileId':PROFILE_ID,'before':copy.deepcopy(state),'command':copy.deepcopy(command),
        'context':copy.deepcopy(context),'policy':copy.deepcopy(policy),'accepted':False,'reason':None,
        'after':copy.deepcopy(state),'steps':[],'events':[],'deferredIds':[],'fallbacks':[],
        'evidence':{'stockOriginalVerified':False,'completeGameTransaction':False,'forceExtinctionImplemented':False,
                    'runtimeStatus':'compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption'}}
    def finish():
        tr['rng']=rng.finish();tr['traceHash']=common._digest(tr);return tr
    tr['reason']=('duplicate-command' if command['id'] in state['appliedIds'] else
                  'stale-revision' if command['expectedRevision']!=state['revision'] else
                  'revision-exhausted' if state['revision']==2**31-1 else
                  'unmodelled-effects' if policy['unknownEffects']=='reject' else None)
    if tr['reason']:return finish()
    unsupported=[pid for pid in command['personIds'] if _location_observation(_index(state,'persons')[pid],state,context) is None]
    tr['deferredIds']=unsupported
    if unsupported and policy['unsupportedPerson']=='reject':tr['reason']='unsupported-location';return finish()
    after=tr['after'];persons=_index(after,'persons');bases=_index(after,'bases');legions=_index(after,'legions');forces=_index(after,'forces')
    def event(code,p,phase):
        rec={'event':code,'personId':p['id'],'argument':0,'phase':phase,'effectStatus':'record-only',
             'personProjectionAtEmission':copy.deepcopy(p),
             'roleProjectionAtEmission':{'governors':{str(b['id']):b['governorId'] for b in bases.values() if b['governorId']==p['id']},
                'legionLeaders':{str(g['id']):g['leaderId'] for g in legions.values()},
                'advisors':{str(f['id']):f['advisorId'] for f in forces.values()}}}
        tr['events'].append(rec);return {'eventIndex':len(tr['events'])-1,'event':code,'phase':phase}
    for pid in command['personIds']:
        if pid in unsupported:
            tr['steps'].append({'personId':pid,'route':'deferred-unsupported-location','writes':{}});continue
        p=persons[pid];old=copy.deepcopy(p);steps=[];old_status=p['status'];old_home=_valid(bases,p['homeBaseId'])
        old_legion=_valid(legions,p['legionId']);old_force=_valid(forces,force_of(p,legions))
        old_home_force=_valid(forces,force_of(old_home,legions)) if old_home else None
        position=_location_observation(p,after,context)
        if command['kind']=='release-invalid-former-force':
            p.update(relocation.forbidden_adjustment(p['forbiddenLordId'],p['forbiddenMonths'],p['rawF0'],bool(_valid(persons,p['forbiddenLordId']))))
            steps.append({'helper':'004A8A93','phase':'forbidden adjustment before detachment'})
        if command['kind']=='last-city-escape' and command['releaseFlag']:
            steps.append({'helper':'004A9120','effectStatus':'record-only','phase':'before last-city detachment'})
        if old_force:steps.append(event(2,p,'before wandering selection and writes'))
        selection=choose_wandering_home(after,pid,context,rng);steps.append({'helper':'004BA520',**selection})
        p.update(homeBaseId=selection['homeCityId'],legionId=-1,status=4,loyalty=0,acted=True)
        steps.append({'helper':'004A31E0/004A32F0/004898F0/0048A770/00489B40','phase':'home then legion then identity/loyalty/acted'})
        if old_force and old_force['advisorId']==pid:
            old_force['advisorId']=-1;steps.append({'helper':'004813E0','clearedAdvisorForceId':old_force['id']})
        p.update(missionId=-1,missionArgs=[0]*5)
        steps.append({'helper':'004A5780','oldMissionId':old['missionId'],'newMissionId':-1,'cancellationHandlerCalled':False})
        # Both branches normalize to territorial CITY, not the original port/gate/base ID.
        p['locationId']=position[1];p['officeId']=80;p['troopMember']=False
        dest=bases[p['homeBaseId']];origin=_valid(bases,p['locationId'])
        distance=relocation.city_distance(origin['territorialCityId'] if origin else -1,dest['territorialCityId'])
        p.update(missionId=37,missionArgs=[0]*5,acted=True,missionDuration=distance&255)
        steps.append({'helper':'004A0CB0/004A7410/004A5660','originCityId':p['locationId'],'distanceResult':distance,
                      'durationByte':p['missionDuration'],'cancellationHandlerCalled':False,'reason':'mission already -1 before 004A57B0'})
        if old_status<=2 and old_home and old_home['governorId']==pid:
            steps.append(event(8,p,'before former governor slot is cleared'))
            old_home['governorId']=-1;steps.append({'helper':'004B3A20/00487780','clearedGovernorBaseId':old_home['id']})
        if old_status<=1 and old_legion:
            old_legion['leaderId']=-1;steps.append({'helper':'004A0940/0047E110','clearedLeaderLegionId':old_legion['id']})
        steps.append(event(5,p,'after detachment scalar and role writes'))
        if old_force:steps.append(event(21,p,'after event5 using saved former-force validity'))
        if command['kind']=='release-invalid-former-force':
            p.update(formerForceId=-1,captiveMonths=0,acted=True)
            steps.append(event(4,p,'after release fields before forbidden tail'))
            if old_home_force:p.update(forbiddenLordId=old_home_force['rulerId'],forbiddenMonths=3)
            steps.append({'helper':'004A8B09','forbiddenTailForceId':old_home_force['id'] if old_home_force else None})
        tr['steps'].append({'personId':pid,'route':command['kind'],'writes':{k:v for k,v in p.items() if old[k]!=v},'details':steps})
    tr['fallbacks']=[{'id':'record-detachment-callbacks-v1','status':'provisional-engine-rule',
                     'reason':'home/legion/location membership lists, mission observer callbacks, availability flags, UI, governor selection, ruler succession and complete force extinction are not executed; scalar snapshots assume callback non-interference'}]
    if unsupported:tr['fallbacks'].append({'id':'defer-unsafe-location-v1','status':'provisional-engine-rule','personIds':unsupported,
                                           'reason':'absent/invalid location or unsafe troop coordinates; entire person and its RNG/events are deferred'})
    after['revision']+=1;after['appliedIds'].append(command['id']);tr['accepted']=True
    return finish()


def replay_detachment(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=common._digest(value):raise ValueError('trace hash mismatch')
    rng=trace['rng']
    if rng['kind'] not in ('injected-rolls','source-LCG-at-entry'):raise ValueError('RNG kind')
    kw={'rolls':rng['rolls']} if rng['kind']=='injected-rolls' else {'source_rng_state':rng['initialState']}
    result=project_detachment(trace['before'],trace['command'],trace['context'],trace['policy'],**kw)
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
