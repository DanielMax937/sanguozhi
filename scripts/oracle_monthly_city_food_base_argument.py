#!/usr/bin/env python3
"""Independent source-byte interpreter for [005905E0,00590603), not native execution.

Expected arithmetic, traces and receipts never import product code or its checker.
Only the comparison adapter imports the strict Python API. Synthetic stack/memory
models the late read and PUSH EDI, never an actual game stack or food writer.
"""
from __future__ import annotations
import argparse
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import random
import re
import shutil
import subprocess
import tempfile
from jsonschema import Draft202012Validator
ROOT=Path(__file__).resolve().parents[1]
PROFILE='monthly-city-food-base-argument-u32-v1'
NAME='monthly-city-food-base-argument'
MASK=0xFFFFFFFF
GOLD_EVIDENCE={'level': 'source-listing-reconstruction', 'profile': 'monthly-city-food-base-argument-u32-v1', 'source': 'docs/sources/monthly-city-food-base-argument.json', 'projectTarget': 'PC-PK1.1', 'sourceEditionClaim': 'PK', 'exactSourceVersionVerified': False, 'fullListingIdentityVerified': True, 'fullCallerExecuted': False, 'originalExecutableExecuted': False, 'stockOriginalVerified': False, 'vanillaVerified': False, 'consoleVerified': False, 'nativeHelpersReconstructed': False, 'abiVerified': False, 'gameReachabilityVerified': False, 'entryEdiPreservationAssumed': False, 'earlyLevyReused': False, 'lateLevyObservationRequired': True, 'cityCalculatorCalled': False, 'baseReturnTailCalled': False, 'actualStackModified': False, 'incomeWriterIntegrated': False, 'ownerForceIntegrated': False, 'monthlySchedulerIntegrated': False, 'endTurnIntegrated': False, 'rngIntegrated': False, 'modBehaviorIncluded': False}
UTF8_BYTES=46993
UTF8_SHA='825c1ff948e122fb15da6baa92c95d978b5ccd664cb0e32a1ff72d70c53a7e7b'
def sha(raw):return hashlib.sha256(raw).hexdigest()
def canonical(v):return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode()
def signed(x):return (x&MASK)-(1<<32)if x&(1<<31)else x&MASK

def load_listing():
    prefix=ROOT/f'docs/sources/{NAME}-original';gbk=prefix.with_suffix('.gbk').read_bytes();utf=prefix.with_suffix('.txt').read_bytes()
    assert len(gbk)==44283 and sha(gbk)=='24c1f4c75185a3aef07aac7f493400bb778f2f071bf4fd8ef3d905457d43d617'
    assert hashlib.sha1(b'blob 44283\0'+gbk).hexdigest()=='028fae66ba44f70716951edd9fae51420780cea0'
    assert len(utf)==UTF8_BYTES and sha(utf)==UTF8_SHA
    text=utf.decode('utf-8');assert text.encode('gbk')==gbk
    original=text[:text.index('修改1')];rows=[]
    for line in original.splitlines():
        if re.match(r'^[0-9A-F]{8} -',line):
            address,ops,_=line.split(' - ',2);rows.append((int(address,16),bytes.fromhex(ops.strip())))
    assert len(rows)==572;cursor=0x590490
    for a,b in rows:assert a==cursor;cursor+=len(b)
    body=b''.join(b for _,b in rows);assert cursor==0x590c23 and len(body)==1939 and sha(body)=='e65552b27524fcce9e95e2b3a48a9117a185cd27ad3362cfe0e47dbb9c9ee88b'
    selected=[(a,b)for a,b in rows if 0x5905e0<=a<0x590603];code=b''.join(b for _,b in selected)
    assert len(selected)==16 and len(code)==35 and sha(code)=='5c6d98631284c667856b19e2319830b143ed291d9ca2e72e3b25d4dafe91749c'
    return {'start':0x590490,'rows':rows,'body':body,'leafStart':0x5905e0,'leaf':code,'leafRows':selected}

