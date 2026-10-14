#!/usr/bin/env python3
"""Independent byte-derived leaf oracle; authenticates full listings, executes only 33 bytes.

No product/checker import is used for decoding, expected arithmetic, generators,
source identities or gold receipts. Python product imports occur only in the
comparison adapter. A small x86 interpreter models synthetic registers/memory
and RET 4; this is not native game execution or a recovered game ABI.
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
from jsonschema import Draft202012Validator, ValidationError

ROOT=Path(__file__).resolve().parents[1]
PROFILE='base-income-return-tail-u32-v1'
MASK=0xFFFFFFFF
ARITHMETIC_SHA='210bfcc2907afd3465d210652b2c022adaa8c4c92f9baf58fd2fd80b6c6eb88f'
LEAF_SHA='44b235c89055a513a0a795bd6903e1cc61360e3599f981467b5ef59b22d03d2c'
PINS={
 'money':(0x49E770,4551,'a1a7af12cc4c7b5f612b1db45d16623a92d9c17e3957358f9d9dcd09d1408d0b','fee219ac9a482d3a3cb4d8bdc489b98b10836944',4754,'c826c7f68b087832e9c94ea6253c7a4a2ae6e928ffc4d1bcb037c5a300d8d91f','429f5a7ff2efb81829926d2e5375051e8bdfc8021eda2b6e13c48231f696a9c0'),
 'food':(0x49EA30,4552,'0b401a880b6b60df70f5f2989c78bd9a1a4f44c32b5caa96b631dd3a4617c589','2c44d123cab43fc8577ebbaa640d811dc5fc1e64',4755,'64dec6ff6ac7f9179fa43cade5ac893f41cbd418f03161f4bb8a92a3c10de9c3','c578ba45587bf55af84eded966ff2b6909ab6afd77bfb0e511cdddbfeed0eb1c')}
GOLD_EVIDENCE={'level':'source-listing-reconstruction','profile':PROFILE,'source':'docs/sources/base-income-return-tail.json','fullListingIdentityVerified':True,'fullCallerExecuted':False,'originalExecutableExecuted':False,'stockOriginalVerified':False,'vanillaVerified':False,'nativeHelpersReconstructed':False,'abiVerified':False,'gameReachabilityVerified':False,'entryGatesIntegrated':False,'cityCalculatorCalled':False,'lateTypeObservationRequired':True,'incomeWriterIntegrated':False,'monthlySchedulerIntegrated':False,'rngIntegrated':False,'modBehaviorIncluded':False}

def sha(raw):return hashlib.sha256(raw).hexdigest()
def canonical(v):return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode()
def unsigned(x):return x&MASK
def signed(x):return (x&MASK)-(1<<32)if x&(1<<31)else x&MASK

def load_listing(resource):
    start,n,gbk_sha,blob,utf_n,utf_sha,body_sha=PINS[resource]
    prefix=ROOT/f'docs/sources/base-income-return-tail-{resource}-original'
    raw=prefix.with_suffix('.gbk').read_bytes();utf=prefix.with_suffix('.txt').read_bytes()
    assert len(raw)==n and sha(raw)==gbk_sha
    assert hashlib.sha1(b'blob '+str(n).encode()+b'\0'+raw).hexdigest()==blob
    assert len(utf)==utf_n and sha(utf)==utf_sha
    text=utf.decode('utf-8');assert text.encode('gbk')==raw and raw.decode('gbk')==text
    rows=[]
    for line in text.splitlines():
        if re.match(r'^[0-9A-F]{8} -',line):
            address,hex_bytes,_=line.split(' - ',2);rows.append((int(address,16),bytes.fromhex(hex_bytes.strip())))
    assert len(rows)==66
    cursor=start
    for address,op in rows:assert address==cursor;cursor+=len(op)
    body=b''.join(op for _,op in rows)
    assert len(body)==149 and cursor==start+149 and sha(body)==body_sha
    assert sha(body[101:126])==ARITHMETIC_SHA and sha(body[101:134])==LEAF_SHA
    return {'start':start,'rows':rows,'body':body,'leafStart':start+101,'leaf':body[101:134]}

def independent_disassembly(listings):
    result={}
    for resource,listing in listings.items():
        with tempfile.TemporaryDirectory(prefix='base-tail-objdump-')as directory:
            p=Path(directory)/'body.bin';p.write_bytes(listing['body'])
            out=subprocess.run(['objdump','-D','-b','binary','-m','i386','-M','intel','--insn-width=16',f'--adjust-vma={listing["start"]}',str(p)],check=True,text=True,capture_output=True).stdout
        decoded=[]
        for line in out.splitlines():
            m=re.match(r'^\s*([0-9a-f]+):\s*((?:[0-9a-f]{2}\s+)+)\s*(.*)$',line)
            if m:decoded.append((int(m[1],16),bytes.fromhex(m[2]),m[3]))
        assert [(a,b)for a,b,_ in decoded]==listing['rows']
        by={a:asm for a,_,asm in decoded};a=listing['leafStart']
        assert re.fullmatch(r'imul\s+ecx',by[a+14]);assert re.fullmatch(r'sar\s+edx,1',by[a+16]);assert re.fullmatch(r'shr\s+ecx,0x1f',by[a+20]);assert re.fullmatch(r'ret\s+0x4',by[a+30])
        result[resource]={'instructions':66,'bytes':149,'allBoundariesMatch':True,'leafInstructions':15,'leafBytes':33}
    return {'decoder':'GNU objdump','resources':result,'fullCallerExecuted':False}

class Machine:
    """Byte decoder of precisely the reached leaf's x86 subset, with a step bound."""
    def __init__(self,listing,raw,kind):
        self.code=listing['leaf'];self.start=listing['leafStart'];self.pc=self.start
        # x86 register order eax/ecx/edx/ebx/esp/ebp/esi/edi.
        self.reg=[raw,0x12345678,0x99999999,0xB0B0B0B0,0x700000,0x55555555,0x100000,0xD0D0D0D0]
        self.mem={0x100008:kind,0x700000:0x11111111,0x700004:0x22222222,0x700008:0x33333333,0x70000C:0xDEADBEEF,0x700010:0x100000}
        self.zf=False;self.trace=[];self.division=None;self.ret=None
    def read(self,n):
        offset=self.pc-self.start;assert 0<=offset and offset+n<=len(self.code),'instruction fetch outside leaf'
        return self.code[offset:offset+n]
    def step(self):
        pc=self.pc;op=self.read(1)[0];size=0
        if op==0x8B:
            modrm=self.read(2)[1];mode=modrm>>6;dst=(modrm>>3)&7;src=modrm&7
            if mode==3:self.reg[dst]=self.reg[src];size=2
            elif mode==1:
                disp=int.from_bytes(self.read(3)[2:3],'little',signed=True);assert src!=4,'SIB unsupported'
                self.reg[dst]=self.mem[unsigned(self.reg[src]+disp)];size=3
            else:raise AssertionError('unsupported MOV mode')
        elif op==0x85:
            modrm=self.read(2)[1];assert modrm>>6==3
            self.zf=(self.reg[(modrm>>3)&7]&self.reg[modrm&7])==0;size=2
        elif op==0x74:
            disp=int.from_bytes(self.read(2)[1:2],'little',signed=True);size=2
            if self.zf:self.pc+=disp
        elif 0xB8<=op<=0xBF:
            self.reg[op-0xB8]=int.from_bytes(self.read(5)[1:5],'little');size=5
        elif op==0xF7:
            modrm=self.read(2)[1];assert modrm>>6==3 and (modrm>>3)&7==5,'requires signed IMUL r32'
            multiplier=self.reg[0];product=signed(self.reg[0])*signed(self.reg[modrm&7])
            bits=product&((1<<64)-1);self.reg[0]=bits&MASK;self.reg[2]=bits>>32;size=2
            self.division={'multiplierU32':multiplier,'productSignedDecimal':str(product),'productLowU32':self.reg[0],'productHighSigned':signed(self.reg[2])}
        elif op in (0xD1,0xC1):
            modrm=self.read(2)[1];assert modrm>>6==3;group=(modrm>>3)&7;dst=modrm&7
            count=1 if op==0xD1 else self.read(3)[2]&31;size=2 if op==0xD1 else 3
            if group==7:
                self.reg[dst]=unsigned(signed(self.reg[dst])>>count)
                assert self.division is not None;self.division['sarHighSigned']=signed(self.reg[dst])
            elif group==5:
                self.reg[dst]>>=count
                assert self.division is not None;self.division['correctionU32']=self.reg[dst]
            else:raise AssertionError('unsupported shift')
        elif op==0x03:
            modrm=self.read(2)[1];assert modrm>>6==3;dst=(modrm>>3)&7;src=modrm&7
            self.reg[dst]=unsigned(self.reg[dst]+self.reg[src]);size=2
        elif 0x58<=op<=0x5F:
            dst=op-0x58;self.reg[dst]=self.mem[self.reg[4]];self.reg[4]+=4;size=1
        elif op==0xC2:
            count=int.from_bytes(self.read(3)[1:3],'little');self.ret=self.mem[self.reg[4]];self.reg[4]+=4+count;size=3
        else:raise AssertionError(f'unsupported opcode {op:02x}')
        self.trace.append((pc,self.code[pc-self.start:pc-self.start+size].hex()));self.pc+=size
    def run(self):
        for _ in range(16):
            if self.ret is not None:break
            self.step()
        assert self.ret==0xDEADBEEF and self.reg[4]==0x700014,'synthetic RET 4 stack contract'
        assert self.reg[7]==0x11111111 and self.reg[6]==0x22222222 and self.reg[3]==0x33333333,'listed saved-register pops'
        assert len(self.trace)in(9,15)
        return self.reg[0]

