#!/usr/bin/env python3
"""Independent x86 byte interpreter for the authenticated caller's supported paths.

The listing's 494 original bytes and two separate tables are authenticated.
The machine model never imports a product formula or executes game/native code;
external calls only project resolved observations into sparse synthetic memory.
Public TS/Python API comparisons run separately against byte-derived receipts.
The unsupported Easy x87/helper path is rejected without inventing its result.
The two unlisted bytes between code and tables are NEVER manufactured.
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import random
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/sources/city-food-income-projection-original.txt'
GBK = ROOT / 'docs/sources/city-food-income-projection-original.gbk'
PROFILE = 'city-food-income-stable-resolved-non-easy-u32-v1'
START, END, JUMP, DISPATCH = 0x49E810, 0x49E9FE, 0x49EA00, 0x49EA10
UTF8_SHA = '5751f8775b63410459c7ad035177df11ee08b245222c38c1f74ac0bf42f1fa78'
GBK_SHA = 'ef5c0c6431e167389d76c84693e4807ffdc078f94807509c73dcb24690e39947'
BLOB = '79e949349af8be94b77eb70f37a948b8d3ff2f6a'
BODY_SHA = '176854e5670c2e5f5957f2de3ec06529ad69668c1548e94923a849a87db850b0'
MASK, LIMIT = 0xFFFFFFFF, 0x7FFFFFFF
CITY, CITY_VT, FAC_VT, FAC, ROW, COORD = 0x100000, 0x110000, 0x120000, 0x200000, 0x300000, 0x400000
OWNER, PLAYER, LOCATION = 0x800010, 0x800020, 0x800030
RETURN, INITIAL_SP, INITIAL_ECX = 0xDEADBEEF, 0x700000, 0x0780B3CC
RELEVANT_TYPES = (32, 49, 52, 53)


def sha(raw): return hashlib.sha256(raw).hexdigest()
def u32(x): return x & MASK
def s32(x): return (x & MASK) - (1 << 32) if x & (1 << 31) else x & MASK
def canonical(x): return json.dumps(x, sort_keys=True, separators=(',', ':')).encode()


@dataclass(frozen=True)
class Listing:
    rows: tuple
    code: bytes
    tables: tuple


def load_listing(source=SOURCE, gbk=GBK):
    text_bytes, raw = source.read_bytes(), gbk.read_bytes()
    assert len(raw) == 17016 and sha(raw) == GBK_SHA, 'GBK source identity'
    assert hashlib.sha1(b'blob 17016\0' + raw).hexdigest() == BLOB, 'Git blob identity'
    assert len(text_bytes) == 18184 and sha(text_bytes) == UTF8_SHA, 'UTF8 source identity'
    text = text_bytes.decode('utf-8')
    assert text.encode('gbk') == raw and raw.decode('gbk') == text
    original, data = text.split('数据区：', 1)
    pattern = r'^([0-9A-F]{8}) - ((?:[0-9a-f]{2} ?)+)\s*- (.*)$'
    rows = tuple((int(a, 16), bytes.fromhex(b), asm) for a, b, asm in re.findall(pattern, original, re.M))
    assert len(rows) == len(re.findall(r'^[0-9A-F]{8} -', original, re.M)) == 160
    cursor = START
    for address, op, _ in rows:
        assert address == cursor, 'source gap, overlap or reorder'
        cursor += len(op)
    code = b''.join(op for _, op, _ in rows)
    assert cursor == END and len(code) == 494 and sha(code) == BODY_SHA
    data = data.split('================================================================', 1)[0]
    tables = tuple((int(a, 16), bytes.fromhex(b)) for a, b in re.findall(r'^([0-9A-F]{8}) - ([0-9A-F ]+)\s*$', data, re.M))
    assert [a for a, _ in tables] == [JUMP, DISPATCH]
    assert [len(b) for _, b in tables] == [16, 22]
    assert tables[0][1].hex() == '99e8490006e9490014e949004ee94900'
    assert tables[1][1].hex() == '00030303030303030303030303030303030003030102'
    return Listing(rows, code, tables)


def independent_disassembly(listing):
    with tempfile.TemporaryDirectory(prefix='city-food-objdump-') as directory:
        path = Path(directory) / 'body.bin'
        path.write_bytes(listing.code)
        output = subprocess.run(['objdump', '-D', '-b', 'binary', '-m', 'i386', '-M', 'intel',
            '--insn-width=16', f'--adjust-vma={START}', str(path)], check=True, text=True, capture_output=True).stdout
    decoded = []
    for line in output.splitlines():
        match = re.match(r'^\s*([0-9a-f]+):\s*((?:[0-9a-f]{2}\s+)+)\s*(.*)$', line)
        if match: decoded.append((int(match[1], 16), bytes.fromhex(match[2]), match[3]))
    assert [(a, b) for a, b, _ in decoded] == [(a, b) for a, b, _ in listing.rows]
    by = {a: asm for a, _, asm in decoded}
    for address in (0x49E996, 0x49E9A9, 0x49E9E3):
        assert re.fullmatch(r'sar\s+edx,0x5', by[address])
    assert re.fullmatch(r'cmp\s+esi,0xffffffff', by[0x49E8A4])
    return {'instructions': len(decoded), 'bytes': len(listing.code), 'decoder': 'GNU objdump',
        'allBoundariesMatch': True, 'unlistedGapBytesMaterialized': False}


class MissingObservation(Exception): pass


class Machine:
    """Small x86 interpreter: ModRM/SIB and branch immediates are decoded bytes.

    This is deliberately a machine model, not a transliteration of the income
    equation. Sparse memory rejects unmodeled reads. Helpers preserve nonvolatile
    registers, clobber volatile registers/flags, and obey observed caller cleanup.
    """
    def __init__(self, listing, value, *, city_valid=True, owner_word=0, predicate_word=0x80000000):
        self.listing, self.value = listing, value
        self.city_valid, self.owner_word, self.predicate_word = city_valid, owner_word, predicate_word
        self.mem = {}
        self.r = [0xA1230000 + i * 0x10101 for i in range(8)]
        self.r[1], self.r[4] = INITIAL_ECX, INITIAL_SP
        self.initial = self.r.copy()
        self.pc, self.zf, self.sf, self.of, self.cf = START, False, False, False, False
        self.visited, self.edges, self.calls, self.overflows = set(), set(), [], []
        self.jump_targets = set()
        self.trace = {'slots': [], 'multiplications': []}
        self.current_slot = None
        self.put(INITIAL_SP, RETURN); self.put(INITIAL_SP + 4, CITY)
        self.put(CITY, CITY_VT); self.put(CITY_VT + 0x40, OWNER); self.put(CITY_VT + 0x48, PLAYER)
        self.put(FAC_VT + 0x3C, LOCATION)
        self.put(CITY + 0x80, value['baseFoodWord'], 2)
        self.put(CITY + 0x85, value['securityByte'], 1)
        if 'cityTroopsWord' in value: self.put(CITY + 0x40, value['cityTroopsWord'])
        self.put(0x07201978, value['difficultyWord'])
        for index, slot in enumerate(value['slots']):
            address = FAC + index * 0x100
            self.put(CITY + 0xF4 + index * 8, address if slot is not None else 0)
            if slot is not None:
                self.put(address, FAC_VT)
                self.put(address + 8, slot['facilityTypeWord'])
                self.put(address + 0x14, slot['constructionWord'])
                self.put(COORD + index * 4, 0x500000 + index)
        for key, row in value['resolvedTypeRows'].items():
            if row['valid']: self.put(ROW + int(key) * 0x100 + 0xC0, row['foodYieldWord'], 2)
        for address, data in listing.tables:
            for index, byte in enumerate(data): self.mem[address + index] = byte

    def put(self, address, value, width=4):
        for i in range(width): self.mem[u32(address + i)] = (value >> (i * 8)) & 255

    def get(self, address, width=4):
        try: return sum(self.mem[u32(address + i)] << (i * 8) for i in range(width))
        except KeyError as error: raise AssertionError(f'unmodeled memory read {address:08X}/{width}') from error

    def push(self, value): self.r[4] = u32(self.r[4] - 4); self.put(self.r[4], value)
    def pop(self):
        value = self.get(self.r[4]); self.r[4] = u32(self.r[4] + 4); return value

    def regget(self, index, width=4):
        if width == 1 and index >= 4: return (self.r[index - 4] >> 8) & 255
        return self.r[index] & ((1 << (8 * width)) - 1)

    def regput(self, index, value, width=4):
        mask = (1 << (8 * width)) - 1
        if width == 1 and index >= 4:
            self.r[index - 4] = (self.r[index - 4] & ~0xFF00) | ((value & 255) << 8)
        else: self.r[index] = (self.r[index] & ~mask) | (value & mask)

    def operand(self, raw, index):
        byte = raw[index]; mod, reg, rm = byte >> 6, (byte >> 3) & 7, byte & 7; index += 1
        if mod == 3: return ('r', rm), reg, index
        address = 0
        if rm == 4:
            sib = raw[index]; index += 1
            scale, ix, base = sib >> 6, (sib >> 3) & 7, sib & 7
            if ix != 4: address += self.r[ix] << scale
            if not (mod == 0 and base == 5): address += self.r[base]
            else: address += int.from_bytes(raw[index:index + 4], 'little'); index += 4
        elif mod == 0 and rm == 5:
            address = int.from_bytes(raw[index:index + 4], 'little'); index += 4
        else: address = self.r[rm]
        if mod == 1: address += int.from_bytes(raw[index:index + 1], 'little', signed=True); index += 1
        elif mod == 2: address += int.from_bytes(raw[index:index + 4], 'little', signed=True); index += 4
        return ('m', u32(address)), reg, index

    def read(self, operand, width=4):
        return self.regget(operand[1], width) if operand[0] == 'r' else self.get(operand[1], width)

    def write(self, operand, value, width=4):
        if operand[0] == 'r': self.regput(operand[1], value, width)
        else: self.put(operand[1], value, width)

    def arithmetic(self, a, b, subtract=False, width=4):
        mask, sign = (1 << (width * 8)) - 1, 1 << (width * 8 - 1)
        a, b = a & mask, b & mask
        full = a - b if subtract else a + b; result = full & mask
        self.zf, self.sf = result == 0, bool(result & sign)
        self.cf = a < b if subtract else full > mask
        self.of = bool((a ^ b) & (a ^ result) & sign) if subtract else bool(~(a ^ b) & (a ^ result) & sign)
        return result

    def logical(self, value):
        self.zf, self.sf, self.of, self.cf = value == 0, bool(value & 0x80000000), False, False

    def condition(self, nibble):
        return {3: not self.cf, 4: self.zf, 5: not self.zf, 7: not self.cf and not self.zf,
            12: self.sf != self.of, 15: not self.zf and self.sf == self.of}[nibble]

    def helper(self, target, next_pc):
        self.push(next_pc)
        site, cleanup, result = self.pc, 0, None
        args = lambda index: self.get(self.r[4] + 4 + index * 4)
        if target == 0x47A630:
            pointer = args(0)
            if site == 0x49E81D: assert pointer == CITY; result = self.city_valid
            elif site == 0x49E86C:
                expected = FAC + self.current_slot * 0x100
                assert pointer in (0, expected); result = pointer != 0
            elif site == 0x49E8BB:
                effective = self.trace['slots'][-1]['effectiveType']
                assert pointer == ROW + effective * 0x100
                result = self.value['resolvedTypeRows'][str(effective)]['valid']
                self.trace['slots'][-1]['rowValid'] = result
            else: raise AssertionError('unrecognized validator site')
            result = self.predicate_word if result else 0
        elif target == OWNER:
            assert site == 0x49E831 and self.r[1] == CITY; result = self.owner_word
        elif target == PLAYER:
            assert site == 0x49E983 and self.r[1] == CITY
            if 'cityPlayerPredicate' not in self.value: raise MissingObservation('cityPlayerPredicate')
            result = self.predicate_word if self.value['cityPlayerPredicate'] else 0
        elif target == 0x490B90:
            assert site == 0x49E8B3 and self.r[1] == 0x07201958
            effective = args(0); cleanup = 4
            if str(effective) not in self.value['resolvedTypeRows']: raise MissingObservation(f'type row {effective}')
            self.trace['slots'][-1]['effectiveType'] = effective
            result = ROW + effective * 0x100
        elif target == LOCATION:
            assert site == 0x49E8E5 and self.r[1] == FAC + self.current_slot * 0x100
            result = COORD + self.current_slot * 4
        elif target == 0x49E500:
            assert site == 0x49E8F1 and self.r[1] == INITIAL_ECX
            assert args(0) == 0x500000 + self.current_slot and args(1) == 0x27
            slot = self.value['slots'][self.current_slot]
            if 'adjacentGranary' not in slot: raise MissingObservation(f'adjacentGranary slot {self.current_slot}')
            result = self.predicate_word if slot['adjacentGranary'] else 0; cleanup = 8
            self.trace['slots'][-1]['adjacentGranaryConsumed'] = slot['adjacentGranary']
        else: raise AssertionError(f'unknown helper {target:08X}')
        self.calls.append((site, target))
        # The contract does not preserve EAX/ECX/EDX or arithmetic flags.
        self.r[0], self.r[1], self.r[2] = u32(result), 0xA0C0E001, 0xA0D0E002
        self.zf, self.sf, self.of, self.cf = True, True, True, True
        assert self.pop() == next_pc
        self.r[4] += cleanup

    def multiply(self, lhs, rhs):
        full = s32(lhs) * s32(rhs)
        record = {'address': f'{self.pc:08X}', 'lhs': s32(lhs), 'rhs': s32(rhs), 'exact': full, 'word': u32(full)}
        self.trace['multiplications'].append(record)
        if not -(1 << 31) <= full <= LIMIT: self.overflows.append(record)
        self.of = self.cf = not -(1 << 31) <= full <= LIMIT
        return u32(full)

    def execute(self):
        rows = {a: raw for a, raw, _ in self.listing.rows}
        count = 0
        while self.pc != RETURN:
            assert self.pc in rows, f'branch outside original code {self.pc:08X}'
            count += 1; assert count < 5000
            self.visited.add(self.pc)
            if self.pc == 0x49E865:
                self.current_slot = len(self.trace['slots'])
                self.trace['slots'].append({'index': self.current_slot, 'before': self.r[5], 'status': 'invalid-slot'})
            elif self.pc == 0x49E87C:
                self.trace['slots'][-1].update(facilityTypeWord=self.get(self.r[7] + 8), status='ignored-type')
            elif self.pc == 0x49E899: self.trace['slots'][-1]['status'] = 'unfinished'
            elif self.pc == 0x49E8AD: self.trace['slots'][-1]['status'] = 'invalid-type-row'
            elif self.pc == 0x49E8CB:
                self.trace['slots'][-1]['foodYieldWord'] = self.get(self.r[3] + 0xC0, 2)
                self.trace['slots'][-1]['status'] = 'yield'
            elif self.pc == 0x49E92B and 'cityTroopsWord' not in self.value:
                raise MissingObservation('cityTroopsWord')
            elif self.pc == 0x49E93B:
                slot = self.trace['slots'][-1]
                slot.update(effectiveTroops=self.r[1], militaryProductRaw=self.r[1] * self.r[3])
            elif self.pc == 0x49E93E: self.trace['slots'][-1]['militaryProductU32'] = self.r[1]
            elif self.pc == 0x49E94E:
                slot = self.trace['slots'][-1]; slot['contribution'] = self.r[5] - slot['before']
            elif self.pc == 0x49E968: self.trace['rawFood'] = self.r[5]
            elif self.pc == 0x49E9C6: self.trace['difficultyAdjusted'] = self.r[5]
            elif self.pc == 0x49E9D9:
                self.trace['effectiveSecurity'] = self.r[1]
                self.trace['securityProductRaw'] = self.r[1] * self.r[5]
            elif self.pc == 0x49E9DC:
                self.trace['securityProductU32'] = self.r[1]
                self.trace['securityProductSigned'] = s32(self.r[1])
            elif self.pc in (0x49E9B5, 0x49E9B9, 0x49E9BF):
                raise MissingObservation('unsupported-easy-branch: x87 constant/helper/control-word not established')
            raw = rows[self.pc]; op = raw[0]; next_pc = self.pc + len(raw); used = None
            if 0x50 <= op <= 0x57: self.push(self.r[op - 0x50]); used = 1
            elif 0x58 <= op <= 0x5F: self.r[op - 0x58] = self.pop(); used = 1
            elif 0x48 <= op <= 0x4F:
                carry = self.cf; self.r[op - 0x48] = self.arithmetic(self.r[op - 0x48], 1, True); self.cf = carry; used = 1
            elif 0xB8 <= op <= 0xBF: self.r[op - 0xB8] = int.from_bytes(raw[1:5], 'little'); used = 5
            elif 0xB0 <= op <= 0xB7: self.regput(op - 0xB0, raw[1], 1); used = 2
            elif op == 0x6A: self.push(int.from_bytes(raw[1:2], 'little', signed=True)); used = 2
            elif op in (0x8B, 0x89, 0x8A, 0x8D, 0x85, 0x33, 0x2B, 0x03):
                operand, reg, used = self.operand(raw, 1)
                if op == 0x8B: self.r[reg] = self.read(operand)
                elif op == 0x89: self.write(operand, self.r[reg])
                elif op == 0x8A: self.regput(reg, self.read(operand, 1), 1)
                elif op == 0x8D: assert operand[0] == 'm'; self.r[reg] = operand[1]
                elif op == 0x85: self.logical(self.read(operand) & self.r[reg])
                elif op == 0x33: self.r[reg] ^= self.read(operand); self.logical(self.r[reg])
                else: self.r[reg] = self.arithmetic(self.r[reg], self.read(operand), op == 0x2B)
            elif op in (0x81, 0x83):
                operand, group, used = self.operand(raw, 1)
                width = 4 if op == 0x81 else 1
                immediate = int.from_bytes(raw[used:used + width], 'little', signed=True); used += width
                assert group in (0, 5, 7)
                result = self.arithmetic(self.read(operand), immediate, group != 0)
                if group != 7: self.write(operand, result)
            elif op == 0xC7:
                operand, group, used = self.operand(raw, 1); assert group == 0
                self.write(operand, int.from_bytes(raw[used:used + 4], 'little')); used += 4
            elif op == 0xFF:
                operand, group, used = self.operand(raw, 1); target = self.read(operand)
                if group == 2: self.helper(target, next_pc)
                elif group == 4: next_pc = target; self.jump_targets.add(target)
                else: raise AssertionError('unknown FF group')
            elif op == 0xE8:
                target = next_pc + int.from_bytes(raw[1:5], 'little', signed=True)
                self.helper(target, next_pc); used = 5
            elif op == 0xEB or 0x70 <= op <= 0x7F:
                used = 2
                if op == 0xEB or self.condition(op & 15): next_pc += int.from_bytes(raw[1:2], 'little', signed=True)
                self.edges.add((self.pc, next_pc))
            elif op == 0x0F:
                second = raw[1]
                if 0x80 <= second <= 0x8F:
                    used = 6
                    if self.condition(second & 15): next_pc += int.from_bytes(raw[2:6], 'little', signed=True)
                    self.edges.add((self.pc, next_pc))
                else:
                    operand, reg, used = self.operand(raw, 2)
                    if second in (0xB6, 0xB7): self.r[reg] = self.read(operand, 1 if second == 0xB6 else 2)
                    elif second == 0xAF: self.r[reg] = self.multiply(self.r[reg], self.read(operand))
                    else: raise AssertionError('unknown 0F opcode')
            elif op == 0xA1: self.r[0] = self.get(int.from_bytes(raw[1:5], 'little')); used = 5
            elif op == 0x6B:
                operand, reg, used = self.operand(raw, 1)
                immediate = int.from_bytes(raw[used:used + 1], 'little', signed=True); used += 1
                self.r[reg] = self.multiply(self.read(operand), immediate)
            elif op == 0xF7:
                operand, group, used = self.operand(raw, 1); assert group in (4, 5)
                product = (self.r[0] * self.read(operand)) if group == 4 else (s32(self.r[0]) * s32(self.read(operand)))
                self.r[0], self.r[2] = u32(product), u32(product >> 32)
                self.cf = self.of = product != s32(self.r[0])
            elif op in (0xC1, 0xD1):
                operand, group, used = self.operand(raw, 1)
                amount = raw[used] & 31 if op == 0xC1 else 1; used += op == 0xC1
                assert group in (5, 7) and amount > 0
                previous = self.read(operand); self.cf = bool(previous & (1 << (amount - 1)))
                result = previous >> amount if group == 5 else u32(s32(previous) >> amount)
                self.write(operand, result); self.zf, self.sf = result == 0, bool(result & (1 << 31))
                self.of = False if group == 7 else bool(previous & (1 << 31))
            elif op == 0x99: self.r[2] = MASK if self.r[0] & (1 << 31) else 0; used = 1
            elif op == 0x3C: self.arithmetic(self.regget(0, 1), raw[1], True, 1); used = 2
            elif op == 0xC2:
                next_pc = self.pop(); self.r[4] += int.from_bytes(raw[1:3], 'little'); used = 3
            else: raise AssertionError(f'unsupported opcode {self.pc:08X}: {raw.hex()}')
            assert used == len(raw), f'decoder boundary mismatch {self.pc:08X}: {used}/{len(raw)}'
            self.pc = next_pc
        assert self.r[4] == INITIAL_SP + 8, 'callee stack balance'
        for index in (3, 5, 6, 7): assert self.r[index] == self.initial[index], 'nonvolatile register preservation'
        self.trace['returnedIncomeSigned'] = s32(self.r[0])
        self.trace['returnedIncomeU32'] = self.r[0]
        self.trace['instructionExecutions'] = count
        if 'rawFood' in self.trace:
            factors = [m['rhs'] for m in self.trace['multiplications'] if m['address'] in ('0049E991', '0049E9A4')]
            self.trace['difficultyPercent'] = factors[0] if factors else 100
        return self.trace


def base_case(**updates):
    value = {'profile': PROFILE, 'baseFoodWord': 0, 'slots': [None] * 30, 'resolvedTypeRows': {},
        'difficultyWord': 1, 'securityByte': 100}
    value.update(updates)
    return value


def facility_case(typ=32, amount=101, *, construction=1, granary=False, valid=True, troops=15000,
                  count=1, index=0, base=7, difficulty=1, security=100, player=False):
    slot = {'facilityTypeWord': typ, 'constructionWord': construction}
    effective = 32 if typ == 52 and construction == 0 else 52 if typ == 53 and construction == 0 else typ
    consumes = typ in RELEVANT_TYPES and (construction != 0 or typ in (52, 53))
    rows = {str(effective): {'valid': valid, **({'foodYieldWord': amount} if valid else {})}} if consumes else {}
    if consumes and valid and effective in (32, 52, 53): slot['adjacentGranary'] = granary
    slots = [None] * 30
    for i in range(index, index + count): slots[i] = dict(slot)
    return base_case(baseFoodWord=base, slots=slots, resolvedTypeRows=rows, difficultyWord=difficulty,
        securityByte=security, **({'cityTroopsWord': troops} if consumes and valid and effective == 49 and count else {}),
        **({'cityPlayerPredicate': player} if difficulty == 2 else {}))


def comparison_cases(broad=False):
    yield base_case()
    for typ in [*range(55), LIMIT, 0x80000000, MASK-1, MASK]:
        for construction in (0, 1, 0x80000000, MASK):
            for valid in (False, True):
                yield facility_case(typ, construction=construction, valid=valid, granary=bool(construction & 1))
    for security in range(256):
        for difficulty, player in ((1, False), (2, False), (2, True), (3, False), (0x80000000, False), (MASK, False)):
            yield facility_case(49, 65535, troops=65537, count=30, base=65535,
                difficulty=difficulty, security=security, player=player)
    for typ in RELEVANT_TYPES:
        for amount in (0, 1, 2, 3, 99, 100, 101, 14999, 15000, 15001, 32767, 32768, 65534, 65535):
            for granary in (False, True):
                yield facility_case(typ, amount, granary=granary, count=30, construction=MASK)
    for amount in (0, 1, 2, 3, 100, 1500, 32767, 32768, 65535):
        probes = {0, 1, 14999, 15000, 15001, 20000, 65537, LIMIT, 0x80000000, MASK-1, MASK, 2863311, 2863312}
        if amount:
            for multiple in (1, 2, amount//2, amount-1):
                if multiple <= 0: continue
                threshold = (multiple*(1<<32) + amount-1)//amount
                probes.update(t for t in (threshold-1, threshold, threshold+1) if 0 <= t <= MASK)
        for troops in sorted(probes):
            yield facility_case(49, amount, troops=troops)
    for index in range(30):
        for typ in RELEVANT_TYPES:
            yield facility_case(typ, 103, index=index, troops=20000, granary=True)
    # Near final signed interpretation crossings, all are actual full-caller inputs.
    for security in (199, 200, 201, 247, 248, 249, 250, 254, 255):
        for difficulty, player in ((1, False), (2, False), (2, True)):
            for base in (0, 1, 99, 100, 32767, 32768, 65534, 65535):
                yield facility_case(49, 65535, troops=65537, count=30, base=base,
                    difficulty=difficulty, security=security, player=player)
    rng = random.Random(0x49E810)
    for _ in range(600):
        rows = {str(t): {'valid': (valid := rng.choice((False, True))), **({'foodYieldWord': rng.randrange(65536)} if valid else {})} for t in RELEVANT_TYPES}
        slots, military = [], False
        for __ in range(30):
            typ = rng.choice((*RELEVANT_TYPES, 0, 31, 33, 50, 54, MASK))
            construction = rng.choice((0, 1, 2, 0x80000000, MASK))
            slot = {'facilityTypeWord': typ, 'constructionWord': construction}
            effective = 32 if typ == 52 and not construction else 52 if typ == 53 and not construction else typ
            consume = effective in RELEVANT_TYPES and (construction or typ in (52, 53)) and rows[str(effective)]['valid']
            if consume and effective in (32, 52, 53): slot['adjacentGranary'] = rng.choice((False, True))
            slot = rng.choice((None, slot, slot))
            military |= slot is not None and consume and effective == 49
            slots.append(slot)
        difficulty = rng.choice((1, 2, 3, MASK, 0x80000000))
        yield base_case(baseFoodWord=rng.randrange(65536), slots=slots, resolvedTypeRows=rows,
            difficultyWord=difficulty, securityByte=rng.randrange(256),
            **({'cityTroopsWord': rng.randrange(1 << 32)} if military else {}),
            **({'cityPlayerPredicate': rng.choice((False, True))} if difficulty == 2 else {}))
    if broad:
        # Exhaustive only in this stated 16-bit coordinate; 30-slot product space is not exhaustive.
        for amount in range(65536):
            for granary in (False, True): yield facility_case(32, amount, granary=granary)
        # Every low32 multiplication wrap point for four chosen U16 yields.
        for amount in (1, 2, 3, 1500):
            for multiple in range(1, amount):
                point = (multiple * (1 << 32) + amount - 1) // amount
                for troops in (point-1, point, point+1):
                    yield facility_case(49, amount, troops=troops)
        # All base words around maximum military income expose many signed crossings.
        for base in range(65536):
            yield facility_case(49, 65535, troops=65537, count=30, base=base, difficulty=2, security=199)


def strict_equal(expected, actual):
    if type(expected) is not type(actual): return False
    if isinstance(expected, dict): return expected.keys() == actual.keys() and all(strict_equal(v, actual[k]) for k, v in expected.items())
    if isinstance(expected, list): return len(expected) == len(actual) and all(strict_equal(a,b) for a,b in zip(expected,actual))
    return expected == actual


def expected_receipt(value, trace, evidence):
    slots = []
    for slot in trace['slots']:
        slots.append({'index': slot['index'], 'facilityTypeWord': slot.get('facilityTypeWord'),
            'effectiveType': slot.get('effectiveType'), 'status': slot['status'],
            'foodYieldWord': slot.get('foodYieldWord'), 'granaryApplied': slot.get('adjacentGranaryConsumed', False),
            'effectiveTroops': slot.get('effectiveTroops'), 'militaryProductRaw': slot.get('militaryProductRaw'),
            'militaryProductU32': slot.get('militaryProductU32'), 'contribution': slot['contribution']})
    return {'supported': True, 'profile': PROFILE, **{k:value[k] for k in ('baseFoodWord','difficultyWord','securityByte')},
        'slots': slots, **{k:trace[k] for k in ('rawFood','difficultyPercent','difficultyAdjusted','effectiveSecurity',
        'securityProductRaw','securityProductU32','securityProductSigned','returnedIncomeSigned','returnedIncomeU32')}, 'evidence': evidence}


def mismatch(expected, actual):
    if strict_equal(expected, actual): return None
    if type(actual) is not dict: return 'receipt type'
    if expected.keys() != actual.keys(): return 'receipt keys'
    for key, value in expected.items():
        if not strict_equal(value, actual[key]): return key
    return 'typed receipt'


def product_receipts(cases, root=ROOT):
    result = subprocess.run(['node', str(root/'scripts/oracle_city_food_income_driver.mjs')], cwd=root,
        input=b''.join(canonical(x)+b'\n' for x in cases), capture_output=True)
    assert result.returncode == 0, ('public driver failed', result.stderr.decode())
    actual = [json.loads(line) for line in result.stdout.splitlines()]
    assert len(actual) == len(cases)
    return actual, sha(result.stdout)


def python_calculator():
    import importlib.util
    spec = importlib.util.spec_from_file_location('city_food_product_public', ROOT/'scripts/check_city_food_income.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module.calculate_city_food_income_projection


def rejection_cases():
    yield base_case(difficultyWord=0), 'unsupported-easy-branch'
    yield base_case(baseFoodWord=65535,difficultyWord=0), 'unsupported-easy-branch'
    for typ in (32,49,52,53):
        v=facility_case(typ, construction=0 if typ in (52,53) else 1)
        v['resolvedTypeRows']={}
        yield v, 'missing-type-row'
    for amount in (0,100):
        v=facility_case(32,amount); del v['slots'][0]['adjacentGranary']
        yield v,'missing-adjacent-granary'
        v=facility_case(49,amount); del v['cityTroopsWord']
        yield v,'missing-city-troops'
    for v in (facility_case(49),facility_case(32,valid=False),facility_case(32,construction=0),facility_case(33)):
        v['slots'][0]['adjacentGranary']=False
        yield v,'unexpected-field'
    for v in (base_case(),facility_case(49,valid=False),facility_case(49,construction=0)):
        v['cityTroopsWord']=0
        yield v,'unexpected-field'
    for count in (0,29,31): yield base_case(slots=[None]*count),'invalid-input'
    yield base_case(difficultyWord=2),'invalid-input'
    yield base_case(cityPlayerPredicate=False),'unexpected-field'
    for field,value in (('securityByte',256),('securityByte',-1),('baseFoodWord',65536),('baseFoodWord',True),
                        ('baseFoodWord',1.5),('baseFoodWord','1'),('difficultyWord',-1),('difficultyWord',1<<32)):
        yield base_case(**{field:value}),'invalid-input'
    yield base_case(resolvedTypeRows={'31':{'valid':False}}),'unexpected-field'
    yield base_case(resolvedTypeRows={'32':{'valid':False,'foodYieldWord':0}}),'unexpected-field'
    yield base_case(resolvedTypeRows={'32':{'valid':True}}),'invalid-input'
    yield base_case(profile='unbound'),'unsupported-profile'
    for field in ('rawFood','finalIncome','easyConvertedEax','rng','GameState'):
        yield base_case(**{field:0}),'unexpected-field'


# Independently pinned claim contract, not an expectation borrowed from product metadata.
EXPECTED_EVIDENCE = {
    'level': 'source-listing-reconstruction',
    'profile': 'city-food-income-stable-resolved-non-easy-u32-v1',
    'source': 'docs/sources/city-food-income-projection.json',
    'originalRange': '0049E810 <= PC < 0049E9FE',
    'fullCallerBytesVerified': True, 'entryGatesIntegrated': False,
    'stableResolvedInputsRequired': True, 'stockOriginalVerified': False,
    'originalExecutableExecuted': False, 'nativeHelpersReconstructed': False,
    'abiVerified': False, 'realTraceReachabilityVerified': False,
    'typeTableStockVerified': False, 'adjacencyHelperRecovered': False,
    'easyBranchRecovered': False, 'easyBranchSupported': False,
    'rngRecovered': False, 'monthlySchedulerIntegrated': False,
    'incomeWriterIntegrated': False, 'commandIntegrated': False, 'modBehaviorIncluded': False,
}


def load_evidence(path=ROOT/'docs/sources/city-food-income-projection.json'):
    evidence = json.loads(path.read_text())['evidence']
    assert strict_equal(evidence, EXPECTED_EVIDENCE), 'independent closed evidence claim contract'
    # Return a fresh copy of the independent literal; no product value supplies expected claims.
    return json.loads(json.dumps(EXPECTED_EVIDENCE))


def direct_branch_edges(listing):
    result=set()
    for address,raw,_ in listing.rows:
        if raw[0]==0xEB or 0x70<=raw[0]<=0x7F or raw[0]==0x0F and 0x80<=raw[1]<=0x8F:
            fallthrough=address+len(raw)
            result.add((address,fallthrough+int.from_bytes(raw[2:] if raw[0]==0x0F else raw[1:],'little',signed=True)))
            if raw[0]!=0xEB: result.add((address,fallthrough))
    return result


def run_checks(listing, *, compare_product=True, broad=False):
    coverage,edges,calls,jumps=set(),set(),set(),set()
    counts,call_counts,edge_samples={}, {}, {}
    trace_digest,ts_digest,py_digest,input_digest=[hashlib.sha256() for _ in range(4)]
    evidence=load_evidence() if compare_product else {}
    calculate=python_calculator() if compare_product else None
    total=negative=0
    batch,expected=[],[]
    def compare_batch():
        nonlocal batch,expected
        if not compare_product: batch=[];expected=[];return
        actual,_=product_receipts(batch)
        for value,wanted,got in zip(batch,expected,actual):
            assert mismatch(wanted,got) is None, ('TypeScript mismatch',mismatch(wanted,got),value,wanted,got)
            before=canonical(value); py=calculate(value)
            assert canonical(value)==before,'Python mutated input'
            assert mismatch(wanted,py) is None, ('Python mismatch',mismatch(wanted,py),value,wanted,py)
            ts_digest.update(canonical(got)+b'\n');py_digest.update(canonical(py)+b'\n')
        batch=[];expected=[]
    for value in comparison_cases(broad):
        machine=Machine(listing,value);trace=machine.execute()
        coverage|=machine.visited;edges|=machine.edges;calls|=set(machine.calls);jumps|=machine.jump_targets
        for edge in machine.edges:
            if edge not in edge_samples: edge_samples[edge]={'caseIndex':total,'input':value}
        for site,target in machine.calls: call_counts[(site,target)]=call_counts.get((site,target),0)+1
        assert len(trace['slots'])==30
        assert 0<=trace['rawFood']<=8655465
        assert 0<=trace['securityProductRaw']<=2758929405 and trace['securityProductRaw']==trace['securityProductU32']
        trace_digest.update(canonical(trace)+b'\n'); input_digest.update(canonical(value)+b'\n')
        negative+=trace['returnedIncomeSigned']<0;total+=1
        batch.append(value);expected.append(expected_receipt(value,trace,evidence))
        if len(batch)>=256: compare_batch()
    compare_batch()
    supported_coverage=set(coverage);supported_edges=set(edges)
    gates=[]
    for valid,owner in ((False,0),(True,MASK),(True,0x80000000),(True,47),(True,LIMIT),(True,0),(True,46)):
        machine=Machine(listing,base_case(),city_valid=valid,owner_word=owner);trace=machine.execute()
        coverage|=machine.visited;edges|=machine.edges;calls|=set(machine.calls)
        assert trace['returnedIncomeSigned']==0
        assert len(trace['slots'])==(30 if valid and owner<=46 else 0)
        gates.append({'cityValid':valid,'ownerWord':owner,'slotsVisited':len(trace['slots'])})
    excluded={0x49E9B5,0x49E9B9,0x49E9BF}
    gate_tail={0x49E9F5,0x49E9F7,0x49E9F8,0x49E9FB}
    gate_edges={(0x49E827,0x49E9F5),(0x49E836,0x49E9F5),(0x49E83F,0x49E9F5)}
    assert supported_coverage=={a for a,_,_ in listing.rows}-excluded-gate_tail
    assert coverage=={a for a,_,_ in listing.rows}-excluded,('uncovered',sorted({a for a,_,_ in listing.rows}-coverage))
    absent={(0x49E8A7,0x49E94E),(0x49E976,0x49E9B5)}
    assert supported_edges==direct_branch_edges(listing)-absent-gate_edges
    assert edges==direct_branch_edges(listing)-absent,('missing edges',direct_branch_edges(listing)-edges,'extra',edges-direct_branch_edges(listing))
    assert jumps=={int.from_bytes(listing.tables[0][1][i:i+4],'little') for i in range(0,16,4)}
    refusals=list(rejection_cases());rejection_count=0
    if compare_product:
        output,_=product_receipts([v for v,_ in refusals])
        for (v,reason),got in zip(refusals,output):
            wanted={'supported':False,'reason':reason,'evidence':evidence}
            assert mismatch(wanted,got) is None,('TS rejection',v,reason,got)
            assert mismatch(wanted,calculate(v)) is None,('Python rejection',v,reason,calculate(v))
            rejection_count+=1
    missing=[]
    for value,reason in refusals:
        if reason not in ('missing-type-row','missing-adjacent-granary','missing-city-troops','unsupported-easy-branch'): continue
        try: Machine(listing,value).execute()
        except MissingObservation: missing.append(reason)
        else: raise AssertionError(('unknown observation synthesized',reason))
    predicate_probes=[]
    value=facility_case(32,103,granary=True,difficulty=2,player=True)
    reference=Machine(listing,value).execute()
    for word in (1,0x100,0x80000000,MASK):
        got=Machine(listing,value,predicate_word=word).execute()
        assert strict_equal(got,reference)
        predicate_probes.append(word)
    return {'fullCallerCases':total,'accepted':total,'negativeReturnedCases':negative,
        'supportedInstructionsCovered':len(supported_coverage),'supportedBranchEdgesCovered':len(supported_edges),
        'syntheticPreGateInstructionsCovered':len(coverage),'syntheticPreGateBranchEdgesCovered':len(edges),
        'supportedExcludedEdges':[{'from':f'{a:08X}','to':f'{b:08X}','reason':'entry gate failure outside post-gate profile' if (a,b) in gate_edges else 'excluded Easy x87/helper branch' if a==0x49E976 else 'infeasible ESI=-1 after dispatch'} for a,b in sorted(absent|gate_edges)],
        'supportedExcludedInstructions':[{'pc':f'{a:08X}','reason':'unsupported Easy x87/helper' if a in excluded else 'entry gate failure return outside post-gate profile'} for a in sorted(excluded|gate_tail)],
        'originalInstructions':len(listing.rows),'excludedEasyInstructions':[f'{x:08X}' for x in sorted(excluded)],
        'allFeasibleSupportedDirectBranchEdgesCovered':True,
        'excludedEdges':[{'from':f'{a:08X}','to':f'{b:08X}'} for a,b in sorted(absent)],
        'indirectDispatchTargetsCovered':len(jumps),'calledSites':[f'{a:08X}->{b:08X}' for a,b in sorted(calls)],
        'callCounts':[{'site':f'{a:08X}','target':f'{b:08X}','count':n} for (a,b),n in sorted(call_counts.items())],
        'branchSamples':[{'from':f'{a:08X}','to':f'{b:08X}',**sample} for (a,b),sample in sorted(edge_samples.items())],
        'preGateCases':gates,'predicateNonzeroWordProbes':predicate_probes,'missingObservationRejections':len(missing),
        'machineTraceSha256':trace_digest.hexdigest(),'inputStreamSha256':input_digest.hexdigest(),
        'product':({'comparisons':total,'pythonComparisons':total,'typedWholeReceiptEquality':True,
            'publicEntry':'packages/engine/src/index.ts','pythonEntry':'scripts/check_city_food_income.py:calculate_city_food_income_projection',
            'typescriptCanonicalReceiptSha256':ts_digest.hexdigest(),'pythonCanonicalReceiptSha256':py_digest.hexdigest(),
            'projectionRejectionProbes':rejection_count} if compare_product else None),
        'exhaustiveInputDomain':False,'gameNativeCodeExecuted':False,'helperBodiesImplemented':False,'stableResolvedProfileOnly':True,
        'infeasibleBranch':'0049E8A7 taken requires ESI=-1 after dispatch restricted it to 32/49/52/53',
        'broadCoordinates':{'allU16FarmYieldsWithAndWithoutGranary':broad,'allBaseU16AtMilitaryMaximumSuperAI199':broad,
                            'allWrapPointsSelectedMilitaryYields':[1,2,3,1500] if broad else []}}

# All edits alter executable TypeScript behavior; no identity/source guard mutation.
MUTATIONS = (
 ('base-plus-one','let rawFood = top.baseFoodWord === 0 ? 0 : top.baseFoodWord;','let rawFood = (top.baseFoodWord === 0 ? 0 : top.baseFoodWord) + 1;'),
 ('only-29-slots','index < 30; index++','index < 29; index++'),
 ('construction-only-one','slot.constructionWord === 0','slot.constructionWord !== 1'),
 ('lv2-wrong-fallback','facilityTypeWord === 52) effectiveType = 32','facilityTypeWord === 52) effectiveType = 49'),
 ('lv3-wrong-fallback','facilityTypeWord === 53) effectiveType = 52','facilityTypeWord === 53) effectiveType = 32'),
 ('row-by-original-type','parsedRows[String(effectiveType)]','parsedRows[String(facilityTypeWord)]'),
 ('missing-row-assumed-invalid','const row = parsedRows[String(effectiveType)];','const row = parsedRows[String(effectiveType)] ?? {valid: false};'),
 ('granary-applies-military','effectiveType === 32 || effectiveType === 52 || effectiveType === 53','effectiveType === 32 || effectiveType === 49 || effectiveType === 52 || effectiveType === 53'),
 ('granary-round-up','Math.floor(3 * foodYieldWord / 2)','Math.ceil(3 * foodYieldWord / 2)'),
 ('granary-double','Math.floor(3 * foodYieldWord / 2)','Math.floor(4 * foodYieldWord / 2)'),
 ('military-ignore-low32','militaryProductU32 = Number(BigInt.asUintN(32, product));','militaryProductU32 = Number(product);'),
 ('military-signed-troops','Math.max(15000, top.cityTroopsWord)','Math.max(15000, top.cityTroopsWord | 0)'),
 ('military-remove-floor','Math.max(15000, top.cityTroopsWord)','top.cityTroopsWord'),
 ('military-signed-division','Math.floor(militaryProductU32 / 15000)','(Math.trunc((militaryProductU32 | 0) / 15000) || 0)'),
 ('military-wrong-divisor','Math.floor(militaryProductU32 / 15000)','Math.floor(militaryProductU32 / 10000)'),
 ('money-times100-confusion','Math.floor(rawFood * difficultyPercent / 100)','Math.floor(rawFood * difficultyPercent)'),
 ('difficulty-player-inverted','top.cityPlayerPredicate ? 75 : 125','top.cityPlayerPredicate ? 125 : 75'),
 ('difficulty-super-ai-150','top.cityPlayerPredicate ? 75 : 125','top.cityPlayerPredicate ? 75 : 150'),
 ('normal-difficulty-bonus','(top.cityPlayerPredicate ? 75 : 125) : 100','(top.cityPlayerPredicate ? 75 : 125) : 125'),
 ('security-clip100','Math.max(50, top.securityByte)','Math.min(100, Math.max(50, top.securityByte))'),
 ('security-remove-floor','Math.max(50, top.securityByte)','top.securityByte'),
 ('final-unsigned-interpretation','securityProductSigned = Number(BigInt.asIntN(32, product))','securityProductSigned = Number(BigInt.asUintN(32, product))'),
 ('final-clip-zero','Number(BigInt(securityProductSigned) / 100n)','Math.max(0, Number(BigInt(securityProductSigned) / 100n))'),
 ('negative-floor-division','Number(BigInt(securityProductSigned) / 100n)','Math.floor(securityProductSigned / 100)'),
 ('omit-final-division','Number(BigInt(securityProductSigned) / 100n)','securityProductSigned'),
 ('easy-branch-guessed-normal',"if (top.difficultyWord === 0) return reject('unsupported-easy-branch');", "if (false) return reject('unsupported-easy-branch');"),
)


def run_mutants(listing):
    evidence=load_evidence()
    cases=list(comparison_cases())[:-600]
    expected=[expected_receipt(v,Machine(listing,v).execute(),evidence) for v in cases]
    refused=list(rejection_cases());cases.extend(v for v,_ in refused)
    expected.extend({'supported':False,'reason':r,'evidence':evidence} for _,r in refused)
    source_path=ROOT/'packages/engine/src/city-food-income-projection.ts'
    original=source_path.read_text();reports=[]
    with tempfile.TemporaryDirectory(prefix='city-food-ts-mutants-') as directory:
        root=Path(directory)
        shutil.copytree(ROOT/'packages/engine/src',root/'packages/engine/src')
        shutil.copyfile(ROOT/'package.json',root/'package.json')
        (root/'scripts').mkdir()
        shutil.copyfile(ROOT/'scripts/oracle_city_food_income_driver.mjs',root/'scripts/oracle_city_food_income_driver.mjs')
        for path in (ROOT/'packages/engine/src').rglob('*.ts'):
            for specifier in re.findall(r"from ['\"]([^'\"]+\.json)['\"]",path.read_text()):
                source=(path.parent/specifier).resolve();target=root/source.relative_to(ROOT)
                target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
        control,control_sha=product_receipts(cases,root)
        assert all(mismatch(a,b) is None for a,b in zip(expected,control)),'unmodified temporary public entry failed'
        target=root/source_path.relative_to(ROOT)
        for name,old,new in MUTATIONS:
            target.write_text(original)
            per_control,per_control_sha=product_receipts(cases,root)
            assert len(per_control)==len(expected) and all(mismatch(a,b) is None for a,b in zip(expected,per_control)), ('unmodified per-mutant public entry failed',name)
            assert per_control_sha==control_sha,('control receipt drift',name)
            assert original.count(old)==1,('mutation target not unique',name)
            target.write_text(original.replace(old,new))
            actual,stream_sha=product_receipts(cases,root)
            differences=[(i,mismatch(wanted,got)) for i,(wanted,got) in enumerate(zip(expected,actual)) if mismatch(wanted,got)]
            assert differences,('surviving TS behavior mutant',name)
            i,field=differences[0]
            reports.append({'name':name,'killed':True,'controlPassed':True,'controlReceiptSha256':per_control_sha,'differingCases':len(differences),'firstCaseIndex':i,
                'firstMismatch':field,'input':cases[i], 'expectedReceipt':expected[i], 'mutantReceipt':actual[i],
                'mutatedSourceSha256':sha(target.read_bytes()),'receiptStreamSha256':stream_sha})
        target.write_text(original)
    assert source_path.read_text()==original,'product source mutated in place'
    return {'count':len(reports),'killed':len(reports),'casesPerMutant':len(cases),'rows':reports,
        'unmodifiedPublicEntryControlPassed':True,'unmodifiedPerMutantControlsPassed':len(reports),'unmodifiedControlReceiptSha256':control_sha,
        'unmodifiedSourceSha256':sha(original.encode()),'actualTypeScriptExecuted':True,'syntaxErrorsCountedAsKilled':False,
        'runtimeErrorsCountedAsKilled':False,'sourceIdentityRejectionsCountedAsKilled':False,
        'publicEntryCopiedUnchanged':True,'productFilesMutatedInPlace':False,'typedWholeReceiptEquality':True}


def main():
    parser=argparse.ArgumentParser(description=__doc__,allow_abbrev=False)
    parser.add_argument('--source',type=Path,default=SOURCE)
    parser.add_argument('--gbk',type=Path,default=GBK)
    parser.add_argument('--output',type=Path)
    mode=parser.add_mutually_exclusive_group()
    mode.add_argument('--oracle-only',action='store_true');mode.add_argument('--broad',action='store_true');mode.add_argument('--mutants',action='store_true')
    args=parser.parse_args();listing=load_listing(args.source,args.gbk)
    report={'profile':PROFILE,'kind':'full-caller-byte-interpreter-supported-paths',
        'source':independent_disassembly(listing),
        'coverage':None if args.mutants else run_checks(listing,compare_product=not args.oracle_only,broad=args.broad),
        'mutants':run_mutants(listing) if args.mutants else None,
        'mode':'mutants' if args.mutants else 'broad' if args.broad else 'oracle-only' if args.oracle_only else 'default',
        'evidenceLevel':'source-listing-reconstruction','stockOriginalVerified':False}
    output=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output: args.output.write_text(output)
    print(output,end='')


if __name__=='__main__': main()
