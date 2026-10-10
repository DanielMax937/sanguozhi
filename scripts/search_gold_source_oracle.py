#!/usr/bin/env python3
"""Independently decode the frozen search-gold caller listing, then compare the TS export.

Only 005D5BA6 <= PC < 005D5BF8 is interpreted. Four CALL-site returns are explicit
observations, never helper implementations. Handler and upstream RNG calls are
byte-authenticated context only. This does not execute an authenticated EXE.
"""
from __future__ import annotations
import argparse
from collections import Counter
from copy import deepcopy
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'docs/sources/treasure-search-original.gbk'
SOURCE_UTF8 = ROOT/'docs/sources/treasure-search-original.txt'
PROFILE = 'search-gold-caller-resolved-v1'
SOURCE_COMMIT = '66e167e40c3440929ec016f3872aefc3486434c1'
SOURCE_SHA = 'b8fb7965114ebc0d26cbb27058367c3a54ff47972bff9ab8dfc9e61867f8560a'
SOURCE_BLOB = '82bff04db2dae9ae0787e1e71ad72f1b4e6852de'
UTF8_SHA = '5cbca6abd2d96ccf6980f26bee3eb4fd31b0baa0a942d65f5efb0d4c30220f0c'
CODE_SHA = 'e4ecb097b0d272552d3203c1f2a60f834e7c0fc50f32a032f17c4f50f4135325'
ENTRY, END, NOTHING = 0x5D5BA6, 0x5D5BF8, 0x5D5C02
MASK = 0xFFFFFFFF
REGISTERS = ('eax','ecx','edx','ebx','esp','ebp','esi','edi')
WORD_REGISTERS = ('ax','cx','dx','bx','sp','bp','si','di')
BYTE_REGISTERS = ('al','cl','dl','bl','ah','ch','dh','bh')
RECORD = struct.Struct('<IIIIiBBBBIIIII')
EVIDENCE = {
 'level':'source-listing-reconstruction','profile':PROFILE,
 'source':'docs/sources/search-gold-caller.json','originalRange':'005D5BA6 <= PC < 005D5BF8',
 'scope':'post-RNG caller arithmetic from explicit per-call uint32 captures; no helper or reward execution',
 'listedBytesVerified':True,'interpretedCallSitesCaptured':True,
 'stockOriginalVerified':False,'originalExecutableExecuted':False,'nativeHelpersReconstructed':False,
 'callerIntegrated':False,'realRewardRecovered':False,'rngIntegrated':False,'commandIntegrated':False,
 'mutableStateRecovered':False,'completeSearchRecovered':False,'finalProbabilityRecovered':False,
}
PINNED = '''
005D5BA6 0fb7c0 movzx eax,ax
005D5BA9 83c404 add esp,04
005D5BAC 83f850 cmp eax,50
005D5BAF bf50000000 mov edi,00000050
005D5BB4 7f02 jg 005d5bb8
005D5BB6 8bf8 mov edi,eax
005D5BB8 8bcd mov ecx,ebp
005D5BBA 897c2414 mov [esp+14],edi
005D5BBE e8bd10ebff call 00486c80
005D5BC3 03c7 add eax,edi
005D5BC5 8bcd mov ecx,ebp
005D5BC7 89442410 mov [esp+10],eax
005D5BCB e86011ebff call 00486d30
005D5BD0 8b4c2410 mov ecx,[esp+10]
005D5BD4 3bc1 cmp eax,ecx
005D5BD6 7d14 jnl 005d5bec
005D5BD8 8bcd mov ecx,ebp
005D5BDA e8a110ebff call 00486c80
005D5BDF 8bcd mov ecx,ebp
005D5BE1 8bf8 mov edi,eax
005D5BE3 e84811ebff call 00486d30
005D5BE8 2bc7 sub eax,edi
005D5BEA eb04 jmp 005d5bf0
005D5BEC 8b442414 mov eax,[esp+14]
005D5BF0 83f81e cmp eax,1e
005D5BF3 55 push ebp
005D5BF4 56 push esi
005D5BF5 7c0b jnge 005d5c02
005D5BF7 50 push eax
'''.strip()
PINNED_CONTEXT = '''
005D5BA1 e8aac5e9ff call 00472150
005D5BF8 e883e3ffff call 005d3f80
005D5C02 e859e5ffff call 005d4160
'''.strip()
CALLS = {0x5D5BBE:(0x486C80,'firstGold'),0x5D5BCB:(0x486D30,'firstCapacity'),
         0x5D5BDA:(0x486C80,'gold'),0x5D5BE3:(0x486D30,'capacity')}


def sha(raw):return hashlib.sha256(raw).hexdigest()
def signed(value,width=32):
    value &= (1<<width)-1
    return value-(1<<width) if value & (1<<(width-1)) else value


@dataclass(frozen=True)
class Instruction:
    address:int
    raw:bytes
    op:str
    args:tuple[str,...]
    next_pc:int
    @property
    def mnemonic(self):return self.op+(' '+','.join(self.args) if self.args else '')