def gold(value,listings):
    raw=int(value['cityCalculatorReturnU32']);kind=int(value['lateFacilityTypeU32']);machine=Machine(listings[value['resource']],raw,kind);result=machine.run()
    return {'supported':True,'profile':PROFILE,'resource':value['resource'],'cityCalculatorReturnU32':raw,'cityCalculatorReturnSigned':signed(raw),'lateFacilityTypeU32':kind,'branch':'copy'if machine.division is None else'signed-divide-by-five','division':machine.division,'returnedIncomeSigned':signed(result),'returnedIncomeU32':result,'evidence':deepcopy(GOLD_EVIDENCE)}

def exact_equal(left,right):
    if type(left)is not type(right):return False
    if type(left)is dict:return left.keys()==right.keys()and all(exact_equal(left[k],right[k])for k in left)
    if type(left)is list:return len(left)==len(right)and all(exact_equal(a,b)for a,b in zip(left,right))
    return left==right

def sample(raw,kind,resource):return {'profile':PROFILE,'resource':resource,'cityCalculatorReturnU32':raw&MASK,'lateFacilityTypeU32':kind}

def cases(broad=False):
    types=[0,1,2,255,256,257,65535,65536,65537,0x7FFFFFFF,0x80000000,0xFFFFFF00,0xFFFF0000,0xFFFFFFFF]
    boundaries={-2147483648,2147483647,0,-1,-2,-3,-4,-5,-6,-9,-10,-11,1,2,3,4,5,6,9,10,11}
    for base in (2,5):
        n=1
        while n<=2**31:
            for sign in (-1,1):
                for delta in range(-6,7):
                    v=sign*n+delta
                    if -2**31<=v<2**31:boundaries.add(v)
            n*=base
    for resource in ('money','food'):
        for n in sorted(boundaries):
            for kind in types:yield sample(n,kind,resource)
    rng=random.Random(0x49E7D549EA95)
    for _ in range(1024 if not broad else 8192):
        raw=rng.getrandbits(32);kind=rng.getrandbits(32)
        for resource in ('money','food'):yield sample(raw,kind,resource)
    if broad:
        # All U16 raw types crossed with both signs and resources; not all U32^2.
        for kind in range(65536):
            for n in (123456789,-123456789):
                for resource in ('money','food'):yield sample(n,kind,resource)
        for n in range(-8192,8193):
            for kind in (0,0xFFFFFFFF):
                for resource in ('money','food'):yield sample(n,kind,resource)

