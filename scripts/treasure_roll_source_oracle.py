#!/usr/bin/env python3
"""Independent byte-decoded oracle for the pre-RNG treasure roll argument.

Evidence is a frozen, published source listing, not an authenticated executable.
Only 005D5B45 <= PC < 005D5B6B is executed. The following PUSH and CALL are
authenticated and decoded, but neither is executed; no RNG is modeled or stubbed.
The original ``sar dl,03`` annotation is preserved: C1 FA 03 decodes to SAR EDX,3.
"""
from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/sources/treasure-search-original.gbk'
SOURCE_UTF8 = ROOT / 'docs/sources/treasure-search-original.txt'
PROFILE = 'treasure-roll-resolved-v1'
SOURCE_COMMIT = '66e167e40c3440929ec016f3872aefc3486434c1'
SOURCE_PATH = '内存资料/整理/Func-人才06-执行探索.txt'
SOURCE_SHA = 'b8fb7965114ebc0d26cbb27058367c3a54ff47972bff9ab8dfc9e61867f8560a'
SOURCE_BLOB = '82bff04db2dae9ae0787e1e71ad72f1b4e6852de'
UTF8_SHA = '5cbca6abd2d96ccf6980f26bee3eb4fd31b0baa0a942d65f5efb0d4c30220f0c'
SOURCE_SIZE, UTF8_SIZE = 42874, 44634
CODE_SHA = '938c72b44cad329072c4212548b4878f3d611dbfd3d6f6bd244f714eff3f7ec2'
ENTRY, END, CALL_PC, CALL_END, CALL_TARGET = 0x5D5B45, 0x5D5B6B, 0x5D5B6C, 0x5D5B71, 0x4721D0
MASK = 0xFFFFFFFF
REGISTERS = ('eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi')
BYTE_REGISTERS = ('al', 'cl', 'dl', 'bl', 'ah', 'ch', 'dh', 'bh')
RECORD = struct.Struct('<Biii')
DEFAULT_VALUES = (0, 1, 2, 20, 21, 22, 40, 41, 42, 60, 61, 62, 80, 81, 82, 127, 128, 254, 255)
EVIDENCE = {
    'level': 'source-listing-reconstruction',
    'profile': PROFILE,
    'source': 'docs/sources/treasure-roll-argument.json',
    'originalRange': '005D5B45 <= PC < 005D5B6B',
    'scope': 'already selected candidate; stable resolved uint8 value; pre-RNG roll argument only',
    'listedBytesVerified': True,
    'stockOriginalVerified': False,
    'originalExecutableExecuted': False,
    'nativeHelpersReconstructed': False,
    'callerIntegrated': False,
    'finalProbabilityRecovered': False,
    'rngIntegrated': False,
    'candidateSelectionRecovered': False,
    'ownershipWriterRecovered': False,
    'commandIntegrated': False,
}

# Independently pinned transcription. This deliberately retains the source typo.
PINNED = '''
005D5B45 0fb6573c movzx edx,byte ptr [edi+3c]
005D5B49 b93d000000 mov ecx,0000003d
005D5B4E 2bca sub ecx,edx
005D5B50 b867666666 mov eax,66666667
005D5B55 f7e9 imul ecx
005D5B57 c1fa03 sar dl,03
005D5B5A 8bc2 mov eax,edx
005D5B5C c1e81f shr eax,1f
005D5B5F 03c2 add eax,edx
005D5B61 83f801 cmp eax,01
005D5B64 7d05 jnl 005d5b6b
005D5B66 b801000000 mov eax,00000001
'''.strip()
PINNED_HANDOFF = '''
005D5B6B 50 push eax
005D5B6C e85fc6e9ff call 004721d0
'''.strip()


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def signed(value, width=32):
    value &= (1 << width) - 1
    return value - (1 << width) if value & (1 << (width - 1)) else value


