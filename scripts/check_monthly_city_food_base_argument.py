#!/usr/bin/env python3
"""Strict captured-U32 argument API and authenticated source/schema checker.

Direct Python inputs require exact built-in int. JSON transport separately
normalizes finite integral JSON numbers to int, including numeric negative zero.
No helpers, city calculation, early flag, writer, stack, or scheduler integration.
"""
from __future__ import annotations
import argparse
from copy import deepcopy
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import tempfile
from jsonschema import Draft202012Validator
ROOT=Path(__file__).resolve().parents[1]
PROFILE='monthly-city-food-base-argument-u32-v1'
NAME='monthly-city-food-base-argument'
PROFILE_FILE=ROOT/f'docs/sources/{NAME}.json'
SCHEMA_FILE=ROOT/f'docs/sources/{NAME}.schema.json'
MATERIALS=ROOT/f'docs/sources/{NAME}'
# Generated canonical pins authenticate the closed contract and every local material.
PROFILE_SHA='a41bdc8d00f1d2c6aba135ac47548239587690f35e0a38fed4dca08cdedc5c6f'
SCHEMA_SHA='8eaa9faeec788121ea495ec91a41acc88ebcc82058d8e55b365e5528b2470cd9'
MANIFEST_SHA='b33ddc5a4a0ead9cef8fc062cbbebb5f7ddc9fafafa9b0bb0410e1572f875e96'
UTF8_BYTES=46993
UTF8_SHA='825c1ff948e122fb15da6baa92c95d978b5ccd664cb0e32a1ff72d70c53a7e7b'
EVIDENCE={'level': 'source-listing-reconstruction', 'profile': 'monthly-city-food-base-argument-u32-v1', 'source': 'docs/sources/monthly-city-food-base-argument.json', 'projectTarget': 'PC-PK1.1', 'sourceEditionClaim': 'PK', 'exactSourceVersionVerified': False, 'fullListingIdentityVerified': True, 'fullCallerExecuted': False, 'originalExecutableExecuted': False, 'stockOriginalVerified': False, 'vanillaVerified': False, 'consoleVerified': False, 'nativeHelpersReconstructed': False, 'abiVerified': False, 'gameReachabilityVerified': False, 'entryEdiPreservationAssumed': False, 'earlyLevyReused': False, 'lateLevyObservationRequired': True, 'cityCalculatorCalled': False, 'baseReturnTailCalled': False, 'actualStackModified': False, 'incomeWriterIntegrated': False, 'ownerForceIntegrated': False, 'monthlySchedulerIntegrated': False, 'endTurnIntegrated': False, 'rngIntegrated': False, 'modBehaviorIncluded': False}

def sha(raw):return hashlib.sha256(raw).hexdigest()
def canonical(value):return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode()
def _reject(reason):return {'supported':False,'reason':reason,'evidence':deepcopy(EVIDENCE)}
def _u32(value):return type(value)is int and 0<=value<=0xFFFFFFFF
def _signed(n):return n if n<2**31 else n-2**32
def _half(n):return n//2 if n>=0 else -((-n)//2)

def calculate_monthly_city_food_base_argument(value):
    """Pure direct API: exact dict, exact str keys/profile, exact int U32 fields."""
    if type(value)is not dict:return _reject('invalid-input')
    required={'profile','entryFoodEdiU32','harvestPredicateEaxU32','lateLevyFlagDwordU32'}
    if any(type(key)is not str or key not in required for key in value):return _reject('unexpected-field')
    if set(value)!=required:return _reject('invalid-input')
    if type(value['profile'])is not str or value['profile']!=PROFILE:return _reject('unsupported-profile')
    if not all(_u32(value[k])for k in required-{'profile'}):return _reject('invalid-input')
    raw,h,l=(value[k]for k in ('entryFoodEdiU32','harvestPredicateEaxU32','lateLevyFlagDwordU32'))
    harvest=h!=0;levy=l!=0;triple=None;post=raw;trace=['005905E0','005905E2']
    if harvest:
        unwrapped=raw*3;low=unwrapped&0xFFFFFFFF;triple={'unwrappedU64':unwrapped,'lowU32':low,'signed':_signed(low)}
        post=_half(_signed(low))&0xFFFFFFFF;trace+=['005905E4','005905E7','005905E8','005905EA','005905EC']
    trace+=['005905EE','005905F5','005905F7'];n=_signed(post);result=_half(n)if levy else n
    if levy:trace+=['005905F9','005905FB','005905FC','005905FE','00590600']
    trace+=['00590602']
    return {'supported':True,'profile':PROFILE,'entryFoodEdiU32':raw,'entryFoodEdiSigned':_signed(raw),'harvestPredicateEaxU32':h,'lateLevyFlagDwordU32':l,'harvestApplied':harvest,'levyApplied':levy,'harvestTriple':triple,'postHarvestU32':post,'postHarvestSigned':n,'lateLevyRead':{'address':'005905EE','widthBits':32,'count':1},'executedAddresses':trace,'instructionCount':len(trace),'pushAddress':'00590602','continuationAddress':'00590603','pushedArgumentU32':result&0xFFFFFFFF,'pushedArgumentSigned':result,'evidence':deepcopy(EVIDENCE)}

