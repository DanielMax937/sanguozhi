#!/usr/bin/env python3
"""Independent closed-evidence/source/schema and mutation checker.

Never interprets listed-byte agreement as authenticated stock executable identity.
No caller, candidate filter, final RNG, gold or treasure behavior is recovered.
"""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from jsonschema import Draft202012Validator, ValidationError
from search_talent_source_oracle import (
    ROOT, SOURCE, PROFILE, SOURCE_SHA, SOURCE_BLOB, CODE_SHA, EVIDENCE,
    load_listing, parse_listing, check_examples, check_mutations, check_api_contract, sha,
)

PROFILE_FILE=ROOT/'docs/sources/search-talent-baseline.json'
SCHEMA_FILE=ROOT/'docs/sources/search-talent-baseline.schema.json'
UTF8_SHA='cc5202aaf4a20b8ca6574b8145b83e1713f3298dcae442413af4c9761f09b7d3'
COMMIT='66e167e40c3440929ec016f3872aefc3486434c1'
REPO='sjn4048/311MemoryResearch'
SOURCE_PATH='内存资料/整理/Func-人才05-计算探索是否成功.txt'
SOURCE_URL=f'https://github.com/{REPO}/blob/{COMMIT}/{SOURCE_PATH}'
LICENSE_SHA='c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
PINNED_SOURCE={
    'repository':REPO,'commit':COMMIT,'path':SOURCE_PATH,'url':SOURCE_URL,
    'gitBlobSha1':SOURCE_BLOB,'snapshot':'docs/sources/search-talent-original.gbk',
    'snapshotEncoding':'GBK','snapshotBytes':9251,'snapshotSha256':SOURCE_SHA,
    'utf8Snapshot':'docs/sources/search-talent-original.txt','utf8Bytes':9812,'utf8Sha256':UTF8_SHA,
    'acquisition':'GitHub connector decoded text; GBK re-encoding matches pinned Git blob; not a direct raw download',
    'authority':'Published research listing for 311PK, no authenticated executable hash or exact patch/version identity',
}
PINNED_LISTING={
    'start':'005D1DF0','endInclusive':'005D1E92','instructionCount':66,'listedByteLength':163,
    'listedBytesSha256':CODE_SHA,'callCount':5,'conditionalBranchCount':5,
    'conditionalBranchOutcomeCount':10,'outerCallerRange':'005D1EA0..005D1F28','outerCallerIntegrated':False,
}
PINNED_ARITHMETIC={
    'zeroCount':'count=0 returns 0 before eye helper',
    'eyeSkill':'positive count and full uint32 eyeSkillEax!=0 returns 100',
    'normal':'floor((3*min(filteredCandidateCount,5)+7)*politicsAL*(cityRegion==officerBirthRegion?11:10)/300)',
    'maximumNumerator':61710,'maximumReturn':205,'clampTo100':False,
    'division':'listed signed multiply by 0x1B4E81B5, high-word SAR EDX,5 and sign correction; equals floor(n/300) over supported nonnegative domain',
}
PINNED_CORRECTIONS=[
    {'address':'005D1E61..005D1E6B','original':'最小为5','corrected':'min(count,5), maximum 5','authority':'CMP ESI,5; MOV ECX,5; JG skips MOV ECX,ESI'},
    {'address':'005D1E85','original':'sar dl,05','corrected':'sar edx,05','authority':'C1 FA 05 encodes 32-bit SAR EDX,5'},
]
RANGES={'filteredCandidateCount':(0,0x7fffffff),'politicsAL':(0,255),'eyeSkillEax':(0,0xffffffff),'cityRegion':(-0x80000000,0x7fffffff),'officerBirthRegion':(-0x80000000,0x7fffffff)}
INPUT_SCHEMA={'type':'object','additionalProperties':False,'required':['profile',*RANGES],
              'properties':{'profile':{'const':PROFILE},**{k:{'type':'integer','minimum':a,'maximum':b} for k,(a,b) in RANGES.items()}}}
