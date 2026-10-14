#!/usr/bin/env python3
"""Strict full-U32 return-tail API, closed schemas, and pinned listing material checks.

Only the post-city-callee leaf is projected. Identity of both full listings does
not certify execution of their caller gates, helpers or invalid-return paths.
"""
from __future__ import annotations
import argparse
from copy import deepcopy
import hashlib
import json
import math
from pathlib import Path
import re
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
PROFILE = 'base-income-return-tail-u32-v1'
PROFILE_FILE = ROOT / 'docs/sources/base-income-return-tail.json'
SCHEMA_FILE = ROOT / 'docs/sources/base-income-return-tail.schema.json'
MATERIALS = ROOT / 'docs/sources/base-income-return-tail'
PROFILE_SHA = 'eda029f4ee948b0bc83897dea5d0f83cb090d1c2dac8523d1e2d8c5bac273e0b'
SCHEMA_SHA = 'e2ff288ac5876661efb503d3156c46a08ad82ee84ac67a3938bd07ea0ea85253'
MANIFEST_SHA = '852ed39457333490bce9da1ac69028da311b6dbfc1a3d44b9c74776789f62ce4'
ARITHMETIC_SHA = '210bfcc2907afd3465d210652b2c022adaa8c4c92f9baf58fd2fd80b6c6eb88f'
LEAF_SHA = '44b235c89055a513a0a795bd6903e1cc61360e3599f981467b5ef59b22d03d2c'
PINS = {
 'money': (0x49E770,4551,'a1a7af12cc4c7b5f612b1db45d16623a92d9c17e3957358f9d9dcd09d1408d0b','fee219ac9a482d3a3cb4d8bdc489b98b10836944',4754,'c826c7f68b087832e9c94ea6253c7a4a2ae6e928ffc4d1bcb037c5a300d8d91f','429f5a7ff2efb81829926d2e5375051e8bdfc8021eda2b6e13c48231f696a9c0'),
 'food': (0x49EA30,4552,'0b401a880b6b60df70f5f2989c78bd9a1a4f44c32b5caa96b631dd3a4617c589','2c44d123cab43fc8577ebbaa640d811dc5fc1e64',4755,'64dec6ff6ac7f9179fa43cade5ac893f41cbd418f03161f4bb8a92a3c10de9c3','c578ba45587bf55af84eded966ff2b6909ab6afd77bfb0e511cdddbfeed0eb1c')}
EVIDENCE = {'level':'source-listing-reconstruction','profile':PROFILE,'source':'docs/sources/base-income-return-tail.json','fullListingIdentityVerified':True,'fullCallerExecuted':False,'originalExecutableExecuted':False,'stockOriginalVerified':False,'vanillaVerified':False,'nativeHelpersReconstructed':False,'abiVerified':False,'gameReachabilityVerified':False,'entryGatesIntegrated':False,'cityCalculatorCalled':False,'lateTypeObservationRequired':True,'incomeWriterIntegrated':False,'monthlySchedulerIntegrated':False,'rngIntegrated':False,'modBehaviorIncluded':False}

def sha(raw): return hashlib.sha256(raw).hexdigest()
def canonical(value): return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
def _reject(reason): return {'supported':False,'reason':reason,'evidence':deepcopy(EVIDENCE)}
def _u32(value):
    return type(value) in (int,float) and (type(value)is int or math.isfinite(value) and value.is_integer()) and 0 <= value <= 0xFFFFFFFF

