"""Static source QA for the 0058E6AA..6E3 caller gate; never a game runtime.

Callee returns are explicit observations. This does not calculate compatibility,
relationships, loyalty loss, random values or mutations of game state.
"""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/sources/natural-loyalty-candidate-boundary.json'
SNAPSHOT = ROOT / 'docs/sources/natural-loyalty/0058E510-source-utf8.txt'
SOURCE_SHA256 = '1ba952ffec7c91de3cacc991c854c412628f39e6f772a6a0a5368fcf6be8c36c'
SOURCE_BLOB = '0ce79d11923901fdfb74f99ddf281f744b3d9880'
MOD_HEADERS = [
    '修改1 - 掌握人心忠诚不下降概率可调整',
    '修改2 - 忠诚下降基数可调整，君主魅力对忠诚下降概率有影响',
]
OPEN = [
    '00489F80 original opcode bytes, native pointer/ID resolution and tutorial-to-caller/S1 provenance; tutorial numerical projection is separate',
    '004889E0 full callee and exact relationship predicate semantics',
    '004A6CF0 full writer and final loyalty write/clamping',
    '00472150 RNG internals, distribution and global sequence',
    'end-to-end loyalty loss/runtime and scheduler validation',
    'clean-stock PK1.1, Vanilla and console equivalence',
]
CLAUSES = [
    {'kind': 'compatibility-call-result', 'call': '00489F80', 'register': 'AL',
     'comparison': 'unsigned-gt', 'value': 25},
    {'kind': 'duty-and-ambition', 'dutyOffset': 'F0', 'dutyComparison': 'signed-le',
     'dutyValue': 1, 'ambitionOffset': 'F4', 'ambitionComparison': 'signed-ge',
     'ambitionValue': 3},
    {'kind': 'relationship-call-result', 'call': '004889E0', 'register': 'EAX',
     'comparison': 'nonzero', 'sourceAnnotation': '厌恶君主判定 / 判断A是否厌恶B',
     'argumentBinding': 'ECX=ESI (officer), pushed EDI (ruler ID saved at 0058E62D)',
     'calleeBodyVerified': False},
]


class EvidenceError(ValueError):
    pass


def need(condition, message):
    if not condition:
        raise EvidenceError(message)


def parse_original(text):
    """Keep duplicate-address MOD replacements out of the original listing."""
    need(text.count(MOD_HEADERS[0]) == text.count(MOD_HEADERS[1]) == 1,
         'two distinct modification sections required')
    original, mods = text.split(MOD_HEADERS[0], 1)
    need(MOD_HEADERS[1] in mods, 'modification section order')
    rows = []
    for line in original.splitlines():
        match = re.match(r'^([0-9A-F]{8}) - ((?:[0-9a-fA-F]{2} )+) +- (.*?)(?:  +|$)', line)
        if match:
            rows.append({'address': match[1], 'bytes': bytes.fromhex(match[2]).hex(' '),
                         'instruction': match[3]})
    return rows


def relative_target(row):
    raw = bytes.fromhex(row['bytes'])
    prefix = 2 if raw[0] == 0x0f else 1
    return int(row['address'], 16) + len(raw) + int.from_bytes(raw[prefix:], 'little', signed=True)


