#!/usr/bin/env python3
"""Fail-closed production-time evidence/schema/source/API and mutation checks.

Fixed hashes here were independently inspected against the entire supplied
source, not obtained from loaded metadata at validation time. JSON Schema checks
shape; exact dynamic captures and non-JSON descriptors are checked at runtime.
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
from oracle_production_time import (ROOT,SOURCE,PROFILE,ENTRY,END,CALLS,TABLE_HEX,TABLE_SHA,
    GBK_SHA,UTF8_SHA,BLOB_SHA,CODE_SHA,parse_listing,load_listing,cases,make_case,
    check_examples,compare_results,check_rejections,check_api_contract,check_typescript_mutations)

PROFILE_FILE=ROOT/'docs/sources/production-time.json'
SCHEMA_FILE=ROOT/'docs/sources/production-time.schema.json'
PROFILE_SHA='c93e792474bd4c93ace321e4008744fe678ed154b456dc1d882de088c3a62bf3'
SCHEMA_SHA='857b67d00359f3bacdd71eb3d5690441b78027385aae11eef08a83dc7c9b7f12'
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
    assert len(utf8)==12376 and sha(utf8)==UTF8_SHA,'full UTF-8 source changed'
    text=utf8.decode('utf-8');gbk=text.encode('gbk')
    assert len(gbk)==11701 and sha(gbk)==GBK_SHA
    assert hashlib.sha1(b'blob 11701\0'+gbk).hexdigest()==BLOB_SHA
    assert gbk.decode('gbk').encode('utf-8')==utf8
    listing=parse_listing(text)
    native=profile['originalListing']
    assert native=={'start':'005C6CA0','endExclusive':'005C6E34','instructionCount':138,'byteLength':404,'sha256':CODE_SHA,
        'calls':[{'address':f'{a:08X}','target':f'{t:08X}'} for a,(t,_) in CALLS.items()]}
    assert profile['tables']=={'start':'005C6E34','hex':TABLE_HEX,'sha256':TABLE_SHA}
    assert profile['profileId']==PROFILE and profile['level']=='source-listing-reconstruction'
    assert profile['stockOriginalVerified'] is False and profile['originalExecutableExecuted'] is False
    for key in ('stockOriginalVerified','originalExecutableExecuted','nativeHelpersReconstructed','callerIntegrated',
                'commandIntegrated','mutableStateRecovered','completeProductionRecovered'):
        assert profile['evidence'][key] is False
    license_bytes=(ROOT/'docs/sources/production-time-LICENSE.txt').read_bytes()
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
    for m in re.finditer(r'^([0-9A-F]{8}) - ((?:[0-9a-f]{2} )+)\s+- (.*)$',text.split('修改 - 自定义生产兵器舰船最大耗时和最短耗时')[0],re.M):
        if ENTRY<=int(m[1],16)<END:rows.append(m)
    # Every listed instruction receives an independent source-byte perturbation.
    for m in rows:
        raw=bytes.fromhex(m[2]);changed=bytes([raw[0]^1])+raw[1:]
        mutant=text[:m.start(2)]+changed.hex(' ')+' '+text[m.end(2):]
        killed.append(must_fail(lambda:parse_listing(mutant),'listing-byte:'+m[1]))
    listing_mutations={
      'decoded-edx-vs-typo-dl':text.replace('sar dl,02','sar edx,02'),
      'drop-instruction':'\n'.join(line for line in text.splitlines() if not line.startswith('005C6D1C -')),
      'wrong-branch-mnemonic':text.replace('jnge 005c6cb4','jge 005c6cb4'),
      'wrong-call-target-mnemonic':text.replace('call 00489090','call 004890a0'),
      'wrong-table-dispatch':text.replace('00 00 00 00 02 01 01','00 00 00 00 01 01 01'),
      'wrong-jump-table-address':text.replace('DC 6C 5C 00 E6','DD 6C 5C 00 E6'),
      'instruction-gap':text.replace('005C6D1C -','005C6D1D -'),
      'original-mod-overlay':text.replace('005C6D79 - be 0a 00 00 00','005C6D79 - e9 c2 28 2e 00'),
      'duplicate-original':text.replace('005C6CA0 - 83 ec 08','005C6CA0 - 83 ec 08 - sub esp,08\n005C6CA0 - 83 ec 08'),
      'mod-boundary-missing':text.replace('修改 - 自定义生产兵器舰船最大耗时和最短耗时','MOD changed'),
    }
    for label,mutant in listing_mutations.items():
        assert mutant!=text,label
        killed.append(must_fail(lambda:parse_listing(mutant),label))
    for key in ('stockOriginalVerified','originalExecutableExecuted','nativeHelpersReconstructed','callerIntegrated',
                'commandIntegrated','mutableStateRecovered','completeProductionRecovered'):
        forged=deepcopy(profile);forged['evidence'][key]=True
        coordinated=deepcopy(schema);coordinated['properties']['evidence']['const']=forged['evidence']
        killed.append(must_fail(lambda:check(forged,coordinated,utf8),'coordinated-claim:'+key))
    forged=deepcopy(profile);forged['stockOriginalVerified']=0
    coordinated=deepcopy(schema);coordinated['properties']['stockOriginalVerified']['const']=0
    killed.append(must_fail(lambda:check(forged,coordinated,utf8),'zero-is-not-false'))
    killed.append(must_fail(lambda:check(profile,schema,utf8+b' '),'full-source-extra-byte'))
    killed.append(must_fail(lambda:check(profile,schema,text.replace('耗时由政治决定','耗时由魅力决定').encode()),'source-comment-changed'))
    return {'totalKilled':len(killed),'allKilled':True,'individualInstructionByteMutations':len(rows),
            'structuralListingMutations':len(listing_mutations),'coordinatedClaimMutations':8}


def input_schema_checks(profile):
    schema=profile['inputSchema'];Draft202012Validator.check_schema(schema);validator=Draft202012Validator(schema)
    inputs=cases()
    for case in inputs:validator.validate(case)
    base=make_case(10,ship=(1,0,1,0,0,1));bad=[None,[],{},dict(base,extra=1),dict(base,profile='stock')]
    for key in base:
        item=deepcopy(base);del item[key];bad.append(item)
    for value in (-2**31-1,2**31,True,None,'5',1.5):bad.append(dict(base,nativeEquipmentType=value))
    for value in (-1,2**32,True,None,'0',1.5):
        item=deepcopy(base);item['captures'][0]['eax']=value;bad.append(item)
    for field,value in (('slotIndex',3),('slotIndex',True),('slotIndex',-1),('callAddress','005c6cf8'),('callAddress','0047A630'),('extra',1)):
        item=deepcopy(base);item['captures'][0][field]=value;bad.append(item)
    for key in ('callAddress','eax','slotIndex'):
        item=deepcopy(base);del item['captures'][0][key];bad.append(item)
    item=deepcopy(base);item['captures'][-1]['slotIndex']=0;bad.append(item)
    item=deepcopy(base);item['captures'].append(deepcopy(item['captures'][-1]));bad.append(item)
    for item in bad:assert not validator.is_valid(item),item
    # The schema intentionally does not promise conditional execution validation.
    missing=deepcopy(base);missing['captures']=[];validator.validate(missing)
    return {'validShapes':len(inputs),'invalidShapes':len(bad),'emptyCaptureShapeAccepted':True,
            'dynamicOrderEnforcedBy':'TypeScript runtime and independent listing interpreter; not JSON Schema'}


def check_cli():
    command=[sys.executable,str(ROOT/'scripts/oracle_production_time.py')]
    result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True);assert result.returncode==0,result.stderr
    report=json.loads(result.stdout);assert 'exhaustiveArithmetic' not in report and report['originalExecutableExecuted'] is False
    rejected=0
    for args in (['--unknown'],['--output'],['--exhaustive=false'],['--native-equipment-type','5'],['{}']):
        result=subprocess.run(command+args,cwd=ROOT,text=True,capture_output=True)
        assert result.returncode!=0 and not result.stdout,args;rejected+=1
    with tempfile.TemporaryDirectory(prefix='production-time-cli-') as directory:
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
        'sourceSchemaMutations':mutation_checks(profile,schema,utf8),
        'inputSchema':input_schema_checks(profile),'examples':check_examples(listing),
        'byteOracleComparisons':compare_results(listing,cases()),'runtimeSequenceRejections':check_rejections(listing),
        'nonJsonApiContract':check_api_contract(),'typescriptMutations':check_typescript_mutations(listing),'cli':check_cli(),
        'stockOriginalVerified':False,'originalExecutableExecuted':False,'nativeAbiVerified':False,'realTraceReachabilityVerified':False}
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
