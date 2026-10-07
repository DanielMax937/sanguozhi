"""Check static guide-data schema and source coverage. Never evaluate a game event.

Dependency-free, fail-closed implementation of the exact JSON Schema vocabulary in
this corpus. Not a general JSON Schema implementation. Independent standards checks
remain a separate verification step; no prior lost validation is inferred.
"""
from __future__ import annotations
import json
import math
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/scenario-events'
KEYS = frozenset({'$schema','$id','$defs','$ref','title','description','type','const','enum','anyOf','properties','required','additionalProperties','items','minItems','maxItems','minLength','minimum','pattern'})
class DataError(ValueError): pass
def need(ok, message):
    if not ok: raise DataError(message)
def exact(a,b):
    if type(a) is not type(b): return False
    if isinstance(a,dict): return a.keys()==b.keys() and all(exact(a[k],b[k]) for k in a)
    if isinstance(a,list): return len(a)==len(b) and all(exact(x,y) for x,y in zip(a,b))
    return a==b

def schema_contract(schema):
    def visit(s,path):
        need(isinstance(s,dict), path+': schema object required')
        need(not set(s)-KEYS, path+': unsupported schema keyword')
        for key in ('$schema','$id','title','description','$ref','pattern'):
            if key in s: need(isinstance(s[key],str),path+': invalid string keyword')
        if 'type' in s: need(isinstance(s['type'],str) and s['type'] in ('null','boolean','integer','number','string','array','object'),path+': unsupported type')
        for key in ('$defs','properties'):
            if key in s: need(isinstance(s[key],dict) and all(isinstance(k,str) for k in s[key]),path+': invalid schema map')
        if 'required' in s:
            need(isinstance(s['required'],list) and all(isinstance(x,str) for x in s['required']),path+': invalid required list')
            need(len(s['required'])==len(set(s['required'])),path+': duplicate required key')
        if 'additionalProperties' in s: need(type(s['additionalProperties']) is bool or isinstance(s['additionalProperties'],dict),path+': invalid additionalProperties')
        if 'items' in s: need(isinstance(s['items'],dict),path+': invalid items schema')
        for key in ('anyOf','enum'):
            if key in s: need(isinstance(s[key],list) and bool(s[key]),path+': empty/invalid '+key)
        if 'enum' in s:
            need(not any(exact(v,w) for i,v in enumerate(s['enum']) for w in s['enum'][:i]),path+': duplicate enum member')
        for key in ('minItems','maxItems','minLength'):
            if key in s: need(type(s[key]) is int and s[key]>=0,path+': invalid nonnegative integer keyword')
        if 'minimum' in s: need(type(s['minimum']) in (int,float) and (type(s['minimum']) is int or math.isfinite(s['minimum'])),path+': invalid minimum')
        if 'pattern' in s:
            try: re.compile(s['pattern'])
            except re.error as exc: raise DataError(path+': invalid pattern') from exc

        for key in ('$defs','properties'):
            for name,child in s.get(key,{}).items(): visit(child,path+'/'+key+'/'+name)
        for key in ('items','additionalProperties'):
            if isinstance(s.get(key),dict): visit(s[key],path+'/'+key)
        for i,child in enumerate(s.get('anyOf',[])): visit(child,path+'/anyOf/'+str(i))
        if '$ref' in s:
            need(set(s)=={'$ref'},path+': reference siblings unsupported')
            ref=s['$ref'];need(ref.startswith('#/$defs/') and ref.count('/')==2, path+': local references only')
            need(ref.rsplit('/',1)[1] in schema.get('$defs',{}),path+': missing definition')
    visit(schema,'schema')

