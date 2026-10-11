#!/usr/bin/env python3
"""Independent byte interpreter for the bounded recruitment caller projection.

Interprets all 131 original instructions (373 listed bytes), never native code.
The external-call adapter uses synthetic observations, normal returns, local
preservation and finite ST0 assumptions; it proves no helper ABI, object identity,
real-trace reachability, stock executable, or complete recruitment command.
The separately authenticated appended MOD is never part of the execution map.
"""
from __future__ import annotations
import argparse
from collections import Counter
from copy import deepcopy
from dataclasses import dataclass
from fractions import Fraction
import hashlib
import itertools
import json
from pathlib import Path
import random
import re
import struct
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'docs/sources/recruitment-quantity-original.txt'
PROFILE = 'recruitment-quantity-observations-f32-v1'
ENTRY, END = 0x5C3610, 0x5C3785
MASK = 0xFFFFFFFF
UTF8_SHA = '1460bf463ff0e7a42fb81da8b35248748a249209b9b6213548f5ee1802ae4344'
GBK_SHA = '130f094728a1ccefe46c086e00f122a551fbe55e6c794626156a44072d2f43b9'
BLOB_SHA = '0b122837b1ff1ae11789121595531b64e80ff8d2'
CODE_SHA = '222db5df5e94f2ac910dbdf6148258e815cc1494f345fa92751b4ccc2e09a5bb'
ASM_SHA = '9de02a5b47b538b7e02646edf2698ca8a1d4aa15b779299d01fa5db88b25e3a4'
MOD_MARKER = '修改 - 大城市和普通城市征兵倍率可调整'
FACTORS = ('3F800000','3F99999A','3FC00000')
PRECISIONS = (24,53,64)
ROUNDINGS = ('down','up','toward-zero','nearest-even')
# Address -> (direct target or symbolic virtual slot, synthetic argument cleanup).
CALLS = {0x5C3619:(0x47A630,0),0x5C3630:(0x47A630,0),0x5C3643:(0x4866F0,0),
         0x5C364B:(0x47A630,0),0x5C367B:(0x47A630,0),0x5C3689:(0x4890B0,0),
         0x5C36AA:(0x4890F0,4),0x5C36C8:(0x5C3550,0),0x5C3710:(0x707A74,0),
         0x5C3725:('vtable+0x48',0),0x5C3738:(0x4B99B0,4),
         0x5C374E:('vtable+0x50',0),0x5C3757:(0x486BC0,0),
         0x5C3764:('vtable+0x50',0),0x5C376B:(0x486BC0,0)}
LOOP_CALLS = frozenset((0x5C367B,0x5C3689,0x5C36AA))
EAX_CALLS = frozenset(CALLS)-{0x5C36C8,0x5C3710}
BRANCHES = ('je','jne','jl','jge')


def sha(raw): return hashlib.sha256(raw).hexdigest()
def signed(value,width=32):
    value &= (1<<width)-1
    return value-(1<<width) if value&(1<<(width-1)) else value


def f32_fraction(bits):
    word=int(bits,16);exponent=(word>>23)&255
    assert word>>31==0 and 0<exponent<255
    significand=(word&0x7FFFFF)|(1<<23);power=exponent-150
    return Fraction(significand<<max(power,0),1<<max(-power,0))


def round_binary(value,precision,mode):
    """Integer dyadic significand rounding, independent of host floating point."""
    assert precision in PRECISIONS and mode in ROUNDINGS and value>=0
    if value==0:return Fraction(0)
    assert value.denominator&(value.denominator-1)==0
    numerator=value.numerator;drop=max(0,numerator.bit_length()-precision)
    quantum=1<<drop;low,remainder=divmod(numerator,quantum)
    if mode=='up':low+=remainder!=0
    if mode=='nearest-even':low+=2*remainder>quantum or 2*remainder==quantum and low%2==1
    return Fraction(low*quantum,value.denominator)


@dataclass(frozen=True)
class Instruction:
    op: str
    args: tuple
    next_pc: int
    raw: bytes


@dataclass(frozen=True)
class Listing:
    code: dict[int,Instruction]
    mod_rows: tuple


def decode(address,data):
    """Restricted x86 opcode/ModRM/SIB decoder. Mnemonics are never executed."""
    data=bytes(data);cursor=0
    def imm(size,sign=False):
        nonlocal cursor
        assert cursor+size<=len(data),'truncated instruction'
        value=int.from_bytes(data[cursor:cursor+size],'little',signed=sign);cursor+=size
        return value
    def modrm():
        byte=imm(1);mode=byte>>6;reg=('r',(byte>>3)&7);rm=byte&7
        if mode==3:return reg,('r',rm)
        base,index,scale,disp=rm,None,1,0
        if rm==4:
            sib=imm(1);base=sib&7;index=(sib>>3)&7;scale=1<<(sib>>6)
            if index==4:index=None
        if mode==0 and base==5:base=None;disp=imm(4,True)
        elif mode==1:disp=imm(1,True)
        elif mode==2:disp=imm(4,True)
        return reg,('m',base,index,scale,disp)
    opcode=imm(1)
    if opcode in (0x8B,0x89,0x8A,0x8D,0x33,0x03,0x2B,0x3B,0x85):
        reg,rm=modrm();op={0x8B:'mov',0x89:'mov',0x8A:'mov8',0x8D:'lea',0x33:'xor',0x03:'add',0x2B:'sub',0x3B:'cmp',0x85:'test'}[opcode]
        if opcode==0x8A:reg=('r8',reg[1])
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
    elif opcode in (0x74,0x75,0x7C,0x7D):
        op={0x74:'je',0x75:'jne',0x7C:'jl',0x7D:'jge'}[opcode];delta=imm(1,True);args=(('i',address+cursor+delta),)
    elif opcode==0xE8:
        delta=imm(4,True);op,args='call',(('i',address+cursor+delta),)
    elif opcode==0x0F:
        second=imm(1)
        if second in (0xB6,0xB7,0xAF):
            reg,rm=modrm();op={0xB6:'movzx8',0xB7:'movzx16',0xAF:'imul2'}[second]
            if second==0xB6 and rm[0]=='r':rm=('r8',rm[1])
            args=(reg,rm)
        elif second==0x84:
            delta=imm(4,True);op,args='je',(('i',address+cursor+delta),)
        else:raise AssertionError(f'unsupported 0F {second:02X}')
    elif opcode==0xFF:
        reg,rm=modrm();assert reg[1]==2;op,args='call-indirect',(rm,)
    elif opcode==0xF7:
        reg,rm=modrm();assert reg[1]==5;op,args='imul',(rm,)
    elif opcode in (0xC1,0xD1):
        reg,rm=modrm();op={5:'shr',7:'sar'}[reg[1]];args=(rm,('i',imm(1) if opcode==0xC1 else 1))
    elif opcode==0xDA:
        reg,rm=modrm();assert reg[1]==1;op,args='fimul32',(rm,)
    elif opcode in (0x99,0xC3):op,args={0x99:'cdq',0xC3:'ret'}[opcode],()
    else:raise AssertionError(f'unsupported opcode {opcode:02X} at {address:08X}')
    assert cursor==len(data),(f'{address:08X}',data.hex(),cursor)
    return Instruction(op,args,address+cursor,data)