@dataclass(frozen=True)
class Instruction:
    address: int
    raw: bytes
    op: str
    args: tuple[str, ...]
    next_pc: int

    @property
    def mnemonic(self):
        return self.op + (' ' + ','.join(self.args) if self.args else '')


def decode_bytes(raw, address):
    """Decode one exact instruction, using bytes only, never listing mnemonics.

    The deliberately small x86 subset includes mutation variants. Unsupported
    encodings, operands, trailing bytes and truncated instructions fail closed.
    """
    raw = bytes(raw)
    assert raw, 'empty instruction'
    opcode = raw[0]
    op, args, size = None, (), None
    if opcode == 0x0F:
        assert len(raw) >= 4 and raw[1] in (0xB6, 0xBE), 'unsupported two-byte opcode'
        modrm, displacement = raw[2:4]
        assert modrm >> 6 == 1 and modrm & 7 == 7 and displacement < 128, 'unsupported byte memory operand'
        op = 'movzx' if raw[1] == 0xB6 else 'movsx'
        args = (REGISTERS[(modrm >> 3) & 7], f'byte ptr [edi+{displacement:02x}]')
        size = 4
    elif 0xB8 <= opcode <= 0xBF:
        assert len(raw) >= 5, 'truncated MOV immediate'
        op, args, size = 'mov', (REGISTERS[opcode - 0xB8], f'{int.from_bytes(raw[1:5], "little"):08x}'), 5
    elif opcode in (0x2B, 0x8B, 0x03):
        assert len(raw) >= 2 and raw[1] >> 6 == 3, 'unsupported register operand'
        modrm = raw[1]
        op = {0x2B: 'sub', 0x8B: 'mov', 0x03: 'add'}[opcode]
        args, size = (REGISTERS[(modrm >> 3) & 7], REGISTERS[modrm & 7]), 2
    elif opcode == 0xF7:
        assert len(raw) >= 2 and raw[1] >> 6 == 3, 'unsupported multiply operand'
        extension = (raw[1] >> 3) & 7
        assert extension in (4, 5), 'unsupported F7 extension'
        op, args, size = ('imul' if extension == 5 else 'mul'), (REGISTERS[raw[1] & 7],), 2
    elif opcode in (0xC0, 0xC1):
        assert len(raw) >= 3 and raw[1] >> 6 == 3, 'unsupported shift operand'
        extension = (raw[1] >> 3) & 7
        assert extension in (5, 7), 'unsupported shift extension'
        registers = REGISTERS if opcode == 0xC1 else BYTE_REGISTERS
        op, args, size = ('sar' if extension == 7 else 'shr'), (registers[raw[1] & 7], f'{raw[2]:02x}'), 3
    elif opcode == 0x83:
        assert len(raw) >= 3 and raw[1] >> 6 == 3 and (raw[1] >> 3) & 7 == 7, 'unsupported immediate comparison'
        op, args, size = 'cmp', (REGISTERS[raw[1] & 7], f'{raw[2]:02x}'), 3
    elif opcode in (0x7D, 0x7C, 0x7F, 0x73):
        assert len(raw) >= 2, 'truncated conditional branch'
        target = address + 2 + signed(raw[1], 8)
        op = {0x7D: 'jnl', 0x7C: 'jl', 0x7F: 'jg', 0x73: 'jae'}[opcode]
        args, size = (f'{target:08x}',), 2
    elif 0x50 <= opcode <= 0x57:
        op, args, size = 'push', (REGISTERS[opcode - 0x50],), 1
    elif opcode == 0xE8:
        assert len(raw) >= 5, 'truncated CALL'
        target = address + 5 + int.from_bytes(raw[1:5], 'little', signed=True)
        op, args, size = 'call', (f'{target:08x}',), 5
    else:
        raise AssertionError(f'unsupported opcode {opcode:02x} at {address:08X}')
    assert len(raw) == size, f'instruction length mismatch at {address:08X}'
    return Instruction(address, raw, op, args, address + size)