def shape(value,s,schema,path='$',depth=0):
    need(depth<128,path+': nesting limit')
    if '$ref' in s:
        shape(value,schema['$defs'][s['$ref'].rsplit('/',1)[1]],schema,path,depth+1);return
    if 'anyOf' in s:
        for option in s['anyOf']:
            try: shape(value,option,schema,path,depth+1);break
            except DataError: pass
        else: raise DataError(path+': no allowed shape')
    if 'const' in s: need(exact(value,s['const']),path+': wrong constant')
    if 'enum' in s: need(any(exact(value,x) for x in s['enum']),path+': outside enum')
    if 'type' in s:
        match={'null':value is None,'boolean':type(value) is bool,'integer':type(value) is int,'number':type(value) is int or (type(value) is float and math.isfinite(value)),'string':isinstance(value,str),'array':isinstance(value,list),'object':isinstance(value,dict)}
        need(s['type'] in match and match[s['type']],path+': wrong type')
    if isinstance(value,dict):
        props=s.get('properties',{});need(all(k in value for k in s.get('required',[])),path+': missing field')
        extra=set(value)-set(props);ap=s.get('additionalProperties',True);need(ap is not False or not extra,path+': unknown field')
        for k,v in value.items():
            if k in props: shape(v,props[k],schema,path+'/'+k,depth+1)
            elif isinstance(ap,dict): shape(v,ap,schema,path+'/'+k,depth+1)
    if isinstance(value,list):
        need(len(value)>=s.get('minItems',0),path+': array too short')
        if 'maxItems' in s: need(len(value)<=s['maxItems'],path+': array too long')
        if 'items' in s:
            for i,v in enumerate(value): shape(v,s['items'],schema,path+'/'+str(i),depth+1)
    if isinstance(value,str):
        need(len(value)>=s.get('minLength',0),path+': empty string')
        if 'pattern' in s: need(re.search(s['pattern'],value) is not None,path+': wrong pattern')
    if 'minimum' in s: need(value>=s['minimum'],path+': below minimum')

def walk(v):
    if isinstance(v,dict):
        yield v
        for x in v.values(): yield from walk(x)
    elif isinstance(v,list):
        for x in v: yield from walk(x)

def load_json(path):
    def pairs(items):
        d={}
        for k,v in items:
            need(k not in d,str(path)+': duplicate JSON key');d[k]=v
        return d
    def invalid(_): raise DataError(str(path)+': nonfinite JSON')
    return json.loads(path.read_text(encoding='utf-8'),object_pairs_hook=pairs,parse_constant=invalid)

def chronology(node):
    field,value=node['field'],node['value']
    if field in ('start-month','current-month','reaches-month','date'):
        n=3 if field=='date' else 2
        need(isinstance(value,list) and len(value)==n and all(type(v) is int for v in value) and value[0]>=1 and 1<=value[1]<=12 and (n==2 or 1<=value[2]<=31),'invalid chronology array')
    if field in ('start-year','scheduled-death-year'): need(type(value) is int and value>=1,'invalid year')
    if field=='current-year': need((type(value) is int and value>=1) or (isinstance(value,str) and re.fullmatch(r'[^.]+\.scheduled-death-year',value) is not None),'invalid current-year')
    if field=='elapsed-days': need(type(value) is int and value>=0,'invalid elapsed days')
    if field in ('scheduled-death-reached','scheduled-death-year-reached','scheduled-debut-year-reached','death-occurs','natural-death-due','occurred','dies','debut-age-reached'): need(type(value) is bool,'invalid lifecycle flag')
    if field=='time-since-occurrence': need(isinstance(value,dict) and set(value)=={'value','unit'} and type(value['value']) is int and value['value']>=0 and value['unit'] in ('days','months','years'),'invalid prerequisite duration')