def parse_listing(text):
    assert text.count(MOD_MARKER)==1,'missing or duplicate MOD boundary'
    original,mod=text.split(MOD_MARKER)
    pattern=r'^([0-9A-F]{8}) - ((?:[0-9a-f]{2} )+)\s+- (.*)$'
    rows=[(int(a,16),bytes.fromhex(b),asm) for a,b,asm in re.findall(pattern,original,re.M) if ENTRY<=int(a,16)<END]
    addressed=[line for line in original.splitlines() if re.match(r'^[0-9A-F]{8} - ',line) and ENTRY<=int(line[:8],16)<END]
    assert len(rows)==len(addressed)==131,'instruction row count changed'
    code={};pc=ENTRY
    for address,raw,_ in rows:
        assert address==pc,'gap, duplicate, reorder or MOD overlay'
        code[address]=decode(address,raw);pc=code[address].next_pc
    raw=b''.join(row[1] for row in rows)
    assert pc==END and len(raw)==373 and sha(raw)==CODE_SHA,'original bytes changed'
    assert sha('\n'.join(f'{address:08X} '+asm.split('  ')[0].strip() for address,_,asm in rows).encode())==ASM_SHA,'listing mnemonic changed'
    assert [(a,i.args[0][1]) for a,i in code.items() if i.op=='call']==[(a,target) for a,(target,_) in CALLS.items() if isinstance(target,int)]
    assert [a for a,i in code.items() if i.op=='call-indirect']==[0x5C3725,0x5C374E,0x5C3764]
    assert all(i.args[0][1] in code for i in code.values() if i.op in BRANCHES)
    assert sum(i.op in BRANCHES for i in code.values())==11
    for address,amount in ((0x5C36E0,5),(0x5C36FB,2)):
        assert code[address].op=='sar' and code[address].args==( ('r',2),('i',amount))
    assert code[0x5C370C].op=='fimul32'
    mod_rows=tuple((int(a,16),bytes.fromhex(b),asm) for a,b,asm in re.findall(pattern,mod,re.M))
    assert len(mod_rows)==14 and mod_rows[0][0]==0x5C3710 and mod_rows[0][1].hex()=='e973662e00'
    assert mod_rows[1][0]==0x8A9D88 and mod_rows[-1][0]==0x8A9DB0
    assert sum(raw.hex()=='6bc064' and 'imul eax,eax,32' in asm for _,raw,asm in mod_rows)==2
    assert code[0x5C3710].raw.hex()=='e85f431400'
    return Listing(code,mod_rows)


def load_listing():
    raw=SOURCE.read_bytes();assert len(raw)==12020 and sha(raw)==UTF8_SHA,'full UTF-8 source changed'
    text=raw.decode('utf8');gbk=text.encode('gbk')
    assert len(gbk)==11348 and sha(gbk)==GBK_SHA,'full GBK source changed'
    assert hashlib.sha1(b'blob 11348\0'+gbk).hexdigest()==BLOB_SHA
    assert gbk.decode('gbk').encode()==raw
    return parse_listing(text)


def validate_case(case):
    assert type(case) is dict and {'profile','captures'}<=set(case)
    assert set(case)<={'profile','captures','savedSecurityByte','resolvedFacilityFactorBits','difficultyWord'}
    assert case['profile']==PROFILE and type(case['captures']) is list and len(case['captures'])<=19
    for capture in case['captures']:
        assert type(capture) is dict and 'callAddress' in capture
        address=capture['callAddress'];assert type(address) is str and re.fullmatch('[0-9A-F]{8}',address)
        address=int(address,16);assert address in EAX_CALLS
        assert set(capture)=={'callAddress','eax'}|({'slotIndex'} if address in LOOP_CALLS else set())
        assert type(capture['eax']) is int and 0<=capture['eax']<=MASK
        if address in LOOP_CALLS:assert type(capture['slotIndex']) is int and 0<=capture['slotIndex']<=2
    if 'savedSecurityByte' in case:assert type(case['savedSecurityByte']) is int and 0<=case['savedSecurityByte']<=255
    if 'difficultyWord' in case:assert type(case['difficultyWord']) is int and 0<=case['difficultyWord']<=MASK
    if 'resolvedFacilityFactorBits' in case:assert case['resolvedFacilityFactorBits'] in FACTORS