def parse_listing(text):
    rows = []
    for line in text.splitlines():
        m = re.match(r'^([0-9A-F]{8}) - ([0-9a-f ]+?)\s+- ([a-z]+)(?:\s+([^\u0080-\uffff]*))?', line)
        if not m or not ENTRY <= int(m[1], 16) < CALL_END:
            continue
        address, raw, op, args = m.groups()
        args = (args or '').strip().split('  ')[0].strip()
        rows.append((address, raw.replace(' ', ''), op, args))
    canonical = '\n'.join(' '.join(row).rstrip() for row in rows)
    assert canonical == PINNED + '\n' + PINNED_HANDOFF, 'pinned source address/byte/mnemonic listing changed'
    code, context, pc = {}, {}, ENTRY
    for address, raw, op, args in rows:
        a = int(address, 16)
        assert a == pc, 'instruction byte continuity broken'
        instruction = decode_bytes(bytes.fromhex(raw), a)
        mnemonic = op + (' ' + args if args else '')
        if a == 0x5D5B57:
            assert instruction.raw == bytes.fromhex('c1fa03') and mnemonic == 'sar dl,03'
            mnemonic = 'sar edx,03'
        assert instruction.mnemonic == mnemonic, f'byte-decoded mnemonic mismatch at {address}'
        (code if a < END else context)[a] = instruction
        pc = instruction.next_pc
    assert len(code) == 12 and sum(len(i.raw) for i in code.values()) == 38
    assert code[0x5D5B66].next_pc == END and pc == CALL_END
    assert sha(b''.join(i.raw for i in code.values())) == CODE_SHA
    branch = code[0x5D5B64]
    assert branch.op == 'jnl' and int(branch.args[0], 16) == END
    assert branch.next_pc in code and END not in code
    assert all(i.op not in ('call', 'push', 'ret') for i in code.values())
    assert context[END].op == 'push' and context[END].args == ('eax',) and context[END].next_pc == CALL_PC
    assert context[CALL_PC].op == 'call' and int(context[CALL_PC].args[0], 16) == CALL_TARGET
    return code


def load_listing(path=SOURCE, utf8_path=SOURCE_UTF8):
    raw, utf8 = Path(path).read_bytes(), Path(utf8_path).read_bytes()
    assert len(raw) == SOURCE_SIZE and sha(raw) == SOURCE_SHA, 'complete GBK source bytes changed'
    assert hashlib.sha1(f'blob {len(raw)}\0'.encode('ascii') + raw).hexdigest() == SOURCE_BLOB
    assert len(utf8) == UTF8_SIZE and sha(utf8) == UTF8_SHA, 'complete UTF-8 source bytes changed'
    text = raw.decode('gbk')
    assert text.encode('gbk') == raw and text.encode('utf-8') == utf8, 'source encoding round trip changed'
    return parse_listing(text)


