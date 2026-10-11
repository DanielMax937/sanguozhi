#!/usr/bin/env python3
"""Fail-closed recruitment source, closed schema, input/API and mutation checks.

Pinned full-source and profile hashes are external identity assertions. Updating
the metadata and schema together cannot authorize a stronger evidence claim.
This checker never executes original machine code, native helpers or a command.
"""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from jsonschema import Draft202012Validator, ValidationError
from oracle_recruitment_quantity import (ROOT,SOURCE,PROFILE,ENTRY,END,
    parse_listing,load_listing,cases,make_case,check_examples,compare_results,
    check_rejections,check_api_contract,check_typescript_mutations)

PROFILE_FILE=ROOT/'docs/sources/recruitment-quantity.json'
SCHEMA_FILE=ROOT/'docs/sources/recruitment-quantity.schema.json'
PROFILE_SHA='12adb87c8332e20e6b50dcee2d4a48c7bd8b0eef784e5061f1f1b15008415ded'
SCHEMA_SHA='eba9894b77a0886a74fe9376764b049e27acfc14ee744ca07c6052c36e8f6248'
UTF8_SHA='1460bf463ff0e7a42fb81da8b35248748a249209b9b6213548f5ee1802ae4344'
GBK_SHA='130f094728a1ccefe46c086e00f122a551fbe55e6c794626156a44072d2f43b9'
BLOB_SHA='0b122837b1ff1ae11789121595531b64e80ff8d2'
CODE_SHA='222db5df5e94f2ac910dbdf6148258e815cc1494f345fa92751b4ccc2e09a5bb'
LICENSE_SHA='c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'

def canonical(value):return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
def sha(value):return hashlib.sha256(value).hexdigest()


def check(profile,schema,utf8):
    assert sha(canonical(profile))==PROFILE_SHA,'independently pinned metadata changed'
    assert sha(canonical(schema))==SCHEMA_SHA,'independently pinned closed schema changed'
    assert schema['type']=='object' and schema['additionalProperties'] is False
    assert schema['required']==list(profile)
    assert schema['properties']=={key:{'const':value} for key,value in profile.items()}
    Draft202012Validator.check_schema(schema);Draft202012Validator(schema).validate(profile)
    assert len(utf8)==12020 and sha(utf8)==UTF8_SHA,'full UTF-8 source changed'
    text=utf8.decode('utf-8');gbk=text.encode('gbk')
    assert len(gbk)==11348 and sha(gbk)==GBK_SHA
    assert hashlib.sha1(b'blob 11348\0'+gbk).hexdigest()==BLOB_SHA
    assert gbk.decode('gbk').encode('utf-8')==utf8
    listing=parse_listing(text)
    assert profile['profileId']==PROFILE=='recruitment-quantity-observations-f32-v1'
    assert profile['originalListing']['instructionCount']==131
    assert profile['originalListing']['byteLength']==373 and profile['originalListing']['sha256']==CODE_SHA
    assert len(profile['originalListing']['directCalls'])==12 and len(profile['originalListing']['indirectCalls'])==3
    assert profile['calls']['staticSites']==15 and profile['calls']['maximumDynamicCalls']==21 and profile['calls']['maximumEaxCaptures']==19
    assert profile['level']=='source-listing-reconstruction'
    assert profile['stockOriginalVerified'] is False and profile['originalExecutableExecuted'] is False
    for key in ('stockOriginalVerified','originalExecutableExecuted','nativeHelpersReconstructed','callerIntegrated',
                'commandIntegrated','mutableStateRecovered','completeRecruitmentRecovered'):
        assert profile['evidence'][key] is False
    for key in ('stockConstantsVerified','sameVersionConverterBodyVerified','fpuExceptionBehaviorVerified'):
        assert profile['floatingPointContract'][key] is False
    license_bytes=(ROOT/'docs/sources/recruitment-quantity-LICENSE.txt').read_bytes()
    assert len(license_bytes)==11357 and sha(license_bytes)==LICENSE_SHA
    assert hashlib.sha1(b'blob 11357\0'+license_bytes).hexdigest()=='261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64'
    return listing


def must_fail(fn,label):
    try:fn()
    except (AssertionError,ValidationError,ValueError,UnicodeError,KeyError,TypeError):return label
    raise AssertionError('mutation survived: '+label)