class ListingMachine:
    """Registers, byte memory, flags and exact finite FPU under a synthetic adapter."""
    STACK,ARRAY,FACILITY=0x30000000,0x12340000,0x41230000
    ACTORS=(0x23450000,0x23450100,0x23450200)
    CITY_VTABLE,FACILITY_VTABLE,V48,V50,RETURN=0x42340000,0x42340100,0x53340000,0x53340100,0xF00DBABE
    DIFFICULTY=0x07201978
    def __init__(self,listing,case,*,merits=(0,65535,1),poison=0xA5B6C7D8,
                 volatile_poison=0xC3D2E1F0,security_after_supplier=None,
                 difficulty_before_converter=0xFFFFFFFF,precision=64,rounding='nearest-even'):
        validate_case(case);assert len(merits)==3 and all(type(v) is int and 0<=v<=65535 for v in merits)
        self.listing,self.case,self.pc=listing,case,ENTRY
        self.r=[poison&MASK for _ in range(8)];self.r[4]=self.STACK;self.initial=self.r.copy()
        self.mem={};self.volatile_poison=volatile_poison;self.sf=self.of=self.zf=self.cf=False
        self.trace=[];self.steps=[];self.branches=[];self.calls=[];self.call_details=[];self.reads=[];self.writes=[];self.events=[]
        self.stage={};self.st0=None;self.precision=precision;self.rounding=rounding
        self.security_after_supplier=security_after_supplier
        self.setmem(self.STACK,self.RETURN);self.setmem(self.STACK+4,self.FACILITY);self.setmem(self.STACK+8,self.ARRAY)
        self.setmem(self.FACILITY,self.FACILITY_VTABLE);self.setmem(self.FACILITY_VTABLE+0x50,self.V50)
        self.setmem(self.CITY_VTABLE+0x48,self.V48);self.setmem(self.DIFFICULTY,difficulty_before_converter)
        for n,actor in enumerate(self.ACTORS):
            self.setmem(self.ARRAY+4*n,actor);self.setmem(actor+0xAE,merits[n],2)
            self.setmem(actor+0xB0,0xABCD,2) # A dword-width merit mutant would see extra bits.
    def setmem(self,address,value,width=4):
        for n in range(width):self.mem[(address+n)&MASK]=(value>>(8*n))&255
    def getmem(self,address,width=4):
        address&=MASK
        assert all((address+n)&MASK in self.mem for n in range(width)),f'uninitialized memory {address:08X}'
        self.reads.append((self.pc,address,width));self.events.append(('read',self.pc,address,width))
        return sum(self.mem[(address+n)&MASK]<<(8*n) for n in range(width))
    def address(self,x):
        _,base,index,scale,disp=x
        return ((self.r[base] if base is not None else 0)+(self.r[index]*scale if index is not None else 0)+disp)&MASK
    def read(self,x,width=4):
        if x[0]=='i':return x[1]&MASK
        if x[0]=='r':return self.r[x[1]]&((1<<(8*width))-1)
        if x[0]=='r8':return (self.r[x[1]%4]>>(8 if x[1]>=4 else 0))&255
        return self.getmem(self.address(x),width)
    def write(self,x,value):
        value&=MASK
        if x[0]=='r':self.r[x[1]]=value
        elif x[0]=='r8':
            index=x[1]%4;shift=8 if x[1]>=4 else 0
            self.r[index]=(self.r[index]&~(255<<shift))|((value&255)<<shift)
        elif x[0]=='m':
            address=self.address(x);self.setmem(address,value);self.writes.append((self.pc,address,value))
        else:raise AssertionError(x)
    def push(self,value):self.r[4]=(self.r[4]-4)&MASK;self.setmem(self.r[4],value)
    def pop(self):value=self.getmem(self.r[4]);self.r[4]=(self.r[4]+4)&MASK;return value
    def flags(self,left,right,subtract):
        left&=MASK;right&=MASK;value=(left-right if subtract else left+right)&MASK
        self.sf=bool(value&0x80000000);self.zf=value==0
        self.of=bool(((left^right)&(left^value) if subtract else ~(left^right)&(left^value))&0x80000000)
        self.cf=left<right if subtract else left+right>MASK
        return value
    def call(self,instruction):
        assert self.pc in CALLS;target,cleanup=CALLS[self.pc]
        if isinstance(target,int):assert self.read(instruction.args[0])==target
        else:assert self.read(instruction.args[0])==(self.V48 if self.pc==0x5C3725 else self.V50)
        sp=self.r[4];ecx=self.r[1];top=lambda offset=0:self.getmem(sp+offset)
        slot=self.r[3] if self.pc in LOOP_CALLS else None
        if self.pc==0x5C3619:assert top()==self.FACILITY
        elif self.pc==0x5C3630:assert top()==self.ACTORS[0]
        elif self.pc==0x5C3643:assert ecx==self.FACILITY
        elif self.pc==0x5C364B:assert top()==self.city
        elif self.pc==0x5C367B:assert top()==self.ACTORS[slot]
        elif self.pc in (0x5C3689,0x5C36AA):
            assert ecx==self.ACTORS[slot]
            if self.pc==0x5C36AA:assert top()==79
        elif self.pc==0x5C36C8:assert top()==self.city
        elif self.pc==0x5C3725:assert ecx==self.city
        elif self.pc==0x5C3738:assert ecx==0x0799895C and top()==self.FACILITY
        elif self.pc in (0x5C374E,0x5C3757,0x5C3764,0x5C376B):assert ecx==self.FACILITY
        detail={'callAddress':f'{self.pc:08X}','target':f'{target:08X}' if isinstance(target,int) else target,
                'slotIndex':slot,'queryId':79 if self.pc==0x5C36AA else None,
                'kind':'captured-eax','eax':None,'st0Bits':None}
        if self.pc==0x5C36C8:
            assert self.st0 is None;self.st0=f32_fraction(self.case['resolvedFacilityFactorBits'])
            detail.update(kind='captured-st0-f32',st0Bits=self.case['resolvedFacilityFactorBits'])
            value=self.volatile_poison
            if self.security_after_supplier is not None:self.setmem(self.city+0x85,self.security_after_supplier,1)
        elif self.pc==0x5C3710:
            assert self.st0 is not None;value=int(self.st0);assert 1000<=value<=25915
            self.st0=None;detail.update(kind='derived-converter-eax',eax=value)
            self.stage['convertedQuantity']=value
            # The public observation is the later actual difficulty read, not a snapshot.
            self.setmem(self.DIFFICULTY,self.case['difficultyWord'])
        else:
            index=len(self.trace);assert index<len(self.case['captures']),'missing capture'
            capture=self.case['captures'][index];assert capture['callAddress']==f'{self.pc:08X}','wrong dynamic call order'
            if slot is not None:assert capture['slotIndex']==slot,'wrong dynamic slot'
            self.trace.append(deepcopy(capture));value=capture['eax'];detail['eax']=value
            if self.pc==0x5C3643:
                self.city=value;self.setmem(self.city,self.CITY_VTABLE)
                self.setmem(self.city+0x85,self.case.get('savedSecurityByte',0),1)
                self.setmem(self.city+0x86,0xEEDDCCBB) # unrelated appended-MOD-only poison
                self.setmem(self.city+0x8A,0xAABB,2)
        self.push(instruction.next_pc);assert self.pop()==instruction.next_pc
        self.r[4]=(self.r[4]+cleanup)&MASK
        self.r[0]=value&MASK;self.r[1]=self.volatile_poison&MASK;self.r[2]=~self.volatile_poison&MASK
        self.sf,self.of,self.zf,self.cf=True,False,True,False
        self.calls.append(self.pc);self.call_details.append(detail);self.events.append(('call',self.pc))
    def run(self,*,stop_at=None):
        for _ in range(1000):
            if self.pc==stop_at:return tuple(self.r)
            assert self.pc in self.listing.code,f'outside original byte map: {self.pc:08X}'
            instruction=self.listing.code[self.pc];op,args=instruction.op,instruction.args;next_pc=instruction.next_pc
            self.steps.append(self.pc)
            if self.pc==0x5C365D:
                assert set(self.case)=={'profile','captures','savedSecurityByte','resolvedFacilityFactorBits','difficultyWord'},'missing later observations'
            elif self.pc==0x5C36C1:
                self.stage.update(charismaSum=self.r[7],skillParameter=self.getmem(self.STACK-4),deadMeritMaximum=signed(self.getmem(self.STACK-8)))
            elif self.pc==0x5C36EF:self.stage['baseQuantity']=signed(self.r[1])
            elif self.pc==0x5C3705:self.stage['integerQuantity']=signed(self.r[0])
            elif self.pc==0x5C372E:self.stage['afterSuperU32']=self.r[6]
            elif self.pc==0x5C374A:self.stage['afterPressureU32']=self.r[6]
            elif self.pc==0x5C375C:self.stage['firstSumU32']=self.r[3]
            if op=='mov':self.write(args[0],self.read(args[1]))
            elif op in ('mov8','movzx8','movzx16'):self.write(args[0],self.read(args[1],2 if op=='movzx16' else 1))
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
            elif op=='imul2':
                product=signed(self.read(args[0]))*signed(self.read(args[1]));self.write(args[0],product)
                self.cf=self.of=product!=signed(product&MASK)
            elif op in ('sar','shr'):
                amount=self.read(args[1])&31;value=self.read(args[0]);result=(signed(value) if op=='sar' else value)>>amount
                if amount:
                    self.cf=bool((value>>(amount-1))&1);self.sf=bool(result&0x80000000);self.zf=(result&MASK)==0
                    if amount==1:self.of=False if op=='sar' else bool(value&0x80000000)
                self.write(args[0],result)
            elif op=='cdq':self.r[2]=MASK if self.r[0]&0x80000000 else 0
            elif op=='fimul32':
                assert self.st0 is not None
                self.st0=round_binary(self.st0*signed(self.read(args[0])),self.precision,self.rounding)
            elif op=='push':self.push(self.read(args[0]))
            elif op=='pop':self.write(args[0],self.pop())
            elif op in ('call','call-indirect'):self.call(instruction)
            elif op in BRANCHES:
                taken={'je':self.zf,'jne':not self.zf,'jl':self.sf!=self.of,'jge':self.sf==self.of}[op]
                self.branches.append((self.pc,taken))
                if taken:next_pc=self.read(args[0])
            elif op=='ret':
                assert self.pop()==self.RETURN and self.r[4]==self.STACK+4,'unbalanced synthetic caller stack'
                assert all(self.r[n]==self.initial[n] for n in (3,5,6,7)),'nonvolatile caller registers not restored'
                assert len(self.trace)==len(self.case['captures']),'surplus capture'
                if 'integerQuantity' not in self.stage:assert set(self.case)=={'profile','captures'},'early exit has later fields'
                return self.result()
            else:raise AssertionError(op)
            self.pc=next_pc
        raise AssertionError('interpreter instruction bound exceeded')
    def result(self):
        full='integerQuantity' in self.stage
        reason='captured-quantity-projection' if full else {1:'facility-invalid',2:'first-slot-invalid',4:'city-invalid'}[len(self.calls)]
        result={'profile':PROFILE,'reason':reason,'returnedValue':signed(self.r[0]),'rawEaxU32':self.r[0],
                'slots':[],'trace':self.trace,'callDetails':self.call_details}
        fields=('charismaSum','validSlotCount','skillParameter','baseQuantity','integerQuantity','savedSecurityByte',
                'resolvedFacilityFactorBits','difficultyWord','convertedQuantity','afterSuperU32','pressureEax','afterPressureU32',
                'firstTroopsEax','firstCapacityEax','firstSumU32','secondTroopsEax','secondCapacityEax','cityVirtualEax')
        result.update({key:None for key in fields});result.update(superApplied=False,pressureApplied=False,capacityFallbackApplied=False)
        if not full:return result
        by={(c['callAddress'],c.get('slotIndex')):c['eax'] for c in self.trace}
        for slot in range(3):
            validity=by['005C367B',slot];charisma=by.get(('005C3689',slot));skill=by.get(('005C36AA',slot))
            result['slots'].append({'slotIndex':slot,'validityEax':validity,'charismaEax':charisma,'charismaAl':None if charisma is None else charisma&255,'skillEax':skill})
        for key in ('charismaSum','skillParameter','baseQuantity','integerQuantity','convertedQuantity','afterSuperU32','afterPressureU32','firstSumU32'):result[key]=self.stage[key]
        for key in ('savedSecurityByte','resolvedFacilityFactorBits','difficultyWord'):result[key]=self.case[key]
        result['validSlotCount']=sum(slot['validityEax']!=0 for slot in result['slots'])
        result['superApplied']=0x5C372C in self.steps;result['pressureApplied']=0x5C3741 in self.steps
        result['capacityFallbackApplied']=0x5C3760 in self.steps
        for key,address in (('cityVirtualEax','005C3725'),('pressureEax','005C3738'),('firstTroopsEax','005C374E'),('firstCapacityEax','005C3757'),('secondTroopsEax','005C3764'),('secondCapacityEax','005C376B')):result[key]=by.get((address,None))
        return result


