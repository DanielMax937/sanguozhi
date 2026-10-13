#!/usr/bin/env python3
"""Offline source mutations and real Python/schema projection-input acceptance.

The source guard tests are identity tests, not behavior-mutant evidence. Formula
unit checks here are separate from the independent source-byte oracle. No source
file is modified by mutation tests, and no original/native bytes are executed.
"""
from copy import deepcopy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from jsonschema import Draft202012Validator, ValidationError
import check_city_money_income as api


def base(**changes):
    value = {'profile': api.PROFILE, 'baseMoneyWord': 0, 'slots': [None] * 30,
             'resolvedTypeRows': {}, 'difficultyWord': 1, 'securityByte': 100}
    value.update(changes)
    return value


def slot_case(kind=31, construction=1, money=100, valid=True, mint=False, **changes):
    effective = 31 if kind == 50 and construction == 0 else 50 if kind == 51 and construction == 0 else kind
    consumed = kind in api.REVENUE_TYPES and (construction != 0 or kind in (50, 51))
    slot = {'facilityTypeWord': kind, 'constructionWord': construction}
    rows = {}
    if consumed:
        rows[str(effective)] = {'valid': True, 'moneyYieldWord': money} if valid else {'valid': False}
        if valid and effective in api.MINT_TYPES:
            slot['adjacentMint'] = mint
    return base(slots=[slot] + [None] * 29, resolvedTypeRows=rows, **changes)


def raw_case(raw, difficulty=1, security=100, player=True):
    count, remainder = divmod(raw, 65535)
    assert count <= 30
    value = base(baseMoneyWord=remainder,
                 slots=[{'facilityTypeWord': 46, 'constructionWord': 1} for _ in range(count)] + [None] * (30 - count),
                 resolvedTypeRows={'46': {'valid': True, 'moneyYieldWord': 65535}} if count else {},
                 difficultyWord=difficulty, securityByte=security)
    if difficulty == 2:
        value['cityPlayerPredicate'] = player
    return value


def assert_rejection(value, reason):
    result = api.calculate_city_money_income_projection(value)
    assert result == {'supported': False, 'reason': reason, 'evidence': api.EVIDENCE}, (value, result, reason)
    return result


