#!/usr/bin/env python3
"""Independent exact-rational golds for all finite supported count/politics cells.

No floating implementation is used to derive expected factor bits or quantities.
The oracle pins assumed f32 constants independently, rounds Fraction to f32 using
integer quotient/remainder ties-to-even, and compares TS/Python receipts. It proves
bounded operations fit binary64 exactly, not unknown native x87/converter behavior.
"""
from __future__ import annotations
import argparse
from copy import deepcopy
from fractions import Fraction as Q
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
from jsonschema import Draft202012Validator
ROOT=Path(__file__).resolve().parents[1]
PROFILE='monthly-specialty-production-observed-v1';POLICY='comment-f32-rne-trunc-v1'
NAME='monthly-specialty-production'
def decode(word):
    exponent=(word>>23)&255;mantissa=word&0x7FFFFF
    assert 0<exponent<255 and word>>31==0
    return Q((1<<23)+mantissa)*Q(2)**(exponent-150)
def rne32(value):
    assert value>0
    exponent=0
    while value<Q(2)**exponent:exponent-=1
    while value>=Q(2)**(exponent+1):exponent+=1
    scaled=value/Q(2)**(exponent-23);whole,remainder=divmod(scaled.numerator,scaled.denominator)
    if 2*remainder>scaled.denominator or 2*remainder==scaled.denominator and whole&1:whole+=1
    if whole==1<<24:whole>>=1;exponent+=1
    assert 1<<23<=whole<1<<24
    return ((exponent+127)<<23)|(whole-(1<<23))
def significant_bits(value):
    n=value.numerator
    while n and n%2==0:n//=2
    return n.bit_length()
def gold_math(count,politics):
    if not count:return None
    if count==1:before=Q(1);tier='one'
    elif count<4:before=Q(count-1,2)+1;tier='two-to-three'
    elif count<8:before=Q(count-3,4)+2;tier='four-to-seven'
    else:before=Q(count-7)*Q(13421773,134217728)+3;tier='eight-to-thirty'
    word=rne32(before);factor=decode(word);al=politics%256;term=60+al//2
    product1=term*factor;product2=product1*3
    converted=product2.numerator//product2.denominator
    return {'factorTier':tier,'factorBitsU32':word,'factorValue':float(factor),'politicsAL':al,'politicsTerm':term,'scaledValue':float(product2),'convertedSigned32':converted,'capApplied':converted>1500},min(converted,1500),max(significant_bits(before),significant_bits((count-7)*Q(13421773,134217728))if count>=8 else 0),max(significant_bits(product1),significant_bits(product2))
def sample(n=1,p=0,word=256,equipment=1):
    value={'profile':PROFILE,'arithmeticProfile':POLICY,'equipmentType':equipment,'specialtyEaxU32':1,'slots':[{'validityEaxU32':word,'correspondingCompletedEaxU32':word}if index<n else {'validityEaxU32':0}for index in range(30)]}
    if n:value['governorPoliticsEaxU32']=p
    return value
def cases():
    yield sample(0)
    for n in range(1,31):
        for p in range(256):yield sample(n,p)
    words=[1,2,255,256,65536,0x80000000,0xFFFFFFFF]
    for equipment in [1,2,3,4]:
        for word in [0,256,65536,0x80000000]:yield {'profile':PROFILE,'arithmeticProfile':POLICY,'equipmentType':equipment,'specialtyEaxU32':word}
        for word in words:
            for n in [0,1,2,3,4,7,8,17,30]:
                v=sample(n,word,word,equipment);v['specialtyEaxU32']=0xFFFFFF01
                # Exercise separate invalid, valid/nonmatching and matching slot stages.
                if n<30:v['slots'][-1]={'validityEaxU32':word,'correspondingCompletedEaxU32':0}
                yield v
    for index in range(30):
        v=sample(0);v['slots'][index]={'validityEaxU32':0x80000000,'correspondingCompletedEaxU32':256};v['governorPoliticsEaxU32']=0xFFFFFF50;yield v

