"""Source-local empty-legion dispatch, copied-roster merge and scalar reset.

Uses one live owner. Full base transfer and mission relocation remain explicitly
mutable, exact-call observations; neither has an implicit identity fallback.
"""
from __future__ import annotations
import copy
from empty_legion_frame import ALIASES, scalar_value, store_scalar
from capture_transaction_profile import integer
from return_mission_lifecycle_profile import city_distance


class EmptyLegionPrimitives:
    def write(self,table,rid,field,value,helper):
        if table=='legions' and field in ALIASES:
            self.legion_store(rid,ALIASES[field],4,value,helper)
        else:
            super().write(table,rid,field,value,helper)

    def legion_store(self,lid,offset,width,value,helper):
        legion=self.slot('legions',lid)
        if legion is None:self.defer('unsupported-null-legion-scalar-write')
        before=legion['rawScalarHex']
        store_scalar(legion,offset,width,value)
        self.step(helper,legionId=lid,offset=offset,width=width,value=value,
                  oldRawScalarHex=before,rawScalarHex=legion['rawScalarHex'])

    def force_legion(self,fid,ordinal):
        with self.scope('00481240',forceId=fid,ordinal=ordinal):
            if not 1<=ordinal<=8:
                self.step('00481240/result',result=-1);return -1
            canonical_force=fid if 0<=fid<=46 else -1
            for lid in range(47):
                legion=self.row('legions',lid)
                if legion is not None and legion['valid']:
                    if legion['forceId']==canonical_force and legion['number']==ordinal:
                        self.step('00481240/result',result=lid);return lid
            self.step('00481240/result',result=-1);return -1

    def leader_home(self,lid):
        with self.scope('0047E3B0',legionId=lid):
            legion=self.slot('legions',lid)
            if legion is None:self.defer('unsupported-null-legion-home-receiver')
            pid=legion['leaderId'];person=self.slot('persons',pid)
            value=person['homeBaseId'] if person is not None and person['valid'] else -1
            self.step('0047E3B0/result',legionId=lid,personId=pid,result=value)
            return value

    def reset_legion(self,lid):
        with self.scope('0047E470',legionId=lid,argument=0):
            self.step('00423230',argument=0,emptyStub=True)
            for offset,width,value in ((8,4,0),(36,4,0),(40,4,0),(44,1,0),
                                      (4,4,-1),(12,4,-1),(16,4,-1),(20,4,-1),
                                      (24,4,-1),(28,4,-1),(32,4,-1)):
                self.legion_store(lid,offset,width,value,'0047E470/store')
            with self.scope('0047E280',legionId=lid):
                for bit in range(12):
                    raw=scalar_value(self.slot('legions',lid),40)
                    if bit==11:
                        value=raw & ~(1<<bit)
                        self.legion_store(lid,32,4,-1,'0047E280/target-clear')
                    else:value=raw | (1<<bit)
                    self.legion_store(lid,40,4,value,'0047E280/flag-store')
            self.slot('legions',lid)['rosterIds'].clear()
            self.step('0047BE50',table='legions',rosterId=lid,rosterField='rosterIds',cleared=True)

    def merge_legion(self,sourceLegionId,destinationLegionId):
        source=sourceLegionId
        if self.slot('legions',source) is None:
            self.defer('unsupported-null-merge-source')
        destination=(destinationLegionId if self.slot('legions',destinationLegionId) is not None else None)
        with self.scope('004BD3B0',sourceLegionId=source,destinationLegionId=destination):
            old=self._role_person_pointer(self.slot('legions',source)['leaderId'])
            self.save(savedSourceLeaderId=old)
            if self._role_valid_pointer('persons',old):
                if self.slot('persons',old)['status']<=1:
                    home=self._role_building_pointer(self.slot('persons',old)['homeBaseId'])
                    self.save(savedSourceLeaderHomeId=home)
                    keep=(self.at_home(old,'merge-old-leader') and
                          self._role_valid_pointer('buildings',home) and self.governor_id(home)==old)
                    self._role_status(old,2 if keep else 3)
                if self.valid('legions',source):
                    self.write('legions',source,'leaderId',-1,'004A0940/0047E110')
                else:self.step('004A0940/no-op',legionId=source,requestedLeaderId=-1)
                # Reload home after all previous callbacks; source leader remains saved.
                home=self.slot('persons',old)['homeBaseId']
                self.governor(home)
            if destination is not None:
                # 0049F820 copies nodes without inspecting person predicates.
                copied=list(self.slot('legions',source)['rosterIds'])
                self.save(copiedSourceRosterIds=list(copied))
                self.step('0049F820/merge-copy',sourceLegionId=source,candidateIds=copied)
                with self.scope('004A33B0',requestedLegionId=destination,candidateIds=copied):
                    second=list(copied)
                    self.step('0049F820/batch-copy',candidateIds=second)
                    for pid in second:self.set_legion(pid,destination)
                # Every reached field is read live following mutable effects.
                for bid in range(16384):
                    building=self.row('buildings',bid)
                    if building is None or not building['valid'] or not self._role_canonical(bid):continue
                    if self.base_legion(bid)==source:
                        self.boundary('effect','004AD550',buildingId=bid,requestedLegionId=destination)
                saved_home=self.leader_home(destination)
                destination_home=self._role_building_pointer(saved_home)
                self.save(savedDestinationHomeId=destination_home)
                if self._role_valid_pointer('buildings',destination_home):
                    for index,pid in enumerate(copied):
                        if not self.valid('persons',pid):continue
                        home=self._role_building_pointer(self.slot('persons',pid)['homeBaseId'])
                        if not self._role_valid_pointer('buildings',home):continue
                        if self.base_legion(home)!=self.slot('persons',pid)['rawLegionId']:
                            self.boundary('effect','004A8270',personId=pid,targetBuildingId=destination_home,
                                          copiedIndex=index)
                self.step('0047BE50/merge-copy-destroy',candidateIds=copied)
            self.reset_legion(source)

    def _empty_filter(self,candidates,lid):
        with self.scope('004BC780',field=5,value=lid,comparison=1,candidateIds=list(candidates)):
            kept=[]
            for cid in candidates:
                city=self.slot('cities',cid)
                # The precise canonical type6 allocation predicate is fixed by
                # the source contract; no generic building.valid is consulted.
                if city['valid'] and self._role_city_legion(cid)!=lid:kept.append(cid)
            self.step('004BC780/result',candidateIds=kept)
            return kept

    def _empty_nearest(self,origin,candidates):
        with self.scope('0049F1D0',originBuildingId=origin,candidateCityIds=list(candidates)):
            best=2**31-1;ties=[]
            for cid in candidates:
                a=self.territory(origin);b=self.territory(cid)
                distance=city_distance(self.source,a,b) if 0<=a<=41 and 0<=b<=41 else -1
                self.step('0047B480',originCityId=a,targetCityId=b,result=distance)
                if distance<best:best=distance;ties=[cid]
                elif distance==best:ties.append(cid)
            if not ties:self.defer('unsupported-null-nearest-city-result')
            initial=self.frame['rngState'];count=len(ties)
            if count>=2:
                seed=initial
                if self.source=='S2':
                    # Complete 008EB010 reads three external shared-page cells
                    # in this order. They are individually sampled observations,
                    # not a simultaneous clock snapshot or a mutable callback.
                    cells=self.boundary('query','008EB010/shared-user-data',
                                        addresses=['7FFE0320','7FFE0008','7FFE0014'])
                    if type(cells) is not list or len(cells)!=3:
                        raise ValueError('three ordered S2 shared-page reads required')
                    for value in cells:integer(value,'S2 shared-page dword',0,0xffffffff)
                    entropy=sum(cells)&0xffff
                    seed=(initial+entropy)&0xffffffff
                    self.step('008EB010',sampledDwords=cells,low16Entropy=entropy,
                              initialState=initial,seedOperand=seed)
                self.frame['rngState']=(seed*0x6c078965+0x3039)&0xffffffff
                self.localRngCalls+=1
                index=(self.frame['rngState']>>16)%count
            else:index=0
            self.step('00472150',bound=count,initialState=initial,finalState=self.frame['rngState'],
                      result=index,stateAdvances=int(count>=2))
            self.step('0049F1D0/result',candidateCityIds=ties,result=ties[index])
            return ties[index]

    def _empty_legion(self,lid,fid):
        with self.scope('004BE2A0/empty',legionId=lid,savedForceId=fid):
            if self.slot('legions',lid)['number']!=1:
                destination=self.force_legion(fid,1)
                self.merge_legion(lid,destination)
                return
            live_force=self.slot('legions',lid)['forceId']
            force=self.slot('forces',live_force)
            if force is not None and force['valid']:
                ruler=self.slot('persons',force['rulerId'])
                home=ruler['homeBaseId'] if ruler is not None and ruler['valid'] else -1
                self.step('00481210',forceId=live_force,result=home)
                origin=self._role_building_pointer(home)
                self.save(savedOriginBuildingId=origin)
                if self._role_valid_pointer('buildings',origin):
                    candidates=[]
                    for cid in range(42):
                        city=self.row('cities',cid)
                        if city is not None and city['valid'] and self._subtype_force(cid,'city')==live_force:
                            candidates.append(cid)
                    self.step('004CE2F0',forceId=live_force,candidateCityIds=candidates)
                    candidates=self._empty_filter(candidates,lid)
                    while candidates:
                        selected=self._empty_nearest(origin,candidates)
                        other=self._role_city_legion(selected)
                        # Native dereferences the getter result without a valid gate.
                        if self.slot('legions',other) is None:
                            self.defer('unsupported-null-primary-merge-source')
                        self.merge_legion(other,lid)
                        if self._role_legion_nonempty(lid):break
                        candidates=self._empty_filter(candidates,other)
                    self.step('0049F6D0',candidateCityIds=candidates,temporaryListDestroyed=True)
            if self._role_legion_nonempty(lid):return
            for ordinal in range(2,9):
                discarded=self.force_legion(fid,ordinal)
                self.step('004BE460/discarded-lookup',ordinal=ordinal,lookupResult=discarded,
                          actualGlobalLegionId=ordinal)
                # Preserve the actual 004BE46A push EBX, NOT the lookup result.
                if self.valid('legions',ordinal):self.merge_legion(ordinal,lid)

    def legion(self,lid):
        with self.scope('004BE2A0',legionId=lid):
            valid=self._role_valid_pointer('legions',lid)
            self.step('004BE2A0/entry',legionId=lid,valid=valid)
            if not valid:return
            fid=self.slot('legions',lid)['forceId']
            self.step('004BE2A0/force-range',forceId=fid,passed=0<=fid<=41)
            if not 0<=fid<=41:return
            if not self._role_force_survives(fid):self.defer('unsupported-force-extinction')
            if not self._role_legion_nonempty(lid):self._empty_legion(lid,fid)
            else:self._stable_legion(lid,fid)

    def _stable_legion(self,lid,fid):
        # EBX old leader is fetched at 004BE4E3, BEFORE collect/sort.
        old = self._role_person_pointer(self.slot('legions', lid)['leaderId'])
        copied = [pid for pid in range(1100)
                  if (self.row('persons', pid) is not None and
                      self.row('persons', pid)['valid'] and
                      self.row('persons', pid)['rawLegionId'] == lid)]
        with self.scope('004BE2A0/stable', legionId=lid, forceId=fid,
                        oldLeaderId=old, candidateIds=list(copied)):
            ranked = self._role_rank(copied, 'leader', True)
            if not ranked:
                self.defer('unsupported-empty-leader-after-sort')
            selected = ranked[0]
            self.step('004BE2A0/select', legionId=lid,
                      oldLeaderId=old, selectedId=selected,
                      candidateIds=list(copied), rankedIds=ranked)
            with self.scope('004BE2A0/roles', legionId=lid,
                            oldLeaderId=old, selectedLeaderId=selected):
                if (self._role_valid_pointer('persons', old) and
                        self.slot('persons', old)['status'] == 1):
                    old_home = self._role_building_pointer(
                        self.slot('persons', old)['homeBaseId'])
                    # EDI keeps this home pointer across at_home effects;
                    # neither home comparison nor old status is rechecked.
                    homes_differ = (self.slot('persons', old)['homeBaseId'] !=
                                    self.slot('persons', selected)['homeBaseId'])
                    with self.scope('004BE2A0/old-leader', oldLeaderId=old,
                                    savedHomeId=old_home,
                                    homesDiffer=homes_differ):
                        keep = (homes_differ and self.at_home(old, 'old-leader') and
                                self._role_valid_pointer('buildings', old_home) and
                                self.governor_id(old_home) == old)
                        if keep:
                            self._role_status(old, 2)
                        else:
                            if (self._role_valid_pointer('buildings', old_home) and
                                    self.governor_id(old_home) == old):
                                self.set_governor(old_home, None)
                            self._role_status(old, 3)
                # No selected validity gate exists here.  EBP is a saved
                # readable pointer; its current ruler flag is read now.
                if self.slot('persons', selected)['status'] != 0:
                    self._role_status(selected, 1)
                    if self.at_home(selected, 'new-leader'):
                        home = self._role_building_pointer(
                            self.slot('persons', selected)['homeBaseId'])
                        if self._role_valid_pointer('buildings', home):
                            old_gov = self._role_person_pointer(self.governor_id(home))
                            if (self._role_valid_pointer('persons', old_gov) and
                                    self.slot('persons', old_gov)['status'] == 2 and
                                    old_gov != selected):
                                self._role_status(old_gov, 3)
                            self.set_governor(home, selected)
                # 004A0940 DOES revalidate legion after recursive effects,
                # but does not revalidate the selected person's pointer.
                if self.valid('legions', lid):
                    self.write('legions', lid, 'leaderId', selected,
                               '004A0940/0047E110')
                else:
                    self.step('004A0940/no-op', legionId=lid,
                              requestedLeaderId=selected)
                for bid in range(87):
                    # Array scans may omit known unallocated sparse slots;
                    # reached pointer/getter accesses remain strict.
                    if self.row('buildings', bid) is None:
                        continue
                    if self._role_canonical(bid) and self.base_legion(bid) == lid:
                        self.governor(bid)