class BehaviorMismatch(Exception):
    def __init__(self,kind,value,expected,actual,details=None):
        self.witness={'kind':kind,'input':value,'expected':expected,'actual':actual,'driverDetails':details}
        super().__init__(kind)

def compare(case_factory,listings,root=ROOT,python=True,validate_schema=True):
    from check_base_income_return_tail import calculate_base_income_return_tail
    profile=json.loads((ROOT/'docs/sources/base-income-return-tail.json').read_text())
    validators=[Draft202012Validator(branch)for branch in profile['resultSchema']['oneOf']]
    count=0;digest=hashlib.sha256();copies=0;negative=0
    with tempfile.TemporaryDirectory(prefix='base-tail-public-api-')as directory:
        inp,out=Path(directory)/'inputs.jsonl',Path(directory)/'outputs.jsonl'
        with inp.open('w')as f:
            for value in case_factory():f.write(json.dumps(value,separators=(',',':'))+'\n')
        with inp.open()as stdin,out.open('w')as stdout:
            run=subprocess.run(['node',str(root/'scripts/oracle_base_income_return_tail_driver.mjs')],cwd=root,stdin=stdin,stdout=stdout,stderr=subprocess.PIPE,text=True)
        if run.returncode:
            prefix='BASE_TAIL_INVARIANT '
            if run.returncode==20 and run.stderr.startswith(prefix):
                witness=json.loads(run.stderr[len(prefix):])
                assert witness['kind']in('noncanonical-receipt-number','input-mutated','mutable-receipt','evidence-changed')
                raise BehaviorMismatch('driver-'+witness['kind'],witness['input'],gold(witness['input'],listings),witness['result'],{'path':witness['path'],'negativeZero':witness['negativeZero'],'numberClass':witness['numberClass']})
            raise AssertionError('TS startup/runtime failure is NOT a behavior kill: '+run.stderr[:500])
        with out.open()as results:
            for value in case_factory():
                count+=1;expected=gold(value,listings);line=results.readline();assert line,'missing TS result'
                actual=json.loads(line)
                if validate_schema:validators[0].validate(expected)
                if not exact_equal(actual,expected):raise BehaviorMismatch('typed-receipt-mismatch',value,expected,actual)
                if validate_schema:validators[0].validate(actual)
                if python:
                    got=calculate_base_income_return_tail(value)
                    if validate_schema:validators[0].validate(got)
                    assert exact_equal(got,expected),('Python receipt mismatch',value,expected,got)
                digest.update(canonical(expected)+b'\n');copies+=expected['branch']=='copy';negative+=expected['returnedIncomeSigned']<0
            assert not results.readline(),'extra TS result'
    return {'cases':count,'fullTypedReceiptsMatched':count,'resultSchemaValidatedReceipts':count*(3 if python else 2)if validate_schema else 0,'receiptSha256':digest.hexdigest(),'copyCases':copies,'negativeReturnCases':negative,'pythonCompared':python,'tsFrozenAndCanonicalChecked':True}

