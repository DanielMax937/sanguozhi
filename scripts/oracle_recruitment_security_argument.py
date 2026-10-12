#!/usr/bin/env python3
"""Independent listing-byte oracle for the captured recruitment security argument.

Only the nine instructions at [005C3C11,005C3C26) are interpreted. The entire
316-instruction original listing is authenticated and independently disassembled;
no original executable, opaque helper, writer CALL or appended MOD is executed.
--exhaustive means all 766 denominators with finite signed boundary/central and
reproducible uint32 probes. It emphatically does not enumerate 766 * 2**32 inputs.
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass
import hashlib
import itertools
import json
from pathlib import Path
import re
import struct
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'docs/sources/recruitment-security-argument-original.txt'
PROFILE = 'recruitment-security-argument-v1'
ENTRY, END = 0x5C3A50, 0x5C3E0B
LEAF_ENTRY, LEAF_END = 0x5C3C11, 0x5C3C26
MASK = 0xFFFFFFFF
UTF8_SHA = '6ef16de7adcece461dad2225bdb8aa84bdac73b2326c0214131e8861c2a071b2'
GBK_SHA = 'c057b8abab1bd4f58ad902a2e0266f09ec11fc08d8406061885535324c2ada71'
BLOB_SHA = '3e1767ccafd7d217881119d142e8f4b02cdf88ce'
CODE_SHA = '69c8186fa9fd7807cd4a0747bcbb5ee6b84a6ee39c8a2735900ded05c3921f2e'
ASM_SHA = 'db9afbeaee339db1bcfa3a4ead4e85a6ef86aaf7a9a9258aa3f5a5198b7fbf06'
LEAF_SHA = '6b4afd8e5857db8a562d0d127212f0b28fca91d9e9a9f5d8fe251dc65094bb89'
ARITHMETIC_SHA = '8a537f7ccca746304043e2a71bba02596ea52bd8d968e6d835b4f6f28056d698'
MOD_MARKER = '修改 - 有“法治”特技则征兵不掉治安'
MOD_REGIONS = (
    (0x5C3C1D,0x5C3C22,1,5,'08f196ab1d21d765c68085273c91dfe4cbd447f0d0e6e026f29f195ec5fbd89a'),
    (0x9107CA,0x9107DB,4,17,'eb767d4d28851724ebe792e90d9ca5c4c8fe5bf6564ba5ccdc2fe9e1aa08a017'),
    (0x9107B0,0x9107CA,11,26,'7a91d3f6ee306a93a13e34bcd90170a1f4e6212347517c8750a83bb5b51e405e'))
ROW_PATTERN = r'^([0-9A-F]{8}) - ((?:[0-9a-f]{2} )+)\s+- (.*)$'
RESULT_FIELDS = ('signedTroopReturn','divisor','quotientSigned','remainderSigned','securityDeltaSigned','securityDeltaU32')
INPUT_RECORD = struct.Struct('<II')
RESULT_RECORD = struct.Struct('<iiiiiI')


def sha(raw): return hashlib.sha256(raw).hexdigest()
def signed(value, bits=32):
    value &= (1 << bits)-1
    return value-(1 << bits) if value & (1 << (bits-1)) else value


@dataclass(frozen=True)
class Instruction:
    op: str
    args: tuple
    next_pc: int
    raw: bytes


@dataclass(frozen=True)
class Listing:
    original_rows: tuple
    mod_rows: tuple
    code: dict[int,Instruction]
    direct_calls: tuple
    branches: tuple


def decode(address, raw):
    """Decode actual opcode, ModRM, SIB, displacement and immediate bytes.

    This restricted decoder cannot execute CALL or branch instructions and never
    uses a source mnemonic to decide the operation or operand.
    """
    cursor=0
    def imm(size, sign=False):
        nonlocal cursor
        if cursor+size>len(raw): raise ValueError('truncated instruction')
        value=int.from_bytes(raw[cursor:cursor+size],'little',signed=sign)
        cursor+=size
        return value
    def modrm():
        byte=imm(1);mode=byte>>6;reg=('r',(byte>>3)&7);base=byte&7
        if mode==3: return reg,('r',base)
        index,scale,disp=None,1,0
        if base==4:
            sib=imm(1);base=sib&7;index=(sib>>3)&7;scale=1<<(sib>>6)
            if index==4:index=None
        if mode==0 and base==5:base=None;disp=imm(4,True)
        elif mode==1:disp=imm(1,True)
        elif mode==2:disp=imm(4,True)
        return reg,('m',base,index,scale,disp)
    opcode=imm(1)
    if opcode in (0x8B,0x8D):
        reg,rm=modrm();op,args=('mov' if opcode==0x8B else 'lea'),(reg,rm)
    elif 0xB8<=opcode<=0xBF:op,args='mov',(('r',opcode-0xB8),('i',imm(4)))
    elif opcode==0x99:op,args='cdq',()
    elif opcode==0xF7:
        extension,rm=modrm()
        if extension[1] not in (3,7):raise ValueError('unsupported F7 operation')
        op,args=('neg' if extension[1]==3 else 'idiv'),(rm,)
    elif 0x50<=opcode<=0x57:op,args='push',(('r',opcode-0x50),)
    else:raise ValueError(f'unsupported leaf opcode {opcode:02X} at {address:08X}')
    if cursor!=len(raw):raise ValueError('trailing instruction bytes')
    return Instruction(op,args,address+cursor,raw)


def parse_rows(text):
    rows=tuple((int(a,16),bytes.fromhex(b),asm) for a,b,asm in re.findall(ROW_PATTERN,text,re.M))
    addressed=[line for line in text.splitlines() if re.match(r'^[0-9A-Fa-f]{8}\s*-',line)]
    assert len(rows)==len(addressed),'unparsed or malformed addressed source line'
    return rows


def assert_region(rows,start,end,count,size,digest):
    assert len(rows)==count,'instruction count changed'
    cursor=start
    for address,raw,_ in rows:
        assert address==cursor,'instruction gap, duplicate, reorder or MOD overlay'
        cursor+=len(raw)
    body=b''.join(raw for _,raw,_ in rows)
    assert cursor==end and len(body)==size and sha(body)==digest,'byte identity changed'
    return body


def relative_target(address,raw):
    offset=2 if raw[0]==0x0F else 1
    return address+len(raw)+int.from_bytes(raw[offset:],'little',signed=True)


def decode_leaf_rows(rows):
    leaf=assert_region(rows,LEAF_ENTRY,LEAF_END,9,21,LEAF_SHA)
    assert sha(leaf[:19])==ARITHMETIC_SHA
    return {address:decode(address,raw) for address,raw,_ in rows}


def parse_listing(text):
    assert text.count(MOD_MARKER)==1,'missing or duplicated MOD boundary'
    original,mod=text.split(MOD_MARKER)
    assert original.count('='*149)==1,'original/MOD separator changed'
    rows,mod_rows=parse_rows(original),parse_rows(mod)
    body=assert_region(rows,ENTRY,END,316,955,CODE_SHA)
    mnemonic='\n'.join(f'{a:08X} '+asm.split('  ')[0].strip() for a,_,asm in rows)
    assert sha(mnemonic.encode())==ASM_SHA,'original mnemonic transcription changed'
    addresses={a for a,_,_ in rows};calls=[];branches=[];indirect=[]
    for address,raw,asm in rows+mod_rows:
        branch=raw[0] in (0xEB,0xE9) or 0x70<=raw[0]<=0x7F or raw[0]==0x0F and 0x80<=raw[1]<=0x8F
        if raw[0]==0xE8 or branch:
            target=relative_target(address,raw)
            assert target==int(asm.split()[1],16),'byte target differs from listing'
            if (address,raw,asm) in rows:
                if branch:assert target in addresses;branches.append((address,target))
                else:calls.append((address,target))
        if (address,raw,asm) in rows and raw[0]==0xFF and (raw[1]>>3)&7==2:indirect.append(address)
    assert len(calls)==51 and indirect==[0x5C3A80] and len(branches)==16
    assert len(mod_rows)==16 and sum(len(raw) for _,raw,_ in mod_rows)==48
    consumed=[]
    for lo,hi,count,size,digest in MOD_REGIONS:
        region=tuple(row for row in mod_rows if lo<=row[0]<hi)
        assert_region(region,lo,hi,count,size,digest);consumed.extend(region)
    assert tuple(consumed)==mod_rows,'MOD regions reordered, overlapped or concatenated'
    leaf_rows=tuple(row for row in rows if LEAF_ENTRY<=row[0]<LEAF_END)
    code=decode_leaf_rows(leaf_rows)
    by={a:raw for a,raw,_ in rows}
    assert by[LEAF_END]==bytes.fromhex('e84502efff') and relative_target(LEAF_END,by[LEAF_END])==0x4B3E70
    assert by[0x5C3C1D]==bytes.fromhex('b95c899907')
    assert mod_rows[0][1]==bytes.fromhex('e9a8cb3400')
    assert tuple(i.op for i in code.values())==('mov','lea','mov','cdq','idiv','mov','neg','push','push')
    return Listing(rows,mod_rows,code,tuple(calls),tuple(branches))


def load_listing(path=SOURCE):
    raw=path.read_bytes()
    assert len(raw)==23221 and sha(raw)==UTF8_SHA,'full UTF-8 source changed'
    text=raw.decode('utf-8');gbk=text.encode('gbk')
    assert len(gbk)==22263 and sha(gbk)==GBK_SHA,'full GBK source changed'
    assert hashlib.sha1(b'blob 22263\0'+gbk).hexdigest()==BLOB_SHA
    assert gbk.decode('gbk').encode('utf-8')==raw,'nonreversible transcoding'
    return parse_listing(text)


def independently_disassemble(listing):
    """Check every full-caller and separated MOD instruction with GNU objdump."""
    decoded_original=None;count=0
    with tempfile.TemporaryDirectory(prefix='recruitment-security-disassembly-') as directory:
        regions=[listing.original_rows]
        regions.extend(tuple(row for row in listing.mod_rows if lo<=row[0]<hi) for lo,hi,_,_,_ in MOD_REGIONS)
        for n,rows in enumerate(regions):
            path=Path(directory)/f'{n}.bin';path.write_bytes(b''.join(raw for _,raw,_ in rows))
            result=subprocess.run(['objdump','-D','-b','binary','-m','i386','-M','intel','--insn-width=16',
                f'--adjust-vma={rows[0][0]}',str(path)],capture_output=True,text=True,check=True)
            decoded=[]
            for line in result.stdout.splitlines():
                match=re.match(r'^\s+([0-9a-f]+):\s+((?:[0-9a-f]{2} )+)\s+(.+)$',line)
                if match:decoded.append((int(match[1],16),bytes.fromhex(match[2]),match[3]))
            assert [(a,b) for a,b,_ in decoded]==[(a,b) for a,b,_ in rows],'independent decoder boundary mismatch'
            assert all('(bad)' not in asm for _,_,asm in decoded)
            if n==0:decoded_original={a:asm for a,_,asm in decoded}
            count+=len(decoded)
    assert decoded_original[0x5C3C60].split()==['sar','edx,0x5']
    assert decoded_original[0x5C3C1B].split()==['idiv','ecx']
    assert decoded_original[LEAF_END].split()==['call','0x4b3e70']
    return {'independentlyDecodedInstructions':count,'originalInstructions':316,'originalBytes':955,
        'modInstructions':16,'modBytes':48,'separateModRegions':3,'directCallSites':51,'indirectCallSites':1,
        'directBranches':16,'decoder':'GNU objdump','modOverlaidOnOriginal':False}


def validate_case(case):
    assert type(case) is dict and set(case)=={'profile','savedCharmSum','savedTroopReturnU32'}
    assert type(case['profile']) is str and case['profile']==PROFILE
    assert type(case['savedCharmSum']) is int and 0<=case['savedCharmSum']<=765
    assert type(case['savedTroopReturnU32']) is int and 0<=case['savedTroopReturnU32']<=MASK


def make_case(charm,word):
    return {'profile':PROFILE,'savedCharmSum':charm,'savedTroopReturnU32':word}


class LeafMachine:
    """Synthetic registers and stack only, beginning at the explicit scalar cut.

    Synthetic EBX/ESP are test sentinels, not discovered SAN11 object addresses.
    No caller helper, memory pointer or ABI reconstruction is implied.
    """
    STACK=0x30000000
    CITY=0x12345678
    def __init__(self,listing,case,*,poison=0xA5B6C7D8,city=CITY):
        validate_case(case)
        self.code,self.case=listing.code,case
        self.pc=LEAF_ENTRY;self.r=[poison&MASK]*8
        self.r[3],self.r[4],self.r[6]=city,self.STACK,case['savedTroopReturnU32']
        self.mem={self.STACK+0x10:case['savedCharmSum']}
        self.steps=[];self.reads=[];self.pushes=[];self.divisor=self.quotient=self.remainder=None
    def address(self,operand):
        _,base,index,scale,disp=operand
        return ((0 if base is None else self.r[base])+(0 if index is None else self.r[index]*scale)+disp)&MASK
    def read(self,operand):
        kind=operand[0]
        if kind=='r':return self.r[operand[1]]
        if kind=='i':return operand[1]
        address=self.address(operand);self.reads.append(address)
        return self.mem[address]
    def write(self,operand,value):
        if operand[0]!='r':raise ValueError('unsupported memory write')
        self.r[operand[1]]=value&MASK
    def run(self):
        for _ in range(9):
            instruction=self.code[self.pc];op,args=instruction.op,instruction.args
            self.steps.append(self.pc)
            if op=='mov':self.write(args[0],self.read(args[1]))
            elif op=='lea':self.write(args[0],self.address(args[1]))
            elif op=='cdq':self.r[2]=MASK if self.r[0]&0x80000000 else 0
            elif op=='idiv':
                numerator=signed((self.r[2]<<32)|self.r[0],64);denominator=signed(self.read(args[0]))
                if denominator==0:raise ZeroDivisionError('IDIV')
                magnitude,residue=divmod(abs(numerator),abs(denominator))
                quotient=-magnitude if (numerator<0)!=(denominator<0) else magnitude
                if not -2**31<=quotient<2**31:raise OverflowError('IDIV')
                remainder=-residue if numerator<0 else residue
                self.r[0],self.r[2]=quotient&MASK,remainder&MASK
                self.divisor,self.quotient,self.remainder=denominator,quotient,remainder
            elif op=='neg':self.write(args[0],-self.read(args[0]))
            elif op=='push':
                value=self.read(args[0]);self.r[4]=(self.r[4]-4)&MASK
                self.mem[self.r[4]]=value;self.pushes.append(value)
            else:raise ValueError(f'unsupported operation {op}')
            self.pc=instruction.next_pc
        assert self.pc==LEAF_END,'oracle crossed writer-call boundary'
        assert self.steps==list(self.code) and self.reads==[self.STACK+0x10]
        assert self.r[1]==0x0799895C and self.r[4]==self.STACK-8
        assert self.pushes==[self.r[0],self.r[3]]
        return dict(zip(RESULT_FIELDS,(signed(self.case['savedTroopReturnU32']),self.divisor,
            self.quotient,self.remainder,signed(self.r[0]),self.r[0])))


def closed_form(case):
    """A second mathematical check: Euclidean floor and negative correction."""
    n=signed(case['savedTroopReturnU32']);d=case['savedCharmSum']+100
    q=n//d
    if n<0 and n%d:q+=1
    return dict(zip(RESULT_FIELDS,(n,d,q,n-q*d,-q,(-q)&MASK)))


def cases(exhaustive=False):
    """Deterministic finite corpus; input numbers are emitted in stable order."""
    for charm in range(766):
        d=charm+100
        values=set(range(-2*d-1,2*d+2)) if exhaustive else {0,-1,1,-d-1,-d,-d+1,d-1,d,d+1,-2*d-1,-2*d,2*d,2*d+1}
        values.update((-2**31,-2**31+1,-65536,-10000,10000,65536,2**31-2,2**31-1))
        for q in (3,7,100,65535,(2**31-1)//d,2**31//d):
            for sign in (-1,1):
                for r in (-1,0,1,d-1):
                    n=sign*(q*d+r)
                    if -2**31<=n<2**31:values.add(n)
        seed=(0x9E3779B9*(charm+1))&MASK
        for _ in range(64 if exhaustive else 4):
            seed=(1664525*seed+1013904223)&MASK;values.add(signed(seed))
        for n in sorted(values):yield make_case(charm,n&MASK)


NODE_BATCH = r"""
import fs from 'node:fs';
import {calculateRecruitmentSecurityArgument as calculate} from './packages/engine/src/index.ts';
const profile='recruitment-security-argument-v1';
const fields=['signedTroopReturn','divisor','quotientSigned','remainderSigned','securityDeltaSigned','securityDeltaU32'];
const keys=['supported','profile','savedCharmSum','savedTroopReturnU32',...fields,'evidence'].sort().join(',');
function readExact(size) {
  const b=Buffer.alloc(size);let at=0;
  while(at<size){const n=fs.readSync(0,b,at,size-at,null);if(n===0)throw Error('truncated input frame');at+=n;}
  return b;
}
for(;;){
  const count=readExact(4).readUInt32LE();if(count===0)break;
  if(count>1024)throw Error('oversized frame');
  const input=readExact(count*8),out=Buffer.alloc(4+count*24);out.writeUInt32LE(count);
  for(let i=0;i<count;i++){
    const c=input.readUInt32LE(i*8),u=input.readUInt32LE(i*8+4);
    const r=calculate({profile,savedCharmSum:c,savedTroopReturnU32:u});
    if(!r||r.supported!==true||r.profile!==profile||r.savedCharmSum!==c||r.savedTroopReturnU32!==u||!Object.isFrozen(r)||Object.keys(r).sort().join(',')!==keys)throw Error('bad success receipt');
    if(!r.evidence||!Object.isFrozen(r.evidence)||r.evidence.level!=='source-listing-reconstruction'||r.evidence.stockOriginalVerified!==false||r.evidence.originalExecutableExecuted!==false)throw Error('bad evidence');
    for(let j=0;j<fields.length;j++){
      const value=r[fields[j]];
      if(!Number.isSafeInteger(value)||Object.is(value,-0))throw Error('noncanonical integer receipt');
      if(j===5)out.writeUInt32LE(value,4+i*24+j*4);else out.writeInt32LE(value,4+i*24+j*4);
    }
  }
  let at=0;while(at<out.length)at+=fs.writeSync(1,out,at,out.length-at);
}
"""


def compare_results(listing,inputs):
    """Stream bounded binary batches to the real public TypeScript export.

    Python computes every expected result from the decoded instructions. Node
    never computes an expected arithmetic formula, and Python never imports TS.
    """
    actual_digest=hashlib.sha256();expected_digest=hashlib.sha256();input_digest=hashlib.sha256()
    count=0;denominators=set();iterator=iter(inputs)
    with tempfile.TemporaryFile() as errors:
        process=subprocess.Popen(['node','--input-type=module','-e',NODE_BATCH],cwd=ROOT,
            stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=errors)
        def read_exact(size):
            chunks=[];remaining=size
            while remaining:
                data=process.stdout.read(remaining)
                if not data:
                    errors.seek(0)
                    raise AssertionError('Node batch process ended early: '+errors.read().decode(errors='replace'))
                chunks.append(data);remaining-=len(data)
            return b''.join(chunks)
        try:
            while True:
                batch=list(itertools.islice(iterator,1024))
                if not batch:break
                wire=b''.join(INPUT_RECORD.pack(case['savedCharmSum'],case['savedTroopReturnU32']) for case in batch)
                process.stdin.write(struct.pack('<I',len(batch))+wire);process.stdin.flush()
                assert struct.unpack('<I',read_exact(4))[0]==len(batch),'response frame length mismatch'
                actual=read_exact(len(batch)*RESULT_RECORD.size);expected=bytearray()
                for index,case in enumerate(batch):
                    want=LeafMachine(listing,case).run();assert want==closed_form(case)
                    n,d,q,r,delta,u=(want[key] for key in RESULT_FIELDS)
                    assert n==q*d+r and abs(r)<d and (r==0 or (r<0)==(n<0))
                    assert -21474836<=q<=21474836 and -21474836<=delta<=21474836
                    record=RESULT_RECORD.pack(n,d,q,r,delta,u)
                    got=actual[index*24:(index+1)*24]
                    assert got==record,(count+index,case,dict(zip(RESULT_FIELDS,RESULT_RECORD.unpack(got))),want)
                    expected.extend(record);denominators.add(d)
                actual_digest.update(actual);expected_digest.update(expected);input_digest.update(wire);count+=len(batch)
            process.stdin.write(struct.pack('<I',0));process.stdin.close()
            assert process.stdout.read()==b'','unexpected trailing batch bytes'
            assert process.wait(timeout=10)==0
        finally:
            if process.poll() is None:process.kill();process.wait()
            process.stdout.close()
            if not process.stdin.closed:process.stdin.close()
    assert count>0 and actual_digest.digest()==expected_digest.digest()
    return {'byteInterpreterComparisons':count,'actualPublicTypeScriptComparisons':count,'denominatorCount':len(denominators),
        'expectedByteDrivenSha256':expected_digest.hexdigest(),'actualPublicExportSha256':actual_digest.hexdigest(),
        'inputPairsSha256':input_digest.hexdigest(),'resultRecord':'little-endian int32 N,D,Q,R,delta; uint32 delta',
        'allNineLeafInstructionsPerCase':True,'writerCallExecuted':False,'mismatches':0}


def check_examples(listing):
    examples=[('ordinary positive',300,4200,-10),('ordinary positive second',300,6300,-15),
        ('negative truncation',0,-101,1),('signed minus one',0,-1,0),('minimum signed dividend',0,-2**31,21474836),
        ('asymmetric negative endpoint',28,-2**31,16777216),('asymmetric positive endpoint',28,2**31-1,-16777215),
        ('below largest divisor',765,864,0),('at largest divisor',765,865,-1),('canonical zero',0,0,0),
        ('saved writer return rather than quantity',300,200,0),('early charm differs from later quantity charm',299,399,-1)]
    out=[]
    for label,c,n,delta in examples:
        case=make_case(c,n&MASK);machine=LeafMachine(listing,case);r=machine.run()
        assert r['securityDeltaSigned']==delta and r==closed_form(case)
        for poison in (0,1,MASK,0x80000000):
            changed=LeafMachine(listing,case,poison=poison,city=poison)
            assert changed.run()==r and changed.pushes==[delta&MASK,poison]
        out.append({'label':label,**case,**r})
    return out


def check_byte_profile_guards(listing):
    raw=b''.join(i.raw for i in listing.code.values());rejected=0
    for offset in range(len(raw)):
        for bit in range(8):
            changed=bytearray(raw);changed[offset]^=1<<bit
            cursor=0;mutant=[]
            for address,instruction in listing.code.items():
                end=cursor+len(instruction.raw)
                mutant.append((address,bytes(changed[cursor:end]),''));cursor=end
            decode_leaf_rows(tuple((a,i.raw,'') for a,i in listing.code.items()))
            try:decode_leaf_rows(tuple(mutant))
            except AssertionError:rejected+=1
            else:raise AssertionError(('modified leaf accepted',offset,bit))
    # These are exact-source byte-profile guards, not TS behavior mutant kills.
    return {'singleBitLeafProfilesRejected':rejected,'leafBytePositions':21,'typescriptBehaviorMutants':False}


def require_corpus_coverage(report,exhaustive):
    assert report['denominatorCount']==766,'missing supported denominator in corpus'
    assert report['actualPublicTypeScriptComparisons']==(1564879 if exhaustive else 48199),'finite acceptance corpus changed'


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exhaustive',action='store_true',help='all denominators and finite dense signed neighborhoods; not all uint32 inputs')
    parser.add_argument('--output',type=Path);args=parser.parse_args()
    listing=load_listing()
    comparisons=compare_results(listing,cases(args.exhaustive))
    require_corpus_coverage(comparisons,args.exhaustive)
    report={'profile':PROFILE,'level':'source-listing-reconstruction','sourceBlob':BLOB_SHA,
        'scope':'pure captured-scalar security-writer argument; original listing reconstruction only',
        'stockOriginalVerified':False,'originalExecutableExecuted':False,'nativeAbiVerified':False,
        'source':independently_disassemble(listing),'examples':check_examples(listing),
        'byteProfileGuards':check_byte_profile_guards(listing),
        'comparisons':comparisons,
        'coverage':{'mode':'exhaustive-denominator-finite-probes' if args.exhaustive else 'bounded-default',
            'all766Denominators':True,'allUint32Inputs':False,'completeGameCommand':False,
            'description':'finite signed central/boundary neighborhoods, int32 endpoints and deterministic LCG uint32 samples'},
        'fullDomainArgument':'For every C=0..765, D=C+100=100..865; CDQ makes dividend s32(U). Signed IDIV quotient fits [-21474836,21474836]; NEG cannot overflow. No denominator zero or IDIV trap in this supported scalar domain.'}
    text=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output:args.output.write_text(text)
    print(text,end='')


if __name__=='__main__':main()
