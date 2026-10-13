#!/usr/bin/env python3
"""Fail-closed source, closed-schema and public API checks for the escape argument.

Independent fixed identities reject coordinated metadata/schema/source claims.
Standards JSON Schema validation is exercised separately from the hash guards.
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
from oracle_captive_escape_roll_argument import (ROOT,SOURCE,GBK_FILE,MATERIALS,PROFILE,UTF8_SHA,GBK_SHA,
    BLOB_SHA,CALLER_SHA,CODE_SHA,ROW_PATTERN,canonical,sha,parse_listing,load_listing,
    independently_disassemble,verify_factorization,compare_api)

PROFILE_FILE=ROOT/'docs/sources/captive-escape-roll-argument.json'
SCHEMA_FILE=ROOT/'docs/sources/captive-escape-roll-argument.schema.json'
PROFILE_SHA='50a1f8347a5d37ad2f640151d19da2c51418e3c9a8d1b7771e4ba63607353528'
SCHEMA_SHA='23636b2ec0532bdbe67b057463abcec5555a2a0815f5d634dbd65f14f23d63ce'
MANIFEST_SHA='b8d06f188d5438d634d31065aeedbda3dd93f764cb63f6549bbc2d9eb8bf4c4f'
LICENSE_SHA='c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
FALSE_EVIDENCE=('stockOriginalVerified','originalExecutableExecuted','nativeHelpersReconstructed',
    'abiVerified','realTraceReachabilityVerified','earlyMonthGateIntegrated','attributeGettersRecovered',
    'rngRecovered','escapeReleaseRecovered','monthlySchedulerIntegrated','commandIntegrated','modBehaviorIncluded')


def closed_const_schema(value):
    if type(value) is dict:
        return {'type':'object','additionalProperties':False,'required':list(value),
            'properties':{key:closed_const_schema(child) for key,child in value.items()}}
    return {'type':{str:'string',int:'integer',bool:'boolean',list:'array'}[type(value)],'const':value}


def authenticate_source(utf8,gbk):
    assert len(utf8)==17362 and sha(utf8)==UTF8_SHA,'fixed UTF-8 source changed'
    assert len(gbk)==16828 and sha(gbk)==GBK_SHA,'fixed GBK source changed'
    assert utf8.decode('utf-8').encode('gbk')==gbk,'GBK reconstruction differs'
    assert gbk.decode('gbk').encode('utf-8')==utf8,'nonreversible source encoding'
    assert hashlib.sha1(b'blob 16828\0'+gbk).hexdigest()==BLOB_SHA
    return parse_listing(utf8.decode('utf-8'))


def check(profile,schema,utf8,gbk):
    assert sha(canonical(profile))==PROFILE_SHA,'independently pinned metadata changed'
    assert sha(canonical(schema))==SCHEMA_SHA,'independently pinned schema changed'
    assert schema=={'$schema':'https://json-schema.org/draft/2020-12/schema',**closed_const_schema(profile)}
    Draft202012Validator.check_schema(schema);Draft202012Validator(schema).validate(profile)
    listing=authenticate_source(utf8,gbk)
    assert profile['profileId']==PROFILE
    assert profile['source']['commit']=='66e167e40c3440929ec016f3872aefc3486434c1'
    assert profile['source']['gitBlobSha1']==BLOB_SHA
    assert profile['fullCaller']=={'start':'00582BE0','endExclusive':'00582F66','instructionCount':266,
        'byteLength':902,'sha256':CALLER_SHA,'implemented':False}
    leaf=profile['leaf'];assert leaf['start']=='00582CE4' and leaf['endExclusive']=='00582D31'
    assert leaf['instructionCount']==26 and leaf['byteLength']==77 and leaf['sha256']==CODE_SHA
    assert bytes.fromhex(leaf['bytesHex'])==listing.code and leaf['containsCalls'] is False
    assert leaf['excludedRollCall']=='00582D31' and leaf['excludedRollTarget']=='004721D0'
    assert leaf['rollHelperExecuted'] is False
    evidence=profile['evidence'];assert evidence['level']=='source-listing-reconstruction'
    assert evidence['profile']==PROFILE and evidence['listedBytesVerified'] is True
    assert all(evidence[key] is False for key in FALSE_EVIDENCE)
    arithmetic=profile['arithmetic'];assert arithmetic['maximumNumerator']==16322295
    assert arithmetic['minimumRollArgument']==1 and arithmetic['maximumRollArgument']==108815
    assert arithmetic['clipTo100'] is False and arithmetic['signed32ProductOverflowPossible'] is False
    assert profile['excludedContext']['twoReadsMerged'] is False
    assert profile['excludedContext']['getterAbiAssumed'] is False
    assert profile['excludedContext']['inlineModificationApplied'] is False
    license_raw=(ROOT/profile['license']['snapshot']).read_bytes()
    assert len(license_raw)==11357 and sha(license_raw)==profile['license']['sha256']==LICENSE_SHA
    assert hashlib.sha1(b'blob 11357\0'+license_raw).hexdigest()=='261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64'
    return listing


def verify_materials(manifest,contents):
    assert sha(canonical(manifest))==MANIFEST_SHA,'fixed source material manifest changed'
    assert set(contents)=={row['path'] for row in manifest['files']},'material paths changed'
    for row in manifest['files']:
        raw=contents[row['path']]
        assert len(raw)==row['bytes'] and sha(raw)==row['sha256'],('source material changed',row['path'])
    return {'materialFilesVerified':len(contents),'manifestIndependentHashVerified':True}


def must_fail(action,label):
    try:action()
    except (AssertionError,ValidationError,ValueError,UnicodeError,KeyError,TypeError):return label
    raise AssertionError('mutation survived: '+label)


def leaves(value,path=()):
    if type(value) is dict:
        for key,child in value.items():yield from leaves(child,path+(key,))
    elif type(value) is list:
        for key,child in enumerate(value):yield from leaves(child,path+(key,))
    else:yield path,value


def altered(value):
    if type(value) is bool:return not value
    if type(value) is int:return value+1
    if type(value) is str:return value+' [mutated]'
    raise AssertionError(type(value))


def mutation_checks(profile,schema,utf8,gbk):
    killed=[];schema_rejections=0;validator=Draft202012Validator(schema)
    for label,original in (('profile',profile),('schema',schema)):
        for path,value in leaves(original):
            changed=deepcopy(original);cursor=changed
            for key in path[:-1]:cursor=cursor[key]
            cursor[path[-1]]=altered(value)
            if label=='profile':
                assert not validator.is_valid(changed),('standard schema accepted mutation',path)
                schema_rejections+=1
            killed.append(must_fail(lambda:check(changed if label=='profile' else profile,
                changed if label=='schema' else schema,utf8,gbk),label+':'+'.'.join(map(str,path))))
        for key in original:
            changed=deepcopy(original);del changed[key]
            if label=='profile':assert not validator.is_valid(changed);schema_rejections+=1
            killed.append(must_fail(lambda:check(changed if label=='profile' else profile,
                changed if label=='schema' else schema,utf8,gbk),label+':missing:'+key))
        changed=deepcopy(original);changed['unknown']=True
        if label=='profile':assert not validator.is_valid(changed);schema_rejections+=1
        killed.append(must_fail(lambda:check(changed if label=='profile' else profile,
            changed if label=='schema' else schema,utf8,gbk),label+':extra'))
    text=utf8.decode();rows=list(re.finditer(ROW_PATTERN,text,re.M));assert len(rows)==266
    for match in rows:
        raw=bytes.fromhex(match[2]);changed=bytes([raw[0]^1])+raw[1:]
        mutant=text[:match.start(2)]+changed.hex(' ')+text[match.end(2):]
        killed.append(must_fail(lambda:parse_listing(mutant),'instruction-byte:'+match[1]))
    variants={
        'corrected-source-typo':text.replace('sar dl,04','sar edx,04'),
        'signed-byte-comparison':text.replace('00582CE6 - 76 02','00582CE6 - 7e 02'),
        'month-read-replaced-with-gate':text.replace('00582CF9 - 0f b6 86 69 01 00 00','00582CF9 - 0f b6 86 68 01 00 00'),
        'inline-MOD-applied':text.replace('00582D3B - 74 0a','00582D3B - eb 0a'),
        'missing-row':'\n'.join(line for line in text.splitlines() if not line.startswith('00582D12 -')),
        'row-reordered':text.replace('00582D12 -','00582D11 -'),
        'duplicated-source':text+text,
        'changed-roll-call-mnemonic':text.replace('call 004721d0','call 00472150'),
    }
    for label,mutant in variants.items():
        assert mutant!=text;killed.append(must_fail(lambda:parse_listing(mutant),label))
    for key in FALSE_EVIDENCE:
        forged=deepcopy(profile);forged['evidence'][key]=True
        coordinated={'$schema':schema['$schema'],**closed_const_schema(forged)}
        Draft202012Validator(coordinated).validate(forged)
        killed.append(must_fail(lambda:check(forged,coordinated,utf8,gbk),'coordinated-evidence:'+key))
    # Editing both serialized sources and their advertised identities still fails
    # the separately pinned checker; the self-consistent schema is insufficient.
    mutant=text.replace('sar dl,04','sar edx,04').encode();changed_gbk=mutant.decode().encode('gbk')
    forged=deepcopy(profile);forged['source'].update(utf8Bytes=len(mutant),utf8Sha256=sha(mutant),
        snapshotBytes=len(changed_gbk),snapshotSha256=sha(changed_gbk),
        gitBlobSha1=hashlib.sha1(b'blob '+str(len(changed_gbk)).encode()+b'\0'+changed_gbk).hexdigest())
    coordinated={'$schema':schema['$schema'],**closed_const_schema(forged)}
    killed.append(must_fail(lambda:check(forged,coordinated,mutant,changed_gbk),'coordinated-source-and-schema'))
    forged=deepcopy(profile);forged['evidence']['stockOriginalVerified']=0
    assert not validator.is_valid(forged),'JSON Schema confused zero and false'
    killed.append(must_fail(lambda:check(forged,schema,utf8,gbk),'zero-is-not-false'))
    for label,a,b in [('UTF8-extra-byte',utf8+b' ',gbk),('GBK-extra-byte',utf8,gbk+b' '),('GBK-invalid-byte',utf8,b'\x80'+gbk[1:])]:
        killed.append(must_fail(lambda:authenticate_source(a,b),label))
    manifest=json.loads((MATERIALS/'manifest.json').read_text())
    contents={row['path']:(ROOT/row['path']).read_bytes() for row in manifest['files']}
    for path,raw in contents.items():
        mutant=dict(contents);mutant[path]=bytes([raw[0]^1])+raw[1:]
        killed.append(must_fail(lambda:verify_materials(manifest,mutant),'material:'+path))
    argument='docs/sources/captive-escape-roll-argument/argument.bin'
    for offset in range(77):
        mutant=dict(contents);raw=bytearray(contents[argument]);raw[offset]^=1;mutant[argument]=bytes(raw)
        killed.append(must_fail(lambda:verify_materials(manifest,mutant),'arithmetic-byte:'+str(offset)))
    changed=deepcopy(manifest);changed['files'][0]['sha256']='0'*64
    killed.append(must_fail(lambda:verify_materials(changed,contents),'material-manifest'))
    return {'allRejected':True,'totalGuardRejections':len(killed),'standardsSchemaNegativeCases':schema_rejections,
        'individualInstructionMutations':266,'individualArgumentByteMutations':77,'structuralSourceMutations':len(variants),
        'coordinatedEvidenceMutations':len(FALSE_EVIDENCE),'coordinatedSourceAndSchemaMutations':1,
        'scope':'source/profile/schema/material identity guards; not TypeScript behavior-mutant kills'}


def input_schema_checks(profile):
    schema=profile['inputSchema'];Draft202012Validator.check_schema(schema);validator=Draft202012Validator(schema)
    keys=('savedBlU8','currentAlU8','lateCaptiveMonthsU8')
    assert schema=={'type':'object','additionalProperties':False,'required':['profile',*keys],
        'properties':{'profile':{'const':PROFILE},**{key:{'type':'integer','minimum':0,'maximum':255} for key in keys}}}
    base={'profile':PROFILE,**dict.fromkeys(keys,0)};good=0
    for key in keys:
        for value in range(256):validator.validate(dict(base,**{key:value}));good+=1
    bad=[None,[],True,False,0,'0',{},dict(base,profile='stock'),dict(base,profile=None),dict(base,profile=True)]
    for key in base:
        item=dict(base);del item[key];bad.append(item)
    for key in keys:
        for value in (-1,256,True,False,None,'0',0.5,[],{}):bad.append(dict(base,**{key:value}))
    for key in ('state','person','facility','earlyCaptiveMonthsU8','gateMonth','rng','seed','success','escape','probability','percentage','callback','extra'):
        bad.append(dict(base,**{key:0}))
    for case in bad:assert not validator.is_valid(case),case
    validator.validate(dict(base,savedBlU8=0.0,currentAlU8=255.0))
    script="""import fs from 'node:fs';