def decode_bytes(raw,address):
    """Exact x86 subset decoded solely from opcode/ModRM/SIB/immediate bytes."""
    raw=bytes(raw);assert raw,'empty instruction'
    opcode=raw[0];op,args,size=None,(),0
    if opcode==0x0F:
        assert len(raw)>=3 and raw[1] in (0xB6,0xB7,0xBE,0xBF) and raw[2]>>6==3
        word=raw[1] in (0xB7,0xBF)
        op='movzx' if raw[1] in (0xB6,0xB7) else 'movsx'
        args=(REGISTERS[(raw[2]>>3)&7],(WORD_REGISTERS if word else BYTE_REGISTERS)[raw[2]&7]);size=3
    elif 0xB8<=opcode<=0xBF:
        assert len(raw)>=5
        op,args,size='mov',(REGISTERS[opcode-0xB8],f'{int.from_bytes(raw[1:5],"little"):08x}'),5
    elif opcode in (0x8B,0x89,0x03,0x2B,0x3B):
        assert len(raw)>=2
        m=raw[1];reg=REGISTERS[(m>>3)&7]
        if m>>6==3:rm=REGISTERS[m&7];size=2
        else:
            assert opcode in (0x8B,0x89) and m>>6==1 and m&7==4 and len(raw)>=4 and raw[2]==0x24 and raw[3]<128,'unsupported memory operand'
            rm=f'[esp+{raw[3]:02x}]';size=4
        op={0x8B:'mov',0x89:'mov',0x03:'add',0x2B:'sub',0x3B:'cmp'}[opcode]
        args=(rm,reg) if opcode==0x89 else (reg,rm)
    elif opcode==0x83:
        assert len(raw)>=3 and raw[1]>>6==3
        ext=(raw[1]>>3)&7;assert ext in (0,5,7)
        op,args,size={0:'add',5:'sub',7:'cmp'}[ext],(REGISTERS[raw[1]&7],f'{raw[2]:02x}'),3
    elif opcode in (0x7F,0x7D,0x7C,0x7E,0x73,0x72,0xEB):
        assert len(raw)>=2
        op={0x7F:'jg',0x7D:'jnl',0x7C:'jnge',0x7E:'jle',0x73:'jae',0x72:'jb',0xEB:'jmp'}[opcode]
        args=(f'{address+2+signed(raw[1],8):08x}',);size=2
    elif 0x50<=opcode<=0x57:op,args,size='push',(REGISTERS[opcode-0x50],),1
    elif opcode==0xE8:
        assert len(raw)>=5
        op,args,size='call',(f'{address+5+int.from_bytes(raw[1:5],"little",signed=True):08x}',),5
    elif opcode==0x90:op,args,size='nop',(),1
    else:raise AssertionError(f'unsupported opcode {opcode:02x} at {address:08X}')
    assert len(raw)==size,f'instruction length mismatch at {address:08X}'
    return Instruction(address,raw,op,args,address+size)


def parse_listing(text):
    rows=[];context=[]
    for line in text.splitlines():
        m=re.match(r'^([0-9A-F]{8}) - ([0-9a-f ]+?)\s+- ([a-z]+)(?:\s+([^\u0080-\uffff]*))?',line)
        if not m:continue
        a=int(m[1],16)
        if not (ENTRY<=a<END or a in (0x5D5BA1,END,NOTHING)):continue
        address,raw,op,args=m.groups();args=(args or '').strip().split('  ')[0].strip()
        (rows if ENTRY<=a<END else context).append((address,raw.replace(' ',''),op,args))
    assert '\n'.join(' '.join(r).rstrip() for r in rows)==PINNED,'pinned caller listing changed'
    assert '\n'.join(' '.join(r).rstrip() for r in context)==PINNED_CONTEXT,'pinned excluded-call context changed'
    code={};pc=ENTRY
    for address,raw,op,args in rows:
        a=int(address,16);assert a==pc,'instruction gap'
        i=decode_bytes(bytes.fromhex(raw),a)
        assert i.mnemonic==op+(' '+args if args else ''),'decoded mnemonic mismatch'
        code[a]=i;pc=i.next_pc
    assert pc==END and len(code)==29 and sum(len(i.raw) for i in code.values())==82
    assert sha(b''.join(i.raw for i in code.values()))==CODE_SHA
    for address,raw,op,args in context:
        i=decode_bytes(bytes.fromhex(raw),int(address,16));assert i.mnemonic==op+' '+args
    assert [a for a,i in code.items() if i.op=='call']==list(CALLS)
    assert code[0x5D5BF5].args==(f'{NOTHING:08x}',) and code[0x5D5BF7].next_pc==END
    return code


def load_listing():
    raw,utf8=SOURCE.read_bytes(),SOURCE_UTF8.read_bytes()
    assert len(raw)==42874 and sha(raw)==SOURCE_SHA,'full GBK source changed'
    assert hashlib.sha1(b'blob 42874\0'+raw).hexdigest()==SOURCE_BLOB
    assert len(utf8)==44634 and sha(utf8)==UTF8_SHA,'full UTF-8 source changed'
    text=raw.decode('gbk');assert text.encode('gbk')==raw and text.encode()==utf8
    return parse_listing(text)


