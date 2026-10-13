#!/usr/bin/env python3
"""Offline, independent x86 byte interpreter for the complete income caller.

The listing's 437 original bytes and two separate tables are authenticated.
No game/native code or product formula is imported or executed. External calls
only project the contract's resolved observations into a sparse synthetic memory.
The three unlisted bytes between code and tables are NEVER manufactured.
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
SOURCE = ROOT / 'docs/sources/city-money-income-projection-original.txt'
GBK = ROOT / 'docs/sources/city-money-income-projection-original.gbk'
PROFILE = 'city-money-income-stable-resolved-i32-safe-v1'
START, END, JUMP, DISPATCH = 0x49E590, 0x49E745, 0x49E748, 0x49E758
UTF8_SHA = 'd1780c1a16fb50a06af16a0ac7acbad06c396bf31ed1ef09432077b91a5d833a'
GBK_SHA = '38b0ac07ba1d67e47add98460a013337d9ed4a97191e7371461ad1d4d89e1e7a'
BLOB = '0f2c2d72a174d563427230bf207d65b6a639247c'
BODY_SHA = '30a5160008a77ce78b8602819a7041f71015fffcb30d2b09221f5abee37a37f1'
MASK, LIMIT = 0xFFFFFFFF, 0x7FFFFFFF
CITY, CITY_VT, FAC_VT, FAC, ROW, COORD = 0x100000, 0x110000, 0x120000, 0x200000, 0x300000, 0x400000
OWNER, PLAYER, LOCATION = 0x800010, 0x800020, 0x800030
RETURN, INITIAL_SP, INITIAL_ECX = 0xDEADBEEF, 0x700000, 0x0780B3CC
RELEVANT_TYPES = (31, 46, 47, 48, 50, 51)


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
    assert len(raw) == 13630 and sha(raw) == GBK_SHA, 'GBK source identity'
    assert hashlib.sha1(b'blob 13630\0' + raw).hexdigest() == BLOB, 'Git blob identity'
    assert len(text_bytes) == 14553 and sha(text_bytes) == UTF8_SHA, 'UTF8 source identity'
    text = text_bytes.decode('utf-8')
    assert text.encode('gbk') == raw and raw.decode('gbk') == text
    original, data = text.split('数据区：', 1)
    pattern = r'^([0-9A-F]{8}) - ((?:[0-9a-f]{2} ?)+)\s*- (.*)$'
    rows = tuple((int(a, 16), bytes.fromhex(b), asm) for a, b, asm in re.findall(pattern, original, re.M))
    assert len(rows) == len(re.findall(r'^[0-9A-F]{8} -', original, re.M)) == 150
    cursor = START
    for address, op, _ in rows:
        assert address == cursor, 'source gap, overlap or reorder'
        cursor += len(op)
    code = b''.join(op for _, op, _ in rows)
    assert cursor == END and len(code) == 437 and sha(code) == BODY_SHA
    data = data.split('================================================================', 1)[0]
    tables = tuple((int(a, 16), bytes.fromhex(b)) for a, b in re.findall(r'^([0-9A-F]{8}) - ([0-9A-F ]+)\s*$', data, re.M))
    assert [a for a, _ in tables] == [JUMP, DISPATCH]
    assert [len(b) for _, b in tables] == [16, 21]
    assert tables[0][1].hex() == '14e6490075e6490083e6490097e64900'
    assert tables[1][1].hex() == '000303030303030303030303030303000000030102'
    return Listing(rows, code, tables)


def independent_disassembly(listing):
    with tempfile.TemporaryDirectory(prefix='city-money-objdump-') as directory:
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
    for address in (0x49E6DA, 0x49E6F2, 0x49E717, 0x49E729):
        assert re.fullmatch(r'sar\s+edx,0x5', by[address])
    assert re.fullmatch(r'cmp\s+esi,0xffffffff', by[0x49E61B])
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
        self.put(CITY + 0x7E, value['baseMoneyWord'], 2)
        self.put(CITY + 0x85, value['securityByte'], 1)
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
            if row['valid']: self.put(ROW + int(key) * 0x100 + 0xC0, row['moneyYieldWord'], 2)
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
            if site == 0x49E59D: assert pointer == CITY; result = self.city_valid
            elif site == 0x49E5E7:
                expected = FAC + self.current_slot * 0x100
                assert pointer in (0, expected); result = pointer != 0
            elif site == 0x49E62E:
                effective = self.trace['slots'][-1]['effectiveType']
                assert pointer == ROW + effective * 0x100
                result = self.value['resolvedTypeRows'][str(effective)]['valid']
                self.trace['slots'][-1]['rowValid'] = result
            else: raise AssertionError('unrecognized validator site')
            result = self.predicate_word if result else 0
        elif target == OWNER:
            assert site == 0x49E5B1 and self.r[1] == CITY; result = self.owner_word
        elif target == PLAYER:
            assert site == 0x49E6C9 and self.r[1] == CITY
            if 'cityPlayerPredicate' not in self.value: raise MissingObservation('cityPlayerPredicate')
            result = self.predicate_word if self.value['cityPlayerPredicate'] else 0
        elif target == 0x490B90:
            assert site == 0x49E626 and self.r[1] == 0x07201958
            effective = args(0); cleanup = 4
            if str(effective) not in self.value['resolvedTypeRows']: raise MissingObservation(f'type row {effective}')
            self.trace['slots'][-1]['effectiveType'] = effective
            result = ROW + effective * 0x100
        elif target == LOCATION:
            assert site == 0x49E654 and self.r[1] == FAC + self.current_slot * 0x100
            result = COORD + self.current_slot * 4
        elif target == 0x49E500:
            assert site == 0x49E660 and self.r[1] == INITIAL_ECX
            assert args(0) == 0x500000 + self.current_slot and args(1) == 0x26
            slot = self.value['slots'][self.current_slot]
            if 'adjacentMint' not in slot: raise MissingObservation(f'adjacentMint slot {self.current_slot}')
            result = self.predicate_word if slot['adjacentMint'] else 0; cleanup = 8
            self.trace['slots'][-1]['adjacentMintConsumed'] = slot['adjacentMint']
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
            if self.pc == 0x49E5E0:
                self.current_slot = len(self.trace['slots'])
                self.trace['slots'].append({'index': self.current_slot, 'before': self.r[5], 'status': 'invalid-slot'})
            elif self.pc == 0x49E5F7:
                self.trace['slots'][-1].update(facilityTypeWord=self.get(self.r[7] + 8), status='ignored-type')
            elif self.pc == 0x49E614: self.trace['slots'][-1]['status'] = 'unfinished'
            elif self.pc == 0x49E620: self.trace['slots'][-1]['status'] = 'invalid-type-row'
            elif self.pc == 0x49E63A:
                self.trace['slots'][-1]['moneyYieldWord'] = self.get(self.r[3] + 0xC0, 2)
                self.trace['slots'][-1]['status'] = 'yield'
            elif self.pc == 0x49E697:
                slot = self.trace['slots'][-1]; slot['contribution'] = self.r[5] - slot['before']
            elif self.pc == 0x49E6B1: self.trace['rawMoney'] = self.r[5]
            elif self.pc == 0x49E6FE: self.trace['afterDifficulty'] = s32(self.r[6])
            elif self.pc == 0x49E70D: self.trace['effectiveSecurity'] = self.r[1]
            elif self.pc == 0x49E721: self.trace['afterFirstSecurityDivision'] = s32(self.r[1])
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
            elif op == 0x83:
                operand, group, used = self.operand(raw, 1)
                immediate = int.from_bytes(raw[used:used + 1], 'little', signed=True); used += 1
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
                operand, group, used = self.operand(raw, 1); assert group == 5
                product = s32(self.r[0]) * s32(self.read(operand))
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
        self.trace['returnedIncome'] = s32(self.r[0])
        self.trace['arithmeticDomainSafe'] = not self.overflows
        self.trace['instructionExecutions'] = count
        if 'rawMoney' in self.trace:
            factors = [m['rhs'] for m in self.trace['multiplications'] if m['address'] in ('0049E6D5', '0049E6ED')]
            self.trace['difficultyPercent'] = factors[0] if factors else 100
        return self.trace


def base_case(**updates):
    value = {'profile': PROFILE, 'baseMoneyWord': 0, 'slots': [None] * 30, 'resolvedTypeRows': {},
        'difficultyWord': 1, 'securityByte': 100}
    value.update(updates)
    return value


def case_for_raw(raw, difficulty=1, security=100, player=False):
    slots, rows = [None] * 30, {}
    base = min(raw, 65535); remaining = raw - base
    for index in range(30):
        if not remaining: break
        part = min(remaining, 65535)
        # A single stable row can serve all full contributions; remainder is base.
        if part != 65535:
            base = part; remaining += 65535 - part; part = 65535
        slots[index] = {'facilityTypeWord': 46, 'constructionWord': 1}
        rows['46'] = {'valid': True, 'moneyYieldWord': part}; remaining -= part
    assert remaining == 0 and base + sum(65535 for x in slots if x) == raw
    return base_case(baseMoneyWord=base, slots=slots, resolvedTypeRows=rows,
        difficultyWord=difficulty, securityByte=security, **({'cityPlayerPredicate': player} if difficulty == 2 else {}))


def comparison_cases(broad=False):
    # Full caller executed separately for every listed case; no algebra tables.
    yield base_case()
    for typ in list(range(0, 55)) + [0x7FFFFFFF, 0x80000000, 0xFFFFFFFE, MASK]:
        for construction in (0, 1, 0x80000000, MASK):
            for valid in (False, True):
                slot = {'facilityTypeWord': typ, 'constructionWord': construction}
                effective = 31 if typ == 50 and not construction else 50 if typ == 51 and not construction else typ
                reads_row = typ in RELEVANT_TYPES and (construction != 0 or typ in (50, 51))
                rows = {str(effective): {'valid': valid, **({'moneyYieldWord': 103} if valid else {})}} if reads_row else {}
                if reads_row and valid and effective in (31, 50, 51): slot['adjacentMint'] = bool(construction & 1)
                yield base_case(baseMoneyWord=7, slots=[slot] + [None] * 29, resolvedTypeRows=rows)
    for security in range(256):
        for difficulty, player in ((0, False), (1, False), (2, False), (2, True), (3, False), (0x80000000, False), (MASK, False)):
            yield case_for_raw(67372 + (security % 3), difficulty, security, player)
    for typ in RELEVANT_TYPES:
        for amount in (0, 1, 2, 3, 99, 100, 101, 32767, 32768, 65534, 65535):
            for mint in (False, True):
                slot = {'facilityTypeWord': typ, 'constructionWord': MASK}
                if typ in (31, 50, 51): slot['adjacentMint'] = mint
                yield base_case(slots=[slot] * 30, resolvedTypeRows={str(typ): {'valid': True, 'moneyYieldWord': amount}})
    raw_values = {0, 1, 2, 3, 65535, 67371, 67372, 67373, 85000, 200000, 300000, 1966050}
    for factor in (75, 100, 125):
        for security in (50, 51, 99, 100, 101, 254, 255):
            cap = LIMIT // (factor * security)
            raw_values.update((cap - 1, cap, cap + 1))
        cap = LIMIT // (100 * factor)
        raw_values.update((cap - 1, cap, cap + 1))
    for raw in sorted(raw_values):
        for difficulty, player in ((0, False), (1, False), (2, False), (2, True)):
            for security in (0, 49, 50, 51, 99, 100, 101, 254, 255):
                yield case_for_raw(raw, difficulty, security, player)
    rng = random.Random(0x49E590)
    for _ in range(1200):
        rows = {str(t): {'valid': (valid := rng.choice((False, True))), **({'moneyYieldWord': rng.randrange(65536)} if valid else {})} for t in RELEVANT_TYPES}
        slots = []
        for __ in range(30):
            typ = rng.choice((*RELEVANT_TYPES, 0, 30, 32, 49, 52, MASK))
            construction = rng.choice((0, 1, 2, 0x80000000, MASK))
            slot = {'facilityTypeWord': typ, 'constructionWord': construction}
            effective = 31 if typ == 50 and not construction else 50 if typ == 51 and not construction else typ
            if effective in (31, 50, 51) and (construction or typ in (50, 51)) and rows[str(effective)]['valid']:
                slot['adjacentMint'] = rng.choice((False, True))
            slots.append(rng.choice((None, slot, slot)))
        difficulty = rng.choice((0, 1, 2, 3, MASK, 0x80000000))
        yield base_case(baseMoneyWord=rng.randrange(65536), slots=slots, resolvedTypeRows=rows,
            difficultyWord=difficulty, securityByte=rng.randrange(256),
            **({'cityPlayerPredicate': rng.choice((False, True))} if difficulty == 2 else {}))
    if broad:
        for raw in (0, 1, 65535, 67372, 67373, 85000, 171798, 171799, 286331, 286332, 300000):
            for difficulty, player in ((0, False), (1, False), (2, False), (2, True)):
                for security in range(256): yield case_for_raw(raw, difficulty, security, player)


def mismatch(oracle, receipt):
    if 'expectedRejection' in oracle:
        return None if receipt.get('supported') is False and receipt.get('reason') == oracle['expectedRejection'] else 'projection refusal'
    if receipt.get('supported') != oracle['arithmeticDomainSafe']: return 'supported domain'
    if not oracle['arithmeticDomainSafe']:
        return None if receipt.get('reason') == 'unsupported-arithmetic-domain' else 'arithmetic rejection reason'
    for field in ('returnedIncome', 'rawMoney', 'difficultyPercent', 'effectiveSecurity'):
        if receipt.get(field) != oracle[field]: return field
    multiplication = oracle['multiplications']
    difficulty = [m for m in multiplication if m['address'] in ('0049E6D5', '0049E6ED')]
    intermediate = {'scaledRaw': multiplication[0]['exact'],
        'difficultyProduct': difficulty[0]['exact'] if difficulty else None,
        'difficultyAdjusted': oracle['afterDifficulty'], 'securityProduct': multiplication[-1]['exact'],
        'securityAdjusted': oracle['afterFirstSecurityDivision']}
    if receipt.get('intermediates') != intermediate: return 'intermediates'
    slots = []
    for slot in oracle['slots']:
        slots.append({'index': slot['index'], 'facilityTypeWord': slot.get('facilityTypeWord'),
            'effectiveType': slot.get('effectiveType'), 'status': slot['status'],
            'moneyYieldWord': slot.get('moneyYieldWord'), 'mintApplied': slot.get('adjacentMintConsumed', False),
            'contribution': slot['contribution']})
    if receipt.get('slots') != slots: return 'slots'
    return None


def product_receipts(cases, root=ROOT):
    result = subprocess.run(['node', str(root / 'scripts/oracle_city_money_income_driver.mjs')], cwd=root,
        input=b''.join(canonical(x) + b'\n' for x in cases), capture_output=True)
    assert result.returncode == 0, ('public driver failed', result.stderr.decode())
    actual = [json.loads(line) for line in result.stdout.splitlines()]
    assert len(actual) == len(cases)
    return actual, sha(result.stdout)


def rejection_cases():
    yield base_case(slots=[{'facilityTypeWord': 31, 'constructionWord': 1}] + [None] * 29), 'missing-type-row'
    yield base_case(slots=[{'facilityTypeWord': 50, 'constructionWord': 0}] + [None] * 29,
        resolvedTypeRows={'50': {'valid': True, 'moneyYieldWord': 100}}), 'missing-type-row'
    yield base_case(slots=[{'facilityTypeWord': 51, 'constructionWord': 0}] + [None] * 29,
        resolvedTypeRows={'51': {'valid': True, 'moneyYieldWord': 100}}), 'missing-type-row'
    yield base_case(slots=[{'facilityTypeWord': 31, 'constructionWord': 1}] + [None] * 29,
        resolvedTypeRows={'31': {'valid': True, 'moneyYieldWord': 100}}), 'missing-adjacent-mint'
    yield base_case(slots=[{'facilityTypeWord': 46, 'constructionWord': 1, 'adjacentMint': True}] + [None] * 29,
        resolvedTypeRows={'46': {'valid': True, 'moneyYieldWord': 100}}), 'unexpected-field'
    yield base_case(slots=[{'facilityTypeWord': 31, 'constructionWord': 1, 'adjacentMint': False}] + [None] * 29,
        resolvedTypeRows={'31': {'valid': False}}), 'unexpected-field'
    yield base_case(slots=[{'facilityTypeWord': 31, 'constructionWord': 0, 'adjacentMint': False}] + [None] * 29), 'unexpected-field'
    yield base_case(slots=[{'facilityTypeWord': 30, 'constructionWord': 1, 'adjacentMint': False}] + [None] * 29), 'unexpected-field'
    for count in (0, 29, 31): yield base_case(slots=[None] * count), 'invalid-input'
    yield base_case(difficultyWord=2), 'invalid-input'
    yield base_case(cityPlayerPredicate=False), 'unexpected-field'
    yield base_case(securityByte=256), 'invalid-input'
    yield base_case(baseMoneyWord=65536), 'invalid-input'
    yield base_case(difficultyWord=-1), 'invalid-input'
    yield base_case(resolvedTypeRows={'32': {'valid': False}}), 'unexpected-field'
    yield base_case(resolvedTypeRows={'31': {'valid': False, 'moneyYieldWord': 0}}), 'unexpected-field'
    yield base_case(resolvedTypeRows={'31': {'valid': True}}), 'invalid-input'
    yield base_case(profile='unbound'), 'unsupported-profile'


def run_checks(listing, *, compare_product=True, broad=False):
    coverage, edges, calls, jump_targets, digest = set(), set(), set(), set(), hashlib.sha256()
    accepted = rejected = 0; expected, cases = [], list(comparison_cases(broad))
    for value in cases:
        machine = Machine(listing, value); result = machine.execute()
        coverage |= machine.visited; edges |= machine.edges; calls |= set(machine.calls)
        jump_targets |= machine.jump_targets
        assert len(result['slots']) == 30
        if result['arithmeticDomainSafe']: accepted += 1
        else: rejected += 1
        digest.update(canonical(result) + b'\n'); expected.append(result)
    gates = []
    for valid, owner in ((False, 0), (True, MASK), (True, 0x80000000), (True, 47), (True, LIMIT), (True, 0), (True, 46)):
        machine = Machine(listing, base_case(), city_valid=valid, owner_word=owner)
        result = machine.execute(); coverage |= machine.visited; edges |= machine.edges; calls |= set(machine.calls)
        assert result['returnedIncome'] == 0
        assert len(result['slots']) == (30 if valid and owner <= 46 else 0)
        gates.append({'cityValid': valid, 'ownerWord': owner, 'slotsVisited': len(result['slots'])})
    assert coverage == {a for a, _, _ in listing.rows}, ('uncovered instructions', sorted({a for a, _, _ in listing.rows} - coverage))
    direct_edges = set()
    for address, raw, _ in listing.rows:
        if raw[0] == 0xEB or 0x70 <= raw[0] <= 0x7F or raw[0] == 0x0F and 0x80 <= raw[1] <= 0x8F:
            fallthrough = address + len(raw)
            offset = int.from_bytes(raw[2:] if raw[0] == 0x0F else raw[1:], 'little', signed=True)
            direct_edges.add((address, fallthrough + offset))
            if raw[0] != 0xEB: direct_edges.add((address, fallthrough))
    assert len(direct_edges) == 42 and edges == direct_edges - {(0x49E61E, 0x49E697)}
    assert jump_targets == {int.from_bytes(listing.tables[0][1][i:i + 4], 'little') for i in range(0, 16, 4)}
    examples = []
    for raw, difficulty, security, player, wanted in (
        (67372, 0, 255, False, 214748), (67373, 0, 255, False, -214745),
        (300000, 2, 50, True, -102248), (85000, 1, 255, False, -212746),
        (65535, 1, 255, False, 167114), (200000, 0, 100, False, -179496)):
        machine = Machine(listing, case_for_raw(raw, difficulty, security, player)); result = machine.execute()
        assert result['returnedIncome'] == wanted, (raw, result)
        examples.append({'rawMoney': raw, 'difficultyWord': difficulty, 'securityByte': security,
            'player': player, 'machineReturnedIncome': wanted, 'supportedDomain': not machine.overflows,
            'overflowInstructions': [m['address'] for m in machine.overflows]})
    product = None
    if compare_product:
        actual, stream_sha = product_receipts(cases)
        for index, (value, oracle, receipt) in enumerate(zip(cases, expected, actual)):
            problem = mismatch(oracle, receipt)
            assert problem is None, ('public receipt mismatch', index, problem, value, oracle, receipt)
        product = {'comparisons': len(actual), 'accepted': accepted, 'arithmeticRejections': rejected,
            'publicEntry': 'packages/engine/src/index.ts', 'receiptStreamSha256': stream_sha,
            'compared': ['supported/reason', 'returnedIncome', 'rawMoney', 'difficultyPercent', 'effectiveSecurity', 'all 30 slot receipts', 'all 5 intermediates']}
        refused = list(rejection_cases())
        outputs, refusal_sha = product_receipts([value for value, _ in refused])
        for index, ((value, reason), receipt) in enumerate(zip(refused, outputs)):
            assert mismatch({'expectedRejection': reason}, receipt) is None, ('projection refusal', index, value, reason, receipt)
        product.update(projectionRejectionProbes=len(refused), projectionRejectionStreamSha256=refusal_sha)
    # These absent observations reach the original helper read; they must never
    # be converted to a false predicate/invalid row by an independent oracle.
    missing_observations = 0
    for value, reason in list(rejection_cases())[:4]:
        try: Machine(listing, value).execute()
        except MissingObservation: missing_observations += 1
        else: raise AssertionError(('oracle synthesized unknown observation', reason))
    return {'fullCallerCases': len(cases), 'acceptedNonOverflow': accepted, 'rejectedOverflow': rejected,
        'instructionsCovered': len(coverage), 'branchEdgesCovered': len(edges),
        'allFeasibleDirectBranchEdgesCovered': True, 'indirectDispatchTargetsCovered': len(jump_targets),
        'calledSites': [f'{site:08X}->{target:08X}' for site, target in sorted(calls)],
        'preGateCases': gates, 'machineOverflowExamples': examples, 'machineTraceSha256': digest.hexdigest(),
        'product': product, 'missingObservationRejections': missing_observations,
        'exhaustiveInputDomain': False, 'gameNativeCodeExecuted': False,
        'helperBodiesImplemented': False, 'stableResolvedProfileOnly': True,
        'infeasibleBranch': '0049E61E taken requires ESI=-1 after dispatch has restricted it to 31/46/47/48/50/51'}


MUTATIONS = (
    ('base-money-plus-one', 'let rawMoney = top.baseMoneyWord === 0 ? 0 : top.baseMoneyWord;', 'let rawMoney = (top.baseMoneyWord === 0 ? 0 : top.baseMoneyWord) + 1;'),
    ('only-29-slots', 'index < 30; index++', 'index < 29; index++'),
    ('construction-only-one-complete', 'slot.constructionWord === 0', 'slot.constructionWord !== 1'),
    ('lv2-wrong-fallback', 'facilityTypeWord === 50) effectiveType = 31', 'facilityTypeWord === 50) effectiveType = 46'),
    ('lv3-wrong-fallback', 'facilityTypeWord === 51) effectiveType = 50', 'facilityTypeWord === 51) effectiveType = 31'),
    ('row-by-original-type', 'parsedRows[String(effectiveType)]', 'parsedRows[String(facilityTypeWord)]'),
    ('missing-row-assumed-invalid', 'const row = parsedRows[String(effectiveType)];', 'const row = parsedRows[String(effectiveType)] ?? {valid: false};'),
    ('invalid-row-assumed-zero-yield', "if (!row.valid) status = 'invalid-type-row';", "if (!row.valid) { status = 'yield'; moneyYieldWord = 0; }"),
    ('mint-applies-special-market', 'effectiveType === 31 || effectiveType === 50 || effectiveType === 51', 'effectiveType === 31 || effectiveType === 46 || effectiveType === 50 || effectiveType === 51'),
    ('mint-round-up', 'Math.floor(3 * moneyYieldWord / 2)', 'Math.ceil(3 * moneyYieldWord / 2)'),
    ('mint-double', 'Math.floor(3 * moneyYieldWord / 2)', 'Math.floor(4 * moneyYieldWord / 2)'),
    ('difficulty-zero-normal', 'top.difficultyWord === 0 ? 125', 'top.difficultyWord === 0 ? 100'),
    ('difficulty-player-inverted', 'top.cityPlayerPredicate ? 75 : 125', 'top.cityPlayerPredicate ? 125 : 75'),
    ('normal-difficulty-bonus', '(top.cityPlayerPredicate ? 75 : 125) : 100', '(top.cityPlayerPredicate ? 75 : 125) : 125'),
    ('security-clip-100', 'Math.max(50, top.securityByte)', 'Math.min(100, Math.max(50, top.securityByte))'),
    ('security-no-floor', 'Math.max(50, top.securityByte)', 'top.securityByte'),
    ('remove-difficulty-overflow-guard', 'if (difficultyProduct !== null && difficultyProduct > 0x7FFFFFFF)', 'if (false && difficultyProduct !== null && difficultyProduct > 0x7FFFFFFF)'),
    ('remove-security-overflow-guard', 'if (securityProduct > 0x7FFFFFFF)', 'if (false && securityProduct > 0x7FFFFFFF)'),
    ('false-normal-difficulty-overflow', 'if (scaledRaw > 0x7FFFFFFF)', 'if (scaledRaw * 100 > 0x7FFFFFFF)'),
    ('overconservative-raw-cap', 'if (scaledRaw > 0x7FFFFFFF)', 'if (rawMoney > 67372 || scaledRaw > 0x7FFFFFFF)'),
    ('omit-final-division', 'Math.floor(securityAdjusted / 100)', 'securityAdjusted'),
)


def run_mutants(listing):
    cases = list(comparison_cases())
    # Keep all branch/type/boundary examples; deterministic mixed cases add no new
    # mutation targets. Each expected receipt still executes the complete caller.
    cases = cases[:-1200]
    expected = [Machine(listing, value).execute() for value in cases]
    refused = list(rejection_cases())
    cases.extend(value for value, _ in refused)
    expected.extend({'expectedRejection': reason} for _, reason in refused)
    original = (ROOT / 'packages/engine/src/city-money-income-projection.ts').read_text()
    reports = []
    with tempfile.TemporaryDirectory(prefix='city-money-ts-mutants-') as directory:
        root = Path(directory)
        shutil.copytree(ROOT / 'packages/engine/src', root / 'packages/engine/src')
        shutil.copyfile(ROOT / 'package.json', root / 'package.json')
        (root / 'scripts').mkdir()
        shutil.copyfile(ROOT / 'scripts/oracle_city_money_income_driver.mjs', root / 'scripts/oracle_city_money_income_driver.mjs')
        # Reproduce the actual index's complete module/import dependency closure.
        for path in (ROOT / 'packages/engine/src').rglob('*.ts'):
            for specifier in re.findall(r"from ['\"]([^'\"]+\.json)['\"]", path.read_text()):
                source = (path.parent / specifier).resolve()
                target = root / source.relative_to(ROOT)
                target.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(source, target)
        actual, _ = product_receipts(cases, root)
        assert all(mismatch(wanted, got) is None for wanted, got in zip(expected, actual)), 'unmodified temporary public-entry control'
        target = root / 'packages/engine/src/city-money-income-projection.ts'
        for name, old, new in MUTATIONS:
            assert original.count(old) == 1, ('mutation target not unique', name)
            target.write_text(original.replace(old, new))
            actual, stream_sha = product_receipts(cases, root)
            differences = [(index, mismatch(wanted, got)) for index, (wanted, got) in enumerate(zip(expected, actual)) if mismatch(wanted, got)]
            assert differences, ('surviving TypeScript mutant', name)
            index, field = differences[0]
            reports.append({'name': name, 'killed': True, 'differingCases': len(differences), 'firstCaseIndex': index,
                'firstMismatch': field, 'input': cases[index], 'mutatedSourceSha256': sha(target.read_bytes()), 'receiptStreamSha256': stream_sha})
    return {'count': len(reports), 'killed': len(reports), 'casesPerMutant': len(cases), 'rows': reports,
        'unmodifiedPublicEntryControlPassed': True, 'actualTypeScriptExecuted': True, 'syntaxErrorsCountedAsKilled': False,
        'publicEntryCopiedUnchanged': True, 'productFilesMutatedInPlace': False,
        'unreachableGuardNotMutated': 'rawMoney*100 cannot overflow within 30 U16-yield slots (maximum 301459500)'}


def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument('--source', type=Path, default=SOURCE)
    parser.add_argument('--gbk', type=Path, default=GBK)
    parser.add_argument('--output', type=Path)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--oracle-only', action='store_true')
    mode.add_argument('--broad', action='store_true')
    mode.add_argument('--mutants', action='store_true')
    args = parser.parse_args()
    listing = load_listing(args.source, args.gbk)
    report = {'profile': PROFILE, 'kind': 'full-caller-byte-interpreter', 'source': independent_disassembly(listing),
        'coverage': None if args.mutants else run_checks(listing, compare_product=not args.oracle_only, broad=args.broad),
        'mutants': run_mutants(listing) if args.mutants else None,
        'mode': 'mutants' if args.mutants else 'broad' if args.broad else 'default',
        'evidenceLevel': 'source-listing-reconstruction', 'stockOriginalVerified': False}
    output = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.output: args.output.write_text(output)
    print(output, end='')


if __name__ == '__main__': main()
