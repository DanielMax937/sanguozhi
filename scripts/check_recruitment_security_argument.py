#!/usr/bin/env python3
"""Fail-closed source/profile/schema checks for the security-argument leaf.

The fixed hashes are public-listing identities, never stock executable proof.
Standards JSON Schema validation is tested separately from canonical hash guards.
Coordinated profile/schema/source alterations cannot self-authorize stronger claims.
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
from oracle_recruitment_security_argument import (ROOT,SOURCE,PROFILE,UTF8_SHA,GBK_SHA,BLOB_SHA,
    CODE_SHA,LEAF_SHA,ARITHMETIC_SHA,MOD_MARKER,MOD_REGIONS,ROW_PATTERN,LEAF_ENTRY,LEAF_END,
    parse_listing,load_listing,independently_disassemble,make_case,cases,compare_results,
    check_examples,check_byte_profile_guards)

PROFILE_FILE=ROOT/'docs/sources/recruitment-security-argument.json'
SCHEMA_FILE=ROOT/'docs/sources/recruitment-security-argument.schema.json'
GBK_FILE=ROOT/'docs/sources/recruitment-security-argument-original.gbk'
PROFILE_SHA='b6778ef00208ab01dab6678d44c005068bfb23dd1a6526fd855b2ca66acab046'
SCHEMA_SHA='9b5b9028c47e49b424a7ed7ac7c2b6010056b9eeb799a8d17a5e0815b3455e4e'
LICENSE_SHA='c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
_SCHEMA_VALIDATORS={}
FALSE_EVIDENCE=('stockOriginalVerified','originalExecutableExecuted','nativeHelpersReconstructed',
    'abiVerified','realTraceReachabilityVerified','troopWriterRecovered','securityWriterRecovered',
    'commandIntegrated','modLawExemptionIncluded')


def canonical(value):return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
def sha(raw):return hashlib.sha256(raw).hexdigest()


def closed_const_schema(value):
    if type(value) is dict:
        return {'type':'object','additionalProperties':False,'required':list(value),
            'properties':{key:closed_const_schema(child) for key,child in value.items()}}
    kinds={str:'string',int:'integer',bool:'boolean',list:'array'}
    assert type(value) in kinds,type(value)
    return {'type':kinds[type(value)],'const':value}


def authenticate_source(utf8,gbk_snapshot):
    assert len(utf8)==23221 and sha(utf8)==UTF8_SHA,'full UTF-8 source changed'
    text=utf8.decode('utf-8');gbk=text.encode('gbk')
    assert len(gbk)==22263 and sha(gbk)==GBK_SHA,'full GBK source changed'
    assert hashlib.sha1(b'blob 22263\0'+gbk).hexdigest()==BLOB_SHA
    assert gbk.decode('gbk').encode('utf-8')==utf8
    assert gbk==gbk_snapshot,'GBK snapshot differs from reversible UTF-8 reconstruction'
    return parse_listing(text)


def check(profile,schema,utf8,gbk):
    assert sha(canonical(profile))==PROFILE_SHA,'independently pinned metadata changed'
    assert sha(canonical(schema))==SCHEMA_SHA,'independently pinned schema changed'
    expected={'$schema':'https://json-schema.org/draft/2020-12/schema',**closed_const_schema(profile)}
    assert schema==expected,'metadata schema is not recursively closed and typed'
    digest=sha(canonical(schema))
    if digest not in _SCHEMA_VALIDATORS:
        Draft202012Validator.check_schema(schema);_SCHEMA_VALIDATORS[digest]=Draft202012Validator(schema)
    _SCHEMA_VALIDATORS[digest].validate(profile)
    listing=authenticate_source(utf8,gbk)
    assert profile['profileId']==PROFILE
    assert profile['source']['gitBlobSha1']==BLOB_SHA
    assert profile['source']['snapshotSha256']==GBK_SHA and profile['source']['utf8Sha256']==UTF8_SHA
    assert profile['source']['snapshotBytes']==22263 and profile['source']['utf8Bytes']==23221
    assert profile['source']['commit']=='66e167e40c3440929ec016f3872aefc3486434c1'
    assert profile['fullCaller']=={'start':'005C3A50','endExclusive':'005C3E0B','instructionCount':316,
        'byteLength':955,'sha256':CODE_SHA,'directCallSites':51,'indirectCallSites':1,'directBranches':16,'implemented':False}
    leaf=profile['leaf'];assert leaf['start']=='005C3C11' and leaf['endExclusive']=='005C3C24'
    assert leaf['instructionCount']==7 and leaf['byteLength']==19 and leaf['sha256']==ARITHMETIC_SHA
    assert leaf['argumentEndExclusive']=='005C3C26' and leaf['argumentInstructionCount']==9
    assert leaf['argumentByteLength']==21 and leaf['argumentSha256']==LEAF_SHA
    assert leaf['excludedWriterCall']=='005C3C26' and leaf['excludedWriterTarget']=='004B3E70' and leaf['writerExecuted'] is False
    assert bytes.fromhex(leaf['bytesHex'])==b''.join(i.raw for i in listing.code.values())[:19]
    evidence=profile['evidence'];assert evidence['level']=='source-listing-reconstruction'
    assert evidence['profile']==PROFILE and evidence['listedBytesVerified'] is True
    assert all(evidence[key] is False for key in FALSE_EVIDENCE)
    mod=profile['excludedMod'];assert mod['instructionCount']==16 and mod['byteLength']==48
    assert mod['contiguous'] is False and mod['executedByProduction'] is False
    assert mod['ranges']==[{'start':f'{lo:08X}','endExclusive':f'{hi:08X}','instructions':count,'bytes':size}
        for lo,hi,count,size,_ in MOD_REGIONS]
    arithmetic=profile['arithmetic']
    assert [arithmetic[k] for k in ('divisorMin','divisorMax','quotientMin','quotientMax','deltaMin','deltaMax')]==[100,865,-21474836,21474836,-21474836,21474836]
    assert all(arithmetic[key] is False for key in ('zeroDivisorPossible','idivOverflowPossible','negOverflowPossible'))
    license_raw=(ROOT/profile['license']['snapshot']).read_bytes()
    assert len(license_raw)==11357 and sha(license_raw)==profile['license']['sha256']==LICENSE_SHA
    assert hashlib.sha1(b'blob 11357\0'+license_raw).hexdigest()=='261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64'
    return listing


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
    killed=[];validator=Draft202012Validator(schema);schema_rejections=0
    for label,original in (('profile',profile),('schema',schema)):
        for path,value in leaves(original):
            changed=deepcopy(original);cursor=changed
            for key in path[:-1]:cursor=cursor[key]
            cursor[path[-1]]=altered(value)
            if label=='profile':
                # Exercise the real standards validator independently of hashes.
                validator.validate(profile)
                assert not validator.is_valid(changed),('schema accepted changed profile',path)
                schema_rejections+=1
            check(profile,schema,utf8,gbk)
            killed.append(must_fail(lambda:check(changed if label=='profile' else profile,
                changed if label=='schema' else schema,utf8,gbk),label+':'+'.'.join(map(str,path))))
        for key in original:
            changed=deepcopy(original);del changed[key]
            if label=='profile':assert not validator.is_valid(changed);schema_rejections+=1
            check(profile,schema,utf8,gbk)
            killed.append(must_fail(lambda:check(changed if label=='profile' else profile,
                changed if label=='schema' else schema,utf8,gbk),label+':missing:'+key))
        changed=deepcopy(original);changed['unknown']=True
        if label=='profile':assert not validator.is_valid(changed);schema_rejections+=1
        killed.append(must_fail(lambda:check(changed if label=='profile' else profile,
            changed if label=='schema' else schema,utf8,gbk),label+':extra'))
    text=utf8.decode();rows=list(re.finditer(ROW_PATTERN,text,re.M));assert len(rows)==332
    for match in rows:
        raw=bytes.fromhex(match[2]);changed=bytes([raw[0]^1])+raw[1:]
        mutant=text[:match.start(2)]+changed.hex(' ')+' '+text[match.end(2):]
        parse_listing(text)
        killed.append(must_fail(lambda:parse_listing(mutant),'listing-byte:'+match[1]))
    original,mod=text.split(MOD_MARKER)
    variants={
        'changed-MOD-boundary':text.replace(MOD_MARKER,'MOD boundary missing'),
        'missing-original-instruction':'\n'.join(line for line in text.splitlines() if not line.startswith('005C3C1A -')),
        'original-instruction-gap':text.replace('005C3C15 -','005C3C16 -'),
        'corrected-source-typo':text.replace('sar dl,05','sar edx,05'),
        'changed-callee-mnemonic':text.replace('call 004ae3c0','call 005c3610'),
        'changed-IDIV-mnemonic':text.replace('idiv ecx','div ecx'),
        'MOD-overlay':text.replace('005C3C1D - b9 5c 89 99 07','005C3C1D - e9 a8 cb 34 00'),
        'duplicate-original':original+original+MOD_MARKER+mod,
        'reordered-MOD-regions':original+MOD_MARKER+'\n'+'\n'.join(reversed(mod.splitlines())),
        'writer-in-leaf-range':text.replace('005C3C26 -','005C3C25 -'),
    }
    for label,mutant in variants.items():
        assert mutant!=text;parse_listing(text)
        killed.append(must_fail(lambda:parse_listing(mutant),label))
    for key in FALSE_EVIDENCE:
        forged=deepcopy(profile);forged['evidence'][key]=True
        coordinated={'$schema':schema['$schema'],**closed_const_schema(forged)}
        Draft202012Validator(coordinated).validate(forged)
        killed.append(must_fail(lambda:check(forged,coordinated,utf8,gbk),'coordinated-evidence:'+key))
    # Both source file representations and the metadata/schema agree with a lie;
    # fixed public-source identity must still reject it.
    mutant=text.replace('sar dl,05','sar edx,05').encode();changed_gbk=mutant.decode().encode('gbk')
    forged=deepcopy(profile);forged['source'].update(utf8Bytes=len(mutant),utf8Sha256=sha(mutant),
        snapshotBytes=len(changed_gbk),snapshotSha256=sha(changed_gbk),
        gitBlobSha1=hashlib.sha1(b'blob '+str(len(changed_gbk)).encode()+b'\0'+changed_gbk).hexdigest())
    coordinated={'$schema':schema['$schema'],**closed_const_schema(forged)}
    killed.append(must_fail(lambda:check(forged,coordinated,mutant,changed_gbk),'coordinated-source-and-schema'))
    forged=deepcopy(profile);forged['evidence']['stockOriginalVerified']=0
    assert not validator.is_valid(forged),'JSON Schema confused 0 with false'
    killed.append(must_fail(lambda:check(forged,schema,utf8,gbk),'zero-is-not-false'))
    for label,a,b in [('UTF8-extra-byte',utf8+b' ',gbk),('GBK-extra-byte',utf8,gbk+b' '),('GBK-invalid-byte',utf8,b'\x80'+gbk[1:])]:
        killed.append(must_fail(lambda:authenticate_source(a,b),label))
    return {'totalGuardsRejected':len(killed),'allRejected':True,'standardsSchemaNegativeCases':schema_rejections,
        'individualInstructionByteMutations':len(rows),'structuralListingMutations':len(variants),
        'coordinatedEvidenceMutations':len(FALSE_EVIDENCE),'coordinatedSourceAndSchemaMutations':1,
        'scope':'source/profile/schema guards; not TypeScript behavior mutant kills'}


def input_schema_checks(profile):
    schema=profile['inputSchema'];Draft202012Validator.check_schema(schema);validator=Draft202012Validator(schema)
    assert schema=={'type':'object','additionalProperties':False,
        'required':['profile','savedCharmSum','savedTroopReturnU32'],
        'properties':{'profile':{'const':PROFILE},'savedCharmSum':{'type':'integer','minimum':0,'maximum':765},
            'savedTroopReturnU32':{'type':'integer','minimum':0,'maximum':4294967295}}}
    good=[]
    for c in range(766):
        for u in (0,1,c+99,c+100,0x7FFFFFFF,0x80000000,0xFFFFFF9B,0xFFFFFFFF):
            case=make_case(c,u);validator.validate(case);good.append(case)
    base=make_case(300,4200)
    bad=[None,[],True,False,0,'0',{},dict(base,profile='stock'),dict(base,profile=None),dict(base,profile=True)]
    for key in base:
        item=dict(base);del item[key];bad.append(item)
    for key,hi in [('savedCharmSum',765),('savedTroopReturnU32',4294967295)]:
        for value in (-1,hi+1,True,False,None,'0',0.5,[],{}):bad.append(dict(base,**{key:value}))
    for key in ('state','city','currentSecurity','quantity','quantityCharmSum','actualAdded','actualSecurityLoss','lawSkill','skill','callback','extra'):
        bad.append(dict(base,**{key:0}))
    for case in bad:assert not validator.is_valid(case),case
    # Integral-valued JSON numbers have no int/float storage distinction in JS.
    validator.validate(make_case(0.0,4294967295.0))
    script="""import fs from 'node:fs';
