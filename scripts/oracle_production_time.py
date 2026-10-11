#!/usr/bin/env python3
"""Independent listing-byte oracle for the bounded production-time caller.

The original 404 listed bytes and 19 table bytes are interpreted, never a native
executable. Nine static CALL sites consume explicit ordered observations. The
synthetic memory/normal-return adapter is an abstract caller harness, NOT helper
reconstruction, real object state, native trace reachability, or an ABI proof.
Appended MOD code is authenticated context and is never executed.
"""
from __future__ import annotations
import argparse
from collections import Counter
from copy import deepcopy
from dataclasses import dataclass
import hashlib
import itertools
import json
from pathlib import Path
import random
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'docs/sources/production-time-original.txt'
PROFILE = 'production-time-observations-v1'
ENTRY, END = 0x5C6CA0, 0x5C6E34
MASK = 0xFFFFFFFF
REGISTERS = ('eax','ecx','edx','ebx','esp','ebp','esi','edi')
GBK_SHA = 'b6beaf54ca6a279bf9b999a499358d0986cab703767bdc2432f874624d80db13'
UTF8_SHA = '27aeb37b6821a720946cb980721bae9ff599be3a66928693451405738afb902c'
BLOB_SHA = 'a42599657262ed157c1911d939c3828048e01e1e'
CODE_SHA = '7d5b7c84d0bac670be09671878ab1dd3bd236d6145d990d1f0f81100b8f64c09'
ASM_SHA = 'a7924ed7d9fd9a9aef69a1020c26efb7ab9e082eeec28073862a15ff8174b472'
TABLE_HEX = 'DC6C5C00E66C5C003C6D5C0000000000020101'
TABLE_SHA = '4285391581aea210a6b7005e14bc441dfaaefc01016cac32587af237cbd1cbdb'
MOD_MARKER = '修改 - 自定义生产兵器舰船最大耗时和最短耗时'
# (target, adapter argument bytes removed after the synthetic return)
CALLS = {0x5C6CF8:(0x47A630,0), 0x5C6D06:(0x489090,0),
         0x5C6D25:(0x4890F0,4), 0x5C6D90:(0x47A630,0),
         0x5C6DAA:(0x490D00,4), 0x5C6DB0:(0x47A630,0),
         0x5C6DCA:(0x490D00,4), 0x5C6DD1:(0x4866F0,0),
         0x5C6DDE:(0x49DAB0,8)}
LOOP_CALLS = frozenset((0x5C6CF8,0x5C6D06,0x5C6D25))


def sha(raw): return hashlib.sha256(raw).hexdigest()
def signed(value,width=32):
    value &= (1<<width)-1
    return value-(1<<width) if value & (1<<(width-1)) else value


@dataclass(frozen=True)
class Instruction:
    op: str
    args: tuple
    next_pc: int
    raw: bytes


@dataclass(frozen=True)
class Listing:
    code: dict[int,Instruction]
    tables: bytes


def decode(address, data):
    """Decode only bytes: opcode, ModRM, SIB, signed displacement and immediate."""
    data=bytes(data);cursor=0
    def imm(size, sign=False):
        nonlocal cursor
        assert cursor+size <= len(data),'truncated instruction'
        value=int.from_bytes(data[cursor:cursor+size],'little',signed=sign);cursor+=size
        return value
    def modrm():
        m=imm(1);mode=m>>6;reg=('r',(m>>3)&7);rm=m&7
        if mode==3:return reg,('r',rm)
        base,index,scale,disp=rm,None,1,0
        if rm==4:
            sib=imm(1);base=sib&7;index=(sib>>3)&7;scale=1<<(sib>>6)
            if index==4:index=None
        if mode==0 and base==5:base=None;disp=imm(4,True)
        if mode==1:disp=imm(1,True)
        if mode==2:disp=imm(4,True)
        return reg,('m',base,index,scale,disp)
    opcode=imm(1)
    if opcode in (0x8B,0x89,0x8D,0x33,0x03,0x2B,0x3B,0x85):
        reg,rm=modrm();op={0x8B:'mov',0x89:'mov',0x8D:'lea',0x33:'xor',0x03:'add',0x2B:'sub',0x3B:'cmp',0x85:'test'}[opcode]
        args=(rm,reg) if opcode==0x89 else (reg,rm)
    elif opcode==0x83:
        reg,rm=modrm();op={0:'add',5:'sub',7:'cmp'}[reg[1]];args=(rm,('i',imm(1,True)))
    elif opcode==0xC7:
        reg,rm=modrm();assert reg[1]==0;op,args='mov',(rm,('i',imm(4)))
    elif 0xB8<=opcode<=0xBF:op,args='mov',(('r',opcode-0xB8),('i',imm(4)))
    elif 0x50<=opcode<=0x57:op,args='push',(('r',opcode-0x50),)
    elif 0x58<=opcode<=0x5F:op,args='pop',(('r',opcode-0x58),)
    elif 0x40<=opcode<=0x47:op,args='inc',(('r',opcode-0x40),)
    elif opcode==0x6A:op,args='push',(('i',imm(1,True)),)
    elif opcode in (0x74,0x75,0x77,0x7C,0x7D,0x7E,0x7F,0xEB):
        op={0x74:'je',0x75:'jne',0x77:'ja',0x7C:'jl',0x7D:'jge',0x7E:'jle',0x7F:'jg',0xEB:'jmp'}[opcode]
        delta=imm(1,True);args=(('i',address+cursor+delta),)
    elif opcode in (0xE8,0xE9):
        op='call' if opcode==0xE8 else 'jmp';delta=imm(4,True);args=(('i',address+cursor+delta),)
    elif opcode==0x0F:
        second=imm(1)
        if second==0xB6:
            reg,rm=modrm()
            if rm[0]=='r':rm=('r8',rm[1])
            op,args='movzx8',(reg,rm)
        elif second in (0x8C,0x8D,0x8E,0x8F):
            op={0x8C:'jl',0x8D:'jge',0x8E:'jle',0x8F:'jg'}[second]
            delta=imm(4,True);args=(('i',address+cursor+delta),)
        else:raise AssertionError(f'unsupported 0F {second:02X}')
    elif opcode==0xFF:
        reg,rm=modrm();assert reg[1]==4;op,args='jmp',(rm,)
    elif opcode==0xF7:
        reg,rm=modrm();assert reg[1]==5;op,args='imul',(rm,)
    elif opcode in (0xC1,0xD1):
        reg,rm=modrm();op={5:'shr',7:'sar'}[reg[1]];args=(rm,('i',imm(1) if opcode==0xC1 else 1))
    elif opcode in (0x99,0xC3,0x90):op,args={0x99:'cdq',0xC3:'ret',0x90:'nop'}[opcode],()
    else:raise AssertionError(f'unsupported opcode {opcode:02X} at {address:08X}')
    assert cursor==len(data),(f'{address:08X}',data.hex(),cursor)
    return Instruction(op,args,address+cursor,data)