import {calculateCaptiveEscapeRollArgument as f} from './packages/engine/src/index.ts';
const bad=JSON.parse(fs.readFileSync(0,'utf8'));
for(const x of bad){const r=f(x);if(r.supported!==false||Object.keys(r).sort().join(',')!=='evidence,reason,supported'||typeof r.reason!=='string'||!Object.isFrozen(r)||!Object.isFrozen(r.evidence))throw Error('malformed rejection');}
process.stdout.write(String(bad.length));"""
    result=subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,input=json.dumps(bad),text=True,capture_output=True,check=True)
    assert int(result.stdout)==len(bad)
    return {'validJsonShapes':good,'invalidJsonShapes':len(bad),'actualTypeScriptRejections':len(bad),
        'numericSemantics':'integral JSON numbers accepted; no boolean/string coercion or byte truncation'}


def check_cli():
    command=[sys.executable,str(ROOT/'scripts/oracle_captive_escape_roll_argument.py')]
    count=0
    for args in (['--unknown'],['--output'],['--exhaustive=false'],['--profile','stock'],['{}']):
        result=subprocess.run(command+args,cwd=ROOT,text=True,capture_output=True)
        assert result.returncode!=0 and not result.stdout,args;count+=1
    with tempfile.TemporaryDirectory(prefix='captive-escape-cli-') as directory:
        output=Path(directory)/'report.json'
        result=subprocess.run(command+['--output',str(output)],cwd=ROOT,text=True,capture_output=True,check=True)
        assert output.read_text()==result.stdout
        report=json.loads(result.stdout)
        assert report['mode']=='factorized-byte-domain-and-bounded-public-api-probes'
        assert report['comparisons']['actualPublicTypeScriptComparisons']==131128
        assert report['coverage']['everyScalarTupleExecutedAsFullByteSegment'] is False
    return {'outputFileMatchesStdout':True,'defaultCoverageVerified':True,'malformedArgumentCasesRejected':count}


def main():
    assert len(sys.argv)==1,'checker accepts no arguments'
    profile=json.loads(PROFILE_FILE.read_text());schema=json.loads(SCHEMA_FILE.read_text())
    utf8=SOURCE.read_bytes();gbk=GBK_FILE.read_bytes();listing=check(profile,schema,utf8,gbk)
    manifest=json.loads((MATERIALS/'manifest.json').read_text())
    contents={row['path']:(ROOT/row['path']).read_bytes() for row in manifest['files']}
    load_listing()
    pairs,suffixes,coverage=verify_factorization(listing)
    report={'profile':PROFILE,'sourceAndClosedSchemaVerified':True,'source':independently_disassemble(listing),
        'materials':verify_materials(manifest,contents),'sourceSchemaGuards':mutation_checks(profile,schema,utf8,gbk),
        'inputSchema':input_schema_checks(profile),'byteOracleCoverage':coverage,
        'publicApiComparisons':compare_api(listing,pairs,suffixes),'cli':check_cli(),
        'stockOriginalVerified':False,'originalExecutableExecuted':False,'rngExecuted':False,
        'fullCallerImplemented':False,'completeEscapeMechanism':False}
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
