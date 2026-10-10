#!/usr/bin/env python3
"""Closed evidence/schema, preserved source, CLI and mutation checks; no EXE/RNG execution."""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from jsonschema import Draft202012Validator, ValidationError
from treasure_roll_source_oracle import ROOT, SOURCE, parse_listing, check_examples, check_mutations, check_api_contract

PROFILE_FILE=ROOT/'docs/sources/treasure-roll-argument.json'
SCHEMA_FILE=ROOT/'docs/sources/treasure-roll-argument.schema.json'
# Frozen reviewed contract, independent of the loaded product metadata/schema.
PINNED_PROFILE={'profileId': 'treasure-roll-resolved-v1',
 'scope': 'already selected candidate; stable resolved uint8 value; pre-RNG roll argument only',
 'evidence': {'level': 'source-listing-reconstruction',
              'profile': 'treasure-roll-resolved-v1',
              'source': 'docs/sources/treasure-roll-argument.json',
              'originalRange': '005D5B45 <= PC < 005D5B6B',
              'scope': 'already selected candidate; stable resolved uint8 value; pre-RNG roll argument only',
              'listedBytesVerified': True,
              'stockOriginalVerified': False,
              'originalExecutableExecuted': False,
              'nativeHelpersReconstructed': False,
              'callerIntegrated': False,
              'finalProbabilityRecovered': False,
              'rngIntegrated': False,
              'candidateSelectionRecovered': False,
              'ownershipWriterRecovered': False,
              'commandIntegrated': False},
 'source': {'repository': 'sjn4048/311MemoryResearch',
            'commit': '66e167e40c3440929ec016f3872aefc3486434c1',
            'path': '内存资料/整理/Func-人才06-执行探索.txt',
            'url': 'https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-人才06-执行探索.txt',
            'gitBlobSha1': '82bff04db2dae9ae0787e1e71ad72f1b4e6852de',
            'snapshot': 'docs/sources/treasure-search-original.gbk',
            'snapshotEncoding': 'GBK',
            'snapshotBytes': 42874,
            'snapshotSha256': 'b8fb7965114ebc0d26cbb27058367c3a54ff47972bff9ab8dfc9e61867f8560a',
            'utf8Snapshot': 'docs/sources/treasure-search-original.txt',
            'utf8Bytes': 44634,
            'utf8Sha256': '5cbca6abd2d96ccf6980f26bee3eb4fd31b0baa0a942d65f5efb0d4c30220f0c',
            'acquisition': 'GitHub connector decoded text; GBK re-encoding matches pinned Git blob; not a direct raw '
                           'download',
            'authority': 'Published research listing for 311PK, no authenticated executable hash or exact '
                         'patch/version identity'},
 'license': {'spdx': 'Apache-2.0',
             'snapshot': 'docs/sources/production-price-LICENSE.txt',
             'sha256': 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
             'url': 'https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/LICENSE',
             'attribution': 'sjn4048/311MemoryResearch'},
 'originalListing': {'start': '005D5B45',
                     'endExclusive': '005D5B6B',
                     'instructionCount': 12,
                     'listedByteLength': 38,
                     'listedBytesSha256': '938c72b44cad329072c4212548b4878f3d611dbfd3d6f6bd244f714eff3f7ec2',
                     'callCount': 0,
                     'conditionalBranchCount': 1,
                     'conditionalBranchOutcomeCount': 2,
                     'handoffPush': '005D5B6B',
                     'handoffIncludedInstructionCount': 13,
                     'handoffIncludedByteLength': 39,
                     'excludedCallAddress': '005D5B6C',
                     'excludedCallTarget': '004721D0',
                     'excludedCallExecuted': False},
 'arithmetic': {'numerator': '61-treasureValueU8',
                'quotient': 'trunc(numerator/20), toward zero; normalize negative zero',
                'rollArgument': 'max(1,quotient)',
                'minimumNumerator': -194,
                'maximumNumerator': 61,
                'minimumQuotient': -9,
                'maximumQuotient': 3,
                'outputBins': [{'valueMin': 0, 'valueMax': 1, 'rollArgument': 3},
                               {'valueMin': 2, 'valueMax': 21, 'rollArgument': 2},
                               {'valueMin': 22, 'valueMax': 255, 'rollArgument': 1}],
                'division': 'signed IMUL 0x66666667 high word; SAR EDX,3; SHR EAX,31 sign correction',
                'branch': 'quotient<1 => minimum-clamp; otherwise quotient',
                'finalProbability': False},
 'corrections': [{'address': '005D5B57',
                  'original': 'sar dl,03',
                  'corrected': 'sar edx,03',
                  'authority': 'C1 FA 03 encodes 32-bit SAR EDX,3'}],
 'inputSchema': {'type': 'object',
                 'additionalProperties': False,
                 'required': ['profile', 'treasureValueU8'],
                 'properties': {'profile': {'const': 'treasure-roll-resolved-v1'},
                                'treasureValueU8': {'type': 'integer', 'minimum': 0, 'maximum': 255}}},
 'validation': 'Closed own data properties only, no coercion/accessors/inherited fields/symbols. Normalize JS negative '
               'zero. Engineering rejection is not native failure. The uint8 observation is already resolved from '
               'selected candidate +0x3C; no pointer or ID accepted.',
 'unresolved': ['004CDFB0 candidate filtering, 005D51D0 selection and 0047A630 validation',
                '004721D0 RNG semantics, distribution, seed and consumption',
                'preceding talent/event branches and complete-search conditional probability',
                '005D3D90 treasure ownership/reward writer, AP, command and scheduling',
                'native pointers/IDs and mutable observations',
                'gold search and complete treasure-search behavior',
                'clean-stock executable, exact patch identity and cross-version equivalence',
                'P0-78 and dependent capture/force/native transactions']}

