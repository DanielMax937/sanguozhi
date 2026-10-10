#!/usr/bin/env python3
"""Frozen source/evidence/schema and runtime contract checks for search-gold caller."""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from jsonschema import Draft202012Validator, ValidationError
from search_gold_source_oracle import (ROOT,SOURCE,SOURCE_UTF8,EVIDENCE,parse_listing,
    check_examples,check_mutations,check_api_contract,check_typescript_mutations)
PROFILE_FILE=ROOT/'docs/sources/search-gold-caller.json'
SCHEMA_FILE=ROOT/'docs/sources/search-gold-caller.schema.json'
# Frozen independently reviewed contract, never derived from loaded product JSON.
PINNED_PROFILE={'profileId': 'search-gold-caller-resolved-v1',
 'scope': 'post-RNG caller arithmetic from explicit per-call uint32 captures; no helper or reward '
          'execution',
 'evidence': {'level': 'source-listing-reconstruction',
              'profile': 'search-gold-caller-resolved-v1',
              'source': 'docs/sources/search-gold-caller.json',
              'originalRange': '005D5BA6 <= PC < 005D5BF8',
              'scope': 'post-RNG caller arithmetic from explicit per-call uint32 captures; no helper or '
                       'reward execution',
              'listedBytesVerified': True,
              'interpretedCallSitesCaptured': True,
              'stockOriginalVerified': False,
              'originalExecutableExecuted': False,
              'nativeHelpersReconstructed': False,
              'callerIntegrated': False,
              'realRewardRecovered': False,
              'rngIntegrated': False,
              'commandIntegrated': False,
              'mutableStateRecovered': False,
              'completeSearchRecovered': False,
              'finalProbabilityRecovered': False},
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
            'acquisition': 'GitHub connector decoded text; GBK re-encoding matches pinned Git blob; not '
                           'a direct raw download',
            'authority': 'Published research listing for 311PK, no authenticated executable hash or '
                         'exact patch/version identity'},
 'license': {'spdx': 'Apache-2.0',
             'snapshot': 'docs/sources/production-price-LICENSE.txt',
             'sha256': 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
             'url': 'https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/LICENSE',
             'attribution': 'sjn4048/311MemoryResearch'},
 'originalListing': {'start': '005D5BA6',
                     'endExclusive': '005D5BF8',
                     'instructionCount': 29,
                     'listedByteLength': 82,
                     'listedBytesSha256': 'e4ecb097b0d272552d3203c1f2a60f834e7c0fc50f32a032f17c4f50f4135325',
                     'capturedCallCount': 4,
                     'conditionalBranchCount': 3,
                     'conditionalBranchOutcomeCount': 6,
                     'capturedCalls': [{'callAddress': '005D5BBE',
                                        'target': '00486C80',
                                        'capture': 'firstGold'},
                                       {'callAddress': '005D5BCB',
                                        'target': '00486D30',
                                        'capture': 'firstCapacity'},
                                       {'callAddress': '005D5BDA',
                                        'target': '00486C80',
                                        'capture': 'secondRead.gold'},
                                       {'callAddress': '005D5BE3',
                                        'target': '00486D30',
                                        'capture': 'secondRead.capacity'}],
                     'excludedHandlers': [{'callAddress': '005D5BF8',
                                           'target': '005D3F80',
                                           'outcome': 'gold-handler'},
                                          {'callAddress': '005D5C02',
                                           'target': '005D4160',
                                           'outcome': 'nothing'}],
                     'handlersExecuted': False,
                     'upstreamRngCall': '005D5BA1',
                     'upstreamRngTarget': '00472150',
                     'rngExecuted': False},
 'arithmetic': {'rngLow16': 'rngEax & 65535 (MOVZX AX)',
                'proposedAmount': 'min(rngLow16,80)',
                'firstSumU32': '(firstGold+proposedAmount) modulo 2^32',
                'capacityExceeded': 'signed32(firstCapacity) < signed32(firstSumU32)',
                'amountU32': 'capacityExceeded ? (secondRead.capacity-secondRead.gold) modulo 2^32 : '
                             'proposedAmount',
                'amountSigned': 'signed32(amountU32)',
                'outcome': 'amountSigned < 30 ? nothing : gold-handler',
                'secondRead': 'required iff capacityExceeded; distinct call-site captures, never '
                              'synthesized or reused',
                'branchTrace': {'rollCapTaken': 'JG after CMP rngLow16,80',
                                'capacitySufficientTaken': 'JNL after CMP '
                                                           'signed32(firstCapacity),signed32(firstSumU32)',
                                'nothingTaken': 'JNGE after CMP amountSigned,30'},
                'fullCapturedDomainAmountBoundedBy80': False,
                'goldHandlerArgumentIsActualReward': False},
 'inputSchema': {'type': 'object',
                 'additionalProperties': False,
                 'required': ['profile', 'rngEax', 'firstGold', 'firstCapacity'],
                 'properties': {'profile': {'const': 'search-gold-caller-resolved-v1'},
                                'rngEax': {'type': 'integer', 'minimum': 0, 'maximum': 4294967295},
                                'firstGold': {'type': 'integer', 'minimum': 0, 'maximum': 4294967295},
                                'firstCapacity': {'type': 'integer',
                                                  'minimum': 0,
                                                  'maximum': 4294967295},
                                'secondRead': {'type': 'object',
                                               'additionalProperties': False,
                                               'required': ['gold', 'capacity'],
                                               'properties': {'gold': {'type': 'integer',
                                                                       'minimum': 0,
                                                                       'maximum': 4294967295},
                                                              'capacity': {'type': 'integer',
                                                                           'minimum': 0,
                                                                           'maximum': 4294967295}}}}},
 'validation': 'Closed own data properties; plain or null prototype only; no coercion, accessors, '
               'inherited fields or symbols. Normalize negative zero. Runtime additionally requires '
               'secondRead exactly on the signed overflow-aware clipping path; JSON Schema describes '
               'shape only. Rejection is an engineering contract, not native failure.',
 'unresolved': ['00472150 RNG distribution, seed, consumption and relationship to upstream charisma '
                'capture',
                '00486C80 and 00486D30 helper implementations, ABI, side effects, pointer lifetime and '
                'capture reachability',
                'earlier talent, event and treasure conditions and complete-search conditional '
                'probability',
                '005D3F80 and 005D4160 actual reward writes, experience, merit and messages',
                'native mutable state, AP, complete command and scheduling',
                'clean-stock executable, exact patch identity and cross-version equivalence',
                'P0-78 and dependent capture/force/native transactions']}