def parse_listing(text):
    assert text.count(MOD_MARKER)==1,'missing or duplicated MOD boundary'
    original,mod=text.split(MOD_MARKER)
    pattern=r'^([0-9A-F]{8}) - ((?:[0-9a-f]{2} )+)\s+- (.*)$'
    rows=[(int(a,16),bytes.fromhex(b),asm.split('  ')[0].strip())
          for a,b,asm in re.findall(pattern,original,re.M) if ENTRY<=int(a,16)<END]
    addressed_lines=[line for line in original.splitlines()
        if re.match(r'^[0-9A-F]{8} - ',line) and ENTRY<=int(line[:8],16)<END]
    assert len(rows)==len(addressed_lines)==138,'instruction count changed or malformed addressed row'
    code={};pc=ENTRY
    for address,raw,asm in rows:
        assert address==pc,'gap, duplicate, reordered instruction or MOD overlay'
        code[address]=decode(address,raw);pc=code[address].next_pc
    raw=b''.join(row[1] for row in rows)
    assert pc==END and len(raw)==404 and sha(raw)==CODE_SHA,'caller bytes changed'
    assert sha('\n'.join(f'{a:08X} '+asm for a,_,asm in rows).encode())==ASM_SHA,'listing mnemonic changed'
    table_rows=[(int(a,16),bytes.fromhex(b)) for a,b in re.findall(
        r'^([0-9A-F]{8}) - ([0-9A-F ]+)\s*$',original,re.M) if END<=int(a,16)<END+19]
    assert [a for a,_ in table_rows]==[END,END+12]
    tables=b''.join(b for _,b in table_rows)
    assert tables.hex().upper()==TABLE_HEX and sha(tables)==TABLE_SHA
    assert [(a,i.args[0][1]) for a,i in code.items() if i.op=='call']==[(a,b[0]) for a,b in CALLS.items()]
    assert all(i.args[0][1] in code for i in code.values() if i.op.startswith('j') and i.args[0][0]=='i')
    assert all(int.from_bytes(tables[n:n+4],'little') in code for n in (0,4,8))
    # Text typo explicitly preserved. C1 /7 addresses the 32-bit EDX, never DL.
    for a in (0x5C6D6F,0x5C6DFA):assert code[a].op=='sar' and code[a].args[0]==('r',2)
    assert '005C6D79 - e9 c2 28 2e 00' in mod and '008A9640' in mod
    return Listing(code,tables)


def load_listing():
    utf8=SOURCE.read_bytes();assert len(utf8)==12376 and sha(utf8)==UTF8_SHA,'full UTF-8 source changed'
    text=utf8.decode('utf-8');gbk=text.encode('gbk')
    assert len(gbk)==11701 and sha(gbk)==GBK_SHA,'full GBK source changed'
    assert hashlib.sha1(b'blob 11701\0'+gbk).hexdigest()==BLOB_SHA
    assert gbk.decode('gbk').encode()==utf8
    return parse_listing(text)


