"""Authenticate bounded quantity evidence, independent MOD regions and closed docs.

No original executable is run. --schema separately exercises the standard
Draft2020-12 validator and all default guards; the default source guard needs
only the standard library.
Neither command substitutes for the independent byte oracle or precision sweep.
"""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
BLOB = 'e8c0c22e68e8557b202088290d52101abb02ca3a'
UTF8 = '65be4259fef8c741dee5d3df32a3f8fd6b00214427536daa624c0e6c8da00c53'
GBK = 'cadf90aa55d43b69f407620abebccf6fb4307ed7dcb5511f434779f38b722285'
CODE = '083337e2420a74a923349256cc7add7e6c665ccccad6f3406ea2f343d3bbceb1'
SCHEMA = 'f5e38e1b83c0d20a3d6c91d767a092aafe95fe7728810dbd0939c3f10164b176'
MARKERS = ('修改1 - 能吏繁殖效果自定义', '修改2 - 特产/非特产城市产量自定义')
DOCS = ['README.md', 'TODO.md', '缺少的数据.md', '确定规则.md',
        'docs/rules/README.md', 'docs/rules/STATUS.md', 'docs/rules/SOURCES.md',
        'docs/rules/04-military.md', 'docs/rules/02-economy.md',
        'docs/rules.md', 'docs/open-questions.md', 'docs/rules/production-quantity.md']
sha = lambda raw: hashlib.sha256(raw).hexdigest()
blob = lambda raw: hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
canonical = lambda value: json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()


def validate_closed(value, schema):
    """Strictly typed fixed-record subset of the separately checked JSON Schema."""
    kind = schema['type']
    if kind == 'object':
        assert type(value) is dict and schema['additionalProperties'] is False
        assert set(value) == set(schema['required']) == set(schema['properties'])
        for key, child in value.items():
            validate_closed(child, schema['properties'][key])
    elif kind == 'array':
        assert type(value) is list and len(value) == schema['minItems'] == schema['maxItems']
        assert schema['items'] is False and len(value) == len(schema['prefixItems'])
        for child, spec in zip(value, schema['prefixItems']):
            validate_closed(child, spec)
    else:
        typ = {'integer': int, 'boolean': bool, 'string': str, 'null': type(None)}[kind]
        assert type(value) is typ and value == schema['const']


def schema_check(schema):
    assert sha(canonical(schema)) == SCHEMA, 'changed closed evidence schema'


def rows(text):
    return [(int(a, 16), bytes.fromhex(b), asm) for a, b, asm in re.findall(
        r'^([0-9A-F]{8}) - ((?:[0-9a-f]{2} )+)\s+- (.*)$', text, re.M)]


def relative(row):
    raw = row[1]
    return raw[0] in (0xe8, 0xe9, 0xeb, 0x74, 0x75, 0x7c, 0x7d, 0x7e, 0x7f) or (raw[:2] == b'\x0f\x8f')


def target(row):
    address, raw, _ = row
    assert relative(row)
    offset = raw[2:] if raw[0] == 0x0f else raw[1:]
    return address + len(raw) + int.from_bytes(offset, 'little', signed=True)


def listing_check(values, info, start, end, row_count, instruction_count, size, digest):
    cursor = start
    for address, raw, _ in values:
        assert address == cursor, 'listing address gap, duplicate or MOD overlay'
        cursor += len(raw)
    code = b''.join(raw for _, raw, _ in values)
    assert cursor == end and len(values) == row_count and len(code) == size and sha(code) == digest
    assert info['start'] == f'{start:08X}' and info['endInclusive'] == f'{end-1:08X}'
    assert info['endExclusive'] == f'{end:08X}' and info['listingRowCount'] == row_count
    assert info['instructionCount'] == instruction_count and info['byteLength'] == size and info['sha256'] == digest
    for row in values:
        if relative(row):
            assert target(row) == int(row[2].split()[1], 16), 'relative target disagrees with listing'


