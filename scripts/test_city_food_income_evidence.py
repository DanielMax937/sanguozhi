#!/usr/bin/env python3
"""Finite public API, JSON Schema, source-binding and CLI checks (not a byte oracle)."""
from copy import deepcopy
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile
from jsonschema import Draft202012Validator, ValidationError
import check_city_food_income as api


def base(**extra):
    return dict(profile=api.PROFILE, baseFoodWord=0, slots=[None] * 30,
                resolvedTypeRows={}, difficultyWord=1, securityByte=100) | extra


def row(y):
    return {'valid': True, 'foodYieldWord': y}


def slot(t=32, c=1, g=None):
    return {'facilityTypeWord': t, 'constructionWord': c} | ({} if g is None else {'adjacentGranary': g})


def one(t=32, c=1, y=1500, g=False, **extra):
    effective = (32 if t == 52 else 52 if t == 53 else None) if c == 0 else t if t in (32,49,52,53) else None
    return base(slots=[slot(t,c,g if effective in (32,52,53) else None)]+[None]*29,
                resolvedTypeRows={str(effective): row(y)} if effective is not None else {},
                **({'cityTroopsWord':15000} if effective == 49 else {})) | extra


def rejection(value, reason):
    assert exact_json_equal(api.calculate_city_food_income_projection(value), {'supported':False,'reason':reason,'evidence':api.EVIDENCE}), (reason,value)


def cases():
    good=[base(),base(baseFoodWord=-0.0,securityByte=-0.0),base(baseFoodWord=1.0,difficultyWord=1.0)]
    for t in (0,31,*range(32,55),0x80000000,0xFFFFFFFF):
        for c in (0,1,0x80000000,0xFFFFFFFF):
            good.append(one(t,c))
    for t in (32,49,52,53):
        for c in (0,1):
            for y in (0,1,3,1500,65535):
                for g in (False,True): good.append(one(t,c,y,g))
    for difficulty,player in ((1,None),(2,True),(2,False),(3,None),(0xFFFFFFFF,None)):
        for s in (0,49,50,100,101,255):
            good.append(base(baseFoodWord=65535,difficultyWord=difficulty,securityByte=s)|({} if player is None else {'cityPlayerPredicate':player}))
    for t in (32,49,52,53):
        value=one(t); value['resolvedTypeRows'][str(t)]={'valid':False}
        value.pop('cityTroopsWord',None); value['slots'][0].pop('adjacentGranary',None);good.append(value)
    good += [base(resolvedTypeRows={str(t):row(0) for t in (32,49,52,53)}),
             base(slots=[slot(49)]*30,resolvedTypeRows={'49':row(65535)},cityTroopsWord=65537,baseFoodWord=65535,difficultyWord=2,cityPlayerPredicate=False,securityByte=255)]
    bad=[]
    def add(v,r='invalid-input'):bad.append((v,r))
    for v in (None,[],True,1,'x'):add(v)
    for k in ('profile','baseFoodWord','slots','resolvedTypeRows','difficultyWord','securityByte'):
        v=base();del v[k];add(v)
    for k in ('rawFood','finalIncome','easyConvertedEax','state','rng','sourcePointer'):add(base(**{k:0}),'unexpected-field')
    add(base(profile='stock'),'unsupported-profile')
    for k,m in (('baseFoodWord',65535),('difficultyWord',2**32-1),('securityByte',255)):
        for v in (-1,m+1,0.5,True,'1',None):add(base(**{k:v}))
    for k in ('facilityTypeWord','constructionWord'):
        for v in (-1,2**32,0.5,True,'1',None):
            i=one();i['slots'][0][k]=v;add(i)
    for v in (-1,2**32,0.5,True,'1',None):add(one(49,cityTroopsWord=v))
    for y in (-1,65536,0.5,True,'1',None):add(base(resolvedTypeRows={'32':row(y)}))
    for n in (0,29,31):add(base(slots=[None]*n))
    add(base(slots={}))
    add(base(resolvedTypeRows=[]))
    add(base(resolvedTypeRows={'31':row(1)}),'unexpected-field')
    for value in ({'valid':1},{'valid':True},{'foodYieldWord':1},None,[]):add(base(resolvedTypeRows={'32':value}))
    add(base(resolvedTypeRows={'32':{'valid':False,'foodYieldWord':0}}),'unexpected-field')
    add(base(resolvedTypeRows={'32':{'valid':True,'foodYieldWord':0,'x':0}}),'unexpected-field')
    add(base(difficultyWord=2));add(base(difficultyWord=2,cityPlayerPredicate=1))
    add(base(cityPlayerPredicate=False),'unexpected-field')
    add(base(cityTroopsWord=0),'unexpected-field')
    for t,c in ((32,1),(52,0),(53,0),(49,1)):
        i=one(t,c);i['resolvedTypeRows']={};add(i,'missing-type-row')
    for t in (32,52,53):
        i=one(t,y=0);del i['slots'][0]['adjacentGranary'];add(i,'missing-adjacent-granary')
        i=one(t);i['slots'][0]['adjacentGranary']=1;add(i)
        i=one(t);i['resolvedTypeRows'][str(t)]={'valid':False};add(i,'unexpected-field')
    i=one(49,y=0);del i['cityTroopsWord'];add(i,'missing-city-troops')
    for t,c in ((0,1),(31,1),(32,0),(49,0),(49,1)):
        i=one(t,c);i['slots'][0]['adjacentGranary']=False;add(i,'unexpected-field')
    for t,c in ((49,0),(0,1)):
        i=one(t,c,cityTroopsWord=0);add(i,'unexpected-field')
    i=one(49);i['resolvedTypeRows']['49']={'valid':False};add(i,'unexpected-field')
    for y in (0,1,65535):add(base(baseFoodWord=y,difficultyWord=0),'unsupported-easy-branch')
    return good,bad