def cases():
    valid = [base(), base(baseMoneyWord=65535, securityByte=255), base(difficultyWord=2, cityPlayerPredicate=True),
             base(difficultyWord=2, cityPlayerPredicate=False),
             base(baseMoneyWord=-0.0, difficultyWord=-0.0, securityByte=-0.0),
             base(resolvedTypeRows={str(t): {'valid': False} for t in api.REVENUE_TYPES})]
    for t in (*range(0, 55), 255, 2 ** 31, 2 ** 32 - 1):
        for construction in (0, 1, 2, 2 ** 31, 2 ** 32 - 1):
            for row_valid in (False, True):
                for mint in (False, True):
                    valid.append(slot_case(t, construction, 101, row_valid, mint))
    for t in api.REVENUE_TYPES:
        valid.append(slot_case(t, 1, 0))
        valid.append(slot_case(t, 1, 65535))
    valid.append(base(slots=[{'facilityTypeWord': 31, 'constructionWord': 1, 'adjacentMint': i % 2 == 0} for i in range(30)],
                      resolvedTypeRows={'31': {'valid': True, 'moneyYieldWord': 1}}))
    valid.append(base(slots=[{'facilityTypeWord': 50, 'constructionWord': 0, 'adjacentMint': False},
                            {'facilityTypeWord': 31, 'constructionWord': 1, 'adjacentMint': True}] + [None] * 28,
                      resolvedTypeRows={'31': {'valid': True, 'moneyYieldWord': 101}, '50': {'valid': True, 'moneyYieldWord': 65535}}))
    bad = [(None, 'invalid-input'), ([], 'invalid-input'), ({}, 'invalid-input')]
    for p in ('stock', None, True, 1, [], {}):
        bad.append((base(profile=p), 'unsupported-profile'))
    for field in base():
        value = base(); del value[field]; bad.append((value, 'invalid-input'))
    for field, maximum in (('baseMoneyWord', 65535), ('difficultyWord', 2 ** 32 - 1), ('securityByte', 255)):
        for v in (-1, maximum + 1, True, False, None, '1', 0.25, [], {}):
            value = base(); value[field] = v; bad.append((value, 'invalid-input'))
    for field in ('finalIncome', 'rawFacilitySum', 'helperIncome', 'rng', 'person', 'force', 'capture', 'state', 'extra'):
        bad.append((base(**{field: 1}), 'unexpected-field'))
    for difficulty in (0, 1, 3, 2 ** 32 - 1):
        for predicate in (True, False, None, 'false', 0):
            bad.append((base(difficultyWord=difficulty, cityPlayerPredicate=predicate), 'unexpected-field'))
    bad.append((base(difficultyWord=2), 'invalid-input'))
    for v in (None, 0, 1, 'true', [], {}):
        bad.append((base(difficultyWord=2, cityPlayerPredicate=v), 'invalid-input'))
    for v in ([], None, True, {'32': {'valid': False}}, {'031': {'valid': False}}, {31: {'valid': False}}):
        bad.append((base(resolvedTypeRows=v), 'unexpected-field' if type(v) is dict else 'invalid-input'))
    for v, reason in ((None, 'invalid-input'), ({}, 'invalid-input'), ({'valid': 0}, 'invalid-input'),
                      ({'valid': True}, 'invalid-input'), ({'valid': False, 'moneyYieldWord': 0}, 'unexpected-field'),
                      ({'valid': False, 'extra': 0}, 'unexpected-field')):
        bad.append((base(resolvedTypeRows={'31': v}), reason))
    for v in (-1, 65536, True, None, '100', 0.5):
        bad.append((base(resolvedTypeRows={'31': {'valid': True, 'moneyYieldWord': v}}), 'invalid-input'))
    for length in (0, 1, 29, 31):
        bad.append((base(slots=[None] * length), 'invalid-input'))
    for v in (None, (), {}, True):
        bad.append((base(slots=v), 'invalid-input'))
    for v in ([], True, 31, {}, {'facilityTypeWord': 31}, {'constructionWord': 1}):
        bad.append((base(slots=[v] + [None] * 29), 'invalid-input'))
    for field in ('facilityTypeWord', 'constructionWord'):
        for v in (-1, 2 ** 32, True, False, None, '1', 1.5):
            value = slot_case(); value['slots'][0][field] = v; bad.append((value, 'invalid-input'))
    value = slot_case(); value['slots'][0]['rawIncome'] = 1; bad.append((value, 'unexpected-field'))
    for t in api.REVENUE_TYPES:
        value = slot_case(t); value['resolvedTypeRows'] = {}; bad.append((value, 'missing-type-row'))
    for t in (31, 50, 51):
        for construction in (0, 1):
            if t == 31 and construction == 0:
                continue
            value = slot_case(t, construction); del value['slots'][0]['adjacentMint']; bad.append((value, 'missing-adjacent-mint'))
            for v in (None, 0, 1, 'true', [], {}):
                value = slot_case(t, construction); value['slots'][0]['adjacentMint'] = v; bad.append((value, 'invalid-input'))
    for t, construction, valid_row in ((0, 1, True), (32, 1, True), (31, 0, True), (46, 1, True), (47, 1, True),
                                       (48, 1, True), (31, 1, False), (50, 0, False), (51, 0, False)):
        for v in (False, True, None, 1, 'false'):
            value = slot_case(t, construction, valid=valid_row); value['slots'][0]['adjacentMint'] = v
            bad.append((value, 'unexpected-field'))
    # Both unfinished upgrade paths require the fallback type, not the original row.
    for t in (50, 51):
        value = slot_case(t, 0); value['resolvedTypeRows'] = {str(t): {'valid': True, 'moneyYieldWord': 100}}
        bad.append((value, 'missing-type-row'))
    return valid, bad


