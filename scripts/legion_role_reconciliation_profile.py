"""P0-58 source-local stable legion/governor role projection.

This separate API models scalar role reconciliation under explicit callback
noninterference and successful temporary-list assumptions. It is NOT the full
004BF6F0/capture transaction. Extinction, corps redistribution, refresh!=0 and
unsafe comparator input domains are atomically deferred. Earlier APIs are intact.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text
from mission_cancellation_v2_profile import _digest

PROFILE_ID = 'source-idb-S1-S2-stable-legion-roles-v1'
I32_MIN, I32_MAX = -2**31, 2**31-1
PERSON_KEYS = {'id','allocated','valid','status','homeBaseId','locationId','rawLegionId',
    'officeId','leadershipByte','strengthByte','rawWordAE','flags124',
    'missionId','missionArgs','missionDuration'}


def _index(state, name): return {r['id']: r for r in state[name]}
def _valid(row): return row is not None and row['valid']
def _canonical(b): return b is not None and 0 <= b['id'] <= 86

def _base_legion(b):
    return b['legionId'] if _canonical(b) and b['subtypeValid'] else -1

def _governor_id(b):
    return b['governorId'] if _canonical(b) and b['subtypeValid'] else -1


def validate(state, command, observations, policy):
    exact_keys(state, {'source','revision','appliedCommands','rngState','persons','buildings','legions','forces'}, 'role state')
    if state['source'] not in ('S1','S2'): raise ValueError('source S1/S2 required')
    integer(state['revision'],'revision',0,I32_MAX);integer(state['rngState'],'rng',0,0xffffffff)
    if type(state['appliedCommands']) is not list: raise ValueError('appliedCommands list')
    seen=set()
    for r in state['appliedCommands']:
        exact_keys(r,{'id','sha256'},'applied command');text(r['id'],'applied ID')
        if type(r['sha256']) is not str or len(r['sha256'])!=64 or any(c not in '0123456789abcdef' for c in r['sha256']): raise ValueError('applied digest')
        if r['id'] in seen: raise ValueError('duplicate command ID')
        seen.add(r['id'])
    for name,keys,high in (
        ('persons',PERSON_KEYS,1099),
        ('buildings',{'id','valid','subtypeValid','legionId','governorId','homeRosterIds'},16383),
        ('legions',{'id','valid','forceId','leaderId'},46),
        ('forces',{'id','valid','advisorId'},46)):
        if type(state[name]) is not list: raise ValueError(name+' list')
        seen=set()
        for r in state[name]:
            exact_keys(r,keys,name);integer(r['id'],name+' ID',0,high);boolean(r['valid'],name+' valid')
            if r['id'] in seen: raise ValueError('duplicate '+name+' ID')
            seen.add(r['id'])
    for p in state['persons']:
        boolean(p['allocated'],'allocated')
        if p['valid'] and not p['allocated']: raise ValueError('valid person must be allocated')
        for k in ('status','homeBaseId','locationId','rawLegionId','officeId','missionId'): integer(p[k],k,I32_MIN,I32_MAX)
        for k in ('leadershipByte','strengthByte','missionDuration'): integer(p[k],k,0,255)
        integer(p['rawWordAE'],'rawWordAE',0,65535);integer(p['flags124'],'flags124',0,0xffffffff)
        if type(p['missionArgs']) is not list or len(p['missionArgs'])!=5: raise ValueError('five mission args')
        for n in p['missionArgs']: integer(n,'mission argument',I32_MIN,I32_MAX)
    for b in state['buildings']:
        boolean(b['subtypeValid'],'subtype valid')
        if not _canonical(b) and (b['subtypeValid'] or b['legionId']!=-1 or b['governorId']!=-1 or b['homeRosterIds']):
            raise ValueError('generic building has no canonical subtype in this domain')
        for k in ('legionId','governorId'): integer(b[k],k,I32_MIN,I32_MAX)
        if type(b['homeRosterIds']) is not list: raise ValueError('home roster list')
        # Duplicate nodes are not deduplicated: they may affect shortcut order.
        for pid in b['homeRosterIds']: integer(pid,'home roster person slot',0,1099)
    for l in state['legions']:
        integer(l['forceId'],'legion force',I32_MIN,I32_MAX);integer(l['leaderId'],'leader ID',I32_MIN,I32_MAX)
        if l['valid'] and not 0<=l['forceId']<=46: raise ValueError('valid legion numeric force0..46')
    for f in state['forces']: integer(f['advisorId'],'advisor ID',I32_MIN,I32_MAX)
    exact_keys(command,{'id','expectedRevision','entry','targetId','refreshFlag'},'role command')
    text(command['id'],'command ID');integer(command['expectedRevision'],'expected revision',0,I32_MAX)
    if command['entry'] not in ('legion','governor'): raise ValueError('entry legion/governor')
    integer(command['targetId'],'target ID',-1,46 if command['entry']=='legion' else 16383)
    integer(command['refreshFlag'],'refresh flag',I32_MIN,I32_MAX)
    exact_keys(observations,{'source','provenance','capacities','routedMissions'},'role observations')
    if observations['source']!=state['source']: raise ValueError('observation source mismatch')
    text(observations['provenance'],'observation provenance')
    for name,keys in (('capacities',{'stage','personId','value'}),('routedMissions',{'personId','hasRoute'})):
        if type(observations[name]) is not list: raise ValueError(name+' list')
        seen=set()
        for r in observations[name]:
            exact_keys(r,keys,name);integer(r['personId'],'observed person',0,1099)
            if name=='capacities':
                text(r['stage'],'capacity stage');integer(r['value'],'capacity returned dword',I32_MIN,I32_MAX)
                key=(r['stage'],r['personId'])
                if r['stage']!='leader' and not (r['stage'].startswith('governor:') and r['stage'][9:].isdigit() and 0<=int(r['stage'][9:])<=16383 and str(int(r['stage'][9:]))==r['stage'][9:]): raise ValueError('capacity stage')
            else: boolean(r['hasRoute'],'hasRoute');key=r['personId']
            if key in seen: raise ValueError('duplicate '+name+' observation')
            seen.add(key)
    exact_keys(policy,{'id','ruleset','unknownEffects','provenance','callbackAssumption','pointerDomain','listAssumption'},'role policy')
    for k in ('id','provenance'): text(policy[k],k)
    if policy['ruleset'] not in ('PC-PK1.1','PC-Vanilla-assumed'): raise ValueError('separate ruleset required')
    if policy['unknownEffects'] not in ('record-only','reject'): raise ValueError('unknown effect policy')
    if policy['callbackAssumption']!='noninterference-v1': raise ValueError('callback assumption')
    if policy['pointerDomain']!='complete-sparse-canonical-arrays-v1': raise ValueError('complete sparse canonical domain required')
    if policy['listAssumption']!='successful-temporary-lists-v1': raise ValueError('temporary-list assumption')


class _Unsupported(Exception): pass


class _Planner:
    """Dry run on a private copy; record operations, never touch caller state."""
    def __init__(self,state,observations):
        self.state=copy.deepcopy(state);self.persons=_index(self.state,'persons');self.bases=_index(self.state,'buildings')
        self.legions=_index(self.state,'legions');self.forces=_index(self.state,'forces')
        self.capacities={(r['stage'],r['personId']):r['value'] for r in observations['capacities']}
        self.routes={r['personId']:r['hasRoute'] for r in observations['routedMissions']}
        self.operations=[];self.summary={'route':'roles','leaderCandidates':[],'governorPasses':[]}
    def step(self,helper,**d): self.operations.append(dict(kind='step',helper=helper,**copy.deepcopy(d)))
    def write(self,helper,table,row,field,value):
        old=row[field];row[field]=value
        self.operations.append(dict(kind='write',helper=helper,table=table,id=row['id'],field=field,oldValue=old,value=value))
    def boundary(self,helper,reason,**details):
        self.operations.append(dict(kind='boundary',helper=helper,reason=reason,**copy.deepcopy(details)))
    def event(self,event_id,subject_type,subject_id):
        self.operations.append(dict(kind='event',helper='004BBAA0',eventId=event_id,subjectType=subject_type,subjectId=subject_id,argument=0,
            dispatchOrder=['004A8110','004BA1D0','004EC870/optional virtual+1B4']))
    def force_of(self,p):
        l=self.legions.get(p['rawLegionId'])
        return l['forceId'] if _valid(l) else -1
    def city_force(self,b):
        l=self.legions.get(b['legionId'])
        return l['forceId'] if _valid(l) else -1
    def at_home(self,p):
        normalized=p['homeBaseId'] if 0<=p['homeBaseId']<=86 else -1
        if p['locationId']!=normalized:
            self.step('004896C0',personId=p['id'],normalizedHome=normalized,locationMatches=False);return False
        if p['id'] not in self.routes: raise ValueError('missing routed-mission observation for person '+str(p['id']))
        routed=self.routes[p['id']]
        self.boundary('005BA320','route resolver and transitive mission getters not executed',personId=p['id'],hasRoute=routed,observed=True)
        if routed: return False
        b=self.bases.get(p['homeBaseId']);ok=_valid(b) and _base_legion(b)==p['rawLegionId']
        self.step('00489730',personId=p['id'],homeValid=_valid(b),sameLegion=ok);return ok
    def capacity(self,p,stage):
        key=(stage,p['id'])
        if key not in self.capacities: raise ValueError('missing capacity observation '+stage+' person '+str(p['id']))
        return self.capacities[key]&65535
    def rank(self,candidates,stage,leader):
        if len(candidates)<2: return candidates[:]
        if not all(p['valid'] for p in candidates): raise _Unsupported('unsupported-invalid-ranking-candidate')
        # All ranking operands are preflighted. This deliberately models the
        # order, not native sort comparison order or capacity callback counts.
        caps={p['id']:self.capacity(p,stage) for p in candidates}
        self.boundary('0048A4F0','capacity calculator and source-specific query hooks not executed',stage=stage,observed=True,inputs=[dict(personId=p['id'],returnedDword=self.capacities[stage,p['id']],capacity16=caps[p['id']]) for p in candidates])
        def key(p):
            if leader: return (p['status']!=0,-caps[p['id']],p['officeId'],-p['leadershipByte'],p['id'])
            return (-caps[p['id']],-p['leadershipByte'],-p['strengthByte'],-p['rawWordAE'],p['id'])
        return sorted(candidates,key=key)
    def set_governor(self,b,p):
        if not _valid(b) or (p is not None and not p['valid']): return
        old=self.persons.get(_governor_id(b));new_id=p['id'] if p is not None else -1
        self.step('004B3A20/entry',buildingId=b['id'],requestedPersonId=new_id)
        if _valid(old) and old['id']!=new_id: self.event(8,'person',old['id'])
        # 00487780 dispatches canonical subtype setters; generic/invalid subtype
        # leaves the actual field unchanged even though event8 may have fired.
        if _canonical(b) and b['subtypeValid']:
            self.write('00487780/0047B4B0' if b['id']<=41 else '00487780/0048D9A0','buildings',b,'governorId',new_id)
        else: self.step('00487780/no-op',buildingId=b['id'],requestedPersonId=new_id)
    def governor(self,bid):
        b=self.bases.get(bid);self.step('004BCA30/entry',buildingId=bid,refreshFlag=0,valid=_valid(b))
        if not _valid(b): return
        roster=b['homeRosterIds'] if _canonical(b) and b['subtypeValid'] else []
        collected=[self.persons[pid] for pid in roster if pid in self.persons and self.persons[pid]['allocated'] and 0<=self.persons[pid]['status']<=3]
        self.step('004CF360',buildingId=bid,rosterIds=roster,candidateIds=[p['id'] for p in collected],statusMask=15)
        candidates=[]
        for p in collected:
            if p['rawLegionId']==_base_legion(b) and self.at_home(p): candidates.append(p)
        self.step('004BC870/004B95E0',buildingId=bid,candidateIds=[p['id'] for p in candidates])
        leaders=[p for p in candidates if p['status']<=1]
        selected=leaders[-1] if leaders else (self.rank(candidates,'governor:'+str(bid),False)[0] if candidates else None)
        self.summary['governorPasses'].append(dict(buildingId=bid,candidateIds=[p['id'] for p in candidates],selectedId=selected['id'] if selected else -1,selection='last-status-le1' if leaders else '004B2090'))
        self.step('004BCA30/select',buildingId=bid,selectedId=selected['id'] if selected else -1,lastStatusShortcut=bool(leaders))
        old=self.persons.get(_governor_id(b))
        if _valid(old) and old['status']==2:
            home=self.bases.get(old['homeBaseId'])
            if old['homeBaseId']==bid or (_valid(home) and _governor_id(home)!=old['id']):
                self.write('004898F0','persons',old,'status',3)
        if _valid(selected):
            if selected['status'] not in (0,1): self.write('004898F0','persons',selected,'status',2)
            self.set_governor(b,selected)
        else:
            self.set_governor(b,None);self.event(14,'building',bid)
    def legion(self,lid):
        l=self.legions.get(lid);self.step('004BE2A0/entry',legionId=lid,valid=_valid(l))
        if not _valid(l): self.summary['route']='invalid-legion-no-op';return
        fid=l['forceId'];self.step('004BE2A0/force-range',forceId=fid,passed=0<=fid<=41)
        if not 0<=fid<=41: self.summary['route']='non-normal-force-no-op';return
        force=self.forces.get(fid)
        force_people=[p['id'] for p in sorted(self.persons.values(),key=lambda p:p['id']) if p['allocated'] and self.force_of(p)==fid and 0<=p['status']<=3] if _valid(force) else []
        cities=[b for b in sorted(self.bases.values(),key=lambda b:b['id']) if b['id']<=41 and b['subtypeValid']]
        own_cities=[b['id'] for b in cities if self.city_force(b)==fid] if force_people else []
        self.step('004BBDB0',forceId=fid,allocatedStatusMask15Persons=force_people,ownedCityIds=own_cities,forceValid=_valid(force))
        if not force_people or not own_cities: raise _Unsupported('unsupported-force-extinction')
        own_legion_cities=[b['id'] for b in cities if b['legionId']==lid]
        candidates=[p for p in sorted(self.persons.values(),key=lambda p:p['id']) if p['valid'] and p['rawLegionId']==lid]
        self.step('004B9550',legionId=lid,cityIds=own_legion_cities,validPersonIds=[p['id'] for p in candidates] if own_legion_cities else [])
        if not own_legion_cities or not candidates: raise _Unsupported('unsupported-empty-legion-redistribution')
        ranked=self.rank(candidates,'leader',True);selected=ranked[0]
        self.summary['leaderCandidates']=[p['id'] for p in ranked];self.summary['selectedLeaderId']=selected['id']
        self.step('004CEF90',inputIds=[p['id'] for p in candidates],rankedIds=[p['id'] for p in ranked])
        old=self.persons.get(l['leaderId'])
        if _valid(old) and old['status']==1:
            home=self.bases.get(old['homeBaseId'])
            keep_governor=old['homeBaseId']!=selected['homeBaseId'] and self.at_home(old) and _valid(home) and _governor_id(home)==old['id']
            if keep_governor: self.write('004898F0','persons',old,'status',2)
            else:
                if _valid(home) and _governor_id(home)==old['id']: self.set_governor(home,None)
                self.write('004898F0','persons',old,'status',3)
        if selected['status']!=0:
            self.write('004898F0','persons',selected,'status',1)
            if self.at_home(selected):
                home=self.bases.get(selected['homeBaseId'])
                if _valid(home):
                    old_gov=self.persons.get(_governor_id(home))
                    if _valid(old_gov) and old_gov['status']==2 and old_gov['id']!=selected['id']:
                        self.write('004898F0','persons',old_gov,'status',3)
                    self.set_governor(home,selected)
        self.write('004A0940/0047E110','legions',l,'leaderId',selected['id'])
        for bid in range(87):
            b=self.bases.get(bid)
            if _canonical(b) and _base_legion(b)==lid: self.governor(bid)


def _plan(state,command,observations):
    planner=_Planner(state,observations)
    try:
        if command['entry']=='legion': planner.legion(command['targetId'])
        elif not _valid(planner.bases.get(command['targetId'])):
            planner.summary['route']='invalid-building-no-op';planner.governor(command['targetId'])
        elif command['refreshFlag']!=0: raise _Unsupported('unsupported-governor-refresh')
        else: planner.governor(command['targetId'])
    except _Unsupported as error:
        return dict(route=str(error)),[]
    return planner.summary,planner.operations


def _apply(after,operations,steps,effects):
    for raw in operations:
        op=copy.deepcopy(raw);kind=op.pop('kind')
        if kind=='boundary':
            effects.append(dict(**op,beforeStepIndex=len(steps),snapshot=copy.deepcopy(after)))
            steps.append(dict(helper=op['helper']+'/boundary',observed=True))
        elif kind=='event':
            effects.append(dict(**op,reason='mission-event listeners and UI not executed',beforeStepIndex=len(steps),snapshot=copy.deepcopy(after)))
            steps.append(dict(helper='004BBAA0/boundary',eventId=op['eventId'],subjectType=op['subjectType'],subjectId=op['subjectId']))
        else:
            if kind=='write':
                row=_index(after,op['table'])[op['id']]
                if row[op['field']]!=op['oldValue']: raise AssertionError('preflight operation mismatch')
                row[op['field']]=op['value'];op['rowAfter']=copy.deepcopy(row)
            steps.append(op)


def project_legion_roles(state,command,observations,policy):
    """Atomic bounded 004BE2A0 stable branch or standalone 004BCA30(refresh=0)."""
    validate(state,command,observations,policy)
    result=dict(schemaVersion=1,profileId=PROFILE_ID,source=state['source'],accepted=False,replayed=False,reason=None,
        before=copy.deepcopy(state),after=copy.deepcopy(state),command=copy.deepcopy(command),observations=copy.deepcopy(observations),policy=copy.deepcopy(policy),plan=None,steps=[],unknownEffects=[],
        rng=dict(kind='zero-local-calls',initialState=state['rngState'],finalState=state['rngState'],calls=[],consumed=0,unexecutedCallbacksCovered=False),
        evidence=dict(sourceLocalOnly=True,stockVerified=False,vanillaVerified=False,callbacksExecuted=False,fullReturnExecuted=False,completeGameTransaction=False,
            stableRoleScalarsOnly=True,temporaryListMachineCodeExecuted=False,advisorReconciled=False,capacityCalculatorExecuted=False,routeResolverExecuted=False,
            runtimeStatus='compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption'))
    def finish(): result['traceHash']=_digest(result);return result
    digest=_digest(command);prior=next((r for r in state['appliedCommands'] if r['id']==command['id']),None)
    if prior:
        result['replayed']=prior['sha256']==digest;result['accepted']=result['replayed']
        result['reason']='replay' if result['replayed'] else 'replay-payload-conflict';return finish()
    if command['expectedRevision']!=state['revision']:result['reason']='revision-conflict';return finish()
    if state['revision']==I32_MAX:raise ValueError('revision exhausted')
    plan,operations=_plan(state,command,observations);result['plan']=copy.deepcopy(plan);result['reason']=plan['route']
    if plan['route'].startswith('unsupported-'):return finish()
    after=copy.deepcopy(state);_apply(after,operations,result['steps'],result['unknownEffects'])
    if result['unknownEffects'] and policy['unknownEffects']=='reject':
        result['steps']=[];result['reason']='unknown-effects-rejected';return finish()
    after['revision']+=1;after['appliedCommands'].append(dict(id=command['id'],sha256=digest))
    result.update(after=after,accepted=True);return finish()


def replay_legion_roles(trace):
    if type(trace) is not dict:raise ValueError('trace object')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=_digest(value):raise ValueError('trace hash mismatch')
    try: result=project_legion_roles(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