def independent_disassembly(listing):
    with tempfile.TemporaryDirectory(prefix='monthly-food-oracle-decode-')as directory:
        p=Path(directory)/'full.bin';p.write_bytes(listing['body'])
        out=subprocess.run(['objdump','-D','-b','binary','-m','i386','-M','intel','--insn-width=16','--adjust-vma=0x590490',str(p)],check=True,text=True,capture_output=True).stdout
    decoded=[]
    for line in out.splitlines():
        m=re.match(r'^\s*([0-9a-f]+):\s*((?:[0-9a-f]{2}\s+)+)\s*(.*)$',line)
        if m:decoded.append((int(m[1],16),bytes.fromhex(m[2]),m[3]))
    assert [(a,b)for a,b,_ in decoded]==listing['rows']
    by={a:s for a,_,s in decoded}
    for address,pattern in [(0x5905e0,r'test\s+eax,eax'),(0x5905e2,r'je\s+0x5905ee'),(0x5905e4,r'lea\s+eax,\[edi\+edi\*2\]'),(0x5905ee,r'mov\s+eax,DWORD PTR \[esp\+0x1b8\]'),(0x5905f5,r'test\s+eax,eax'),(0x5905f7,r'je\s+0x590602'),(0x590602,r'push\s+edi')]:assert re.fullmatch(pattern,by[address])
    assert all(not by[a].startswith('call')for a,_ in listing['leafRows'])
    return {'decoder':'GNU objdump','fullListingInstructions':572,'fullListingBytes':1939,'leafInstructions':16,'leafBytes':35,'allBoundariesMatch':True,'leafContainsNoCall':True}

class Machine:
    """Reached-instruction decoder. Each operation derives from opcode/ModRM/SIB."""
    def __init__(self,listing,raw,harvest,levy):
        self.code=listing['leaf'];self.start=listing['leafStart'];self.pc=self.start
        self.reg=[harvest,0x12345678,0x99999999,0x33333333,0x700000,0x55555555,0x66666666,raw]
        self.mem={0x7001b8:levy};self.trace=[];self.zf=False;self.triple=None;self.post=None;self.reads=[];self.pushed=None
    def fetch(self,n):
        offset=self.pc-self.start;assert 0<=offset and offset+n<=len(self.code),'fetch outside leaf'
        return self.code[offset:offset+n]
    def step(self):
        pc=self.pc;op=self.fetch(1)[0];size=0
        if op==0x85:
            modrm=self.fetch(2)[1];assert modrm>>6==3
            self.zf=(self.reg[(modrm>>3)&7]&self.reg[modrm&7])==0;size=2
        elif op==0x74:
            disp=int.from_bytes(self.fetch(2)[1:2],'little',signed=True);size=2
            if self.zf:self.pc+=disp
        elif op==0x8D:
            modrm,sib=self.fetch(3)[1:3];assert modrm>>6==0 and modrm&7==4
            dst=(modrm>>3)&7;scale=1<<(sib>>6);index=(sib>>3)&7;base=sib&7
            assert base!=5 and index!=4
            total=self.reg[base]+self.reg[index]*scale;self.reg[dst]=total&MASK;size=3
            self.triple={'unwrappedU64':total,'lowU32':self.reg[dst],'signed':signed(self.reg[dst])}
        elif op==0x99:
            self.reg[2]=MASK if self.reg[0]&0x80000000 else 0;size=1
        elif op==0x2B:
            modrm=self.fetch(2)[1];assert modrm>>6==3;dst=(modrm>>3)&7;src=modrm&7
            self.reg[dst]=(self.reg[dst]-self.reg[src])&MASK;size=2
        elif op==0xD1:
            modrm=self.fetch(2)[1];assert modrm>>6==3 and (modrm>>3)&7==7
            dst=modrm&7;self.reg[dst]=(signed(self.reg[dst])>>1)&MASK;size=2
        elif op==0x8B:
            modrm=self.fetch(2)[1];mode=modrm>>6;dst=(modrm>>3)&7;src=modrm&7
            if mode==3:self.reg[dst]=self.reg[src];size=2
            else:
                assert mode==2 and src==4;data=self.fetch(7);sib=data[2];scale=1<<(sib>>6);index=(sib>>3)&7;base=sib&7
                address=(self.reg[base]+(0 if index==4 else self.reg[index]*scale)+int.from_bytes(data[3:7],'little',signed=True))&MASK
                self.post=self.reg[7];self.reg[dst]=self.mem[address];self.reads.append((pc,address,32));size=7
        elif 0x50<=op<=0x57:
            self.reg[4]=(self.reg[4]-4)&MASK;self.pushed=self.reg[op-0x50];self.mem[self.reg[4]]=self.pushed;size=1
        else:raise AssertionError(f'unsupported byte {op:02x}')
        self.trace.append(pc);self.pc+=size
    def run(self):
        for _ in range(16):
            if self.pc==self.start+len(self.code):break
            self.step()
        assert self.pc==0x590603 and self.pushed is not None
        assert self.reads==[(0x5905ee,0x7001b8,32)] and self.post is not None
        assert self.reg[4]==0x6ffffc and self.mem[0x6ffffc]==self.pushed
        assert len(self.trace)in(6,11,16)and self.trace[-1]==0x590602
        return self.pushed