def source_check(text, p):
    raw, gbk = text.encode('utf-8'), text.encode('gbk')
    assert len(raw) == 10336 and sha(raw) == UTF8
    assert len(gbk) == 9650 and sha(gbk) == GBK and blob(gbk) == BLOB
    assert gbk.decode('gbk') == text and all(text.count(m) == 1 for m in MARKERS)
    before, mod1 = text.split(MARKERS[0]); mod1, mod2 = mod1.split(MARKERS[1])
    original = [r for r in rows(before) if 0x5c63d0 <= r[0] < 0x5c64ce]
    m1, m2 = rows(mod1), rows(mod2)
    listing_check(original, p['originalListing'], 0x5c63d0, 0x5c64ce, 88, 88, 254, CODE)
    by = {r[0]: r for r in original}
    calls = [{'address': f'{r[0]:08X}', 'target': f'{target(r):08X}'} for r in original if r[1][0] == 0xe8]
    branches = [{'address': f'{r[0]:08X}', 'target': f'{target(r):08X}'} for r in original if relative(r) and r[1][0] != 0xe8]
    assert calls == p['originalListing']['calls'] and len(calls) == 5
    assert branches == p['originalListing']['branches'] and len(branches) == 15
    assert all(int(r['target'], 16) in by for r in branches)
    a, b = p['excludedMods']
    listing_check(m1[:2], a['patch'], 0x5c648a, 0x5c6491, 2, 3, 7,
                  '6125f5f7f6c9c2ba63eb342048fe99e88c24c29acd9c4a2c7281a260d4d6b106')
    assert m1[1][1] == b'\x90\x90' and m1[1][2] == 'nop nop'
    listing_check(m1[2:], a['trampoline'], 0x8a95f8, 0x8a960f, 6, 6, 23,
                  'b903c3a2e5461297bdfc3bb32924aeca36dcbbe257777186eedbff4424c139ab')
    listing_check(m2[:1], b['patch'], 0x5c64a7, 0x5c64ac, 1, 1, 5,
                  '73c515cccd0de0ba26d8fabd800aa94cf5e7f009a0edb8deaf6bad13e47b6a6b')
    listing_check(m2[1:], b['trampoline'], 0x8a9d48, 0x8a9d87, 20, 20, 63,
                  '729d96341ea81278f73ebb3d2b57b49bf7447189640155332e6f3280abbae09b')
    data_rows = re.findall(r'^008A8170 - ((?:[0-9a-f]{2} )+) ', mod2, re.M)
    assert len(data_rows) == 1
    data = bytes.fromhex(data_rows[0])
    assert len(data) == b['data']['byteLength'] == 16
    assert sha(data) == b['data']['sha256'] == '2fece05476ea75674604c5d22ec05d755837b18fb0ddedea70b6a17d70bc276f'
    for address, expected in [
        (0x5c63dc, '7c 05'), (0x5c641d, '0f 8f a3 00 00 00'), (0x5c6427, 'bf 00 00 00 80'),
        (0x5c6440, '85 c0'), (0x5c644b, '0f b6 c0'), (0x5c6462, '85 c0'), (0x5c646f, '83 fb 03'),
        (0x5c647a, '8d 84 2f c8 00 00 00'), (0x5c6481, '8d 04 80'), (0x5c648a, '8d 14 00'),
        (0x5c64a0, 'da 4c 24 18'), (0x5c64ae, '83 3d 78 19 20 07 02'),
        (0x5c64bb, 'ff 52 48'), (0x5c64be, '85 c0'), (0x5c64c2, '03 f6')]:
        assert by[address][1] == bytes.fromhex(expected)
    assert 'call 004890a0' in by[0x5c6446][2] and '产量由政治决定' in by[0x5c6446][2]
    assert '超级难度电脑征兵加倍' in by[0x5c64c2][2]


def check(p, text, schema):
    schema_check(schema)
    validate_closed(p, schema)
    source_check(text, p)
    license_bytes = (ROOT / p['license']['snapshot']).read_bytes()
    assert len(license_bytes) == p['license']['bytes'] == 11357
    assert sha(license_bytes) == p['license']['sha256'] == 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
    assert blob(license_bytes) == p['license']['gitBlobSha1'] == '261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64'
    assert p['license']['snapshot'] == 'docs/sources/production-price-LICENSE.txt'
    assert all(p[k] is False and p['evidence'][k] is False for k in
               ['stockOriginalVerified', 'originalExecutableExecuted', 'commandIntegrated'])
    assert all(m['executedByProduction'] is False for m in p['excludedMods'])


