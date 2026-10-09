"""Closed source/profile/schema/document guard for the captured production price.

Only the pinned public listing is authenticated; this is not stock validation.
The independently byte-driven oracle is separate from these static checks.
"""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import re
from check_domestic_construction_rate import validate_closed

ROOT = Path(__file__).resolve().parents[1]
BLOB = '928b34bd8b9f06057dd44e9639db92dacc364c85'
UTF8 = '698a166f45fc1454349a5a88aeb9cd08c2e0093233ab6dc9604a20ade780f67c'
GBK = '6fbca37bcd8eaa8d1ac9c919100d3fa9ee33c49e49cc15786de06db4e86fe013'
CODE = '8231023624aacaa163f18e3e199a34858edf8ade601ad5043ddfaaba4bc685da'
MOD = '031a517ac04ce7dbbd28b35632a2e715a69a489212d0872b81f86a70cc77d722'
MARKER = '修改 - 特产城市折扣倍率自定义'
sha = lambda raw: hashlib.sha256(raw).hexdigest()
blob = lambda raw: hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()

def rows(text):
    return [(int(a,16),bytes.fromhex(b),asm) for a,b,asm in re.findall(
        r'^([0-9A-F]{8}) - ((?:[0-9a-f]{2} )+)\s+- (.*)$',text,re.M)]

def target(row):
    address,raw,_=row
    return address+len(raw)+int.from_bytes(raw[1:],'little',signed=True)

def source_check(text,p):
    raw=text.encode('utf-8');gbk=text.encode('gbk')
    assert len(raw)==4389 and sha(raw)==UTF8
    assert len(gbk)==4178 and sha(gbk)==GBK and blob(gbk)==BLOB
    assert gbk.decode('gbk')==text and text.count(MARKER)==1
    a,b=text.split(MARKER);original,mod=rows(a),rows(b)
    for values,start,end,count,size,digest in [(original,0x5c6350,0x5c63c1,45,113,CODE),(mod,0x5c63a1,0x5c63af,6,14,MOD)]:
        cursor=start
        for address,raw,_ in values:
            assert address==cursor;cursor+=len(raw)
        code=b''.join(raw for _,raw,_ in values)
        assert cursor==end and len(values)==count and len(code)==size and sha(code)==digest
    by={r[0]:r for r in original}
    calls=[{'address':f'{r[0]:08X}','target':f'{target(r):08X}'} for r in original if r[1][0]==0xe8]
    branches=[{'address':f'{r[0]:08X}','target':f'{target(r):08X}'} for r in original if r[1][0] in (0x75,0x76)]
    assert calls==p['originalListing']['calls'] and len(calls)==5
    assert branches==p['originalListing']['branches'] and len(branches)==3
    for r in original+mod:
        if r[1][0] in (0xe8,0x75,0x76,0xeb): assert target(r)==int(r[2].split()[1],16)
    assert all(int(r['target'],16) in by for r in branches)
    for addr,want in [(0x5c635e,'85 c0'),(0x5c6372,'85 c0'),(0x5c637a,'0f b7 b7 98 00 00 00'),
                      (0x5c639d,'84 c0'),(0x5c639f,'76 1a'),(0x5c63a1,'8d 0c f5 00 00 00 00'),
                      (0x5c63a8,'b8 67 66 66 66'),(0x5c63af,'c1 fa 02')]: assert by[addr][1]==bytes.fromhex(want)
    assert by[0x5c63af][2]=='sar dl,02'  # preserve source typo; not a valid decoding


def check(p,text,schema):
    validate_closed(p,schema);source_check(text,p)
    assert p['profileId']=='production-price-resolved-v1'
    assert p['scope']=='standalone-saved-resolved-input-numerical-price-only'
    assert p['constants']=={'discountNumerator':8,'discountDenominator':10,'signedDivisionMagic':'0x66666667'}
    assert p['stockOriginalVerified'] is False and p['originalExecutableExecuted'] is False
    assert p['excludedMod']['executedByProduction'] is False and p['evidence']['commandIntegrated'] is False
    license_bytes=(ROOT/p['license']['snapshot']).read_bytes()
    assert len(license_bytes)==p['license']['bytes']==11357
    assert sha(license_bytes)==p['license']['sha256']=='c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
    assert blob(license_bytes)==p['license']['gitBlobSha1']=='261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64'


