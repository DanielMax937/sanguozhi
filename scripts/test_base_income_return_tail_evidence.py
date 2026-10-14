#!/usr/bin/env python3
"""Closed API/schema, evidence mutation and CLI contract tests; not a byte oracle."""
from copy import deepcopy
import hashlib
import json
import math
from pathlib import Path
import subprocess
import tempfile
from jsonschema import Draft202012Validator, ValidationError
import check_base_income_return_tail as api

ROOT=Path(__file__).resolve().parents[1]
def base(**extra):return {'profile':api.PROFILE,'resource':'money','cityCalculatorReturnU32':0,'lateFacilityTypeU32':0}|extra
def exact(a,b):
    if type(a)is not type(b):return False
    if type(a)is dict:return a.keys()==b.keys()and all(exact(a[k],b[k])for k in a)
    if type(a)is list:return len(a)==len(b)and all(exact(x,y)for x,y in zip(a,b))
    return a==b

def contract_cases():
    good=[base(cityCalculatorReturnU32=-0.0,lateFacilityTypeU32=-0.0),base(cityCalculatorReturnU32=10.0,lateFacilityTypeU32=1.0)]
    for r in ('money','food'):
        for n in (0,1,4,5,6,9,10,11,0x7FFFFFFF,0x80000000,0xFFFFFFF6,0xFFFFFFFA,0xFFFFFFFC,0xFFFFFFFF):
            for t in (0,1,2,255,256,65535,65536,0x80000000,0xFFFFFFFF):good.append(base(resource=r,cityCalculatorReturnU32=n,lateFacilityTypeU32=t))
    bad=[]
    def add(value,reason='invalid-input'):bad.append((value,reason))
    for v in (None,[],True,42,'x'):add(v)
    for k in base():
        v=base();del v[k];add(v)
    for k in ('state','owner','force','cityIncome','cachedFacilityType','rng','writer','__proto__'):add(base(**{k:0}),'unexpected-field')
    for v in ('stock',1,None,True):add(base(profile=v),'unsupported-profile')
    for v in ('gold','port',1,None,True):add(base(resource=v),'unsupported-resource')
    for k in ('cityCalculatorReturnU32','lateFacilityTypeU32'):
        for v in (-1,2**32,0.5,True,'1',None):add(base(**{k:v}))
    return good,bad

def json_contracts(profile):
    ins=Draft202012Validator(profile['inputSchema']);outs=Draft202012Validator(profile['resultSchema']);good,bad=contract_cases();values=good+[x for x,_ in bad]
    run=subprocess.run(['node',str(ROOT/'scripts/oracle_base_income_return_tail_driver.mjs')],input=''.join(json.dumps(x)+'\n'for x in values),text=True,capture_output=True,check=True)
    ts=[json.loads(line)for line in run.stdout.splitlines()];assert len(ts)==len(values)
    for index,value in enumerate(values):
        py=api.calculate_base_income_return_tail(value);outs.validate(py);outs.validate(ts[index]);assert exact(py,ts[index])
        if index<len(good):ins.validate(value);assert py['supported']is True
        else:
            assert not ins.is_valid(value)
            assert exact(py,{'supported':False,'reason':bad[index-len(good)][1],'evidence':api.EVIDENCE})
    # Every nested integer in a representative receipt rejects a boolean, and
    # every boolean rejects integer 0/1. Unknown and missing fields reject too.
    negatives=0
    representatives=[api.calculate_base_income_return_tail(base()),api.calculate_base_income_return_tail(base(cityCalculatorReturnU32=0xFFFFFFFA,lateFacilityTypeU32=1)),api._reject('invalid-input')]
    def visit(root,value,path):
        nonlocal negatives
        if type(value)is dict:
            for k,v in value.items():visit(root,v,path+[k])
            for operation in ('extra','missing'):
                candidate=deepcopy(root);target=candidate
                for key in path:target=target[key]
                if operation=='extra':target['unknown']=0
                else:del target[next(iter(target))]
                assert not outs.is_valid(candidate),(path,operation);negatives+=1
        elif type(value)in(int,bool):
            candidate=deepcopy(root);target=candidate
            for key in path[:-1]:target=target[key]
            target[path[-1]]=bool(value)if type(value)is int else int(value)
            assert not outs.is_valid(candidate),path;negatives+=1
    for r in representatives:visit(r,r,[])
    for malformed in ('0\n','1\n','-1\n','01','-0','+1','1.0',' 1','1 ','','NaN'):
        r=deepcopy(representatives[1]);r['division']['productSignedDecimal']=malformed;assert not outs.is_valid(r),malformed;negatives+=1
    for mutate in (lambda x:x.update(branch='copy'),lambda x:x.update(division=None),lambda x:x.update(lateFacilityTypeU32=0)):
        r=deepcopy(representatives[1]);mutate(r);assert not outs.is_valid(r);negatives+=1
    assert not exact(True,1)and not exact({'n':True},{'n':1})
    return {'validJsonInputs':len(good),'rejectedJsonInputs':len(bad),'fullTypedTsPythonReceiptsCompared':len(values),'resultSchemaValidatedReceipts':2*len(values),'resultSchemaNegativeMutations':negatives,'typedComparatorBoolNumberNegatives':2}

