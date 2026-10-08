"""Verify the original public listing, excluded MOD and closed numerical evidence.

Uses only the standard library. This verifies a GBK source blob, not stock code.
"""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE_BLOB = '76b1f9591a9f94830bcf4e5a67764d2911e19fd4'
UTF8_SHA = 'f092b0a16ab99ca74106c967e4dfb320211c2b4d2a066f0ca36b4be84272b132'
GBK_SHA = 'cabc5cb11e62dee04fda39aadce804284d272ca20e98ece202fd16cedfbe9216'
CODE_SHA = '8529878a0dca1cd080dfa805b5112ff940eba58631f31c5c5c83025400c7106c'
MOD_SHA = '6067cd400b4750217191e66a2e133f6327281261ebd033dd7e686c7ab98f4e03'


def parse(text):
    original, mod = [], []
    for line in text.splitlines():
        if not line:
            continue
        match = re.fullmatch(r'(\*?)([0-9A-F]{8}) - ((?:[0-9a-f]{2} )+) +- (.*)', line)
        assert match is not None, 'unparsed source line'
        row = (int(match[2], 16), bytes.fromhex(match[3]), match[4].split('  ')[0])
        (mod if match[1] else original).append(row)
    return original, mod


def target(row):
    address, raw, _ = row
    assert raw[0] in (0xe8, 0xe9, 0x74, 0x7d, 0x7c, 0x7e)
    return address + len(raw) + int.from_bytes(raw[1:], 'little', signed=True)


def check_listing(text):
    rows, mod = parse(text)
    cursor = 0x005bb1d0
    for address, raw, _ in rows:
        assert address == cursor, 'original address gap, duplicate or MOD mixing'
        cursor += len(raw)
    code = b''.join(row[1] for row in rows)
    assert len(rows) == 84 and len(code) == 219 and cursor == 0x005bb2ab
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    assert [r[0] for r in mod] == [0x005bb263, 0x008a9de8, 0x008a9deb, 0x008a9ded,
                                  0x008a9df3, 0x008a9df8, 0x008a9df9, 0x008a9dfb, 0x008a9dfd]
    mcode = b''.join(row[1] for row in mod)
    assert len(mcode) == 31 and hashlib.sha256(mcode).hexdigest() == MOD_SHA
    assert target(mod[0]) == 0x008a9de8 and target(mod[-1]) == 0x005bb268
    by_address = {r[0]: r for r in rows}
    for call in (0x005bb1ed, 0x005bb1f9, 0x005bb207):
        assert target(by_address[call]) == 0x004890a0
    for call in (0x005bb223, 0x005bb237, 0x005bb279):
        assert target(by_address[call]) == 0x00490b90
    for branch, dest in [(0x005bb1e9, 0x005bb20f), (0x005bb203, 0x005bb20f),
                         (0x005bb213, 0x005bb1e0), (0x005bb26a, 0x005bb2a3)]:
        assert target(by_address[branch]) == dest
    def at(address, expected):
        raw = bytes.fromhex(expected); start = address - 0x005bb1d0
        assert code[start:start + len(raw)] == raw, hex(address)
    at(0x005bb23e, '8b 44 24 10 99 2b c2 d1 f8 03 d8')
    at(0x005bb249, '0f b7 81 c2 00 00 00 c1 e8 02 0f b7 cd 2b c8 b8 39 8e e3 38 f7 e9 d1 fa 8b ca c1 e9 1f 03 ca')
    at(0x005bb268, '3b cb 7e 37')
    at(0x005bb27e, '0f b7 90 c2 00 00 00 c1 ea 02 0f b7 cf 2b ca b8 39 8e e3 38 f7 e9 5f d1 fa 5e 8b c2 c1 e8 1f 5d 03 c2')
    at(0x005bb2a6, '8b c3 5b 59 c3')
    assert hashlib.sha256(text.encode('utf-8')).hexdigest() == UTF8_SHA
    original = text.encode('gbk')
    assert len(original) == 5936 and hashlib.sha256(original).hexdigest() == GBK_SHA
    assert hashlib.sha1(b'blob ' + str(len(original)).encode() + b'\0' + original).hexdigest() == SOURCE_BLOB


def validate_closed(value, schema):
    """Exact typed subset emitted by the accompanying Draft2020-12 schema."""
    kind = schema['type']
    if kind == 'object':
        assert type(value) is dict and schema['additionalProperties'] is False
        assert set(value) == set(schema['required']) == set(schema['properties'])
        for key, child in value.items():
            validate_closed(child, schema['properties'][key])
    elif kind == 'array':
        assert type(value) is list and len(value) == schema['minItems'] == schema['maxItems']
        assert schema['items'] is False and len(schema['prefixItems']) == len(value)
        for child, spec in zip(value, schema['prefixItems']):
            validate_closed(child, spec)
    else:
        typ = {'integer': int, 'boolean': bool, 'string': str, 'null': type(None)}[kind]
        assert type(value) is typ and value == schema['const']


def check(profile, text, schema):
    check_listing(text)
    validate_closed(profile, schema)
    assert profile['source']['gitBlobSha1'] == SOURCE_BLOB
    assert profile['source']['snapshotSha256'] == UTF8_SHA
    assert profile['source']['originalSha256'] == GBK_SHA
    assert profile['originalListing']['sha256'] == CODE_SHA
    assert profile['excludedMod']['listedBytesSha256'] == MOD_SHA
    assert profile['scope'] == 'standalone-resolved-stable-input-numerical-rate-only'
    assert profile['constants'] == {'politicsDivisor': 2, 'durabilityQuarterDivisor': 4,
                                   'durabilityRemainderDivisor': 9, 'signedDivisionMagic': '0x38E38E39'}
    assert profile['stockOriginalVerified'] is False and profile['excludedMod']['executed'] is False