class ListingMachine:
    """32-bit registers, EFLAGS and real local-stack addressing; call-site captures only."""
    BASE, ACTOR, STACK = 0x01234560,0x02345670,0x30000000
    def __init__(self,code,case,*,register_poison=0xA5B6C7D8,volatile_poison=0xC3D2E1F0):
        self.code,self.case,self.pc=code,case,ENTRY
        self.r={r:register_poison&MASK for r in REGISTERS}
        self.r.update(eax=case['rngEax'],ebp=self.BASE,esi=self.ACTOR,esp=self.STACK)
        self.mem={};self.volatile_poison=volatile_poison
        self.sf=self.of=self.zf=self.cf=False
        self.trace=[];self.reads=[];self.branches={};self.observed={};self.pushes=[]
    def read(self,x):
        if x in self.r:return self.r[x]
        if x in WORD_REGISTERS:return self.r[REGISTERS[WORD_REGISTERS.index(x)]]&65535
        if x in BYTE_REGISTERS:
            n=BYTE_REGISTERS.index(x);return (self.r[REGISTERS[n%4]]>>(8 if n>=4 else 0))&255
        m=re.fullmatch(r'\[esp\+([0-9a-f]{2})\]',x)
        if m:return self.mem[(self.r['esp']+int(m[1],16))&MASK]
        return int(x,16)
    def write(self,x,v):
        v&=MASK
        if x in self.r:self.r[x]=v;return
        m=re.fullmatch(r'\[esp\+([0-9a-f]{2})\]',x);assert m,x
        self.mem[(self.r['esp']+int(m[1],16))&MASK]=v
    def flags(self,a,b,subtract):
        a&=MASK;b&=MASK;r=(a-b if subtract else a+b)&MASK
        self.sf=bool(r&0x80000000);self.zf=r==0
        self.of=bool(((a^b)&(a^r) if subtract else ~(a^b)&(a^r))&0x80000000)
        self.cf=a<b if subtract else a+b>MASK
        return r
    def run(self):
        for _ in range(40):
            if self.pc in (END,NOTHING):
                assert self.pushes[:2]==[self.BASE,self.ACTOR]
                assert self.pushes==[self.BASE,self.ACTOR]+([self.r['eax']] if self.pc==END else [])
                assert len(self.reads) in (2,4)
                return {'rngLow16':self.observed['rngLow16'],'proposedAmount':self.observed['proposedAmount'],
                        'firstSumU32':self.observed['firstSumU32'],'capacityExceeded':not self.branches[0x5D5BD6],
                        'amountU32':self.r['eax'],'amountSigned':signed(self.r['eax']),
                        'outcome':'gold-handler' if self.pc==END else 'nothing',
                        'branchTrace':{'rollCapTaken':self.branches[0x5D5BB4],'capacitySufficientTaken':self.branches[0x5D5BD6],'nothingTaken':self.branches[0x5D5BF5]},
                        'reads':self.reads,'exitAddress':f'{self.pc:08X}',
                        'handlerTarget':'005D3F80' if self.pc==END else '005D4160',
                        'goldHandlerArgument':self.r['eax'] if self.pc==END else None}
            assert ENTRY<=self.pc<END,f'execution outside caller at {self.pc:08X}'
            i=self.code[self.pc];self.trace.append(self.pc);a=i.args;op=i.op;next_pc=i.next_pc
            if self.pc==0x5D5BA9:self.observed['rngLow16']=self.r['eax']
            if self.pc==0x5D5BB8:self.observed['proposedAmount']=self.r['edi']
            if self.pc==0x5D5BC5:self.observed['firstSumU32']=self.r['eax']
            if op in ('mov','movzx','movsx'):
                v=self.read(a[1]);self.write(a[0],signed(v,16 if a[1] in WORD_REGISTERS else 8) if op=='movsx' else v)
            elif op in ('add','sub','cmp'):
                b=self.read(a[1]);b=signed(b,8) if i.raw[0]==0x83 else b
                v=self.flags(self.read(a[0]),b,op in ('sub','cmp'))
                if op!='cmp':self.write(a[0],v)
            elif op=='call':
                assert self.pc in CALLS,'unexpected helper call site'
                target,field=CALLS[self.pc];assert int(a[0],16)==target,'wrong helper target'
                assert self.r['ecx']==self.BASE,'wrong captured-helper receiver'
                observations=self.case if self.pc in (0x5D5BBE,0x5D5BCB) else self.case['secondRead']
                value=observations[field];assert type(value) is int and 0<=value<=MASK
                self.reads.append({'callAddress':f'{self.pc:08X}','target':f'{target:08X}','value':value})
                self.r.update(eax=value,ecx=self.volatile_poison&MASK,edx=(~self.volatile_poison)&MASK)
                self.sf,self.of,self.zf,self.cf=True,False,True,False
            elif op=='push':
                v=self.read(a[0]);self.r['esp']=(self.r['esp']-4)&MASK;self.mem[self.r['esp']]=v;self.pushes.append(v)
            elif op in ('jg','jnl','jnge','jle','jae','jb','jmp'):
                take={'jg':not self.zf and self.sf==self.of,'jnl':self.sf==self.of,
                      'jnge':self.sf!=self.of,'jle':self.zf or self.sf!=self.of,'jae':not self.cf,'jb':self.cf,'jmp':True}[op]
                if op!='jmp':self.branches[self.pc]=take
                if take:next_pc=int(a[0],16)
            elif op!='nop':raise AssertionError('unsupported execution '+op)
            self.pc=next_pc
        raise AssertionError('nonterminating caller')