class ListingMachine:
    """Small uint32 register/flag interpreter with one already-resolved byte read."""
    TREASURE = 0x200000

    def __init__(self, code, treasureValueU8, *, register_poison=0xA5B6C7D8):
        assert type(treasureValueU8) is int and 0 <= treasureValueU8 <= 255
        self.code, self.pc = code, ENTRY
        self.r = {name: register_poison & MASK for name in REGISTERS}
        self.r['edi'] = self.TREASURE
        self.mem = {self.TREASURE + 0x3C: treasureValueU8}
        self.zf = self.sf = self.of = self.cf = False
        self.trace, self.reads, self.calls, self.snapshots = [], [], [], []
        self.branches, self.observed = set(), {}

    def read(self, operand):
        if operand in self.r:
            return self.r[operand]
        if operand in BYTE_REGISTERS:
            n = BYTE_REGISTERS.index(operand)
            return (self.r[REGISTERS[n % 4]] >> (8 if n >= 4 else 0)) & 255
        m = re.fullmatch(r'byte ptr \[edi\+([0-9a-f]{2})\]', operand)
        if m:
            address = (self.r['edi'] + int(m[1], 16)) & MASK
            value = self.mem[address]
            self.reads.append((self.pc, address, value))
            return value
        return int(operand, 16)

    def write(self, operand, value):
        if operand in BYTE_REGISTERS:
            n = BYTE_REGISTERS.index(operand)
            reg, shift = REGISTERS[n % 4], (8 if n >= 4 else 0)
            self.r[reg] = (self.r[reg] & ~(255 << shift)) | ((value & 255) << shift)
        else:
            assert operand in self.r, operand
            self.r[operand] = value & MASK

    def flags(self, left, right, subtract):
        left, right = left & MASK, right & MASK
        result = (left - right if subtract else left + right) & MASK
        self.zf, self.sf = result == 0, bool(result & 0x80000000)
        self.of = bool(((left ^ right) & (left ^ result) if subtract else ~(left ^ right) & (left ^ result)) & 0x80000000)
        self.cf = left < right if subtract else left + right > MASK
        return result

    def shift(self, operand, count, arithmetic):
        width = 8 if operand in BYTE_REGISTERS else 32
        value = self.read(operand)
        self.write(operand, (signed(value, width) if arithmetic else value) >> (count & 31))

    def run(self):
        for _ in range(32):
            if self.pc == END:
                assert self.calls == [] and END not in self.trace and CALL_PC not in self.trace
                return {
                    'numerator': self.observed['numerator'],
                    'quotient': self.observed['quotient'],
                    'rollArgument': signed(self.r['eax']),
                    'branch': 'minimum-clamp' if 0x5D5B66 in self.trace else 'quotient',
                }
            assert ENTRY <= self.pc < END, 'execution left the pre-RNG kernel'
            i = self.code[self.pc]
            self.trace.append(self.pc)
            self.snapshots.append((self.pc, dict(self.r)))
            if self.pc == 0x5D5B50:
                self.observed['numerator'] = signed(self.r['ecx'])
            if self.pc == 0x5D5B61:
                self.observed['quotient'] = signed(self.r['eax'])
            args, op, next_pc = i.args, i.op, i.next_pc
            if op in ('mov', 'movzx', 'movsx'):
                value = self.read(args[1])
                self.write(args[0], signed(value, 8) if op == 'movsx' else value)
            elif op in ('sub', 'add', 'cmp'):
                right = self.read(args[1])
                if op == 'cmp' and i.raw[0] == 0x83:
                    right = signed(right, 8)
                value = self.flags(self.read(args[0]), right, op in ('sub', 'cmp'))
                if op != 'cmp':
                    self.write(args[0], value)
            elif op in ('imul', 'mul'):
                left, right = self.r['eax'], self.read(args[0])
                product = signed(left) * signed(right) if op == 'imul' else left * right
                self.write('eax', product)
                self.write('edx', product >> 32)
                self.observed['multiplyHighSigned'] = signed(self.r['edx'])
            elif op in ('sar', 'shr'):
                self.shift(args[0], self.read(args[1]), op == 'sar')
            elif op in ('jnl', 'jl', 'jg', 'jae'):
                take = {'jnl': self.sf == self.of, 'jl': self.sf != self.of,
                        'jg': not self.zf and self.sf == self.of, 'jae': not self.cf}[op]
                self.branches.add((self.pc, take))
                if take:
                    next_pc = int(args[0], 16)
            else:
                raise AssertionError(f'no execution allowed for {op}')
            self.pc = next_pc
        raise AssertionError('nonterminating listing')


def run_node(script, binary=False):
    result = subprocess.run(['node', '--input-type=module', '-e', script], cwd=ROOT, capture_output=True)
    assert result.returncode == 0, result.stderr.decode()
    return result.stdout if binary else json.loads(result.stdout)