def validate_source(data, text):
    need(set(data) == {'schemaVersion', 'audit', 'status', 'source', 'sectionBoundary',
                      'gate', 'retainedOpen', 'runtimeAdded'}, 'top-level contract')
    need(type(data['schemaVersion']) is int and data['schemaVersion'] == 1, 'schema version')
    need(data['audit'] == 'natural-loyalty-candidate-source-correction', 'audit identity')
    need(data['status'] == 'static-caller-evidence-only', 'caller-only evidence grade')
    need(data['runtimeAdded'] is False and data['retainedOpen'] == OPEN, 'retained open scope')
    encoded = text.encode('utf-8')
    need(hashlib.sha256(encoded).hexdigest() == SOURCE_SHA256, 'immutable source text hash')
    original_bytes = text.encode('gbk')
    blob = hashlib.sha1(b'blob ' + str(len(original_bytes)).encode() + b'\0' + original_bytes).hexdigest()
    need(blob == SOURCE_BLOB, 'lossless original GBK Git blob')
    expected_source = {
        'repository': 'sjn4048/311MemoryResearch',
        'commit': '66e167e40c3440929ec016f3872aefc3486434c1',
        'path': '内存资料/整理/Func-自动06-武将忠诚下降.txt',
        'blob': SOURCE_BLOB,
        'url': 'https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-自动06-武将忠诚下降.txt',
        'snapshot': 'docs/sources/natural-loyalty/0058E510-source-utf8.txt',
        'snapshotSha256': SOURCE_SHA256, 'originalEncoding': 'gbk', 'originalBytes': 21580,
        'snapshotEncoding': 'utf-8', 'snapshotBytes': 23159,
        'sourceKind': 'public-annotated-disassembly-text', 'claimedPlatform': 'PC-PK1.1',
        'cleanStockCertified': False,
    }
    need(data['source'] == expected_source and data['source']['cleanStockCertified'] is False,
         'source identity / text-versus-stock boundary')
    need(len(original_bytes) == 21580 and len(encoded) == 23159, 'encoding lengths')
    need(data['sectionBoundary'] == {
        'originalFunction': ['0058E510', '0058E82B'], 'originalInstructionCount': 238,
        'originalInstructionBytes': 796, 'excludedSections': MOD_HEADERS,
        'selection': 'Only the function before 修改1; both modification sections remain archived, never merged into its instructions.',
    }, 'original / MOD boundary')
    rows = parse_original(text)
    need(len(rows) == 238 and sum(len(bytes.fromhex(r['bytes'])) for r in rows) == 796,
         'complete original listing extent')
    need(rows[0]['address'] == '0058E510' and rows[-1]['address'] == '0058E82B'
         and rows[-1]['bytes'] == 'c3', 'original function endpoints')
    for left, right in zip(rows, rows[1:]):
        need(int(left['address'], 16) + len(bytes.fromhex(left['bytes'])) == int(right['address'], 16),
             'original instructions must be contiguous and unique')
    selected = [r for r in rows if 0x58e6aa <= int(r['address'], 16) < 0x58e6e3]
    gate = data['gate']
    need(set(gate) == {'precondition', 'start', 'endExclusive', 'admit', 'reject',
                       'prisonerBypass', 'ordinaryClauses', 'order', 'instructions'}, 'gate contract')
    need(gate['precondition'] == 'At 0058E6AA, all earlier ordinary/prisoner validity, season and relationship exemptions have already passed. Entry to 0058E6E3 is only a later-candidate continuation, not guaranteed loyalty loss.', 'prior exemptions / later-candidate scope')
    need((gate['start'], gate['endExclusive'], gate['admit'], gate['reject']) ==
         ('0058E6AA', '0058E6E3', '0058E6E3', '0058E7B9'), 'gate endpoints')
    need(gate['prisonerBypass'] is True, 'prisoner bypass')
    need(gate['ordinaryClauses'] == CLAUSES and gate['ordinaryClauses'][2]['calleeBodyVerified'] is False,
         'three source-bound ordinary candidate clauses')
    need(gate['order'] == ['prisoner', 'compatibility', 'duty', 'ambition-if-duty-le-1',
                           'relationship-if-prior-clauses-false'], 'short-circuit order')
    need(gate['instructions'] == selected and len(selected) == 18, 'instruction projection')
    by_address = {r['address']: r for r in rows}
    expected_targets = {
        '0058E6AC': 0x488c70, '0058E6B3': 0x58e6e3, '0058E6B8': 0x489f80,
        '0058E6BF': 0x58e6e3, '0058E6C8': 0x58e6d3, '0058E6D1': 0x58e6e3,
        '0058E6D6': 0x4889e0, '0058E6DD': 0x58e7b9,
    }
    for address, target in expected_targets.items():
        need(relative_target(by_address[address]) == target, 'relative call/jump destination ' + address)
    # Caller attribution comes from saved EDI and actual argument setup, not a guessed callee body.
    for address, code in {'0058E626': '8b ce', '0058E628': 'e8 13 b7 ef ff',
                          '0058E62D': '8b f8', '0058E6B5': '57', '0058E6B6': '8b ce',
                          '0058E6D3': '57', '0058E6D4': '8b ce'}.items():
        need(by_address[address]['bytes'] == code, 'officer/ruler call binding')
    # Earlier prisoner skip of season and later skip of this candidate block are separate.
    need(by_address['0058E656']['bytes'] == '75 12'
         and relative_target(by_address['0058E656']) == 0x58e66a, 'season bypass retained')
    need(by_address['0058E61A']['bytes'] == '75 0a'
         and relative_target(by_address['0058E61A']) == 0x58e626, 'benevolent-rule bypass retained')
    return selected


def signed(value, width=32):
    value &= (1 << width) - 1
    return value - (1 << width) if value & (1 << (width - 1)) else value