def gold(value,listing):
    raw=value['entryFoodEdiU32'];h=value['harvestPredicateEaxU32'];l=value['lateLevyFlagDwordU32'];m=Machine(listing,raw,h,l);result=m.run()
    return {'supported':True,'profile':PROFILE,'entryFoodEdiU32':raw,'entryFoodEdiSigned':signed(raw),'harvestPredicateEaxU32':h,'lateLevyFlagDwordU32':l,'harvestApplied':0x5905e4 in m.trace,'levyApplied':0x5905f9 in m.trace,'harvestTriple':m.triple,'postHarvestU32':m.post,'postHarvestSigned':signed(m.post),'lateLevyRead':{'address':f'{m.reads[0][0]:08X}','widthBits':m.reads[0][2],'count':len(m.reads)},'executedAddresses':[f'{a:08X}'for a in m.trace],'instructionCount':len(m.trace),'pushAddress':f'{m.trace[-1]:08X}','continuationAddress':f'{m.pc:08X}','pushedArgumentU32':result,'pushedArgumentSigned':signed(result),'evidence':deepcopy(GOLD_EVIDENCE)}

def exact_equal(left,right):
    if type(left)is not type(right):return False
    if type(left)is dict:return left.keys()==right.keys()and all(exact_equal(left[k],right[k])for k in left)
    if type(left)is list:return len(left)==len(right)and all(exact_equal(a,b)for a,b in zip(left,right))
    return left==right

def sample(raw,h,l):return {'profile':PROFILE,'entryFoodEdiU32':raw&MASK,'harvestPredicateEaxU32':h,'lateLevyFlagDwordU32':l}
def cases(broad=False):
    flags=[0,1,2,255,256,65536,0x80000000,0xFFFFFFFF]
    boundaries={0,1,2,3,4,5,10375,0x7FFFFFFF,0x80000000,0xFFFFFFFD,0xFFFFFFFF}
    for k in range(1,6):
        b=(k*2**31)//3
        for d in range(-3,4):
            if 0<=b+d<=MASK:boundaries.add(b+d)
    for b in (0,MASK,2**31):
        for d in range(-3,4):
            if 0<=b+d<=MASK:boundaries.add(b+d)
    for raw in sorted(boundaries):
        for h in flags:
            for l in flags:yield sample(raw,h,l)
    rng=random.Random(0x5905E0590603)
    for _ in range(8192 if broad else 1024):
        raw=rng.getrandbits(32);h=rng.getrandbits(32);l=rng.getrandbits(32)
        for a,b in ((0,0),(h,0),(0,l),(h,l)):yield sample(raw,a,b)
    if broad:
        for n in range(65536):
            for raw in (n,MASK-n):
                for h,l in ((0,0),(256,0),(0,0x80000000),(0xFFFFFFFF,65536)):yield sample(raw,h,l)

class BehaviorMismatch(Exception):
    def __init__(self,kind,value,expected,actual,details=None):
        self.witness={'kind':kind,'input':value,'expected':expected,'actual':actual,'driverDetails':details};super().__init__(kind)