def make_case(values=(60,60,60),validity=(1,1,1),skills=(0,0,0),*,gates=(1,1,1),resolver=0x45670000,
              security=100,factor='3F800000',difficulty=0,virtual=1,pressure=0,capacity=(0,100000,0,100000)):
    captures=[];case={'profile':PROFILE,'captures':captures}
    def add(address,eax,slot=None):
        capture={'callAddress':address,'eax':eax}
        if slot is not None:capture['slotIndex']=slot
        captures.append(capture)
    add('005C3619',gates[0])
    if gates[0]==0:return case
    add('005C3630',gates[1])
    if gates[1]==0:return case
    add('005C3643',resolver);add('005C364B',gates[2])
    if gates[2]==0:return case
    case.update(savedSecurityByte=security,resolvedFacilityFactorBits=factor,difficultyWord=difficulty)
    for slot in range(3):
        add('005C367B',validity[slot],slot)
        if validity[slot]:add('005C3689',values[slot],slot);add('005C36AA',skills[slot],slot)
    if difficulty==2:add('005C3725',virtual)
    add('005C3738',pressure);add('005C374E',capacity[0]);add('005C3757',capacity[1])
    # Case construction chooses the required capture shape using exact scalar math,
    # independently checked against byte execution rather than the product source.
    charm=sum(values[n]&255 for n in range(3) if validity[n]);skill=15 if any(validity[n] and skills[n] for n in range(3)) else 10
    integer=(1000+(security+20)*charm//20)*skill//10;quantity=int(integer*f32_fraction(factor))
    if difficulty==2 and virtual==0:quantity*=2
    if pressure:quantity//=2
    if signed(capacity[1])<signed((capacity[0]+quantity)&MASK):
        assert len(capacity)==4;add('005C3764',capacity[2]);add('005C376B',capacity[3])
    return case


def cases():
    inputs=[make_case(gates=g,resolver=r) for g in ((0,1,1),(256,0,1),(MASK,256,0),(256,MASK,256)) for r in (0,MASK,0x12345678)]
    capacities=((0,100000,0,100000),(100,0,100,0),(100,0,0,10000),(100,0,MASK,0),
                (0,0x80000000,0,0x80000000),(0x7FFFFFFF,0x7FFFFFFF,0,0),
                (MASK,0x7FFFFFFF,0,0),(0,0x7FFFFFFF,0,0))
    for validity in itertools.product((0,256),repeat=3):
        for skills in itertools.product((0,MASK),repeat=3):
            for factor in FACTORS:
                for difficulty,virtual,pressure in ((0,0,0),(2,0,256),(2,256,0),(258,0,MASK)):
                    inputs.append(make_case((0,257,MASK),validity,skills,factor=factor,difficulty=difficulty,virtual=virtual,pressure=pressure))
    for n in range(256):
        for high in (0,0x100,0x80000000,0xFFFFFF00):
            inputs.append(make_case((high|n,255-n,n),skills=(0,256 if n&1 else 0,0),security=n,factor=FACTORS[n%3],difficulty=2,virtual=0,pressure=n%2))
    for capacity in capacities:
        for difficulty in (0,1,2,3,258,MASK):
            for virtual,pressure in itertools.product((0,256,MASK),repeat=2):
                inputs.append(make_case(values=(1,0,0),skills=(1,0,0),security=0,difficulty=difficulty,virtual=virtual,pressure=pressure,capacity=capacity))
    rng=random.Random(ENTRY)
    for _ in range(800):
        inputs.append(make_case(tuple(rng.randrange(2**32) for _ in range(3)),
          tuple(rng.choice((0,1,256,MASK)) for _ in range(3)),tuple(rng.choice((0,256,MASK)) for _ in range(3)),
          security=rng.randrange(256),factor=rng.choice(FACTORS),difficulty=rng.choice((0,2,258,MASK)),virtual=rng.choice((0,256,MASK)),pressure=rng.choice((0,256,MASK)),capacity=tuple(rng.randrange(2**32) for _ in range(4))))
    # Two noncommuting skill/FPU witnesses and exact signed-capacity equality.
    inputs.extend([make_case((n,0,0),skills=(1,0,0),security=0,factor='3F99999A') for n in (4,5)])
    inputs.extend([make_case(validity=(0,0,0),capacity=(100,1100,0,0)),make_case((1,0,0),skills=(1,0,0),security=0,difficulty=2,virtual=0,pressure=256)])
    unique={json.dumps(case,sort_keys=True):case for case in inputs}
    return list(unique.values())


def run_node(inputs,source=None):
    module=source or ROOT/'packages/engine/src/recruitment-quantity.ts'
    script="""import fs from 'node:fs'; import {calculateRecruitmentQuantityProjection as f} from MODULE;
process.stdout.write(JSON.stringify(JSON.parse(fs.readFileSync(0,'utf8')).map(f)));""".replace('MODULE',json.dumps(module.as_uri()))
    result=subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,input=json.dumps(inputs),text=True,capture_output=True)
    assert result.returncode==0,result.stderr
    actual=json.loads(result.stdout);assert len(actual)==len(inputs)
    return actual


def require_complete_coverage(listing,executed,branches,calls,max_calls,max_captures):
    """Acceptance is exact set coverage, not merely an informational count."""
    expected_branches={(pc,taken) for pc,instruction in listing.code.items()
                       if instruction.op in BRANCHES for taken in (False,True)}
    assert len(listing.code)==131 and executed==set(listing.code), 'incomplete full-corpus coverage: instruction PCs'
    assert len(expected_branches)==22 and branches==expected_branches, 'incomplete full-corpus coverage: branch outcomes'
    assert len(CALLS)==15 and set(calls)==set(CALLS), 'incomplete full-corpus coverage: CALL sites'
    assert max_calls==21, 'incomplete full-corpus coverage: maximum dynamic calls'
    assert max_captures==19, 'incomplete full-corpus coverage: maximum EAX captures'


def compare_results(listing,inputs,*,source=None,require_full_coverage=True):
    # Full acceptance is the default for both CLI and source/schema checker.
    # Deliberately focused comparisons must explicitly opt into subset-only mode.
    assert type(require_full_coverage) is bool
    expected=[];executed=set();branches=set();calls=Counter();max_calls=max_captures=0
    for case in inputs:
        machine=ListingMachine(listing,case);answer=machine.run();expected.append(answer)
        if answer['integerQuantity'] is not None:
            assert len(machine.calls)==12+2*answer['validSlotCount']+int(case['difficultyWord']==2)+2*int(answer['capacityFallbackApplied'])
            assert len(machine.trace)==len(machine.calls)-2
        else:assert len(machine.calls)==len(machine.trace)
        executed.update(machine.steps);branches.update(machine.branches);calls.update(machine.calls)
        max_calls=max(max_calls,len(machine.calls));max_captures=max(max_captures,len(machine.trace))
    if require_full_coverage:
        require_complete_coverage(listing,executed,branches,calls,max_calls,max_captures)
    actual=run_node(inputs,source)
    for index,(case,want,got) in enumerate(zip(inputs,expected,actual)):
        assert got.get('supported') is True,(index,case,got)
        difference={key:(value,got.get(key)) for key,value in want.items() if got.get(key)!=value}
        assert not difference,(index,case,difference)
    return {'byteInterpreterCases':len(inputs),'typescriptPublicApiComparisons':len(inputs),
        'instructionsExecuted':len(executed),'originalInstructionCount':len(listing.code),
        'conditionalOutcomesObserved':len(branches),'conditionalOutcomesTotal':22,
        'staticCallSitesObserved':len(calls),'maximumDynamicCalls':max_calls,'maximumEaxCaptures':max_captures,
        'dynamicCalls':sum(calls.values()),'allOriginalInstructionsExecuted':executed==set(listing.code),
        'allConditionalOutcomesObserved':branches=={(pc,taken) for pc,instruction in listing.code.items()
            if instruction.op in BRANCHES for taken in (False,True)},
        'allStaticCallSitesObserved':set(calls)==set(CALLS),'fullCoverageRequired':require_full_coverage,
        'comparisonScope':'synthetic listing-byte caller projection; no native/ABI/real-trace proof'}