def authenticate_source(utf8,gbk):
    assert len(gbk)==44283 and sha(gbk)=='24c1f4c75185a3aef07aac7f493400bb778f2f071bf4fd8ef3d905457d43d617','GBK identity'
    assert hashlib.sha1(b'blob 44283\0'+gbk).hexdigest()=='028fae66ba44f70716951edd9fae51420780cea0','Git blob identity'
    assert len(utf8)==UTF8_BYTES and sha(utf8)==UTF8_SHA,'UTF8 identity'
    text=utf8.decode('utf-8');assert text.encode('gbk')==gbk and gbk.decode('gbk')==text,'lossless encoding'
    original,modified=text.split('修改1',1);assert modified.startswith(' - 兵临城下无收入')
    rows=[(int(a,16),bytes.fromhex(b))for a,b in re.findall(r'^([0-9A-F]{8}) - ([0-9a-f]{2}(?: [0-9a-f]{2})*)\s+- ',original,re.M)]
    assert len(rows)==len(re.findall(r'^[0-9A-F]{8} -',original,re.M))==572
    cursor=0x590490
    for address,op in rows:assert address==cursor,'listing gap or overlap';cursor+=len(op)
    body=b''.join(op for _,op in rows);assert cursor==0x590C23 and len(body)==1939 and sha(body)=='e65552b27524fcce9e95e2b3a48a9117a185cd27ad3362cfe0e47dbb9c9ee88b'
    leaf=[(a,b)for a,b in rows if 0x5905E0<=a<0x590603];code=b''.join(b for _,b in leaf)
    assert len(leaf)==16 and len(code)==35 and sha(code)=='5c6d98631284c667856b19e2319830b143ed291d9ca2e72e3b25d4dafe91749c'
    assert code.hex()=='85c0740a8d047f992bc2d1f88bf88b8424b801000085c074098bc7992bc2d1f88bf857'
    return rows,body,leaf,code

def independent_disassembly(rows,body):
    with tempfile.TemporaryDirectory(prefix='monthly-food-decode-')as directory:
        p=Path(directory)/'full-listing.bin';p.write_bytes(body)
        out=subprocess.run(['objdump','-D','-b','binary','-m','i386','-M','intel','--insn-width=16','--adjust-vma=0x590490',str(p)],text=True,capture_output=True,check=True).stdout
    decoded=[]
    for line in out.splitlines():
        m=re.match(r'^\s*([0-9a-f]+):\s*((?:[0-9a-f]{2}\s+)+)\s*(.*)$',line)
        if m:decoded.append((int(m[1],16),bytes.fromhex(m[2]),m[3]))
    assert [(a,b)for a,b,_ in decoded]==rows,'independent instruction widths'
    by={a:s for a,_,s in decoded}
    expected={0x5905e0:r'test\s+eax,eax',0x5905e2:r'je\s+0x5905ee',0x5905e4:r'lea\s+eax,\[edi\+edi\*2\]',0x5905e7:r'cdq',0x5905e8:r'sub\s+eax,edx',0x5905ea:r'sar\s+eax,1',0x5905ec:r'mov\s+edi,eax',0x5905ee:r'mov\s+eax,DWORD PTR \[esp\+0x1b8\]',0x5905f5:r'test\s+eax,eax',0x5905f7:r'je\s+0x590602',0x5905f9:r'mov\s+eax,edi',0x5905fb:r'cdq',0x5905fc:r'sub\s+eax,edx',0x5905fe:r'sar\s+eax,1',0x590600:r'mov\s+edi,eax',0x590602:r'push\s+edi'}
    for address,pattern in expected.items():assert re.fullmatch(pattern,by[address]),(hex(address),by[address])
    return {'decoder':'GNU objdump','fullListingInstructions':572,'fullListingBytes':1939,'leafInstructions':16,'leafBytes':35,'allBoundariesAndLeafInstructionsMatch':True}

