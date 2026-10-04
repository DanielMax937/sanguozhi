"""Live, source-local role primitives for the recursive return composition.

Only 004BE2A0's stable nonempty branch, 004BCA30(refresh=0), and
004B3A20 are implemented.  The owner supplies the single mutable ``frame``,
strict canonical ``slot`` reads, sparse-array ``row`` reads, ``scope``, ``step``,
stage/frame/call-stack-bound ``boundary``, recursive ``emit_event``, and atomic
``defer``.  No legacy planner/transaction is called.

An ID held in a Python local represents a saved native pointer, not a saved row.
Every field access following an effect resolves that ID in the current frame.
Temporary candidate lists hold copied IDs and survive frame replacement.  Native
sorts with two or more entries are explicitly observed mutable whole calls;
capacity hooks, comparator order, machine code, stock behavior, and global RNG
are not claimed to have been independently executed or verified here.
"""
from __future__ import annotations

from collections import Counter
import copy
from recursive_return_frame import refresh_person_predicates


class RecursiveRolePrimitives:
    """Mixin for the one live-frame owner; all public arguments are scalar IDs."""

    def write(self, table, rid, field, value, helper):
        row = self.slot(table, rid)
        if row is None:
            self.defer('unsupported-null-role-write:' + helper)
        old = copy.deepcopy(row[field])
        row[field] = copy.deepcopy(value)
        if table == 'persons' and field in ('status','rawDword17C'):
            # Canonical virtual+04/+08 are live predicates, not writable raw
            # flags. A promotion from status6/8/out-of-range changes them now.
            refresh_person_predicates(row)
        self.step(helper, table=table, id=rid, field=field,
                  oldValue=old, value=copy.deepcopy(value))

    def force_of(self, pid):
        """Person virtual40: raw legion -> valid legion -> raw force number."""
        person = self.slot('persons', pid)
        if person is None:
            self.defer('unsupported-null-person-force-getter')
        legion = self.slot('legions', person['rawLegionId'])
        return legion['forceId'] if legion is not None and legion['valid'] else -1

    def _role_canonical(self, bid):
        """00486680/00487E10 classification, with no object-validity gate."""
        b = self.slot('buildings', bid)
        return bool(b is not None and (
            (b['kind'] == 0 and 0 <= bid <= 41) or
            (b['kind'] == 1 and 42 <= bid <= 51) or
            (b['kind'] == 2 and 52 <= bid <= 86)))

    def _role_subtype(self, bid):
        return self._role_canonical(bid) and self.slot('buildings', bid)['subtypeValid']

    def base_legion(self, bid):
        """Canonical base virtual44; subtype validity is distinct from base.valid."""
        return self.slot('buildings', bid)['legionId'] if self._role_subtype(bid) else -1

    def governor_id(self, bid):
        """00486890's current subtype-dispatched raw governor ID."""
        return self.slot('buildings', bid)['governorId'] if self._role_subtype(bid) else -1

    def _role_person_pointer(self, raw_id):
        # GetPersonPtr returns an address even for an invalid in-range person.
        return raw_id if self.slot('persons', raw_id) is not None else None

    def _role_building_pointer(self, raw_id):
        return raw_id if self.slot('buildings', raw_id) is not None else None

    def _role_valid_pointer(self, table, rid):
        return rid is not None and self.valid(table, rid)

    def _role_status(self, pid, value):
        # 004898F0 validates the requested status, not the object's validity.
        self.write('persons', pid, 'status', value, '004898F0')

    def at_home(self, pid, stage):
        """00489730, including the cached location comparison in 004896C0."""
        with self.scope('00489730', personId=pid, stage=stage):
            p = self.slot('persons', pid)
            if p is None:
                self.defer('unsupported-null-at-home-person')
            home = p['homeBaseId']
            normalized = home if 0 <= home <= 86 else -1
            location = p['locationId']
            matches = location == normalized
            self.step('004896C0/location', personId=pid, rawHomeId=home,
                      normalizedHome=normalized, locationId=location,
                      locationMatches=matches)
            if not matches:
                return False
            with self.scope('004896C0', personId=pid,
                            comparedHomeId=normalized, comparedLocationId=location):
                routed = self.boundary('effect-query', '005BA320',
                                       personId=pid, arg1=0, arg2=0, stage=stage)
            if type(routed) is not bool:
                raise ValueError('005BA320 routed-mission result must be bool')
            if routed:
                self.step('004896C0/result', personId=pid, result=False)
                return False
            # 0048973D reloads +98 AFTER the route callback.  The location
            # equality above is not repeated, even if the callback moved him.
            live_home = self.slot('persons', pid)['homeBaseId']
            home_id = self._role_building_pointer(live_home)
            home_valid = self._role_valid_pointer('buildings', home_id)
            result = bool(home_valid and self.base_legion(home_id) ==
                          self.slot('persons', pid)['rawLegionId'])
            self.step('00489730/result', personId=pid, homeId=live_home,
                      homeValid=home_valid, result=result)
            return result

    def _role_rank(self, candidates, stage, leader):
        """Observe 004AA200, including pre/post allocation filtering.

        The callback may replace the entire frame.  Result is the final copied
        candidate pointer list, not capacities interpreted with Python's sort.
        Duplicate temporary nodes are meaningful and retain multiplicity.
        """
        copied = list(candidates)
        if len(copied) < 2:
            self.step('004AA200/count-shortcut', stage=stage,
                      candidateIds=copied, sortFlag=1 if leader else 0)
            return copied
        if any(not self.valid('persons', pid) for pid in copied):
            self.defer('unsupported-invalid-ranking-candidate')
        comparator = '004CEF90' if leader else '004CF160'
        with self.scope('004AA200', stage=stage, comparator=comparator,
                        sortFlag=1 if leader else 0, candidateIds=copied):
            ranked = self.boundary('effect-query', '004AA200', stage=stage,
                                   comparator=comparator, sortFlag=1 if leader else 0,
                                   candidateIds=copied, extra0=0, extra1=0)
        if type(ranked) is not list or any(type(pid) is not int or
                                          not 0 <= pid <= 1099 for pid in ranked):
            raise ValueError('004AA200 result must be canonical person ID list')
        # Both native copy passes check allocation, potentially at different
        # times.  Endpoint frames cannot prove every intermediate allocation
        # state, so membership is deliberately only an observed sub-multiset.
        # Ordering, omissions, and dynamic reachability remain observations.
        if not Counter(ranked) <= Counter(copied):
            raise ValueError('004AA200 result violates copied candidate membership')
        self.step('004AA200/observed-result', stage=stage,
                  candidateIds=copied, rankedIds=list(ranked))
        return list(ranked)

    def set_governor(self, bid, pid_or_None):
        """004B3A20: event8 occurs before the current subtype setter."""
        requested = pid_or_None
        with self.scope('004B3A20', buildingId=bid, requestedPersonId=requested):
            base_valid = self._role_valid_pointer('buildings', bid)
            requested_valid = (requested is None or
                               self._role_valid_pointer('persons', requested))
            self.step('004B3A20/entry', buildingId=bid,
                      requestedPersonId=requested, buildingValid=base_valid,
                      requestedValid=requested_valid)
            if not base_valid or not requested_valid:
                return
            old_id = self._role_person_pointer(self.governor_id(bid))
            if self._role_valid_pointer('persons', old_id) and old_id != requested:
                self.emit_event(dict(id=8, subjectType='person',
                                     subjectId=old_id, argument=0))
            # Native 004B3A7F rereads governor after event8 but discards it.
            reread = self.governor_id(bid)
            self.step('004B3A20/post-event-governor-read', buildingId=bid,
                      governorId=reread, requestedPersonId=requested)
            # Saved EBX pointer converts to its ID without another validity
            # test.  The setter independently tests current subtype validity.
            value = -1 if requested is None else requested
            if self._role_subtype(bid):
                setter = '0047B4B0' if bid <= 41 else '0048D9A0'
                self.write('buildings', bid, 'governorId', value,
                           '00487780/' + setter)
            else:
                self.step('00487780/no-op', buildingId=bid,
                          requestedPersonId=requested)

    def governor(self, bid):
        """004BCA30 refresh=0 using live rereads and saved temporary pointers."""
        with self.scope('004BCA30', buildingId=bid, refreshFlag=0):
            valid = self._role_valid_pointer('buildings', bid)
            self.step('004BCA30/entry', buildingId=bid, refreshFlag=0, valid=valid)
            if not valid:
                return
            roster = (list(self.slot('buildings', bid)['homeRosterIds'])
                      if self._role_subtype(bid) else [])
            collected = []
            for pid in roster:
                p = self.slot('persons', pid)
                if p is not None and p['allocated'] and 0 <= p['status'] <= 3:
                    collected.append(pid)
            self.step('004CF360', buildingId=bid, rosterIds=roster,
                      candidateIds=list(collected), statusMask=15)
            # 004BCB3A fetches this ONCE, before any B95E0 route callbacks.
            saved_legion = self.base_legion(bid)
            candidates = []
            with self.scope('004BC870', buildingId=bid,
                            savedLegionId=saved_legion, candidateIds=collected):
                for index, pid in enumerate(collected):
                    p = self.slot('persons', pid)
                    # BBA10 checks allocated again for each copied node.
                    if p is None or not p['allocated']:
                        continue
                    same_legion = p['rawLegionId'] == saved_legion
                    kept = same_legion and self.at_home(pid, 'governor:' + str(bid))
                    if kept:
                        # No validity, status, allocation, or legion recheck
                        # after the predicate's route callback returns.
                        candidates.append(pid)
                    self.step('004B95E0/result', buildingId=bid,
                              candidateIndex=index, personId=pid,
                              savedLegionId=saved_legion, kept=kept)
            self.step('004BC870/result', buildingId=bid,
                      candidateIds=list(candidates), savedLegionId=saved_legion)
            selected = None
            # This scan occurs after EVERY filtering callback.  It inspects
            # raw status even if an earlier accepted pointer became invalid.
            for pid in candidates:
                if self.slot('persons', pid)['status'] <= 1:
                    selected = pid
            shortcut = selected is not None
            if candidates and selected is None:
                with self.scope('004B2090', buildingId=bid,
                                candidateIds=list(candidates)):
                    ranked = self._role_rank(candidates, 'governor:' + str(bid), False)
                    selected = ranked[0] if ranked else None
            self.step('004BCA30/select', buildingId=bid,
                      candidateIds=list(candidates), selectedId=selected,
                      lastStatusShortcut=shortcut)
            # The old governor is resolved AFTER sort effects.  Selected is
            # saved independently of subsequent mutations to role fields.
            old = self._role_person_pointer(self.governor_id(bid))
            if self._role_valid_pointer('persons', old):
                old_home = self.slot('persons', old)['homeBaseId']
                if self.slot('persons', old)['status'] == 2:
                    if old_home == bid:
                        self._role_status(old, 3)
                    else:
                        old_base = self._role_building_pointer(old_home)
                        if (self._role_valid_pointer('buildings', old_base) and
                                self.governor_id(old_base) != old):
                            self._role_status(old, 3)
            if self._role_valid_pointer('persons', selected):
                if self.slot('persons', selected)['status'] not in (0, 1):
                    self._role_status(selected, 2)
                self.set_governor(bid, selected)
            else:
                self.set_governor(bid, None)
                # Unconditional after the setter, even after recursive event8.
                self.emit_event(dict(id=14, subjectType='building',
                                     subjectId=bid, argument=0))

    def _role_city_legion(self, cid):
        # GetCityPtr is a separate subtype pointer; its raw legion is not
        # guarded by the generic building object's validity or kind.
        return self.slot('buildings', cid)['legionId']

    def _role_force_survives(self, fid):
        with self.scope('004BBDB0', forceId=fid):
            people = []
            if self.valid('forces', fid):
                for pid in range(1100):
                    p = self.row('persons', pid)
                    if p is not None and p['allocated'] and self.force_of(pid) == fid:
                        if 0 <= self.slot('persons', pid)['status'] <= 3:
                            people.append(pid)
            self.step('004CF480', forceId=fid, statusMask=15,
                      candidateIds=people)
            if not people:
                return False
            for cid in range(42):
                city = self.row('cities', cid)
                if city is None or not city['valid']:
                    continue
                legion = self.slot('legions', self._role_city_legion(cid))
                city_force = (legion['forceId']
                              if legion is not None and legion['valid'] else -1)
                if city_force == fid:
                    self.step('004BBDB0/result', forceId=fid, cityId=cid, result=True)
                    return True
            self.step('004BBDB0/result', forceId=fid, result=False)
            return False

    def _role_legion_nonempty(self, lid):
        with self.scope('004B9550', legionId=lid):
            city_id = None
            for cid in range(42):
                city = self.row('cities', cid)
                if (city is not None and city['valid'] and
                        self._role_city_legion(cid) == lid):
                    city_id = cid
                    break
            if city_id is not None:
                for pid in range(1100):
                    p = self.row('persons', pid)
                    if p is not None and p['valid'] and p['rawLegionId'] == lid:
                        self.step('004B9550/result', legionId=lid,
                                  cityId=city_id, personId=pid, result=True)
                        return True
            self.step('004B9550/result', legionId=lid, cityId=city_id, result=False)
            return False

    def legion(self, lid):
        """004BE2A0 stable nonempty branch; unsupported branches reject atomically."""
        with self.scope('004BE2A0', legionId=lid):
            valid = self._role_valid_pointer('legions', lid)
            self.step('004BE2A0/entry', legionId=lid, valid=valid)
            if not valid:
                return
            fid = self.slot('legions', lid)['forceId']
            self.step('004BE2A0/force-range', forceId=fid, passed=0 <= fid <= 41)
            if not 0 <= fid <= 41:
                return
            if not self._role_force_survives(fid):
                self.defer('unsupported-force-extinction')
            if not self._role_legion_nonempty(lid):
                self.defer('unsupported-empty-legion-redistribution')
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
