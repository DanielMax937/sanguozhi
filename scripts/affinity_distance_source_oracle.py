#!/usr/bin/env python3
"""Independent restricted interpreter of a pinned tutorial's 37 mnemonics.

This is a tutorial-source-projection, never an opcode decoder or stock emulator.
It executes the full listed entry. Only GetPersonPtr and IsLegalPtr are opaque
observation stubs; their bodies and the game's memory/runtime are not recovered.
--exhaustive compares every uint8 pair with the actual TypeScript public export.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass, replace
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PROFILE = 'affinity-distance-tutorial-u8-v1'
SOURCE = ROOT / 'docs/sources/affinity-distance-tutorial-original.md'
SOURCE_SHA = 'd5e496619ce21736861f796223523e3897591a2b3374e482aa0505b03606acb3'
SOURCE_BLOB = '82420492d65150f217effd8cb6b93febdf1c3c2d'
MASK = 0xffffffff
ENTRY = 0x00489f80
RECORD = struct.Struct('<IiBiIB')
EVIDENCE = {
    'level': 'tutorial-source-projection', 'profile': PROFILE,
    'source': 'docs/sources/affinity-distance.json',
    'originalRange': '00489F80..00489FD7',
    'scope': 'resolved unsigned affinity bytes; numerical return only',
    'opcodeBytes': None, 'machineCodeVerified': False,
    'stockOriginalVerified': False, 'originalExecutableExecuted': False,
    's1CallerIntegrated': False, 'loyaltyIntegrated': False,
    'recruitmentIntegrated': False,
}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def signed(value, bits=32):
    value &= (1 << bits) - 1
    return value - (1 << bits) if value & (1 << (bits - 1)) else value


@dataclass(frozen=True)
class Instruction:
    address: int
    op: str
    args: tuple[str, ...]
    next_pc: int | None


def parse_listing(text):
    """Read instruction lines, ignoring labels/comments; never synthesize bytes."""
    rows = []
    for line in text.splitlines():
        match = re.fullmatch(
            r'\s*\.text:([0-9A-F]{8})\s+([a-z]+)\s+([^;]*?)(?:\s*;.*)?', line)
        if not match:
            continue
        address, op, operands = int(match[1], 16), match[2], match[3].strip()
        if ENTRY <= address <= 0x489fd7:
            assert op in {'mov','test','push','pop','jl','jle','xor','retn','call',
                          'add','jz','movzx','sub','jns','neg','cmp'}, (hex(address), op)
            rows.append((address, op, tuple(x.strip() for x in operands.split(','))))
    assert len(rows) == 37
    addresses = [row[0] for row in rows]
    assert addresses == sorted(set(addresses)) and addresses[0] == ENTRY and addresses[-1] == 0x489fd7
    result = {a: Instruction(a, op, args, rows[i+1][0] if i+1 < len(rows) else None)
              for i, (a, op, args) in enumerate(rows)}
    for ins in result.values():
        if ins.op.startswith('j'):
            assert int(ins.args[0].split('loc_')[1], 16) in result
    return result


def load_listing(path=SOURCE):
    raw = path.read_bytes()
    assert len(raw) == 33369 and sha(raw) == SOURCE_SHA
    assert hashlib.sha1(b'blob 33369\0' + raw).hexdigest() == SOURCE_BLOB
    return parse_listing(raw.decode('utf-8'))


class TutorialMachine:
    STACK, RETURN, SOURCE_PTR, TARGET_PTR = 0x100000, 0x1234abcd, 0x200000, 0x300000

    def __init__(self, listing, source_byte=1, target_byte=149, *, target_id=7,
                 validator_eax=1, target_pointer=TARGET_PTR, source_readable=True,
                 target_readable=True, mutate_source_after_target=None, stub_mutation=None):
        assert 0 <= source_byte <= 255 and 0 <= target_byte <= 255
        assert -(1 << 31) <= target_id <= MASK
        assert 0 <= validator_eax <= MASK
        self.code = listing
        self.pc = ENTRY
        self.r = dict(eax=0xaaaaaaaa, ecx=self.SOURCE_PTR, edx=0xbbbbbbbb,
                      ebx=0x13579bdf, ebp=0x2468ace0, esi=0xabcdef01,
                      edi=0x98765432, esp=self.STACK)
        self.saved = {r: self.r[r] for r in ('ebx','ebp','esi','edi')}
        self.mem = {self.STACK: self.RETURN, self.STACK+4: target_id & MASK}
        self.bytes = {}
        if source_readable:
            self.bytes[self.SOURCE_PTR+0x69] = source_byte
        if target_readable:
            self.bytes[target_pointer+0x69] = target_byte
        self.target_id = target_id & MASK
        self.validator = validator_eax
        self.target_pointer = target_pointer
        self.source_mutation = mutate_source_after_target
        self.stub_mutation = stub_mutation
        self.zf = self.sf = self.of = self.cf = False
        self.calls, self.reads, self.trace = [], [], []
        self.branches = set()
        self.observed = {}

    def address(self, operand):
        match = re.fullmatch(r'\[(e[a-z]{2})\+(arg_0|[0-9A-Fa-f]+h)\]', operand)
        assert match is not None, operand
        displacement = 4 if match[2] == 'arg_0' else int(match[2][:-1], 16)
        return (self.r[match[1]] + displacement) & MASK

    def read(self, operand):
        if operand in self.r:
            return self.r[operand]
        if operand == 'al':
            return self.r['eax'] & 255
        if operand.startswith('byte ptr '):
            address = self.address(operand[9:])
            value = self.bytes[address]
            self.reads.append({'pc': f'{self.pc:08X}', 'address': address, 'width': 1, 'value': value})
            if address == self.target_pointer+0x69 and self.source_mutation is not None:
                self.bytes[self.SOURCE_PTR+0x69] = self.source_mutation
            return value
        if operand.startswith('['):
            return self.mem[self.address(operand)]
        if operand == 'offset dword_7201958':
            return 0x7201958
        if operand.endswith('h'):
            return int(operand[:-1], 16)
        return int(operand)

    def write(self, operand, value):
        if operand == 'al':
            self.r['eax'] = (self.r['eax'] & 0xffffff00) | (value & 255)
        else:
            assert operand in self.r, operand
            self.r[operand] = value & MASK

    def flags(self, a, b, operation, width=32):
        mask, sign = (1 << width)-1, 1 << (width-1)
        a, b = a & mask, b & mask
        if operation == 'sub':
            result = (a-b) & mask
            self.cf, self.of = a < b, bool((a ^ b) & (a ^ result) & sign)
        elif operation == 'add':
            result = (a+b) & mask
            self.cf, self.of = a+b > mask, bool(~(a ^ b) & (a ^ result) & sign)
        else:
            result = (a & b) if operation == 'test' else (a ^ b)
            self.cf = self.of = False
        self.zf, self.sf = result == 0, bool(result & sign)
        return result

    def push(self, value):
        self.r['esp'] = (self.r['esp']-4) & MASK
        self.mem[self.r['esp']] = value & MASK

    def pop(self):
        value = self.mem[self.r['esp']]
        self.r['esp'] = (self.r['esp']+4) & MASK
        return value

    def call(self, name, next_pc):
        self.push(next_pc)
        argument = self.mem[self.r['esp']+4]
        self.calls.append({'pc': f'{self.pc:08X}', 'name': name,
                           'argument': argument, 'ecx': self.r['ecx']})
        if name == 'GetPersonPtr':
            assert argument == self.target_id and self.r['ecx'] == 0x7201958
            self.r['eax'] = self.target_pointer
            cleanup = 0 if self.stub_mutation == 'get-person-omits-cleanup' else 4
            # Explicit opaque ABI stub, not a recovered callee body.
        elif name == 'IsLegalPtr':
            assert argument == self.target_pointer
            self.r['eax'] = 1 if self.stub_mutation == 'validator-forced-success' else self.validator
            cleanup = 4 if self.stub_mutation == 'validator-double-cleanup' else 0
            # Caller ADD ESP,4 is in the captured entry.
        else:
            raise ValueError('unresolved external call: '+name)
        # Deliberately clobber caller-saved registers to prevent accidental reliance.
        self.r['ecx'], self.r['edx'] = 0xfedcba98, 0x87654321
        assert self.pop() == next_pc
        self.r['esp'] += cleanup

    def run(self):
        for _ in range(100):
            ins = self.code[self.pc]
            self.trace.append(self.pc)
            op, args, next_pc = ins.op, ins.args, ins.next_pc
            if self.pc == 0x489fc1:
                self.observed['absoluteDifference'] = self.r['eax']
            if self.pc == 0x489fc8:
                self.observed['complement'] = signed(self.r['ecx'])
            if op in ('mov','movzx','movsx'):
                value = self.read(args[1])
                self.write(args[0], signed(value, 8) if op == 'movsx' else value)
            elif op == 'push':
                self.push(self.read(args[0]))
            elif op == 'pop':
                self.write(args[0], self.pop())
            elif op == 'call':
                self.call(args[0], next_pc)
            elif op in ('test','cmp','sub','add','xor'):
                width = 8 if args[0] == 'al' else 32
                result = self.flags(self.read(args[0]), self.read(args[1]),
                                    'sub' if op == 'cmp' else op, width)
                if op not in ('test','cmp'):
                    self.write(args[0], result)
            elif op == 'neg':
                self.write(args[0], self.flags(0, self.read(args[0]), 'sub'))
            elif op in ('jl','jle','jz','jns','jb','jbe','js'):
                take = {'jl': self.sf != self.of, 'jle': self.zf or self.sf != self.of,
                        'jz': self.zf, 'jns': not self.sf, 'jb': self.cf,
                        'jbe': self.cf or self.zf, 'js': self.sf}[op]
                self.branches.add((self.pc, take))
                if self.pc == 0x489fca:
                    self.observed['signedComparisonBranch'] = 'keep-d' if take else 'use-complement'
                if take:
                    next_pc = int(args[0].split('loc_')[1], 16)
            elif op == 'retn':
                assert self.pop() == self.RETURN, 'return address corrupted'
                self.r['esp'] += self.read(args[0])
                assert self.r['esp'] == self.STACK+8, 'callee stack cleanup mismatch'
                assert all(self.r[r] == value for r, value in self.saved.items()), 'callee-saved register corrupted'
                return {**self.observed, 'returnedSigned32': signed(self.r['eax']),
                        'returnedEax': self.r['eax'], 'returnedAl': self.r['eax'] & 255}
            else:
                raise ValueError('unsupported mnemonic: '+op)
            assert next_pc is not None
            self.pc = next_pc
        raise AssertionError('instruction bound exceeded')


def run_node(script, *, data=None, binary=False):
    result = subprocess.run(['node','--input-type=module','-e',script], cwd=ROOT,
                            input=None if data is None else json.dumps(data).encode(),
                            capture_output=True)
    if result.returncode:
        raise AssertionError(result.stderr.decode())
    return result.stdout if binary else json.loads(result.stdout)


def production(cases):
    return run_node("""
      import {readFileSync} from 'node:fs';
      import {calculateAffinityDistance as calculate} from './packages/engine/src/index.ts';
      const cases=JSON.parse(readFileSync(0,'utf8'));
      const out=cases.map(([a,b])=>calculate({profile:'affinity-distance-tutorial-u8-v1',sourceAffinityByte:a,targetAffinityByte:b}));
      process.stdout.write(JSON.stringify(out));
    """, data=cases)


def compare_receipt(actual, expected, source, target):
    assert actual['supported'] is True and actual['profile'] == PROFILE
    assert actual['sourceAffinityByte'] == source and actual['targetAffinityByte'] == target
    assert actual['evidence'] == EVIDENCE
    assert {key: actual[key] for key in expected} == expected


def check_examples(listing):
    values = (0,1,74,75,76,127,128,149,150,151,254,255)
    cases = [(a,b) for a in values for b in values]
    actual = production(cases)
    instructions, branches = set(), set()
    for (a,b), receipt in zip(cases, actual, strict=True):
        machine = TutorialMachine(listing, a, b, target_id=1099, validator_eax=0x80000000)
        expected = machine.run()
        compare_receipt(receipt, expected, a, b)
        instructions.update(machine.trace); branches.update(machine.branches)
        assert [call['name'] for call in machine.calls] == ['GetPersonPtr','IsLegalPtr']
        assert [read['pc'] for read in machine.reads] == ['00489FB3','00489FB7']
    gates = []
    for target_id in (-2147483648,-257,-1,1100,0x7fffffff,0x80000000,0xffffffff):
        machine = TutorialMachine(listing, target_id=target_id, source_readable=False, target_readable=False)
        receipt = machine.run()
        assert receipt['returnedEax'] == (target_id & 0xffffff00) and receipt['returnedAl'] == 0
        assert not machine.calls and not machine.reads
        instructions.update(machine.trace); branches.update(machine.branches)
        gates.append({'targetIdWord': target_id & MASK, 'returnedEax': receipt['returnedEax'],
                      'returnedAl': 0, 'externalCalls': 0, 'affinityReads': 0})
    for target_id in (0,1099):
        machine = TutorialMachine(listing, target_id=target_id, validator_eax=0,
                                  target_pointer=0, source_readable=False, target_readable=False)
        result = machine.run()
        assert result == {'returnedSigned32': 0, 'returnedEax': 0, 'returnedAl': 0}
        assert len(machine.calls) == 2 and not machine.reads
        instructions.update(machine.trace); branches.update(machine.branches)
    for validator in (1,255,256,257,0x80000000,0xffffffff):
        machine = TutorialMachine(listing, 1,149, validator_eax=validator)
        assert machine.run()['returnedSigned32'] == 2 and len(machine.reads) == 2
    # The tutorial doesn't validate ECX/source; a valid target still reads it.
    try:
        TutorialMachine(listing, source_readable=False).run()
    except KeyError:
        pass
    else:
        raise AssertionError('source pointer incorrectly treated as validated')
    machine = TutorialMachine(listing, 1,149, mutate_source_after_target=148)
    assert machine.run()['returnedSigned32'] == 1
    assert [r['value'] for r in machine.reads] == [149,148]
    assert len(instructions) == 37 and len(branches) == 10
    return {'publicExportComparisons': len(cases), 'instructionsCovered': len(instructions),
            'conditionalBranchOutcomesCovered': len(branches),
            'nativeInvalidIdCases': gates, 'validatorUsesFullEax': True,
            'targetByteReadBeforeSource': True, 'sourcePointerNotValidatedByEntry': True,
            'stackAndCalleeSavedVerifiedEveryRun': True,
            'negativeIdIsSigned32': True, 'invalidIdClearsOnlyAl': True}


def check_mutations(listing):
    cases = [dict(source_byte=a,target_byte=b) for a,b in
             [(1,149),(149,1),(0,0),(0,75),(0,76),(0,151),(0,255),(255,0),(128,1)]]
    cases += [dict(target_id=i) for i in (-1,0,1099,1100)]
    cases += [dict(validator_eax=v) for v in (0,256,0x80000000)]
    wanted = []
    for kwargs in cases:
        machine = TutorialMachine(listing, **kwargs)
        wanted.append((machine.run(), machine.reads, machine.calls))
    variants = [
        ('unsigned-target-id-gate',0x489f89,'jb',None),
        ('exclude-id-1099',0x489f90,'jl',None),
        ('zero-whole-eax-invalid-id',0x489f92,'xor',('eax','eax')),
        ('validator-tests-al-only',0x489faf,'test',('al','al')),
        ('signed-source-affinity',0x489fb7,'movsx',None),
        ('signed-target-affinity',0x489fb3,'movsx',None),
        ('wrong-affinity-offset',0x489fb3,'movzx',('ecx','byte ptr [esi+68h]')),
        ('reverse-subtraction',0x489fbb,'sub',('ecx','eax')),
        ('invert-absolute-branch',0x489fbd,'js',None),
        ('period-149',0x489fc1,'mov',('ecx','95h')),
        ('unsigned-complement-compare',0x489fca,'jb',None),
        ('tie-keeps-d',0x489fca,'jle',None),
        ('keep-complement-original-d',0x489fcd,'mov',('eax','eax')),
        ('callee-stack-cleanup-zero',0x489fd0,'retn',('0',)),
        ('wrong-callee-saved-restore',0x489fcf,'pop',('esi',)),
        ('wrong-external-callee',0x489f9f,'call',('GetCountryPtr',)),
    ]
    killed=[]
    for name,address,op,args in variants:
        changed=dict(listing)
        changed[address]=replace(changed[address],op=op,
                                 args=changed[address].args if args is None else args)
        caught=False
        for kwargs, expected in zip(cases, wanted, strict=True):
            try:
                machine=TutorialMachine(changed, **kwargs)
                observed=(machine.run(),machine.reads,machine.calls)
                if observed != expected:
                    caught=True; break
            except (AssertionError,KeyError,ValueError):
                caught=True; break
        assert caught, 'source-mnemonic mutation survived: '+name
        killed.append(name)
    return killed


def check_stub_contract_mutations(listing):
    """Verify the explicit opaque assumptions, without claiming callee recovery."""
    killed=[]
    cases=[dict(source_byte=1,target_byte=149,validator_eax=v) for v in (0,1,256)]
    for mutation in ('get-person-omits-cleanup','validator-double-cleanup','validator-forced-success'):
        caught=False
        for kwargs in cases:
            expected=TutorialMachine(listing,**kwargs).run()
            try:
                actual=TutorialMachine(listing,**kwargs,stub_mutation=mutation).run()
                if actual != expected:
                    caught=True;break
            except (AssertionError,KeyError,ValueError):
                caught=True;break
        assert caught,'opaque-stub contract mutation survived: '+mutation
        killed.append(mutation)
    return killed


def check_api_contract():
    """Exercise closed own-data inputs through the real export, without coercion."""
    return run_node("""
      import assert from 'node:assert/strict';
      import {calculateAffinityDistance as calculate} from './packages/engine/src/index.ts';
      const input=()=>({profile:'affinity-distance-tutorial-u8-v1',sourceAffinityByte:1,targetAffinityByte:149});
      const invalid=[null,undefined,[],1,'1',true,()=>{}, {}, {...input(),profile:'unknown'},
        {...input(),extra:1},Object.assign(Object.create(input()),{}),new Map(),new Date()];
      for(const value of [-1,256,1.5,NaN,Infinity,-Infinity,'1',null,undefined,true,1n]){
        invalid.push({...input(),sourceAffinityByte:value},{...input(),targetAffinityByte:value});
      }
      for(const key of Object.keys(input())){const x=input();delete x[key];invalid.push(x)}
      const sym=input();sym[Symbol('x')]=1;invalid.push(sym);
      const hidden=input();Object.defineProperty(hidden,'extra',{value:1});invalid.push(hidden);
      let invoked=0;for(const key of Object.keys(input())){const x=input();Object.defineProperty(x,key,{get(){invoked++;throw Error('getter invoked')}});invalid.push(x)}
      function frozen(x){if(x!==null && typeof x==='object'){assert.ok(Object.isFrozen(x));for(const v of Object.values(x))frozen(v)}}
      for(const x of invalid){const r=calculate(x);assert.equal(r.supported,false);assert.equal('returnedEax' in r,false);frozen(r)}
      assert.equal(invoked,0);
      for(const a of [0,1,255])for(const b of [0,1,255]){const x={...input(),sourceAffinityByte:a,targetAffinityByte:b};const before=JSON.stringify(x);const r=calculate(x);assert.equal(r.supported,true);frozen(r);assert.equal(JSON.stringify(x),before)}
      process.stdout.write(JSON.stringify({rejectedInputs:invalid.length,accessorsInvoked:invoked,deepFrozen:true,inputUnchanged:true}));
    """)


def exhaustive(listing):
    expected=bytearray()
    normal=negative=0
    for a in range(256):
        for b in range(256):
            result=TutorialMachine(listing,a,b).run()
            expected.extend(RECORD.pack(result['absoluteDifference'],result['complement'],
                                        int(result['signedComparisonBranch']=='use-complement'),
                                        result['returnedSigned32'],result['returnedEax'],result['returnedAl']))
            normal += a < 150 and b < 150
            negative += result['returnedSigned32'] < 0
    script="""
      import assert from 'node:assert/strict';
      import {calculateAffinityDistance as calculate} from './packages/engine/src/index.ts';
      const wanted=EXPECTED_EVIDENCE;
      const out=Buffer.alloc(65536*18);let offset=0;
      for(let a=0;a<256;a++)for(let b=0;b<256;b++){
        const r=calculate({profile:'affinity-distance-tutorial-u8-v1',sourceAffinityByte:a,targetAffinityByte:b});
        assert.equal(r.supported,true);assert.equal(r.profile,'affinity-distance-tutorial-u8-v1');
        assert.equal(r.sourceAffinityByte,a);assert.equal(r.targetAffinityByte,b);
        assert.deepEqual(r.evidence,wanted);assert.ok(Object.isFrozen(r));assert.ok(Object.isFrozen(r.evidence));
        assert.ok(['keep-d','use-complement'].includes(r.signedComparisonBranch));
        out.writeUInt32LE(r.absoluteDifference,offset);out.writeInt32LE(r.complement,offset+4);
        out[offset+8]=Number(r.signedComparisonBranch==='use-complement');
        out.writeInt32LE(r.returnedSigned32,offset+9);out.writeUInt32LE(r.returnedEax,offset+13);out[offset+17]=r.returnedAl;offset+=18;
      }
      process.stdout.write(out);
    """.replace('EXPECTED_EVIDENCE',json.dumps(EVIDENCE))
    actual=run_node(script,binary=True)
    assert len(actual)==len(expected)==65536*18
    assert actual==expected, 'independent tutorial projection differs from TypeScript export'
    assert normal==22500 and negative==11130
    return {'comparisons':65536,'normalDomainPairs':normal,'negativeReturnPairs':negative,
            'fullTutorialEntryEveryCase':True,'mismatches':0,
            'binaryRecord':'LE uint32 difference, int32 complement, uint8 branch, int32 signed return, uint32 EAX, uint8 AL',
            'expectedMnemonicProjectionSha256':sha(expected),'actualPublicExportSha256':sha(actual)}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--exhaustive',action='store_true')
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    listing=load_listing()
    report={'scope':'tutorial-source-projection with explicit opaque external-call stubs',
            'sourceSha256':SOURCE_SHA,'sourceGitBlobSha1':SOURCE_BLOB,
            'instructionCount':37,'conditionalBranchCount':5,'opcodeBytes':None,
            'machineCodeVerified':False,'stockOriginalVerified':False,
            'originalExecutableExecuted':False,'examples':check_examples(listing),
            'apiContract':check_api_contract(),'sourceMnemonicMutationsKilled':check_mutations(listing),
            'opaqueStubContractMutationsKilled':check_stub_contract_mutations(listing)}
    if args.exhaustive:
        report['exhaustive']=exhaustive(listing)
    text=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output:
        args.output.write_text(text)
    print(text,end='')


if __name__=='__main__':
    main()