def expected(v,evidence):
    captures=[]
    def add(kind,address,target,word,width,index=None):captures.append({'kind':kind,'callAddress':address,'target':target,'slotIndex':index,'eaxU32':word,'consumedWidthBits':width,'consumedValue':word%256 if width==8 else word})
    add('specialty','00590A7E','0047B3A0',v['specialtyEaxU32'],8)
    n=None;math=None;request=None;path='not-specialty'
    if v['specialtyEaxU32']%256:
        n=0
        for i,slot in enumerate(v['slots']):
            add('validity','00590AB3','0047A630',slot['validityEaxU32'],32,i)
            if slot['validityEaxU32']:
                add('corresponding-completed','00590AC6','0049CFB0',slot['correspondingCompletedEaxU32'],32,i)
                n+=bool(slot['correspondingCompletedEaxU32'])
        path='no-completed-facilities'
        if n:
            p=v['governorPoliticsEaxU32'];add('governor-politics','00590B4E','004890A0',p,8)
            math,q,_,_=gold_math(n,p);path='production'
            request={'pushAddress':'00590B82','continuationAddress':'00590B83','quantityU32':q,'quantitySigned32':q}
    return {'supported':True,'profile':PROFILE,'arithmeticProfile':POLICY,'equipmentType':v['equipmentType'],'observations':deepcopy(v),'path':path,'completedFacilityCount':n,'capturedReturns':captures,'arithmetic':math,'quantityRequest':request,'evidence':deepcopy(evidence)}
def run_ts(values,root=ROOT):
    run=subprocess.run(['node',str(root/'scripts/oracle_monthly_specialty_production_driver.mjs')],cwd=root,input=''.join(json.dumps(x,separators=(',',':'))+'\n'for x in values),text=True,capture_output=True)
    assert run.returncode==0,'Startup/runtime failure is NOT a behavior kill: '+run.stderr[:3000]
    results=[json.loads(line)for line in run.stdout.splitlines()];assert len(results)==len(values);return results

def verify():
    from check_monthly_specialty_production import calculate_monthly_specialty_production,receipt_to_json,check_source
    source=check_source();doc=json.loads((ROOT/f'docs/sources/{NAME}.json').read_text());values=list(cases());actual=run_ts(values)
    vi=Draft202012Validator(doc['inputSchema']);vr=Draft202012Validator(doc['resultSchema'])
    digest=hashlib.sha256();max_pre=max_post=0;cells=0;cap_exact=0;schema_cases=0
    for n in range(31):
        for p in range(256):
            math=gold_math(n,p);cells+=1
            if math:max_pre=max(max_pre,math[2]);max_post=max(max_post,math[3]);cap_exact+=math[0]['convertedSigned32']==1500
    assert max_pre<=53 and max_post<=53
    for i,(value,ts)in enumerate(zip(values,actual)):
        gold=expected(value,doc['evidence']);py=receipt_to_json(calculate_monthly_specialty_production(value))
        assert ts==gold,('TS numeric/capture behavior',i,value,gold,ts)
        assert py==gold,('Python numeric/capture behavior',i,value,gold,py)
        if i%257==0 or i>=7681:
            vi.validate(value);vr.validate(ts);vr.validate(py);schema_cases+=1
        digest.update(json.dumps(gold,sort_keys=True,separators=(',',':')).encode()+b'\n')
    return {'oracle':'independent integer/Fraction binary32 rounding and arithmetic','source':source,'mathematicalCells':cells,'positiveCountPoliticsAPICells':7680,'countZeroAPICanonicalShape':1,'additionalHelperWordAndSlotProbes':len(values)-7681,'totalAPICases':len(values),'fullReceiptsMatchedBothLanguages':len(values),'schemaValidatedInputs':schema_cases,'schemaValidatedReceipts':schema_cases*2,'schemaSampling':'every257th exhaustive numeric cell and all additional helper-word/slot probes','maxPreStoreSignificantBits':max_pre,'maxPostStoreSignificantBits':max_post,'binary64OperationsExactUnderNamedProfile':True,'exactCapCells':cap_exact,'receiptSha256':digest.hexdigest(),'zeroPoliticsNotReadOrRequired':True,'nativeExecutionOrUnknownConverterCertified':False}