def gate_trace(rows, prisoner, compatibility, duty, ambition, dislike):
    """Test-only interpreter of this 18-instruction listing, with stubbed calls.

    Inputs are raw signed/unsigned 32-bit observations. This deliberately exposes
    return widths and ordered calls; none of these helpers is implemented here.
    """
    code = {int(r['address'], 16): r for r in rows}
    returns = {0x488c70: prisoner, 0x489f80: compatibility, 0x4889e0: dislike}
    fields = {0xf0: duty, 0xf4: ambition}
    calls = []
    pc, eax = 0x58e6aa, 0
    equal = below = less = False
    for _ in range(24):
        if pc in (0x58e6e3, 0x58e7b9):
            return pc == 0x58e6e3, calls
        row = code[pc]
        raw = bytes.fromhex(row['bytes'])
        next_pc = pc + len(raw)
        if raw in (b'\x8b\xce', b'\x57'):
            pass
        elif raw[0] == 0xe8:
            target = relative_target(row)
            calls.append(f'{target:08X}')
            eax = returns[target] & 0xffffffff
        elif raw == b'\x85\xc0':
            equal = eax == 0
        elif raw[0] == 0x3c or raw[:2] == b'\x83\xbe':
            if raw[0] == 0x3c:
                left, right, width = eax & 255, raw[1], 8
            else:
                left = fields[int.from_bytes(raw[2:6], 'little')] & 0xffffffff
                right, width = signed(raw[6], 8) & 0xffffffff, 32
            equal, below, less = left == right, left < right, signed(left, width) < signed(right, width)
        else:
            condition = {0x75: not equal, 0x77: not below and not equal,
                         0x73: not below, 0x7f: not less and not equal,
                         0x7d: not less}.get(raw[0])
            if raw[:2] == b'\x0f\x84':
                condition = equal
            elif raw[:2] == b'\x0f\x85':
                condition = not equal
            need(condition is not None, 'unsupported test instruction')
            if condition:
                next_pc = relative_target(row)
        pc = next_pc
    raise EvidenceError('gate did not terminate within its acyclic instruction budget')


CANDIDATE_SUMMARIES = [
    'docs/rules.md', 'docs/rules/03-personnel.md', 'docs/rules/13-open-exactness.md',
    'docs/rules/14-evidence-audit-2026-09-29.md', 'docs/rules/SOURCES.md',
]
CURRENT_SUMMARIES = CANDIDATE_SUMMARIES + [
    'README.md', 'TODO.md', 'docs/rules/STATUS.md', '缺少的数据.md',
    'docs/rules/12-pk.md', 'docs/rules/04-military.md',
    'docs/rules/17-post-15-source-audit.md', 'docs/rules/22-techniques.md',
    'docs/open-questions.md', '确定规则.md',
]


AFFINITY_SEPARATION_SUMMARIES = {
    'README.md', 'TODO.md', 'docs/rules/STATUS.md', '缺少的数据.md', '确定规则.md',
    'docs/rules/03-personnel.md', 'docs/rules/SOURCES.md',
    'docs/rules/13-open-exactness.md',
}


def validate_summary_text(path, text):
    # Also catch the formerly missed "相性与君主差≥25", not only "相性差".
    need(re.search(r'相性[^\n]{0,40}(?:>=|≥|≧)\s*25', text) is None,
         'stale inclusive candidate threshold in ' + path)
    need(re.search(r'精确\s*(?:\*\*)?2/3', text) is None,
         'unqualified RNG probability in ' + path)
    need('natural-loyalty-candidate-boundary.md' in text,
         'source boundary link in ' + path)
    if path in AFFINITY_SEPARATION_SUMMARIES:
        need('affinity-distance.md' in text, 'independent tutorial projection link in ' + path)
        for stale in ['callee-body-open', '本轮未补齐callee完整体', '完整体未在本轮绑定来源内',
                      '未取得callee完整体', '教程已证明自然忠诚caller同源', '相性核已接入自然忠诚']:
            need(stale not in text, 'stale or overstated affinity evidence in ' + path)
    if path in CANDIDATE_SUMMARIES:
        need('004889E0' in text, 'third clause in ' + path)
    if path == 'docs/rules/03-personnel.md':
        need('俘虏月度掉忠：不再 open' not in text and 'captorLord' not in text,
             'overstated prisoner closure or ruler attribution')


def check_documentation(root=ROOT):
    for path in CURRENT_SUMMARIES:
        validate_summary_text(path, (root / path).read_text(encoding='utf-8'))
    return len(CURRENT_SUMMARIES)


def check_files():
    data = json.loads(DATA.read_text(encoding='utf-8'))
    text = SNAPSHOT.read_bytes().decode('utf-8')
    rows = validate_source(data, text)
    documents = check_documentation()
    return {'originalInstructions': 238, 'gateInstructions': len(rows),
            'excludedModSections': 2, 'auditedSummaries': documents, 'runtimeAdded': False}


if __name__ == '__main__':
    print('PASS: natural-loyalty static caller evidence', json.dumps(check_files(), sort_keys=True))
