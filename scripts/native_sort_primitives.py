"""Native order, occurrence identity, live comparisons and capacity hooks.

The owner supplies one current frame and exact stage-bound mutable boundaries.
No Python sort/key cache replaces native comparison control flow. Logical array
and list allocation is successful in the explicitly selected model domain.
"""
from __future__ import annotations
from contextlib import contextmanager
from capture_transaction_profile import integer


def quicksort_native(values, compare, identity, enter, out_of_bounds):
    """0047B910 / 004A69E0, inclusive bounds; right tail is iterative."""
    def get(index):
        if not 0<=index<len(values): out_of_bounds('unsupported-native-sort-array-read')
        return values[index]

    def visit(lo, hi):
        with enter(lo,hi):
            while lo < hi:
                if hi-lo == 1:
                    if not compare(get(lo),get(hi)):
                        values[lo],values[hi]=get(hi),get(lo)
                    return
                pivot=get((lo+hi)//2)
                i,j=lo,hi
                while True:
                    while identity(get(i))!=identity(pivot) and compare(get(i),pivot):
                        i+=1
                    while identity(get(j))!=identity(pivot) and compare(pivot,get(j)):
                        j-=1
                    if i>=j: break
                    values[i],values[j]=get(j),get(i)
                    i+=1;j-=1
                if lo < i-1: visit(lo,i-1)
                lo=j+1
    if values: visit(0,len(values)-1)


def mergesort_native(values, compare, enter):
    """004A6B70: recurse left, right; copy left; true takes left, else right."""
    def visit(lo,hi):
        with enter(lo,hi):
            if lo>=hi: return
            mid=(lo+hi)//2
            visit(lo,mid);visit(mid+1,hi)
            left=list(values[lo:mid+1]);li=0;right=mid+1;out=lo
            while right<=hi and li<len(left):
                if compare(left[li],values[right]):
                    values[out]=left[li];li+=1
                else:
                    values[out]=values[right];right+=1
                out+=1
            while li<len(left):
                values[out]=left[li];li+=1;out+=1
    if values: visit(0,len(values)-1)


class NativeSortPrimitives:
    @contextmanager
    def sort_scope(self,helper,low,high):
        # Bounded simulation stack, not a source sorting rule.
        depth=getattr(self,'sortDepth',0)+1
        if depth>self.policy['engineGuard']['maxSortDepth']:
            self.defer('engine-guard-sort-depth')
        self.sortDepth=depth
        try:
            with self.scope(helper,low=low,high=high): yield
        finally:
            self.sortDepth-=1

    def _roster_key0(self,pid):
        # Every reached allocated check belongs to the virtual getter chain.
        for helper in ('004C9610','004C90E0','004C8720'):
            if not self._allocated(pid,helper+'/allocated'):
                # For field0,direction1, wrapper maps -1 to INT_MAX.
                return 2**31-1
        self.step('00491310',personId=pid,result=pid)
        return pid

    def _allocated(self,pid,helper):
        value=self.slot('persons',pid)['allocated']
        self.step(helper,personId=pid,result=value)
        return value

    def _valid_person(self,pid,helper):
        value=self.valid('persons',pid)
        self.step(helper,personId=pid,result=value)
        return value

    def _read_person(self,pid,key,helper):
        value=self.slot('persons',pid)[key]
        self.step(helper,personId=pid,field=key,result=value)
        return value

    def _is_ruler(self,pid):
        status=self.slot('persons',pid)['status']
        self.step('00488C00',personId=pid,status=status,result=status==0)
        return status==0

    def _person_id(self,pid):
        # Canonical contiguous slots: virtual+28 returns the fixed numeric ID.
        self.step('person.virtual28',personId=pid,result=pid)
        return pid

    def _sort_compare(self,left,right,comparator):
        with self.scope(comparator,left=left,right=right,extra0=0,extra1=0):
            if comparator=='004A6960': result=self.roster_compare(left,right)
            elif comparator=='004CEF90': result=self.leader_compare(left,right)
            else: result=self.governor_compare(left,right)
            self.step(comparator+'/result',result=bool(result))
            return bool(result)

    def roster_key(self,pid):
        """Canonical virtual+14(field0,1,0), exact scalar path only."""
        with self.scope('00488720',personId=pid,field=0,direction=1,extra=0):
            # Filled from the separately verified field0 path below.
            return self._roster_key0(pid)

    def roster_compare(self,left,right):
        lp,rp=left['personId'],right['personId']
        if not self._allocated(lp,'004A6960/left-allocated'):
            return lp < rp
        if not self._allocated(rp,'004A6960/right-allocated'):
            return lp < rp
        if left['key']!=right['key']: return left['key'] < right['key']
        saved_right=self._person_id(rp)
        return self._person_id(lp) < saved_right

    def sort_roster(self,table,rid,key):
        with self.scope('0047CD50',table=table,rosterId=rid,rosterField=key,arguments=[1,0,0,0]):
            roster=self.slot(table,rid)[key]
            count=len(roster);self.step('0047CD50/count',count=count)
            if count<2:
                self.step('0047CD50/return',returnValue=1,countBelowTwo=True)
                return 1
            # This bounded scalar-key route has no mutable callback between
            # saving the next list node and visiting it. The copied occurrence
            # list denotes readable node identities, not a set of people.
            copied=list(roster);entries=[]
            self.save(copiedRosterIds=copied)
            for occurrence,pid in enumerate(copied):
                with self.scope('0047CD50/key',occurrence=occurrence,personId=pid):
                    if self._allocated(pid,'0047CD50/first-filter'):
                        value=self.roster_key(pid)
                        entries.append(dict(occurrence=occurrence,personId=pid,key=value))
                        self.step('0047CD50/cache-key',entry=entries[-1])
            with self.scope('0047C6A0',entryCount=len(entries),entries=entries):
                if len(entries)>=2:
                    quicksort_native(entries,lambda a,b:self._sort_compare(a,b,'004A6960'),
                                     lambda x:x['occurrence'],
                                     lambda lo,hi:self.sort_scope('0047B910',low=lo,high=hi),self.defer)
                else:
                    self.step('0047C6A0/count-shortcut',count=len(entries))
            self.slot(table,rid)[key]=[]
            self.step('0047BE50/clear-original',table=table,rosterId=rid,rosterField=key)
            for entry in entries:
                pid=entry['personId']
                if self._allocated(pid,'0047CD50/second-filter'):
                    self.slot(table,rid)[key].append(pid)
                    self.step('0047CF0C/append',table=table,rosterId=rid,personId=pid,
                              occurrence=entry['occurrence'])
            self.step('0047CD50/return',returnValue=1,sortedEntries=entries)
            return 1

    def roster_append_sort(self,table,rid,key,pid):
        self.slot(table,rid)[key].append(pid)
        self.step('0047C1B0',table=table,rosterId=rid,personId=pid,append=True)
        return self.sort_roster(table,rid,key)

    def _role_rank(self,candidates,stage,leader):
        copied=list(candidates);flag=int(leader)
        if len(copied)<2:
            self.step('004AA200/count-shortcut',stage=stage,candidateIds=copied,sortFlag=flag)
            return copied
        comparator='004CEF90' if leader else '004CF160'
        with self.scope('004AA200',stage=stage,comparator=comparator,sortFlag=flag,candidateIds=copied):
            kept=[]
            for occurrence,pid in enumerate(copied):
                if self._allocated(pid,'004AA200/first-filter'):
                    kept.append(pid)
            self.save(copiedAllocatedIds=kept)
            sort_helper='004A8F40' if leader else '004A8FF0'
            algorithm='004A69E0' if leader else '004A6B70'
            with self.scope(sort_helper,candidateIds=kept,comparator=comparator,extra0=0,extra1=0):
                compare=lambda a,b:self._sort_compare(a,b,comparator)
                enter=lambda lo,hi:self.sort_scope(algorithm,low=lo,high=hi)
                if len(kept)<2:
                    self.step(sort_helper+'/count-shortcut',count=len(kept))
                elif leader: quicksort_native(kept,compare,lambda x:x,enter,self.defer)
                else: mergesort_native(kept,compare,enter)
            self.step('004AA200/clear-original',candidateIds=copied)
            ranked=[]
            for occurrence,pid in enumerate(kept):
                if self._allocated(pid,'004AA200/second-filter'):
                    ranked.append(pid)
                    self.step('004AA305/append',occurrence=occurrence,personId=pid)
            self.step('004AA200/native-result',stage=stage,candidateIds=copied,rankedIds=ranked)
            return ranked

    def leader_compare(self,left,right):
        if not self._valid_person(left,'004CEF90/left-valid'): return left<right
        if not self._valid_person(right,'004CEF90/right-valid'): return left<right
        ruler_left=self._is_ruler(left)
        ruler_right=self._is_ruler(right)
        if ruler_left!=ruler_right: return ruler_left
        # Deliberately no left==right shortcut: duplicate pointers still cause
        # both capacity calls. Saved low16 survives the right-side callback.
        left_cap=self.capacity(left)&0xffff
        self.save(savedLeftCapacity=left_cap)
        right_cap=self.capacity(right)&0xffff
        if left_cap!=right_cap: return left_cap>right_cap
        left_office=self._read_person(left,'officeId','004CEF90/office')
        right_office=self._read_person(right,'officeId','004CEF90/office')
        if left_office!=right_office: return left_office<right_office
        left_ability=self._read_person(left,'leadershipByte','00489070')
        right_ability=self._read_person(right,'leadershipByte','00489070')
        return left_ability>right_ability if left_ability!=right_ability else left<right

    def governor_compare(self,left,right):
        if not self._valid_person(left,'004CF160/left-valid'): return left<right
        if not self._valid_person(right,'004CF160/right-valid'): return left<right
        if left==right:return False
        ls=self._read_person(left,'status','004CF160/status')
        if ls<=1:
            rs=self._read_person(right,'status','004CF160/status')
            if ls!=rs:return ls<rs
        elif self._read_person(right,'status','004CF160/status-gate')<=1:
            rs=self._read_person(right,'status','004CF160/status')
            if ls!=rs:return ls<rs
        left_cap=self.capacity(left)&0xffff
        self.save(savedLeftCapacity=left_cap)
        right_cap=self.capacity(right)&0xffff
        if left_cap!=right_cap:return left_cap>right_cap
        for field,helper in (('leadershipByte','00489070'),('strengthByte','00489080')):
            a=self._read_person(left,field,helper);b=self._read_person(right,field,helper)
            if a!=b:
                # Native comparator repeats the two getters in the unequal arm.
                a=self._read_person(left,field,helper);b=self._read_person(right,field,helper)
                return a>b
        a=self._read_person(left,'rawWordAE','004CF160/rawAE')
        b=self._read_person(right,'rawWordAE','004CF160/rawAE')
        if a!=b:return a>b
        left_id=self._person_id(left)
        return left_id<self._person_id(right)

    def _effect_query(self,helper,**args):
        value=self.boundary('effect-query',helper,**args)
        integer(value,'native query signed result',-2**31,2**31-1)
        return value

    def _capacity_record(self,table,rid):
        row=self.slot(table,rid)
        if row is None or not row['valid']:return None
        value=row['capacityWord']
        self.step('0049D420/table-read',table=table,recordId=rid,capacityWord=value)
        return value

    def base_capacity(self,pid):
        with self.scope('0049D420',personId=pid):
            if not self._valid_person(pid,'0049D420/person-valid'):return 0
            fid=self.force_of(pid)
            if not self.valid('forces',fid):return 0
            self.save(savedForceId=fid)
            if self.source=='S2':
                with self.scope('0090E8D8',personId=pid,savedForceId=fid):
                    query=self._effect_query('004890F0',personId=pid,queryId=377,caller='0090E8D8')
                    if query:
                        ruler=self._is_ruler(pid)
                        return 15000 if ruler else 12000
            # S2 false continuation retains the saved force even if its validity
            # or the person's force changed inside query377. No new gate here.
            special=self.slot('forces',fid)['raw40']==5
            ruler=self._is_ruler(pid)
            if ruler:
                title=self.slot('forces',fid)['titleId']
                title=0 if special else title if 0<=title<=9 else 9
                result=self._capacity_record('titles',title)
                if result is not None:return result
            office=self._read_person(pid,'officeId','0049D4AA')
            if special:
                # Source S2 still performs both raw+54 loads before its
                # unconditional branch, but never enters title0 equality arm.
                person54=self._read_person(pid,'rawDword54','0049D4C1')
                other54=self._read_person(403,'rawDword54','0049D4C4')
                if self.source=='S1' and person54==other54:
                    result=self._capacity_record('titles',0)
                    if result is not None:return result
                office=20
            elif not 0<=fid<=41:
                office=44 if self.source=='S1' else 0
            elif not 0<=office<=80:
                office=80
            result=self._capacity_record('offices',office)
            return 0 if result is None else result

    def capacity(self,pid):
        with self.scope('0048A4F0',personId=pid):
            with self.scope('0049D540',personId=pid):
                total=self.base_capacity(pid)
                self.save(savedBaseCapacity=total)
                if not self._valid_person(pid,'0049D540/person-valid'):return total
                fid=self.force_of(pid)
                force_valid=self.valid('forces',fid)
                self.save(savedBonusForceId=fid,bonusForceValid=force_valid)
                if force_valid:
                    technique=18 if self.source=='S1' else 3
                    bits=self.slot('forces',fid)['techniqueBits']
                    learned=bool(bits[technique//32] & (1<<(technique%32)))
                    self.step('004811E0',forceId=fid,techniqueId=technique,result=learned)
                    if learned:total+=3000
                if self.source=='S2':
                    with self.scope('0090D1A8',personId=pid,savedCapacity=total):
                        query=self._effect_query('004890F0',personId=pid,queryId=278,caller='0090D1A8')
                    if query:total+=2000
                self.step('0049D540/result',personId=pid,result=total)
                return total