def make_case(code,rngEax,firstGold,firstCapacity,secondGold=None,secondCapacity=None):
    """Resolve required observation shape from byte execution, not the production formula."""
    c={'profile':PROFILE,'rngEax':rngEax,'firstGold':firstGold,'firstCapacity':firstCapacity,
       'secondRead':{'gold':firstGold if secondGold is None else secondGold,'capacity':firstCapacity if secondCapacity is None else secondCapacity}}
    r=ListingMachine(code,c).run()
    if not r['capacityExceeded']:del c['secondRead']
    return c


def boundary_cases(code):
    cases=[]
    def add(*args):cases.append(make_case(code,*args))
    for low in (0,1,28,29,30,31,78,79,80,81,255,256,32767,32768,65534,65535):
        for high in (0,1,0x7FFF,0x8000,0xFFFF):add((high<<16)|low,100,150)
    for proposed in range(81):
        for gold in (0,100,0x7FFFFFAF,0x7FFFFFFF,0x80000000,0xFFFFFFAF,0xFFFFFFFF):
            for delta in (-1,0,1):add(proposed,gold,(gold+proposed+delta)&MASK)
    for gold in (0,1,29,30,31,79,80,81,0x7FFFFFFF,0x80000000,0xFFFFFFFE,0xFFFFFFFF):
        for cap in (0,1,29,30,31,79,80,81,500,0x7FFFFFFF,0x80000000,0xFFFFFFFF):add(80,100,0,gold,cap)
    for args in ((80,0x7FFFFFFF,0x7FFFFFFF),(80,100,0,0,500),(80,100,0,0xFFFFFFFF,29),
                 (80,100,120),(30,0,30),(29,0,29),(80,100,0,0x80000000,0),(80,100,0,0,0xFFFFFFFF)):
        add(*args)
    seen=set();out=[]
    for c in cases:
        key=json.dumps(c,sort_keys=True)
        if key not in seen:seen.add(key);out.append(c)
    return out


def packed(r):
    values=[x['value'] for x in r['reads']];values += [0]*(4-len(values))
    return RECORD.pack(r['rngLow16'],r['proposedAmount'],r['firstSumU32'],r['amountU32'],r['amountSigned'],
                       *r['branchTrace'].values(),r['outcome']=='gold-handler',len(r['reads']),*values)


def run_node(script,*,binary=False,input_bytes=None):
    p=subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,input=input_bytes,capture_output=True)
    assert p.returncode==0,p.stderr.decode()
    return p.stdout if binary else json.loads(p.stdout)


NODE_COMPARE = '''
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateSearchGoldCallerProjection as calculate} from 'MODULE';
const cases=JSON.parse(fs.readFileSync(0,'utf8')),evidence=EXPECTED_EVIDENCE;
const out=Buffer.alloc(cases.length*44);let offset=0;
function frozen(x){if(x!==null&&typeof x==='object'){assert.ok(Object.isFrozen(x));for(const v of Object.values(x))frozen(v)}}
for(const c of cases){
 const before=JSON.stringify(c),r=calculate(c);assert.equal(r.supported,true);assert.equal(r.profile,c.profile);
 assert.equal(JSON.stringify(c),before);assert.deepEqual(r.evidence,evidence);frozen(r);
 for(const k of ['rngEax','firstGold','firstCapacity'])assert.equal(r[k],c[k]);
 assert.equal(r.capacityExceeded,!r.branchTrace.capacitySufficientTaken);
 assert.equal(Object.hasOwn(r,'secondRead'),Object.hasOwn(c,'secondRead'));
 if(c.secondRead){assert.deepEqual(r.secondRead,c.secondRead);assert.notEqual(r.secondRead,c.secondRead)}
 assert.deepEqual(Object.keys(r.branchTrace),['rollCapTaken','capacitySufficientTaken','nothingTaken']);
 for(const v of Object.values(r.branchTrace))assert.equal(typeof v,'boolean');
 const expectedReads=[['005D5BBE','00486C80',c.firstGold],['005D5BCB','00486D30',c.firstCapacity]];
 if(c.secondRead)expectedReads.push(['005D5BDA','00486C80',c.secondRead.gold],['005D5BE3','00486D30',c.secondRead.capacity]);
 assert.deepEqual(r.reads,expectedReads.map(([callAddress,target,value])=>({callAddress,target,value})));
 assert.ok(['gold-handler','nothing'].includes(r.outcome));
 assert.equal(r.exitAddress,r.outcome==='gold-handler'?'005D5BF8':'005D5C02');
 assert.equal(r.handlerTarget,r.outcome==='gold-handler'?'005D3F80':'005D4160');
 assert.equal(r.goldHandlerArgument,r.outcome==='gold-handler'?r.amountU32:null);
 for(const k of ['rngLow16','proposedAmount','firstSumU32','amountU32']){
   assert.ok(Number.isSafeInteger(r[k])&&r[k]>=0&&r[k]<=0xffffffff);assert.equal(Object.is(r[k],-0),false);
   out.writeUInt32LE(r[k],offset);offset+=4;
 }
 assert.ok(Number.isSafeInteger(r.amountSigned));assert.equal(Object.is(r.amountSigned,-0),false);
 out.writeInt32LE(r.amountSigned,offset);offset+=4;
 for(const v of [...Object.values(r.branchTrace),r.outcome==='gold-handler'])out[offset++]=Number(v);
 out.writeUInt32LE(r.reads.length,offset);offset+=4;
 for(let i=0;i<4;i++){out.writeUInt32LE(r.reads[i]?.value??0,offset);offset+=4}
}
process.stdout.write(out);
'''