def validate_corpus(datasets,index,schema,index_schema):
    for s in (schema,index_schema): schema_contract(s)
    shape(index,index_schema,index_schema)
    need(len({d.get('datasetId') for d in datasets})==len(datasets),'duplicate dataset ID')
    all_events=[]
    for d in datasets: shape(d,schema,schema);all_events.extend(d['events'])
    observations={e['observationId']:e for e in all_events};need(len(observations)==len(all_events),'duplicate observation ID')
    events={}
    for e in all_events:
        events.setdefault(e['eventId'],[]).append(e)
        need(e['onceOnly']=={'status':'not-stated','flagId':None},'invented once-only state')
        if 'sourceLocator' in e: need(e['sourceLocator']['endLine']>=e['sourceLocator']['startLine'],'reversed source locator')
        branches=[n['branchId'] for n in walk(e) if n.get('kind')=='branch'];need(len(branches)==len(set(branches)),'duplicate branch ID')
        choices=[n['choiceId'] for n in walk(e) if n.get('kind')=='choice'];need(len(choices)==len(set(choices)),'duplicate choice ID')
        for n in walk(e):
            kind=n.get('kind')
            if kind in ('fact','all','any','if','effect','branch','choice'): shape(n,{'$ref':'#/$defs/'+kind},schema)
            if kind=='fact':
                chronology(n)
                if n['field']=='date-clause-scope':
                    need(n['category']=='date' and n['operator']=='unresolved' and n['certainty']=='source-ambiguous','false precision in Wu date clause')
                    shape(n['value'],{'$ref':'#/$defs/wuDateAlternatives'},schema)
                    need([g['kind'] for g in n['value']['possibleGroupings']]==['all','any'],'unsupported Wu date grouping shapes')
                if n['field']=='accelerated-date-clause':
                    need(n['category']=='date' and n['operator']=='unresolved' and n['certainty']=='source-ambiguous','false precision in Shu date clause')
                    shape(n['value'],{'$ref':'#/$defs/shuAcceleratedDate'},schema)
                    baseline=n['value']['baselineConditions']['items']
                    need([b.get('field') for b in baseline]==['start-month','elapsed-days'],'incomplete accelerated baseline')
                    need(any(p['eventId']==n['value']['accelerationEvent'] and p['requirement']=='may-accelerate' for p in e['prerequisites']),'unindexed acceleration event')
            if kind=='choice':
                ids=[a['optionId'] for a in n['options']];need(len(ids)==len(set(ids)),'duplicate option ID');need(n['aiDefault'] is None or n['aiDefault'] in ids,'invalid AI choice')
    seen_sources=set();listed=[]
    for src in index['sources']:
        sid=src['sourceId'];need(sid not in seen_sources,'duplicate source ID');seen_sources.add(sid)
        actual=sorted([e for e in all_events if e['sourceId']==sid],key=lambda e:e['sourceOrdinal'])
        need([e['sourceOrdinal'] for e in actual]==list(range(1,len(actual)+1)),'nonconsecutive source order')
        need(src['expectedSectionCount']==len(actual),'missing/extra source section')
        need(src['originalTitles']==[e['sourceSection'] for e in actual],'source headings differ')
        need(src['observationIds']==[e['observationId'] for e in actual],'source observation membership differs')
        need(all(e['sourceURL']==src['url'] for e in actual),'source URL differs');listed.extend(src['observationIds'])
    need(len(listed)==len(set(listed)) and set(listed)==set(observations),'unlisted/repeated observation')
    catalog=index['eventCatalog'];need(len({r['eventId'] for r in catalog})==len(catalog),'duplicate catalog ID');need({r['eventId'] for r in catalog}==set(events),'catalog coverage')
    for row in catalog: need(row['observationIds']==[e['observationId'] for e in events[row['eventId']]],'catalog membership differs')
    need(index['observationCount']==len(all_events) and index['eventCount']==len(events),'inventory count differs')
    for e in all_events:
        targets=[p['eventId'] for p in e['prerequisites']];need(len(targets)==len(set(targets)),'duplicate prerequisite')
        need(all(t in events and t!=e['eventId'] for t in targets),'unknown/self prerequisite')
        used={n['subject'] for n in walk(e['conditions']) if n.get('kind')=='fact' and n.get('category')=='prerequisite' and isinstance(n['subject'],str)}
        need(used<=set(targets),'unindexed prerequisite condition')
    for d in datasets:
        graph={}
        for e in d['events']: graph.setdefault(e['eventId'],set()).update(p['eventId'] for p in e['prerequisites'])
        visited=set()
        def visit(n,active):
            need(n not in active,'prerequisite cycle')
            if n in visited: return
            for target in graph.get(n,[]): visit(target,active|{n})
            visited.add(n)
        for event in graph: visit(event,set())
    issue_ids=[]
    for issue in index['disagreements']:
        issue_ids.append(issue['id']);need(all(e in events for e in issue['eventIds']),'unknown disagreement event')
        need(all(o in observations for o in issue['observationIds']),'unknown disagreement observation')
        need(all(observations[o]['eventId'] in issue['eventIds'] for o in issue['observationIds']),'unrelated disagreement observation')
        need(len(issue['observationIds'])==len(set(issue['observationIds'])),'duplicate disagreement observation')
        refs=issue['sourceReferences'];need([x['observationId'] for x in refs]==issue['observationIds'],'incomplete/reordered issue references')
        for ref in refs:
            event=observations[ref['observationId']]
            need(ref['sourceURL']==event['sourceURL'] and ref['sourceSection']==event['sourceSection'],'issue source reference mismatch')
            need(ref.get('sourceLocator')==event.get('sourceLocator'),'issue source locator mismatch')
    need(len(issue_ids)==len(set(issue_ids)),'duplicate disagreement ID')
    return dict(observations=len(all_events),events=len(events),sources=len(seen_sources),disagreements=len(issue_ids),executionEnabled=False)

def main():
    ds=[load_json(DATA/n) for n in ('gamersky-2008.json','atwiki-88.json')]
    result=validate_corpus(ds,load_json(DATA/'inventory.json'),load_json(DATA/'schema.json'),load_json(DATA/'inventory-schema.json'))
    print(json.dumps({'ok':True,**result},ensure_ascii=False))
if __name__=='__main__': main()