UNRESOLVED=[
    '005D1720 candidate-filter body and actual eligibility',
    '0047A630 pointer validator',
    '0047C4C0 city-to-facility helper',
    '004CF590 candidate-list construction and mutation',
    '004890F0 eye skill helper and 004890A0 politics getter bodies',
    'native pointers/IDs, mutable observations and side effects',
    '0059CC10 candidate selection, 00491310 pointer-to-ID, 00489F80 caller/source identity',
    '005B8140 final finding/RNG semantics',
    'gold/treasure search, complete command, recruitment, rewards and scheduler',
    'clean-stock executable and cross-version equivalence',
    'P0-78 and dependent capture/force/native transactions',
]
PINNED_PROFILE={
    'profileId':PROFILE,'scope':EVIDENCE['scope'],'evidence':EVIDENCE,'source':PINNED_SOURCE,
    'license':{'spdx':'Apache-2.0','snapshot':'docs/sources/production-price-LICENSE.txt','sha256':LICENSE_SHA,
               'url':f'https://github.com/{REPO}/blob/{COMMIT}/LICENSE','attribution':REPO},
    'originalListing':PINNED_LISTING,'arithmetic':PINNED_ARITHMETIC,'corrections':PINNED_CORRECTIONS,
    'inputSchema':INPUT_SCHEMA,
    'validation':'Closed own data properties only, no coercion/accessors/inherited fields/symbols. All fields must be valid even on early return. Normalize JS negative zero. Engineering rejection is not native failure. Region IDs remain uninterpreted signed32 values. Eye result is unsigned EAX bit pattern; signed -1 is represented as 4294967295.',
    'unresolved':UNRESOLVED,
}


def check(profile,schema,raw,utf8):
    # JSON type-aware comparison prevents Python's True==1 from accepting forgery.
    assert json.dumps(profile,sort_keys=True)==json.dumps(PINNED_PROFILE,sort_keys=True),'independently pinned evidence changed'
    expected_schema={'$schema':'https://json-schema.org/draft/2020-12/schema','title':'Search talent baseline source metadata','type':'object','additionalProperties':False,'required':list(PINNED_PROFILE),'properties':{k:{'const':v} for k,v in PINNED_PROFILE.items()}}
    assert json.dumps(schema,sort_keys=True)==json.dumps(expected_schema,sort_keys=True),'closed typed schema weakened or changed'
    Draft202012Validator.check_schema(schema);Draft202012Validator(schema).validate(profile)
    assert len(raw)==9251 and sha(raw)==SOURCE_SHA
    assert hashlib.sha1(b'blob 9251\0'+raw).hexdigest()==SOURCE_BLOB
    assert len(utf8)==9812 and sha(utf8)==UTF8_SHA and raw.decode('gbk').encode()==utf8
    code=parse_listing(raw.decode('gbk'))
    assert sum(i.op=='call' for i in code.values())==5
    assert sum(i.op in ('jne','je','jg') for i in code.values())==5
    assert sha((ROOT/'docs/sources/production-price-LICENSE.txt').read_bytes())==LICENSE_SHA
    return code


def must_fail(fn,label):
    try:fn()
    except (AssertionError,ValidationError,ValueError,UnicodeError):return label
    raise AssertionError('mutation survived: '+label)


