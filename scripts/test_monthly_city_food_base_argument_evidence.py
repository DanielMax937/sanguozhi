#!/usr/bin/env python3
"""Closed-schema/API/source/dependency guard negatives, never behavioral kill counts."""
from copy import deepcopy
import json
from pathlib import Path
import re
import subprocess
import tempfile
from jsonschema import Draft202012Validator,ValidationError
import check_monthly_city_food_base_argument as api
ROOT=Path(__file__).resolve().parents[1]
def base(**extra):return {'profile':api.PROFILE,'entryFoodEdiU32':0,'harvestPredicateEaxU32':0,'lateLevyFlagDwordU32':0}|extra
def exact(a,b):
    if type(a)is not type(b):return False
    if type(a)is dict:return a.keys()==b.keys()and all(exact(a[k],b[k])for k in a)
    if type(a)is list:return len(a)==len(b)and all(exact(x,y)for x,y in zip(a,b))
    return a==b

def contract_cases():
    good=[]
    for n in (0,1,3,5,10375,0x2AAAAAAA,0x2AAAAAAB,0x55555555,0x55555556,0x7FFFFFFF,0x80000000,0xFFFFFFFD,0xFFFFFFFF):
        for h in (0,1,2,255,256,65536,0x80000000,0xFFFFFFFF):
            for l in (0,1,2,255,256,65536,0x80000000,0xFFFFFFFF):good.append(base(entryFoodEdiU32=n,harvestPredicateEaxU32=h,lateLevyFlagDwordU32=l))
    bad=[]
    def add(v,reason='invalid-input'):bad.append((v,reason))
    for v in (None,[],True,42,'x'):add(v)
    for k in base():v=base();del v[k];add(v)
    for k in ('state','owner','force','cityCalculatorReturnU32','earlyLevyFlagDwordU32','quarterStart','rng','writer','__proto__'):add(base(**{k:0}),'unexpected-field')
    for v in ('stock',1,None,True):add(base(profile=v),'unsupported-profile')
    for k in ('entryFoodEdiU32','harvestPredicateEaxU32','lateLevyFlagDwordU32'):
        for v in (-1,2**32,0.5,True,'1',None):add(base(**{k:v}))
    return good,bad

def json_contracts(profile):
    ins=Draft202012Validator(profile['inputSchema']);outs=Draft202012Validator(profile['resultSchema']);good,bad=contract_cases();values=good+[v for v,_ in bad]
    run=subprocess.run(['node',str(ROOT/'scripts/oracle_monthly_city_food_base_argument_driver.mjs')],input=''.join(json.dumps(v)+'\n'for v in values),text=True,capture_output=True,check=True)
    ts=[json.loads(s)for s in run.stdout.splitlines()];assert len(ts)==len(values)
    for index,v in enumerate(values):
        py=api.calculate_monthly_city_food_base_argument(v);outs.validate(py);outs.validate(ts[index]);assert exact(py,ts[index])
        if index<len(good):ins.validate(v);assert py['supported']is True
        else:assert not ins.is_valid(v);assert exact(py,api._reject(bad[index-len(good)][1]))
    negatives=0
    def visit(root,value,path):
        nonlocal negatives
        if type(value)is dict:
            for k,v in value.items():visit(root,v,path+[k])
            for operation in ('extra','missing'):
                c=deepcopy(root);target=c
                for k in path:target=target[k]
                if operation=='extra':target['unknown']=0
                else:del target[next(iter(target))]
                assert not outs.is_valid(c),(path,operation);negatives+=1
        elif type(value)in(int,bool):
            c=deepcopy(root);target=c
            for k in path[:-1]:target=target[k]
            target[path[-1]]=bool(value)if type(value)is int else int(value)
            assert not outs.is_valid(c),path;negatives+=1
    representatives=[api.calculate_monthly_city_food_base_argument(base(entryFoodEdiU32=0xFFFFFFFD,harvestPredicateEaxU32=h,lateLevyFlagDwordU32=l))for h,l in((0,0),(1,0),(0,1),(1,1))]+[api._reject('invalid-input')]
    for r in representatives:visit(r,r,[])
    for r in representatives[:-1]:
        for key in ('harvestApplied','levyApplied'):
            c=deepcopy(r);c[key]=not c[key];assert not outs.is_valid(c);negatives+=1
        for key,value in [('harvestTriple',{}),('executedAddresses',[]),('instructionCount',7),('continuationAddress','00590604'),('pushAddress','00590603')]:
            c=deepcopy(r);c[key]=value;assert not outs.is_valid(c);negatives+=1
    assert not exact(True,1)and not exact({'n':True},{'n':1})
    return {'validJsonInputs':len(good),'rejectedJsonInputs':len(bad),'fullTypedTsPythonReceiptsCompared':len(values),'resultSchemaValidatedReceipts':2*len(values),'resultSchemaNegativeMutations':negatives,'typedComparatorBoolNumberNegatives':2}