def mutant_specs():
    result='const returnedIncomeSigned = divided ? Number(BigInt(cityCalculatorReturnSigned) / 5n) : cityCalculatorReturnSigned;'
    def mutation(expr):return result,'const returnedIncomeSigned = '+expr+';'
    return [
      ('unsigned-division',*mutation('divided ? Math.trunc(cityCalculatorReturnU32 / 5) : cityCalculatorReturnSigned')),
      ('floor-negative',*mutation('divided ? Math.floor(cityCalculatorReturnSigned / 5) : cityCalculatorReturnSigned')),
      ('ceil-positive',*mutation('divided ? Math.ceil(cityCalculatorReturnSigned / 5) : cityCalculatorReturnSigned')),
      ('round-nearest',*mutation('divided ? Math.round(cityCalculatorReturnSigned / 5) : cityCalculatorReturnSigned')),
      ('divisor-four',*mutation('divided ? Number(BigInt(cityCalculatorReturnSigned) / 4n) : cityCalculatorReturnSigned')),
      ('divisor-six',*mutation('divided ? Number(BigInt(cityCalculatorReturnSigned) / 6n) : cityCalculatorReturnSigned')),
      ('negative-clipped',*mutation('divided ? Math.max(0, Number(BigInt(cityCalculatorReturnSigned) / 5n)) : cityCalculatorReturnSigned')),
      ('overwritten-eax-type',*mutation('lateFacilityTypeU32 | 0')),
      ('negative-zero',*mutation('divided ? Math.trunc(cityCalculatorReturnSigned / 5) : cityCalculatorReturnSigned')),
      ('missing-correction',*mutation('divided ? division!.sarHighSigned : cityCalculatorReturnSigned')),
      ('wrong-correction-sign',*mutation('divided ? division!.sarHighSigned - division!.correctionU32 : cityCalculatorReturnSigned')),
      ('type-low-eight','const divided = lateFacilityTypeU32 !== 0;','const divided = (lateFacilityTypeU32 & 255) !== 0;'),
      ('type-low-sixteen','const divided = lateFacilityTypeU32 !== 0;','const divided = (lateFacilityTypeU32 & 65535) !== 0;'),
      ('type-enum-only','const divided = lateFacilityTypeU32 !== 0;','const divided = lateFacilityTypeU32 === 1 || lateFacilityTypeU32 === 2;'),
      ('high-type-rejected',"if (!u32(values.cityCalculatorReturnU32) || !u32(values.lateFacilityTypeU32))", "if (!u32(values.cityCalculatorReturnU32) || !u32(values.lateFacilityTypeU32) || values.lateFacilityTypeU32 > 255)"),
      ('unsigned-multiply','BigInt(cityCalculatorReturnSigned) * 0x66666667n','BigInt(cityCalculatorReturnU32) * 0x66666667n'),
      ('sar-is-shr','const sarHighSigned = productHighSigned >> 1;','const sarHighSigned = productHighSigned >>> 1;'),
      ('sar-shift-two','const sarHighSigned = productHighSigned >> 1;','const sarHighSigned = productHighSigned >> 2;'),
      ('correction-arithmetic-shift','correctionU32: sarHighSigned >>> 31','correctionU32: sarHighSigned >> 31'),
      ('wrong-output-bits','Number(BigInt.asUintN(32, BigInt(returnedIncomeSigned)))','Math.abs(returnedIncomeSigned)'),
      ('wrong-low-product','productLowU32: Number(BigInt.asUintN(32, product))','productLowU32: Number(BigInt.asUintN(32, product)) ^ 1'),
      ('evidence-full-caller-claim','returnedIncomeSigned, returnedIncomeU32, evidence});','returnedIncomeSigned, returnedIncomeU32, evidence: {...evidence, fullCallerExecuted: true}});'),
    ]