def mutation_checks(profile,schema,raw,utf8):
    killed=[]
    def leaves(v,path=()):
        if isinstance(v,dict):
            for k,x in v.items():yield from leaves(x,(*path,k))
        elif isinstance(v,list):
            for k,x in enumerate(v):yield from leaves(x,(*path,k))
        else:yield path,v
    for path,value in leaves(profile):
        p=deepcopy(profile);s=p
        for key in path[:-1]:s=s[key]
        s[path[-1]]=not value if type(value) is bool else value+1 if type(value) is int else value+' [mutated]'
        killed.append(must_fail(lambda:check(p,schema,raw,utf8),'profile:'+'.'.join(map(str,path))))
    for path,value in leaves(schema):
        changed=deepcopy(schema);s=changed
        for key in path[:-1]:s=s[key]
        s[path[-1]]=not value if type(value) is bool else value+1 if type(value) is int else value+' [mutated]'
        killed.append(must_fail(lambda:check(profile,changed,raw,utf8),'schema:'+'.'.join(map(str,path))))
    text=raw.decode('gbk')
    source_mutations={
        'byte':text.replace('005D1E85 - c1 fa 05','005D1E85 - c1 fa 04'),
        'mnemonic':text.replace('sar dl,05','sar edx,05'),
        'branch-target':text.replace('jne 005d1e2f','jne 005d1e2e'),
        'instruction-gap':text.replace('005D1E88 - 5f','005D1E89 - 5f'),
        'delete-instruction':'\n'.join(l for l in text.splitlines() if not l.startswith('005D1E88 -')),
        'duplicate-instruction':text+'\n005D1E92 - c3                         - ret',
    }
    for label,t in source_mutations.items():killed.append(must_fail(lambda:parse_listing(t),'listing:'+label))
    killed.append(must_fail(lambda:check(profile,schema,raw+b' ',utf8),'full-source-append'))
    killed.append(must_fail(lambda:check(profile,schema,raw,utf8+b' '),'utf8-append'))
    for kind in ('profile','schema'):
        obj=deepcopy(profile if kind=='profile' else schema);obj['unknown']=True
        killed.append(must_fail(lambda:check(obj if kind=='profile' else profile,obj if kind=='schema' else schema,raw,utf8),'unknown-'+kind+'-field'))
    forged=deepcopy(profile);forged['evidence']['stockOriginalVerified']=True
    coordinated=deepcopy(schema);coordinated['properties']['evidence']['const']=forged['evidence']
    killed.append(must_fail(lambda:check(forged,coordinated,raw,utf8),'coordinated-profile-schema-stock-claim'))
    return {'count':len(killed),'groups':{'evidenceAndSchemaLeaves':len(killed)-11,'listing':6,'fullSnapshots':2,'unknownFields':2,'coordinatedProfileSchema':1}}


def check_cli():
    command=[sys.executable,str(ROOT/'scripts/search_talent_source_oracle.py')]
    default=subprocess.run(command,cwd=ROOT,capture_output=True,text=True)
    assert default.returncode==0,default.stderr
    report=json.loads(default.stdout)
    assert report['level']=='source-listing-reconstruction' and report['examples']['outcomesCovered']==10
    assert 'exhaustive' not in report,'default unexpectedly claims exhaustive run'
    rejected=0
    for args in (['--unknown'],['--output'],['--exhaustive=false'],['--count','1'],['{}']):
        p=subprocess.run(command+args,cwd=ROOT,capture_output=True,text=True)
        assert p.returncode!=0 and not p.stdout,args
        rejected+=1
    with tempfile.TemporaryDirectory(prefix='search-talent-cli-') as directory:
        output=Path(directory)/'report.json'
        p=subprocess.run(command+['--output',str(output)],cwd=ROOT,capture_output=True,text=True)
        assert p.returncode==0,p.stderr
        assert output.read_text()==p.stdout
    return {'defaultVerified':True,'outputFileMatchesStdout':True,'malformedArgumentsRejected':rejected}


def main():
    assert len(sys.argv)==1,'checker accepts no arguments'
    profile=json.loads(PROFILE_FILE.read_text());schema=json.loads(SCHEMA_FILE.read_text())
    raw=SOURCE.read_bytes();utf8=(ROOT/'docs/sources/search-talent-original.txt').read_bytes()
    code=check(profile,schema,raw,utf8)
    report={'level':'source-listing-reconstruction','sourceAndClosedSchemaVerified':True,'examples':check_examples(code),
            'mutations':mutation_checks(profile,schema,raw,utf8),'api':check_api_contract(),
            'instructionAndStubMutations':check_mutations(code),'cli':check_cli(),
            'stockOriginalVerified':False,'originalExecutableExecuted':False}
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