def input_checks(profile):
    validator = Draft202012Validator(profile['inputSchema'])
    result_validator = Draft202012Validator(profile['resultSchema'])
    good, bad = cases()
    for value in good:
        validator.validate(value)
        before = deepcopy(value)
        result = api.calculate_city_money_income_projection(value)
        assert result['supported'] is True, (value, result)
        assert value == before
        result_validator.validate(result)
    schema_rejections = 0
    for value, reason in bad:
        result = assert_rejection(value, reason)
        result_validator.validate(result)
        # Integer dictionary keys and tuple/subclass objects aren't JSON data.
        try:
            encoded = json.dumps(value, allow_nan=False)
            decoded = json.loads(encoded)
        except (TypeError, ValueError):
            continue
        if decoded != value:
            continue
        assert not validator.is_valid(value), (value, reason)
        schema_rejections += 1
    # Receipt aliasing/isolation, including reused input slot and type-row values.
    value = slot_case(); value['slots'][1] = value['slots'][0]
    first = api.calculate_city_money_income_projection(value)
    value['slots'][0]['facilityTypeWord'] = 51; value['resolvedTypeRows']['31']['moneyYieldWord'] = 0
    assert first['slots'][0]['facilityTypeWord'] == 31 and first['slots'][1]['moneyYieldWord'] == 100
    first['slots'][0]['contribution'] = 999; first['evidence']['stockOriginalVerified'] = True
    second = api.calculate_city_money_income_projection(slot_case())
    assert second['slots'][0]['contribution'] == 100 and second['evidence']['stockOriginalVerified'] is False
    result = api.calculate_city_money_income_projection(base(baseMoneyWord=1.0, difficultyWord=1.0, securityByte=255.0))
    assert result['returnedIncome'] == 2 and all(type(result[k]) is int for k in ('baseMoneyWord', 'difficultyWord', 'securityByte'))
    extra_bad = 0
    for v in (float('nan'), float('inf'), -float('inf')):
        assert_rejection(base(baseMoneyWord=v), 'invalid-input'); extra_bad += 1
    class BadDict(dict):
        def __getitem__(self, key):
            raise AssertionError('must not invoke custom mapping')
    class BadProfile:
        def __eq__(self, other):
            raise AssertionError('must not invoke custom equality')
    assert_rejection(base(profile=BadProfile()), 'unsupported-profile'); extra_bad += 1
    class BadList(list):
        def __iter__(self):
            raise AssertionError('must not invoke custom list')
    assert_rejection(BadDict(base()), 'invalid-input'); extra_bad += 1
    assert_rejection(base(slots=BadList([None] * 30)), 'invalid-input'); extra_bad += 1
    assert_rejection(base(resolvedTypeRows=BadDict()), 'invalid-input'); extra_bad += 1
    value = base(); value['slots'][0] = BadDict(); assert_rejection(value, 'invalid-input'); extra_bad += 1
    return {'validJsonInputs': len(good), 'pythonRejectedInputs': len(bad), 'standardsSchemaRejectedJsonInputs': schema_rejections,
            'nonJsonPythonRejections': extra_bad, 'receiptInputIsolationVerified': True,
            'integralJsonNumbersAccepted': True, 'pythonReceiptsFrozen': False}