def compare_public(code, values):
    values = tuple(values)
    expected, coverage, trace = bytearray(), set(), set()
    results = []
    for value in values:
        machine = ListingMachine(code, value)
        result = machine.run()
        expected.extend(RECORD.pack(('minimum-clamp', 'quotient').index(result['branch']),
                                    result['numerator'], result['quotient'], result['rollArgument']))
        results.append(result)
        coverage |= machine.branches
        trace.update(machine.trace)
        assert machine.pc == END and len(machine.reads) == 1 and machine.calls == []
        assert machine.reads[0] == (ENTRY, machine.TREASURE + 0x3C, value)
        for poison in (0, MASK, 0x12345678):
            assert ListingMachine(code, value, register_poison=poison).run() == result
    script = '''
      import assert from 'node:assert/strict';
      import {calculateTreasureRollArgument as calculate} from './packages/engine/src/index.ts';
      const values=VALUES, out=Buffer.alloc(values.length*13);let offset=0;
      for(const treasureValueU8 of values){
        const input={profile:'treasure-roll-resolved-v1',treasureValueU8};
        const r=calculate(input);assert.equal(r.supported,true);assert.equal(r.profile,input.profile);
        assert.equal(r.treasureValueU8,treasureValueU8);
        assert.deepEqual(r.evidence,EXPECTED_EVIDENCE);
        assert.ok(Object.isFrozen(r));assert.ok(Object.isFrozen(r.evidence));
        for(const key of ['numerator','quotient','rollArgument']){
          assert.equal(Number.isSafeInteger(r[key]),true);assert.equal(Object.is(r[key],-0),false);
        }
        const branch=['minimum-clamp','quotient'].indexOf(r.branch);assert.ok(branch>=0);
        out[offset]=branch;out.writeInt32LE(r.numerator,offset+1);out.writeInt32LE(r.quotient,offset+5);
        out.writeInt32LE(r.rollArgument,offset+9);offset+=13;
      }
      process.stdout.write(out);
    '''.replace('VALUES', json.dumps(values)).replace('EXPECTED_EVIDENCE', json.dumps(EVIDENCE))
    actual = run_node(script, binary=True)
    assert len(actual) == len(expected) == len(values) * RECORD.size
    if actual != expected:
        for index, value in enumerate(values):
            start = index * RECORD.size
            want, got = expected[start:start + RECORD.size], actual[start:start + RECORD.size]
            assert want == got, f'public API disagrees with decoded listing at treasureValueU8={value}: expected={RECORD.unpack(want)}, actual={RECORD.unpack(got)}'
    return {
        'comparisons': len(values), 'mismatches': 0,
        'expectedSha256': sha(expected), 'actualPublicExportSha256': sha(actual),
        'conditionalBranches': 1, 'outcomesCovered': len(coverage), 'instructionsCovered': len(trace),
        'record': 'LE uint8 branch (0 minimum-clamp, 1 quotient), int32 numerator/quotient/rollArgument',
        'externalCallsExecuted': 0, 'stoppedBeforePushAndCall': True,
    }, results


def check_examples(code):
    comparison, results = compare_public(code, DEFAULT_VALUES)
    assert comparison['outcomesCovered'] == 2 and comparison['instructionsCovered'] == 12
    # Threshold assertions make sign, division, branch equality and final clamp visible.
    indexed = dict(zip(DEFAULT_VALUES, results))
    for value, expected in {
        0: (61, 3, 3, 'quotient'), 1: (60, 3, 3, 'quotient'),
        2: (59, 2, 2, 'quotient'), 21: (40, 2, 2, 'quotient'),
        22: (39, 1, 1, 'quotient'), 41: (20, 1, 1, 'quotient'),
        42: (19, 0, 1, 'minimum-clamp'), 61: (0, 0, 1, 'minimum-clamp'),
        62: (-1, 0, 1, 'minimum-clamp'), 80: (-19, 0, 1, 'minimum-clamp'),
        81: (-20, -1, 1, 'minimum-clamp'), 82: (-21, -1, 1, 'minimum-clamp'),
        255: (-194, -9, 1, 'minimum-clamp'),
    }.items():
        assert tuple(indexed[value][key] for key in ('numerator', 'quotient', 'rollArgument', 'branch')) == expected
    return {**comparison, 'cases': [{'treasureValueU8': v, 'result': r} for v, r in zip(DEFAULT_VALUES, results)]}