def compare(case_factory,listing,root=ROOT,python=True,schema_stride=1):
    from check_monthly_city_food_base_argument import calculate_monthly_city_food_base_argument
    schema=json.loads((ROOT/f'docs/sources/{NAME}.json').read_text())['resultSchema']['oneOf'][0];validator=Draft202012Validator(schema)
    count=0;digest=hashlib.sha256();schema_count=0;paths={};negative=0
    with tempfile.TemporaryDirectory(prefix='monthly-food-public-api-')as directory:
        inp,out=Path(directory)/'inputs.jsonl',Path(directory)/'outputs.jsonl'
        with inp.open('w')as f:
            for value in case_factory():f.write(json.dumps(value,separators=(',',':'))+'\n')
        with inp.open()as stdin,out.open('w')as stdout:run=subprocess.run(['node',str(root/'scripts/oracle_monthly_city_food_base_argument_driver.mjs')],cwd=root,stdin=stdin,stdout=stdout,stderr=subprocess.PIPE,text=True)
        if run.returncode:
            prefix='MONTHLY_FOOD_INVARIANT '
            if run.returncode==20 and run.stderr.startswith(prefix):
                witness=json.loads(run.stderr[len(prefix):]);assert witness['kind']in('noncanonical-receipt-number','input-mutated','mutable-receipt','evidence-changed')
                raise BehaviorMismatch('driver-'+witness['kind'],witness['input'],gold(witness['input'],listing),witness['result'],{'path':witness['path'],'negativeZero':witness['negativeZero'],'numberClass':witness['numberClass']})
            raise AssertionError('TS startup/runtime error is NOT a behavior kill: '+run.stderr[:1000])
        with out.open()as results:
            for value in case_factory():
                expected=gold(value,listing);line=results.readline();assert line,'missing TS output';actual=json.loads(line)
                if not exact_equal(actual,expected):raise BehaviorMismatch('typed-receipt-mismatch',value,expected,actual)
                got=calculate_monthly_city_food_base_argument(value)if python else None
                if python:assert exact_equal(got,expected),('Python typed receipt mismatch',value,expected,got)
                if count%schema_stride==0:
                    validator.validate(expected);validator.validate(actual);schema_count+=2
                    if python:validator.validate(got);schema_count+=1
                count+=1;digest.update(canonical(expected)+b'\n');path=f'{int(expected["harvestApplied"])}{int(expected["levyApplied"])}';paths[path]=paths.get(path,0)+1;negative+=expected['pushedArgumentSigned']<0
            assert not results.readline(),'extra TS output'
    return {'cases':count,'fullTypedReceiptsMatched':count,'resultSchemaValidatedReceipts':schema_count,'schemaSamplingStride':schema_stride,'receiptSha256':digest.hexdigest(),'branchCases':paths,'negativeArgumentCases':negative,'pythonCompared':python,'tsFrozenAndCanonicalChecked':True}

def mutant_specs():
    result='const pushedArgumentSigned = levyApplied ? Number(BigInt(postHarvestSigned) / 2n) : postHarvestSigned;'
    def replace(expr):return result,'const pushedArgumentSigned = '+expr+';'
    return [
      ('harvest-exact-one','const harvestApplied = harvestPredicateEaxU32 !== 0;','const harvestApplied = harvestPredicateEaxU32 === 1;'),
      ('harvest-low-byte','const harvestApplied = harvestPredicateEaxU32 !== 0;','const harvestApplied = (harvestPredicateEaxU32 & 255) !== 0;'),
      ('levy-exact-one','const levyApplied = lateLevyFlagDwordU32 !== 0;','const levyApplied = lateLevyFlagDwordU32 === 1;'),
      ('levy-low-byte','const levyApplied = lateLevyFlagDwordU32 !== 0;','const levyApplied = (lateLevyFlagDwordU32 & 255) !== 0;'),
      ('reverse-modifier-order',*replace('harvestApplied && levyApplied ? Number(BigInt(signed(unsigned(Number(BigInt(entryFoodEdiSigned) / 2n) * 3))) / 2n) : levyApplied ? Number(BigInt(postHarvestSigned) / 2n) : postHarvestSigned')),
      ('omit-lea-wrap','postHarvestU32 = unsigned(Number(BigInt(harvestTriple.signed) / 2n));','postHarvestU32 = unsigned(Number(BigInt(unwrappedU64) / 2n));'),
      ('half-before-triple','postHarvestU32 = unsigned(Number(BigInt(harvestTriple.signed) / 2n));','postHarvestU32 = unsigned(Number(BigInt(entryFoodEdiSigned) / 2n) * 3);'),
      ('unsigned-half','postHarvestU32 = unsigned(Number(BigInt(harvestTriple.signed) / 2n));','postHarvestU32 = lowU32 >>> 1;'),
      ('floor-without-correction',*replace('levyApplied ? Math.floor(postHarvestSigned / 2) : postHarvestSigned')),
      ('negative-clipped',*replace('Math.max(0, levyApplied ? Number(BigInt(postHarvestSigned) / 2n) : postHarvestSigned)')),
      ('add-original-as-bonus','postHarvestU32 = unsigned(Number(BigInt(harvestTriple.signed) / 2n));','postHarvestU32 = unsigned(entryFoodEdiU32 + Number(BigInt(harvestTriple.signed) / 2n));'),
      ('fuse-unbounded-three-fourths',*replace('harvestApplied && levyApplied ? Math.floor(3 * entryFoodEdiU32 / 4) : levyApplied ? Number(BigInt(postHarvestSigned) / 2n) : postHarvestSigned')),
      ('push-eax-copy-path',*replace('!harvestApplied && !levyApplied ? signed(lateLevyFlagDwordU32) : levyApplied ? Number(BigInt(postHarvestSigned) / 2n) : postHarvestSigned')),
      ('skip-late-read-zero',"count: 1 as const","count: (postHarvestU32 === 0 ? 0 : 1) as 1"),
      ('minimum-one',*replace('Math.max(1, levyApplied ? Number(BigInt(postHarvestSigned) / 2n) : postHarvestSigned)')),
      ('raw-sign-lost','const pushedArgumentU32 = unsigned(pushedArgumentSigned);','const pushedArgumentU32 = Math.abs(pushedArgumentSigned);'),
      ('negative-zero',*replace('levyApplied ? Math.trunc(postHarvestSigned / 2) : postHarvestSigned')),
    ]