GUIDE_PHRASES = [BLOB, 'source-listing-reconstruction', 'stockOriginalVerified=false',
    'originalExecutableExecuted=false', 'commandIntegrated=false', '005C63D0..005C64CD', '88 条 / 254 bytes',
    '5 个 direct CALL、15 个相对 branch', 'Apache-2.0', 'production-price-LICENSE.txt',
    '2 列表行、3 指令 / 7 bytes', '6 条 / 23 bytes', '20 条 / 63 bytes', '16 bytes',
    'nativeEquipmentType', 'native-invalid-type-return-zero', 'single-item-return-one',
    'resolvedInputsObserved=false', 'resolvedInputsObserved=true', 'intelligenceGetterEax', 'skillHelperEax',
    'intelligenceAl', 'validSlotCount', 'intelligenceSum', 'intelligenceMax', 'skillQueryId=-1',
    'type0仍调用特技helper', '首槽可以为null', 'MOVZX EAX,AL', 'TEST EAX,EAX',
    'baseQuantity = (maxAL + sumAL + 200) * 5', 'skillAdjustedQuantity', 'convertedQuantity',
    'superApplied', 'returnedQuantity', 'cityVirtualObserved', 'cityVirtualEax === 0',
    '其他难度必须省略该字段', 'resolvedFacilityFactorBits', '3F800000', '3F99999A', '3FC00000',
    '5033165/4194304', '3F999999', '不提供默认值', '没有这三个地址的原4bytes',
    '24/53/64', '80676', '786432', '00707A74', 'P0-10', 'INT32_MIN', '0x800003E8',
    '1522', '3045', '3044', '18000', '36600', '原体没有9000上限', '返回数量无9000cap，不等于实际入库无cap',
    '004B4040', 'MOD', '政治', '名声', '完整生产资格', 'Train', 'EndTurn', 'state/save/replay', 'P0-78',
    'PR #50', '946bd63a83f4eae5256d4be8ac7d2674e01cedb3', '本批为生产数量本地候选，尚未发布']


def docs_check(docs):
    assert set(docs) == set(DOCS)
    guide = docs['docs/rules/production-quantity.md']
    for name, text in docs.items():
        if name != 'docs/rules/production-quantity.md':
            assert 'production-quantity.md' in text, name
    for phrase in GUIDE_PHRASES:
        assert phrase in guide, phrase
    for phrase in ['stockOriginalVerified=true', 'originalExecutableExecuted=true', 'commandIntegrated=true', '兵装生产已完整恢复']:
        assert phrase not in guide, phrase
    for name in ['README.md', 'TODO.md', 'docs/rules/STATUS.md', '缺少的数据.md']:
        assert 'PR #49' in docs[name] and 'PR #50' in docs[name], name
    military = docs['docs/rules/04-military.md'].split('## 2. 枪/戟/弩/马生产量')[1].split('### 2.1')[0]
    for phrase in ['原体没有9000上限或1010最低值', '向零转换后', '首槽可null', '实际库存裁剪仍缺']:
        assert phrase in military, phrase
    assert '\n结果四舍五入。' not in military and '\n- 上限 9000。' not in military
    assert '每座可生产一次，上限 9000' not in docs['确定规则.md']
    assert '单次返回量见[数量限定核]' in docs['确定规则.md']
    for name in ['docs/rules.md', 'docs/open-questions.md']:
        assert '旧“锻冶700金/厩舍800金”' in docs[name] and '撤回' in docs[name]
        assert '生产名声×1.5撤回' in docs[name] and '无9000cap' in docs[name]
    assert '武将政治/生产公式' not in docs['docs/rules/02-economy.md']
    assert '智力getter AL与完整技能helper EAX' in docs['docs/rules/02-economy.md']


def paths(value, prefix=()):
    yield prefix, value
    if isinstance(value, dict):
        for key, child in value.items():
            yield from paths(child, prefix + (key,))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from paths(child, prefix + (index,))


def replace_path(value, path, replacement):
    copy = deepcopy(value)
    if not path:
        return replacement
    current = copy
    for key in path[:-1]:
        current = current[key]
    current[path[-1]] = replacement
    return copy


def profile_mutations(profile):
    for path, value in paths(profile):
        label = '.'.join(map(str, path)) or 'root'
        if isinstance(value, dict):
            changed = deepcopy(value); changed['unknown'] = True
            yield label + ':extra', replace_path(profile, path, changed)
            for key in value:
                changed = deepcopy(value); del changed[key]
                yield label + ':missing-' + key, replace_path(profile, path, changed)
        elif isinstance(value, list):
            yield label + ':length', replace_path(profile, path, value + [None])
        else:
            changed = not value if type(value) is bool else value + 1 if type(value) is int else value + ' changed' if type(value) is str else 0
            yield label + ':value', replace_path(profile, path, changed)
    yield 'bool-not-integer', replace_path(profile, ('stockOriginalVerified',), 0)


def must_reject(call, label):
    try:
        call()
    except (AssertionError, ValueError, KeyError, TypeError, UnicodeError):
        return
    raise AssertionError('controlled mutation survived: ' + label)