def check_documentation(docs):
    for name, text in docs.items():
        if name != 'docs/rules/domestic-construction-rate.md':
            assert 'domestic-construction-rate.md' in text, name
    guide = docs['docs/rules/domestic-construction-rate.md']
    for required in ['source-listing-reconstruction', '005BB1D0..005BB2AA', SOURCE_BLOB,
                     '004890A0', '00490B90', 'floor(durabilityRemainder / 9)',
                     'stockOriginalVerified=false', 'originalExecutableExecuted=false',
                     '初始耐久 writer', '完整开发/显示日数', 'MOD']:
        assert required in guide, required
    economy = docs['docs/rules/02-economy.md'].split('## 7. ', 1)[1].split('## 8. ', 1)[0]
    assert '已找到完整' in economy and 'floor((D - floor(D / 4)) / 9)' in economy
    assert '旧 Wiki 合成政治重建不是等价式' in economy
    assert '完整开发日数计算及显示日数 caller' in economy
    assert '**当前仍未拿到 PC-PK1.1 计算内政开发日数的完整反汇编函数体**' not in economy


def main():
    profile = json.loads((ROOT / 'docs/sources/domestic-construction-rate.json').read_text())
    schema = json.loads((ROOT / 'docs/sources/domestic-construction-rate.schema.json').read_text())
    text = (ROOT / 'docs/sources/domestic-construction-rate-original.txt').read_bytes().decode('utf-8')
    check(profile, text, schema)
    docs = {name: (ROOT / name).read_text() for name in ['README.md', 'TODO.md', 'docs/rules.md',
        'docs/rules/README.md', 'docs/rules/STATUS.md', 'docs/rules/SOURCES.md',
        'docs/rules/17-post-15-source-audit.md', 'docs/rules/02-economy.md',
        'docs/rules/domestic-construction-rate.md', '确定规则.md', '缺少的数据.md']}
    check_documentation(docs)
    mutants = []
    for field in profile:
        p = deepcopy(profile); del p[field]; mutants.append(('missing-' + field, p, text))
    for field, value in [('scope', 'complete-duration'), ('stockOriginalVerified', True),
                         ('originalExecutableExecuted', True), ('level', 'stock-exact')]:
        p = deepcopy(profile); p[field] = value; mutants.append((field, p, text))
    for section in ['source', 'domain', 'constants', 'originalListing', 'excludedMod', 'evidence']:
        for field in profile[section]:
            p = deepcopy(profile); p[section][field] = 'altered-null' if profile[section][field] is None else None
            mutants.append((section + '-' + field, p, text))
    p = deepcopy(profile); p['constants']['durabilityRemainderDivisor'] = 10; mutants.append(('division10', p, text))
    p = deepcopy(profile); p['originalExecutableExecuted'] = 0; mutants.append(('bool-as-int', p, text))
    p = deepcopy(profile); p['extra'] = 1; mutants.append(('extra-field', p, text))
    for before, after in [('005BB263 - c1 e9 1f', '005BB263 - e9 80 eb'),
                          ('*005BB263', '005BB263'), ('005BB247 - 03 d8', '005BB247 - 03 c8'),
                          ('005BB26A - 7e 37', '005BB26A - 7c 37'),
                          ('b8 39 8e e3 38', 'b8 67 66 66 66'),
                          ('005BB250 - c1 e8 02', '005BB250 - c1 e8 03'),
                          ('005BB1F9 - e8 a2 de ec ff', '005BB1F9 - e8 a1 de ec ff'),
                          ('005BB2AA - c3', '005BB2AB - c3'), ('EBX＝最高政＋总和/2', 'EBX＝最高政＋总和/3')]:
        assert before in text; mutants.append((before, profile, text.replace(before, after, 1)))
    mutants.append(('truncated', profile, '\n'.join(text.splitlines()[:-2]) + '\n'))
    for name, p, t in mutants:
        check(profile, text, schema)
        try:
            check(p, t, schema)
        except (AssertionError, UnicodeError):
            pass
        else:
            raise AssertionError('Source/profile mutation survived: ' + name)
    doc_mutants = [
        ('docs/rules/domestic-construction-rate.md', 'floor(durabilityRemainder / 9)', 'floor(durabilityRemainder / 10)'),
        ('docs/rules/domestic-construction-rate.md', 'stockOriginalVerified=false', 'stockOriginalVerified=true'),
        ('docs/rules/domestic-construction-rate.md', '初始耐久 writer', '已完成初始写入'),
        ('docs/rules/02-economy.md', '旧 Wiki 合成政治重建不是等价式', '旧 Wiki 合成政治重建是等价式'),
        ('docs/rules/02-economy.md', '已找到完整', '只有caller'),
    ]
    for name, old, new in doc_mutants:
        check_documentation(docs)
        changed = dict(docs); assert old in changed[name]
        changed[name] = changed[name].replace(old, new)
        try:
            check_documentation(changed)
        except AssertionError:
            pass
        else:
            raise AssertionError('Documentation mutation survived: ' + old)
    print(f'PASS: original GBK Git blob, 84 original instructions/219 continuous bytes, 9 MOD lines/31 listed bytes isolated; {len(mutants)} source/profile mutants killed with controls')
    print(f'PASS: {len(docs)} current source/scope documents; {len(doc_mutants)} documentation mutants killed with controls')
    print('Stable resolved inputs only; initial writer, duration, scheduler, mutable getters and clean-stock remain open.')


if __name__ == '__main__':
    main()