def exact_json_equal(actual, expected):
    """JSON output comparison that never treats bool as an integer."""
    if type(actual) is not type(expected):
        return False
    if type(actual) is dict:
        return actual.keys() == expected.keys() and all(exact_json_equal(actual[k], expected[k]) for k in actual)
    if type(actual) is list:
        return len(actual) == len(expected) and all(exact_json_equal(a, b) for a, b in zip(actual, expected))
    return actual == expected


def output_comparison_negatives(result_validator):
    original=api.calculate_city_food_income_projection(base())
    changed=deepcopy(original);changed['supported']=1
    assert not exact_json_equal(changed,original)
    assert not result_validator.is_valid(changed)
    changed=deepcopy(original);changed['slots'][0]['contribution']=False
    assert not exact_json_equal(changed,original)
    assert not result_validator.is_valid(changed)
    return 2


def input_checks(profile):
    validator=Draft202012Validator(profile['inputSchema']); result_validator=Draft202012Validator(profile['resultSchema']); good,bad=cases()
    for value in good:
        validator.validate(value); result=api.calculate_city_food_income_projection(value)
        assert result['supported'],value
        result_validator.validate(result)
        assert len(result['slots'])==30
    for value,reason in bad:
        rejection(value,reason); assert not validator.is_valid(value),value
        result_validator.validate(api.calculate_city_food_income_projection(value))
    host_count=0
    class BadDict(dict):pass
    class BadList(list):pass
    for value in (BadDict(base()),base(slots=BadList([None]*30)),base(resolvedTypeRows=BadDict()),base(slots=[BadDict(slot())]+[None]*29),base(resolvedTypeRows={'32':BadDict(row(1))})):
        rejection(value,'invalid-input');result_validator.validate(api.calculate_city_food_income_projection(value));host_count+=1
    for value in (float('nan'),float('inf'),-float('inf')):
        for i in (base(baseFoodWord=value),one(49,cityTroopsWord=value),base(resolvedTypeRows={'32':row(value)})):
            rejection(i,'invalid-input');result_validator.validate(api.calculate_city_food_income_projection(i));host_count+=1
    for key in (32,True,None):
        value=base(resolvedTypeRows={key:row(1)});rejection(value,'unexpected-field');result_validator.validate(api.calculate_city_food_income_projection(value));host_count+=1
    original=one(53,0,3,True); before=deepcopy(original); receipt=api.calculate_city_food_income_projection(original)
    assert original==before
    original['slots'][0]['adjacentGranary']=False;original['resolvedTypeRows']['52']['foodYieldWord']=9
    assert receipt['slots'][0]['foodYieldWord']==3 and receipt['slots'][0]['contribution']==4
    receipt['evidence']['stockOriginalVerified']=True
    assert api.calculate_city_food_income_projection(base())['evidence']['stockOriginalVerified'] is False
    return {'validJsonInputs':len(good),'pythonRejectedInputs':len(bad),'standardsSchemaRejectedJsonInputs':len(bad),'nonJsonPythonRejections':host_count,'receiptInputIsolationVerified':True,'integralJsonNumbersAccepted':True,'pythonReceiptsFrozen':False,'schemaRejectsEasy':True,'schemaCoversHostObjects':False,'resultSchemaOutputsValidated':len(good)+len(bad)+host_count,'typeExactComparatorAndSchemaNegativeProbes':output_comparison_negatives(result_validator)}