def mutant_specs():
    return [
        ('specialty-full-eax','if ((specialty & 255) === 0)','if (specialty === 0)'),
        ('validity-low-al','if (validity === 0)','if ((validity & 255) === 0)'),
        ('completion-low-al','if (completion !== 0) count!++;','if ((completion & 255) !== 0) count!++;'),
        ('completion-exact-one','if (completion !== 0) count!++;','if (completion === 1) count!++;'),
        ('count-offset-one','(count - 1) * c(\'half\')','count * c(\'half\')'),
        ('count-offset-three','(count - 3) * c(\'quarter\')','count * c(\'quarter\')'),
        ('count-offset-seven','(count - 7) * c(\'tenth\')','count * c(\'tenth\')'),
        ('tier-three-exclusive','else if (count <= 3)','else if (count < 3)'),
        ('tier-seven-exclusive','else if (count <= 7)','else if (count < 7)'),
        ('omit-factor-f32-store','const factorValue = fromBits(factorBitsU32);','const factorValue = factorBeforeStore;'),
        ('round-multiply-binary32',"const scaledValue = politicsTerm * factorValue * c('three');","const scaledValue = Math.fround(Math.fround(politicsTerm * factorValue) * c('three'));"),
        ('politics-full-eax','const politicsAL = politics & 255;','const politicsAL = politics;'),
        ('politics-round-half','const politicsTerm = (politicsAL >>> 1) + 60;','const politicsTerm = Math.round(politicsAL / 2) + 60;'),
        ('converter-round-nearest','const convertedSigned32 = Math.trunc(scaledValue);','const convertedSigned32 = Math.round(scaledValue);'),
        ('omit-cap','const quantity = capApplied ? 1500 : convertedSigned32;','const quantity = convertedSigned32;'),
        ('cap-at-equality','const capApplied = convertedSigned32 > 1500;','const capApplied = convertedSigned32 >= 1500;'),
        ('wrong-slot-capture-order',"capture('validity', '00590AB3', '0047A630', validity, 32, i);","capture('validity', '00590AB3', '0047A630', validity, 32, 29 - i);"),
    ]
def mutants():
    doc=json.loads((ROOT/f'docs/sources/{NAME}.json').read_text());values=[]
    for n in [0,1,2,3,4,7,8,17,30]:
        for p in [0,1,80,130,255,256,0xFFFFFFFF]:
            for word in [1,256,0x80000000]:values.append(sample(n,p,word))
    values += [{'profile':PROFILE,'arithmeticProfile':POLICY,'equipmentType':1,'specialtyEaxU32':256}]
    golds=[expected(v,doc['evidence'])for v in values];original=(ROOT/f'packages/engine/src/{NAME}.ts').read_text();reports=[]
    with tempfile.TemporaryDirectory(prefix='specialty-executable-mutants-')as directory:
        temp=Path(directory);(temp/'packages/engine/src').mkdir(parents=True);(temp/'docs/sources').mkdir(parents=True);(temp/'scripts').mkdir()
        shutil.copy2(ROOT/f'docs/sources/{NAME}.json',temp/f'docs/sources/{NAME}.json');shutil.copy2(ROOT/'scripts/oracle_monthly_specialty_production_driver.mjs',temp/'scripts');(temp/'package.json').write_text('{"type":"module"}')
        target=temp/f'packages/engine/src/{NAME}.ts'
        for name,old,new in mutant_specs():
            assert original.count(old)==1,(name,'mutation anchor')
            target.write_text(original);assert run_ts(values,temp)==golds,(name,'unaltered control')
            target.write_text(original.replace(old,new));actual=run_ts(values,temp)
            differences=[i for i,(a,g)in enumerate(zip(actual,golds))if a!=g];assert differences,(name,'survived')
            i=differences[0];reports.append({'name':name,'category':'receipt-behavior'if name in ['cap-at-equality','wrong-slot-capture-order','tier-three-exclusive','tier-seven-exclusive']else'numeric-or-branch-behavior','unalteredControlPassed':True,'killed':True,'witnessInput':values[i],'expected':golds[i],'actual':actual[i]})
    assert (ROOT/f'packages/engine/src/{NAME}.ts').read_text()==original
    return {'actualTypeScriptExecutableMutants':len(reports),'killed':len(reports),'numericalOrBranch':13,'receiptOnly':4,'schemaTypeSourceNegativesCountedAsBehaviorKills':0,'unreachableSignedNegativeMutantsClaimedKilled':0,'mutants':reports,'productTreeUnchanged':True}
def main():
    parser=argparse.ArgumentParser(description=__doc__,allow_abbrev=False);parser.add_argument('--mutants',action='store_true');args=parser.parse_args();print(json.dumps(mutants()if args.mutants else verify(),indent=2))
if __name__=='__main__':main()
