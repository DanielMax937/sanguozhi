#!/usr/bin/env python3
"""Strict immutable captured-observation API plus offline evidence/schema checks.

The named arithmetic policy is provisional; this is not execution of native PK.
The direct Python API requires exact dict/list/str/int, rejects bool and subclasses,
and returns recursively immutable mappings/tuples. receipt_to_json is an explicit
mutable JSON transport copy. Runtime API does not rehash any source materials.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import subprocess
import tempfile
from types import MappingProxyType
from typing import Literal, Mapping, NotRequired, TypedDict, TypeAlias, cast
from jsonschema import Draft202012Validator
ROOT = Path(__file__).resolve().parents[1]
NAME = 'monthly-specialty-production'
PROFILE = 'monthly-specialty-production-observed-v1'
ARITHMETIC = 'comment-f32-rne-trunc-v1'
# Closed contract metadata pins: offline checks only, never a runtime claim.
METADATA_PINS = {'docs/sources/monthly-specialty-production.json': 'ad03ff69e2bd4249ca675b01ac21c98a9860e7eafe1d1ff33111ccea422c9492', 'docs/sources/monthly-specialty-production.schema.json': '6471ee48fd31c729e60dc5e40832bff06b1d477969ae295b36670b5ae2892a93', 'docs/sources/monthly-specialty-production/source-manifest.json': 'fec85a311ab6bb3a7efc5f4b6ff29be6b7c2b4df27094f0789bcb15c35d9b185'}
class Slot(TypedDict):
    validityEaxU32: int
    correspondingCompletedEaxU32: NotRequired[int]
class Input(TypedDict):
    profile: Literal['monthly-specialty-production-observed-v1']
    arithmeticProfile: Literal['comment-f32-rne-trunc-v1']
    equipmentType: Literal[1, 2, 3, 4]
    specialtyEaxU32: int
    slots: NotRequired[list[Slot]]
    governorPoliticsEaxU32: NotRequired[int]
JSONScalar: TypeAlias = str | int | float | bool | None
FrozenJSON: TypeAlias = JSONScalar | Mapping[str, 'FrozenJSON'] | tuple['FrozenJSON', ...]
Receipt: TypeAlias = Mapping[str, FrozenJSON]
def freeze(value):
    if type(value) is dict: return MappingProxyType({key: freeze(child) for key, child in value.items()})
    if type(value) is list: return tuple(freeze(child) for child in value)
    return value
def receipt_to_json(value: FrozenJSON):
    """Fresh JSON-compatible copy; editing it cannot affect the immutable receipt."""
    if isinstance(value, Mapping): return {key: receipt_to_json(child) for key, child in value.items()}
    if type(value) is tuple: return [receipt_to_json(child) for child in value]
    return value
DOCUMENT = freeze(json.loads((ROOT / f'docs/sources/{NAME}.json').read_text()))
EVIDENCE = DOCUMENT['evidence']
class Invalid(ValueError): pass
def record(value, allowed, required):
    if type(value) is not dict: raise Invalid('invalid-input')
    if any(type(key) is not str or key not in allowed for key in value): raise Invalid('unexpected-field')
    if not set(required) <= value.keys(): raise Invalid('invalid-input')
    return value
def u32(value):
    if type(value) is not int or not 0 <= value <= 0xFFFFFFFF: raise Invalid('invalid-input')
    return value
def from_bits(bits): return struct.unpack('<f', struct.pack('<I', bits))[0]
def to_bits(value): return struct.unpack('<I', struct.pack('<f', value))[0]
def calculate_monthly_specialty_production(value: Input) -> Receipt:
    """Per equipment1..4 production quantity argument, without side effects."""
    try:
        raw = record(value, ('profile', 'arithmeticProfile', 'equipmentType', 'specialtyEaxU32', 'slots', 'governorPoliticsEaxU32'), ('profile', 'arithmeticProfile', 'equipmentType', 'specialtyEaxU32'))
        if type(raw['profile']) is not str or raw['profile'] != PROFILE or type(raw['arithmeticProfile']) is not str or raw['arithmeticProfile'] != ARITHMETIC: raise Invalid('unsupported-profile')
        equipment = u32(raw['equipmentType'])
        if not 1 <= equipment <= 4: raise Invalid('invalid-input')
        specialty = u32(raw['specialtyEaxU32'])
        captures = []
        def capture(kind, address, target, eax, width, slot=None):
            captures.append({'kind': kind, 'callAddress': address, 'target': target, 'slotIndex': slot, 'eaxU32': eax, 'consumedWidthBits': width, 'consumedValue': eax & 255 if width == 8 else eax})
        capture('specialty', '00590A7E', '0047B3A0', specialty, 8)
        observations = {'profile': PROFILE, 'arithmeticProfile': ARITHMETIC, 'equipmentType': equipment, 'specialtyEaxU32': specialty}
        count = None; arithmetic = None; request = None; path = 'not-specialty'
        if specialty & 255 == 0:
            if 'slots' in raw or 'governorPoliticsEaxU32' in raw: raise Invalid('stage-mismatch')
        else:
            if 'slots' not in raw: raise Invalid('stage-mismatch')
            if type(raw['slots']) is not list or len(raw['slots']) != 30: raise Invalid('invalid-input')
            count = 0; slots = []
            for index, value in enumerate(raw['slots']):
                slot = record(value, ('validityEaxU32', 'correspondingCompletedEaxU32'), ('validityEaxU32',))
                validity = u32(slot['validityEaxU32'])
                capture('validity', '00590AB3', '0047A630', validity, 32, index)
                if validity == 0:
                    if 'correspondingCompletedEaxU32' in slot: raise Invalid('stage-mismatch')
                    slots.append({'validityEaxU32': validity})
                else:
                    if 'correspondingCompletedEaxU32' not in slot: raise Invalid('stage-mismatch')
                    completed = u32(slot['correspondingCompletedEaxU32'])
                    capture('corresponding-completed', '00590AC6', '0049CFB0', completed, 32, index)
                    if completed != 0: count += 1
                    slots.append({'validityEaxU32': validity, 'correspondingCompletedEaxU32': completed})
            observations['slots'] = slots; path = 'no-completed-facilities'
            if count == 0:
                if 'governorPoliticsEaxU32' in raw: raise Invalid('stage-mismatch')
            else:
                if 'governorPoliticsEaxU32' not in raw: raise Invalid('stage-mismatch')
                politics = u32(raw['governorPoliticsEaxU32'])
                observations['governorPoliticsEaxU32'] = politics
                capture('governor-politics', '00590B4E', '004890A0', politics, 8)
                constants = DOCUMENT['arithmeticProfile']['constants']
                def c(key): return from_bits(constants[key]['bitsU32'])
                if count == 1: tier = 'one'; before_store = 1
                elif count <= 3: tier = 'two-to-three'; before_store = (count - 1) * c('half') + c('one')
                elif count <= 7: tier = 'four-to-seven'; before_store = (count - 3) * c('quarter') + c('two')
                else: tier = 'eight-to-thirty'; before_store = (count - 7) * c('tenth') + c('three')
                bits = to_bits(before_store); factor = from_bits(bits)
                al = politics & 255; term = (al >> 1) + 60
                scaled = term * factor * c('three')
                converted = math.trunc(scaled); capped = converted > 1500
                quantity = 1500 if capped else converted
                arithmetic = {'factorTier': tier, 'factorBitsU32': bits, 'factorValue': factor, 'politicsAL': al, 'politicsTerm': term, 'scaledValue': scaled, 'convertedSigned32': converted, 'capApplied': capped}
                request = {'pushAddress': '00590B82', 'continuationAddress': '00590B83', 'quantityU32': quantity, 'quantitySigned32': quantity}
                path = 'production'
        return freeze({'supported': True, 'profile': PROFILE, 'arithmeticProfile': ARITHMETIC, 'equipmentType': equipment, 'observations': observations, 'path': path, 'completedFacilityCount': count, 'capturedReturns': captures, 'arithmetic': arithmetic, 'quantityRequest': request, 'evidence': EVIDENCE})
    except Invalid as error:
        return freeze({'supported': False, 'reason': str(error), 'evidence': EVIDENCE})
def sha(raw): return hashlib.sha256(raw).hexdigest()
def check_source():
    """Offline verification; never called by the calculation API."""
    for path, digest in METADATA_PINS.items():
        assert sha((ROOT / path).read_bytes()) == digest, ('closed metadata identity', path)
    doc = json.loads((ROOT / f'docs/sources/{NAME}.json').read_text())
    schema = json.loads((ROOT / f'docs/sources/{NAME}.schema.json').read_text())
    Draft202012Validator.check_schema(schema); Draft202012Validator(schema).validate(doc)
    for key in ('inputSchema', 'resultSchema'): Draft202012Validator.check_schema(doc[key])
    manifest = json.loads((ROOT / f'docs/sources/{NAME}/source-manifest.json').read_text())
    for item in manifest['files']:
        raw = (ROOT / item['path']).read_bytes()
        assert len(raw) == item['bytes'] and sha(raw) == item['sha256'], item['path']
    license_bytes = (ROOT / 'docs/sources/production-time-LICENSE.txt').read_bytes()
    assert sha(license_bytes) == 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
    assert hashlib.sha1(f'blob {len(license_bytes)}\0'.encode() + license_bytes).hexdigest() == '261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64'
    gbk = (ROOT / 'docs/sources/monthly-city-food-base-argument-original.gbk').read_bytes()
    text = (ROOT / 'docs/sources/monthly-city-food-base-argument-original.txt').read_text()
    assert len(gbk) == 44283 and sha(gbk) == '24c1f4c75185a3aef07aac7f493400bb778f2f071bf4fd8ef3d905457d43d617'
    assert text.encode('gbk') == gbk and hashlib.sha1(b'blob 44283\0' + gbk).hexdigest() == '028fae66ba44f70716951edd9fae51420780cea0'
    original = text.split('修改1', 1)[0]
    rows = [{'address': a, 'hex': bytes.fromhex(b).hex()} for a, b in re.findall(r'^([0-9A-F]{8}) - ([0-9a-f]{2}(?: [0-9a-f]{2})*)\s+- ', original, re.M)]
    assert len(rows) == 572
    cursor = 0x590490
    for row in rows: assert int(row['address'], 16) == cursor; cursor += len(bytes.fromhex(row['hex']))
    assert cursor == 0x590C23
    assert rows == json.loads((ROOT / 'docs/sources/monthly-city-food-base-argument/full-listing.json').read_text())
    selected = [row for row in rows if '00590A83' <= row['address'] < '00590B83']
    code = bytes.fromhex(''.join(row['hex'] for row in selected))
    assert len(selected) == 71 and len(code) == 256 and sha(code) == '0269b7298f452d1cebd6c22f8a15eca5606b99d51709ee7120974828b9f3f3fb'
    assert selected == json.loads((ROOT / f'docs/sources/{NAME}/slice-listing.json').read_text())
    assert code == (ROOT / f'docs/sources/{NAME}/slice.bin').read_bytes()
    with tempfile.TemporaryDirectory(prefix='specialty-decode-') as folder:
        path = Path(folder) / 'slice.bin'; path.write_bytes(code)
        decoded = subprocess.run(['objdump', '-D', '-b', 'binary', '-m', 'i386', '-M', 'intel', '--insn-width=16', '--adjust-vma=0x590A83', str(path)], capture_output=True, text=True, check=True).stdout
    found = []; instructions = {}
    for line in decoded.splitlines():
        m = re.match(r'^\s*([0-9a-f]+):\s*((?:[0-9a-f]{2}\s+)+)\s*(.*)$', line)
        if m: found.append({'address': m[1].upper().zfill(8), 'hex': bytes.fromhex(m[2]).hex()}); instructions[int(m[1], 16)] = m[3]
    assert found == selected
    for addr, pattern in [(0x590A83, r'test\s+al,al'), (0x590ABB, r'test\s+eax,eax'), (0x590ACB, r'test\s+eax,eax'), (0x590AFA, r'dec\s+ebp'), (0x590B16, r'add\s+ebp,0xfffffffd'), (0x590B2F, r'add\s+ebp,0xfffffff9'), (0x590B46, r'fstp\s+DWORD PTR \[esp\+0x18\]'), (0x590B53, r'movzx\s+eax,al'), (0x590B56, r'shr\s+eax,1'), (0x590B6D, r'call\s+0x707a74'), (0x590B77, r'jle\s+0x590b7e'), (0x590B82, r'push\s+eax')]:
        assert re.fullmatch(pattern, instructions[addr]), (addr, instructions[addr])
    return {'sourceIdentityVerifiedOffline': True, 'sliceInstructions': 71, 'sliceBytes': 256, 'allBoundariesMatchObjdump': True, 'nativeExecutableExecuted': False, 'arithmeticProfile': ARITHMETIC}
def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False); parser.parse_args()
    print(json.dumps(check_source(), indent=2))
if __name__ == '__main__': main()
