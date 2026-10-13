#!/usr/bin/env python3
"""Independent, offline interpreter for the 77 fixed public-listing bytes.

No game/native instruction is executed. Default coverage exhausts the byte-pair
prefix and maximum-byte/month suffix separately, and compares a finite public
TypeScript probe set. --exhaustive additionally compares all 256**3 public API
input tuples against the independently interpreted suffix table. Neither mode
claims real-game reachability, RNG behavior or the complete caller mechanism.
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'docs/sources/captive-escape-roll-argument-original.txt'
GBK_FILE = ROOT/'docs/sources/captive-escape-roll-argument-original.gbk'
MATERIALS = ROOT/'docs/sources/captive-escape-roll-argument'
PROFILE = 'captive-escape-roll-argument-u8-v1'
CALLER_START, CALLER_END = 0x582BE0, 0x582F66
START, JOIN, END = 0x582CE4, 0x582CEA, 0x582D31
UTF8_SHA = 'c69ad1694b96a608e0d362b468e27b7e51eae6372a0f38fd15471144d3824da9'
GBK_SHA = '9da5c1a1f927b069f38940090327184942adc98af9bea93150a04f1a7580114b'
BLOB_SHA = '966493977fe3c19250fecc32d3d4f5bc23361d86'
CALLER_SHA = '1e86d9c476b08adffb5d1ca3435930b51205b68c651a357ef59a6d8923fc53fd'
CODE_SHA = '11335bc56749367435b1d5f70629b93b5c2139c063533c516833ca50e2defc83'
SUFFIX_ARGUMENT_SHA = '6964042b6151082adc78e2dcfd27de55b08c46ca06ee5d7534abc54ec26001c1'
ROW_PATTERN = r'^([0-9A-F]{8}) - ([0-9a-f]{2}(?: [0-9a-f]{2})*)\s+- (.*)$'
MASK = 0xFFFFFFFF
FIELDS = ('selectedMaximumByte','effectiveStat','effectiveMonthFactor','numerator','rollArgument')
RESULT_RECORD = struct.Struct('<IIIII')
EXAMPLES = ((0,0,0,1),(0,0,1,1),(0,0,2,1),(0,0,3,1),
    (29,29,5,1),(29,29,6,3),(29,29,7,5),(30,30,6,3),
    (255,0,4,6),(0,255,4,6),(128,127,4,3),(0,0,25,105),
    (255,255,255,108815),(255,0,128,26989))
HIGH_PATTERNS = (0,0x80000000,0xFFFFFF00,0x12345600)


def sha(raw): return hashlib.sha256(raw).hexdigest()
def canonical(value): return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
def s32(value): return value-(1<<32) if value & (1<<31) else value


@dataclass(frozen=True)
class Listing:
    rows: tuple
    code: bytes
    boundaries: frozenset
    caller: bytes


def parse_listing(text):
    """Authenticate complete original text before parsing; mnemonics never execute."""
    utf8=text.encode('utf-8')
    assert len(utf8)==17362 and sha(utf8)==UTF8_SHA,'fixed full source text changed'
    rows=tuple((int(a,16),bytes.fromhex(b),asm) for a,b,asm in re.findall(ROW_PATTERN,text,re.M))
    addressed=[line for line in text.splitlines() if re.match(r'^[0-9A-Fa-f]{8}\s*-',line)]
    assert len(rows)==len(addressed)==266,'unparsed/missing/extra instruction'
    cursor=CALLER_START
    for address,raw,_ in rows:
        assert address==cursor,'caller gap, overlap or reordered row'
        cursor+=len(raw)
    caller=b''.join(raw for _,raw,_ in rows)
    assert cursor==CALLER_END and len(caller)==902 and sha(caller)==CALLER_SHA
    leaf=tuple(r for r in rows if START<=r[0]<END)
    code=b''.join(raw for _,raw,_ in leaf)
    assert len(leaf)==26 and len(code)==77 and sha(code)==CODE_SHA
    by={a:(raw,asm) for a,raw,asm in rows}
    assert by[0x582D1C][0]==bytes.fromhex('c1fa04') and by[0x582D1C][1]=='sar dl,04'
    assert by[0x582D31][0]==bytes.fromhex('e89af4eeff')
    assert by[0x582D3B][0]==bytes.fromhex('740a') and '【修改】jmp' in by[0x582D3B][1]
    assert by[0x582CCB][0]==bytes.fromhex('80be6901000002')
    assert by[0x582CF9][0]==bytes.fromhex('0fb68669010000')
    assert not any(raw[0] in (0xE8,0x9A) or raw[0]==0xFF and (raw[1]>>3)&7 in (2,3) for _,raw,_ in leaf)
    boundaries=frozenset(a for a,_,_ in leaf)|{END}
    for a,raw,_ in leaf:
        if raw[0] in (0x76,0x7C,0x7D):
            assert a+2+int.from_bytes(raw[1:],'little',signed=True) in boundaries
    return Listing(rows,code,boundaries,caller)


def load_listing():
    utf8=SOURCE.read_bytes();gbk=GBK_FILE.read_bytes()
    assert len(gbk)==16828 and sha(gbk)==GBK_SHA
    assert hashlib.sha1(b'blob 16828\0'+gbk).hexdigest()==BLOB_SHA
    assert utf8.decode('utf-8').encode('gbk')==gbk
    assert gbk.decode('gbk').encode('utf-8')==utf8
    listing=parse_listing(utf8.decode('utf-8'))
    assert (MATERIALS/'caller.bin').read_bytes()==listing.caller
    assert (MATERIALS/'argument.bin').read_bytes()==listing.code
    expected=[{'address':f'{a:08X}','bytes':raw.hex(),'line':line}
        for line in utf8.decode().splitlines() if (match:=re.match(ROW_PATTERN,line))
        for a,raw in [(int(match[1],16),bytes.fromhex(match[2]))]]
    assert json.loads((MATERIALS/'listing.json').read_text())==expected
    return listing


def independently_disassemble(listing):
    with tempfile.TemporaryDirectory(prefix='captive-escape-objdump-') as directory:
        path=Path(directory)/'caller.bin';path.write_bytes(listing.caller)
        result=subprocess.run(['objdump','-D','-b','binary','-m','i386','-M','intel',
            '--insn-width=16',f'--adjust-vma={CALLER_START}',str(path)],capture_output=True,text=True,check=True)
    rows=[]
    for line in result.stdout.splitlines():
        match=re.match(r'^\s*([0-9a-f]+):\s*((?:[0-9a-f]{2}\s+)+)\s*(.*)$',line)
        if match: rows.append((int(match[1],16),bytes.fromhex(match[2]),match[3]))
    assert [(a,b) for a,b,_ in rows]==[(a,b) for a,b,_ in listing.rows]
    by={a:asm for a,_,asm in rows}
    assert re.fullmatch(r'sar\s+edx,0x4',by[0x582D1C])
    assert re.fullmatch(r'jbe\s+0x582cea',by[0x582CE6])
    assert re.fullmatch(r'call\s+0x4721d0',by[END])
    return {'callerInstructions':len(rows),'callerBytes':len(listing.caller),
        'allInstructionBoundariesMatch':True,'arithmeticInstructions':26,'arithmeticBytes':77,
        'typoDecodedFromBytes':'SAR EDX,4','staticDecoder':'GNU objdump','gameBytesExecuted':False}


def execute(listing,saved_bl,current_al,late_month,*,start=START,stop=END,high=0):
    """Model listed opcodes, subregisters, signed multiplication and CPU flags.

    Branches come from byte immediates. The only memory read returns late_month;
    no pointer, getter, first month gate, CALL, RNG or state machinery is present.
    """
    assert all(type(x) is int and 0<=x<=255 for x in (saved_bl,current_al,late_month))
    assert (start,stop) in ((START,JOIN),(JOIN,END),(START,END))
    r={'eax':(high&0xFFFFFF00)|current_al,'ebx':(high&0xFFFFFF00)|saved_bl,
        'ecx':high&MASK,'edx':high&MASK}
    pc=start;zf=sf=of=cf=False;pushes=[];steps=0;trace={}
    while pc!=stop:
        assert pc in listing.boundaries and START<=pc<END
        if pc==JOIN:trace['selectedMaximumByte']=r['ebx']&255
        if pc==0x582CF9:trace['effectiveStat']=r['edx']
        if pc==0x582D0D:trace['effectiveMonthFactor']=r['eax']
        if pc==0x582D15:trace['numerator']=r['ecx']
        op=listing.code[pc-START:];steps+=1;assert steps<=26
        if op.startswith(b'\x3a\xc3'):
            a,b=r['eax']&255,r['ebx']&255;v=(a-b)&255
            zf,sf,cf=v==0,bool(v&128),a<b;of=bool((a^b)&(a^v)&128);pc+=2
        elif op[0] in (0x76,0x7C,0x7D):
            cond=(cf or zf) if op[0]==0x76 else (sf!=of) if op[0]==0x7C else (sf==of)
            pc+=2+(int.from_bytes(op[1:2],'little',signed=True) if cond else 0)
        elif op.startswith(b'\x8a\xd8'):
            r['ebx']=(r['ebx']&0xFFFFFF00)|(r['eax']&255);pc+=2
        elif op.startswith(b'\x0f\xb6\xc3'):r['eax']=r['ebx']&255;pc+=3
        elif op.startswith(b'\x83\xf8'):
            a=r['eax'];b=int.from_bytes(op[2:3],'little',signed=True)&MASK;v=(a-b)&MASK
            zf,sf,cf=v==0,bool(v&0x80000000),a<b;of=bool((a^b)&(a^v)&0x80000000);pc+=3
        elif op[0] in (0xB8,0xBA):
            r['eax' if op[0]==0xB8 else 'edx']=int.from_bytes(op[1:5],'little');pc+=5
        elif op.startswith(b'\x8b\xd0'):r['edx']=r['eax'];pc+=2
        elif op.startswith(b'\x0f\xb6\x86\x69\x01\x00\x00'):r['eax']=late_month;pc+=7
        elif op.startswith(b'\x83\xe8'):
            r['eax']=(r['eax']-int.from_bytes(op[2:3],'little',signed=True))&MASK;pc+=3
        elif op.startswith(b'\x8b\xc8'):r['ecx']=r['eax'];pc+=2
        elif op.startswith(b'\x0f\xaf\xc8'):
            r['ecx']=(s32(r['ecx'])*s32(r['eax']))&MASK;pc+=3
        elif op.startswith(b'\x0f\xaf\xca'):
            r['ecx']=(s32(r['ecx'])*s32(r['edx']))&MASK;pc+=3
        elif op.startswith(b'\xf7\xe9'):
            full=s32(r['eax'])*s32(r['ecx']);r['eax'],r['edx']=full&MASK,(full>>32)&MASK;pc+=2
        elif op.startswith(b'\xc1\xfa'):r['edx']=(s32(r['edx'])>>(op[2]&31))&MASK;pc+=3
        elif op.startswith(b'\x8b\xc2'):r['eax']=r['edx'];pc+=2
        elif op.startswith(b'\xc1\xe8'):r['eax']>>=op[2]&31;pc+=3
        elif op.startswith(b'\x03\xc2'):r['eax']=(r['eax']+r['edx'])&MASK;pc+=2
        elif op[0]==0x50:pushes.append(r['eax']);pc+=1
        else:raise AssertionError(f'unsupported opcode {pc:08X}: {op[:8].hex()}')
    if stop==END:
        assert len(pushes)==1;trace['rollArgument']=pushes[0]
        assert tuple(trace)==FIELDS
    return r,pushes,trace


def verify_factorization(listing):
    pairs=[]
    for bl in range(256):
        for al in range(256):
            registers,pushes,trace=execute(listing,bl,al,0,stop=JOIN,high=0xABCDEF00)
            selected=registers['ebx']&255
            assert selected==(bl if bl>=al else al) and not pushes and not trace
            pairs.append(selected)
    suffixes=[];digest=hashlib.sha256();receipts_digest=hashlib.sha256()
    for selected in range(256):
        for month in range(256):
            _,pushes,trace=execute(listing,selected,0,month,start=JOIN,high=0xA5C30000)
            stat=30 if selected<30 else selected;factor=month-2 if month>=3 else 1
            numerator=factor*factor*stat
            assert tuple(trace.values())==(selected,stat,factor,numerator,max(1,numerator//150))
            row=RESULT_RECORD.pack(*trace.values());suffixes.append(row)
            digest.update(bytes((selected,month))+pushes[0].to_bytes(4,'little'))
            receipts_digest.update(bytes((selected,month))+row)
    assert digest.hexdigest()==SUFFIX_ARGUMENT_SHA
    full_count=0
    for bl,al,month,arg in EXAMPLES:
        for high in HIGH_PATTERNS:
            _,pushes,trace=execute(listing,bl,al,month,high=high)
            assert pushes==[arg] and RESULT_RECORD.pack(*trace.values())==suffixes[pairs[bl*256+al]*256+month]
            full_count+=1
    # Exact integer identity validates the simplification, not native execution.
    multiplier=0x1B4E81B5;maximum=253*253*255
    assert 150*multiplier==(1<<36)+14 and 14*maximum<(1<<36) and maximum<0x80000000
    return pairs,suffixes,{'attributeBytePairs':len(pairs),'maximumByteLateMonthSuffixes':len(suffixes),
        'scalarTuplesCoveredByComposition':256**3,'everyScalarTupleExecutedAsFullByteSegment':False,
        'compositionProof':'At 00582CEA BL is the only live prefix result. MOVZX overwrites EAX, EDX/ECX are defined before use, and CMP overwrites flags. The 65536 prefix and 65536 suffix results therefore compose across 256^3 scalar tuples.',
        'fullBytePathsWithDeadHighBits':full_count,'suffixRollArgumentStreamSha256':digest.hexdigest(),
        'suffixReceiptStreamSha256':receipts_digest.hexdigest(),'maximumNumerator':maximum,'maximumRollArgument':108815,
        'realGameReachabilityProven':False}


def comparison_cases():
    for bl in range(256):
        for al in range(256):yield bl,al,(17*bl+31*al)&255
    for selected in range(256):
        for month in range(256):yield selected,0,month
    for bl,al,month,_ in EXAMPLES:
        # Four repeats expose unstable or history-dependent results; there are
        # still only 14 fixed example tuples, not 56 distinct scalar examples.
        for _ in HIGH_PATTERNS:yield bl,al,month


def compare_api(listing,pairs,suffixes,*,exhaustive=False):
    cases=list(comparison_cases());expected=bytearray()
    for bl,al,month in cases:expected.extend(suffixes[pairs[bl*256+al]*256+month])
    result=subprocess.run(['node',str(ROOT/'scripts/oracle_captive_escape_roll_argument_driver.mjs')],
        cwd=ROOT,input=bytes(x for triple in cases for x in triple),capture_output=True,check=True)
    assert len(result.stdout)==len(expected),('TypeScript output size',len(result.stdout),len(expected))
    if result.stdout!=expected:
        for i,case in enumerate(cases):
            lo=i*RESULT_RECORD.size;hi=lo+RESULT_RECORD.size
            assert result.stdout[lo:hi]==expected[lo:hi],('public API mismatch',case,
                RESULT_RECORD.unpack(result.stdout[lo:hi]),RESULT_RECORD.unpack(expected[lo:hi]))
    report={'actualPublicTypeScriptComparisons':len(cases),'defaultAllFullTuplesEnumerated':False,
        'defaultProbeDescription':'65536 attribute pairs at deterministic varied late months, 65536 maximum-byte/month pairs, and four repetitions of 14 fixed cases',
        'receiptFieldsCompared':list(FIELDS),'resultStreamSha256':sha(result.stdout),
        'publicEntry':'packages/engine/src/index.ts','gameNativeHelpersExecuted':False}
    if exhaustive:
        # The expected oracle table was interpreted from bytes, then the complete
        # tuple stream is composed from byte-prefix results without algebra reuse.
        dig=hashlib.sha256()
        for bl in range(256):
            block=b''.join(b''.join(suffixes[pairs[bl*256+al]*256:pairs[bl*256+al]*256+256]) for al in range(256))
            dig.update(block)
        result=subprocess.run(['node',str(ROOT/'scripts/oracle_captive_escape_roll_argument_driver.mjs'),'--exhaustive'],
            cwd=ROOT,capture_output=True,text=True,check=True)
        actual=json.loads(result.stdout)
        assert actual=={'comparisons':256**3,'sha256':dig.hexdigest()}
        report.update(exhaustivePublicApiComparisons=256**3,exhaustivePublicApiReceiptStreamSha256=dig.hexdigest(),
            everyPublicApiTupleComparedViaStreamHash=True,everyTupleFullByteSegmentExecuted=False)
    return report


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path)
    parser.add_argument('--exhaustive',action='store_true',help='also compare all 256^3 public API tuples to composed independent byte-oracle receipt stream')
    args=parser.parse_args()
    listing=load_listing();source=independently_disassemble(listing)
    pairs,suffixes,coverage=verify_factorization(listing)
    report={'profile':PROFILE,'kind':'product-api-versus-independent-listed-byte-interpreter',
        'mode':'all-public-api-tuples' if args.exhaustive else 'factorized-byte-domain-and-bounded-public-api-probes',
        'source':source,'coverage':coverage,'comparisons':compare_api(listing,pairs,suffixes,exhaustive=args.exhaustive),
        'stockOriginalVerified':False,'originalExecutableExecuted':False,'completeEscapeMechanism':False}
    output=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output:args.output.write_text(output)
    print(output,end='')


if __name__=='__main__':main()