def mutation_checks(profile,schema,utf8):
    killed=[]
    def leaves(value,path=()):
        if type(value) is dict:
            for key,child in value.items():yield from leaves(child,path+(key,))
        elif type(value) is list:
            for key,child in enumerate(value):yield from leaves(child,path+(key,))
        else:yield path,value
    for name,original in (('profile',profile),('schema',schema)):
        for path,value in leaves(original):
            changed=deepcopy(original);current=changed
            for key in path[:-1]:current=current[key]
            current[path[-1]]=not value if type(value) is bool else value+1 if type(value) is int else value+' [mutated]'
            killed.append(must_fail(lambda:check(changed if name=='profile' else profile,changed if name=='schema' else schema,utf8),name+':'+'.'.join(map(str,path))))
        for key in original:
            changed=deepcopy(original);del changed[key]
            killed.append(must_fail(lambda:check(changed if name=='profile' else profile,changed if name=='schema' else schema,utf8),name+':missing:'+key))
        changed=deepcopy(original);changed['unknown']=True
        killed.append(must_fail(lambda:check(changed if name=='profile' else profile,changed if name=='schema' else schema,utf8),name+':extra'))
    text=utf8.decode();rows=[]
    original=text.split('='*25)[0]
    for m in re.finditer(r'^([0-9A-F]{8}) - ((?:[0-9a-f]{2} )+)\s+- (.*)$',original,re.M):
        if ENTRY<=int(m[1],16)<END:rows.append(m)
    assert len(rows)==131
    for m in rows:
        raw=bytes.fromhex(m[2]);changed=bytes([raw[0]^1])+raw[1:]
        mutant=text[:m.start(2)]+changed.hex(' ')+' '+text[m.end(2):]
        killed.append(must_fail(lambda:parse_listing(mutant),'listing-byte:'+m[1]))
    mutations={
      'sar-edx-source-typo':text.replace('sar dl,05','sar edx,05'),
      'drop-instruction':'\n'.join(line for line in text.splitlines() if not line.startswith('005C3697 -')),
      'wrong-gate-mnemonic':text.replace('je 005c377e','jne 005c377e'),
      'wrong-call-mnemonic':text.replace('call 004890b0','call 00489090'),
      'instruction-gap':text.replace('005C36EF -','005C36EE -'),
      'original-mod-overlay':text.replace('005C3710 - e8 5f 43 14 00','005C3710 - e9 73 66 2e 00'),
      'duplicate-original':text.replace('005C3610 - 83 ec 08','005C3610 - 83 ec 08 - sub esp,08\n005C3610 - 83 ec 08'),
      'mod-boundary':text.replace('修改 - 大城市和普通城市征兵倍率可调整','MOD altered'),
    }
    for label,mutant in mutations.items():
        assert mutant!=text,label
        killed.append(must_fail(lambda:parse_listing(mutant),label))
    for group,keys in [('evidence',('stockOriginalVerified','originalExecutableExecuted','nativeHelpersReconstructed','callerIntegrated','commandIntegrated','mutableStateRecovered','completeRecruitmentRecovered')),
                       ('floatingPointContract',('stockConstantsVerified','sameVersionConverterBodyVerified','fpuExceptionBehaviorVerified'))]:
        for key in keys:
            forged=deepcopy(profile);forged[group][key]=True
            coordinated=deepcopy(schema);coordinated['properties'][group]['const']=forged[group]
            killed.append(must_fail(lambda:check(forged,coordinated,utf8),'coordinated-claim:'+key))
    # Coordinating forged source identities with both evidence files must also fail.
    mutant=text.replace('sar dl,05','sar edx,05').encode();forged=deepcopy(profile)
    forged['source']['snapshotSha256']=sha(mutant);forged['source']['snapshotBytes']=len(mutant)
    forged['source']['originalSha256']=sha(mutant.decode().encode('gbk'))
    coordinated=deepcopy(schema);coordinated['properties']['source']['const']=forged['source']
    killed.append(must_fail(lambda:check(forged,coordinated,mutant),'coordinated-source-and-schema'))
    forged=deepcopy(profile);forged['stockOriginalVerified']=0
    coordinated=deepcopy(schema);coordinated['properties']['stockOriginalVerified']['const']=0
    killed.append(must_fail(lambda:check(forged,coordinated,utf8),'zero-is-not-false'))
    killed.append(must_fail(lambda:check(profile,schema,utf8+b' '),'full-source-extra-byte'))
    return {'totalKilled':len(killed),'allKilled':True,'individualInstructionByteMutations':len(rows),
            'structuralListingMutations':len(mutations),'coordinatedClaimMutations':10,'coordinatedSourceAndSchemaMutations':1}