def check(profile,schema):
    assert sha(canonical(profile))==PROFILE_SHA,'profile pin'
    assert sha(canonical(schema))==SCHEMA_SHA,'schema pin'
    Draft202012Validator.check_schema(schema);Draft202012Validator(schema).validate(profile)
    for key in ('inputSchema','resultSchema'):Draft202012Validator.check_schema(profile[key])
    assert profile['evidence']==EVIDENCE

def verify_materials(manifest,contents):
    assert sha(canonical(manifest))==MANIFEST_SHA,'manifest pin'
    assert set(contents)=={row['path']for row in manifest['files']}
    for row in manifest['files']:
        data=contents[row['path']];assert len(data)==row['bytes'] and sha(data)==row['sha256'],row['path']

def check_all_sources():
    profile=json.loads(PROFILE_FILE.read_text());schema=json.loads(SCHEMA_FILE.read_text());check(profile,schema)
    manifest=json.loads((MATERIALS/'source-manifest.json').read_text());verify_materials(manifest,{r['path']:(ROOT/r['path']).read_bytes()for r in manifest['files']})
    prefix=ROOT/f'docs/sources/{NAME}-original';rows,body,leaf,code=authenticate_source(prefix.with_suffix('.txt').read_bytes(),prefix.with_suffix('.gbk').read_bytes())
    assert (MATERIALS/'full-listing.bin').read_bytes()==body and (MATERIALS/'leaf.bin').read_bytes()==code
    for name,data in [('full-listing',rows),('leaf-listing',leaf)]:assert json.loads((MATERIALS/f'{name}.json').read_text())==[{'address':f'{a:08X}','hex':b.hex()}for a,b in data]
    raw=(ROOT/profile['license']['snapshot']).read_bytes();assert len(raw)==11357 and sha(raw)=='c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4';assert hashlib.sha1(b'blob 11357\0'+raw).hexdigest()=='261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64'
    return {'profile':PROFILE,'sourceAndClosedSchemaVerified':True,'materialFilesVerified':len(manifest['files']),'losslessGbkAndGitBlobVerified':True,'disassembly':independent_disassembly(rows,body),'fullCallerExecuted':False,'originalExecutableExecuted':False,'modSectionExcluded':True}

def _unique_object(pairs):
    result={}
    for key,value in pairs:
        if key in result:raise ValueError('duplicate JSON key')
        result[key]=value
    return result

def _json_number(text):
    number=float(text)
    if not math.isfinite(number):raise ValueError('nonfinite JSON number')
    return int(number)if number.is_integer()else number

def parse_json(text):return json.loads(text,object_pairs_hook=_unique_object,parse_float=_json_number,parse_constant=lambda text:(_ for _ in()).throw(ValueError('non-JSON constant')))

def main():
    p=argparse.ArgumentParser(description=__doc__,allow_abbrev=False);p.add_argument('--input',type=Path);p.add_argument('--output',type=Path);args=p.parse_args()
    report=check_all_sources()
    if args.input is not None:
        try:value=parse_json(args.input.read_text())
        except (ValueError,UnicodeError):report=_reject('invalid-input')
        else:report=calculate_monthly_city_food_base_argument(value)
    output=json.dumps(report,ensure_ascii=False,indent=2,allow_nan=False)+'\n'
    if args.output is not None:args.output.write_text(output)
    print(output,end='')
if __name__=='__main__':main()