def validate_case(case):
    assert type(case) is dict and set(case)=={'profile','nativeEquipmentType','captures'},'closed input'
    assert case['profile']==PROFILE
    assert type(case['nativeEquipmentType']) is int and -2**31<=case['nativeEquipmentType']<2**31
    assert type(case['captures']) is list
    for capture in case['captures']:
        assert type(capture) is dict and 'callAddress' in capture
        a=capture['callAddress'];assert type(a) is str and re.fullmatch('[0-9A-F]{8}',a) and int(a,16) in CALLS
        keys={'callAddress','eax'}|({'slotIndex'} if int(a,16) in LOOP_CALLS else set())
        assert set(capture)==keys,'closed capture or wrong slot-index presence'
        assert type(capture['eax']) is int and 0<=capture['eax']<=MASK
        if 'slotIndex' in capture:assert type(capture['slotIndex']) is int and 0<=capture['slotIndex']<=2


class ListingMachine:
    """Synthetic caller-only registers, byte memory, EFLAGS, stack and CALL adapter."""
    STACK,ARRAY,ACTORS,RETURN=0x30000000,0x12340000,(0x23450000,0x23450100,0x23450200),0xF00DBABE
    def __init__(self,listing,case,*,poison=0xA5B6C7D8,volatile_poison=0xC3D2E1F0):
        validate_case(case)
        self.listing,self.case,self.pc=listing,case,ENTRY
        self.r=[poison&MASK for _ in range(8)];self.r[4]=self.STACK
        self.initial=self.r.copy();self.mem={};self.volatile_poison=volatile_poison
        self.sf=self.of=self.zf=self.cf=False
        self.trace=[];self.steps=[];self.branches=[];self.calls=[];self.call_details=[];self.q=None
        self.setmem(self.STACK,self.RETURN);self.setmem(self.STACK+4,self.ARRAY)
        self.setmem(self.STACK+8,case['nativeEquipmentType'])
        for index,address in enumerate(self.ACTORS):
            self.setmem(self.ARRAY+index*4,address);self.setmem(address+0x98,0xABCD0000+index)
        for offset,value in enumerate(listing.tables):self.mem[END+offset]=value
    def setmem(self,address,value,width=4):
        for n in range(width):self.mem[(address+n)&MASK]=(value>>(n*8))&255
    def getmem(self,address,width=4):
        assert all((address+n)&MASK in self.mem for n in range(width)),f'uninitialized memory {address:08X}'
        return sum(self.mem[(address+n)&MASK]<<(n*8) for n in range(width))
    def address(self,x):
        assert x[0]=='m';_,base,index,scale,disp=x
        return ((self.r[base] if base is not None else 0)+(self.r[index]*scale if index is not None else 0)+disp)&MASK
    def read(self,x,width=4):
        if x[0]=='i':return x[1]&MASK
        if x[0]=='r':return self.r[x[1]]
        if x[0]=='r8':return (self.r[x[1]%4]>>(8 if x[1]>=4 else 0))&255
        return self.getmem(self.address(x),width)
    def write(self,x,value):
        value&=MASK
        if x[0]=='r':self.r[x[1]]=value
        elif x[0]=='m':self.setmem(self.address(x),value)
        else:raise AssertionError(x)
    def push(self,value):self.r[4]=(self.r[4]-4)&MASK;self.setmem(self.r[4],value)
    def pop(self):value=self.getmem(self.r[4]);self.r[4]=(self.r[4]+4)&MASK;return value
    def flags(self,a,b,subtract):
        a&=MASK;b&=MASK;value=(a-b if subtract else a+b)&MASK
        self.sf=bool(value&0x80000000);self.zf=value==0
        self.of=bool(((a^b)&(a^value) if subtract else ~(a^b)&(a^value))&0x80000000)
        self.cf=a<b if subtract else a+b>MASK
        return value
    def call(self,instruction):
        assert self.pc in CALLS and self.read(instruction.args[0])==CALLS[self.pc][0],'CALL target changed'
        index=len(self.trace);assert index<len(self.case['captures']),'missing capture'
        capture=self.case['captures'][index]
        assert capture['callAddress']==f'{self.pc:08X}','wrong dynamic CALL order'
        if self.pc in LOOP_CALLS:assert capture['slotIndex']==self.r[3],'wrong slot index'
        sp=self.r[4];ecx=self.r[1];top=lambda offset=0:self.getmem(sp+offset)
        if self.pc==0x5C6CF8:assert top()==self.ACTORS[self.r[3]]
        elif self.pc in (0x5C6D06,0x5C6D25):
            assert ecx==self.ACTORS[self.r[3]]
            if self.pc==0x5C6D25:assert top()==(82 if self.case['nativeEquipmentType']<=8 else 83)
        elif self.pc==0x5C6D90:assert top()==self.ACTORS[0]
        elif self.pc in (0x5C6DAA,0x5C6DCA):assert ecx==0x07201958 and top()==0xABCD0000
        elif self.pc==0x5C6DB0:assert top()==self.trace[-1]['eax']
        elif self.pc==0x5C6DD1:assert ecx==self.trace[-1]['eax']
        elif self.pc==0x5C6DDE:assert ecx==0x0780B3CC and top()==self.trace[-1]['eax'] and top(4)==45
        # The call/return stack action and cleanup are harness assumptions required
        # to continue interpreting this caller. No callee body is present or run.
        self.push(instruction.next_pc);assert self.pop()==instruction.next_pc
        self.r[4]=(self.r[4]+CALLS[self.pc][1])&MASK
        self.trace.append(deepcopy(capture));self.calls.append((self.pc,ecx,sp))
        self.call_details.append({'callAddress':f'{self.pc:08X}','target':f'{CALLS[self.pc][0]:08X}',
            'slotIndex':capture.get('slotIndex'), 'queryId':top() if self.pc==0x5C6D25 else 45 if self.pc==0x5C6DDE else None})
        self.r[0]=capture['eax'];self.r[1]=self.volatile_poison&MASK;self.r[2]=~self.volatile_poison&MASK
        self.sf,self.of,self.zf,self.cf=True,False,True,False
    def run(self):
        for _ in range(1000):
            assert self.pc in self.listing.code,f'execution outside original body: {self.pc:08X}'
            i=self.listing.code[self.pc];op,args=i.op,i.args;next_pc=i.next_pc;self.steps.append(self.pc)
            if self.pc==0x5C6D79:self.q=signed(self.r[1])
            if op=='mov':self.write(args[0],self.read(args[1]))
            elif op=='movzx8':self.write(args[0],self.read(args[1],1)&255)
            elif op=='lea':self.write(args[0],self.address(args[1]))
            elif op in ('add','sub','cmp'):
                value=self.flags(self.read(args[0]),self.read(args[1]),op!='add')
                if op!='cmp':self.write(args[0],value)
            elif op in ('xor','test'):
                value=self.read(args[0])^self.read(args[1]) if op=='xor' else self.read(args[0])&self.read(args[1])
                self.sf=bool(value&0x80000000);self.zf=value==0;self.cf=self.of=False
                if op=='xor':self.write(args[0],value)
            elif op=='inc':
                carry=self.cf;self.write(args[0],self.flags(self.read(args[0]),1,False));self.cf=carry
            elif op=='imul':
                product=signed(self.r[0])*signed(self.read(args[0]));self.r[0]=product&MASK;self.r[2]=(product>>32)&MASK
                self.cf=self.of=product!=signed(product&MASK)
            elif op in ('sar','shr'):
                amount=self.read(args[1])&31;value=self.read(args[0]);result=(signed(value) if op=='sar' else value)>>amount
                if amount:
                    self.cf=bool((value>>(amount-1))&1);self.sf=bool(result&0x80000000);self.zf=(result&MASK)==0
                    if amount==1:self.of=False if op=='sar' else bool(value&0x80000000)
                self.write(args[0],result)
            elif op=='cdq':self.r[2]=MASK if self.r[0]&0x80000000 else 0
            elif op=='push':self.push(self.read(args[0]))
            elif op=='pop':self.write(args[0],self.pop())
            elif op=='call':self.call(i)
            elif op=='jmp':next_pc=self.read(args[0])
            elif op in ('je','jne','ja','jl','jge','jle','jg'):
                taken={'je':self.zf,'jne':not self.zf,'ja':not self.cf and not self.zf,'jl':self.sf!=self.of,
                       'jge':self.sf==self.of,'jle':self.zf or self.sf!=self.of,'jg':not self.zf and self.sf==self.of}[op]
                self.branches.append((self.pc,taken))
                if taken:next_pc=self.read(args[0])
            elif op=='ret':
                assert self.pop()==self.RETURN and self.r[4]==self.STACK+4,'unbalanced abstract caller stack'
                assert all(self.r[n]==self.initial[n] for n in (3,5,6,7)),'caller nonvolatile state not restored'
                assert len(self.trace)==len(self.case['captures']),'surplus capture'
                return {'rawEaxU32':self.r[0],'returnedValue':signed(self.r[0]),'trace':self.trace,'q':self.q}
            elif op!='nop':raise AssertionError(op)
            self.pc=next_pc
        raise AssertionError('interpreter step bound exceeded')