def docs_check(docs):
    guide=docs['docs/rules/production-price.md']
    for name,text in docs.items():
        if name!='docs/rules/production-price.md': assert 'production-price.md' in text,name
    for phrase in [BLOB,'source-listing-reconstruction','stockOriginalVerified=false','originalExecutableExecuted=false',
       '005C6350..005C63C0','005C637A','004914A0','0047EC80','0047B3A0','TEST AL,AL','C1 FA 02','sar dl,02','sar edx,2',
       'savedBasePriceWord','specialtyHelperEax','specialtyResultAl','discountApplied','returnedPrice','EAX=256 不折，257 折',
       'floor(savedBasePriceWord * 8 / 10)','最低1','实际扣钱','库存','MOD','6 条 / 14 bytes','131072','跨版本']:
        assert phrase in guide,phrase
    for name in ['docs/rules.md','docs/open-questions.md']:
        assert '生产-price' not in docs[name]
        assert '旧“锻冶700金/厩舍800金”' in docs[name] and '撤回' in docs[name]
    for name in ['README.md','TODO.md','docs/rules/STATUS.md','缺少的数据.md']:
        assert 'PR #49' in docs[name]
    assert '兵装生产已完整恢复' not in guide and 'stockOriginalVerified=true' not in guide


def main():
    p=json.loads((ROOT/'docs/sources/production-price.json').read_text())
    schema=json.loads((ROOT/'docs/sources/production-price.schema.json').read_text())
    text=(ROOT/'docs/sources/production-price-original.txt').read_text()
    check(p,text,schema)
    mutations=[]
    for key in p:
        q=deepcopy(p);del q[key];mutations.append(('missing-'+key,q,text))
    for name in ['source','license','domain','constants','originalListing','excludedMod','evidence']:
        for key in p[name]:
            q=deepcopy(p);q[name][key]=None;mutations.append((name+'.'+key,q,text))
    for key in ['stockOriginalVerified','originalExecutableExecuted']:
        q=deepcopy(p);q[key]=True;mutations.append((key,q,text))
    q=deepcopy(p);q['stockOriginalVerified']=0;mutations.append(('bool-int',q,text))
    q=deepcopy(p);q['extra']=True;mutations.append(('extra',q,text))
    for old,new in [(MARKER,'lost MOD boundary'),('005C639D - 84 c0','005C639D - 85 c0'),
       ('005C637A - 0f b7','005C637A - 0f bf'),('005C63AF - c1 fa 02','005C63AF - c0 fa 02'),
       ('005C63A8 - b8 67','005C63A8 - b8 66'),('sar dl,02','sar edx,2'),
       ('005C6387 - e8 14','005C6387 - e8 15'),('005C63AA - f7 f9','005C63AB - f7 f9')]:
        assert old in text;mutations.append((old,p,text.replace(old,new,1)))
    for name,candidate,changed in mutations:
        check(p,text,schema)
        try: check(candidate,changed,schema)
        except (AssertionError,UnicodeError,ValueError,KeyError,TypeError): pass
        else: raise AssertionError('mutation survived: '+name)
    names=['README.md','TODO.md','docs/rules.md','docs/open-questions.md','docs/rules/README.md','docs/rules/STATUS.md',
      'docs/rules/SOURCES.md','docs/rules/04-military.md','docs/rules/production-price.md','确定规则.md','缺少的数据.md']
    docs={name:(ROOT/name).read_text() for name in names};docs_check(docs)
    dm=[('stockOriginalVerified=false','stockOriginalVerified=true'),('originalExecutableExecuted=false','originalExecutableExecuted=true'),
      ('TEST AL,AL','TEST EAX,EAX'),('floor(savedBasePriceWord * 8 / 10)','round(savedBasePriceWord * 8 / 10)'),
      ('EAX=256 不折，257 折','EAX=256 折，257 折'),('C1 FA 02','C0 FA 02'),('0047B3A0','unknown-helper')]
    for before,after in dm:
        docs_check(docs);changed=dict(docs);changed['docs/rules/production-price.md']=changed['docs/rules/production-price.md'].replace(before,after)
        try: docs_check(changed)
        except AssertionError: pass
        else: raise AssertionError('documentation mutation survived: '+before)
    print(f'PASS: fixed original GBK/UTF-8 blob;45 instructions/113 bytes;separate MOD6/14;5 CALL/3 branch targets;Apache-2.0;{len(mutations)} controlled profile/source mutants')
    print(f'PASS: {len(docs)} current documents;{len(dm)} controlled document mutants;captured-input numerical price only')

if __name__=='__main__': main()
