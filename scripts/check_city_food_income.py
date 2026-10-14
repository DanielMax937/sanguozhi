#!/usr/bin/env python3
"""Strict stable-resolved city-income API and independently pinned source guards.

This pure projection implements the calculator's local branching and non-Easy U32/signed32
arithmetic. It never executes game bytes, native helpers, a scheduler or writes
state. Runtime inputs are closed JSON-shaped values, including integral JSON
numbers; all outputs contain copied scalars and freshly constructed containers.
"""
from __future__ import annotations
from copy import deepcopy
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import sys
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
PROFILE = 'city-food-income-stable-resolved-non-easy-u32-v1'
PROFILE_FILE = ROOT / 'docs/sources/city-food-income-projection.json'
SCHEMA_FILE = ROOT / 'docs/sources/city-food-income-projection.schema.json'
SOURCE = ROOT / 'docs/sources/city-food-income-projection-original.txt'
GBK_FILE = ROOT / 'docs/sources/city-food-income-projection-original.gbk'
MATERIALS = ROOT / 'docs/sources/city-food-income-projection'
COMMIT = '66e167e40c3440929ec016f3872aefc3486434c1'
UTF8_SHA = '5751f8775b63410459c7ad035177df11ee08b245222c38c1f74ac0bf42f1fa78'
GBK_SHA = 'ef5c0c6431e167389d76c84693e4807ffdc078f94807509c73dcb24690e39947'
BLOB_SHA = '79e949349af8be94b77eb70f37a948b8d3ff2f6a'
BODY_SHA = '176854e5670c2e5f5957f2de3ec06529ad69668c1548e94923a849a87db850b0'
JUMP_SHA = 'da490597343aadca41cdce8ddccac3c3bc6cf4918927a48017b3fb47b239e2ca'
DISPATCH_SHA = '1ce093453d63cd6b18ffd8aea0004a08b709cc5559325d05c5ad422b58c3f9f6'
PROFILE_SHA = '8b744b5006927932cd750fdf55906669df9ed087e420121fea4070d813429294'
SCHEMA_SHA = 'ecc4a618016a854dccf8326a30dbedf2689ff64545b097c40a6edcccad49e4b7'
MANIFEST_SHA = 'ccf758f517e72ab2f962b0b0650b30fe4082aba11ff4cddc6f888b933f3bbc1e'
LICENSE_SHA = 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
INT32_MAX = 2147483647
TYPE_KEYS = frozenset(('32', '49', '52', '53'))
REVENUE_TYPES = frozenset((32, 49, 52, 53))
GRANARY_TYPES = frozenset((32, 52, 53))
ROW_PATTERN = r'^([0-9A-F]{8}) - ([0-9a-f]{2}(?: [0-9a-f]{2})*)\s+- (.*)$'
EVIDENCE = {'level': 'source-listing-reconstruction', 'profile': 'city-food-income-stable-resolved-non-easy-u32-v1', 'source': 'docs/sources/city-food-income-projection.json', 'originalRange': '0049E810 <= PC < 0049E9FE', 'fullCallerBytesVerified': True, 'entryGatesIntegrated': False, 'stableResolvedInputsRequired': True, 'stockOriginalVerified': False, 'originalExecutableExecuted': False, 'nativeHelpersReconstructed': False, 'abiVerified': False, 'realTraceReachabilityVerified': False, 'typeTableStockVerified': False, 'adjacencyHelperRecovered': False, 'easyBranchRecovered': False, 'easyBranchSupported': False, 'rngRecovered': False, 'monthlySchedulerIntegrated': False, 'incomeWriterIntegrated': False, 'commandIntegrated': False, 'modBehaviorIncluded': False}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()


def _uint(value, bits):
    # JSON has a single number type. Accept 1.0 exactly as JS/JSON Schema do,
    # without accepting bool (a Python int subclass), coercing strings or NaN.
    return (type(value) in (int, float) and
            (type(value) is int or math.isfinite(value) and value.is_integer()) and
            0 <= value < 2 ** bits)


def _reject(reason):
    return {'supported': False, 'reason': reason, 'evidence': deepcopy(EVIDENCE)}