def check_coverage_regressions(listing):
    """A shrunken full corpus must fail, while explicit focused use still works."""
    reduced=cases()[:1]
    try:compare_results(listing,reduced)
    except AssertionError as error:
        assert str(error)=='incomplete full-corpus coverage: instruction PCs',str(error)
    else:raise AssertionError('shrunken full corpus incorrectly passed acceptance')
    subset=compare_results(listing,reduced,require_full_coverage=False)
    assert subset['byteInterpreterCases']==subset['typescriptPublicApiComparisons']==1
    assert subset['fullCoverageRequired'] is False and subset['allOriginalInstructionsExecuted'] is False
    # Guard against replacing exact identity checks with equal-size counts and
    # against weakening either maximum to an upper-bound-only assertion.
    executed=set(listing.code)
    branches={(pc,taken) for pc,instruction in listing.code.items()
              if instruction.op in BRANCHES for taken in (False,True)}
    calls=set(CALLS)
    require_complete_coverage(listing,executed,branches,calls,21,19)
    controls=[
        ('instruction PCs',executed-{ENTRY}|{END},branches,calls,21,19),
        ('branch outcomes',executed,branches-{(0x5C3623,False)}|{(ENTRY,False)},calls,21,19),
        ('CALL sites',executed,branches,calls-{0x5C3619}|{ENTRY},21,19),
        ('maximum dynamic calls',executed,branches,calls,20,19),
        ('maximum dynamic calls',executed,branches,calls,22,19),
        ('maximum EAX captures',executed,branches,calls,21,18),
        ('maximum EAX captures',executed,branches,calls,21,20),
    ]
    for label,*observations in controls:
        try:require_complete_coverage(listing,*observations)
        except AssertionError as error:
            assert str(error)=='incomplete full-corpus coverage: '+label,str(error)
        else:raise AssertionError('weakened coverage guard survived: '+label)
    return {'shrunkenFullCorpusRejected':True,'reducedCorpusCases':len(reduced),
        'explicitSubsetComparisonPassed':True,'sameCountWrongIdentityControlsRejected':3,
        'exactMaximumControlsRejected':4,'scope':'acceptance-guard regressions, not additional byte coverage'}