def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':'))
def sha(raw):return hashlib.sha256(raw).hexdigest()

def check(profile,schema,raw,utf8):
    assert canonical(profile)==canonical(PINNED_PROFILE),'independently pinned evidence changed'
    expected={'$schema':'https://json-schema.org/draft/2020-12/schema','title':'Search gold caller source metadata',
              'type':'object','additionalProperties':False,'required':list(PINNED_PROFILE),
              'properties':{k:{'const':v} for k,v in PINNED_PROFILE.items()}}
    assert canonical(schema)==canonical(expected),'closed typed schema changed'
    Draft202012Validator.check_schema(schema);Draft202012Validator(schema).validate(profile)
    assert canonical(profile['evidence'])==canonical(EVIDENCE),'oracle evidence contract drift'
    assert len(raw)==42874 and sha(raw)=='b8fb7965114ebc0d26cbb27058367c3a54ff47972bff9ab8dfc9e61867f8560a'
    assert hashlib.sha1(b'blob 42874\0'+raw).hexdigest()=='82bff04db2dae9ae0787e1e71ad72f1b4e6852de'
    assert len(utf8)==44634 and sha(utf8)=='5cbca6abd2d96ccf6980f26bee3eb4fd31b0baa0a942d65f5efb0d4c30220f0c'
    assert raw.decode('gbk').encode()==utf8 and utf8.decode().encode('gbk')==raw
    assert sha((ROOT/'docs/sources/production-price-LICENSE.txt').read_bytes())=='c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
    talent=json.loads((ROOT/'docs/sources/search-talent-baseline.json').read_text())
    treasure=json.loads((ROOT/'docs/sources/treasure-roll-argument.json').read_text())
    assert talent['evidence']['searchTreasureRecovered'] is False
    assert treasure['evidence']['rngIntegrated'] is False and treasure['evidence']['ownershipWriterRecovered'] is False
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
      'movzx-width':text.replace('005D5BA6 - 0f b7 c0','005D5BA6 - 0f b6 c0'),
      'mnemonic':text.replace('movzx eax,ax','movsx eax,ax'),
      'jg-to-jge-source':text.replace('005D5BB4 - 7f 02','005D5BB4 - 7d 02'),
      'branch-target':text.replace('jnl 005d5bec','jnl 005d5bea'),
      'instruction-gap':text.replace('005D5BC3 -','005D5BC4 -'),
      'delete-instruction':'\n'.join(l for l in text.splitlines() if not l.startswith('005D5BE8 -')),
      'duplicate-instruction':text+'\n005D5BE8 - 2b c7 - sub eax,edi',
      'first-capture-target':text.replace('005D5BBE - e8 bd 10 eb ff','005D5BBE - e8 bd 11 eb ff'),
      'second-capture-target':text.replace('005D5BE3 - e8 48 11 eb ff','005D5BE3 - e8 48 10 eb ff'),
      'gold-handler-target':text.replace('call 005d3f80','call 005d3f81'),
      'nothing-handler-target':text.replace('call 005d4160','call 005d4161'),
      'upstream-rng-context':text.replace('005D5BA1 - e8 aa c5 e9 ff','005D5BA1 - e8 ab c5 e9 ff'),
    }
    for label,t in mutations.items():
        assert t!=text,label
        killed.append(must_fail(lambda:parse_listing(t),'listing:'+label))
    killed.append(must_fail(lambda:check(profile,schema,raw+b' ',utf8),'full-source-append'))
    killed.append(must_fail(lambda:check(profile,schema,raw,utf8+b' '),'utf8-append'))
    for key in ['stockOriginalVerified','realRewardRecovered','rngIntegrated','nativeHelpersReconstructed','mutableStateRecovered','commandIntegrated']:
        forged=deepcopy(profile);forged['evidence'][key]=True
        coordinated=deepcopy(schema);coordinated['properties']['evidence']['const']=forged['evidence']
        killed.append(must_fail(lambda:check(forged,coordinated,raw,utf8),'coordinated-'+key))
    forged=deepcopy(profile);forged['originalListing']['handlersExecuted']=0
    coordinated=deepcopy(schema);coordinated['properties']['originalListing']['const']=forged['originalListing']
    killed.append(must_fail(lambda:check(forged,coordinated,raw,utf8),'zero-is-not-false'))
    return {'count':len(killed),'allKilled':True,'listingMutations':len(mutations),'coordinatedClaimMutations':6}