def run_mutants(listings):
    probes=[sample(n,t,r)for r in ('money','food')for n in (-2147483648,-11,-10,-6,-5,-4,-1,0,1,4,5,6,10,11,2147483647)for t in (0,1,2,256,65536,0x80000000,0xFFFFFFFF)]
    reports=[];relative=Path('packages/engine/src/base-income-return-tail.ts');original=(ROOT/relative).read_text()
    with tempfile.TemporaryDirectory(prefix='base-tail-ts-mutants-')as directory:
        dest=Path(directory)/'candidate';shutil.copytree(ROOT/'packages',dest/'packages');shutil.copytree(ROOT/'docs/sources',dest/'docs/sources');(dest/'scripts').mkdir();shutil.copy2(ROOT/'scripts/oracle_base_income_return_tail_driver.mjs',dest/'scripts');shutil.copy2(ROOT/'package.json',dest/'package.json')
        for name,old,new in mutant_specs():
            assert original.count(old)==1,('mutation anchor',name)
            # Fresh execution of an unaltered control for EVERY mutant, never a reused pass.
            (dest/relative).write_text(original)
            control=compare(lambda:iter(probes),listings,root=dest,python=False)
            (dest/relative).write_text(original.replace(old,new))
            killed=False
            try:compare(lambda:iter(probes),listings,root=dest,python=False)
            except BehaviorMismatch as exc:killed=True;witness=exc.witness
            assert killed,('surviving behavior mutant',name)
            reports.append({'name':name,'control':control,'killed':True,'failureKind':witness['kind'],'witness':witness,'actualTypeScriptBehaviorChanged':True})
    assert (ROOT/relative).read_text()==original
    return {'profile':PROFILE,'mode':'actual-typescript-behavior-mutants','mutants':reports,'mutantCount':len(reports),'killed':len(reports),'unalteredControlsPassed':len(reports),'sourcePinMutationsCountedAsBehaviorKills':0,'originalProductUnchanged':True,'fullCallerExecuted':False}

def main():
    p=argparse.ArgumentParser(description=__doc__,allow_abbrev=False);g=p.add_mutually_exclusive_group();g.add_argument('--broad',action='store_true');g.add_argument('--mutants',action='store_true');args=p.parse_args()
    listings={r:load_listing(r)for r in ('money','food')};disassembly=independent_disassembly(listings)
    if args.mutants:report=run_mutants(listings);report['disassembly']=disassembly
    else:
        result=compare(lambda:cases(args.broad),listings)
        report={'profile':PROFILE,'mode':'broad-finite'if args.broad else'focused','oracle':'independent x86 leaf byte interpreter','disassembly':disassembly,'comparison':result,'coverage':{'allU16TypesBothSignsBothResources':args.broad,'denseSignedRadius':8192 if args.broad else 0,'powerTwoAndFiveQuotientBoundaries':True,'allModuloFiveResidues':True,'fixedSeedU32Pairs':8192 if args.broad else 1024,'fullU32CartesianExhausted':False},'syntheticReturnStackVerified':True,'fullCallerExecuted':False,'nativeExecutableExecuted':False}
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