def make_case(equipment=5, values=(60,60,60), validity=(1,1,1), skills=(0,0,0), ship=(0,)):
    captures=[]
    def add(address,eax,slot=None):
        item={'callAddress':address,'eax':eax}
        if slot is not None:item['slotIndex']=slot
        captures.append(item)
    if 5<=equipment<=8 or equipment in (10,11):
        for n in range(3):
            add('005C6CF8',validity[n],n)
            if validity[n]:add('005C6D06',values[n],n);add('005C6D25',skills[n],n)
    if 9<=equipment<=11:
        add('005C6D90',ship[0])
        if ship[0]:
            assert len(ship)>=3;add('005C6DAA',ship[1]);add('005C6DB0',ship[2])
            if ship[2]:
                assert len(ship)==6;add('005C6DCA',ship[3]);add('005C6DD1',ship[4]);add('005C6DDE',ship[5])
    return {'profile':PROFILE,'nativeEquipmentType':equipment,'captures':captures}


def arithmetic_reference(case):
    """Separately written scalar model, not used for any byte-machine execution."""
    equipment=case['nativeEquipmentType'];captures=case['captures']
    if not 5<=equipment<=11:return {'rawEaxU32':0,'returnedValue':0,'trace':deepcopy(captures),'q':None}
    al=[c['eax']%256 for c in captures if c['callAddress']=='005C6D06']
    numerator=max(24,max(al,default=0)+sum(al)-200);q=numerator//24
    value=10-q
    if any(c['callAddress']=='005C6DDE' and c['eax']!=0 for c in captures):value=max(2,8-q)
    if any(c['callAddress']=='005C6D25' and c['eax']!=0 for c in captures):value=(abs(value)//2)*(-1 if value<0 else 1)
    return {'rawEaxU32':value&MASK,'returnedValue':value,'trace':deepcopy(captures),'q':q}


def cases():
    result=[]
    # Signed domain guards, jump table type 9, all-invalid slots, and distinct rechecks.
    for t in (-2**31,-1,*range(13),2**31-1):
        result.append(make_case(t))
    ship_paths=((0,), (0x80000000,0,0), (1,MASK,1,0,0,0),
                (1,0,0x80000000,0x12345678,0,1), (1,1,1,2,3,0x80000000))
    for t in (5,8,9,10,11):
        for valid in itertools.product((0,0x80000000),repeat=3):
            for skills in itertools.product((0,0x80000000),repeat=3):
                for value in ((0,0,0),(1,127,255),(60,60,60),(110,110,110),(255,255,255)):
                    for ship in (ship_paths if t>=9 else ((0,),)):
                        result.append(make_case(t,value,valid,skills,ship))
    # AL extraction: high bits vary independently while low byte stays fixed.
    for value in range(256):
        for high in (0,0x100,0x80000000,0xFFFFFF00):
            result.append(make_case(5,(high|value,255-value,value),(1,1,1),(0,1 if value&1 else 0,0)))
    rng=random.Random(0x5C6CA0)
    for _ in range(1200):
        t=rng.choice((5,6,7,8,10,11));result.append(make_case(t,
            tuple(rng.randrange(2**32) for _ in range(3)),
            tuple(rng.choice((0,1,0x100,0x80000000,MASK)) for _ in range(3)),
            tuple(rng.choice((0,1,0x100,0x80000000,MASK)) for _ in range(3)),rng.choice(ship_paths)))
    # Deduplicate type-9 cases and invalid slots, preserving stable order.
    seen=set();unique=[]
    for case in result:
        key=json.dumps(case,sort_keys=True)
        if key not in seen:seen.add(key);unique.append(case)
    return unique


def run_node(cases,source=None):
    module=source or ROOT/'packages/engine/src/production-time.ts'
    javascript="""import fs from 'node:fs';
import { calculateProductionTimeProjection as calculate } from MODULE;
const cases=JSON.parse(fs.readFileSync(0,'utf8'));
process.stdout.write(JSON.stringify(cases.map(calculate)));
""".replace('MODULE',json.dumps(module.as_uri()))
    result=subprocess.run(['node','--input-type=module','-e',javascript],input=json.dumps(cases),text=True,capture_output=True,cwd=ROOT)
    assert result.returncode==0,result.stderr
    values=json.loads(result.stdout);assert len(values)==len(cases)
    return values


def compare_results(listing,inputs,*,source=None):
    expected=[];details=[];instructions=set();branches=set();calls=Counter()
    for case in inputs:
        machine=ListingMachine(listing,case);answer=machine.run();assert answer==arithmetic_reference(case),(case,answer)
        expected.append(answer);details.append(machine.call_details);instructions.update(machine.steps);branches.update(machine.branches)
        calls.update(c['callAddress'] for c in answer['trace'])
    actual=run_node(inputs,source)
    for index,(case,a,b) in enumerate(zip(inputs,expected,actual)):
        assert b.get('supported') is True,(index,case,b)
        assert {key:b[key] for key in a}==a,(index,case,a,b)
        assert b['callDetails']==details[index],(index,'CALL target/query details',details[index],b['callDetails'])
    return {'byteInterpreterCases':len(inputs),'typescriptPublicApiComparisons':len(inputs),
            'instructionsExecuted':len(instructions),'originalInstructionCount':len(listing.code),
            'conditionalOutcomesObserved':len(branches),'conditionalOutcomesTotal':2*sum(i.op in ('je','jne','ja','jl','jge','jle','jg') for i in listing.code.values()),
            'staticCallSitesObserved':len(calls),'callObservationsConsumed':sum(calls.values()),
            'allOriginalInstructionsExecuted':instructions==set(listing.code),
            'originalExecutableExecuted':False,'comparisonScope':'bounded captured-caller projection only'}


def check_examples(listing):
    examples=[('all invalid',make_case(5,validity=(0,0,0)),9),
      ('60x3',make_case(),9),('110x3',make_case(values=(110,110,110)),0),
      ('255x3',make_case(values=(255,255,255)),-24),
      ('negative odd skill',make_case(values=(120,120,120),skills=(1,0,0)),0),
      ('ship facility minimum then skill',make_case(10,(255,255,255),skills=(1,0,0),ship=(1,1,1,2,3,1)),1),
      ('type9 skips scan',make_case(9,ship=(1,0,1,0,0,1)),7)]
    for name,case,value in examples:
        answer=ListingMachine(listing,case).run();assert answer['returnedValue']==value,(name,answer)
    poison_cases=[examples[0][1],examples[-2][1],examples[-1][1],make_case(-1)]
    for case in poison_cases:
        expected=ListingMachine(listing,case).run()
        for poison in (0,1,MASK,0x80000000):
            assert ListingMachine(listing,case,poison=poison,volatile_poison=poison).run()==expected
    return {'namedCases':len(examples),'registerAndVolatilePoisonComparisons':len(poison_cases)*4}


def check_rejections(listing):
    good=make_case(10,(110,110,110),ship=(1,0,1,0,0,1));bad=[]
    for index in range(len(good['captures'])):
        x=deepcopy(good);del x['captures'][index];bad.append(x)
    x=deepcopy(good);x['captures'].append(deepcopy(x['captures'][-1]));bad.append(x)
    for index in range(len(good['captures'])-1):
        x=deepcopy(good);x['captures'][index],x['captures'][index+1]=x['captures'][index+1],x['captures'][index];bad.append(x)
    for field,value in (('eax',-1),('eax',2**32),('eax',True),('eax',1.5),('eax','1'),('eax',None),
                        ('callAddress','005c6cf8'),('callAddress','0047A630'),('slotIndex',3),('slotIndex',True),('unknown',0)):
        x=deepcopy(good);x['captures'][0][field]=value;bad.append(x)
    for value in (-2**31-1,2**31,1.5,True,'5',None):x=deepcopy(good);x['nativeEquipmentType']=value;bad.append(x)
    for case in (make_case(0),make_case(-1),make_case(12)):
        case['captures']=[{'callAddress':'005C6D90','eax':0}];bad.append(case)
    for x in bad:
        try:ListingMachine(listing,x).run()
        except (AssertionError,KeyError,TypeError):pass
        else:raise AssertionError('oracle accepted invalid case')
    actual=run_node(bad)
    assert all(value.get('supported') is False for value in actual),'TypeScript accepted invalid capture sequence'
    return {'invalidJsonInputsRejectedByOracleAndTypescript':len(bad)}


def check_arithmetic_sweep():
    """All 256^3 AL triples; independent fixed-width IMUL/SAR reduction, not full CPU."""
    counts=Counter();negative=zero=0;digest=hashlib.sha256()
    # Cache the independent instruction arithmetic over the exact numerator domain.
    division={}
    for value in range(-200,821):
        operand=24 if value<24 else value
        product=signed(0x2AAAAAAB)*signed(operand)
        edx=(product>>32)&MASK;edx=(signed(edx)>>2)&MASK
        ecx=((edx>>31)+edx)&MASK;division[value]=signed(ecx)
        assert division[value]==max(24,value)//24
    for a in range(256):
        block=bytearray()
        for b in range(256):
            maximum=max(a,b)
            for c in range(256):
                q=division[max(maximum,c)+a+b+c-200]
                expected=max(24,max(a,b,c)+a+b+c-200)//24
                assert q==expected
                value=10-q;counts[q]+=1;negative+=value<0;zero+=value==0
                block.append(q)
        digest.update(block)
    assert sum(counts.values())==256**3
    return {'alTriplesExhaustivelyChecked':256**3,'method':'scalar integer formula vs independent fixed-width IMUL high-word/SAR/SHR arithmetic reduction; NOT full listing or TypeScript exhaustive execution',
            'qMinimum':min(counts),'qMaximum':max(counts),'baseReturnMinimum':10-max(counts),'baseReturnMaximum':10-min(counts),
            'negativeBaseTriples':negative,'zeroBaseTriples':zero,'qStreamSha256':digest.hexdigest()}


def check_typescript_mutations(listing):
    """Execute genuinely changed TypeScript modules against fixed byte-oracle cases."""
    original=(ROOT/'packages/engine/src/production-time.ts').read_text()
    mutations={
      'invalid-type-upper-bound':('type > 11','type > 10'),
      'type0-through4-scan':('early = invalid || type < 5','early = invalid'),
      'type9-scans-slots':('!early && type !== 9','!early'),
      'wrong-skill-82':('type <= 8 ? 0x52 : 0x53','type <= 8 ? 0x51 : 0x53'),
      'wrong-skill-83':('type <= 8 ? 0x52 : 0x53','type <= 8 ? 0x52 : 0x54'),
      'politics-getter-target':("observe('005C6D06', '00489090', slotIndex)","observe('005C6D06', '004890A0', slotIndex)"),
      'stop-loop-after-skill-hit':('slots.push({slotIndex, validityEax, intelligenceAl, skillEax});',
                                 'slots.push({slotIndex, validityEax, intelligenceAl, skillEax}); if (skillApplied) break;'),
      'all-invalid-wrongly-rejected':('const rawX = early ? null : maximum + sum - 200;',
                                   "if (scannedSlots && slots.every(slot => slot.validityEax === 0)) return reject('invalid-captures'); const rawX = early ? null : maximum + sum - 200;"),
      'reuse-first-loop-validity':("const revalidated = observe('005C6D90', '0047A630');",
                                 "observe('005C6D90', '0047A630'); const revalidated = slots[0]?.validityEax ?? 0;"),
      'validity-low-byte':('validityEax !== 0','(validityEax & 0xff) !== 0'),
      'validity-signed-positive':('validityEax !== 0','(validityEax | 0) > 0'),
      'getter-low-word':(' & 0xff;',' & 0xffff;'),
      'maximum-becomes-minimum':('Math.max(maximum, intelligenceAl)','Math.min(maximum, intelligenceAl)'),
      'sum-is-overwritten':('sum += intelligenceAl','sum = intelligenceAl'),
      'skill-low-byte':('if (skillEax !== 0)','if ((skillEax & 0xff) !== 0)'),
      'type9-skips-facilities':('!early && type >= 9','!early && type >= 10'),
      'first-slot-revalidation-low-byte':('revalidated !== 0','(revalidated & 0xff) !== 0'),
      'first-resolver-skipped':("observe('005C6DAA', '00490D00');","/* first resolver incorrectly omitted */"),
      'facility-validity-low-byte':('facilityValid !== 0','(facilityValid & 0xff) !== 0'),
      'second-resolver-collapsed':("observe('005C6DCA', '00490D00');","/* repeated resolver incorrectly omitted */"),
      'city-getter-skipped':("observe('005C6DD1', '004866F0');","/* city getter incorrectly omitted */"),
      'facility-test-low-byte':("observe('005C6DDE', '0049DAB0', undefined, 0x2d) !== 0","(observe('005C6DDE', '0049DAB0', undefined, 0x2d) & 0xff) !== 0"),
      'wrong-facility-query':('undefined, 0x2d','undefined, 0x2e'),
      'offset-200-to-199':('maximum + sum - 200','maximum + sum - 199'),
      'clamp-max-to-min':('Math.max(24, rawX)','Math.min(24, rawX)'),
      'divisor-24-to-25':('clampedX / 24','clampedX / 25'),
      'divisor-24-to-23':('clampedX / 24','clampedX / 23'),
      'base10-to11':('0 : 10 - q','0 : 11 - q'),
      'facility-no-minimum':('Math.max(2, 8 - q!)','8 - q!'),
      'facility-minimum-one':('Math.max(2, 8 - q!)','Math.max(1, 8 - q!)'),
      'negative-skill-floor':('Math.trunc(duration / 2)','Math.floor(duration / 2)'),
      'global-minimum-one':('const returnedValue = skillApplied ? (Math.trunc(duration / 2) || 0) : duration;',
                            'const returnedValue = Math.max(1, skillApplied ? (Math.trunc(duration / 2) || 0) : duration);'),
      'global-minimum-zero':('const returnedValue = skillApplied ? (Math.trunc(duration / 2) || 0) : duration;',
                             'const returnedValue = Math.max(0, skillApplied ? (Math.trunc(duration / 2) || 0) : duration);'),
      'skill-before-facility-override':('const returnedValue = skillApplied ? (Math.trunc(duration / 2) || 0) : duration;',
                                      'const returnedValue = facilityApplied ? duration : skillApplied ? (Math.trunc(duration / 2) || 0) : duration;'),
      'opaque-receipt-normalized':('return capture.eax;','trace[trace.length - 1] = {...capture, eax: capture.eax ? 1 : 0}; return capture.eax;'),
      'raw-eax-signed':('rawEaxU32: returnedValue >>> 0','rawEaxU32: returnedValue'),
      'surplus-capture-accepted':('mismatch || cursor !== captures.length','mismatch'),
    }
    # Curated cases retain edge domains, distinct opaque values and every branch.
    inputs=[make_case(t) for t in (-1,0,4,5,8,9,10,11,12)]
    for v in (0,1,60,110,114,120,121,127,255):
        for t in (5,8,10,11):
            for skill in ((0,0,0),(0x80000000,0,0)):
                inputs.append(make_case(t,(v,v,v),skills=skill,ship=(0x80000000,0,0x80000000,0x12345678,0,0x80000000)))
    inputs.extend([make_case(5,(0x1234,0x8000007F,MASK),validity=(0x80000000,1,1)),
        make_case(9,ship=(1,0,1,MASK,0,1)),make_case(9,ship=(1,MASK,0)),
        make_case(5,(60,61,62),skills=(0,1,0)),make_case(5,(0,111,1)),make_case(5,(0,123,1))])
    # Select an exact division boundary to detect the one-unit offset mutation.
    # A nonuniform triple with rawX=239 becomes 240 under -199.
    inputs.append(make_case(5,(109,110,110)))
    inputs.extend([make_case(5,validity=(0,0,0)),
                   make_case(10,validity=(0,0,0),ship=(1,0,1,0,0,1)),
                   make_case(10,validity=(1,1,1),ship=(0,))])
    expected=[]
    for c in inputs:
        m=ListingMachine(listing,c);r=m.run();r['callDetails']=m.call_details;expected.append(r)
    baseline=run_node(inputs)
    assert all(v.get('supported') and {k:v[k] for k in e}==e for v,e in zip(baseline,expected))
    rejected=make_case(5);rejected['captures'].append({'callAddress':'005C6D90','eax':0})
    tested=inputs+[rejected];killed=[]
    with tempfile.TemporaryDirectory(prefix='production-time-mutants-') as directory:
        module=Path(directory)/'mutant.ts'
        for name,(before,after) in mutations.items():
            assert original.count(before)==1,(name,'mutation anchor is not unique',original.count(before))
            mutated=original.replace(before,after).replace("'../../../docs/sources/production-time.json'",json.dumps((ROOT/'docs/sources/production-time.json').as_uri()))
            module.write_text(mutated)
            values=run_node(tested,module)
            mismatches=[n for n,(value,want) in enumerate(zip(values,expected)) if not value.get('supported') or any(value.get(k)!=v for k,v in want.items())]
            if values[-1].get('supported'):mismatches.append(len(inputs))
            assert mismatches,('surviving TypeScript mutant',name)
            first=mismatches[0]
            if first==len(inputs):killed_by=['runtime-acceptance-of-surplus-capture']
            elif not values[first].get('supported'):killed_by=['runtime-rejection-of-valid-capture-sequence']
            else:
                different=[key for key,value in expected[first].items() if values[first].get(key)!=value]
                killed_by=[]
                if any(key in different for key in ('rawEaxU32','returnedValue','q')):killed_by.append('numeric-output')
                if 'trace' in different:killed_by.append('capture-trace')
                if 'callDetails' in different:killed_by.append('source-derived-CALL-target-or-query-receipt')
                assert killed_by
            killed.append({'name':name,'firstCounterexample':first,'killedBy':killed_by})
    return {'executedTypescriptMutants':len(killed),'allKilled':True,
            'counterexamples':killed,'method':'separate temporary TypeScript source mutations executed through public export; expected values from original byte interpreter',
            'productionSourceUnchanged':(ROOT/'packages/engine/src/production-time.ts').read_text()==original}


def check_api_contract():
    script="""import assert from 'node:assert/strict';
import {calculateProductionTimeProjection as f} from MODULE;
const base={profile:'production-time-observations-v1',nativeEquipmentType:5,captures:[0,1,2].map(slotIndex=>({callAddress:'005C6CF8',slotIndex,eax:0}))};
let rejected=0,getterReads=0;
const reject=x=>{assert.equal(f(x).supported,false);rejected++};
for(const x of [null,undefined,0,true,'x',[],{},Object.assign(Object.create({profile:base.profile}),{nativeEquipmentType:5,captures:[]})])reject(x);
for(const v of [NaN,Infinity,-Infinity,undefined,1n]){reject({...base,nativeEquipmentType:v});reject({...base,captures:[{callAddress:'005C6CF8',slotIndex:0,eax:v}]})}
for(const key of ['profile','nativeEquipmentType','captures']){const x={...base};Object.defineProperty(x,key,{get(){getterReads++;throw Error('getter must not run')},enumerable:true});reject(x)}
for(const key of ['callAddress','slotIndex','eax']){const c={...base.captures[0]};Object.defineProperty(c,key,{get(){getterReads++;throw Error('capture getter must not run')},enumerable:true});reject({...base,captures:[c]})}
let captures=[...base.captures];Object.defineProperty(captures,'0',{get(){getterReads++;throw Error('array getter must not run')},enumerable:true});reject({...base,captures});
reject({...base,[Symbol('x')]:1});reject({...base,captures:[{...base.captures[0],[Symbol('x')]:1}]});
reject({...base,captures:new Array(3)});captures=[...base.captures];captures.x=1;reject({...base,captures});
captures=[...base.captures];captures[Symbol('x')]=1;reject({...base,captures});
reject({...base,captures:Object.setPrototypeOf([...base.captures],null)});
reject({...base,captures:[Object.assign(Object.create({extra:1}),base.captures[0])]});
const x=structuredClone(base),before=JSON.stringify(x),out=f(x);assert.equal(out.supported,true);assert.equal(JSON.stringify(x),before);assert.deepEqual(f(x),out);
function frozen(v){if(v&&typeof v==='object'){assert(Object.isFrozen(v));for(const x of Object.values(v))frozen(x)}}frozen(out);frozen(f(null));
assert.notEqual(out.trace,x.captures);assert.notEqual(out.trace[0],x.captures[0]);x.captures[0].eax=1;assert.equal(out.trace[0].eax,0);
const nil=Object.assign(Object.create(null),base);nil.captures=base.captures.map(c=>Object.assign(Object.create(null),c));assert.equal(f(nil).supported,true);
assert.equal(getterReads,0);process.stdout.write(JSON.stringify({nonJsonRejections:rejected,getterReads,deepFrozen:true,callerUnchanged:true,nonAliasedTrace:true,nullPrototypeAccepted:true}));
""".replace('MODULE',json.dumps((ROOT/'packages/engine/src/production-time.ts').as_uri()))
    result=subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,capture_output=True,text=True)
    assert result.returncode==0,result.stderr
    return json.loads(result.stdout)


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--exhaustive',action='store_true');parser.add_argument('--output',type=Path)
    args=parser.parse_args();listing=load_listing();inputs=cases()
    report={'level':'source-listing-reconstruction','sourceListingBytesVerified':True,
        'examples':check_examples(listing),'comparison':compare_results(listing,inputs),'rejections':check_rejections(listing),
        'stockOriginalVerified':False,'originalExecutableExecuted':False,'nativeHelpersReconstructed':False,
        'nativeAbiVerified':False,'realTraceReachabilityVerified':False,'appendedModExecuted':False}
    if args.exhaustive:report['exhaustiveArithmetic']=check_arithmetic_sweep()
    output=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output:args.output.write_text(output)
    print(output,end='')


if __name__=='__main__':main()