def check_examples(listing):
    examples=[('all loop invalid',make_case(validity=(0,0,0)),1000),
      ('skill before factor low',make_case((4,0,0),skills=(1,0,0),security=0,factor='3F99999A'),1807),
      ('skill before factor high',make_case((5,0,0),skills=(1,0,0),security=0,factor='3F99999A'),1808),
      ('super before pressure odd',make_case((1,0,0),skills=(1,0,0),security=0,difficulty=2,virtual=0,pressure=256),1501),
      ('signed wrapped first sum',make_case(validity=(0,0,0),capacity=(0x7FFFFFFF,0x7FFFFFFF,0,0)),1000),
      ('independent second getters',make_case(validity=(0,0,0),capacity=(100,0,0,10000)),10000),
      ('negative fallback unclamped',make_case(validity=(0,0,0),capacity=(100,0,100,0)),-100),
      ('wrapping subtraction',make_case(validity=(0,0,0),capacity=(100,0,MASK,0)),1),
      ('minimum signed fallback',make_case(validity=(0,0,0),capacity=(0,0x80000000,0,0x80000000)),-2**31),
      ('capacity equality',make_case(validity=(0,0,0),capacity=(100,1100,0,0)),1000),
      ('max finite before capacity',make_case((255,255,255),skills=(1,0,0),security=255,factor='3FC00000',difficulty=2,virtual=0),51830)]
    for name,case,value in examples:assert ListingMachine(listing,case).run()['returnedValue']==value,name
    controls=0
    for case in (examples[0][1],examples[1][1],examples[-1][1],make_case(gates=(1,1,0)),make_case(gates=(0,1,1))):
        baseline=ListingMachine(listing,case).run()
        for poison in (0,1,MASK,0x80000000):
            assert ListingMachine(listing,case,poison=poison,volatile_poison=poison).run()==baseline;controls+=1
    case=make_case((1,127,255),skills=(256,0,0),security=255,difficulty=2,virtual=0)
    baseline=ListingMachine(listing,case);want=baseline.run();merit_checks=0
    for merits in itertools.product((0,1,65535),repeat=3):
        machine=ListingMachine(listing,case,merits=merits,security_after_supplier=0,difficulty_before_converter=258)
        assert machine.run()==want;assert machine.stage['deadMeritMaximum']==max(merits);merit_checks+=1
        for slot,actor in enumerate(machine.ACTORS):
            getter=next(n for n,event in enumerate(machine.events) if event==('call',0x5C3689) and sum(e==('call',0x5C3689) for e in machine.events[:n])==slot)
            read=machine.events.index(('read',0x5C3697,actor+0xAE,2))
            skill=next(n for n,event in enumerate(machine.events) if event==('call',0x5C36AA) and sum(e==('call',0x5C36AA) for e in machine.events[:n])==slot)
            assert getter<read<skill
    assert [read for read in baseline.reads if read[0]==0x5C36C1 and read[1] not in (baseline.STACK-4,baseline.STACK-8)]==[(0x5C36C1,(baseline.city+0x85)&MASK,1)]
    assert baseline.events.index(('call',0x5C3710))<baseline.events.index(('read',0x5C3717,baseline.DIFFICULTY,4))
    aliases={pc:address for pc,address,value in baseline.writes if pc in (0x5C3669,0x5C36B3,0x5C3705)}
    aliases.update({pc:address for pc,address,width in baseline.reads if pc in (0x5C36EF,0x5C370C)})
    assert set(aliases.values())=={baseline.STACK-4} and len(aliases)==5
    invalid=ListingMachine(listing,examples[0][1]);invalid.run();assert invalid.stage['deadMeritMaximum']==-2**31
    for precision,mode in itertools.product(PRECISIONS,ROUNDINGS):
        assert ListingMachine(listing,examples[1][1],precision=precision,rounding=mode).run()==ListingMachine(listing,examples[1][1]).run()
    # Isolated decoded suffix instructions exercise negative/wrapping arithmetic.
    # These are instruction controls only, never accepted finite-profile inputs.
    suffix_controls=0
    for raw in (0,1,3,0x7FFFFFFF,0x80000000,0xFFFFFFFD,MASK):
        machine=ListingMachine(listing,case);machine.pc=0x5C3741;machine.r[6]=raw
        registers=machine.run(stop_at=0x5C374A)
        expected=(abs(signed(raw))//2)*(-1 if signed(raw)<0 else 1)
        assert registers[6]==expected&MASK;suffix_controls+=1
    machine=ListingMachine(listing,case);machine.pc=0x5C372C;machine.r[6]=0x7FFFFFFF
    machine.run(stop_at=0x5C372E);machine.pc=0x5C3741
    assert machine.run(stop_at=0x5C374A)[6]==MASK;suffix_controls+=1
    return {'namedCases':len(examples),'registerAndVolatilePoisonComparisons':controls,'deadMeritWordVariants':merit_checks,
      'isolatedDecodedSuffixControls':suffix_controls,'suffixControlsBroadenPublicInputDomain':False,
      'savedSecurityMutationAfterSupplierVerified':True,'difficultyReadAfterConverterVerified':True,
      'stackAliasAddressesVerified':len(aliases),'getterWordReadSkillOrderingVerified':True,'finiteFpuModeCallerExamples':12,
      'coverageAcceptanceControls':check_coverage_regressions(listing)}


def check_rejections(listing):
    good=make_case((255,255,255),skills=(1,0,0),difficulty=2,virtual=0,capacity=(100,0,MASK,0));bad=[]
    for n in range(len(good['captures'])):
        case=deepcopy(good);del case['captures'][n];bad.append(case)
    for n in range(len(good['captures'])-1):
        case=deepcopy(good);case['captures'][n:n+2]=reversed(case['captures'][n:n+2]);bad.append(case)
    for n in (0,4,5,6,13,14,15,16,17,18):
        for key,value in (('eax',-1),('eax',2**32),('eax',True),('eax',1.25),('eax','1'),('eax',None),
                          ('callAddress','005c3619'),('callAddress','0047A630'),('callAddress','005C36C8'),('callAddress','005C3710'),
                          ('slotIndex',3),('slotIndex',True),('extra',0)):
            case=deepcopy(good);case['captures'][n][key]=value;bad.append(case)
    for key,values in (('savedSecurityByte',(-1,256,True,1.5,'1',None)),
                       ('difficultyWord',(-1,2**32,True,1.5,'2',None)),
                       ('resolvedFacilityFactorBits',('3f99999a','3F999999','00000000','7FC00000',1.2,None)),
                       ('profile',('',None,True,'recruitment-quantity-observations-v1'))):
        for value in values:case=deepcopy(good);case[key]=value;bad.append(case)
    for key in good:case=deepcopy(good);del case[key];bad.append(case)
    for gates in ((0,1,1),(1,0,1),(1,1,0)):
        for key,value in (('savedSecurityByte',0),('resolvedFacilityFactorBits','3F800000'),('difficultyWord',0)):
            case=make_case(gates=gates);case[key]=value;bad.append(case)
        case=make_case(gates=gates);case['captures'].append({'callAddress':'005C3738','eax':0});bad.append(case)
    case=deepcopy(good);case['captures'].append({'callAddress':'005C376B','eax':0});bad.append(case)
    case=deepcopy(good);case['extra']=0;bad.append(case)
    # Branch-incompatible valid-width observations: virtual/capacity must follow actual control flow.
    case=deepcopy(good);case['difficultyWord']=258;bad.append(case)
    case=deepcopy(good);case['captures'][-3]['eax']=0x7FFFFFFF;bad.append(case)
    case=make_case(validity=(0,0,0));case['captures'].insert(5,{'callAddress':'005C3689','slotIndex':0,'eax':100});bad.append(case)
    case=make_case();case['captures'].insert(13,{'callAddress':'005C3725','eax':0});bad.append(case)
    case=make_case();case['captures'].extend([{'callAddress':'005C3764','eax':0},{'callAddress':'005C376B','eax':0}]);bad.append(case)
    for case in bad:
        try:ListingMachine(listing,case).run()
        except (AssertionError,KeyError,TypeError,ValueError):pass
        else:raise AssertionError(('oracle accepted invalid case',case))
    actual=run_node(bad)
    assert all(value.get('supported') is False for value in actual),[(n,bad[n],v) for n,v in enumerate(actual) if v.get('supported')]
    return {'invalidJsonInputsRejectedByOracleAndTypescript':len(bad)}


def check_api_contract():
    base=make_case(difficulty=2,virtual=0,capacity=(100,0,100,0))
    script="""import assert from 'node:assert/strict';
import {calculateRecruitmentQuantityProjection as f,RECRUITMENT_QUANTITY as metadata} from MODULE;
const base=BASE;let rejected=0,getterReads=0;
const reject=x=>{assert.equal(f(x).supported,false);rejected++};
for(const x of [null,undefined,0,true,'x',[],{},new Date(),Object.assign(Object.create({profile:base.profile}),{captures:[]})])reject(x);
for(const v of [NaN,Infinity,-Infinity,undefined,1n,()=>1]){
  reject({...base,savedSecurityByte:v});reject({...base,difficultyWord:v});
  const x=structuredClone(base);x.captures[0].eax=v;reject(x);
}
for(const key of Object.keys(base)){const x={...base};Object.defineProperty(x,key,{get(){getterReads++;throw Error('input getter must not run')},enumerable:true});reject(x)}
for(const key of ['callAddress','slotIndex','eax']){const x=structuredClone(base);Object.defineProperty(x.captures[4],key,{get(){getterReads++;throw Error('capture getter must not run')},enumerable:true});reject(x)}
const getArray=structuredClone(base);Object.defineProperty(getArray.captures,'0',{get(){getterReads++;throw Error('array getter must not run')},enumerable:true});reject(getArray);
reject({...base,[Symbol('x')]:1});const symbolCapture=structuredClone(base);symbolCapture.captures[0][Symbol('x')]=1;reject(symbolCapture);
reject({...base,captures:new Array(3)});for(const key of ['x',Symbol('x')]){const x=structuredClone(base);x.captures[key]=1;reject(x)}
reject({...base,captures:Object.setPrototypeOf([...base.captures],null)});
const exotic=structuredClone(base);exotic.captures[0]=Object.assign(Object.create({extra:1}),exotic.captures[0]);reject(exotic);
class Captures extends Array{}reject({...base,captures:Captures.from(base.captures)});
const x=structuredClone(base),before=JSON.stringify(x),out=f(x);assert.equal(out.supported,true);assert.equal(JSON.stringify(x),before);assert.deepEqual(f(x),out);
function frozen(v){if(v&&typeof v==='object'){assert(Object.isFrozen(v));for(const child of Object.values(v))frozen(child)}}
frozen(out);frozen(f(null));frozen(metadata);assert.notEqual(out.trace,x.captures);assert.notEqual(out.trace[0],x.captures[0]);
x.captures[0].eax=0;assert.equal(out.trace[0].eax,1);
const nil=Object.assign(Object.create(null),structuredClone(base));nil.captures=nil.captures.map(c=>Object.assign(Object.create(null),c));assert.equal(f(nil).supported,true);
const early={profile:base.profile,captures:[{callAddress:'005C3619',eax:0}]};const earlyOut=f(early);assert.equal(earlyOut.supported,true);frozen(earlyOut);
assert.equal(getterReads,0);process.stdout.write(JSON.stringify({nonJsonRejections:rejected,getterReads,deepFrozen:true,callerUnchanged:true,nonAliasedTrace:true,nullPrototypeAccepted:true,hostileProxyInertnessClaimed:false}));
""".replace('MODULE',json.dumps((ROOT/'packages/engine/src/recruitment-quantity.ts').as_uri())).replace('BASE',json.dumps(base))
    result=subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,capture_output=True,text=True)
    assert result.returncode==0,result.stderr
    return json.loads(result.stdout)


def listing_integer_arithmetic(security,charm,skill):
    """Independent fixed-width IMUL-high/SAR/SHR reduction of listed integer stages."""
    eax=((security+20)*charm)&MASK;ecx=(eax+eax*4)&MASK
    edx=((signed(0x51EB851F)*signed(ecx))>>32)&MASK
    edx=(signed(edx)>>5)&MASK;ecx=(edx+(edx>>31)+1000)&MASK
    base=signed(ecx);ecx=(signed(ecx)*skill)&MASK
    edx=((signed(0x66666667)*signed(ecx))>>32)&MASK
    edx=(signed(edx)>>2)&MASK;eax=((edx>>31)+edx)&MASK
    return base,signed(eax)


def check_integer_grid():
    count=0;values=set();digest=hashlib.sha256()
    for security in range(256):
        for charm in range(766):
            for skill in (10,15):
                base,n=listing_integer_arithmetic(security,charm,skill)
                assert base==1000+(security+20)*charm//20 and n==base*skill//10
                count+=1;values.add(n);digest.update(f'{security},{charm},{skill},{base},{n}\n'.encode())
    assert count==392192 and len(values)==13800 and min(values)==1000 and max(values)==17277
    assert digest.hexdigest()=='e3d03767ec8ed57e8d7de0920b295c6a3698fb300b13ecb8071059773b4bb3d7'
    return {'integerGridCases':count,'distinctIntegerQuantities':len(values),'integerQuantityRange':[min(values),max(values)],
            'resultStreamSha256':digest.hexdigest(),'method':'fixed-width listed IMUL-high/SAR/SHR reduction against separate nonnegative integer formula; not full byte executions'}