def compare_public(code,cases,module='./packages/engine/src/index.ts',poison_checks=False):
    expected=bytearray();coverage=set();instructions=set();counts=Counter()
    for c in cases:
        m=ListingMachine(code,c);r=m.run();expected.extend(packed(r))
        coverage.update(m.branches.items());instructions.update(m.trace);counts[r['outcome']]+=1
        if poison_checks:
            for p in (0,MASK,0x12345678):assert ListingMachine(code,c,register_poison=p,volatile_poison=p).run()==r
    actual=run_node(NODE_COMPARE.replace('MODULE',module).replace('EXPECTED_EVIDENCE',json.dumps(EVIDENCE)),binary=True,input_bytes=json.dumps(cases).encode())
    assert len(actual)==len(expected)==len(cases)*RECORD.size
    if actual!=expected:
        for n,c in enumerate(cases):
            a,b=expected[n*RECORD.size:(n+1)*RECORD.size],actual[n*RECORD.size:(n+1)*RECORD.size]
            assert a==b,f'public export mismatch: input={c}, expected={RECORD.unpack(a)}, actual={RECORD.unpack(b)}'
    return {'comparisons':len(cases),'mismatches':0,'expectedSha256':sha(expected),'actualPublicExportSha256':sha(actual),
            'conditionalBranchOutcomesCovered':len(coverage),'instructionsCovered':len(instructions),'outcomeCounts':dict(counts),
            'capturedCallSites':4,'nativeHelperBodiesExecuted':0,'handlersExecuted':0,'recordBytes':RECORD.size,
            'record':'LE uint32 low16/proposal/sum/amount; int32 signedAmount; uint8 three branches/outcome; uint32 readCount/four ordered capture values'}


def check_examples(code):
    cases=boundary_cases(code);report=compare_public(code,cases,poison_checks=True)
    assert report['conditionalBranchOutcomesCovered']==6 and report['instructionsCovered']==29
    witnesses=[]
    for args,amount,outcome in [
      ((80,0x7FFFFFFF,0x7FFFFFFF),80,'gold-handler'),
      ((80,100,0,0,500),500,'gold-handler'),
      ((80,100,0,0xFFFFFFFF,29),30,'gold-handler'),
      ((80,100,120),20,'nothing'),
      ((0x0001001E,0,100),30,'gold-handler'),
      ((0x00008000,0,100),80,'gold-handler'),
      ((80,100,0,0x80000000,0),0x80000000,'nothing'),
      ((80,100,0,0,0xFFFFFFFF),0xFFFFFFFF,'nothing')]:
        c=make_case(code,*args);r=ListingMachine(code,c).run()
        assert (r['amountU32'],r['outcome'])==(amount,outcome)
        witnesses.append({'input':c,'result':r})
    assert {ListingMachine(code,c).run()['proposedAmount'] for c in cases}==set(range(81))
    return {**report,'high16Prefixes':sorted({c['rngEax']>>16 for c in cases}),
            'all81ProposedAmountsCovered':True,
            'changedSecondCaptureCases':sum('secondRead' in c and
              (c['secondRead']['gold']!=c['firstGold'] or c['secondRead']['capacity']!=c['firstCapacity']) for c in cases),
            'explicitOverflowAndChangedCaptureWitnesses':witnesses}


def exhaustive(code):
    cases=[make_case(code,low,100,150) for low in range(65536)]
    report=compare_public(code,cases)
    assert report['conditionalBranchOutcomesCovered']==6 and report['instructionsCovered']==29
    return {**report,'domain':'all 65536 low16 captures; firstGold=100, firstCapacity=150; conditional stable second read',
            'fullUint32CaptureCartesianProductExhausted':False}