def arithmetic_checks():
    ordinary=0
    value=one()
    for y in range(65536):
        value['resolvedTypeRows']['32']['foodYieldWord']=y
        for granary in (False,True):
            value['slots'][0]['adjacentGranary']=granary
            result=api.calculate_city_food_income_projection(value)
            want=3*y//2 if granary else y
            assert result['supported'] and result['rawFood']==want and result['returnedIncomeSigned']==want
            ordinary+=1
    military=0
    for y in (0,1,2,3,1500,1800,2250,65535):
        ts={0,1,14999,15000,15001,20000,65537,2863311,2863312,2**31-1,2**31,2**32-1}
        if y:
            for k in (1,2,max(1,y//2),max(1,y-1)):
                t=(k*2**32)//y
                ts.update(x for x in (t-1,t,t+1) if 0<=x<2**32)
        for t in sorted(ts):
            result=api.calculate_city_food_income_projection(one(49,y=y,cityTroopsWord=t));r=result['slots'][0]
            p=max(15000,t)*y; want=(p%2**32)//15000
            assert result['supported'] and result['rawFood']==want and r['militaryProductRaw']==p and r['militaryProductU32']==p%2**32
            military+=1
    sec_cases=0
    maximum=base(baseFoodWord=65535,slots=[slot(49)]*30,resolvedTypeRows={'49':row(65535)},cityTroopsWord=65537)
    for value in (base(baseFoodWord=0),base(baseFoodWord=1),base(baseFoodWord=123),maximum):
        raw=8655465 if value is maximum else value['baseFoodWord']
        for d,player,q in ((1,None,100),(2,True,75),(2,False,125),(3,None,100),(2**32-1,None,100)):
            for sec in range(256):
                value['difficultyWord']=d;value['securityByte']=sec
                if player is None:value.pop('cityPlayerPredicate',None)
                else:value['cityPlayerPredicate']=player
                result=api.calculate_city_food_income_projection(value)
                product=(raw*q//100)*max(sec,50);signed=product-(2**32 if product>=2**31 else 0)
                want=(abs(signed)//100)*(-1 if signed<0 else 1)
                assert result['supported'] and result['securityProductRaw']==product and result['securityProductSigned']==signed
                assert result['returnedIncomeSigned']==want and result['returnedIncomeU32']==want%2**32
                sec_cases+=1
    return {'ordinaryFarmU16YieldValues':65536,'ordinaryFarmGranaryPaths':2,'ordinaryFarmCases':ordinary,'militaryBoundaryCases':military,'securityDifficultyCases':sec_cases,'allSecurityBytesPerSelectedCase':256,'maximumRawFood':8655465,'maximumSecurityProduct':2758929405,'allFacilityCombinationsExhausted':False,'allU32TroopYieldPairsExhausted':False,'formulaTestsAreIndependentByteOracle':False}


def must_fail(fn,label):
    try:fn()
    except (AssertionError,ValidationError,ValueError,UnicodeError,KeyError,TypeError):return
    raise AssertionError('mutation survived: '+label)


def leaves(value,path=()):
    if type(value) is dict:
        for k,v in value.items():yield from leaves(v,path+(k,))
    elif type(value) is list:
        for k,v in enumerate(value):yield from leaves(v,path+(k,))
    else:yield path,value


def changed_leaf(value):
    return not value if type(value) is bool else value+1 if type(value) is int else value+' [changed]' if type(value) is str else 0


def guard_checks(profile,schema):
    utf8,gbk=api.SOURCE.read_bytes(),api.GBK_FILE.read_bytes(); counts={}
    for name,original in (('profile',profile),('schema',schema)):
        count=0
        for path,old in leaves(original):
            changed=deepcopy(original);cursor=changed
            for key in path[:-1]:cursor=cursor[key]
            cursor[path[-1]]=changed_leaf(old)
            must_fail(lambda:api.check(changed if name=='profile' else profile,changed if name=='schema' else schema,utf8,gbk),name+str(path));count+=1
        for key in original:
            changed=deepcopy(original);del changed[key]
            must_fail(lambda:api.check(changed if name=='profile' else profile,changed if name=='schema' else schema,utf8,gbk),name+':missing:'+key)
        changed=deepcopy(original);changed['unexpected']=True
        must_fail(lambda:api.check(changed if name=='profile' else profile,changed if name=='schema' else schema,utf8,gbk),name+':extra')
        counts[name+'LeafMutationsRejected']=count
    coordinated=0
    for key,value in profile['evidence'].items():
        if value is False:
            forged=deepcopy(profile);forged['evidence'][key]=True
            forged_schema={'$schema':schema['$schema'],**api.closed_const_schema(forged)}
            Draft202012Validator(forged_schema).validate(forged)
            must_fail(lambda:api.check(forged,forged_schema,utf8,gbk),'coordinated:'+key);coordinated+=1
    manifest=json.loads((api.MATERIALS/'source-manifest.json').read_text())
    contents={r['path']:(api.ROOT/r['path']).read_bytes() for r in manifest['files']}; byte_count=0
    for filename in ('source-body.bin','jump-table.bin','dispatch-table.bin'):
        path='docs/sources/city-food-income-projection/'+filename
        for offset in range(len(contents[path])):
            changed=dict(contents);raw=bytearray(changed[path]);raw[offset]^=1;changed[path]=bytes(raw)
            must_fail(lambda:api.verify_materials(manifest,changed),filename+':'+str(offset));byte_count+=1
    for path,raw in contents.items():
        changed=dict(contents);changed[path]=raw+b' '
        must_fail(lambda:api.verify_materials(manifest,changed),path)
    forged=deepcopy(manifest);forged['files'][0]['sha256']='0'*64
    must_fail(lambda:api.verify_materials(forged,contents),'manifest')
    text=utf8.decode();variants={
        'corrected-source-typo':text.replace('sar dl,05','sar edx,05'),
        'inline-granary-mod':text.replace('0049E8D5 - 74 0a','0049E8D5 - eb 0a'),
        'missing-instruction':'\n'.join(l for l in text.splitlines() if not l.startswith('0049E8A4 -')),
        'wrong-address':text.replace('0049E8A4 -','0049E8A5 -'),
        'duplicate-original':text+text,
        'dispatch-mutation':text.replace('03 03 01 02','03 03 02 01'),
        'jump-mutation':text.replace('99 E8 49 00','98 E8 49 00'),
        'invented-gap':text+'\n0049E9FE - 00 00 - invented padding\n'}
    for label,changed in variants.items():
        assert changed!=text;must_fail(lambda:api.parse_listing(changed),label)
    changed=variants['corrected-source-typo'].encode(); changed_gbk=changed.decode().encode('gbk')
    forged=deepcopy(profile);forged['source'].update(utf8Bytes=len(changed),utf8Sha256=api.sha(changed),snapshotBytes=len(changed_gbk),snapshotSha256=api.sha(changed_gbk),gitBlobSha1='0'*40)
    forged_schema={'$schema':schema['$schema'],**api.closed_const_schema(forged)}
    must_fail(lambda:api.check(forged,forged_schema,changed,changed_gbk),'coordinated-source-schema')
    for a,b in ((utf8+b' ',gbk),(utf8,gbk+b' '),(utf8,b'\x80'+gbk[1:])):must_fail(lambda:api.authenticate_source(a,b),'encoding')
    return counts|{'topLevelShapeMutationsRejected':len(profile)+len(schema)+2,'coordinatedEvidenceMutationsRejected':coordinated,'individualCodeAndTableByteMutationsRejected':byte_count,'materialFileMutationsRejected':len(contents),'manifestMutationRejected':True,'structuralSourceMutationsRejected':len(variants),'coordinatedSourceSchemaMutationRejected':True,'encodingMutationsRejected':3,'allRejected':True,'scope':'source/profile/schema/material identity guards, not behavioral mutation tests'}


def typescript_checks():
    good,bad=cases();inputs=good+[v for v,_ in bad]
    result_validator=Draft202012Validator(json.loads(api.PROFILE_FILE.read_text())['resultSchema'])
    script="import fs from 'node:fs';import {calculateCityFoodIncomeProjection as f} from './packages/engine/src/index.ts';process.stdout.write(JSON.stringify(JSON.parse(fs.readFileSync(0,'utf8')).map(f)));"
    process=subprocess.run(['node','--input-type=module','-e',script],cwd=api.ROOT,input=json.dumps(inputs),capture_output=True,text=True,check=True)
    results=json.loads(process.stdout);assert len(results)==len(inputs)
    for i,(value,result) in enumerate(zip(inputs,results)):
        result_validator.validate(result)
        expected=api.calculate_city_food_income_projection(value);result_validator.validate(expected)
        assert exact_json_equal(result,expected),(i,value,result)
    return {'actualPublicTypeScriptReceiptComparisons':len(inputs),'allReceiptsMatchPython':True,'typeExactComparison':True,'resultSchemaOutputsValidated':2*len(inputs),'independentByteOracle':False}


def cli_checks():
    command=[sys.executable,str(api.ROOT/'scripts/check_city_food_income.py')];rejected=0
    for args in (['--unknown'],['--input'],['--output'],['--profile','stock'],['{}'],['--in','x']):
        p=subprocess.run(command+args,capture_output=True,text=True);assert p.returncode!=0 and not p.stdout;rejected+=1
    with tempfile.TemporaryDirectory(prefix='city-food-income-cli-') as temp:
        inp=Path(temp)/'input.json';out=Path(temp)/'output.json'
        inp.write_text(json.dumps(one(49,cityTroopsWord=65537,y=65535)))
        p=subprocess.run(command+['--input',str(inp),'--output',str(out)],capture_output=True,text=True,check=True)
        assert p.stdout==out.read_text() and json.loads(p.stdout)['returnedIncomeSigned']==286331
        malformed=['{','{"profile":1,"profile":2}','NaN','Infinity','-Infinity','{"x":{"a":1,"a":2}}']
        for text in malformed:
            inp.write_text(text);p=subprocess.run(command+['--input',str(inp)],capture_output=True,text=True,check=True)
            assert json.loads(p.stdout)['reason']=='invalid-input'
    return {'argumentFormsRejected':rejected,'inputFileExecuted':True,'outputMatchesStdout':True,'malformedJsonInputsRejected':len(malformed),'duplicateKeysRejected':True}


def main():
    assert len(sys.argv)==1,'test runner accepts no arguments'
    source=api.check_all_sources();profile=json.loads(api.PROFILE_FILE.read_text());schema=json.loads(api.SCHEMA_FILE.read_text())
    report={'profile':api.PROFILE,'source':source,'sourceGuards':guard_checks(profile,schema),'inputSchemaAndPythonApi':input_checks(profile),'arithmetic':arithmetic_checks(),'pythonVersusTypeScript':typescript_checks(),'cli':cli_checks(),'stockOriginalVerified':False,'originalExecutableExecuted':False}
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