def arithmetic_checks():
    mint_cases = 0
    for y in range(65536):
        value = slot_case(money=y, mint=True)
        result = api.calculate_city_money_income_projection(value)
        assert result['supported'] and result['rawMoney'] == 3 * y // 2 and result['returnedIncome'] == 3 * y // 2
        mint_cases += 1
    supported = unsupported = 0
    raw_values = {0, 1, 99, 100, 101, 65535, 67372, 67373, 85000, 171798, 171799, 200000, 286331, 286332, 300000, 429496, 429497}
    for q in (75, 100, 125):
        for s in (50, 100, 101, 255):
            boundary = api.INT32_MAX // (q * s)
            raw_values.update((boundary - 1, boundary, boundary + 1))
    for raw in sorted(raw_values):
        for difficulty, player in ((0, False), (1, False), (2, True), (2, False), (3, False), (2 ** 31, False), (2 ** 32 - 1, False)):
            q = 125 if difficulty == 0 or difficulty == 2 and not player else 75 if difficulty == 2 else 100
            for security in range(256):
                value = raw_case(raw, difficulty, security, player)
                result = api.calculate_city_money_income_projection(value)
                effective_security = max(50, security)
                safe = raw * 100 <= api.INT32_MAX and (q == 100 or raw * 100 * q <= api.INT32_MAX) and raw * q * effective_security <= api.INT32_MAX
                assert result['supported'] is safe, (raw, difficulty, player, security, result)
                if safe:
                    assert result['returnedIncome'] == raw * q * effective_security // 10000
                    assert result['intermediates'] == {'scaledRaw': raw * 100, 'difficultyProduct': None if q == 100 else raw * 100 * q,
                        'difficultyAdjusted': raw * q, 'securityProduct': raw * q * effective_security,
                        'securityAdjusted': raw * q * effective_security // 100}
                    supported += 1
                else:
                    assert result['reason'] == 'unsupported-arithmetic-domain'; unsupported += 1
    maximum = base(baseMoneyWord=65535, slots=[{'facilityTypeWord': 31, 'constructionWord': 1, 'adjacentMint': True} for _ in range(30)],
                   resolvedTypeRows={'31': {'valid': True, 'moneyYieldWord': 65535}})
    assert 65535 + 30 * (3 * 65535 // 2) == 3014595
    assert 3014595 * 100 <= api.INT32_MAX
    assert_rejection(maximum, 'unsupported-arithmetic-domain')
    return {'mintYieldU16Values': mint_cases, 'rawMoneyBoundaryValues': len(raw_values), 'allSecurityByteValuesPerBoundary': 256,
            'difficultyPredicatePathsPerBoundary': 7, 'safeArithmeticInputs': supported, 'overflowRejectedInputs': unsupported,
            'maximumWidthBoundRawMoney': 3014595, 'firstRawTimes100OverflowUnreachableFromInputWidths': True,
            'allFacilityCombinationsExhausted': False, 'allRawMoneyValuesExhausted': False,
            'formulaTestsAreIndependentByteOracle': False}


def must_fail(fn, label):
    try:
        fn()
    except (AssertionError, ValidationError, ValueError, UnicodeError, KeyError, TypeError):
        return label
    raise AssertionError('mutation survived: ' + label)


def leaves(value, path=()):
    if type(value) is dict:
        for key, child in value.items():
            yield from leaves(child, path + (key,))
    elif type(value) is list:
        for key, child in enumerate(value):
            yield from leaves(child, path + (key,))
    else:
        yield path, value


def mutate(value):
    return not value if type(value) is bool else value + 1 if type(value) is int else value + ' [mutated]' if type(value) is str else 0


def guard_checks(profile, schema):
    utf8, gbk = api.SOURCE.read_bytes(), api.GBK_FILE.read_bytes()
    validator = Draft202012Validator(schema)
    metadata = schema_count = 0
    for label, original in (('profile', profile), ('schema', schema)):
        for path, value in leaves(original):
            changed = deepcopy(original); cursor = changed
            for key in path[:-1]:
                cursor = cursor[key]
            cursor[path[-1]] = mutate(value)
            if label == 'profile':
                assert not validator.is_valid(changed); metadata += 1
            else:
                schema_count += 1
            must_fail(lambda: api.check(changed if label == 'profile' else profile,
                                       changed if label == 'schema' else schema, utf8, gbk), label + str(path))
        for key in original:
            changed = deepcopy(original); del changed[key]
            must_fail(lambda: api.check(changed if label == 'profile' else profile,
                                       changed if label == 'schema' else schema, utf8, gbk), label + ':missing:' + key)
        changed = deepcopy(original); changed['unexpected'] = True
        must_fail(lambda: api.check(changed if label == 'profile' else profile,
                                   changed if label == 'schema' else schema, utf8, gbk), label + ':extra')
    coordinated = 0
    for key, value in profile['evidence'].items():
        if value is False:
            forged = deepcopy(profile); forged['evidence'][key] = True
            forged_schema = {'$schema': schema['$schema'], **api.closed_const_schema(forged)}
            Draft202012Validator(forged_schema).validate(forged)
            must_fail(lambda: api.check(forged, forged_schema, utf8, gbk), 'coordinated:' + key); coordinated += 1
    manifest = json.loads((api.MATERIALS / 'source-manifest.json').read_text())
    contents = {row['path']: (api.ROOT / row['path']).read_bytes() for row in manifest['files']}
    byte_mutations = 0
    for filename in ('source-body.bin', 'jump-table.bin', 'dispatch-table.bin'):
        path = 'docs/sources/city-money-income-projection/' + filename
        for offset in range(len(contents[path])):
            changed = dict(contents); raw = bytearray(changed[path]); raw[offset] ^= 1; changed[path] = bytes(raw)
            must_fail(lambda: api.verify_materials(manifest, changed), filename + ':' + str(offset)); byte_mutations += 1
    material_mutations = 0
    for path, raw in contents.items():
        changed = dict(contents); changed[path] = raw + b' '
        must_fail(lambda: api.verify_materials(manifest, changed), path); material_mutations += 1
    forged_manifest = deepcopy(manifest); forged_manifest['files'][0]['sha256'] = '0' * 64
    must_fail(lambda: api.verify_materials(forged_manifest, contents), 'coordinated-material-manifest')
    text = utf8.decode()
    source_variants = {
        'corrected-source-typo': text.replace('sar dl,05', 'sar edx,05'),
        'inline-mod-applied': text.replace('0049E644 - 74 0a', '0049E644 - eb 0a'),
        'mod1-applied': text.replace('0049E660 - e8 9b fe ff ff', '0049E660 - e8 4b f4 ff ff'),
        'missing-instruction': '\n'.join(line for line in text.splitlines() if not line.startswith('0049E61B -')),
        'incorrect-address': text.replace('0049E61B -', '0049E61C -'),
        'zero-padding-added': text.replace('数据区：', '0049E745 - 00 00 00 - invented padding\n数据区：'),
        'changed-dispatch-table': text.replace('03 01 02', '03 02 01'),
        'changed-jump-table': text.replace('14 E6 49 00', '15 E6 49 00'),
        'duplicate-original': text + text,
    }
    for label, changed in source_variants.items():
        assert changed != text
        must_fail(lambda: api.parse_listing(changed), label)
    changed = source_variants['corrected-source-typo'].encode(); changed_gbk = changed.decode().encode('gbk')
    forged = deepcopy(profile)
    forged['source'].update(utf8Bytes=len(changed), utf8Sha256=api.sha(changed), snapshotBytes=len(changed_gbk),
                            snapshotSha256=api.sha(changed_gbk), gitBlobSha1='0' * 40)
    forged_schema = {'$schema': schema['$schema'], **api.closed_const_schema(forged)}
    must_fail(lambda: api.check(forged, forged_schema, changed, changed_gbk), 'coordinated-source-schema')
    malformed_source = 0
    for a, b in ((utf8 + b' ', gbk), (utf8, gbk + b' '), (utf8, b'\x80' + gbk[1:])):
        must_fail(lambda: api.authenticate_source(a, b), 'source-encoding'); malformed_source += 1
    return {'metadataLeafMutationsRejected': metadata, 'schemaLeafMutationsRejected': schema_count,
            'metadataAndSchemaTopLevelShapeMutationsRejected': len(profile) + len(schema) + 2,
            'coordinatedEvidenceMutationsRejected': coordinated,
            'individualCodeAndTableByteMutationsRejected': byte_mutations,
            'materialFileMutationsRejected': material_mutations, 'manifestMutationRejected': True,
            'structuralSourceMutationsRejected': len(source_variants), 'coordinatedSourceSchemaMutationRejected': True,
            'encodingMutationsRejected': malformed_source, 'allRejected': True,
            'scope': 'source/profile/schema/material identity guards, not behavioral mutation tests'}


def python_typescript_checks():
    good, bad = cases()
    inputs = good + [value for value, _ in bad if json.loads(json.dumps(value)) == value]
    script = """import fs from 'node:fs';
import { calculateCityMoneyIncomeProjection as f } from './packages/engine/src/index.ts';
process.stdout.write(JSON.stringify(JSON.parse(fs.readFileSync(0,'utf8')).map(value => f(value))));"""
    process = subprocess.run(['node', '--input-type=module', '-e', script], cwd=api.ROOT,
                             input=json.dumps(inputs), capture_output=True, text=True, check=True)
    results = json.loads(process.stdout)
    assert len(results) == len(inputs)
    for index, (value, result) in enumerate(zip(inputs, results)):
        assert result == api.calculate_city_money_income_projection(value), (index, value, result)
    return {'actualPublicTypeScriptReceiptComparisons': len(inputs), 'allReceiptsMatchPython': True,
            'independentByteOracle': False}


def cli_checks():
    command = [sys.executable, str(api.ROOT / 'scripts/check_city_money_income.py')]
    invalid = 0
    for args in (['--unknown'], ['--input'], ['--output'], ['--profile', 'stock'], ['{}'], ['--in', 'x']):
        result = subprocess.run(command + args, capture_output=True, text=True)
        assert result.returncode != 0 and not result.stdout; invalid += 1
    with tempfile.TemporaryDirectory(prefix='city-money-income-cli-') as temp:
        temp = Path(temp); path = temp / 'input.json'; output = temp / 'output.json'
        path.write_text(json.dumps(slot_case(51, 0, 101, mint=True, baseMoneyWord=700)))
        result = subprocess.run(command + ['--input', str(path), '--output', str(output)], capture_output=True, text=True, check=True)
        assert result.stdout == output.read_text()
        assert json.loads(result.stdout)['returnedIncome'] == 851
        malformed = 0
        for text in ('{', '{"profile": 1, "profile": 2}', 'NaN', 'Infinity'):
            path.write_text(text)
            result = subprocess.run(command + ['--input', str(path)], capture_output=True, text=True, check=True)
            assert json.loads(result.stdout)['reason'] == 'invalid-input'; malformed += 1
    return {'argumentFormsRejected': invalid, 'inputFileExecuted': True, 'outputMatchesStdout': True,
            'malformedJsonInputsRejected': malformed, 'duplicateKeysRejected': True}


def main():
    assert len(sys.argv) == 1, 'test runner accepts no arguments'
    source = api.check_all_sources()
    profile = json.loads(api.PROFILE_FILE.read_text()); schema = json.loads(api.SCHEMA_FILE.read_text())
    report = {'profile': api.PROFILE, 'source': source, 'sourceGuards': guard_checks(profile, schema),
              'inputSchemaAndPythonApi': input_checks(profile), 'arithmetic': arithmetic_checks(),
              'pythonVersusTypeScript': python_typescript_checks(), 'cli': cli_checks(),
              'stockOriginalVerified': False, 'originalExecutableExecuted': False}
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
