"""Closed source/profile/document guard for the standalone patrol numerical projection.

No original executable or helper runs. The source's mnemonic typo is preserved;
bytes, fixed Git identity, native/MOD separation and explicit scope are checked.
"""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import re

from check_domestic_construction_rate import validate_closed

ROOT = Path(__file__).resolve().parents[1]
BLOB = '71b6c28bdc4c3d0f591d0af5ee813c8fb9f4134a'
UTF8 = '3989a39a14e15d83c6f8ed7ef5b057a3fed92441c26ff3cc3ec60c0a08e6d52a'
GBK = '8f6c8f52f13c83804629202238e0db60c0e9f048c4b891501050c618ba9fc315'
CODE = '57471a89512c477dadcab409565d8b38fcb428963e894f828972714d87687543'
MOD = '4a39ecdd13e7d2e72465ff60113b4a717810bc40c724822472fd6efebeaa8f50'
MARKER = '修改 - 巡查倍率可调整'


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def blob(raw):
    return hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()


def rows(text):
    return [(int(a, 16), bytes.fromhex(raw), asm) for a, raw, asm in re.findall(
        r'^(?:\*+)?([0-9A-F]{8}) - ((?:[0-9a-f]{2} )+)\s+- (.*)$', text, re.M)]


def range_check(values, begin, end, count, digest):
    cursor = begin
    for address, raw, _ in values:
        assert address == cursor, 'instruction gap or original/MOD mixing'
        cursor += len(raw)
    raw = b''.join(row[1] for row in values)
    assert cursor == end and len(values) == count and sha(raw) == digest
    return raw


def target(row):
    address, raw, _ = row
    offset = 2 if raw[:2] == b'\x0f\x84' else 1
    return address + len(raw) + int.from_bytes(raw[offset:], 'little', signed=True)


def source_check(text, p):
    assert text.count(MARKER) == 1
    assert text.count('【获取指针并校验】') == 1
    before, mod_text = text.split(MARKER)
    original = rows(before.split('【获取指针并校验】', 1)[1])
    mod = rows(mod_text)
    raw = range_check(original, 0x5cba10, 0x5cbadc, 79, CODE)
    range_check(mod, 0x5cba83, 0x5cba98, 7, MOD)
    assert len(raw) == 204
    by = {r[0]: r for r in original}
    calls = [{'address': f'{r[0]:08X}', 'target': f'{target(r):08X}'} for r in original if r[1][0] == 0xe8]
    branches = [{'address': f'{r[0]:08X}', 'target': f'{target(r):08X}'} for r in original
                if r[1][0] in (0x74, 0x7c, 0x7e) or r[1][:2] == b'\x0f\x84']
    assert calls == p['originalListing']['calls'] and len(calls) == 7
    assert branches == p['originalListing']['branches'] and len(branches) == 7
    assert all(int(r['target'], 16) in by for r in branches)
    for address, expected in [
        (0x5cba78, '0f b6 c8'), (0x5cba87, 'b8 93 24 49 92'),
        (0x5cba90, 'c1 fa 04'), (0x5cbaa7, '85 c0'), (0x5cbaab, '74 09'),
        (0x5cbaba, '0f b6 82 85 00 00 00'), (0x5cbac7, '7e 07'),
        (0x5cbace, '2b f0'), (0x5cbad7, '33 c0')]:
        assert by[address][1] == bytes.fromhex(expected)
    assert by[0x5cba90][2] == 'sar dl,04'  # source typo retained, not blessed as decoding
    encoded = text.encode('utf-8'); original_bytes = text.encode('gbk')
    assert len(encoded) == 7013 and sha(encoded) == UTF8
    assert len(original_bytes) == 6637 and sha(original_bytes) == GBK and blob(original_bytes) == BLOB
    assert original_bytes.decode('gbk') == text


def check(p, text, schema):
    validate_closed(p, schema)
    source_check(text, p)
    assert p['constants'] == {'leadershipDivisor': 28, 'baseOffset': 2, 'pressureDivisor': 2,
                             'publicOrderCap': 100, 'signedDivisionMagic': '0x92492493'}
    assert p['scope'] == 'standalone-resolved-stable-input-numerical-gain-only'
    assert p['stockOriginalVerified'] is False and p['originalExecutableExecuted'] is False
    assert p['excludedMod']['executed'] is False
    assert p['commandContext']['techniquePointsImplemented'] is False


def extra_sources_check(p):
    context = p['commandContext']['source']; raw = (ROOT / context['snapshot']).read_bytes()
    original = raw.decode('utf-8').encode('gbk')
    assert len(raw) == context['snapshotBytes'] and sha(raw) == context['snapshotSha256']
    assert len(original) == context['originalBytes'] and sha(original) == context['originalSha256']
    assert blob(original) == context['gitBlobSha1'] == '8743c1da9deda198dbea7be004a36203b4ad8c4a'
    command = rows(raw.decode('utf-8'))
    range_check(command, 0x5cbd90, 0x5cc0fd, 287, '39828efc17421aa99fb9d67e84b3f8256b1b9f33f4df752095a64c21023cb950')
    by = {r[0]: r for r in command}
    for address, dest in [(0x5cbe8c, 0x5cba10), (0x5cbe9b, 0x4b3ed0), (0x5cbf95, 0x5b9340)]:
        assert target(by[address]) == dest
    assert by[0x5cbea0][1] == bytes.fromhex('8b f8')
    license_bytes = (ROOT / p['license']['snapshot']).read_bytes()
    assert len(license_bytes) == p['license']['bytes'] == 11357
    assert sha(license_bytes) == p['license']['sha256'] and blob(license_bytes) == p['license']['gitBlobSha1']