def calculate_base_income_return_tail(value):
    """Return a fresh JSON receipt, normalizing integral JSON numbers to int."""
    if type(value)is not dict: return _reject('invalid-input')
    required={'profile','resource','cityCalculatorReturnU32','lateFacilityTypeU32'}
    if any(type(key)is not str or key not in required for key in value): return _reject('unexpected-field')
    if set(value)!=required: return _reject('invalid-input')
    if type(value['profile'])is not str or value['profile']!=PROFILE: return _reject('unsupported-profile')
    if type(value['resource'])is not str or value['resource']not in ('money','food'): return _reject('unsupported-resource')
    if not _u32(value['cityCalculatorReturnU32']) or not _u32(value['lateFacilityTypeU32']): return _reject('invalid-input')
    raw,kind=int(value['cityCalculatorReturnU32']),int(value['lateFacilityTypeU32'])
    n=raw if raw<2**31 else raw-2**32
    division=None
    if kind!=0:
        product=n*0x66666667; high=product>>32; sar=high>>1
        division={'multiplierU32':0x66666667,'productSignedDecimal':str(product),'productLowU32':product&0xFFFFFFFF,'productHighSigned':high,'sarHighSigned':sar,'correctionU32':(sar&0xFFFFFFFF)>>31}
    result=((-((-n)//5)) if n<0 else n//5) if kind!=0 else n
    return {'supported':True,'profile':PROFILE,'resource':value['resource'],'cityCalculatorReturnU32':raw,'cityCalculatorReturnSigned':n,'lateFacilityTypeU32':kind,'branch':'signed-divide-by-five'if kind!=0 else'copy','division':division,'returnedIncomeSigned':result,'returnedIncomeU32':result&0xFFFFFFFF,'evidence':deepcopy(EVIDENCE)}

def authenticate_source(resource,utf8,gbk):
    start,gbk_len,gbk_sha,blob,utf8_len,utf8_sha,body_sha=PINS[resource]
    assert len(gbk)==gbk_len and sha(gbk)==gbk_sha,'GBK identity'
    assert hashlib.sha1(b'blob '+str(gbk_len).encode()+b'\0'+gbk).hexdigest()==blob,'Git blob identity'
    assert len(utf8)==utf8_len and sha(utf8)==utf8_sha,'UTF8 identity'
    text=utf8.decode('utf-8');assert text.encode('gbk')==gbk and gbk.decode('gbk')==text,'lossless connector decode'
    rows=[(int(a,16),bytes.fromhex(b))for a,b in re.findall(r'^([0-9A-F]{8}) - ([0-9a-f]{2}(?: [0-9a-f]{2})*)\s+- ',text,re.M)]
    assert len(rows)==len(re.findall(r'^[0-9A-F]{8} -',text,re.M))==66
    cursor=start
    for addr,op in rows: assert addr==cursor,'listing gap/overlap';cursor+=len(op)
    body=b''.join(op for _,op in rows)
    assert cursor==start+149 and len(body)==149 and sha(body)==body_sha
    assert sha(body[101:126])==ARITHMETIC_SHA and sha(body[101:134])==LEAF_SHA
    assert len([a for a,_ in rows if start+101<=a<start+126])==10
    assert len([a for a,_ in rows if start+101<=a<start+134])==15
    assert '【修改】' in text.splitlines()[44] and body[91:93]==bytes.fromhex('7529')
    return rows,body

def check(profile,schema):
    assert sha(canonical(profile))==PROFILE_SHA,'profile pin'
    assert sha(canonical(schema))==SCHEMA_SHA,'schema pin'
    Draft202012Validator.check_schema(schema);Draft202012Validator(schema).validate(profile)
    for key in ('inputSchema','resultSchema'):Draft202012Validator.check_schema(profile[key])
    assert profile['evidence']==EVIDENCE

def verify_materials(manifest,contents):
    assert sha(canonical(manifest))==MANIFEST_SHA,'material manifest pin'
    assert set(contents)=={row['path']for row in manifest['files']}
    for row in manifest['files']:
        raw=contents[row['path']];assert len(raw)==row['bytes'] and sha(raw)==row['sha256'],row['path']

def check_all_sources():
    profile=json.loads(PROFILE_FILE.read_text());schema=json.loads(SCHEMA_FILE.read_text());check(profile,schema)
    manifest=json.loads((MATERIALS/'source-manifest.json').read_text())
    verify_materials(manifest,{row['path']:(ROOT/row['path']).read_bytes()for row in manifest['files']})
    for resource in PINS:
        prefix=ROOT/f'docs/sources/base-income-return-tail-{resource}-original'
        rows,body=authenticate_source(resource,prefix.with_suffix('.txt').read_bytes(),prefix.with_suffix('.gbk').read_bytes())
        assert (MATERIALS/f'{resource}-full-listing.bin').read_bytes()==body
        assert (MATERIALS/f'{resource}-return-tail.bin').read_bytes()==body[101:134]
        assert json.loads((MATERIALS/f'{resource}-listing.json').read_text())==[{'address':f'{a:08X}','hex':b.hex()}for a,b in rows]
    license_raw=(ROOT/profile['license']['snapshot']).read_bytes()
    assert len(license_raw)==11357 and sha(license_raw)=='c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
    assert hashlib.sha1(b'blob 11357\0'+license_raw).hexdigest()=='261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64'
    return {'profile':PROFILE,'sourceAndClosedSchemaVerified':True,'resources':['money','food'],'materialFilesVerified':len(manifest['files']),'fullListingInstructionsEach':66,'fullListingBytesEach':149,'arithmeticInstructionsEach':10,'arithmeticBytesEach':25,'leafInstructionsEach':15,'leafBytesEach':33,'losslessGbkAndGitBlobVerified':True,'fullCallerExecuted':False,'originalExecutableExecuted':False,'inlineModExcluded':True}

def _unique_object(pairs):
    result={}
    for key,value in pairs:
        if key in result:raise ValueError('duplicate JSON key')
        result[key]=value
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__,allow_abbrev=False)
    parser.add_argument('--input',type=Path);parser.add_argument('--output',type=Path);args=parser.parse_args()
    report=check_all_sources()
    if args.input is not None:
        try: value=json.loads(args.input.read_text(),object_pairs_hook=_unique_object,parse_constant=lambda text:(_ for _ in()).throw(ValueError('non-JSON number')))
        except (ValueError,UnicodeError):report=_reject('invalid-input')
        else:report=calculate_base_income_return_tail(value)
    output=json.dumps(report,ensure_ascii=False,indent=2,allow_nan=False)+'\n'
    if args.output is not None:args.output.write_text(output)
    print(output,end='')
if __name__=='__main__':main()