def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':'))
def sha(raw):return hashlib.sha256(raw).hexdigest()
def check(profile,schema,raw,utf8):
    assert canonical(profile)==canonical(PINNED_PROFILE),'independently pinned evidence changed'
    expected={'$schema':'https://json-schema.org/draft/2020-12/schema','title':'Treasure roll argument source metadata','type':'object','additionalProperties':False,'required':list(PINNED_PROFILE),'properties':{k:{'const':v} for k,v in PINNED_PROFILE.items()}}
    assert canonical(schema)==canonical(expected),'closed typed schema changed'
    Draft202012Validator.check_schema(schema);Draft202012Validator(schema).validate(profile)
    assert len(raw)==42874 and sha(raw)=='b8fb7965114ebc0d26cbb27058367c3a54ff47972bff9ab8dfc9e61867f8560a'
    assert hashlib.sha1(b'blob 42874\0'+raw).hexdigest()=='82bff04db2dae9ae0787e1e71ad72f1b4e6852de'
    assert len(utf8)==44634 and sha(utf8)=='5cbca6abd2d96ccf6980f26bee3eb4fd31b0baa0a942d65f5efb0d4c30220f0c'
    assert raw.decode('gbk').encode()==utf8
    assert sha((ROOT/'docs/sources/production-price-LICENSE.txt').read_bytes())=='c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
    # The earlier talent profile deliberately remains its historical scope.
    historical=json.loads((ROOT/'docs/sources/search-talent-baseline.json').read_text())
    assert historical['evidence']['searchTreasureRecovered'] is False
    return parse_listing(raw.decode('gbk'))

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
    for kind,original in [('profile',profile),('schema',schema)]:
        for path,value in leaves(original):
            obj=deepcopy(original);s=obj
            for key in path[:-1]:s=s[key]
            s[path[-1]]=not value if type(value) is bool else value+1 if type(value) is int else value+' [mutated]'
            killed.append(must_fail(lambda:check(obj if kind=='profile' else profile,obj if kind=='schema' else schema,raw,utf8),kind+':'+'.'.join(map(str,path))))
        obj=deepcopy(original);obj['unknown']=True
        killed.append(must_fail(lambda:check(obj if kind=='profile' else profile,obj if kind=='schema' else schema,raw,utf8),'unknown-'+kind))
    text=raw.decode('gbk')
    mutations={
        'byte':text.replace('005D5B57 - c1 fa 03','005D5B57 - c1 fa 02'),
        'mnemonic':text.replace('sar dl,03','sar edx,03'),
        'branch-target':text.replace('jnl 005d5b6b','jnl 005d5b6c'),
        'instruction-gap':text.replace('005D5B5A -','005D5B5B -'),
        'delete-instruction':'\n'.join(l for l in text.splitlines() if not l.startswith('005D5B5A -')),
        'duplicate-instruction':text+'\n005D5B5A - 8b c2                      - mov eax,edx',
        'handoff-push':text.replace('005D5B6B - 50','005D5B6B - 51'),
        'excluded-call-target':text.replace('call 004721d0','call 004721d1'),
    }
    for label,t in mutations.items():
        assert t!=text,label
        killed.append(must_fail(lambda:parse_listing(t),'listing:'+label))
    killed.append(must_fail(lambda:check(profile,schema,raw+b' ',utf8),'full-source-append'))
    killed.append(must_fail(lambda:check(profile,schema,raw,utf8+b' '),'utf8-append'))
    forged=deepcopy(profile);forged['evidence']['finalProbabilityRecovered']=True
    coordinated=deepcopy(schema);coordinated['properties']['evidence']['const']=forged['evidence']
    killed.append(must_fail(lambda:check(forged,coordinated,raw,utf8),'coordinated-final-probability-claim'))
    forged=deepcopy(profile);forged['originalListing']['callCount']=False
    coordinated=deepcopy(schema);coordinated['properties']['originalListing']['const']=forged['originalListing']
    killed.append(must_fail(lambda:check(forged,coordinated,raw,utf8),'bool-not-zero'))
    return {'count':len(killed),'allKilled':True,'listingMutations':len(mutations)}

