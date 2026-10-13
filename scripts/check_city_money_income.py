#!/usr/bin/env python3
"""Strict stable-resolved city-income API and independently pinned source guards.

This pure projection implements the calculator's local branching and safe-i32
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
PROFILE = 'city-money-income-stable-resolved-i32-safe-v1'
PROFILE_FILE = ROOT / 'docs/sources/city-money-income-projection.json'
SCHEMA_FILE = ROOT / 'docs/sources/city-money-income-projection.schema.json'
SOURCE = ROOT / 'docs/sources/city-money-income-projection-original.txt'
GBK_FILE = ROOT / 'docs/sources/city-money-income-projection-original.gbk'
MATERIALS = ROOT / 'docs/sources/city-money-income-projection'
COMMIT = '66e167e40c3440929ec016f3872aefc3486434c1'
UTF8_SHA = 'd1780c1a16fb50a06af16a0ac7acbad06c396bf31ed1ef09432077b91a5d833a'
GBK_SHA = '38b0ac07ba1d67e47add98460a013337d9ed4a97191e7371461ad1d4d89e1e7a'
BLOB_SHA = '0f2c2d72a174d563427230bf207d65b6a639247c'
BODY_SHA = '30a5160008a77ce78b8602819a7041f71015fffcb30d2b09221f5abee37a37f1'
JUMP_SHA = 'a4fc0cc532310bcc58d0328fa8095f0de204564e2909b82328f7ff7ea3a6dfa7'
DISPATCH_SHA = 'e5183f0c1c7ff8eb709ff8d3eea5673e1ff7171a078b2e9edf51bccd235c5672'
PROFILE_SHA = 'ce521977c2bdac2b5c68d1fd46d47c68816b72410cb64006856f918d6464b66b'
SCHEMA_SHA = 'abb2a16ced48b8ad44a12275f27a6e92da0e104321aaee46ee7d8c47687580a8'
MANIFEST_SHA = '7f0c3db380d81f4ef567419a4b93b935acc32375383b89906ae568abb2e8f793'
LICENSE_SHA = 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
INT32_MAX = 2147483647
TYPE_KEYS = frozenset(('31', '46', '47', '48', '50', '51'))
REVENUE_TYPES = frozenset((31, 46, 47, 48, 50, 51))
MINT_TYPES = frozenset((31, 50, 51))
ROW_PATTERN = r'^([0-9A-F]{8}) - ([0-9a-f]{2}(?: [0-9a-f]{2})*)\s+- (.*)$'
EVIDENCE = {'level': 'source-listing-reconstruction', 'profile': PROFILE,
    'source': 'docs/sources/city-money-income-projection.json',
    'originalRange': '0049E590 <= PC < 0049E745', 'fullCallerBytesVerified': True,
    'entryGatesIntegrated': False, 'stableResolvedInputsRequired': True,
    'stockOriginalVerified': False, 'originalExecutableExecuted': False,
    'nativeHelpersReconstructed': False, 'abiVerified': False,
    'realTraceReachabilityVerified': False, 'typeTableStockVerified': False,
    'adjacencyHelperRecovered': False, 'rngRecovered': False, 'monthlySchedulerIntegrated': False,
    'incomeWriterIntegrated': False, 'commandIntegrated': False,
    'modBehaviorIncluded': False}


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


def calculate_city_money_income_projection(value):
    """Return a fresh JSON receipt or an explicit unsupported-domain receipt.

    The caller warrants a valid city/owner 0..46, stable lookup rows, resolved
    predicates at their call sites and returning callees preserving the required
    ABI. Missing observations never mean invalid pointers or zero income.
    """
    if type(value) is not dict:
        return _reject('invalid-input')
    required = {'profile', 'baseMoneyWord', 'slots', 'resolvedTypeRows', 'difficultyWord', 'securityByte'}
    if any(type(key) is not str or key not in required | {'cityPlayerPredicate'} for key in value):
        return _reject('unexpected-field')
    if not required <= value.keys():
        return _reject('invalid-input')
    if type(value['profile']) is not str or value['profile'] != PROFILE:
        return _reject('unsupported-profile')
    if (not _uint(value['baseMoneyWord'], 16) or not _uint(value['difficultyWord'], 32)
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
        if any(type(key) is not str or key not in ('valid', 'moneyYieldWord') for key in row):
            return _reject('unexpected-field')
        if 'valid' not in row or type(row['valid']) is not bool:
            return _reject('invalid-input')
        if not row['valid']:
            if 'moneyYieldWord' in row:
                return _reject('unexpected-field')
        elif 'moneyYieldWord' not in row or not _uint(row['moneyYieldWord'], 16):
            return _reject('invalid-input')
    if type(slots) is not list or len(slots) != 30:
        return _reject('invalid-input')
    receipts = []
    raw_money = int(value['baseMoneyWord'])
    for index, slot in enumerate(slots):
        receipt = {'index': index, 'facilityTypeWord': None, 'effectiveType': None,
                   'status': 'invalid-slot', 'moneyYieldWord': None,
                   'mintApplied': False, 'contribution': 0}
        if slot is None:
            receipts.append(receipt)
            continue
        if type(slot) is not dict:
            return _reject('invalid-input')
        if any(type(key) is not str or key not in ('facilityTypeWord', 'constructionWord', 'adjacentMint') for key in slot):
            return _reject('unexpected-field')
        if (not {'facilityTypeWord', 'constructionWord'} <= slot.keys()
                or not _uint(slot['facilityTypeWord'], 32) or not _uint(slot['constructionWord'], 32)):
            return _reject('invalid-input')
        facility_type = int(slot['facilityTypeWord'])
        receipt['facilityTypeWord'] = facility_type
        if facility_type not in REVENUE_TYPES:
            if 'adjacentMint' in slot:
                return _reject('unexpected-field')
            receipt['status'] = 'ignored-type'
        elif facility_type in (31, 46, 47, 48) and slot['constructionWord'] == 0:
            if 'adjacentMint' in slot:
                return _reject('unexpected-field')
            receipt['status'] = 'unfinished'
        else:
            effective_type = (31 if facility_type == 50 else 50) if facility_type in (50, 51) and slot['constructionWord'] == 0 else facility_type
            receipt['effectiveType'] = effective_type
            key = str(effective_type)
            if key not in rows:
                return _reject('missing-type-row')
            row = rows[key]
            if not row['valid']:
                if 'adjacentMint' in slot:
                    return _reject('unexpected-field')
                receipt['status'] = 'invalid-type-row'
            else:
                if effective_type in MINT_TYPES:
                    if 'adjacentMint' not in slot:
                        return _reject('missing-adjacent-mint')
                    if type(slot['adjacentMint']) is not bool:
                        return _reject('invalid-input')
                    mint = slot['adjacentMint']
                else:
                    if 'adjacentMint' in slot:
                        return _reject('unexpected-field')
                    mint = False
                money_yield = int(row['moneyYieldWord'])
                contribution = money_yield * 3 // 2 if mint else money_yield
                receipt.update(status='yield', moneyYieldWord=money_yield,
                               mintApplied=mint, contribution=contribution)
                raw_money += contribution
        receipts.append(receipt)
    percent = 125 if difficulty == 0 or difficulty == 2 and not value['cityPlayerPredicate'] else 75 if difficulty == 2 else 100
    security = max(50, int(value['securityByte']))
    scaled_raw = raw_money * 100
    if scaled_raw > INT32_MAX:
        return _reject('unsupported-arithmetic-domain')
    difficulty_product = scaled_raw * percent if percent != 100 else None
    if difficulty_product is not None and difficulty_product > INT32_MAX:
        return _reject('unsupported-arithmetic-domain')
    difficulty_adjusted = difficulty_product // 100 if difficulty_product is not None else scaled_raw
    security_product = difficulty_adjusted * security
    if security_product > INT32_MAX:
        return _reject('unsupported-arithmetic-domain')
    security_adjusted = security_product // 100
    return {'supported': True, 'profile': PROFILE, 'baseMoneyWord': int(value['baseMoneyWord']),
            'difficultyWord': difficulty, 'securityByte': int(value['securityByte']),
            'slots': receipts, 'rawMoney': raw_money, 'difficultyPercent': percent,
            'effectiveSecurity': security,
            'intermediates': {'scaledRaw': scaled_raw, 'difficultyProduct': difficulty_product,
                             'difficultyAdjusted': difficulty_adjusted,
                             'securityProduct': security_product, 'securityAdjusted': security_adjusted},
            'returnedIncome': security_adjusted // 100, 'evidence': deepcopy(EVIDENCE)}


def closed_const_schema(value):
    if type(value) is dict:
        return {'type': 'object', 'additionalProperties': False, 'required': list(value),
                'properties': {key: closed_const_schema(child) for key, child in value.items()}}
    return {'type': {str: 'string', int: 'integer', bool: 'boolean', list: 'array', type(None): 'null'}[type(value)], 'const': value}


def parse_listing(text):
    utf8 = text.encode('utf-8')
    assert len(utf8) == 14553 and sha(utf8) == UTF8_SHA, 'fixed complete source text changed'
    original = text.split('修改1 - 造币场对不邻接设施也有效果')[0]
    rows = [(int(a, 16), bytes.fromhex(b), asm) for a, b, asm in re.findall(ROW_PATTERN, original, re.M)]
    assert len(rows) == 150, 'original instruction count changed'
    cursor = 0x49E590
    for address, raw, _ in rows:
        assert address == cursor, 'original code gap/overlap/reorder'
        cursor += len(raw)
    body = b''.join(raw for _, raw, _ in rows)
    assert cursor == 0x49E745 and len(body) == 437 and sha(body) == BODY_SHA
    tables = {}
    for address, length, digest in ((0x49E748, 16, JUMP_SHA), (0x49E758, 21, DISPATCH_SHA)):
        match = re.search(r'^' + f'{address:08X}' + r' - ([0-9A-F ]+)\s*$', original, re.M)
        assert match is not None, 'table absent'
        raw = bytes.fromhex(match[1]); assert len(raw) == length and sha(raw) == digest
        tables[address] = raw
    addressed = re.findall(r'^[0-9A-F]{8}\s*-', original, re.M)
    assert len(addressed) == 152, 'unexpected addressed original source row'
    by = {a: (raw, asm) for a, raw, asm in rows}
    assert by[0x49E61B][0].hex() == '83feff'
    assert all(by[a][0].hex() == 'c1fa05' for a in (0x49E6DA, 0x49E6F2, 0x49E717, 0x49E729))
    return {'rows': rows, 'body': body, 'jumpTable': tables[0x49E748], 'dispatchTable': tables[0x49E758]}


def authenticate_source(utf8, gbk):
    assert len(utf8) == 14553 and sha(utf8) == UTF8_SHA
    assert len(gbk) == 13630 and sha(gbk) == GBK_SHA
    assert utf8.decode('utf-8').encode('gbk') == gbk
    assert gbk.decode('gbk').encode('utf-8') == utf8
    assert hashlib.sha1(b'blob 13630\0' + gbk).hexdigest() == BLOB_SHA
    return parse_listing(utf8.decode('utf-8'))


def check(profile, schema, utf8, gbk):
    assert sha(canonical(profile)) == PROFILE_SHA, 'independently pinned metadata changed'
    assert sha(canonical(schema)) == SCHEMA_SHA, 'independently pinned schema changed'
    assert schema == {'$schema': 'https://json-schema.org/draft/2020-12/schema', **closed_const_schema(profile)}
    Draft202012Validator.check_schema(schema)
    Draft202012Validator(schema).validate(profile)
    Draft202012Validator.check_schema(profile['inputSchema'])
    assert profile['profileId'] == PROFILE and profile['evidence'] == EVIDENCE
    listing = authenticate_source(utf8, gbk)
    assert bytes.fromhex(profile['originalListing']['bytesHex']) == listing['body']
    assert bytes.fromhex(profile['tables']['jump']['bytesHex']) == listing['jumpTable']
    assert bytes.fromhex(profile['tables']['dispatch']['bytesHex']) == listing['dispatchTable']
    assert profile['unlistedGap'] == {'start': '0049E745', 'endExclusive': '0049E748', 'byteLength': 3, 'bytesKnown': False, 'paddingInserted': False}
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
    expected = [{'address': f'{a:08X}', 'bytesHex': raw.hex(), 'originalMnemonicAndComment': asm} for a, raw, asm in listing['rows']]
    assert json.loads((MATERIALS / 'listing.json').read_text()) == expected
    return {'profile': PROFILE, 'sourceAndClosedSchemaVerified': True,
            'originalInstructions': len(listing['rows']), 'originalBodyBytes': len(listing['body']),
            'separateJumpTableBytes': 16, 'separateDispatchTableBytes': 21,
            'unlistedGapBytes': 3, 'unlistedGapFilled': False,
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
            report = calculate_city_money_income_projection(value)
    output = json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    if args.output is not None:
        args.output.write_text(output)
    print(output, end='')


if __name__ == '__main__':
    main()