def exhaustive(code):
    comparison, results = compare_public(code, range(256))
    assert comparison['outcomesCovered'] == 2 and comparison['instructionsCovered'] == 12
    bins = Counter(r['rollArgument'] for r in results)
    branches = Counter(r['branch'] for r in results)
    assert bins == {1: 234, 2: 20, 3: 2}
    assert branches == {'quotient': 42, 'minimum-clamp': 214}
    return {**comparison, 'treasureValueU8': 'all 256 bytes',
            'numeratorRange': [min(r['numerator'] for r in results), max(r['numerator'] for r in results)],
            'quotientRange': [min(r['quotient'] for r in results), max(r['quotient'] for r in results)],
            'rollArgumentCounts': dict(sorted(bins.items())), 'branchCounts': dict(branches)}


def check_mutations(code):
    # Mutations are changes to encoded instructions, decoded again independently.
    # Tiny multiplier changes are killed at exact multiples of the divisor.
    variants = (
        ('constant-60-instead-of-61', 0x5D5B49, 'b93c000000'),
        ('constant-62-instead-of-61', 0x5D5B49, 'b93e000000'),
        ('signed-byte-instead-of-zero-extension', ENTRY, '0fbe573c'),
        ('multiplier-one-too-small', 0x5D5B50, 'b866666666'),
        ('wrong-magic-multiplier', 0x5D5B50, 'b867656666'),
        ('unsigned-MUL-instead-of-signed-IMUL', 0x5D5B55, 'f7e1'),
        ('logical-SHR-instead-of-SAR-EDX', 0x5D5B57, 'c1ea03'),
        ('SAR-EDX-shift-two', 0x5D5B57, 'c1fa02'),
        ('SAR-EDX-shift-four', 0x5D5B57, 'c1fa04'),
        ('SAR-EAX-instead-of-sign-SHR', 0x5D5B5C, 'c1f81f'),
        ('sign-SHR-shift-thirty', 0x5D5B5C, 'c1e81e'),
        ('remove-sign-correction', 0x5D5B5F, '8bc2'),
        ('subtract-sign-correction', 0x5D5B5F, '2bc2'),
        ('compare-zero-instead-of-one', 0x5D5B61, '83f800'),
        ('reverse-signed-branch', 0x5D5B64, '7c05'),
        ('strict-greater-instead-of-greater-equal', 0x5D5B64, '7f05'),
        ('unsigned-branch-instead-of-signed', 0x5D5B64, '7305'),
        ('minimum-zero-instead-of-one', 0x5D5B66, 'b800000000'),
        ('minimum-two-instead-of-one', 0x5D5B66, 'b802000000'),
    )
    expected = [ListingMachine(code, value).run() for value in range(256)]
    killed, witnesses = [], []
    for name, address, raw in variants:
        mutated = dict(code)
        replacement = decode_bytes(bytes.fromhex(raw), address)
        assert replacement.next_pc == code[address].next_pc
        mutated[address] = replacement
        mismatches = []
        for value, wanted in enumerate(expected):
            got = ListingMachine(mutated, value).run()
            if got != wanted:
                mismatches.append((value, wanted, got))
        assert mismatches, 'surviving byte mutation: ' + name
        value, wanted, got = mismatches[0]
        killed.append(name)
        witnesses.append({'mutation': name, 'treasureValueU8': value, 'expected': wanted,
                          'mutated': got, 'casesKilled': len(mismatches)})

    # A final-output-only check cannot distinguish floor from truncation here.
    # Negative intermediate quotient observations must therefore be compared too.
    floor_witnesses = []
    for value, wanted in enumerate(expected):
        quotient = wanted['numerator'] // 20
        if quotient != wanted['quotient']:
            assert max(1, quotient) == wanted['rollArgument'] == 1
            floor_witnesses.append({'treasureValueU8': value, 'numerator': wanted['numerator'],
                                   'expectedQuotient': wanted['quotient'], 'floorQuotient': quotient,
                                   'sameFinalRollArgument': 1})
    assert len(floor_witnesses) == 185 and floor_witnesses[0]['treasureValueU8'] == 62
    killed.append('floor-instead-of-truncation-before-clamp')

    # All reachable IMUL high words fit signed int8, making a genuine SAR DL
    # mutation numerically equivalent on this particular input domain. Kill it
    # by authenticated encoding and separately prove the decoder's width rule;
    # do not invent a valid-input numerical counterexample.
    dl_code = dict(code)
    dl_code[0x5D5B57] = decode_bytes(bytes.fromhex('c0fa03'), 0x5D5B57)
    high_words = []
    for value, wanted in enumerate(expected):
        original = ListingMachine(code, value)
        assert original.run() == wanted
        high_words.append(original.observed['multiplyHighSigned'])
        assert ListingMachine(dl_code, value).run() == wanted
    assert min(high_words) == -78 and max(high_words) == 24
    synthetic_source = '\n'.join(f'{address} - {raw} - {mnemonic}'
                                 for address, raw, mnemonic in
                                 (line.split(' ', 2) for line in (PINNED + '\n' + PINNED_HANDOFF).splitlines()))
    assert parse_listing(synthetic_source) == code
    corrupted = synthetic_source.replace('005D5B57 - c1fa03', '005D5B57 - c0fa03')
    try:
        parse_listing(corrupted)
    except AssertionError:
        pass
    else:
        raise AssertionError('source-DL encoding mutation survived byte authentication')
    width_probes = []
    for edx in (0x100, 0xFFFFFF00):
        correct, dl = ListingMachine(code, 0), ListingMachine(code, 0)
        correct.r['edx'] = dl.r['edx'] = edx
        correct.shift('edx', 3, True)
        dl.shift('dl', 3, True)
        assert correct.r['edx'] != dl.r['edx']
        width_probes.append({'initialEdx': f'{edx:08X}', 'sarEdxResult': signed(correct.r['edx']),
                             'sarDlResult': signed(dl.r['edx']), 'reachableFromValidInput': False})
    return {'instructionMutationsKilled': killed, 'mutationWitnesses': witnesses,
            'byteAuthenticationMutationsKilled': ['source-DL-typo-executed'],
            'dlWidthMutation': {'validInputNumericalMismatches': 0, 'validInputsChecked': 256,
                                'reachableMultiplyHighRange': [min(high_words), max(high_words)],
                                'killedBy': 'frozen source byte authentication (C1, not C0)',
                                'independentWidthProbes': width_probes},
            'floorVsTruncation': {'mutationKilled': True, 'intermediateQuotientMismatches': len(floor_witnesses),
                                 'finalRollArgumentMismatches': 0, 'witness': floor_witnesses[0]}}