def python_host_contracts():
    class DictSubclass(dict):pass
    class IntSubclass(int):pass
    class FloatSubclass(float):pass
    class StrSubclass(str):pass
    cases=[(DictSubclass(base()),'invalid-input'),({StrSubclass('profile'):api.PROFILE,'entryFoodEdiU32':0,'harvestPredicateEaxU32':0,'lateLevyFlagDwordU32':0},'unexpected-field'),(base(profile=StrSubclass(api.PROFILE)),'unsupported-profile')]
    for k in ('entryFoodEdiU32','harvestPredicateEaxU32','lateLevyFlagDwordU32'):
        for v in (IntSubclass(1),FloatSubclass(1.0),1.0,-0.0,float('nan'),float('inf'),float('-inf'),True):cases.append((base(**{k:v}),'invalid-input'))
    for value,reason in cases:assert exact(api.calculate_monthly_city_food_base_argument(value),api._reject(reason))
    value=base(entryFoodEdiU32=0xFFFFFFFF,harvestPredicateEaxU32=1,lateLevyFlagDwordU32=1);a=api.calculate_monthly_city_food_base_argument(value);b=api.calculate_monthly_city_food_base_argument(value)
    for key in ('harvestTriple','evidence','executedAddresses','lateLevyRead'):assert a[key]is not b[key]
    a['harvestTriple']['signed']=12;a['evidence']['earlyLevyReused']=True;a['executedAddresses'].clear();a['lateLevyRead']['count']=0
    assert b['harvestTriple']['signed']==-3 and b['evidence']['earlyLevyReused']is False and len(b['executedAddresses'])==16 and b['lateLevyRead']['count']==1 and api.EVIDENCE['earlyLevyReused']is False
    assert value==base(entryFoodEdiU32=0xFFFFFFFF,harvestPredicateEaxU32=1,lateLevyFlagDwordU32=1)
    return {'hostInputsRejected':len(cases),'exactBuiltinIntOnly':True,'integralFloatsRejectedByDirectApi':True,'freshNestedCopiesVerified':True,'boolSubclassesRejected':True}

def source_mutations(profile,schema):
    count=0
    def rejected(action):
        nonlocal count
        try:action()
        except (AssertionError,UnicodeError,ValidationError):count+=1
        else:raise AssertionError('source/schema mutation accepted')
    for key in profile:
        p=deepcopy(profile);p[key]=None;rejected(lambda p=p:api.check(p,schema))
    s=deepcopy(schema);s['additionalProperties']=True;rejected(lambda:api.check(profile,s))
    manifest=json.loads((api.MATERIALS/'source-manifest.json').read_text());contents={r['path']:(ROOT/r['path']).read_bytes()for r in manifest['files']}
    for name,raw in contents.items():
        altered=contents|{name:raw[:-1]+bytes([raw[-1]^1])};rejected(lambda altered=altered:api.verify_materials(manifest,altered))
    m=deepcopy(manifest);m['fullCallerExecuted']=True;rejected(lambda:api.verify_materials(m,contents))
    prefix=ROOT/f'docs/sources/{api.NAME}-original';utf=prefix.with_suffix('.txt').read_bytes();gbk=prefix.with_suffix('.gbk').read_bytes()
    rejected(lambda:api.authenticate_source(utf+b'\n',gbk));rejected(lambda:api.authenticate_source(utf,gbk+b'\n'))
    return {'sourceIdentityAndSchemaRejections':count,'behaviorMutantKillsClaimed':0}

