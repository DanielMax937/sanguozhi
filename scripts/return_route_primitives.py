"""P0-64 native route/target-force reads in the same mutable recursive frame.

Only fixed canonical source vtables execute. These complete selected read paths
have no opaque gameplay callback. Mutations before and after them still resolve
through the shared frame; saved native IDs in callers are never recomputed.
"""
from __future__ import annotations
from return_route_tables import TERRITORY_CITY_TABLES


class ReturnRoutePrimitives:
    def mission_arg(self,pid,index):
        # 004897B0's broader native getter accepts index5 too, but no reached
        # 005BA320 branch requests it. This frame retains five mission args.
        if index not in (0,1): self.defer('unsupported-route-mission-argument-index')
        value=self.slot('persons',pid)['missionArgs'][index]
        self.step('004897B0',personId=pid,index=index,result=value)
        return value

    def _territory_cell(self,x,y,caller):
        linear=x*200+y
        self.step(caller+'/map-address',positionX=x,positionY=y,linearIndex=linear)
        # 00487EB0 does NOT perform coordinate bounds checks. This guard is
        # the declared readable map-allocation domain, not a source branch.
        if not 0<=linear<=39999: self.defer('unsupported-native-map-read-domain')
        raw=self.slot('mapCells',linear)['rawTerritoryDword']
        index=(raw>>5)&127
        value=TERRITORY_CITY_TABLES[self.source][index]
        self.step('004839F0',caller=caller,mapIndex=linear,rawTerritoryDword=raw,
                  territoryIndex=index,result=value)
        return value

    def territory(self,bid):
        """0049E450: building valid, signed coordinate bounds, map lookup."""
        with self.scope('0049E450',buildingId=bid):
            b=self.slot('buildings',bid)
            valid=b is not None and b['valid']
            self.step('0049E450/valid',buildingId=bid,result=valid)
            if not valid:return -1
            x,y=b['positionX'],b['positionY']
            self.step('00487DC0',buildingId=bid,positionX=x,positionY=y)
            bounded=0<=x<200 and 0<=y<200
            self.step('0049E450/coordinates',positionX=x,positionY=y,passed=bounded)
            return self._territory_cell(x,y,'0049E450') if bounded else -1

    def route(self,pid,targetOutput,territoryOutput,stage):
        """005BA320 with optional disjoint caller-owned output cells.

        Return 'written' flags describe native stores. Unwritten output values
        are represented as None, never claimed writes to the caller's memory.
        There is no person.valid/force.valid or target.valid gate for routing.
        """
        with self.scope('005BA320',personId=pid,targetOutput=targetOutput,
                        territoryOutput=territoryOutput,stage=stage):
            mission=self.slot('persons',pid)['missionId']
            self.save(capturedMissionId=mission)
            self.step('005BA320/mission',personId=pid,missionId=mission)
            value=None
            if mission in (9,10,23,24):value=self.mission_arg(pid,0)
            elif mission==12:value=self.mission_arg(pid,1)
            elif 15<=mission<=22:
                fid=self.mission_arg(pid,0)
                self.step('005BA35A/force-range',forceId=fid,passed=0<=fid<=46)
                if 0<=fid<=46:
                    ruler=self.slot('forces',fid)['rulerId']
                    self.save(savedTargetForceId=fid,savedTargetRulerId=ruler)
                    self.step('005BA36E',forceId=fid,rulerId=ruler,forceValidityRead=False)
                    person=self.slot('persons',ruler)
                    valid=person is not None and person['valid']
                    self.step('005BA37F/ruler-valid',personId=ruler,result=valid)
                    if valid:
                        value=self.slot('persons',ruler)['homeBaseId']
                        self.step('005BA38B',personId=ruler,homeBaseId=value)
            elif mission==37:
                value=self.slot('persons',pid)['homeBaseId']
                self.step('005BA393',personId=pid,homeBaseId=value)
            routed=value is not None and 0<=value<=16383
            # Default mission, force range and ruler-valid failures jump straight
            # to005BA3A4: do not emit a target-range instruction they skipped.
            if value is not None:
                self.step('005BA399/target-range',targetId=value,passed=routed)
            result=dict(routed=routed,targetWritten=False,targetId=None,
                        territoryWritten=False,territoryId=None)
            if not routed:
                self.step('005BA320/return',returnValue=0)
                return result
            self.save(savedRouteTargetId=value)
            if targetOutput:
                result.update(targetWritten=True,targetId=value)
                self.step('005BA3B0',targetId=value,output='target')
            if territoryOutput:
                territorial=self.territory(value)
                result.update(territoryWritten=True,territoryId=territorial)
                self.step('005BA3D0',territoryId=territorial,output='territory')
            self.step('005BA320/return',returnValue=1)
            return result

    def _facility_category(self,bid,caller):
        kind=self.slot('buildings',bid)['kind']
        if not 0<=kind<=63:
            self.step(caller+'/kind-range',buildingId=bid,kind=kind,passed=False)
            return -1
        value=self.slot('facilityInfos',kind)['category']
        self.step(caller,buildingId=bid,kind=kind,category=value)
        return value

    def _direct_owner_kind(self,bid):
        """00487B30 ordered category1, kind24 exception/category3, category2."""
        with self.scope('00487B30',buildingId=bid):
            if self._facility_category(bid,'00487B4A')==1:return True
            if self.slot('buildings',bid)['kind']!=24:
                if self._facility_category(bid,'00487B6F')==3:return True
            return self._facility_category(bid,'00487B9F')==2

    def _subtype_force(self,bid,subtype):
        # The subtype pointer is distinct from generic building. A territorial
        # city does not recheck the generic building's kind or validity.
        with self.scope('0047B2B0',buildingId=bid,subtype=subtype):
            lid=self.slot('buildings',bid)['legionId']
            self.step('0047C320' if subtype=='city' else '00483810',buildingId=bid,legionId=lid)
            legion=self.slot('legions',lid)
            valid=legion is not None and legion['valid']
            self.step('0047A630/legion',legionId=lid,result=valid)
            value=legion['forceId'] if valid else -1
            self.step('0047B2B0/result',legionId=lid,forceId=value)
            return value

    def target_force(self,bid,stage):
        """00487EB0 fixed building vtable; no entry valid(building) gate."""
        with self.scope('00487EB0',buildingId=bid,stage=stage):
            self.slot('buildings',bid)
            if self._direct_owner_kind(bid):
                value=self.slot('buildings',bid)['rawOwnerForceId']
                self.step('00487EBD',buildingId=bid,forceId=value)
                return value
            category=self._facility_category(bid,'00487EDB')
            if category==4:
                b=self.slot('buildings',bid);x,y=b['positionX'],b['positionY']
                self.step('00487DC0',buildingId=bid,positionX=x,positionY=y)
                city=self._territory_cell(x,y,'00487EB0')
                valid=self.valid('cities',city)
                self.step('00487F2A/city-valid',cityId=city,result=valid)
                if valid:return self._subtype_force(city,'city')
            b=self.slot('buildings',bid);kind=b['kind']
            subtype='city' if kind==0 and 0<=bid<=41 else 'gate' if kind==1 and 42<=bid<=51 else 'port' if kind==2 and 52<=bid<=86 else None
            valid=subtype is not None and b['subtypeValid']
            self.step('00487F42/subtype',buildingId=bid,kind=kind,subtype=subtype,valid=valid)
            return self._subtype_force(bid,subtype) if valid else -1

    def at_home(self,pid,stage):
        """004896C0 location snapshot, direct route, then 00489730 live home."""
        with self.scope('00489730',personId=pid,stage=stage):
            p=self.slot('persons',pid)
            if p is None:self.defer('unsupported-null-at-home-person')
            home=p['homeBaseId'];normalized=home if 0<=home<=86 else -1
            location=p['locationId'];matches=location==normalized
            self.step('004896C0/location',personId=pid,rawHomeId=home,
                      normalizedHome=normalized,locationId=location,locationMatches=matches)
            if not matches:return False
            with self.scope('004896C0',personId=pid,comparedHomeId=normalized,comparedLocationId=location):
                routed=self.route(pid,False,False,stage)['routed']
            if routed:
                self.step('004896C0/result',personId=pid,result=False)
                return False
            live_home=self.slot('persons',pid)['homeBaseId']
            home_id=self._role_building_pointer(live_home)
            home_valid=self._role_valid_pointer('buildings',home_id)
            result=bool(home_valid and self.base_legion(home_id)==self.slot('persons',pid)['rawLegionId'])
            self.step('00489730/result',personId=pid,homeId=live_home,homeValid=home_valid,result=result)
            return result
