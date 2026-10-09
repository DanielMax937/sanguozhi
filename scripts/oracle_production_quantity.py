#!/usr/bin/env python3
"""Independent, byte-driven restricted interpreter for production quantity.

Never executes native machine code or imports the engine's formula/constants.
All 88 original instructions are decoded from the authenticated public listing.
Only the five direct external callees and the city virtual call are stubbed;
these observations do not recover their bodies, a stock executable, or a command.
The two separately headed MODs are authenticated and executed only in isolated
maps. --sweep compares 786432 full original-entry runs against the real export.
--precision proves the bounded FIMUL/conversion domain with exact Fractions at
all three x87 precision controls and four rounding directions (80676 cases).
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PROFILE = 'production-quantity-resolved-f32-v1'
MASK = 0xffffffff
ENTRY, END = 0x005c63d0, 0x005c64ce
SOURCE_BLOB = 'e8c0c22e68e8557b202088290d52101abb02ca3a'
SOURCE_UTF8_SHA256 = '65be4259fef8c741dee5d3df32a3f8fd6b00214427536daa624c0e6c8da00c53'
SOURCE_GBK_SHA256 = 'cadf90aa55d43b69f407620abebccf6fb4307ed7dcb5511f434779f38b722285'
NATIVE_SHA256 = '083337e2420a74a923349256cc7add7e6c665ccccad6f3406ea2f343d3bbceb1'
FACTORS = ('3F800000', '3F99999A', '3FC00000')
PRECISIONS = (24, 53, 64)
ROUNDINGS = ('nearest-even', 'down', 'up', 'toward-zero')
RECORD = struct.Struct('<I')


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def signed(value, bits=32):
    value &= (1 << bits) - 1
    return value - (1 << bits) if value & (1 << (bits-1)) else value


def f32_fraction(bits):
    """Decode the supplied binary32 word exactly, without a decimal approximation."""
    word = int(bits, 16)
    sign, exponent, mantissa = word >> 31, (word >> 23) & 255, word & 0x7fffff
    if exponent == 255:
        raise ValueError('non-finite binary32 outside oracle')
    significand = mantissa if exponent == 0 else mantissa | (1 << 23)
    power = -149 if exponent == 0 else exponent - 150
    value = Fraction(significand << max(power, 0), 1 << max(-power, 0))
    return -value if sign else value


def round_binary(value, precision, direction):
    """Exact normal finite x87 significand rounding; no host float arithmetic."""
    assert precision in PRECISIONS and direction in ROUNDINGS
    if not value:
        return Fraction(0)
    negative = value < 0
    magnitude = abs(value)
    exponent = magnitude.numerator.bit_length() - magnitude.denominator.bit_length()
    power_of_two = Fraction(1 << max(exponent, 0), 1 << max(-exponent, 0))
    if magnitude < power_of_two:
        exponent -= 1
    # These bounded operands/products are normal in all precision controls.
    assert -16382 <= exponent < 16384
    shift = exponent - precision + 1
    unit = Fraction(1 << max(shift, 0), 1 << max(-shift, 0))
    scaled = magnitude / unit
    q, remainder = divmod(scaled.numerator, scaled.denominator)
    if remainder:
        if direction == 'nearest-even':
            twice = remainder * 2
            q += twice > scaled.denominator or (twice == scaled.denominator and q % 2 == 1)
        elif direction == 'up':
            q += not negative
        elif direction == 'down':
            q += negative
    rounded = q * unit
    return -rounded if negative else rounded


@dataclass(frozen=True)
class Instruction:
    op: str
    operands: tuple
    next_pc: int
    raw: bytes


def decode(pc, data):
    """Restricted x86 decoder; listing mnemonics never select runtime semantics."""
    op = data[0]
    cursor = 1

    def modrm():
        nonlocal cursor
        byte = data[cursor]
        cursor += 1
        mode, reg, rm = byte >> 6, (byte >> 3) & 7, byte & 7
        if mode == 3:
            return ('r', reg), ('r', rm)
        base, index, scale, displacement = rm, None, 1, 0
        if rm == 4:
            sib = data[cursor]
            cursor += 1
            base, index, scale = sib & 7, (sib >> 3) & 7, 1 << (sib >> 6)
            if index == 4:
                index = None
        if mode == 0 and base == 5:
            base = None
            displacement = int.from_bytes(data[cursor:cursor+4], 'little')
            cursor += 4
        elif mode == 1:
            displacement = signed(data[cursor], 8)
            cursor += 1
        elif mode == 2:
            displacement = int.from_bytes(data[cursor:cursor+4], 'little', signed=True)
            cursor += 4
        return ('r', reg), ('m', base, index, scale, displacement)

    def immediate(width, is_signed=False):
        nonlocal cursor
        result = int.from_bytes(data[cursor:cursor+width], 'little', signed=is_signed)
        cursor += width
        return result

    args = ()
    if 0x50 <= op <= 0x57:
        name, args = 'push', (('r', op-0x50),)
    elif 0x58 <= op <= 0x5f:
        name, args = 'pop', (('r', op-0x58),)
    elif 0x40 <= op <= 0x47:
        name, args = 'inc', (('r', op-0x40),)
    elif 0xb8 <= op <= 0xbf:
        name, args = 'mov', (('r', op-0xb8), ('i', immediate(4)))
    elif op in (0x8b, 0x89, 0x8d, 0x03, 0x33, 0x31, 0x3b, 0x85, 0x84):
        reg, rm = modrm()
        name = {0x8b:'mov', 0x89:'mov', 0x8d:'lea', 0x03:'add', 0x33:'xor',
                0x31:'xor', 0x3b:'cmp', 0x85:'test', 0x84:'test8'}[op]
        args = (rm, reg) if op in (0x89, 0x31) else (reg, rm)
    elif op in (0x83, 0x81):
        reg, rm = modrm()
        name = {0:'add', 5:'sub', 7:'cmp'}[reg[1]]
        args = (rm, ('i', immediate(1 if op == 0x83 else 4, True)))
    elif op == 0xc7:
        reg, rm = modrm()
        assert reg[1] == 0
        name, args = 'mov', (rm, ('i', immediate(4)))
    elif op in (0x74, 0x75, 0x7c, 0x7d, 0x7e, 0x7f, 0xeb):
        name = {0x74:'je', 0x75:'jne', 0x7c:'jl', 0x7d:'jge', 0x7e:'jle', 0x7f:'jg', 0xeb:'jmp'}[op]
        delta = immediate(1, True)
        args = (pc+cursor+delta,)
    elif op in (0xe8, 0xe9):
        name = 'call' if op == 0xe8 else 'jmp'
        delta = immediate(4, True)
        args = (pc+cursor+delta,)
    elif op == 0x0f:
        second = immediate(1)
        if second in (0xb6, 0xaf):
            name = 'movzx8' if second == 0xb6 else 'imul2'
            args = modrm()
        elif second == 0x8f:
            delta = immediate(4, True)
            name, args = 'jg', (pc+cursor+delta,)
        else:
            raise ValueError(f'unsupported 0F opcode {second:02X}')
    elif op == 0xff:
        reg, rm = modrm()
        assert reg[1] == 2
        name, args = 'call-indirect', (rm,)
    elif op == 0xda:
        reg, rm = modrm()
        assert reg[1] == 1
        name, args = 'fimul32', (rm,)
    elif op in (0x69, 0x6b):
        reg, rm = modrm()
        name, args = 'imul3', (reg, rm, immediate(4 if op == 0x69 else 1, True))
    elif op == 0xf7:
        reg, rm = modrm()
        assert reg[1] == 7
        name, args = 'idiv', (rm,)
    elif op in (0x99, 0x90, 0xc3):
        name = {0x99:'cdq', 0x90:'nop', 0xc3:'ret'}[op]
    else:
        raise ValueError(f'unsupported opcode at {pc:08X}: {data.hex()}')
    assert cursor == len(data), (hex(pc), data.hex(), cursor)
    return Instruction(name, args, pc+cursor, data)


@dataclass(frozen=True)
class Listing:
    original: dict
    mod1_patch: dict
    mod1_trampoline: dict
    mod2_patch: dict
    mod2_trampoline: dict
    mod2_data: bytes


def load_listing(path=None):
    raw = (path or ROOT/'docs/sources/production-quantity-original.txt').read_bytes()
    assert len(raw) == 10336 and sha(raw) == SOURCE_UTF8_SHA256
    text = raw.decode('utf-8')
    gbk = text.encode('gbk')
    assert len(gbk) == 9650 and sha(gbk) == SOURCE_GBK_SHA256
    assert hashlib.sha1(b'blob 9650\0'+gbk).hexdigest() == SOURCE_BLOB
    assert gbk.decode('gbk').encode('utf-8') == raw
    original_text, mods = text.split('修改1 - 能吏繁殖效果自定义')
    mod1_text, mod2_text = mods.split('修改2 - 特产/非特产城市产量自定义')
    pattern = re.compile(r'^([0-9A-F]{8}) - ((?:[0-9a-f]{2} )+)\s+- (.*)$', re.M)
    maps = []
    specs = (
        (original_text, ENTRY, END, 88, 254, NATIVE_SHA256),
        (mod1_text, 0x5c648a, 0x5c6491, 3, 7, '6125f5f7f6c9c2ba63eb342048fe99e88c24c29acd9c4a2c7281a260d4d6b106'),
        (mod1_text, 0x8a95f8, 0x8a960f, 6, 23, 'b903c3a2e5461297bdfc3bb32924aeca36dcbbe257777186eedbff4424c139ab'),
        (mod2_text, 0x5c64a7, 0x5c64ac, 1, 5, '73c515cccd0de0ba26d8fabd800aa94cf5e7f009a0edb8deaf6bad13e47b6a6b'),
        (mod2_text, 0x8a9d48, 0x8a9d87, 20, 63, '729d96341ea81278f73ebb3d2b57b49bf7447189640155332e6f3280abbae09b'),
    )
    for section, start, end, count, size, digest in specs:
        rows = [(int(a,16), bytes.fromhex(b), asm) for a,b,asm in pattern.findall(section)
                if start <= int(a,16) < end]
        cursor, code, instructions = start, bytearray(), {}
        for address, data, asm in rows:
            assert address == cursor
            code.extend(data)
            cursor += len(data)
            # The MOD1 listing packs two NOP instructions into one display row.
            chunks = [b'\x90', b'\x90'] if data == b'\x90\x90' else [data]
            for chunk in chunks:
                instruction = decode(address, chunk)
                instructions[address] = instruction
                address += len(chunk)
                if instruction.op in ('call','jmp','je','jne','jl','jge','jle','jg'):
                    assert instruction.operands[0] == int(asm.split()[1],16)
        assert cursor == end and len(code) == size and len(instructions) == count and sha(code) == digest
        for instruction in instructions.values():
            if instruction.op in ('je','jne','jl','jge','jle','jg'):
                assert instruction.operands[0] in instructions
        maps.append(instructions)
    original = maps[0]
    direct_calls = [i.operands[0] for i in original.values() if i.op == 'call']
    assert direct_calls == [0x47a630,0x489090,0x4890f0,0x5c5f90,0x707a74]
    assert sum(i.op in ('jmp','je','jne','jl','jge','jle','jg') for i in original.values()) == 15
    data_row = re.search(r'^008A8170 - ((?:[0-9a-f]{2} ){16})', mod2_text, re.M)
    assert data_row is not None
    mod_data = bytes.fromhex(data_row[1])
    assert len(mod_data) == 16 and sha(mod_data) == '2fece05476ea75674604c5d22ec05d755837b18fb0ddedea70b6a17d70bc276f'
    assert original[0x5c648a].raw != maps[1][0x5c648a].raw
    assert original[0x5c64a7].raw != maps[3][0x5c64a7].raw
    return Listing(*maps, mod_data)


class OriginalMachine:
    """Small x86 model with checked stack/calling boundaries and exact ST(0)."""
    STACK, CITY, SLOTS = 0x100000, 0x200000, 0x300000
    VTABLE, VIRTUAL, RETURN = 0x400000, 0x500000, 0xdeadc0de
    DIFFICULTY, MOD_DATA = 0x07201978, 0x008a8170

    def __init__(self, instructions, native_type, slots=None, factor='3F800000', difficulty=0,
                 virtual=1, *, validators=None, precision=64, rounding='nearest-even',
                 trace=True, register_seed=0, poison_mod=False):
        assert type(native_type) is int and -(1 << 31) <= native_type < (1 << 31)
        slots = [None]*3 if slots is None else slots
        assert len(slots) == 3
        self.code, self.native_type = instructions, native_type
        self.slots, self.factor, self.difficulty, self.virtual = slots, factor, difficulty, virtual
        self.precision, self.rounding, self.trace = precision, rounding, trace
        self.r = [(0x193b5d7f * (i+1) ^ register_seed) & MASK for i in range(8)]
        self.r[4] = self.STACK
        self.saved = tuple(self.r[i] for i in (3,5,6,7))
        self.mem, self.people = {}, {}
        self.pc, self.zf, self.sf, self.of, self.cf = ENTRY, False, True, True, True
        self.st0 = None
        self.calls, self.reads, self.visited, self.observations = [], [], set(), {}
        self.call_count, self.steps, self.returned = 0, 0, None
        self.validators = [int(slot is not None) for slot in slots] if validators is None else validators
        assert len(self.validators) == 3
        for address, value in ((self.STACK,self.RETURN),(self.STACK+4,self.CITY),
                               (self.STACK+8,self.SLOTS),(self.STACK+12,native_type),
                               (self.CITY,self.VTABLE),(self.VTABLE+0x48,self.VIRTUAL),
                               (self.DIFFICULTY,difficulty)):
            self.store(address,value)
        for index, slot in enumerate(slots):
            pointer = 0x600000+index*0x100
            self.people[pointer] = index
            self.store(self.SLOTS+index*4,pointer)
            if slot is not None:
                assert all(type(v) is int and 0 <= v <= MASK for v in slot)
        # These are unrelated MOD-only values; original memory accesses are audited.
        for offset in range(0x84,0x8c,4):
            self.store(self.CITY+offset, MASK if poison_mod else 0)
        for offset in range(0,16,4):
            self.store(self.MOD_DATA+offset, MASK if poison_mod else 0)

    def store(self, address, value, width=4):
        address &= MASK
        assert width in (1,4)
        if width == 4:
            assert address % 4 == 0
            self.mem[address] = value & MASK
        else:
            aligned, shift = address & ~3, (address & 3)*8
            self.mem[aligned] = (self.mem.get(aligned,0) & ~(255 << shift)) | ((value & 255) << shift)

    def memory(self, address, width=4):
        address &= MASK
        assert width in (1,4)
        if self.trace:
            self.reads.append((self.pc,address,width))
        if width == 4:
            assert address % 4 == 0
            return self.mem[address]
        return (self.mem[address & ~3] >> ((address & 3)*8)) & 255

    def address(self, operand):
        _, base, index, scale, displacement = operand
        return ((0 if base is None else self.r[base]) +
                (0 if index is None else self.r[index]*scale) + displacement) & MASK

    def read(self, operand, width=4):
        if operand[0] == 'r':
            return self.r[operand[1]] & (255 if width == 1 else MASK)
        if operand[0] == 'i':
            return operand[1] & MASK
        return self.memory(self.address(operand),width)

    def write(self, operand, value):
        if operand[0] == 'r':
            self.r[operand[1]] = value & MASK
        else:
            self.store(self.address(operand),value)

    def push(self, value):
        self.r[4] = (self.r[4]-4) & MASK
        self.store(self.r[4],value)

    def pop(self):
        value = self.memory(self.r[4])
        self.r[4] = (self.r[4]+4) & MASK
        return value

    def arithmetic_flags(self, left, right, result, subtraction=False):
        value = result & MASK
        self.zf, self.sf = value == 0, bool(value & 0x80000000)
        self.cf = left < right if subtraction else result > MASK
        self.of = bool(((left ^ right) if subtraction else ~(left ^ right)) & (left ^ value) & 0x80000000)

    def call(self, target, return_pc):
        """Atomic opaque stub with actual CALL/RET stack effect, volatile clobbers."""
        saved = tuple(self.r[i] for i in (3,5,6,7))
        caller_sp, ecx = self.r[4], self.r[1]
        self.push(return_pc)
        arg = lambda index: self.memory(self.r[4]+4+4*index)
        cleanup, event, value = 0, {'target':f'{target:08X}','pc':f'{self.pc:08X}'}, 0xa1b2c3d4
        if target == 0x47a630:
            pointer = arg(0)
            index = self.people[pointer]
            assert self.r[3] == index
            value = self.validators[index]
            event.update(slot=index, argument=pointer, eax=value)
        elif target == 0x489090:
            index = self.people[ecx]
            assert self.validators[index] != 0 and self.slots[index] is not None
            value = self.slots[index][0]
            event.update(slot=index, ecx=ecx, eax=value)
        elif target == 0x4890f0:
            index = self.people[ecx]
            assert self.validators[index] != 0 and self.slots[index] is not None
            query = signed(arg(0))
            expected_query = -1 if self.native_type == 0 else 80 if self.native_type <= 3 else 81
            assert query == expected_query
            value, cleanup = self.slots[index][1], 4
            event.update(slot=index, ecx=ecx, query=query, eax=value)
        elif target == 0x5c5f90:
            assert arg(0) == self.CITY and signed(arg(1)) == self.native_type
            assert self.st0 is None
            self.st0 = f32_fraction(self.factor)
            event.update(city=arg(0), nativeType=signed(arg(1)), factorBits=self.factor)
        elif target == 0x707a74:
            assert self.st0 is not None
            value = int(self.st0)
            assert -(1 << 31) <= value < (1 << 31), 'conversion outside bounded stub'
            self.st0 = None
            event.update(convertedSigned=value)
            if self.trace:
                self.observations['convertedSigned'] = value
        elif target == self.VIRTUAL:
            assert ecx == self.CITY and self.difficulty == 2
            assert self.st0 is None
            value = self.virtual
            event.update(ecx=ecx, eax=value, savedQuantityEsi=self.r[6])
        else:
            raise ValueError(f'unknown external call {target:08X}')
        assert self.pop() == return_pc
        self.r[4] = (self.r[4]+cleanup) & MASK
        assert self.r[4] == caller_sp+cleanup
        assert tuple(self.r[i] for i in (3,5,6,7)) == saved
        self.r[0], self.r[1], self.r[2] = value & MASK, 0xf1e2d3c4, 0xb5a69788
        self.zf, self.sf, self.of, self.cf = True, True, False, True
        self.call_count += 1
        if self.trace:
            self.calls.append(event)

    def run(self, *, stop_at=None):
        for _ in range(256):
            if self.pc == stop_at:
                return self.r[0]
            instruction = self.code[self.pc]
            op, args, next_pc = instruction.op, instruction.operands, instruction.next_pc
            self.steps += 1
            if self.trace:
                self.visited.add(self.pc)
                if self.pc == 0x5c6474:
                    self.observations.update(sumAl=self.r[5], maxAlSigned=signed(self.r[7]))
                elif self.pc == 0x5c6484:
                    self.observations['baseSigned'] = signed(self.r[0])
                elif self.pc == 0x5c6491:
                    self.observations['afterSkillSigned'] = signed(self.memory(self.r[4]+0x10))
            if op == 'mov':
                self.write(args[0],self.read(args[1]))
            elif op == 'movzx8':
                self.write(args[0],self.read(args[1],1))
            elif op == 'lea':
                assert args[1][0] == 'm'
                self.write(args[0],self.address(args[1]))
            elif op == 'push':
                self.push(self.read(args[0]))
            elif op == 'pop':
                self.write(args[0],self.pop())
            elif op in ('add','sub','cmp','xor','test','test8','inc'):
                left = self.read(args[0],1 if op == 'test8' else 4)
                right = 1 if op == 'inc' else self.read(args[1],1 if op == 'test8' else 4)
                if op in ('xor','test','test8'):
                    value = left ^ right if op == 'xor' else left & right
                    self.zf, self.sf = value == 0, bool(value & (128 if op == 'test8' else 0x80000000))
                    self.of, self.cf = False, False
                else:
                    subtraction = op in ('sub','cmp')
                    value = left-right if subtraction else left+right
                    previous_cf = self.cf
                    self.arithmetic_flags(left,right,value,subtraction)
                    if op == 'inc':
                        self.cf = previous_cf
                if op not in ('cmp','test','test8'):
                    self.write(args[0],value)
            elif op in ('jmp','je','jne','jl','jge','jle','jg'):
                taken = {'jmp':True, 'je':self.zf, 'jne':not self.zf, 'jl':self.sf != self.of,
                         'jge':self.sf == self.of, 'jle':self.zf or self.sf != self.of,
                         'jg':not self.zf and self.sf == self.of}[op]
                if taken:
                    next_pc = args[0]
            elif op == 'call':
                self.call(args[0],next_pc)
            elif op == 'call-indirect':
                self.call(self.read(args[0]),next_pc)
            elif op == 'fimul32':
                assert self.st0 is not None
                self.st0 = round_binary(self.st0 * signed(self.read(args[0])),self.precision,self.rounding)
            elif op in ('imul2','imul3'):
                value = signed(self.read(args[0]))*signed(self.read(args[1])) if op == 'imul2' else signed(self.read(args[1]))*args[2]
                self.write(args[0],value)
                self.of = self.cf = not (-(1 << 31) <= value < (1 << 31))
            elif op == 'cdq':
                self.r[2] = MASK if signed(self.r[0]) < 0 else 0
            elif op == 'idiv':
                dividend, divisor = signed((self.r[2] << 32)|self.r[0],64), signed(self.read(args[0]))
                quotient = abs(dividend)//abs(divisor)
                if (dividend < 0) != (divisor < 0):
                    quotient = -quotient
                assert -(1 << 31) <= quotient < (1 << 31)
                self.r[0], self.r[2] = quotient & MASK, (dividend-quotient*divisor) & MASK
            elif op == 'nop':
                pass
            elif op == 'ret':
                assert self.r[4] == self.STACK
                assert tuple(self.r[i] for i in (3,5,6,7)) == self.saved
                assert self.pop() == self.RETURN and self.r[4] == self.STACK+4
                assert self.st0 is None
                self.returned = self.r[0]
                return self.returned
            else:
                raise ValueError(f'unsupported decoded operation {op}')
            self.pc = next_pc
        raise ValueError('instruction bound exceeded')


def api_input(native_type=1, slots=None, factor='3F800000', difficulty=0, virtual=1):
    result = {'profile':PROFILE,'nativeEquipmentType':native_type}
    if 0 <= native_type <= 4:
        result.update(slots=[None if slot is None else {'intelligenceGetterEax':slot[0],'skillHelperEax':slot[1]}
                             for slot in (slots if slots is not None else [(0,0),None,None])],
                      resolvedFacilityFactorBits=factor,difficultyWord=difficulty)
        if difficulty == 2:
            result['cityVirtualEax'] = virtual
    return result


def production(cases):
    js = """
      import {readFileSync} from 'node:fs';
      import {calculateProductionQuantity as calculate} from './packages/engine/src/index.ts';
      const results=JSON.parse(readFileSync(0,'utf8')).map(input=>{
        const receipt=calculate(input);
        if(!Object.isFrozen(receipt))throw Error('receipt is not frozen');
        return receipt;
      });process.stdout.write(JSON.stringify(results));
    """
    run = subprocess.run(['node','--input-type=module','-e',js],cwd=ROOT,input=json.dumps(cases),
                         text=True,capture_output=True,check=True)
    return json.loads(run.stdout)


def check_examples(listing):
    original = listing.original
    fixtures = []
    # Native gates are signed, precede slot/difficulty reads, and issue no calls.
    for native_type in (-(1 << 31),-1,12,(1 << 31)-1,5,6,7,8,9,10,11):
        fixtures.append((native_type,None,'3F800000',0,1))
    fixtures.extend([
        (1,[None,(100,0),None],'3F800000',0,1),
        (1,[(0,0),None,None],'3F800000',0,1),
        (1,[(1,0),(1,0),None],'3FC00000',0,1),
        (1,[(1,1),(1,0),None],'3FC00000',0,1),
        (1,[(1,0),(1,0),None],'3FC00000',2,0),
        (1,[(100,1),(100,0),(100,0)],'3FC00000',2,0),
        (1,[(255,1),(255,0),(255,0)],'3FC00000',2,0),
    ])
    # All seven nonempty validity masks, including late valid slots.
    for mask in range(1,8):
        for native_type in range(5):
            fixtures.append((native_type,[(17+23*i,256 if i == 0 else 0) if mask & (1 << i) else None
                                         for i in range(3)],'3F99999A',2,0))
    # Getter uses AL; skill and virtual predicates consume complete EAX.
    for upper in (0,0x100,0x12345600,0x7fffff00,0x80000000,0xffffff00):
        for low in range(256):
            fixtures.append((1,[(upper|low,0),None,None],'3FC00000',0,1))
    for helper in (0,1,255,256,257,0x80000000,MASK):
        for virtual in (0,1,256,0x80000000,MASK):
            fixtures.append((0,[(257,helper),(255,helper),None],'3FC00000',2,virtual))
    for difficulty in (0,1,2,3,MASK):
        fixtures.append((4,[(128,256),(255,0),(1,0)],'3F99999A',difficulty,0))
    actual = production([api_input(*case) for case in fixtures])
    assert isinstance(actual,list) and len(actual) == len(fixtures)
    coverage, max_steps = set(), 0
    for case, receipt in zip(fixtures,actual):
        machine = OriginalMachine(original,*case,validators=None if case[1] is None else
                                  [0 if slot is None else 0x80000100 for slot in case[1]],register_seed=MASK)
        wanted = machine.run()
        assert receipt['supported'] is True and receipt['profile'] == PROFILE
        assert receipt['returnedQuantity'] == wanted, (case,receipt,wanted)
        coverage.update(machine.visited)
        max_steps = max(max_steps,machine.steps)
        native_type, slots, _, difficulty, _ = case
        if not 0 <= native_type <= 4:
            assert machine.call_count == 0
            assert all(machine.STACK-24 <= addr <= machine.STACK+12 for _,addr,_ in machine.reads)
            assert wanted == (1 if 5 <= native_type <= 11 else 0)
            continue
        expected_calls = []
        for index, slot in enumerate(slots):
            expected_calls.append(('0047A630',index))
            if slot is not None:
                expected_calls += [('00489090',index),('004890F0',index)]
        expected_calls += [('005C5F90',None),('00707A74',None)]
        if difficulty == 2:
            expected_calls.append((f'{machine.VIRTUAL:08X}',None))
        assert [(call['target'],call.get('slot')) for call in machine.calls] == expected_calls
        assert [addr for _,addr,_ in machine.reads if addr == machine.DIFFICULTY] == [machine.DIFFICULTY]
        assert sum(addr == machine.VTABLE+0x48 for _,addr,_ in machine.reads) == (difficulty == 2)
    assert coverage == set(original), sorted(set(original)-coverage)
    # Pins refute rounding/capping errors without borrowing production constants.
    assert [actual[i]['returnedQuantity'] for i in range(11,18)] == [2000,1000,1522,3045,3044,18000,36600]
    sentinel = OriginalMachine(original,1,[None,None,None])
    assert sentinel.run() == 0x800003e8
    assert sentinel.observations['maxAlSigned'] == -(1 << 31)
    assert sentinel.observations['baseSigned'] == -2147482648
    assert sentinel.observations['convertedSigned'] == -2147482648
    rejected = [api_input(1,[None,None,None]), api_input(1,[(0,0),None,None],'3F999999')]
    for factor in ('3f800000','3F800001','7F800000','7FC00000','BF800000',1.2):
        rejected.append(api_input(1,[(0,0),None,None],factor))
    for field, value in (('difficultyWord',-1),('difficultyWord',MASK+1),('cityVirtualEax',0),
                         ('facilityLevel',2),('politics',100),('fame',100),('specialty',True)):
        invalid = api_input()
        invalid[field] = value
        rejected.append(invalid)
    for native_type in (-1,5,12):
        invalid = api_input(native_type)
        invalid['slots'] = []
        rejected.append(invalid)
    invalid = api_input(difficulty=2)
    del invalid['cityVirtualEax']
    rejected.append(invalid)
    rejected_actual = production(rejected)
    assert isinstance(rejected_actual,list) and len(rejected_actual) == len(rejected)
    assert all(r['supported'] is False and 'returnedQuantity' not in r for r in rejected_actual)
    # Repeated skill success does not stop later getters or multiply repeatedly.
    permutations = [[(255,0),(1,256),None],[(1,256),None,(255,0)],[None,(255,0),(1,256)]]
    values = [OriginalMachine(original,1,slots).run() for slots in permutations]
    assert len(set(values)) == 1
    repeated = OriginalMachine(original,1,[(255,256),(1,256),None]).run()
    assert repeated == values[0]
    return {'publicExportComparisons':len(fixtures),'rejectedInputs':len(rejected),
            'originalInstructionsReached':len(coverage),'maximumInstructionsPerFixture':max_steps,
            'all256GetterAlAtSixUpperPatterns':True,'allSevenNonemptySlotMasksAndFiveTypes':True,
            'callOrderArgumentsAndCleanupChecked':True,'calleeSavedRegistersAndStackRestored':True,
            'volatileRegisterAndFlagClobbers':True,'allInvalidNativeSentinel':sentinel.observations,
            'allInvalidNativeReturnedEax':f'{sentinel.returned:08X}',
            'allInvalidProbe':{'factorBits':'3F800000','precisionBits':64,'rounding':'nearest-even'},
            'engineeringRejectionIsNotNativeZero':True,'skillDoesNotShortCircuitOrStack':True}


def check_mutations(original):
    cases = [(t,slots,f,d,v) for t in (0,1,4,5,-1,12)
             for slots in ([(257,256),(255,0),None],[None,(100,0),None],[(1,0),(1,0),None],[(1,0),None,(255,256)])
             for f,d,v in (('3FC00000',0,1),('3FC00000',2,0),('3F99999A',2,256))]
    expected = [OriginalMachine(original,*case).run() for case in cases]
    variants = [
        ('getter-full-eax',0x5c644b,'8b c0'),
        ('validator-test-al',0x5c6440,'84 c0'),
        ('skill-test-al',0x5c6462,'84 c0'),
        ('virtual-test-al',0x5c64be,'84 c0'),
        ('max-initial-zero',0x5c6427,'bf 00 00 00 00'),
        ('initial-sum-one',0x5c6425,'bd 01 00 00 00'),
        ('base-times-four',0x5c6481,'8d 04 85 00 00 00 00'),
        ('base-constant-202',0x5c647a,'8d 84 2f ca 00 00 00'),
        ('skill-times-three',0x5c648a,'8d 14 40'),
        ('wrong-skill-query',0x5c6402,'c7 44 24 04 51 00 00 00'),
        ('politics-getter-target',0x5c6446,'e8 55 2c ec ff'),
        ('difficulty-three',0x5c64ae,'83 3d 78 19 20 07 03'),
        ('virtual-branch-inverted',0x5c64c0,'74 02'),
        ('loop-two-slots',0x5c646f,'83 fb 02'),
        ('signed-type-upper-ten',0x5c63de,'83 f8 0a'),
    ]
    # Include sentinel and type 11 to kill changes invisible on the supported arithmetic domain.
    cases.extend([(1,[None,None,None],'3F800000',0,1),(11,None,'3F800000',0,1)])
    expected.extend([OriginalMachine(original,*case).run() for case in cases[-2:]])
    killed = []
    for name, address, raw in variants:
        mutant = dict(original)
        changed = decode(address,bytes.fromhex(raw))
        # Keep the next listing boundary for a width-changing semantic mutation.
        mutant[address] = Instruction(changed.op,changed.operands,original[address].next_pc,changed.raw)
        caught = False
        for case, wanted in zip(cases,expected):
            try:
                machine = OriginalMachine(mutant,*case,validators=None if case[1] is None else
                                          [0 if slot is None else 256 for slot in case[1]])
                if machine.run() != wanted:
                    caught = True
                    break
            except (AssertionError,ValueError,KeyError,ZeroDivisionError):
                caught = True
                break
        assert caught, name
        killed.append(name)
    return killed


def check_mod(listing):
    """Never overlay patch bytes: each trampoline starts from a captured boundary."""
    original = listing.original
    examples = []
    for base_slots in ([(0,1),None,None],[(1,1),(1,0),None],[(255,1)]*3):
        main = OriginalMachine(original,1,base_slots)
        main.run()
        isolated = OriginalMachine(listing.mod1_trampoline,1,base_slots)
        isolated.pc = 0x8a95f8
        isolated.r[0] = main.observations['baseSigned'] & MASK
        isolated.run(stop_at=0x5c6491)
        assert signed(isolated.memory(isolated.STACK+0x10)) == main.observations['afterSkillSigned']
        examples.append(main.observations['baseSigned'])
    mod2_returns = []
    for specialty in (0,1):
        isolated = OriginalMachine(listing.mod2_trampoline,4,[(0,0),None,None])
        isolated.pc = 0x8a9d48
        isolated.r[7] = isolated.CITY
        isolated.store(isolated.STACK+0x24,4)
        isolated.store(isolated.CITY+4+0x85,specialty,1)
        for offset in range(0,16,4):
            isolated.store(isolated.MOD_DATA+offset,int.from_bytes(listing.mod2_data[offset:offset+4],'little'))
        isolated.st0 = Fraction(1000)
        mod2_returns.append(isolated.run(stop_at=0x5c64ac))
    assert mod2_returns == [200,800]
    unchanged = []
    for poison in (False,True):
        main = OriginalMachine(original,4,[(0,0),None,None],poison_mod=poison)
        unchanged.append(main.run())
        assert not any(main.MOD_DATA <= addr < main.MOD_DATA+16 or main.CITY+0x84 <= addr < main.CITY+0x8c
                       for _,addr,_ in main.reads)
    assert unchanged == [1000,1000]
    return {'originalMapOverlaid':False,'separateMod1InstructionCount':9,'separateMod1Bytes':30,
            'separateMod2InstructionCount':21,'separateMod2Bytes':68,'separateMod2DataBytes':16,
            'mod1Displayed200PercentMatchesSupportedExamples':examples,
            'mod2CavalryNonSpecialtyAndSpecialty':mod2_returns,'originalWithModMemoryPoisoned':unchanged,
            'originalReadsNoModDataOrSpecialtyBytes':True}


def precision_proof():
    digest = hashlib.sha256()
    count = 0
    for n in range(1000,12201,5):
        for bits in FACTORS:
            product = n*f32_fraction(bits)
            wanted = int(product)
            # Analytic integer envelopes: the 1.2 binary32 overshoot cannot cross
            # the next integer here, even with upward p24 FIMUL rounding.
            rational_reference = n if bits == '3F800000' else 6*n//5 if bits == '3F99999A' else 3*n//2
            assert wanted == rational_reference
            for precision in PRECISIONS:
                for direction in ROUNDINGS:
                    rounded = round_binary(product,precision,direction)
                    result = int(rounded)
                    assert result == wanted, (n,bits,precision,direction,rounded)
                    digest.update(f'{n},{bits},{precision},{direction},{rounded.numerator}/{rounded.denominator},{result}\n'.encode())
                    count += 1
    assert count == 80676
    # Small sign and halfway controls protect the rounding helper itself.
    assert round_binary(Fraction((1 << 24)+1,1 << 24),24,'nearest-even') == 1
    assert round_binary(Fraction((1 << 24)+3,1 << 24),24,'nearest-even') == Fraction((1 << 23)+2,1 << 23)
    assert round_binary(Fraction(-((1 << 24)+1),1 << 24),24,'up') == -1
    assert round_binary(Fraction(-((1 << 24)+1),1 << 24),24,'down') < -1
    return {'cases':count,'integerOperands':{'min':1000,'max':12200,'step':5,'count':2241},
            'factorBits':list(FACTORS),'precisionBits':list(PRECISIONS),'roundingModes':list(ROUNDINGS),
            'recordFormat':'n,bits,precision,direction,roundedNumerator/roundedDenominator,truncation\\n',
            'sha256':digest.hexdigest(),'mismatches':0,'exactRationalArithmetic':True,
            'boundedNormalFiniteProductsOnly':True,'doesNotProveExceptionMasksOrStockFactorWords':True}


def sweep(original):
    expected = bytearray()
    pairs, comparisons = 0, 0
    for maximum in range(256):
        for total in range(maximum,3*maximum+1):
            intelligence = [maximum,min(maximum,total-maximum),max(0,total-2*maximum)]
            assert max(intelligence) == maximum and sum(intelligence) == total
            pairs += 1
            for skill in (0,1):
                slots = [(value,skill if index == 0 else 0) for index,value in enumerate(intelligence)]
                for factor in FACTORS:
                    for super_ai in (0,1):
                        machine = OriginalMachine(original,1,slots,factor,2 if super_ai else 0,0,trace=False)
                        expected.extend(RECORD.pack(machine.run()))
                        assert machine.call_count == (12 if super_ai else 11)
                        comparisons += 1
    assert pairs == 65536 and comparisons == 786432
    js = """
      import {calculateProductionQuantity as calculate} from './packages/engine/src/index.ts';
      const out=Buffer.alloc(786432*4); let offset=0;
      for(let maximum=0;maximum<256;maximum++)for(let total=maximum;total<=3*maximum;total++){
        const intelligence=[maximum,Math.min(maximum,total-maximum),Math.max(0,total-2*maximum)];
        for(const skill of [0,1])for(const factor of ['3F800000','3F99999A','3FC00000'])for(const superAi of [0,1]){
          const input={profile:'production-quantity-resolved-f32-v1',nativeEquipmentType:1,
            slots:intelligence.map((value,index)=>({intelligenceGetterEax:value,skillHelperEax:index===0?skill:0})),
            resolvedFacilityFactorBits:factor,difficultyWord:superAi?2:0};
          if(superAi)input.cityVirtualEax=0;
          const receipt=calculate(input);
          if(receipt.supported!==true||receipt.profile!==input.profile||!Object.isFrozen(receipt)||
             !Number.isInteger(receipt.returnedQuantity))throw Error('invalid receipt');
          out.writeUInt32LE(receipt.returnedQuantity,offset);offset+=4;
        }
      }if(offset!==out.length)throw Error('record count');process.stdout.write(out);
    """
    actual = subprocess.run(['node','--input-type=module','-e',js],cwd=ROOT,capture_output=True,check=True).stdout
    assert len(expected) == len(actual) == 3145728
    if expected != actual:
        mismatch = next(i for i in range(comparisons) if expected[4*i:4*i+4] != actual[4*i:4*i+4])
        raise AssertionError(f'public export differs at record {mismatch}: expected {RECORD.unpack_from(expected,4*mismatch)[0]}, actual {RECORD.unpack_from(actual,4*mismatch)[0]}')
    return {'reachableMaximumSumPairs':pairs,'skillBranches':2,'factorWords':3,'superBranches':2,
            'comparisons':comparisons,'fullOriginalEntryEveryCase':True,'binaryRecord':'little-endian uint32 EAX returnedQuantity',
            'recordOrder':'maximum 0..255; total maximum..3*maximum; skill 0,1; factor 3F800000,3F99999A,3FC00000; superAi 0,1',
            'expectedByteDrivenSha256':sha(expected),'actualPublicExportSha256':sha(actual),'mismatches':0}


def main():
    if sys.flags.optimize != 0:
        raise RuntimeError('oracle requires enabled assertions')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sweep',action='store_true',help='compare all 786432 full-entry numerical cases with the public export')
    parser.add_argument('--precision',action='store_true',help='add the exact 80676-case x87 precision/rounding proof')
    parser.add_argument('--output',type=Path)
    args = parser.parse_args()
    listing = load_listing()
    report = {'scope':'authenticated public-listing byte interpreter with explicit opaque external-call stubs',
              'sourceBlob':SOURCE_BLOB,'sourceUtf8Sha256':SOURCE_UTF8_SHA256,
              'originalInstructionCount':88,'originalBytes':254,'originalByteSha256':NATIVE_SHA256,
              'originalExecutableExecuted':False,'stockOriginalVerified':False,'commandIntegrated':False,
              'conversionStub':'signed32 truncation toward zero; 00707A74 identity relies on existing separate evidence',
              'examples':check_examples(listing),'byteMutationsKilled':check_mutations(listing.original),
              'modIsolation':check_mod(listing)}
    if args.precision:
        report['precisionProof'] = precision_proof()
    if args.sweep:
        report['exhaustive'] = sweep(listing.original)
    output = json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output:
        args.output.write_text(output)
    print(output,end='')


if __name__ == '__main__':
    main()
