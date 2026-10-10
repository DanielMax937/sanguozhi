#!/usr/bin/env python3
"""Independent full-listing interpreter; source-listing-reconstruction only.

The five callees are explicit return/ABI observation stubs, never reconstructed
helpers. Listed bytes are authenticated to the pinned document, not to a stock
executable. The sole mnemonic correction is C1 FA 05 => SAR EDX,05 (not DL).
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass, replace
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/sources/search-talent-original.gbk'
PROFILE = 'search-talent-resolved-v1'
SOURCE_SHA = 'b0c07d056947b42078e32574d1d91d429bad1db2ddf78d22a806330f5eaf578c'
SOURCE_BLOB = 'd069a0a06b809de318b9f99deb1bb70f9b8dd3c7'
CODE_SHA = '0a1d67a620fa80d5d535290937e9ab5c742f685d16c0ef1ec8a238e270e2da9b'
ENTRY, END, MASK = 0x5d1df0, 0x5d1e93, 0xffffffff
RECORD = struct.Struct('<BiiiI')
EVIDENCE = {
    'level':'source-listing-reconstruction','profile':PROFILE,
    'source':'docs/sources/search-talent-baseline.json',
    'originalRange':'005D1DF0..005D1E92',
    'scope':'resolved stable inputs; filtered-candidate numerical baseline only',
    'listedBytesVerified':True,'stockOriginalVerified':False,
    'originalExecutableExecuted':False,'nativeHelpersReconstructed':False,
    'callerIntegrated':False,'finalProbabilityRecovered':False,'rngIntegrated':False,
    'searchGoldRecovered':False,'searchTreasureRecovered':False,
}
# Independently reviewed address/byte/mnemonic listing, including original typo.
PINNED = '''
005D1DF0 55 push ebp
005D1DF1 8b6c240c mov ebp,[esp+0c]
005D1DF5 55 push ebp
005D1DF6 e83588eaff call 0047a630
005D1DFB 83c404 add esp,04
005D1DFE 85c0 test eax,eax
005D1E00 7502 jne 005d1e04
005D1E02 5d pop ebp
005D1E03 c3 ret
005D1E04 56 push esi
005D1E05 6a00 push 00
005D1E07 8bcd mov ecx,ebp
005D1E09 e8b2a6eaff call 0047c4c0
005D1E0E 8b742418 mov esi,[esp+18]
005D1E12 50 push eax
005D1E13 6820175d00 push 005d1720
005D1E18 56 push esi
005D1E19 b908989907 mov ecx,07999808
005D1E1E e86dd7efff call 004cf590
005D1E23 8b760c mov esi,[esi+0c]
005D1E26 85f6 test esi,esi
005D1E28 7505 jne 005d1e2f
005D1E2A 5e pop esi
005D1E2B 33c0 xor eax,eax
005D1E2D 5d pop ebp
005D1E2E c3 ret
005D1E2F 57 push edi
005D1E30 8b7c2410 mov edi,[esp+10]
005D1E34 6a55 push 55
005D1E36 8bcf mov ecx,edi
005D1E38 e8b372ebff call 004890f0
005D1E3D 85c0 test eax,eax
005D1E3F 7409 je 005d1e4a
005D1E41 5f pop edi
005D1E42 5e pop esi
005D1E43 b864000000 mov eax,00000064
005D1E48 5d pop ebp
005D1E49 c3 ret
005D1E4A 8b4518 mov eax,[ebp+18]
005D1E4D 3b87e4000000 cmp eax,[edi+000000e4]
005D1E53 53 push ebx
005D1E54 b30a mov bl,0a
005D1E56 7502 jne 005d1e5a
005D1E58 b30b mov bl,0b
005D1E5A 8bcf mov ecx,edi
005D1E5C e83f72ebff call 004890a0
005D1E61 83fe05 cmp esi,05
005D1E64 b905000000 mov ecx,00000005
005D1E69 7f02 jg 005d1e6d
005D1E6B 8bce mov ecx,esi
005D1E6D 0fb6d0 movzx edx,al
005D1E70 8d4c4907 lea ecx,[ecx+ecx*2+07]
005D1E74 0fafca imul ecx,edx
005D1E77 0fb6c3 movzx eax,bl
005D1E7A 0fafc8 imul ecx,eax
005D1E7D b8b5814e1b mov eax,1b4e81b5
005D1E82 f7e9 imul ecx
005D1E84 5b pop ebx
005D1E85 c1fa05 sar dl,05
005D1E88 5f pop edi
005D1E89 8bc2 mov eax,edx
005D1E8B c1e81f shr eax,1f
005D1E8E 5e pop esi
005D1E8F 03c2 add eax,edx
005D1E91 5d pop ebp
005D1E92 c3 ret
'''.strip()


def sha(raw): return hashlib.sha256(raw).hexdigest()
def signed(x): return (x & MASK) - (0x100000000 if x & 0x80000000 else 0)


@dataclass(frozen=True)
class Instruction:
    address: int
    raw: bytes
    op: str
    args: tuple[str, ...]
    next_pc: int


def parse_listing(text):
    rows=[]
    for line in text.splitlines():
        m=re.match(r'^([0-9A-F]{8}) - ([0-9a-f ]+?)\s+- ([a-z]+)(?:\s+([^\u0080-\uffff]*))?',line)
        if not m or not ENTRY <= int(m[1],16) < END: continue
        address, raw, op, args=m.groups()
        args=(args or '').strip().split('  ')[0].strip()
        rows.append((address,raw.replace(' ',''),op,args))
    canonical='\n'.join(' '.join(row).rstrip() for row in rows)
    assert canonical == PINNED, 'pinned address/byte/mnemonic listing changed'
    code={}; pc=ENTRY
    for address, raw, op, args in rows:
        a=int(address,16); b=bytes.fromhex(raw)
        assert a == pc, 'instruction byte continuity broken'
        pc=a+len(b)
        operands=tuple(args.split(',')) if args else ()
        if a==0x5d1e85:
            assert b==bytes.fromhex('c1fa05') and operands==('dl','05')
            operands=('edx','05')
        code[a]=Instruction(a,b,op,operands,pc)
    assert len(code)==66 and pc==END
    assert sha(b''.join(i.raw for i in code.values()))==CODE_SHA
    for i in code.values():
        if i.op in ('jne','je','jg'):
            target=i.next_pc+int.from_bytes(i.raw[1:], 'little', signed=True)
            assert target==int(i.args[0],16) and target in code
        if i.op=='call':
            assert i.next_pc+int.from_bytes(i.raw[1:],'little',signed=True)==int(i.args[0],16)
    return code


def load_listing(path=SOURCE):
    raw=Path(path).read_bytes()
    assert len(raw)==9251 and sha(raw)==SOURCE_SHA, 'complete source bytes changed'
    assert hashlib.sha1(b'blob 9251\0'+raw).hexdigest()==SOURCE_BLOB
    return parse_listing(raw.decode('gbk'))


class ListingMachine:
    STACK, RETURN, OFFICER, CITY, LIST, FACILITY = 0x100000,0x1234abcd,0x200000,0x300000,0x400000,0x500000

    def __init__(self,code,count=3,politics=70,eye=0,city_region=1,birth_region=1,*,validator=1,politics_high=0xabcd1200,stub_mutation=None):
        assert type(count) is int and 0<=count<=0x7fffffff
        assert type(politics) is int and 0<=politics<=255
        assert type(eye) is int and 0<=eye<=MASK
        assert type(validator) is int and 0<=validator<=MASK
        assert -0x80000000<=city_region<=0x7fffffff and -0x80000000<=birth_region<=0x7fffffff
        self.code,self.pc=code,ENTRY
        self.r=dict(eax=0xaabbccdd,ebx=0x99887766,ecx=0xdeadbeef,edx=0x87654321,ebp=0x2468ace0,esi=0xabcdef01,edi=0x98765432,esp=self.STACK)
        self.saved={k:self.r[k] for k in ('ebx','ebp','esi','edi')}
        self.mem={self.STACK:self.RETURN,self.STACK+4:self.OFFICER,self.STACK+8:self.CITY,self.STACK+12:self.LIST,self.CITY+0x18:city_region&MASK,self.OFFICER+0xe4:birth_region&MASK}
        self.count,self.politics,self.eye,self.validator=count,politics,eye,validator
        self.politics_high=politics_high & 0xffffff00
        self.stub_mutation=stub_mutation
        self.zf=self.sf=self.of=False
        self.calls=[];self.reads=[];self.trace=[];self.branches=set();self.observed={}

    def address(self,arg):
        assert arg.startswith('[') and arg.endswith(']'),arg
        total=0
        for term in arg[1:-1].split('+'):
            if '*' in term:
                reg,mult=term.split('*');total+=self.r[reg]*int(mult,16)
            else:total+=self.r[term] if term in self.r else int(term,16)
        return total&MASK

    def read(self,arg):
        if arg in self.r:return self.r[arg]
        if arg in ('al','bl','dl'):return self.r[{'al':'eax','bl':'ebx','dl':'edx'}[arg]]&255
        if arg.startswith('['):
            a=self.address(arg);v=self.mem[a];self.reads.append((self.pc,a,v));return v
        return int(arg,16)

    def write(self,arg,value):
        if arg in ('al','bl','dl'):
            reg={'al':'eax','bl':'ebx','dl':'edx'}[arg];self.r[reg]=(self.r[reg]&0xffffff00)|(value&255)
        else:
            assert arg in self.r,arg
            self.r[arg]=value&MASK

    def push(self,value):
        self.r['esp']-=4;self.mem[self.r['esp']]=value&MASK

    def pop(self):
        value=self.mem[self.r['esp']];self.r['esp']+=4;return value

    def flags(self,a,b,op):
        result=(a-b if op=='cmp' else a+b if op=='add' else a&b if op=='test' else a^b)&MASK
        self.zf=result==0;self.sf=bool(result&0x80000000)
        self.of=bool(((a^b)&(a^result) if op=='cmp' else ~(a^b)&(a^result) if op=='add' else 0)&0x80000000)
        return result

    def call(self,target,next_pc):
        self.push(next_pc);sp=self.r['esp'];ecx=self.r['ecx']
        def args(n):return tuple(self.mem[sp+4+4*k] for k in range(n))
        cleanup=0
        if target==0x47a630:
            argv=args(1);assert argv==(self.CITY,);eax=self.validator
        elif target==0x47c4c0:
            argv=();assert ecx==self.CITY;assert args(1)==(0,);eax=self.FACILITY
        elif target==0x4cf590:
            argv=args(4);assert ecx==0x7999808 and argv==(self.LIST,0x5d1720,self.FACILITY,0)
            self.mem[self.LIST+12]=self.count;eax=0xcccccccc;cleanup=16
        elif target==0x4890f0:
            argv=args(1);assert ecx==self.OFFICER and argv==(0x55,);eax=self.eye;cleanup=4
        elif target==0x4890a0:
            argv=();assert ecx==self.OFFICER;eax=self.politics_high|self.politics
        else:raise AssertionError(('unexpected opaque helper',target))
        self.calls.append((self.pc,target,ecx,argv))
        if self.stub_mutation=='eye-low-byte' and target==0x4890f0:eax &=255
        if self.stub_mutation=='list-omits-cleanup' and target==0x4cf590:cleanup=0
        if self.stub_mutation=='facility-cleans-four' and target==0x47c4c0:cleanup=4
        self.r.update(eax=eax,ecx=0xdddddddd,edx=0xeeeeeeee)
        assert self.pop()==next_pc
        self.r['esp']+=cleanup

    def run(self):
        for _ in range(100):
            i=self.code[self.pc];self.trace.append(self.pc);a=i.args;op=i.op;next_pc=i.next_pc
            if self.pc==0x5d1e6d:self.observed['cappedCandidateCount']=self.r['ecx']
            if self.pc==0x5d1e7d:self.observed['numerator']=self.r['ecx']
            if op=='push':self.push(self.read(a[0]))
            elif op=='pop':self.write(a[0],self.pop())
            elif op in ('mov','movzx'):self.write(a[0],self.read(a[1]))
            elif op=='lea':self.write(a[0],self.address(a[1]))
            elif op in ('cmp','test'):self.flags(self.read(a[0]),self.read(a[1]),op)
            elif op in ('add','xor'):self.write(a[0],self.flags(self.read(a[0]),self.read(a[1]),op))
            elif op=='call':self.call(int(a[0],16),next_pc)
            elif op in ('jne','je','jg'):
                take=(not self.zf if op=='jne' else self.zf if op=='je' else not self.zf and self.sf==self.of)
                self.branches.add((self.pc,take))
                if take:next_pc=int(a[0],16)
            elif op=='imul':
                if len(a)==2:self.write(a[0],signed(self.read(a[0]))*signed(self.read(a[1])))
                else:
                    product=signed(self.r['eax'])*signed(self.read(a[0]));self.write('eax',product);self.write('edx',product>>32)
            elif op=='sar':self.write(a[0],signed(self.read(a[0]))>>int(a[1],16))
            elif op=='shr':self.write(a[0],self.read(a[0])>>int(a[1],16))
            elif op=='ret':
                assert self.pop()==self.RETURN and self.r['esp']==self.STACK+4
                assert all(self.r[k]==v for k,v in self.saved.items()),'callee-saved register changed'
                arithmetic=0x5d1e7d in self.trace
                return dict(branch='arithmetic' if arithmetic else 'eye-skill' if 0x5d1e43 in self.trace else 'no-candidates' if self.validator else 'invalid-city-observation',
                            cappedCandidateCount=self.observed.get('cappedCandidateCount'),regionFactor=(11 if 0x5d1e58 in self.trace else 10) if arithmetic else None,
                            numerator=self.observed.get('numerator'),returnedEax=self.r['eax'])
            else:raise AssertionError(op)
            self.pc=next_pc
        raise AssertionError('nonterminating listing')


def run_node(script,binary=False):
    p=subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,capture_output=True)
    assert p.returncode==0,p.stderr.decode()
    return p.stdout if binary else json.loads(p.stdout)


def check_examples(code):
    cases=[dict(count=0,eye=MASK),dict(count=1,eye=256),dict(count=5,politics=255),dict(count=6,politics=255,city_region=-0x80000000,birth_region=0x7fffffff),dict(count=1,politics=0),dict(count=0,validator=0),dict(count=3,validator=256)]
    coverage=set();trace=set();out=[]
    for kw in cases:
        m=ListingMachine(code,**kw);r=m.run();coverage|=m.branches;trace.update(m.trace);out.append({'input':kw,'result':r,'helperCalls':len(m.calls)})
        if kw.get('count')==0 and kw.get('validator',1):assert len(m.calls)==3 and all(c[1]!=0x4890f0 for c in m.calls)
    assert len(coverage)==10 and len(trace)==66,(coverage,len(trace))
    assert out[0]['result']['returnedEax']==0 and out[1]['result']['returnedEax']==100
    assert out[2]['result']['returnedEax']==205 and out[3]['result']['returnedEax']==187
    return {'cases':out,'conditionalBranches':5,'outcomesCovered':10,'instructionsCovered':len(trace),'invalidCityPath':'oracle-only explicit validator stub; outside resolved production API'}


def check_mutations(code):
    variants=[('count-before-eye',0x5d1e28,'je',None),('eye-test-low-byte',0x5d1e3d,'test',('al','al')),('eye-return-99',0x5d1e43,'mov',('eax','63')),('reverse-region',0x5d1e56,'je',None),('region-factor-ten',0x5d1e58,'mov',('bl','0a')),('remove-count-cap',0x5d1e69,'je',None),('signed-politics-or-full-eax',0x5d1e6d,'mov',('edx','eax')),('base-six',0x5d1e70,'lea',('ecx','[ecx+ecx*2+06]')),('magic-multiplier',0x5d1e7d,'mov',('eax','1b4e81b4')),('source-DL-typo',0x5d1e85,'sar',('dl','05')),('wrong-shift',0x5d1e85,'sar',('edx','04'))]
    cases=[dict(count=c,politics=p,eye=e,city_region=r,birth_region=1) for c in (0,1,3,5,6,0x7fffffff) for p in (0,1,30,90,255) for e in (0,1,256,MASK) for r in (1,2)]
    expected=[ListingMachine(code,**kw).run() for kw in cases];killed=[]
    for name,address,op,args in variants:
        mutated=dict(code);mutated[address]=replace(code[address],op=op,args=code[address].args if args is None else args)
        for kw,wanted in zip(cases,expected):
            try:actual=ListingMachine(mutated,**kw).run()
            except (AssertionError,KeyError):break
            if actual!=wanted:break
        else:raise AssertionError('surviving instruction mutation: '+name)
        killed.append(name)
    stub_killed=[]
    for mutation in ('eye-low-byte','list-omits-cleanup','facility-cleans-four'):
        for kw,wanted in zip(cases,expected):
            try:actual=ListingMachine(code,**kw,stub_mutation=mutation).run()
            except (AssertionError,KeyError):break
            if actual!=wanted:break
        else:raise AssertionError('surviving opaque stub mutation: '+mutation)
        stub_killed.append(mutation)
    return {'instructionMutationsKilled':killed,'opaqueStubContractMutationsKilled':stub_killed}


def exhaustive(code):
    expected=bytearray();cases=0;maximum=0
    counts=list(range(7))+[7,0x7fffffff]
    regions=[(-0x80000000,-0x80000000),(-0x80000000,0x7fffffff),(0x7fffffff,0x7fffffff),(0x7fffffff,-0x80000000)]
    for count in counts:
        for politics in range(256):
            for city,birth in regions:
                for eye in (0,1,256,MASK):
                    r=ListingMachine(code,count,politics,eye,city,birth).run()
                    expected.extend(RECORD.pack(('no-candidates','eye-skill','arithmetic').index(r['branch']),*[r[k] if r[k] is not None else -1 for k in ('cappedCandidateCount','regionFactor','numerator')],r['returnedEax']))
                    maximum=max(maximum,r['returnedEax']);cases+=1
    script='''
      import assert from 'node:assert/strict';
      import {calculateSearchTalentBaseline as calculate} from './packages/engine/src/index.ts';
      const counts=COUNTS,regions=REGIONS,eyes=[0,1,256,4294967295];
      const out=Buffer.alloc(CASES*17);let offset=0;
      for(const filteredCandidateCount of counts)for(let politicsAL=0;politicsAL<256;politicsAL++)for(const [cityRegion,officerBirthRegion] of regions)for(const eyeSkillEax of eyes){
        const input={profile:'search-talent-resolved-v1',filteredCandidateCount,politicsAL,eyeSkillEax,cityRegion,officerBirthRegion};
        const r=calculate(input);assert.equal(r.supported,true);assert.equal(r.profile,input.profile);
        for(const [key,v] of Object.entries(input))assert.equal(r[key],v);
        assert.deepEqual(r.evidence,EXPECTED_EVIDENCE);assert.ok(Object.isFrozen(r));assert.ok(Object.isFrozen(r.evidence));
        const branch=['no-candidates','eye-skill','arithmetic'].indexOf(r.branch);assert.ok(branch>=0);
        out[offset]=branch;out.writeInt32LE(r.cappedCandidateCount??-1,offset+1);out.writeInt32LE(r.regionFactor??-1,offset+5);out.writeInt32LE(r.numerator??-1,offset+9);out.writeUInt32LE(r.returnedEax,offset+13);offset+=17;
      }
      process.stdout.write(out);
    '''.replace('COUNTS',json.dumps(counts)).replace('REGIONS',json.dumps(regions)).replace('CASES',str(cases)).replace('EXPECTED_EVIDENCE',json.dumps(EVIDENCE))
    actual=run_node(script,True)
    assert len(actual)==len(expected)==cases*17
    assert actual==expected,'full-listing interpreter disagrees with actual TypeScript public export'
    assert maximum==205
    return {'comparisons':cases,'counts':counts,'politicsAL':'all 256 bytes','regionPairs':regions,'eyeSkillEax':[0,1,256,MASK],'maximumReturnedEax':maximum,'mismatches':0,'expectedSha256':sha(expected),'actualPublicExportSha256':sha(actual),'record':'LE uint8 branch, int32 capped count/factor/numerator (-1 for null), uint32 EAX'}


def check_api_contract():
    return run_node('''
      import assert from 'node:assert/strict';
      import {calculateSearchTalentBaseline as calculate} from './packages/engine/src/index.ts';
      const input=()=>({profile:'search-talent-resolved-v1',filteredCandidateCount:3,politicsAL:70,eyeSkillEax:0,cityRegion:1,officerBirthRegion:1});
      const invalid=[null,undefined,[],1,'1',true,()=>{},{},{...input(),profile:'unknown'},{...input(),extra:1},Object.create(input()),new Map(),new Date()];
      for(const key of Object.keys(input())){const x=input();delete x[key];invalid.push(x)}
      const ranges={filteredCandidateCount:[0,2147483647],politicsAL:[0,255],eyeSkillEax:[0,4294967295],cityRegion:[-2147483648,2147483647],officerBirthRegion:[-2147483648,2147483647]};
      for(const [key,[lo,hi]] of Object.entries(ranges))for(const v of [lo-1,hi+1,1.5,NaN,Infinity,-Infinity,'1',null,undefined,true,1n])invalid.push({...input(),[key]:v});
      const sym=input();sym[Symbol('x')]=1;invalid.push(sym);
      const hidden=input();Object.defineProperty(hidden,'extra',{value:1});invalid.push(hidden);
      let invoked=0;for(const key of Object.keys(input())){const x=input();Object.defineProperty(x,key,{get(){invoked++;throw Error('getter invoked')}});invalid.push(x)}
      function frozen(x){if(x!==null&&typeof x==='object'){assert.ok(Object.isFrozen(x));for(const v of Object.values(x))frozen(v)}}
      for(const x of invalid){const r=calculate(x);assert.equal(r.supported,false);assert.equal('returnedEax' in r,false);frozen(r)}
      assert.equal(invoked,0);
      for(const early of [{filteredCandidateCount:0},{eyeSkillEax:1}])for(const key of Object.keys(ranges)){
        const x={...input(),...early,[key]:null};assert.equal(calculate(x).supported,false);
      }
      const zero={...input(),filteredCandidateCount:-0,politicsAL:-0,eyeSkillEax:-0,cityRegion:-0,officerBirthRegion:-0};
      const zr=calculate(zero);assert.equal(zr.supported,true);for(const key of Object.keys(ranges))assert.equal(Object.is(zr[key],-0),false);
      assert.equal(calculate(Object.assign(Object.create(null),input())).supported,true);
      const hiddenRequired=input();Object.defineProperty(hiddenRequired,'politicsAL',{value:70,enumerable:false});assert.equal(calculate(hiddenRequired).supported,true);
      const ordinary=input();const before=JSON.stringify(ordinary);const result=calculate(ordinary);assert.equal(result.supported,true);assert.equal(result.returnedEax,41);frozen(result);assert.equal(JSON.stringify(ordinary),before);
      process.stdout.write(JSON.stringify({rejectedInputs:invalid.length,accessorsInvoked:invoked,deepFrozen:true,inputUnchanged:true}));
    ''')


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--exhaustive',action='store_true');p.add_argument('--output',type=Path);args=p.parse_args()
    code=load_listing()
    report={'level':'source-listing-reconstruction','sourceSha256':SOURCE_SHA,'sourceGitBlobSha1':SOURCE_BLOB,'listedBytesSha256':CODE_SHA,'instructionCount':66,'listedBytes':163,'machineCodeVerified':False,'stockOriginalVerified':False,'originalExecutableExecuted':False,'evidence':EVIDENCE,'opaqueHelperStubs':{'0047A630':'validator EAX; caller cleanup 4','0047C4C0':'facility pointer EAX; no callee cleanup','004CF590':'resolved list count write; callee cleanup 16; callback body not executed','004890F0':'full uint32 eye EAX; callee cleanup 4','004890A0':'politics AL, deliberately poisoned upper EAX; no callee cleanup'},'examples':check_examples(code),'apiContract':check_api_contract(),**check_mutations(code)}
    if args.exhaustive:report['exhaustive']=exhaustive(code)
    text=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output:args.output.write_text(text)
    print(text,end='')


if __name__=='__main__':main()