def run_mutants(listing):
    probes=[sample(n,h,l)for n in (0,1,3,5,123,0x2AAAAAAB,0x55555555,0x80000000,0xFFFFFFFD,0xFFFFFFFF)for h in(0,1,256,65536,0x80000000,0xFFFFFFFF)for l in(0,1,256,65536,0x80000000,0xFFFFFFFF)]
    reports=[];relative=Path(f'packages/engine/src/{NAME}.ts');original=(ROOT/relative).read_text()
    with tempfile.TemporaryDirectory(prefix='monthly-food-ts-mutants-')as directory:
        dest=Path(directory)/'candidate';shutil.copytree(ROOT/'packages',dest/'packages');shutil.copytree(ROOT/'docs/sources',dest/'docs/sources');(dest/'scripts').mkdir();shutil.copy2(ROOT/'scripts/oracle_monthly_city_food_base_argument_driver.mjs',dest/'scripts');shutil.copy2(ROOT/'package.json',dest/'package.json')
        for name,old,new in mutant_specs():
            assert original.count(old)==1,('mutation anchor',name)
            (dest/relative).write_text(original);control=compare(lambda:iter(probes),listing,root=dest,python=False,schema_stride=17)
            (dest/relative).write_text(original.replace(old,new));killed=False
            try:compare(lambda:iter(probes),listing,root=dest,python=False,schema_stride=17)
            except BehaviorMismatch as exc:killed=True;witness=exc.witness
            assert killed,('surviving executable mutant',name)
            reports.append({'name':name,'category':'executable-receipt-behavior'if name=='skip-late-read-zero'else'numerical-or-branch-behavior','control':control,'killed':True,'failureKind':witness['kind'],'witness':witness,'actualTypeScriptBehaviorChanged':True})
    assert (ROOT/relative).read_text()==original
    return {'profile':PROFILE,'mode':'actual-typescript-behavior-mutants','mutants':reports,'mutantCount':len(reports),'killed':len(reports),'categoryCounts':{'numerical-or-branch-behavior':16,'executable-receipt-behavior':1},'unalteredControlsPassed':len(reports),'sourceSchemaDependencyGuardNegativesCountedAsBehaviorKills':0,'originalProductUnchanged':True,'fullCallerExecuted':False}

def main():
    p=argparse.ArgumentParser(description=__doc__,allow_abbrev=False);g=p.add_mutually_exclusive_group();g.add_argument('--broad',action='store_true');g.add_argument('--mutants',action='store_true');args=p.parse_args();listing=load_listing();disassembly=independent_disassembly(listing)
    if args.mutants:report=run_mutants(listing);report['disassembly']=disassembly
    else:
        result=compare(lambda:cases(args.broad),listing,schema_stride=257 if args.broad else 1)
        report={'profile':PROFILE,'mode':'broad-finite'if args.broad else'focused','oracle':'independent x86 leaf byte interpreter','disassembly':disassembly,'comparison':result,'coverage':{'allLow16AndHighMirroredInputsAllFourBranches':args.broad,'overflowNeighborhoods':True,'fullWidthFlagCrossProduct':True,'fixedSeedU32Samples':8192 if args.broad else 1024,'fullU32CartesianExhausted':False},'syntheticLateReadAndPushVerified':True,'fullCallerExecuted':False,'nativeExecutableExecuted':False}
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