def check_mutations(code):
    cases=boundary_cases(code)
    # Make spare observations available to mutated control flow. They never enter
    # valid public inputs on a non-clipping path and do not alter original runs.
    captured=[]
    for c in cases:
        x=deepcopy(c);x.setdefault('secondRead',{'gold':x['firstGold'],'capacity':x['firstCapacity']});captured.append(x)
    expected=[ListingMachine(code,c).run() for c in captured]
    variants=(
      ('MOVZX-AL-not-AX',ENTRY,'0fb6c0'),('MOVSX-AX-not-zero-extension',ENTRY,'0fbfc0'),
      ('cap-comparison-79',0x5D5BAC,'83f84f'),('cap-comparison-81',0x5D5BAC,'83f851'),
      ('cap-assignment-79',0x5D5BAF,'bf4f000000'),('cap-assignment-81',0x5D5BAF,'bf51000000'),
      ('cap-JGE-instead-of-JG',0x5D5BB4,'7d02'),
      ('subtract-first-amount-instead-of-add',0x5D5BC3,'2bc7'),
      ('unsigned-capacity-comparison',0x5D5BD6,'7314'),('strict-capacity-comparison',0x5D5BD6,'7f14'),
      ('reverse-capacity-comparison',0x5D5BD6,'7c14'),
      ('add-second-captures-instead-of-subtract',0x5D5BE8,'03c7'),
      ('threshold-29',0x5D5BF0,'83f81d'),('threshold-31',0x5D5BF0,'83f81f'),
      ('threshold-less-or-equal',0x5D5BF5,'7e0b'),('unsigned-final-threshold',0x5D5BF5,'720b'),
      ('restore-wrong-stack-slot',0x5D5BEC,'8b442410'),
    )
    results=[]
    for label,address,raw in variants:
        variant=dict(code);replacement=decode_bytes(bytes.fromhex(raw),address)
        assert replacement.next_pc==code[address].next_pc
        variant[address]=replacement;differences=[];numerical=0
        for c,want in zip(captured,expected):
            got=ListingMachine(variant,c).run()
            if got!=want:differences.append((c,want,got))
            if any(got[k]!=want[k] for k in ('rngLow16','proposedAmount','firstSumU32','amountU32','amountSigned')):numerical+=1
        assert differences,'surviving byte mutation: '+label
        c,want,got=differences[0]
        results.append({'mutation':label,'differingCases':len(differences),'numericIntermediateOrAmountMismatches':numerical,
                        'witnessInput':c,'expected':want,'mutated':got})
        if label=='cap-JGE-instead-of-JG':
            assert numerical==0
            assert all(w['amountU32']==g['amountU32'] and w['outcome']==g['outcome'] and
                       w['branchTrace']['rollCapTaken']!=g['branchTrace']['rollCapTaken']
                       for _,w,g in differences)
    # Call-target mutation has no modeled helper semantics; reject the capture
    # mapping explicitly instead of pretending that an unknown helper returns 0.
    wrong_target=dict(code);wrong_target[0x5D5BBE]=decode_bytes(bytes.fromhex('e8bd11ebff'),0x5D5BBE)
    try:ListingMachine(wrong_target,captured[0]).run()
    except AssertionError as e:assert str(e)=='wrong helper target'
    else:raise AssertionError('wrong captured helper target survived')
    return {'instructionMutationsKilled':len(results),'witnesses':results,
            'callMappingMutation':{'killed':True,'by':'explicit call-site/target mapping, no helper return fabricated'},
            'equivalentCapJge':{'numericMismatches':0,'distinguishedBy':'rollCapTaken at rngLow16=80 and independently pinned opcode 7F'}}