def guard_product(text):
    imports=re.findall(r'^import .+;$',text,re.M)
    assert imports==["import source from '../../../docs/sources/monthly-city-food-base-argument.json' with {type: 'json'};"],'unapproved dependency'
    assert not re.search(r'\b(?:import|require)\s*\(',text),'dynamic dependency'
    for forbidden in ('calculateCityFoodIncomeProjection','calculateBaseIncomeReturnTail','globalThis','Math.random','Date.now','eval(', 'new Function('):assert forbidden not in text,forbidden

def dependency_guards():
    text=(ROOT/'packages/engine/src/monthly-city-food-base-argument.ts').read_text();guard_product(text);count=0
    for injection in ("\nimport x from './engine.ts';",'\nimport("./city-food-income-projection.ts");','\nrequire("./base-income-return-tail.ts");','\ncalculateCityFoodIncomeProjection({});','\ncalculateBaseIncomeReturnTail({});','\nglobalThis.state=1;','\nMath.random();'):
        try:guard_product(text+injection)
        except AssertionError:count+=1
        else:raise AssertionError('dependency guard negative survived')
    for name in ('engine.ts','calculations.ts','city-food-income-projection.ts','base-income-return-tail.ts'):
        text=(ROOT/'packages/engine/src'/name).read_text();assert 'monthly-city-food-base-argument'not in text and 'calculateMonthlyCityFoodBaseArgument'not in text
    return {'isolatedProductImportVerified':True,'existingCompositionAbsent':True,'guardNegatives':count,'behaviorMutantKillsClaimed':0}

def cli_contracts():
    count=0
    with tempfile.TemporaryDirectory(prefix='monthly-food-cli-')as directory:
        inp,out=Path(directory)/'input.json',Path(directory)/'output.json';script=ROOT/'scripts/check_monthly_city_food_base_argument.py'
        valid=[json.dumps(base()),json.dumps(base(entryFoodEdiU32=4294967295.0,harvestPredicateEaxU32=1.0,lateLevyFlagDwordU32=-0.0)),json.dumps(base(profile='stock'))]
        texts=valid+['{"profile":"x","profile":"y"}','NaN','Infinity','[','{"profile":NaN}','{"entryFoodEdiU32":1e999}']
        for index,text in enumerate(texts):
            inp.write_text(text);run=subprocess.run(['python','-B',str(script),'--input',str(inp),'--output',str(out)],text=True,capture_output=True,check=True)
            assert out.read_text()==run.stdout;got=json.loads(run.stdout);expected=api.calculate_monthly_city_food_base_argument(api.parse_json(text))if index<len(valid)else api._reject('invalid-input');assert exact(got,expected);count+=1
        run=subprocess.run(['python','-B',str(script),'--inp',str(inp)],text=True,capture_output=True);assert run.returncode==2;count+=1
    return {'cliCases':count,'stdoutOutputFileIdentical':True,'integralJsonNumbersNormalizedAtTransport':True,'duplicateKeysAndNonJsonNumbersRejected':True,'argumentAbbreviationRejected':True}

def main():
    source=api.check_all_sources();profile=json.loads(api.PROFILE_FILE.read_text());schema=json.loads(api.SCHEMA_FILE.read_text())
    report={'profile':api.PROFILE,'source':source,'jsonContracts':json_contracts(profile),'pythonHosts':python_host_contracts(),'sourceMutations':source_mutations(profile,schema),'dependencyGuards':dependency_guards(),'cli':cli_contracts(),'independentByteOracleClaimed':False}
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
