#!/usr/bin/env python3
"""Independent restricted x86 interpreter of the pinned public listing's bytes.

No machine code is executed. Opaque external calls are explicitly stubbed; their
bodies, table/ID mappings and real commands remain unknown. Expected results use
only decoded original instruction bytes, never the production formula/constants.
--sweep executes the FULL 45-instruction function for both branches at every
uint16 price and compares actual public-export receipts as binary records.
The separately headed MOD has its own map and is never overlaid on the original.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PROFILE = 'production-price-resolved-v1'
MASK = 0xffffffff
RECORD = struct.Struct('<IBB')
UTF8 = '698a166f45fc1454349a5a88aeb9cd08c2e0093233ab6dc9604a20ade780f67c'
GBK = '6fbca37bcd8eaa8d1ac9c919100d3fa9ee33c49e49cc15786de06db4e86fe013'
BLOB = '928b34bd8b9f06057dd44e9639db92dacc364c85'
CODE = '8231023624aacaa163f18e3e199a34858edf8ade601ad5043ddfaaba4bc685da'
MOD = '031a517ac04ce7dbbd28b35632a2e715a69a489212d0872b81f86a70cc77d722'
sha = lambda raw: hashlib.sha256(raw).hexdigest()

def signed(value, bits=32):
    value &= (1 << bits) - 1
    return value - (1 << bits) if value & (1 << (bits - 1)) else value

def rows(text):
    return [(int(a, 16), bytes.fromhex(b), asm) for a, b, asm in re.findall(
        r'^([0-9A-F]{8}) - ((?:[0-9a-f]{2} )+)\s+- (.*)$', text, re.M)]

def load_listing(path=None):
    raw = (path or ROOT / 'docs/sources/production-price-original.txt').read_bytes()
    assert len(raw) == 4389 and sha(raw) == UTF8
    text = raw.decode('utf-8'); gbk = text.encode('gbk')
    assert len(gbk) == 4178 and sha(gbk) == GBK
    assert hashlib.sha1(b'blob 4178\0' + gbk).hexdigest() == BLOB
    assert gbk.decode('gbk').encode('utf-8') == raw
    sections = text.split('修改 - 特产城市折扣倍率自定义'); assert len(sections) == 2
    maps = []
    for part, start, end, count, size, digest in (
        (sections[0], 0x5c6350, 0x5c63c1, 45, 113, CODE),
        (sections[1], 0x5c63a1, 0x5c63af, 6, 14, MOD)):
        parsed = rows(part); cursor = start
        for addr, data, _ in parsed:
            assert cursor == addr; cursor += len(data)
        code = b''.join(data for _, data, _ in parsed)
        assert cursor == end and len(parsed) == count and len(code) == size and sha(code) == digest
        instructions = {addr: data for addr, data, _ in parsed}
        for addr, data, asm in parsed:
            if data[0] in (0xe8, 0x75, 0x76, 0xeb):
                target = addr + len(data) + int.from_bytes(data[1:], 'little', signed=True)
                assert target == int(asm.split()[1], 16)
                if data[0] in (0x75, 0x76): assert target in instructions
                if data[0] == 0xeb: assert target == 0x5c63bd  # isolated MOD exit
        maps.append(instructions)
    assert maps[0][0x5c63af] == bytes.fromhex('c1 fa 02') and 'sar dl,02' in sections[0]
    assert len(maps[0]) == 45 and maps[0][0x5c63a1] != maps[1][0x5c63a1]
    assert [addr + 5 + int.from_bytes(data[1:], 'little', signed=True)
            for addr, data in maps[0].items() if data[0] == 0xe8] == [0x47a630, 0x47a630, 0x4914a0, 0x47ec80, 0x47b3a0]
    return tuple(maps)

class OriginalMachine:
    STACK, CITY, EQUIPMENT, RETURN = 0x100000, 0x200000, 0x300000, 0xdeadc0de
    def __init__(self, instructions, price, helper, *, city_validator=1, type_validator=1,
                 mutated_table_price=None):
        assert type(price) is int and 0 <= price <= 65535
        assert type(helper) is int and 0 <= helper <= MASK
        assert all(type(x) is int and 0 <= x <= MASK for x in (city_validator, type_validator))
        self.code = instructions; self.price = price; self.helper = helper
        self.validators = {self.CITY: city_validator, self.EQUIPMENT: type_validator}
        self.r = [0, 0, 0, 0x12345678, self.STACK, 0, 0x23456789, 0x3456789a]
        self.saved = tuple(self.r[i] for i in (3, 6, 7)); self.mem = {}
        self.pc = 0x5c6350; self.cf = True; self.zf = False
        self.calls = []; self.reads = []; self.visited = []; self.result = {}
        self.mutated_table_price = mutated_table_price
        for a, v in [(self.STACK, self.RETURN), (self.STACK+4, self.CITY), (self.STACK+8, self.EQUIPMENT)]: self.store(a, v, 4)
        self.store(self.EQUIPMENT + 0x98, price, 2)
    def store(self, address, value, width):
        for i in range(width): self.mem[address+i] = (value >> (8*i)) & 255
    def memory(self, address, width):
        if address == self.EQUIPMENT + 0x98:
            assert width == 2; self.reads.append({'pc': f'{self.pc:08X}', 'width': width})
        return sum(self.mem[address+i] << (8*i) for i in range(width))
    def read(self, operand, width=4):
        kind, i = operand
        return self.r[i] & ((1 << (8*width))-1) if kind == 'r' else self.memory(i, width)
    def write(self, operand, value, width=4):
        kind, i = operand; mask = (1 << (8*width))-1
        if kind == 'r': self.r[i] = ((self.r[i] & ~mask) | (value & mask)) & MASK
        else: self.store(i, value, width)
    def modrm(self, data, offset=1):
        m = data[offset]; offset += 1; mode, reg, rm = m >> 6, (m >> 3) & 7, m & 7
        if mode == 3: return ('r', reg), ('r', rm), offset
        absolute = mode == 0 and rm == 5
        if rm == 4:
            sib = data[offset]; offset += 1; scale, index, base = sib >> 6, (sib >> 3) & 7, sib & 7
            absolute = mode == 0 and base == 5
            address = (0 if absolute else self.r[base]) + (0 if index == 4 else self.r[index] << scale)
        else: address = 0 if absolute else self.r[rm]
        if absolute or mode == 2:
            address += int.from_bytes(data[offset:offset+4], 'little', signed=True); offset += 4
        elif mode == 1: address += signed(data[offset], 8); offset += 1
        return ('r', reg), ('m', address & MASK), offset
    def call(self, target):
        arg = self.memory(self.r[4], 4)
        self.calls.append({'pc': f'{self.pc:08X}', 'target': f'{target:08X}', 'argument': arg, 'ecx': self.r[1], 'savedEsi': self.r[6]})
        if target == 0x47a630:
            assert arg in self.validators; self.r[0] = self.validators[arg]
        elif target == 0x4914a0:
            assert arg == self.EQUIPMENT and self.r[1] == 0x07201958 and self.r[6] == self.price
            self.r[0] = 0x11223344; self.r[4] += 4
        elif target == 0x47ec80:
            assert arg == 0x11223344 and self.r[6] == self.price
            self.r[0] = 0x55667788
        elif target == 0x47b3a0:
            assert arg == 0x55667788 and self.r[1] == self.CITY and self.r[6] == self.price
            self.r[0] = self.helper; self.r[4] += 4
        else: raise ValueError(f'unknown external call {target:08X}')
        # Volatile registers/flags are not a stable input contract. EBX/ESI/EDI
        # remain callee-saved. The original later TEST must overwrite CF and ZF.
        self.r[1], self.r[2], self.cf, self.zf = 0xa5a5a5a5, 0xb6b6b6b6, True, True
        if target != 0x47a630 and self.mutated_table_price is not None:
            self.store(self.EQUIPMENT+0x98, self.mutated_table_price, 2)
    def run(self, *, isolated_mod=False):
        for _ in range(64):
            pc = self.pc; data = self.code[pc]; op = data[0]; next_pc = pc + len(data); self.visited.append(pc)
            if 0x50 <= op <= 0x57:
                self.r[4] -= 4; self.store(self.r[4], self.r[op-0x50], 4)
            elif 0x58 <= op <= 0x5f:
                self.r[op-0x58] = self.memory(self.r[4], 4); self.r[4] += 4
            elif op in (0x8b, 0x8d, 0x03, 0x84, 0x85):
                reg, rm, _ = self.modrm(data)
                if op == 0x8d:
                    assert rm[0] == 'm'; self.write(reg, rm[1])
                elif op == 0x8b: self.write(reg, self.read(rm))
                elif op == 0x03: self.write(reg, self.read(reg) + self.read(rm))
                else:
                    width = 1 if op == 0x84 else 4
                    value = self.read(reg, width) & self.read(rm, width)
                    self.zf = value == 0; self.cf = False
                    if pc == 0x5c639d: self.result['specialtyResultAl'] = self.r[0] & 255
            elif op == 0x83:
                reg, rm, offset = self.modrm(data); assert reg[1] == 0
                self.write(rm, self.read(rm)+signed(data[offset], 8))
            elif op == 0x0f:
                assert data[1] in (0xb7, 0xbf); reg, rm, _ = self.modrm(data, 2)
                value = self.read(rm, 2); self.write(reg, value if data[1] == 0xb7 else signed(value, 16))
            elif op in (0x75, 0x76, 0xeb):
                taken = not self.zf if op == 0x75 else (self.cf or self.zf if op == 0x76 else True)
                if taken: next_pc += signed(data[1], 8)
                if pc == 0x5c639f: self.result['discountApplied'] = not taken
            elif op == 0xe8: self.call(next_pc+int.from_bytes(data[1:], 'little', signed=True))
            elif 0xb8 <= op <= 0xbf: self.r[op-0xb8] = int.from_bytes(data[1:], 'little')
            elif op in (0xc1, 0xc0):
                reg, rm, offset = self.modrm(data); shift = data[offset] & 31; width = 1 if op == 0xc0 else 4
                value = self.read(rm, width)
                if reg[1] == 7: self.write(rm, signed(value, width*8) >> shift, width)
                elif reg[1] == 5: self.write(rm, value >> shift, width)
                else: raise ValueError('unsupported shift')
            elif op == 0xf7:
                reg, rm, _ = self.modrm(data)
                if reg[1] == 5:
                    product = signed(self.r[0])*signed(self.read(rm)); self.r[0], self.r[2] = product & MASK, (product >> 32) & MASK
                elif reg[1] == 7:
                    dividend = signed((self.r[2] << 32)|self.r[0], 64); divisor = signed(self.read(rm)); q = abs(dividend)//abs(divisor)
                    if (dividend < 0) != (divisor < 0): q = -q
                    assert -(1 << 31) <= q < (1 << 31)
                    self.r[0], self.r[2] = q & MASK, (dividend-q*divisor) & MASK
                else: raise ValueError('unsupported multiply/divide')
            elif op == 0x6b:
                reg, rm, offset = self.modrm(data); self.write(reg, signed(self.read(rm))*signed(data[offset], 8))
            elif op == 0x99: self.r[2] = MASK if signed(self.r[0]) < 0 else 0
            elif op == 0x90: pass
            elif op == 0xc3:
                assert self.r[4] == self.STACK and self.memory(self.r[4], 4) == self.RETURN
                if not isolated_mod: assert tuple(self.r[i] for i in (3, 6, 7)) == self.saved
                self.result['returnedPrice'] = self.r[0]; return self.result
            else: raise ValueError(f'unsupported opcode {data.hex()} at {pc:08X}')
            self.pc = next_pc
        raise ValueError('instruction bound exceeded')

def production(cases):
    js = """
      import {readFileSync} from 'node:fs';
      import {calculateProductionPrice as calculate} from './packages/engine/src/index.ts';
      const cases=JSON.parse(readFileSync(0,'utf8'));
      process.stdout.write(JSON.stringify(cases.map(([p,h])=>calculate({profile:'production-price-resolved-v1',savedBasePriceWord:p,specialtyHelperEax:h}))));
    """
    out = subprocess.run(['node','--input-type=module','-e',js],cwd=ROOT,input=json.dumps(cases),text=True,capture_output=True,check=True)
    return json.loads(out.stdout)

def check_examples(original):
    gates = []
    for city, equipment, n in ((0,1,1),(1,0,2),(256,0,2),(0x80000000,0,2)):
        m = OriginalMachine(original,10,1,city_validator=city,type_validator=equipment); result=m.run()
        assert result == {'returnedPrice':0} and len(m.calls)==n and not m.reads
        gates.append({'cityValidatorEax':city,'typeValidatorEax':equipment,'callsReached':n,'returnedPrice':0,'priceReads':0})
    cases = [(p,h) for p in (0,1,2,3,4,5,9,10,11,255,256,32767,32768,65535)
             for h in (0,1,2,255,256,257,0x80000000,0x80000001,0xffffffff)]
    cases += [(13,upper|low) for upper in (0,0x100,0x12345600,0x7fffff00,0x80000000,0xffffff00) for low in range(256)]
    results = production(cases)
    for (p,h),actual in zip(cases, results):
        m=OriginalMachine(original,p,h,city_validator=256,type_validator=0x80000000); expected=m.run()
        assert actual['supported'] is True and actual['profile']==PROFILE
        assert actual['savedBasePriceWord']==p and actual['specialtyHelperEax']==h
        assert {k:actual[k] for k in expected}==expected
        assert len(m.calls)==5 and m.reads==[{'pc':'005C637A','width':2}]
    changed=OriginalMachine(original,10,1,mutated_table_price=65535); changed_result=changed.run()
    assert changed_result['returnedPrice']==8 and len(changed.reads)==1
    assert changed.memory(changed.EQUIPMENT+0x98,2)==65535
    invalid = production([[-1,0],[65536,0],[1,-1],[1,4294967296]])
    assert all(r['supported'] is False and 'returnedPrice' not in r for r in invalid)
    return {'fullEntryProductionComparisons':len(cases),'all256ALValuesAtSixUpperBitPatterns':True,
            'nativeGateCases':gates,'savedPriceSurvivesHelperTableMutation':True,'engineeringRejectionIsNotNativeZero':True}

def check_mutations(original):
    cases=[(p,h) for p in (1,2,5,10,255,32768,65535) for h in (0,1,256,257)]
    wanted={case:OriginalMachine(original,*case).run() for case in cases}
    variants=[('test-eax-instead-of-al',0x5c639d,'85 c0'),('signed-price-word',0x5c637a,'0f bf b7 98 00 00 00'),
      ('lea-times-four',0x5c63a1,'8d 0c b5 00 00 00 00'),('wrong-magic',0x5c63a8,'b8 66 66 66 66'),
      ('sar-edx-one',0x5c63af,'c1 fa 01'),('sar-dl-typo',0x5c63af,'c0 fa 02'),
      ('validator-test-al',0x5c635e,'84 c0'),('wrong-id-helper-target',0x5c6387,'e8 15 b1 ec ff')]
    killed=[]
    for name, address, raw in variants:
        code=dict(original); code[address]=bytes.fromhex(raw); caught=False
        for case in cases:
            try:
                result=OriginalMachine(code,*case,city_validator=256,type_validator=256).run()
                if result != wanted[case]: caught=True; break
            except (AssertionError,ValueError,KeyError): caught=True; break
        assert caught,name; killed.append(name)
    return killed

def check_mod(original, mod, exhaustive):
    # A separate six-instruction patch machine, with an isolated RET at its
    # external jump target. No original bytes are merged into this MOD map.
    code=dict(mod); code[0x5c63bd]=b'\xc3'
    prices=range(65536) if exhaustive else (0,1,2,5,9,10,32768,65535)
    count=0
    for p in prices:
        m=OriginalMachine(code,p,1); m.pc=0x5c63a1; m.r[6]=p
        result=m.run(isolated_mod=True)
        assert result['returnedPrice']==OriginalMachine(original,p,1).run()['returnedPrice']; count+=1
    return {'separatePatchComparisons':count,'displayed80PercentOnly':True,'overlaidOnOriginal':False}

def sweep(original):
    expected=bytearray()
    for p in range(65536):
        for h in (0,1):
            r=OriginalMachine(original,p,h).run()
            expected.extend(RECORD.pack(r['returnedPrice'],r['specialtyResultAl'],r['discountApplied']))
    js="""
      import {calculateProductionPrice as calculate} from './packages/engine/src/index.ts';
      const out=Buffer.alloc(65536*2*6);let offset=0;
      for(let p=0;p<65536;p++)for(const h of [0,1]){
        const r=calculate({profile:'production-price-resolved-v1',savedBasePriceWord:p,specialtyHelperEax:h});
        if(r.supported!==true||r.profile!=='production-price-resolved-v1'||r.savedBasePriceWord!==p||r.specialtyHelperEax!==h||typeof r.discountApplied!=='boolean'||!Object.isFrozen(r))throw Error('invalid receipt');
        out.writeUInt32LE(r.returnedPrice,offset);out[offset+4]=r.specialtyResultAl;out[offset+5]=Number(r.discountApplied);offset+=6;
      }process.stdout.write(out);
    """
    actual=subprocess.run(['node','--input-type=module','-e',js],cwd=ROOT,capture_output=True,check=True).stdout
    assert len(actual)==len(expected)==786432 and actual==expected
    return {'comparisons':131072,'priceDomain':[0,65535],'helperEax':[0,1],
      'fullOriginalEntryEveryCase':True,'binaryRecord':'little-endian uint32 returnedPrice, uint8 AL, uint8 branch',
      'expectedByteDrivenSha256':sha(expected),'actualPublicExportSha256':sha(actual),'mismatches':0}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--sweep',action='store_true');parser.add_argument('--output',type=Path);args=parser.parse_args()
    original,mod=load_listing()
    report={'scope':'public-listing restricted byte interpreter with explicit opaque external-call stubs; not stock or game execution',
      'sourceBlob':BLOB,'originalInstructionCount':45,'originalBytes':113,'modInstructionCount':6,'modBytes':14,
      'originalExecutableExecuted':False,'stockOriginalVerified':False,'examples':check_examples(original),
      'byteMutationsKilled':check_mutations(original),'modIsolation':check_mod(original,mod,args.sweep)}
    if args.sweep: report['exhaustive']=sweep(original)
    text=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output: args.output.write_text(text)
    print(text,end='')

if __name__=='__main__': main()