def check_precision_domain():
    # Rounder controls include both tie directions, carry and directed rounding.
    assert round_binary(Fraction((1<<24)+1),24,'nearest-even')==1<<24
    assert round_binary(Fraction((1<<24)+3),24,'nearest-even')==(1<<24)+4
    assert round_binary(Fraction((1<<25)-1),24,'nearest-even')==1<<25
    assert round_binary(Fraction((1<<24)+1),24,'up')==(1<<24)+2
    assert round_binary(Fraction((1<<24)+1),24,'down')==1<<24
    checks=changed=0;final_hash=hashlib.sha256();dyadic_hash=hashlib.sha256()
    for n in range(1000,17278):
        for bits in FACTORS:
            exact=n*f32_fraction(bits);expected=int(exact);final_hash.update(struct.pack('<I',expected))
            assert expected==(n if bits=='3F800000' else 6*n//5 if bits=='3F99999A' else 3*n//2)
            for precision,mode in itertools.product(PRECISIONS,ROUNDINGS):
                rounded=round_binary(exact,precision,mode);assert int(rounded)==expected
                checks+=1;changed+=rounded!=exact
                # Common 2^23 denominator permits byte-for-byte comparison with the
                # separately written off-repository dyadic review without importing it.
                common=rounded*(1<<23);assert common.denominator==1
                dyadic_hash.update(f'{n},{bits},{precision},{mode},{common.numerator}/8388608,{expected}\n'.encode())
    assert checks==586008 and changed==65076
    assert final_hash.hexdigest()=='abdca4cf29cdbe348750e5c31344d9956616bdbe4fcbb24f90eb51ddda5ee8bd'
    assert dyadic_hash.hexdigest()=='d3a3c453c4fa3ddcd904a3b529a9a5f896cd714f5728a794f118d538b944e465'
    return {'integerOperandSuperset':[1000,17277],'integerOperandCount':16278,'factorBits':list(FACTORS),
            'precisions':list(PRECISIONS),'roundingModes':list(ROUNDINGS),'finiteDyadicPrecisionItems':checks,
            'roundedProductDiffersFromExactCases':changed,'sameFinalTruncation':True,
            'finalIntegerStreamSha256':final_hash.hexdigest(),'fullDyadicStreamSha256':dyadic_hash.hexdigest(),
            'scope':'finite normal-return mathematical proof; no native FPU/helper execution, stock constants or exception proof'}


def check_api_grid():
    """Actual exported API over the full bounded numeric product grid (4,706,304)."""
    records=bytearray();expected_hash=hashlib.sha256();count=0
    for security in range(256):
        for charm in range(766):
            for skill in (10,15):
                base,n=listing_integer_arithmetic(security,charm,skill)
                records.extend(struct.pack('<II',base,n))
                for factor in FACTORS:
                    converted=int(n*f32_fraction(factor))
                    for super_applied,pressure_applied in itertools.product((0,1),repeat=2):
                        value=converted*(1+super_applied)//(1+pressure_applied)
                        raw=struct.pack('<I',value);records.extend(raw);expected_hash.update(raw);count+=1
    assert count==4706304
    script="""import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {calculateRecruitmentQuantityProjection as f} from MODULE;
const bytes=fs.readFileSync(RECORDS),expected=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
const factors=['3F800000','3F99999A','3FC00000'];let offset=0,count=0;const hash=crypto.createHash('sha256'),word=Buffer.alloc(4);
const c=(callAddress,eax,slotIndex)=>slotIndex===undefined?{callAddress,eax}:{callAddress,slotIndex,eax};
const prefix=[c('005C3619',256),c('005C3630',0xffffffff),c('005C3643',0),c('005C364B',256)];
const loop=[];for(let slot=0;slot<3;slot++)loop.push(c('005C367B',256,slot),c('005C3689',0,slot),c('005C36AA',0,slot));
const virtual=c('005C3725',0),pressure=c('005C3738',0),troops=c('005C374E',0),capacity=c('005C3757',0x7fffffff);
const without=[...prefix,...loop,pressure,troops,capacity],withVirtual=[...prefix,...loop,virtual,pressure,troops,capacity];
const input={profile:'recruitment-quantity-observations-f32-v1',captures:without,savedSecurityByte:0,resolvedFacilityFactorBits:'3F800000',difficultyWord:0};
for(let security=0;security<256;security++){
 input.savedSecurityByte=security;
 for(let charm=0;charm<766;charm++){
  loop[1].eax=Math.min(charm,255);loop[4].eax=Math.min(Math.max(charm-255,0),255);loop[7].eax=Math.max(charm-510,0);
  for(const skill of [10,15]){
   loop[2].eax=skill===15?256:0;const base=expected.getUint32(offset,true),integer=expected.getUint32(offset+4,true);offset+=8;
   for(const factor of factors){input.resolvedFacilityFactorBits=factor;
    for(const superApplied of [0,1]){input.difficultyWord=superApplied?2:0;input.captures=superApplied?withVirtual:without;
     for(const pressureApplied of [0,1]){pressure.eax=pressureApplied?256:0;const want=expected.getUint32(offset,true);offset+=4;
      const got=f(input);
      assert.equal(got.supported,true);assert.equal(got.charismaSum,charm);assert.equal(got.skillParameter,skill);
      assert.equal(got.baseQuantity,base);assert.equal(got.integerQuantity,integer);
      assert.equal(got.returnedValue,want);assert.equal(got.rawEaxU32,want);assert.equal(got.capacityFallbackApplied,false);
      word.writeUInt32LE(got.rawEaxU32);hash.update(word);count++;
     }
    }
   }
  }
 }
}
assert.equal(offset,bytes.length);process.stdout.write(JSON.stringify({actualPublicApiNumericGridCases:count,resultStreamSha256:hash.digest('hex'),allPassed:true}));
""".replace('MODULE',json.dumps((ROOT/'packages/engine/src/recruitment-quantity.ts').as_uri()))
    with tempfile.TemporaryDirectory(prefix='recruitment-api-grid-') as directory:
        path=Path(directory)/'independent-results.bin';path.write_bytes(records)
        result=subprocess.run(['node','--input-type=module','-e',script.replace('RECORDS',json.dumps(str(path)))],cwd=ROOT,text=True,capture_output=True)
    assert result.returncode==0,result.stderr
    report=json.loads(result.stdout);assert report['actualPublicApiNumericGridCases']==count and report['resultStreamSha256']==expected_hash.hexdigest()
    report.update(dimensions={'savedSecurityBytes':256,'charismaSums':766,'skillParameters':2,'factorBitwords':3,'superStates':2,'pressureStates':2},
        scope='all bounded numeric grid points through actual TypeScript export; canonical three-slot decomposition, no exhaustive uint32 captures or native traces',
        expectation='separately generated fixed-width integer and exact-rational results; no product formula import')
    return report


def check_typescript_mutations(listing):
    """Execute changed TypeScript exports; expectations come from the byte machine."""
    source_path=ROOT/'packages/engine/src/recruitment-quantity.ts';original=source_path.read_text()
    mutations={
      'facility-gate-low-byte':("observe('005C3619', '0047A630') === 0","(observe('005C3619', '0047A630') & 0xff) === 0"),
      'first-slot-gate-low-byte':("observe('005C3630', '0047A630') === 0","(observe('005C3630', '0047A630') & 0xff) === 0"),
      'city-gate-low-byte':("observe('005C364B', '0047A630') === 0","(observe('005C364B', '0047A630') & 0xff) === 0"),
      'city-resolver-skipped':("observe('005C3643', '004866F0');","/* opaque resolver incorrectly skipped */"),
      'reuse-initial-first-slot-validation':("const validityEax = observe('005C367B', '0047A630', slotIndex);","observe('005C367B', '0047A630', slotIndex); const validityEax = trace[1]!.eax;"),
      'loop-validity-low-byte':('validityEax !== 0','(validityEax & 0xff) !== 0'),
      'loop-validity-signed-positive':('validityEax !== 0','(validityEax | 0) > 0'),
      'charisma-low-word':('charismaEax & 0xff','charismaEax & 0xffff'),
      'charisma-sum-overwritten':('charismaSum += charismaAl','charismaSum = charismaAl'),
      'charisma-wrong-getter-target':("observe('005C3689', '004890B0', slotIndex)","observe('005C3689', '004890A0', slotIndex)"),
      'wrong-skill-query':("slotIndex, 0x4f)","slotIndex, 0x50)"),
      'skill-low-byte':('if (skillEax !== 0)','if ((skillEax & 0xff) !== 0)'),
      'skill-forgotten-by-later-slot':('if (skillEax !== 0) skillParameter = 15;','skillParameter = skillEax !== 0 ? 15 : 10;'),
      'short-circuit-on-skill':('slots.push({slotIndex, validityEax, charismaEax, charismaAl, skillEax});','slots.push({slotIndex, validityEax, charismaEax, charismaAl, skillEax}); if (skillParameter === 15) break;'),
      'all-loop-invalid-rejected':('const baseQuantity = 1000 +',"if (validSlotCount === 0) return reject('invalid-captures'); const baseQuantity = 1000 +"),
      'base-999':('const baseQuantity = 1000 +','const baseQuantity = 999 +'),
      'security-offset-19':('(savedSecurityByte + 20)','(savedSecurityByte + 19)'),
      'first-divisor-21':('charismaSum / 20','charismaSum / 21'),
      'first-division-round':('Math.floor((savedSecurityByte + 20) * charismaSum / 20)','Math.round((savedSecurityByte + 20) * charismaSum / 20)'),
      'skill-default-15':('skillParameter: 10 | 15 = 10','skillParameter: 10 | 15 = 15'),
      'skill-hit-14':('if (skillEax !== 0) skillParameter = 15;','if (skillEax !== 0) skillParameter = 14;'),
      'skill-divisor-11':('baseQuantity * skillParameter / 10','baseQuantity * skillParameter / 11'),
      'skill-round-instead-of-truncate':('Math.floor(baseQuantity * skillParameter / 10)','Math.round(baseQuantity * skillParameter / 10)'),
      'factor-13-instead-of-binary32-12':('factor = 5033165 / 4194304','factor = 13 / 10'),
      'converter-rounds-up':('Math.trunc(integerQuantity * factor)','Math.ceil(integerQuantity * factor)'),
      'facility-before-integer-skill':('Math.trunc(integerQuantity * factor)','Math.floor(Math.trunc(baseQuantity * factor) * skillParameter / 10)'),
      'difficulty-low-byte':("difficultyWord === 2 ? observe('005C3725', 'vtable+0x48')","(difficultyWord & 0xff) === 2 ? observe('005C3725', 'vtable+0x48')"),
      'virtual-low-byte':('difficultyWord === 2 && cityVirtualEax === 0','difficultyWord === 2 && (cityVirtualEax! & 0xff) === 0'),
      'super-condition-inverted':('difficultyWord === 2 && cityVirtualEax === 0','difficultyWord === 2 && cityVirtualEax !== 0'),
      'super-double-removed':('superApplied ? convertedQuantity + convertedQuantity : convertedQuantity','superApplied ? convertedQuantity : convertedQuantity'),
      'pressure-low-byte':('const pressureApplied = pressureEax !== 0','const pressureApplied = (pressureEax & 0xff) !== 0'),
      'pressure-before-super':('Math.trunc((afterSuperU32 | 0) / 2)','Math.trunc(convertedQuantity / 2) * (superApplied ? 2 : 1)'),
      'first-add-no-u32-wrap':('const firstSumU32 = (firstTroopsEax + afterPressureU32) >>> 0','const firstSumU32 = firstTroopsEax + afterPressureU32'),
      'capacity-unsigned-comparison':('(firstCapacityEax | 0) < (firstSumU32 | 0)','firstCapacityEax < firstSumU32'),
      'capacity-equality-fallback':('(firstCapacityEax | 0) < (firstSumU32 | 0)','(firstCapacityEax | 0) <= (firstSumU32 | 0)'),
      'second-troops-reused':("secondTroopsEax = observe('005C3764', 'vtable+0x50');","observe('005C3764', 'vtable+0x50'); secondTroopsEax = firstTroopsEax;"),
      'second-capacity-reused':("secondCapacityEax = observe('005C376B', '00486BC0');","observe('005C376B', '00486BC0'); secondCapacityEax = firstCapacityEax;"),
      'second-sub-no-u32-wrap':('(secondCapacityEax - secondTroopsEax) >>> 0','secondCapacityEax - secondTroopsEax'),
      'fallback-zero-clamped':('(secondCapacityEax - secondTroopsEax) >>> 0','Math.max(0, secondCapacityEax - secondTroopsEax) >>> 0'),
      'fallback-candidate-clamped':('(secondCapacityEax - secondTroopsEax) >>> 0','Math.min(afterPressureU32, secondCapacityEax - secondTroopsEax) >>> 0'),
      'returned-signedness-lost':('returnedValue: rawEaxU32 | 0','returnedValue: rawEaxU32'),
      'opaque-eax-receipt-normalized':('trace.push(capture);','trace.push({...capture, eax: capture.eax ? 1 : 0});'),
      'supplier-receipt-confused-with-eax':("kind: 'captured-st0-f32', eax: null, st0Bits: resolvedFacilityFactorBits","kind: 'captured-st0-f32', eax: 1, st0Bits: resolvedFacilityFactorBits"),
      'converter-receipt-confused-with-input':("kind: 'derived-converter-eax', eax: convertedQuantity","kind: 'captured-eax', eax: convertedQuantity"),
      'surplus-captures-accepted':('mismatch || cursor !== captures.length','mismatch'),
    }
    # Cases are generated before inspecting/mutating implementation arithmetic.
    # Use full differential cases: cheap enough, and preserves every branch/bitwidth.
    inputs=cases();expected=[ListingMachine(listing,case).run() for case in inputs]
    baseline=run_node(inputs)
    assert all(value.get('supported') and all(value.get(k)==v for k,v in want.items()) for value,want in zip(baseline,expected))
    rejected=make_case();rejected['captures'].append({'callAddress':'005C376B','eax':0})
    inputs=inputs+[rejected];killed=[]
    with tempfile.TemporaryDirectory(prefix='recruitment-typescript-mutants-') as directory:
        module=Path(directory)/'mutant.ts'
        for name,(before,after) in mutations.items():
            assert original.count(before)==(2 if name=='surplus-captures-accepted' else 1),(name,'mutation anchor count',original.count(before))
            mutated=original.replace(before,after).replace("'../../../docs/sources/recruitment-quantity.json'",json.dumps((ROOT/'docs/sources/recruitment-quantity.json').as_uri()))
            module.write_text(mutated);actual=run_node(inputs,module)
            mismatches=[n for n,(got,want) in enumerate(zip(actual,expected)) if not got.get('supported') or any(got.get(key)!=value for key,value in want.items())]
            if actual[-1].get('supported'):mismatches.append(len(expected))
            assert mismatches,('surviving actual TypeScript mutant',name)
            index=mismatches[0]
            if index==len(expected):why=['accepted-surplus-capture']
            elif not actual[index].get('supported'):why=['rejected-valid-capture-sequence']
            else:why=[key for key,value in expected[index].items() if actual[index].get(key)!=value]
            killed.append({'name':name,'firstCounterexample':index,'killedBy':why})
    assert source_path.read_text()==original
    return {'executedTypescriptMutants':len(killed),'allKilled':True,'counterexamples':killed,
      'method':'actual temporary TypeScript modules executed through exported API; expectations from unchanged original-byte interpreter',
      'productionSourceUnchanged':True,'nativeInstructionsExecuted':False}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exhaustive',action='store_true');parser.add_argument('--output',type=Path)
    args=parser.parse_args();listing=load_listing()
    report={'level':'source-listing-reconstruction','sourceListingBytesVerified':True,
        'examples':check_examples(listing),'comparison':compare_results(listing,cases()),
        'rejections':check_rejections(listing),'apiContract':check_api_contract(),
        'stockOriginalVerified':False,'originalExecutableExecuted':False,'nativeHelpersReconstructed':False,
        'nativeAbiVerified':False,'realTraceReachabilityVerified':False,'appendedModExecuted':False}
    if args.exhaustive:
        report['integerGrid']=check_integer_grid();report['finitePrecision']=check_precision_domain();report['actualApiGrid']=check_api_grid();report['typescriptMutations']=check_typescript_mutations(listing)
    output=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output:args.output.write_text(output)
    print(output,end='')


if __name__=='__main__':main()