def main():
    if sys.flags.optimize != 0:
        raise RuntimeError('source guard requires enabled assertions')
    assert sys.argv[1:] in ([], ['--schema']), 'usage: check_production_quantity.py [--schema]'
    p = json.loads((ROOT / 'docs/sources/production-quantity.json').read_text())
    s = json.loads((ROOT / 'docs/sources/production-quantity.schema.json').read_text())
    text = (ROOT / 'docs/sources/production-quantity-original.txt').read_bytes().decode('utf-8')
    mutations = list(profile_mutations(p))
    if sys.argv[1:] == ['--schema']:
        from jsonschema import Draft202012Validator
        schema_check(s); Draft202012Validator.check_schema(s)
        validator = Draft202012Validator(s); validator.validate(p)
        for label, candidate in mutations:
            assert not validator.is_valid(candidate), 'standard schema accepted: ' + label
        print(f'PASS: standard Draft2020-12 schema accepts fixed evidence and rejects {len(mutations)} controlled profile mutants')
    check(p, text, s)
    for label, candidate in mutations:
        must_reject(lambda: check(candidate, text, s), label)
    source_mutations = [
        (MARKERS[0], 'lost first MOD boundary'), (MARKERS[1], 'lost second MOD boundary'),
        ('005C63DC - 7c 05', '005C63DC - 72 05'), ('005C6427 - bf 00 00 00 80', '005C6427 - bf 00 00 00 00'),
        ('005C644B - 0f b6 c0', '005C644B - 0f be c0'), ('005C6462 - 85 c0', '005C6462 - 84 c0'),
        ('005C646F - 83 fb 03', '005C646F - 83 fb 02'), ('005C64A7 - e8 c8', '005C64A7 - e8 c9'),
        ('005C64BE - 85 c0', '005C64BE - 84 c0'), ('005C648F - 90 90', '005C648F - 90 91'),
        ('008A95F8 - 69 c0 c8', '008A95F8 - 69 c0 c9'), ('008A9D64 - 0f b6', '008A9D64 - 0f be'),
        ('008A8170 - 64', '008A8170 - 65'), ('超级难度电脑征兵加倍', 'silently corrected comment'),
        ('【修改】call 004890a0', 'lost inline MOD marker')]
    for before, after in source_mutations:
        assert before in text
        must_reject(lambda: check(p, text.replace(before, after, 1), s), before)
    schema_mutations = []
    for path, node in paths(s):
        if isinstance(node, dict) and 'type' in node:
            changed = deepcopy(node)
            if node['type'] == 'object': changed['additionalProperties'] = True
            elif node['type'] == 'array': changed['maxItems'] += 1
            else: del changed['const']
            schema_mutations.append(replace_path(s, path, changed))
    for index, candidate in enumerate(schema_mutations):
        must_reject(lambda: check(p, text, candidate), 'schema-' + str(index))
    docs = {name: (ROOT / name).read_text() for name in DOCS}
    docs_check(docs)
    document_mutations = []
    for phrase in GUIDE_PHRASES:
        changed = dict(docs); changed['docs/rules/production-quantity.md'] = changed['docs/rules/production-quantity.md'].replace(phrase, '[removed]')
        document_mutations.append((phrase, changed))
    for name in DOCS[:-1]:
        changed = dict(docs); changed[name] = changed[name].replace('production-quantity.md', 'missing-quantity-link.md')
        document_mutations.append((name, changed))
    for name, before, after in [
        ('docs/rules/04-military.md', '原体没有9000上限或1010最低值', '上限9000'),
        ('确定规则.md', '单次返回量见[数量限定核]', '每座可生产一次，上限 9000'),
        ('docs/rules.md', '生产名声×1.5撤回', '生产名声×1.5'),
        ('docs/open-questions.md', '生产名声×1.5撤回', '生产名声×1.5'),
        ('docs/rules/02-economy.md', '智力getter AL与完整技能helper EAX', '武将政治/生产公式')]:
        assert before in docs[name]
        changed = dict(docs); changed[name] = changed[name].replace(before, after)
        document_mutations.append((name + ':' + before, changed))
    for label, candidate in document_mutations:
        must_reject(lambda: docs_check(candidate), label)
    check(p, text, s); docs_check(docs)
    print('PASS: fixed GBK/UTF-8 source; 88 instructions/254 bytes; 5 direct CALL/15 branch targets; 2 isolated MODs and 16-byte data; reused Apache-2.0 license')
    print(f'PASS: {len(mutations)} profile, {len(source_mutations)} source and {len(schema_mutations)} schema controlled mutants rejected')
    print(f'PASS: {len(docs)} current documents and {len(document_mutations)} controlled document mutants; resolved numerical quantity only')


if __name__ == '__main__':
    main()