def calculate_city_food_income_projection(value):
    """Return a fresh JSON receipt or an explicit unsupported-domain receipt.

    The caller warrants a valid city/owner 0..46, stable lookup rows, resolved
    predicates at their call sites and returning callees preserving the required
    ABI. Missing observations never mean invalid pointers or zero income.
    """
    if type(value) is not dict:
        return _reject('invalid-input')
    required = {'profile', 'baseFoodWord', 'slots', 'resolvedTypeRows', 'difficultyWord', 'securityByte'}
    if any(type(key) is not str or key not in required | {'cityPlayerPredicate', 'cityTroopsWord'} for key in value):
        return _reject('unexpected-field')
    if not required <= value.keys():
        return _reject('invalid-input')
    if type(value['profile']) is not str or value['profile'] != PROFILE:
        return _reject('unsupported-profile')
    if (not _uint(value['baseFoodWord'], 16) or not _uint(value['difficultyWord'], 32)
            or not _uint(value['securityByte'], 8)):
        return _reject('invalid-input')
    difficulty = int(value['difficultyWord'])
    if difficulty == 2:
        if 'cityPlayerPredicate' not in value or type(value['cityPlayerPredicate']) is not bool:
            return _reject('invalid-input')
    elif 'cityPlayerPredicate' in value:
        return _reject('unexpected-field')
    slots, rows = value['slots'], value['resolvedTypeRows']
    if type(rows) is not dict:
        return _reject('invalid-input')
    if any(type(key) is not str or key not in TYPE_KEYS for key in rows):
        return _reject('unexpected-field')
    for row_key in sorted(rows, key=int):
        row = rows[row_key]
        if type(row) is not dict:
            return _reject('invalid-input')
        if any(type(key) is not str or key not in ('valid', 'foodYieldWord') for key in row):
            return _reject('unexpected-field')
        if 'valid' not in row or type(row['valid']) is not bool:
            return _reject('invalid-input')
        if not row['valid']:
            if 'foodYieldWord' in row:
                return _reject('unexpected-field')
        elif 'foodYieldWord' not in row or not _uint(row['foodYieldWord'], 16):
            return _reject('invalid-input')
    if type(slots) is not list or len(slots) != 30:
        return _reject('invalid-input')
    troops_consumed = False
    receipts = []
    raw_food = int(value['baseFoodWord'])
    for index, slot in enumerate(slots):
        receipt = {'index': index, 'facilityTypeWord': None, 'effectiveType': None,
                   'status': 'invalid-slot', 'foodYieldWord': None,
                   'granaryApplied': False, 'effectiveTroops': None, 'militaryProductRaw': None, 'militaryProductU32': None, 'contribution': 0}
        if slot is None:
            receipts.append(receipt)
            continue
        if type(slot) is not dict:
            return _reject('invalid-input')
        if any(type(key) is not str or key not in ('facilityTypeWord', 'constructionWord', 'adjacentGranary') for key in slot):
            return _reject('unexpected-field')
        if (not {'facilityTypeWord', 'constructionWord'} <= slot.keys()
                or not _uint(slot['facilityTypeWord'], 32) or not _uint(slot['constructionWord'], 32)):
            return _reject('invalid-input')
        facility_type = int(slot['facilityTypeWord'])
        receipt['facilityTypeWord'] = facility_type
        if facility_type not in REVENUE_TYPES:
            if 'adjacentGranary' in slot:
                return _reject('unexpected-field')
            receipt['status'] = 'ignored-type'
        elif facility_type in (32, 49) and slot['constructionWord'] == 0:
            if 'adjacentGranary' in slot:
                return _reject('unexpected-field')
            receipt['status'] = 'unfinished'
        else:
            effective_type = (32 if facility_type == 52 else 52) if facility_type in (52, 53) and slot['constructionWord'] == 0 else facility_type
            receipt['effectiveType'] = effective_type
            key = str(effective_type)
            if key not in rows:
                return _reject('missing-type-row')
            row = rows[key]
            if not row['valid']:
                if 'adjacentGranary' in slot:
                    return _reject('unexpected-field')
                receipt['status'] = 'invalid-type-row'
            else:
                if effective_type in GRANARY_TYPES:
                    if 'adjacentGranary' not in slot:
                        return _reject('missing-adjacent-granary')
                    if type(slot['adjacentGranary']) is not bool:
                        return _reject('invalid-input')
                    granary = slot['adjacentGranary']
                else:
                    if 'adjacentGranary' in slot:
                        return _reject('unexpected-field')
                    granary = False
                food_yield = int(row['foodYieldWord'])
                if effective_type == 49:
                    troops_consumed = True
                    if 'cityTroopsWord' not in value:
                        return _reject('missing-city-troops')
                    if not _uint(value['cityTroopsWord'], 32):
                        return _reject('invalid-input')
                    troops = max(15000, int(value['cityTroopsWord']))
                    military_raw = troops * food_yield
                    military_u32 = military_raw & 0xFFFFFFFF
                    contribution = military_u32 // 15000
                    receipt.update(effectiveTroops=troops, militaryProductRaw=military_raw,
                                   militaryProductU32=military_u32)
                else:
                    contribution = food_yield * 3 // 2 if granary else food_yield
                receipt.update(status='yield', foodYieldWord=food_yield,
                               granaryApplied=granary, contribution=contribution)
                raw_food += contribution
        receipts.append(receipt)
    if not troops_consumed and 'cityTroopsWord' in value:
        return _reject('unexpected-field')
    if difficulty == 0:
        return _reject('unsupported-easy-branch')
    percent = (75 if value['cityPlayerPredicate'] else 125) if difficulty == 2 else 100
    adjusted = raw_food * percent // 100
    security = max(50, int(value['securityByte']))
    product = adjusted * security
    product_u32 = product & 0xFFFFFFFF
    product_signed = product_u32 - (1 << 32) if product_u32 & 0x80000000 else product_u32
    returned = -(abs(product_signed) // 100) if product_signed < 0 else product_signed // 100
    return {'supported': True, 'profile': PROFILE, 'baseFoodWord': int(value['baseFoodWord']),
            'difficultyWord': difficulty, 'securityByte': int(value['securityByte']),
            'slots': receipts, 'rawFood': raw_food, 'difficultyPercent': percent,
            'difficultyAdjusted': adjusted, 'effectiveSecurity': security,
            'securityProductRaw': product, 'securityProductU32': product_u32,
            'securityProductSigned': product_signed, 'returnedIncomeSigned': returned,
            'returnedIncomeU32': returned & 0xFFFFFFFF, 'evidence': deepcopy(EVIDENCE)}


def closed_const_schema(value):
    if type(value) is dict:
        return {'type': 'object', 'additionalProperties': False, 'required': list(value),
                'properties': {key: closed_const_schema(child) for key, child in value.items()}}
    return {'type': {str: 'string', int: 'integer', bool: 'boolean', list: 'array', type(None): 'null'}[type(value)], 'const': value}


def parse_listing(text):
    utf8 = text.encode('utf-8')
    assert len(utf8) == 18184 and sha(utf8) == UTF8_SHA, 'fixed complete source text changed'
    original = text.split('修改1 - 谷仓对军屯农有效')[0]
    rows = [(int(a, 16), bytes.fromhex(b), asm) for a, b, asm in re.findall(ROW_PATTERN, original, re.M)]
    assert len(rows) == 160, 'original instruction count changed'
    cursor = 0x49E810
    for address, raw, _ in rows:
        assert address == cursor, 'original code gap/overlap/reorder'
        cursor += len(raw)
    body = b''.join(raw for _, raw, _ in rows)
    assert cursor == 0x49E9FE and len(body) == 494 and sha(body) == BODY_SHA
    tables = {}
    for address, length, digest in ((0x49EA00, 16, JUMP_SHA), (0x49EA10, 22, DISPATCH_SHA)):
        match = re.search(r'^' + f'{address:08X}' + r' - ([0-9A-F ]+)\s*$', original, re.M)
        assert match is not None, 'table absent'
        raw = bytes.fromhex(match[1]); assert len(raw) == length and sha(raw) == digest
        tables[address] = raw
    addressed = re.findall(r'^[0-9A-F]{8}\s*-', original, re.M)
    assert len(addressed) == 162, 'unexpected addressed original source row'
    by = {a: (raw, asm) for a, raw, asm in rows}
    assert by[0x49E8A4][0].hex() == '83feff'
    assert all(by[a][0].hex() == 'c1fa05' for a in (0x49E996, 0x49E9A9, 0x49E9E3))
    return {'rows': rows, 'body': body, 'jumpTable': tables[0x49EA00], 'dispatchTable': tables[0x49EA10]}


def authenticate_source(utf8, gbk):
    assert len(utf8) == 18184 and sha(utf8) == UTF8_SHA
    assert len(gbk) == 17016 and sha(gbk) == GBK_SHA
    assert utf8.decode('utf-8').encode('gbk') == gbk
    assert gbk.decode('gbk').encode('utf-8') == utf8
    assert hashlib.sha1(b'blob 17016\0' + gbk).hexdigest() == BLOB_SHA
    return parse_listing(utf8.decode('utf-8'))


def check(profile, schema, utf8, gbk):
    assert sha(canonical(profile)) == PROFILE_SHA, 'independently pinned metadata changed'
    assert sha(canonical(schema)) == SCHEMA_SHA, 'independently pinned schema changed'
    assert schema == {'$schema': 'https://json-schema.org/draft/2020-12/schema', **closed_const_schema(profile)}
    Draft202012Validator.check_schema(schema)
    Draft202012Validator(schema).validate(profile)
    Draft202012Validator.check_schema(profile['inputSchema'])
    Draft202012Validator.check_schema(profile['resultSchema'])
    assert profile['profileId'] == PROFILE and profile['evidence'] == EVIDENCE
    listing = authenticate_source(utf8, gbk)
    assert bytes.fromhex(profile['originalListing']['bytesHex']) == listing['body']
    assert bytes.fromhex(profile['tables']['jump']['bytesHex']) == listing['jumpTable']
    assert bytes.fromhex(profile['tables']['dispatch']['bytesHex']) == listing['dispatchTable']
    assert profile['unlistedGap'] == {'start': '0049E9FE', 'endExclusive': '0049EA00', 'byteLength': 2, 'bytesKnown': False, 'paddingInserted': False}
    license_raw = (ROOT / profile['license']['snapshot']).read_bytes()
    assert len(license_raw) == 11357 and sha(license_raw) == LICENSE_SHA
    assert hashlib.sha1(b'blob 11357\0' + license_raw).hexdigest() == '261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64'
    return listing


def verify_materials(manifest, contents):
    assert sha(canonical(manifest)) == MANIFEST_SHA, 'fixed material manifest changed'
    assert set(contents) == {row['path'] for row in manifest['files']}
    for row in manifest['files']:
        raw = contents[row['path']]
        assert len(raw) == row['bytes'] and sha(raw) == row['sha256'], ('material changed', row['path'])
    return {'materialFilesVerified': len(contents), 'unlistedGapFilled': False}


def check_all_sources():
    profile = json.loads(PROFILE_FILE.read_text())
    schema = json.loads(SCHEMA_FILE.read_text())
    listing = check(profile, schema, SOURCE.read_bytes(), GBK_FILE.read_bytes())
    manifest = json.loads((MATERIALS / 'source-manifest.json').read_text())
    materials = {row['path']: (ROOT / row['path']).read_bytes() for row in manifest['files']}
    verify_materials(manifest, materials)
    assert (MATERIALS / 'source-body.bin').read_bytes() == listing['body']
    assert (MATERIALS / 'jump-table.bin').read_bytes() == listing['jumpTable']
    assert (MATERIALS / 'dispatch-table.bin').read_bytes() == listing['dispatchTable']
    expected = [{'address': f'{a:08X}', 'hex': raw.hex()} for a, raw, asm in listing['rows']]
    assert json.loads((MATERIALS / 'listing.json').read_text()) == expected
    return {'profile': PROFILE, 'sourceAndClosedSchemaVerified': True,
            'originalInstructions': len(listing['rows']), 'originalBodyBytes': len(listing['body']),
            'separateJumpTableBytes': 16, 'separateDispatchTableBytes': 22,
            'unlistedGapBytes': 2, 'unlistedGapFilled': False,
            'stockOriginalVerified': False, 'originalExecutableExecuted': False}


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON key')
        result[key] = value
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument('--input', type=Path, help='read one closed projection input JSON file')
    parser.add_argument('--output', type=Path, help='write the exact JSON also printed to stdout')
    args = parser.parse_args()
    report = check_all_sources()
    if args.input is not None:
        try:
            value = json.loads(args.input.read_text(), object_pairs_hook=_unique_object,
                               parse_constant=lambda text: (_ for _ in ()).throw(ValueError('non-JSON constant')))
        except (ValueError, UnicodeError):
            report = _reject('invalid-input')
        else:
            report = calculate_city_food_income_projection(value)
    output = json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    if args.output is not None:
        args.output.write_text(output)
    print(output, end='')


if __name__ == '__main__':
    main()