def input_schema_checks(profile):
    s=profile['inputSchema'];Draft202012Validator.check_schema(s);v=Draft202012Validator(s)
    base={'profile':'search-gold-caller-resolved-v1','rngEax':80,'firstGold':100,'firstCapacity':150,'secondRead':{'gold':100,'capacity':150}}
    valid=[]
    for value in [0,1,29,30,80,65535,65536,2147483647,2147483648,4294967295]:
        for key in ['rngEax','firstGold','firstCapacity']:
            x=deepcopy(base);x[key]=value;valid.append(x)
        for key in ['gold','capacity']:
            x=deepcopy(base);x['secondRead'][key]=value;valid.append(x)
    for x in valid:v.validate(x)
    bad=[None,[],{},dict(base,profile='stock'),dict(base,extra=0)]
    for key in ['profile','rngEax','firstGold','firstCapacity']:
        x=deepcopy(base);del x[key];bad.append(x)
    for value in [-1,4294967296,1.5,True,None,'1',{},[]]:
        for key in ['rngEax','firstGold','firstCapacity']:
            x=deepcopy(base);x[key]=value;bad.append(x)
        for key in ['gold','capacity']:
            x=deepcopy(base);x['secondRead'][key]=value;bad.append(x)
    for nested in [None,[],{},1,{'gold':1},{'capacity':1},{'gold':1,'capacity':1,'extra':1}]:bad.append(dict(base,secondRead=nested))
    for x in bad:assert not v.is_valid(x),x
    no_second=deepcopy(base);del no_second['secondRead'];v.validate(no_second)
    return {'validShapeCases':len(valid)+1,'invalidShapeCases':len(bad),
            'conditionalSecondReadEnforcedBy':'runtime byte-oracle comparison and API contract; JSON Schema intentionally only specifies shape',
            'runtimeNonJsonChecks':'NaN, Infinity, accessors, inherited fields, symbols, custom prototypes, undefined, bigint'}


def check_cli():
    command=[sys.executable,str(ROOT/'scripts/search_gold_source_oracle.py')]
    p=subprocess.run(command,cwd=ROOT,capture_output=True,text=True);assert p.returncode==0,p.stderr
    report=json.loads(p.stdout);assert report['level']=='source-listing-reconstruction' and 'exhaustive' not in report
    rejected=0
    for args in (['--unknown'],['--output'],['--exhaustive=false'],['--rng','1'],['{}']):
        p=subprocess.run(command+args,cwd=ROOT,capture_output=True,text=True)
        assert p.returncode!=0 and not p.stdout,args;rejected+=1
    with tempfile.TemporaryDirectory(prefix='search-gold-cli-') as d:
        output=Path(d)/'report.json';p=subprocess.run(command+['--output',str(output)],cwd=ROOT,capture_output=True,text=True)
        assert p.returncode==0,p.stderr;assert output.read_text()==p.stdout
    return {'defaultVerified':True,'outputFileMatchesStdout':True,'malformedArgumentsRejected':rejected}


def main():
    assert len(sys.argv)==1,'checker accepts no arguments'
    profile=json.loads(PROFILE_FILE.read_text());schema=json.loads(SCHEMA_FILE.read_text())
    raw,utf8=SOURCE.read_bytes(),SOURCE_UTF8.read_bytes();code=check(profile,schema,raw,utf8)
    report={'level':'source-listing-reconstruction','sourceAndClosedSchemaVerified':True,
            'examples':check_examples(code),'mutations':mutation_checks(profile,schema,raw,utf8),
            'inputSchema':input_schema_checks(profile),'api':check_api_contract(),'instructionMutations':check_mutations(code),
            'typescriptMutations':check_typescript_mutations(code),'cli':check_cli(),
            'stockOriginalVerified':False,'originalExecutableExecuted':False}
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