def check_docs(docs):
    for name, text in docs.items():
        if name != 'docs/rules/patrol-security-gain.md':
            assert 'patrol-security-gain.md' in text, name
    guide = docs['docs/rules/patrol-security-gain.md']
    for required in ['source-listing-reconstruction', '005CBA10..005CBADB', BLOB,
                     '00489070', '004B99B0', 'pressureHelperEax', 'publicOrderByte',
                     'stockOriginalVerified=false', 'originalExecutableExecuted=false',
                     'capBranch', 'MOD', 'TP', '首槽',
                     'baseGain = floor(sumLeadership / 28) + 2',
                     'afterPressure = pressureApplied ? floor(baseGain / 2) : baseGain',
                     'capBranch = publicOrderByte + afterPressure > 100',
                     'returnedDelta = capBranch ? 100 - publicOrderByte : afterPressure']:
        assert required in guide, required
    economy = docs['docs/rules/02-economy.md']
    assert '**当前仍未拿到 PC-PK1.1 计算巡查治安增量的完整反汇编函数体**' not in economy
    assert '巡查治安增量函数体仍缺' not in economy


def main():
    p = json.loads((ROOT / 'docs/sources/patrol-security-gain.json').read_text())
    schema = json.loads((ROOT / 'docs/sources/patrol-security-gain.schema.json').read_text())
    text = (ROOT / 'docs/sources/patrol-security-gain-original.txt').read_text()
    check(p, text, schema); extra_sources_check(p)
    mutations = []
    for key in p:
        q = deepcopy(p); del q[key]; mutations.append(('missing-' + key, q, text))
    for section in ['source', 'license', 'domain', 'constants', 'originalListing', 'excludedMod', 'evidence', 'commandContext']:
        for key in p[section]:
            q = deepcopy(p); q[section][key] = None if p[section][key] is not None else 'altered-null'
            mutations.append((section + '-' + key, q, text))
    for key in ['stockOriginalVerified', 'originalExecutableExecuted']:
        q = deepcopy(p); q[key] = True; mutations.append((key, q, text))
    q = deepcopy(p); q['originalExecutableExecuted'] = 0; mutations.append(('bool-as-int', q, text))
    q = deepcopy(p); q['extra'] = 1; mutations.append(('extra', q, text))
    for before, after in [
        (MARKER, 'unseparated MOD'), ('005CBA90 - c1 fa 04', '005CBA90 - c1 fa 03'),
        ('005CBAC7 - 7e 07', '005CBAC7 - 7c 07'), ('005CBAA7 - 85 c0', '005CBAA7 - 84 c0'),
        ('005CBA78 - 0f b6 c8', '005CBA78 - 0f be c8'), ('005CBAD7 - 33 c0', '005CBAD7 - 33 c1'),
        ('005CBA73 - e8 f8 d5 eb ff', '005CBA73 - e8 f9 d5 eb ff'),
        ('sar dl,04', 'sar edx,4'), ('005CBA97 - 90', '005CBA98 - 90')]:
        assert before in text; mutations.append((before, p, text.replace(before, after, 1)))
    for name, candidate, changed in mutations:
        check(p, text, schema)
        try:
            check(candidate, changed, schema)
        except (AssertionError, UnicodeError, ValueError, KeyError, TypeError):
            pass
        else:
            raise AssertionError('mutation survived: ' + name)
    names = ['README.md', 'TODO.md', 'docs/rules.md', 'docs/rules/README.md', 'docs/rules/STATUS.md',
             'docs/rules/SOURCES.md', 'docs/rules/17-post-15-source-audit.md', 'docs/rules/02-economy.md',
             'docs/rules/patrol-security-gain.md', '确定规则.md', '缺少的数据.md']
    docs = {name: (ROOT / name).read_text() for name in names}; check_docs(docs)
    doc_mutations = [
        ('docs/rules/patrol-security-gain.md', 'stockOriginalVerified=false', 'stockOriginalVerified=true'),
        ('docs/rules/patrol-security-gain.md', 'originalExecutableExecuted=false', 'originalExecutableExecuted=true'),
        ('docs/rules/patrol-security-gain.md', '004B99B0', 'unproven-helper'),
        ('docs/rules/patrol-security-gain.md', 'capBranch', 'no-branch-trace'),
        ('docs/rules/patrol-security-gain.md', 'floor(sumLeadership / 28) + 2', 'floor(sumLeadership / 27) + 2'),
        ('docs/rules/patrol-security-gain.md', 'floor(baseGain / 2)', 'ceil(baseGain / 2)'),
        ('docs/rules/patrol-security-gain.md', 'publicOrderByte + afterPressure > 100', 'publicOrderByte + afterPressure >= 100'),
        ('docs/rules/patrol-security-gain.md', '100 - publicOrderByte : afterPressure', 'max(0, 100 - publicOrderByte) : afterPressure'),
    ]
    for name, before, after in doc_mutations:
        check_docs(docs); changed = dict(docs); assert before in changed[name]
        changed[name] = changed[name].replace(before, after)
        try:
            check_docs(changed)
        except AssertionError:
            pass
        else:
            raise AssertionError('documentation mutation survived: ' + before)
    print(f'PASS: original GBK blob; 79 original/204 bytes, 7 isolated MOD/21 bytes; 287 caller instructions; Apache-2.0 snapshot; {len(mutations)} profile/source mutants with controls')
    print(f'PASS: {len(docs)} current documents and {len(doc_mutations)} document mutants with controls')
    print('Stable resolved inputs only; native gates/getters/helper, writer, TP, command and stock remain open.')


if __name__ == '__main__':
    main()