def python_host_contracts():
    class DictSubclass(dict):pass
    class IntSubclass(int):pass
    class FloatSubclass(float):pass
    class StrSubclass(str):pass
    cases=[(DictSubclass(base()),'invalid-input'),({StrSubclass('profile'):api.PROFILE,'resource':'money','cityCalculatorReturnU32':0,'lateFacilityTypeU32':0},'unexpected-field'),(base(profile=StrSubclass(api.PROFILE)),'unsupported-profile'),(base(resource=StrSubclass('money')),'unsupported-resource')]
    for k in ('cityCalculatorReturnU32','lateFacilityTypeU32'):
        for v in (IntSubclass(1),FloatSubclass(1.0),float('nan'),float('inf'),float('-inf'),True):cases.append((base(**{k:v}),'invalid-input'))
    for value,reason in cases:assert exact(api.calculate_base_income_return_tail(value),api._reject(reason))
    first=api.calculate_base_income_return_tail(base(cityCalculatorReturnU32=0xFFFFFFFF,lateFacilityTypeU32=1));second=api.calculate_base_income_return_tail(base(cityCalculatorReturnU32=0xFFFFFFFF,lateFacilityTypeU32=1));assert first is not second and first['division']is not second['division']and first['evidence']is not second['evidence']
    first['division']['correctionU32']=8;first['evidence']['fullCallerExecuted']=True;assert second['division']['correctionU32']==1 and second['evidence']['fullCallerExecuted']is False and api.EVIDENCE['fullCallerExecuted']is False
    for k in ('cityCalculatorReturnU32','lateFacilityTypeU32'):
        out=api.calculate_base_income_return_tail(base(**{k:-0.0}));assert type(out[k])is int and out[k]==0
    return {'hostInputsRejected':len(cases),'freshNestedCopiesVerified':True,'integralJsonFloatsNormalized':True,'boolSubclassesRejected':True}

def source_mutations(profile,schema):
    count=0
    def rejected(action):
        nonlocal count
        try:action()
        except (AssertionError,UnicodeError,ValidationError):count+=1
        else:raise AssertionError('source/schema mutation accepted')
    for field in ('profileId','scope','evidence','sources','inputSchema','resultSchema'):
        p=deepcopy(profile);p[field]=None;rejected(lambda p=p:api.check(p,schema))
    s=deepcopy(schema);s['additionalProperties']=True;rejected(lambda:api.check(profile,s))
    manifest=json.loads((api.MATERIALS/'source-manifest.json').read_text());contents={row['path']:(ROOT/row['path']).read_bytes()for row in manifest['files']}
    for name,raw in contents.items():
        altered=contents|{name:raw[:-1]+bytes([raw[-1]^1])};rejected(lambda altered=altered:api.verify_materials(manifest,altered))
    m=deepcopy(manifest);m['fullCallerExecuted']=True;rejected(lambda:api.verify_materials(m,contents))
    for resource in ('money','food'):
        p=ROOT/f'docs/sources/base-income-return-tail-{resource}-original';utf=p.with_suffix('.txt').read_bytes();gbk=p.with_suffix('.gbk').read_bytes()
        rejected(lambda resource=resource,utf=utf,gbk=gbk:api.authenticate_source(resource,utf+b'\n',gbk))
        rejected(lambda resource=resource,utf=utf,gbk=gbk:api.authenticate_source(resource,utf,gbk+b'\n'))
    return {'sourceIdentityAndSchemaRejections':count,'behaviorMutantKillsClaimed':0}

def cli_contracts():
    count=0
    with tempfile.TemporaryDirectory(prefix='base-tail-cli-')as d:
        inp,out=Path(d)/'input.json',Path(d)/'output.json';script=ROOT/'scripts/check_base_income_return_tail.py'
        texts=[json.dumps(base()),json.dumps(base(cityCalculatorReturnU32=4294967290.0,lateFacilityTypeU32=1.0)),json.dumps(base(profile='stock')),'{"profile":"x","profile":"y"}','NaN','Infinity','[','{"profile":NaN}','{"cityCalculatorReturnU32":1e999}']
        for index,text in enumerate(texts):
            inp.write_text(text);run=subprocess.run(['python','-B',str(script),'--input',str(inp),'--output',str(out)],text=True,capture_output=True,check=True)
            assert out.read_text()==run.stdout;got=json.loads(run.stdout)
            expected=api.calculate_base_income_return_tail(json.loads(text))if index<3 else api._reject('invalid-input')
            assert exact(got,expected);count+=1
        run=subprocess.run(['python','-B',str(script),'--inp',str(inp)],text=True,capture_output=True);assert run.returncode==2;count+=1
    return {'cliCases':count,'stdoutOutputFileIdentical':True,'duplicateKeysAndNonJsonNumbersRejected':True,'argumentAbbreviationRejected':True}

def main():
    source=api.check_all_sources();profile=json.loads(api.PROFILE_FILE.read_text());schema=json.loads(api.SCHEMA_FILE.read_text())
    report={'profile':api.PROFILE,'source':source,'jsonContracts':json_contracts(profile),'pythonHosts':python_host_contracts(),'sourceMutations':source_mutations(profile,schema),'cli':cli_contracts(),'independentByteOracleClaimed':False}
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