def input_schema_checks(profile):
    schema=profile['inputSchema'];Draft202012Validator.check_schema(schema);validator=Draft202012Validator(schema)
    inputs=cases()
    for case in inputs:validator.validate(case)
    base=next(deepcopy(c) for c in inputs if 'difficultyWord' in c and any('slotIndex' in x for x in c['captures']))
    bad=[None,[],{},dict(base,extra=1),dict(base,profile='stock')]
    for key in base:
        item=deepcopy(base);del item[key];bad.append(item)
    for field,lo,hi in [('savedSecurityByte',0,255),('difficultyWord',0,4294967295)]:
        for value in (lo-1,hi+1,True,None,'0',.5):bad.append(dict(base,**{field:value}))
    for value in ('3f99999a','1.2',1.2,'3F800001',None,False):bad.append(dict(base,resolvedFacilityFactorBits=value))
    for value in (-1,2**32,True,None,'0',1.5):
        item=deepcopy(base);item['captures'][0]['eax']=value;bad.append(item)
    for field,value in (('slotIndex',0),('callAddress','005c3619'),('callAddress','005C36C8'),('extra',1)):
        item=deepcopy(base);item['captures'][0][field]=value;bad.append(item)
    for key in ('callAddress','eax'):
        item=deepcopy(base);del item['captures'][0][key];bad.append(item)
    loopindex=next(i for i,c in enumerate(base['captures']) if 'slotIndex' in c)
    for value in (-1,3,True,.5,'0',None):
        item=deepcopy(base);item['captures'][loopindex]['slotIndex']=value;bad.append(item)
    item=deepcopy(base);del item['captures'][loopindex]['slotIndex'];bad.append(item)
    bad.append(dict(base,captures=[]));bad.append(dict(base,captures=[base['captures'][0]]*20))
    for item in bad:assert not validator.is_valid(item),item
    # Early field and exact sequence obligations deliberately exceed shape schema.
    runtime_only=[{'profile':PROFILE,'captures':[{'callAddress':'005C3619','eax':0}],
        'savedSecurityByte':0,'resolvedFacilityFactorBits':'3F800000','difficultyWord':0},
        {'profile':PROFILE,'captures':[{'callAddress':'005C3619','eax':1}]}]
    for item in runtime_only:validator.validate(item)
    return {'validShapes':len(inputs),'invalidShapes':len(bad),'runtimeOnlyExamples':len(runtime_only),
            'dynamicOrderEnforcedBy':'TypeScript runtime and independent listing interpreter; not JSON Schema'}


def documentation_checks():
    rule=(ROOT/'docs/rules/recruitment-quantity.md').read_text()
    for word in ('source-listing-reconstruction','131条/373','19','21','N=1000','SAR EDX','5033165/4194304','二次','P0-78','Proxy','helper'):
        assert word in rule,word
    military=(ROOT/'docs/rules/04-military.md').read_text().split('### 征兵导致的治安下降')[0]
    assert 'recruitment-quantity.md' in military and 'ADD32' in military and 'SUB32' in military
    assert 'PC-PK 1.1 精确公式（代码逆向确认）' not in military
    for rel in ('README.md','TODO.md','缺少的数据.md','docs/rules/README.md','docs/rules/STATUS.md','docs/rules/SOURCES.md'):
        assert 'recruitment-quantity.md' in (ROOT/rel).read_text(),rel
    return {'scopedRuleAndSummaries':7,'militaryNumericClaimsNarrowed':True}


def check_cli():
    command=[sys.executable,str(ROOT/'scripts/oracle_recruitment_quantity.py')]
    result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True);assert result.returncode==0,result.stderr
    report=json.loads(result.stdout)
    assert not {'integerGrid','finitePrecision','actualApiGrid','typescriptMutations'} & set(report)
    assert report['originalExecutableExecuted'] is False
    rejected=0
    for args in (['--unknown'],['--output'],['--exhaustive=false'],['--factor','1.2'],['{}']):
        result=subprocess.run(command+args,cwd=ROOT,text=True,capture_output=True)
        assert result.returncode!=0 and not result.stdout,args;rejected+=1
    with tempfile.TemporaryDirectory(prefix='recruitment-quantity-cli-') as directory:
        output=Path(directory)/'report.json'
        result=subprocess.run(command+['--output',str(output)],cwd=ROOT,text=True,capture_output=True)
        assert result.returncode==0,result.stderr
        assert output.read_text()==result.stdout
    return {'defaultVerified':True,'outputFileMatchesStdout':True,'malformedArgumentCasesRejected':rejected}


def main():
    assert len(sys.argv)==1,'checker accepts no arguments'
    profile=json.loads(PROFILE_FILE.read_text());schema=json.loads(SCHEMA_FILE.read_text());utf8=SOURCE.read_bytes()
    listing=check(profile,schema,utf8)
    report={'level':'source-listing-reconstruction','sourceAndClosedSchemaVerified':True,
        'sourceSchemaMutations':mutation_checks(profile,schema,utf8),'inputSchema':input_schema_checks(profile),
        'documentation':documentation_checks(),'examples':check_examples(listing),
        'byteOracleComparisons':compare_results(listing,cases()),'runtimeSequenceRejections':check_rejections(listing),
        'nonJsonApiContract':check_api_contract(),'typescriptMutations':check_typescript_mutations(listing),'cli':check_cli(),
        'stockOriginalVerified':False,'originalExecutableExecuted':False,'nativeAbiVerified':False,'realTraceReachabilityVerified':False}
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
