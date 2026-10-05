"""P0-66 native base ownership and event9/10 in one mutable frame.

Known stores/predicates execute. Wider cancellation bodies and event9's troop
reaction remain bound mutable observations, never assumed identity callbacks.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer
from mission_event_listener_profile import PREDICATES
from mission_cancellation_v2_profile import HANDLERS

I32_MIN,I32_MAX=-2**31,2**31-1


def validate_event(event):
    exact_keys(event,{'id','subjectType','subjectId','argument'},'event')
    integer(event['id'],'event ID',8,14)
    if event['id'] not in (8,9,10,14): raise ValueError('only event8/9/10/14 supported')
    if event['subjectType'] not in ('person','building','null'): raise ValueError('typed subject required')
    if event['subjectType']=='null':
        if event['subjectId'] is not None: raise ValueError('null subject ID')
    else: integer(event['subjectId'],'subject ID',0,1099 if event['subjectType']=='person' else 16383)
    integer(event['argument'],'event argument',I32_MIN,I32_MAX)


class BaseOwnershipPrimitives:
    def mission_arg(self,pid,index):
        # New-version event contexts reach all five represented arguments.
        # Native index5 exists outside this declared frame and is not reached.
        if index not in range(5):self.defer('unsupported-base-event-argument-index')
        value=self.slot('persons',pid)['missionArgs'][index]
        self.step('004897B0',personId=pid,index=index,result=value)
        return value

    def boundary(self,kind,helper,**args):
        if helper=='004AD550': return self.base_ownership(**args)
        return super().boundary(kind,helper,**args)

    def base_ownership(self,buildingId,requestedLegionId):
        bid,lid=buildingId,requestedLegionId
        with self.scope('004AD550',buildingId=bid,requestedLegionId=lid):
            valid=self.valid('buildings',bid)
            self.step('004AD55B/valid',buildingId=bid,passed=valid)
            if not valid:return
            valid_request=lid==-1 or 0<=lid<=46
            self.step('004AD570/request',requestedLegionId=lid,passed=valid_request)
            if not valid_request:return
            old_legion=self.base_legion(bid)
            self.save(savedOldLegionId=old_legion)
            self.step('004AD58C/virtual44',buildingId=bid,result=old_legion)
            old_force=self.target_force(bid,'base-ownership-before')
            self.save(savedOldForceId=old_force)
            legion=self.slot('legions',lid)
            legion_valid=legion is not None and legion['valid']
            self.step('004AD5AF/legion-valid',legionId=lid,passed=legion_valid)
            force=legion['forceId'] if legion_valid else -1
            self.save(savedRequestedForceId=force)
            if legion_valid:
                self.step('004AD5BF/virtual40',legionId=lid,result=force)
                if not 0<=force<=46:return
            if self._direct_owner_kind(bid):
                # The complete setter accepts -1 or a canonical force number.
                self.write('buildings',bid,'rawOwnerForceId',force,'004867A0/+0C-dword')
            with self.scope('004876A0',buildingId=bid,requestedLegionId=lid):
                subtype=self._role_subtype(bid)
                self.step('004876A0/subtype',buildingId=bid,kind=self.slot('buildings',bid)['kind'],passed=subtype)
                if subtype:
                    helper='0047CBD0' if bid<=41 else '00483730' if bid<=51 else '0048DB30'
                    self._set_subtype_legion(bid,lid,helper)
            current_force=self.target_force(bid,'base-ownership-after')
            self.step('004AD5F7/force-compare',savedOldForceId=old_force,currentForceId=current_force)
            if old_force!=current_force:
                city_id=bid if 0<=bid<=41 else None
                self.save(savedResetCityId=city_id)
                valid_city=city_id is not None and self.valid('cities',city_id)
                self.step('004866F0/0047A630',buildingId=bid,cityId=city_id,passed=valid_city)
                if valid_city:
                    for helper,bit in (('004815F0',0),('0047B6F0',1),('0047B710',4)):
                        old=self.slot('cities',city_id)['rawFlagsA4']
                        value=old & ~(1<<bit)
                        self.write('cities',city_id,'rawFlagsA4',value,helper+'/00472520')
                        self.step('00472520/store',cityId=city_id,offset=0xA4,width=4,bit=bit,argument=0,oldDword=old,value=value)
                self.emit_event(dict(id=9,subjectType='building',subjectId=bid,argument=0))
                return
            current_legion=self.base_legion(bid)
            self.step('004AD646/virtual44',buildingId=bid,result=current_legion,savedOldLegionId=old_legion)
            if old_legion!=current_legion:
                self.emit_event(dict(id=10,subjectType='building',subjectId=bid,argument=0))

    def _subtype_max(self,bid,stage):
        with self.scope('0047A7D0',buildingId=bid,stage=stage):
            intrinsic=self.slot('buildings',bid)['subtypeMaxDurabilityWord']
            self.save(savedIntrinsicWord=intrinsic)
            self.step('0047C330' if bid<=41 else '0048DC10',buildingId=bid,result=intrinsic)
            force_id=self._subtype_force(bid,'city' if bid<=41 else 'gate' if bid<=51 else 'port')
            force=self.slot('forces',force_id)
            valid=force is not None and force['valid']
            self.step('0047A7D0/force-valid',forceId=force_id,passed=valid)
            learned=False
            if valid:
                technique=26 if self.source=='S1' else 36
                learned=bool(force['techniqueBits'][technique//32] & (1<<(technique%32)))
                self.step('004811E0',forceId=force_id,techniqueId=technique,result=learned)
            value=(intrinsic+(3000 if learned else 0)) & 65535
            self.step('0047A822/low16',result=value)
            if self.source=='S2':
                value=min(value,24000)
                self.step('008EA050/cap',limit=24000,result=value)
            return value

    def _set_subtype_legion(self,bid,lid,helper):
        with self.scope(helper,buildingId=bid,requestedLegionId=lid):
            self.write('buildings',bid,'legionId',lid,helper+'/legion-dword')
            current=self.slot('buildings',bid)['durabilityWord'] if self.valid('buildings',bid) else 0
            self.save(savedCurrentDurabilityWord=current)
            self.step(helper+'/current-durability',buildingId=bid,result=current)
            maximum=self._subtype_max(bid,'legion-compare')
            clamp=current>maximum
            self.step(helper+'/unsigned-compare',currentWord=current,maximumWord=maximum,clamp=clamp)
            if not clamp:return
            requested=self._subtype_max(bid,'legion-clamp-request')
            setter='0047C4F0' if bid<=41 else '004835B0' if bid<=51 else '0048D9C0'
            with self.scope(setter,buildingId=bid,requestedWord=requested):
                valid_generic=self.valid('buildings',bid)
                self.step(setter+'/valid',buildingId=bid,passed=valid_generic)
                if not valid_generic:return
                # This path's generic kind/id was resolved by004876A0 and no
                # callback occurs before the clamp. Thus00487150 resolves the
                # same canonical subtype; its facility fallback is unreachable.
                with self.scope('00487E20',buildingId=bid,requestedWord=requested):
                    with self.scope('00487150',buildingId=bid):
                        cap=self._subtype_max(bid,'generic-durability-clamp')
                    signed_request=requested if requested<32768 else requested-65536
                    signed_cap=cap if cap<32768 else cap-65536
                    value=0 if signed_request<=0 else cap if signed_cap<=signed_request else requested
                    self.write('buildings',bid,'durabilityWord',value,'00487E20/+10-word')
                    self.step('00487E20/store',buildingId=bid,offset=0x10,width=2,requestedWord=requested,maximumWord=cap,value=value)

    def emit_event(self,event):
        validate_event(event)
        if event['id'] in (8,14): return super().emit_event(event)
        if len(self.event_contexts)>=self.policy['engineGuard']['maxEventDepth']:
            self.defer('engine-guard-event-depth')
        context=dict(eventIndex=len(self.events),parentEventIndex=self.event_contexts[-1]['eventIndex'] if self.event_contexts else None,
                     event=copy.deepcopy(event),copiedActivePersonIds=[],visits=[])
        self.events.append(context);self.event_contexts.append(context)
        try:
            with self.scope('004BBAA0',event=event):
                self.step('004BBAA0/stack-event',event=event)
                self.listeners(context)
                if event['id']==9:
                    self.boundary('effect','004BA1D0',event=copy.deepcopy(event))
                else:self.step('004BA1D0',event=event,route='event10-no-op')
                present=self.frame['observerPresent']
                self.step('004EC870',caller='004BBAA0',observerPresent=present)
                if present:self.boundary('effect','observer.virtual1B4',nativeArgs=[0,0,0,0],caller='004BBAA0')
                self.step('004BBAA0/return',event=event)
        finally:self.event_contexts.pop()

    def predicate(self,p,mission):
        if self.event['id'] in (8,14): return super().predicate(p,mission)
        helper=PREDICATES[mission]
        if helper=='00441880':
            self.step(helper,predicate=True,returnValue=0);return False
        self.step(helper,phase='predicate-entry',personId=p['id'],missionId=mission)
        if 15<=mission<=21:return self._context_predicate(p,mission)
        self.step('0047A630',phase='predicate-listener',personId=p['id'],passed=p['valid'])
        if not p['valid']:return False
        order={0:[0],2:[0,1],5:[0,1],9:[0],10:[0],12:[0],22:[0,1],23:[0,1],24:[0],38:[0],41:[1,0],42:[1,0],43:[1,0]}[mission]
        args={i:self.mission_arg(p['id'],i) for i in order}
        handled=self.event['id']==9 and mission in (0,2,5,9,10,23,24,38,41,42,43)
        if not handled:
            self.step(helper,phase='event-not-handled',eventId=self.event['id'],returnValue=0);return False
        sid=self.event['subjectId'];cast=self.event['subjectType']=='building'
        self.step('virtual+2C' if self.event['subjectType']!='null' else 'null-subject-skip-type-query',
                  virtualCalled=self.event['subjectType']!='null',typeHelper='00573470',typeId=5,
                  subjectType=self.event['subjectType'],castSucceeded=cast)
        passed=cast and self.valid('buildings',sid)
        self.step('0047A630',phase='predicate-subject',passed=passed)
        if not passed:return False
        target=p['homeBaseId'] if mission in (0,38) else args[1 if mission in (41,42,43) else 0]
        if mission in (0,38):self.step(helper+'/home-read',personId=p['id'],homeBaseId=target)
        passed=sid==target
        self.step('00491770',subjectId=sid,targetId=target,passed=passed)
        return passed

    def _context_predicate(self,p,mission):
        constructor={15:'005B8F90',16:'005B9C40',17:'005B9000',18:'005B9060',19:'005B90F0',20:'005B9160',21:'005B9200'}[mission]
        with self.scope(constructor,personId=p['id'],capturedMissionId=mission):
            actor=p['id'] if p['valid'] and p['missionId']==mission else None
            self.step(constructor+'/actor',personId=p['id'],valid=p['valid'],liveMissionId=p['missionId'],contextPersonId=actor)
            force=None
            if actor is not None:
                fid=self.mission_arg(actor,0)
                force=fid if 0<=fid<=46 else None
                # Getters construct canonical addresses without reading their
                # target fields; require an observed row only if later read.
                self.step('00490AA0',rawId=fid,forceId=force)
            local=dict(personId=actor,forceId=force)
            indices={15:[1],16:[1],17:[],18:[1,2],19:[1],20:[1,2,3],21:[1,2,3,4]}[mission]
            for index in indices:
                valid_actor=actor is not None and self.valid('persons',actor)
                self.step('005BC560/valid',personId=actor,argumentIndex=index,passed=valid_actor)
                value=self.mission_arg(actor,index) if valid_actor else 0
                self.step('005BC560/result',argumentIndex=index,result=value)
                if mission in (20,21) and index in (1,3):
                    high=1099 if mission==20 else 16383
                    pointer=value if 0<=value<=high else None
                    self.step('00490B00' if mission==20 else '00490D00',rawId=value,pointerId=pointer)
                    local['target'+str(index)+'Id']=pointer
                else:local['argument'+str(index)]=value
            self.step(constructor+'/result',context=local)
        if mission!=21:
            self.step(PREDICATES[mission],phase='event-not-handled',eventId=self.event['id'],returnValue=0);return False
        # Unlike the other wrappers,005CD230 evaluates virtual context validity
        # before consulting the event switch. The order short-circuits exactly.
        for table,key in (('persons','personId'),('forces','forceId'),('buildings','target1Id'),('buildings','target3Id')):
            rid=local[key];valid=rid is not None and self.valid(table,rid)
            self.step('00572760/valid',table=table,pointerId=rid,passed=valid)
            if not valid:return False
        if self.event['id']!=9:
            self.step('005CD230',phase='event-not-handled',eventId=self.event['id'],returnValue=0);return False
        sid=self.event['subjectId'] if self.event['subjectType']=='building' else None
        # Two independent virtual casts, and no0047A630 subject-valid gate.
        for key in ('target1Id','target3Id'):
            self.step('005CD330/virtual+2C',subjectType=self.event['subjectType'],virtualCalled=self.event['subjectType']!='null',
                      castPointerId=sid,targetPointerId=local[key],castSucceeded=self.event['subjectType']=='building')
            if sid==local[key]:return True
        return False

    def dispatch(self,visit,pid,mission):
        if self.event['id'] in (8,14): return super().dispatch(visit,pid,mission)
        with self.actor(pid),self.scope('005B9D30',visitIndex=visit,personId=pid,capturedMissionId=mission):
            self.step('005B9D30',personId=pid,capturedMissionId=mission,predicate=PREDICATES[mission],handler=HANDLERS[mission],selfBypass=False)
            passed=self.predicate(self.person(),mission)
            self.step(PREDICATES[mission]+'/result',returnValue=int(passed))
            if not passed:return 0,None
            with self.scope(HANDLERS[mission],personId=pid,capturedMissionId=mission):
                if mission in (23,24):value=self.handler_primitive(mission)
                else:
                    value=self.boundary('effect-query',HANDLERS[mission],personId=pid,capturedMissionId=mission,event=copy.deepcopy(self.event))
                    integer(value,'observed handler return dword',I32_MIN,I32_MAX)
            self.step('005B9D30/return',returnValue=1,handlerReturnIgnored=True)
            return 1,value