def check_api_contract():
    return run_node('''
import assert from 'node:assert/strict';
import {calculateSearchGoldCallerProjection as calculate} from './packages/engine/src/index.ts';
const input=()=>({profile:'search-gold-caller-resolved-v1',rngEax:80,firstGold:100,firstCapacity:150,secondRead:{gold:100,capacity:150}});
const plain=()=>({profile:'search-gold-caller-resolved-v1',rngEax:30,firstGold:0,firstCapacity:100});
const invalid=[null,undefined,[],1,'1',true,()=>{},{},new Map(),new Date(),new Number(1),Object.create(input()),{...input(),profile:'stock'}];
for(const key of ['profile','rngEax','firstGold','firstCapacity']){const x=input();delete x[key];invalid.push(x)}
for(const key of ['rngEax','firstGold','firstCapacity'])for(const v of [-1,4294967296,0.5,NaN,Infinity,-Infinity,'1',null,undefined,true,false,1n,new Number(1)])invalid.push({...input(),[key]:v});
for(const v of [null,undefined,{},[],1,'1',Object.create({gold:1,capacity:1}),{gold:1},{capacity:1},{gold:1,capacity:1,extra:1}])invalid.push({...input(),secondRead:v});
for(const key of ['gold','capacity'])for(const v of [-1,4294967296,0.5,NaN,Infinity,'1',null,undefined,true,1n])invalid.push({...input(),secondRead:{gold:100,capacity:150,[key]:v}});
for(const extra of ['pointer','cityId','rng','seed','state','reward','extra'])invalid.push({...input(),[extra]:1});
const missing=input();delete missing.secondRead;invalid.push(missing);
invalid.push({...plain(),secondRead:{gold:0,capacity:100}},{...plain(),secondRead:undefined});
let invoked=0;
for(const key of Object.keys(input())){
 const x=input();Object.defineProperty(x,key,{get(){invoked++;throw Error('read accessor')}});invalid.push(x);
 const y=input();Object.defineProperty(y,key,{set(){invoked++;throw Error('write accessor')}});invalid.push(y);
}
for(const key of ['gold','capacity']){
 const x=input();Object.defineProperty(x.secondRead,key,{get(){invoked++;throw Error('nested accessor')}});invalid.push(x);
 const y=input();Object.defineProperty(y.secondRead,key,{set(){invoked++;throw Error('nested setter')}});invalid.push(y);
}
for(const nested of [false,true]){
 const x=input();(nested?x.secondRead:x)[Symbol('x')]=1;invalid.push(x);
 const y=input();Object.defineProperty(nested?y.secondRead:y,'extra',{value:1});invalid.push(y);
}
function frozen(x){if(x!==null&&typeof x==='object'){assert.ok(Object.isFrozen(x));for(const v of Object.values(x))frozen(v)}}
for(const x of invalid){const r=calculate(x);assert.equal(r.supported,false);assert.equal(typeof r.reason,'string');
 assert.deepEqual(Object.keys(r).sort(),['evidence','reason','supported']);assert.deepEqual(r.evidence,EXPECTED_EVIDENCE);frozen(r)}
assert.equal(invoked,0);
let prototypePollutionCases=0;
for(const key of ['profile','rngEax','firstGold','firstCapacity','secondRead','gold','capacity']){
 const nested=['gold','capacity'].includes(key), c=input();
 if(nested)delete c.secondRead[key];else delete c[key];
 const value=key==='profile'?'search-gold-caller-resolved-v1':key==='secondRead'?{gold:100,capacity:150}:100;
 Object.defineProperty(Object.prototype,key,{configurable:true,value:{value}});
 try{assert.equal(calculate(c).supported,false);prototypePollutionCases++}finally{delete Object.prototype[key]}
 Object.defineProperty(Object.prototype,key,{configurable:true,get(){invoked++;throw Error('inherited descriptor getter')}});
 try{assert.equal(calculate(c).supported,false);prototypePollutionCases++}finally{delete Object.prototype[key]}
}
Object.defineProperty(Object.prototype,'secondRead',{configurable:true,get(){invoked++;throw Error('inherited optional getter')}});
try{assert.equal(calculate(plain()).supported,true);prototypePollutionCases++}finally{delete Object.prototype.secondRead}
assert.equal(invoked,0);
const pollutedValueInputs=[];
for(const key of Object.keys(input()))for(const accessor of ['get','set']){
 const x=input();Object.defineProperty(x,key,{[accessor](){invoked++;throw Error('polluted-value accessor')}});pollutedValueInputs.push(x);
}
for(const key of ['gold','capacity'])for(const accessor of ['get','set']){
 const x=input();Object.defineProperty(x.secondRead,key,{[accessor](){invoked++;throw Error('nested polluted-value accessor')}});pollutedValueInputs.push(x);
}
Object.defineProperty(Object.prototype,'value',{configurable:true,value:30});
try{for(const c of pollutedValueInputs){assert.equal(calculate(c).supported,false);prototypePollutionCases++}}
finally{delete Object.prototype.value}
assert.equal(invoked,0);
assert.equal(calculate(missing).reason,'second-read-required');assert.equal(calculate({...plain(),secondRead:undefined}).reason,'unexpected-second-read');
for(const c of [plain(),input()]){
 const nullPrototype=Object.assign(Object.create(null),c);if(c.secondRead)nullPrototype.secondRead=Object.assign(Object.create(null),c.secondRead);
 assert.equal(calculate(nullPrototype).supported,true);
 const hidden={};for(const [k,v]of Object.entries(c))Object.defineProperty(hidden,k,{value:v,enumerable:false});
 assert.equal(calculate(hidden).supported,true);
 const before=JSON.stringify(c),r=calculate(c);frozen(r);assert.equal(JSON.stringify(c),before);
 assert.equal(Object.isFrozen(c),false);if(c.secondRead){assert.equal(Object.isFrozen(c.secondRead),false);assert.notEqual(r.secondRead,c.secondRead)}
}
const z=calculate({profile:'search-gold-caller-resolved-v1',rngEax:-0,firstGold:-0,firstCapacity:-0});
assert.equal(z.supported,true);for(const k of ['rngEax','firstGold','firstCapacity','rngLow16','proposedAmount','firstSumU32','amountU32','amountSigned'])assert.equal(Object.is(z[k],-0),false);
const nestedZero=calculate({...input(),secondRead:{gold:-0,capacity:-0}});assert.equal(nestedZero.supported,true);
assert.equal(Object.is(nestedZero.secondRead.gold,-0),false);assert.equal(Object.is(nestedZero.secondRead.capacity,-0),false);
process.stdout.write(JSON.stringify({rejectedInputs:invalid.length,prototypePollutionCases,accessorsInvoked:invoked,deepFrozen:true,inputUnchanged:true,negativeZeroNormalized:true}));
'''.replace('EXPECTED_EVIDENCE',json.dumps(EVIDENCE)))