def input_schema_checks(profile):
    schema=profile['inputSchema'];Draft202012Validator.check_schema(schema);v=Draft202012Validator(schema)
    for value in range(256):v.validate({'profile':'treasure-roll-resolved-v1','treasureValueU8':value})
    bad=[None,[],{}, {'profile':'stock','treasureValueU8':1},{'profile':'treasure-roll-resolved-v1','treasureValueU8':1,'extra':0}]
    bad += [{'profile':'treasure-roll-resolved-v1','treasureValueU8':x} for x in [-1,256,1.5,True,None,'1',{},[]]]
    for x in bad:assert not v.is_valid(x),x
    return {'validDomainCases':256,'invalidCases':len(bad),'runtimeNonJsonChecks':'Node API contract additionally rejects NaN, Infinity, accessors, symbols and inherited fields'}

def check_cli():
    command=[sys.executable,str(ROOT/'scripts/treasure_roll_source_oracle.py')]
    p=subprocess.run(command,cwd=ROOT,capture_output=True,text=True)
    assert p.returncode==0,p.stderr
    report=json.loads(p.stdout);assert report['level']=='source-listing-reconstruction'
    assert 'exhaustive' not in report
    rejected=0
    for args in (['--unknown'],['--output'],['--exhaustive=false'],['--value','1'],['{}']):
        p=subprocess.run(command+args,cwd=ROOT,capture_output=True,text=True)
        assert p.returncode!=0 and not p.stdout,args
        rejected+=1
    with tempfile.TemporaryDirectory(prefix='treasure-roll-cli-') as d:
        output=Path(d)/'report.json';p=subprocess.run(command+['--output',str(output)],cwd=ROOT,capture_output=True,text=True)
        assert p.returncode==0,p.stderr
        assert output.read_text()==p.stdout
    return {'defaultVerified':True,'outputFileMatchesStdout':True,'malformedArgumentsRejected':rejected}

def main():
    assert len(sys.argv)==1,'checker accepts no arguments'
    profile=json.loads(PROFILE_FILE.read_text());schema=json.loads(SCHEMA_FILE.read_text())
    raw=SOURCE.read_bytes();utf8=(ROOT/'docs/sources/treasure-search-original.txt').read_bytes()
    code=check(profile,schema,raw,utf8)
    print(json.dumps({'level':'source-listing-reconstruction','sourceAndClosedSchemaVerified':True,'examples':check_examples(code),'mutations':mutation_checks(profile,schema,raw,utf8),'inputSchema':input_schema_checks(profile),'api':check_api_contract(),'instructionMutations':check_mutations(code),'cli':check_cli(),'stockOriginalVerified':False,'originalExecutableExecuted':False},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