def check_api_contract():
    return run_node('''
      import assert from 'node:assert/strict';
      import {calculateTreasureRollArgument as calculate} from './packages/engine/src/index.ts';
      const input=()=>({profile:'treasure-roll-resolved-v1',treasureValueU8:62});
      const invalid=[null,undefined,[],1,'1',true,()=>{},{},{...input(),profile:'unknown'},
        {...input(),extra:1},Object.create(input()),new Map(),new Date(),new Number(1)];
      for(const key of Object.keys(input())){const x=input();delete x[key];invalid.push(x)}
      for(const v of [-1,256,1.5,NaN,Infinity,-Infinity,'1',null,undefined,true,false,1n,new Number(1)])
        invalid.push({...input(),treasureValueU8:v});
      for(const profile of [null,undefined,1,true,{},Symbol('profile')])invalid.push({...input(),profile});
      const sym=input();sym[Symbol('x')]=1;invalid.push(sym);
      const hidden=input();Object.defineProperty(hidden,'extra',{value:1});invalid.push(hidden);
      let invoked=0;
      for(const key of Object.keys(input())){
        const x=input();Object.defineProperty(x,key,{get(){invoked++;throw Error('getter invoked')}});invalid.push(x);
        const setter=input();Object.defineProperty(setter,key,{set(){invoked++;throw Error('setter invoked')}});invalid.push(setter);
      }
      for(const extra of ['pointer','treasureId','chance','probability','rng','ownership'])invalid.push({...input(),[extra]:1});
      function frozen(x){if(x!==null&&typeof x==='object'){assert.ok(Object.isFrozen(x));for(const v of Object.values(x))frozen(v)}}
      for(const x of invalid){
        const r=calculate(x);assert.equal(r.supported,false);assert.equal(typeof r.reason,'string');
        for(const key of ['numerator','quotient','rollArgument','branch'])assert.equal(key in r,false);
        assert.deepEqual(r.evidence,EXPECTED_EVIDENCE);frozen(r);
      }
      assert.equal(invoked,0);
      const zero=calculate({...input(),treasureValueU8:-0});assert.equal(zero.supported,true);
      assert.equal(Object.is(zero.treasureValueU8,-0),false);assert.equal(zero.rollArgument,3);
      assert.equal(calculate(Object.assign(Object.create(null),input())).supported,true);
      const hiddenRequired=input();Object.defineProperty(hiddenRequired,'treasureValueU8',{value:62,enumerable:false});
      assert.equal(calculate(hiddenRequired).supported,true);
      const ordinary=input(), before=JSON.stringify(ordinary), result=calculate(ordinary);
      assert.equal(result.supported,true);assert.equal(result.numerator,-1);assert.equal(result.quotient,0);
      assert.equal(Object.is(result.quotient,-0),false);assert.equal(result.rollArgument,1);assert.equal(result.branch,'minimum-clamp');
      frozen(result);assert.equal(JSON.stringify(ordinary),before);
      for(let treasureValueU8=62;treasureValueU8<=80;treasureValueU8++){
        const r=calculate({...input(),treasureValueU8});assert.equal(r.quotient,0);assert.equal(Object.is(r.quotient,-0),false);
      }
      process.stdout.write(JSON.stringify({rejectedInputs:invalid.length,accessorsInvoked:invoked,
        deepFrozen:true,inputUnchanged:true,negativeZeroNormalized:true}));
    '''.replace('EXPECTED_EVIDENCE', json.dumps(EVIDENCE)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exhaustive', action='store_true')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    code = load_listing()
    report = {
        'level': 'source-listing-reconstruction', 'sourceCommit': SOURCE_COMMIT,
        'sourceSha256': SOURCE_SHA, 'sourceGitBlobSha1': SOURCE_BLOB, 'utf8Sha256': UTF8_SHA,
        'listedBytesSha256': CODE_SHA, 'instructionCount': 12, 'listedBytes': 38,
        'machineCodeVerified': False, 'stockOriginalVerified': False, 'originalExecutableExecuted': False,
        'evidence': EVIDENCE,
        'handoff': {'push': '005D5B6B', 'call': '005D5B6C', 'target': '004721D0',
                    'sourceBytesVerified': True, 'pushExecuted': False, 'callExecuted': False,
                    'rngModeled': False},
        'mnemonicCorrection': {'address': '005D5B57', 'bytes': 'C1 FA 03',
                               'original': 'sar dl,03', 'decoded': 'sar edx,03'},
        'examples': check_examples(code), 'apiContract': check_api_contract(), **check_mutations(code),
    }
    if args.exhaustive:
        report['exhaustive'] = exhaustive(code)
    output = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.output:
        args.output.write_text(output, encoding='utf-8')
    print(output, end='')


if __name__ == '__main__':
    main()