import {calculateRecruitmentSecurityArgument as f} from './packages/engine/src/index.ts';
const bad=JSON.parse(fs.readFileSync(0,'utf8'));
for(const x of bad){const r=f(x);if(r.supported!==false||Object.keys(r).sort().join(',')!=='evidence,reason,supported'||typeof r.reason!=='string'||!Object.isFrozen(r)||!Object.isFrozen(r.evidence))throw Error('malformed rejection');}
process.stdout.write(String(bad.length));"""
    result=subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,input=json.dumps(bad),text=True,capture_output=True,check=True)
    assert int(result.stdout)==len(bad)
    return {'validJsonShapes':len(good),'invalidJsonShapes':len(bad),'actualTypeScriptRejections':len(bad),
        'numberSemantics':'integral JSON numeric values accepted; strings, booleans, fractional and out-of-range values rejected'}


def check_cli():
    command=[sys.executable,str(ROOT/'scripts/oracle_recruitment_security_argument.py')]
    rejected=0
    for args in (['--unknown'],['--output'],['--exhaustive=false'],['--profile','stock'],['{}']):
        result=subprocess.run(command+args,cwd=ROOT,text=True,capture_output=True)
        assert result.returncode!=0 and not result.stdout,args;rejected+=1
    with tempfile.TemporaryDirectory(prefix='security-argument-cli-') as directory:
        output=Path(directory)/'report.json'
        result=subprocess.run(command+['--output',str(output)],cwd=ROOT,text=True,capture_output=True,check=True)
        assert output.read_text()==result.stdout
        report=json.loads(result.stdout)
        assert report['coverage']['mode']=='bounded-default' and report['coverage']['allUint32Inputs'] is False
        assert report['comparisons']['actualPublicTypeScriptComparisons']==48199
        assert report['comparisons']['denominatorCount']==766 and report['comparisons']['writerCallExecuted'] is False
    return {'defaultBoundedVerified':True,'outputFileMatchesStdout':True,'malformedArgumentCasesRejected':rejected}


def main():
    assert len(sys.argv)==1,'checker accepts no arguments'
    profile=json.loads(PROFILE_FILE.read_text());schema=json.loads(SCHEMA_FILE.read_text())
    utf8=SOURCE.read_bytes();gbk=GBK_FILE.read_bytes()
    listing=check(profile,schema,utf8,gbk)
    report={'profile':PROFILE,'sourceAndClosedSchemaVerified':True,'source':independently_disassemble(listing),
        'sourceSchemaGuards':mutation_checks(profile,schema,utf8,gbk),'inputSchema':input_schema_checks(profile),
        'byteProfileGuards':check_byte_profile_guards(listing),'examples':check_examples(listing),
        'byteOracleComparisons':compare_results(listing,cases()),'cli':check_cli(),
        'stockOriginalVerified':False,'originalExecutableExecuted':False,'writerExecuted':False,
        'fullCallerImplemented':False,'completeGameCommand':False}
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