def check_typescript_mutations(code):
    """Run modified production TypeScript, never a Python imitation of its formula."""
    source=(ROOT/'packages/engine/src/search-gold-caller.ts').read_text()
    import_text="'../../../docs/sources/search-gold-caller.json'"
    assert source.count(import_text)==1
    portable=source.replace(import_text,repr((ROOT/'docs/sources/search-gold-caller.json').as_uri()))
    variants=(
      ('rng-low-byte','rngEax & 0xffff','rngEax & 0xff'),
      ('rng-full-EAX','rngEax & 0xffff','rngEax'),
      ('rng-sign-extended-AX','rngEax & 0xffff','(rngEax << 16) >> 16'),
      ('cap-79','Math.min(rngLow16, 80)','Math.min(rngLow16, 79)'),
      ('cap-81','Math.min(rngLow16, 80)','Math.min(rngLow16, 81)'),
      ('ADD-no-wrap','(firstGold + proposedAmount) >>> 0','(firstGold + proposedAmount)'),
      ('unsigned-first-compare','signed32(firstCapacity) < signed32(firstSumU32)','firstCapacity < firstSumU32'),
      ('SUB-no-wrap','(secondRead.capacity - secondRead.gold) >>> 0','(secondRead.capacity - secondRead.gold)'),
      ('reuse-first-read','(secondRead.capacity - secondRead.gold) >>> 0','(firstCapacity - firstGold) >>> 0'),
      ('reverse-second-read','(secondRead.capacity - secondRead.gold) >>> 0','(secondRead.gold - secondRead.capacity) >>> 0'),
      ('unconditional-second-read','if (capacityExceeded) {','if (true) {'),
      ('final-cap-80','const amountSigned = signed32(amountU32);','amountU32 = Math.min(amountU32, 80);\n  const amountSigned = signed32(amountU32);'),
      ('final-clamp-zero','const amountSigned = signed32(amountU32);','amountU32 = Math.max(0, signed32(amountU32)) >>> 0;\n  const amountSigned = signed32(amountU32);'),
      ('minimum-reward-30','const amountSigned = signed32(amountU32);','amountU32 = Math.max(30, amountU32);\n  const amountSigned = signed32(amountU32);'),
      ('threshold-29','amountSigned < 30','amountSigned < 29'),
      ('threshold-31','amountSigned < 30','amountSigned < 31'),
      ('threshold-inclusive','amountSigned < 30','amountSigned <= 30'),
      ('unsigned-final-compare','amountSigned < 30','amountU32 < 30'),
      ('JG-to-JGE-trace','rngLow16 > 80','rngLow16 >= 80'),
      ('wrong-handler-target',"nothingTaken ? '005D4160' : '005D3F80'","nothingTaken ? '005D3F80' : '005D4160'"),
      ('wrong-first-call-target',"callAddress: '005D5BBE', target: '00486C80'","callAddress: '005D5BBE', target: '00486D30'"),
      ('second-read-order',"reads.push({callAddress: '005D5BDA', target: '00486C80', value: secondRead.gold},\n      {callAddress: '005D5BE3', target: '00486D30', value: secondRead.capacity});", "reads.push({callAddress: '005D5BE3', target: '00486D30', value: secondRead.capacity},\n      {callAddress: '005D5BDA', target: '00486C80', value: secondRead.gold});"),
    )
    cases=boundary_cases(code);killed=[]
    with tempfile.TemporaryDirectory(prefix='search-gold-ts-mutants-') as d:
        path=Path(d)/'caller.ts';path.write_text(portable)
        baseline=compare_public(code,cases,path.as_uri())
        for label,old,new in variants:
            assert portable.count(old)==1,'mutation anchor changed: '+label
            path.write_text(portable.replace(old,new))
            try:compare_public(code,cases,path.as_uri())
            except AssertionError as e:
                assert str(e),'empty mutation failure'
                killed.append({'mutation':label,'killedBy':'branch trace comparison; no numerical kill claimed' if label=='JG-to-JGE-trace' else 'actual modified TypeScript export comparison or receipt contract'})
            else:raise AssertionError('surviving TypeScript mutation: '+label)
    return {'baselineCopiedExportMatched':baseline['comparisons'],'actualTypeScriptMutationsKilled':len(killed),'mutations':killed}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exhaustive',action='store_true');parser.add_argument('--output',type=Path)
    args=parser.parse_args();code=load_listing()
    report={'level':'source-listing-reconstruction','sourceCommit':SOURCE_COMMIT,'sourceSha256':SOURCE_SHA,
            'sourceGitBlobSha1':SOURCE_BLOB,'utf8Sha256':UTF8_SHA,'listedBytesSha256':CODE_SHA,
            'instructionCount':29,'listedBytes':82,'machineCodeVerified':False,'stockOriginalVerified':False,
            'originalExecutableExecuted':False,'evidence':EVIDENCE,'examples':check_examples(code),
            'apiContract':check_api_contract(),'instructionMutations':check_mutations(code),'typescriptMutations':check_typescript_mutations(code)}
    if args.exhaustive:report['exhaustive']=exhaustive(code)
    output=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output:args.output.write_text(output,encoding='utf-8')
    print(output,end='')

if __name__=='__main__':main()
