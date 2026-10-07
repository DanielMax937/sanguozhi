"""Validate the independent, inert generic-event guide corpus. Never run game events.

Dependency-free validator for this package's explicit JSON Schema vocabulary only.
It is not a general JSON Schema implementation, source authenticity proof or engine.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/generic-events'
class DataError(ValueError): pass
def need(ok, message):
    if not ok: raise DataError(message)
def exact(a, b):
    if type(a) is not type(b): return False
    if isinstance(a, dict): return a.keys() == b.keys() and all(exact(a[k], b[k]) for k in a)
    if isinstance(a, list): return len(a) == len(b) and all(exact(x,y) for x,y in zip(a,b))
    return a == b
def load_json(path):
    def pairs(items):
        value = {}
        for k,v in items:
            need(k not in value, 'duplicate JSON key'); value[k] = v
        return value
    def invalid(_): raise DataError('nonfinite JSON number')
    return json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=pairs, parse_constant=invalid)
def schema_contract(schema):
    keys = {'$schema','$id','title','type','properties','required','additionalProperties','items','minItems','minLength','minimum','pattern','anyOf','const','enum'}
    def visit(s):
        need(isinstance(s,dict) and not set(s)-keys, 'unsupported schema vocabulary')
        for key in ('$schema','$id','title','pattern'):
            if key in s: need(isinstance(s[key],str),'invalid schema string')
        if 'type' in s: need(s['type'] in ('string','integer','array','object','null','boolean'),'unsupported schema type')
        for key in ('minItems','minLength','minimum'):
            if key in s: need(type(s[key]) is int and s[key]>=0,'invalid schema bound')
        if 'pattern' in s:
            try: re.compile(s['pattern'])
            except re.error as e: raise DataError('invalid schema regex') from e
        if 'required' in s: need(isinstance(s['required'],list) and all(isinstance(x,str) for x in s['required']) and len(s['required'])==len(set(s['required'])),'invalid required')
        if 'properties' in s:
            need(isinstance(s['properties'],dict),'invalid properties')
            for child in s['properties'].values(): visit(child)
        if 'items' in s: visit(s['items'])
        if 'additionalProperties' in s:
            if isinstance(s['additionalProperties'],dict): visit(s['additionalProperties'])
            else: need(type(s['additionalProperties']) is bool,'invalid additionalProperties')
        if 'anyOf' in s:
            need(isinstance(s['anyOf'],list) and bool(s['anyOf']),'invalid anyOf')
            for child in s['anyOf']: visit(child)
        if 'enum' in s:
            need(isinstance(s['enum'],list) and bool(s['enum']),'invalid enum')
            need(not any(exact(v,w) for i,v in enumerate(s['enum']) for w in s['enum'][:i]),'duplicate enum')
    visit(schema)
def shape(value, s, path='$', depth=0):
    need(depth<100, path+': nesting limit')
    if 'anyOf' in s:
        for choice in s['anyOf']:
            try: shape(value,choice,path,depth+1); break
            except DataError: pass
        else: raise DataError(path+': invalid alternatives')
    if 'const' in s: need(exact(value,s['const']),path+': invalid const')
    if 'enum' in s: need(any(exact(value,v) for v in s['enum']),path+': invalid enum')
    t=s.get('type')
    if t: need({'string':isinstance(value,str),'integer':type(value) is int,'array':isinstance(value,list),'object':isinstance(value,dict),'null':value is None,'boolean':type(value) is bool}[t],path+': invalid type')
    if isinstance(value,dict):
        need(all(k in value for k in s.get('required',[])),path+': missing key')
        for k,v in value.items():
            child=s.get('properties',{}).get(k,s.get('additionalProperties',True))
            need(child is not False,path+': unknown key '+k)
            if isinstance(child,dict): shape(v,child,path+'/'+k,depth+1)
    if isinstance(value,list):
        need(len(value)>=s.get('minItems',0),path+': too few entries')
        if 'items' in s:
            for i,v in enumerate(value): shape(v,s['items'],path+'/'+str(i),depth+1)
    if isinstance(value,str):
        need(len(value)>=s.get('minLength',0),path+': empty string')
        if 'pattern' in s: need(re.search(s['pattern'],value) is not None,path+': invalid pattern')
    if type(value) is int and 'minimum' in s: need(value>=s['minimum'],path+': below minimum')
# The reviewed source-derived catalog pins identity, order, section boundaries and category.
EXPECTED_CATALOG = [('generic.pre-unification-rebellion-suspicion', 'generic.atwiki88.01', 'atwiki-88-generic', '統一前反乱疑惑', 1, 1127, 1152, 'substantive'), ('generic.bronze-sparrow-acquisition', 'generic.atwiki88.02', 'atwiki-88-generic', '銅雀台', 2, 1153, 1166, 'substantive'), ('generic.recommend-civil-officer', 'generic.atwiki88.03', 'atwiki-88-generic', '推挙－文官', 3, 1167, 1170, 'unverified-anecdote'), ('generic.recommend-military-officer', 'generic.atwiki88.04', 'atwiki-88-generic', '推挙－武官', 4, 1171, 1171, 'heading-only'), ('generic.five-tiger-generals', 'generic.atwiki88.05', 'atwiki-88-generic', '五虎将', 5, 1172, 1192, 'substantive'), ('generic.discover-ruins', 'generic.atwiki88.06', 'atwiki-88-generic', '遺跡発見', 6, 1193, 1194, 'heading-only'), ('generic.discover-shrine', 'generic.atwiki88.07', 'atwiki-88-generic', '廟発見', 7, 1195, 1196, 'heading-only'), ('generic.destroy-ruins-or-shrine', 'generic.atwiki88.08', 'atwiki-88-generic', '遺跡、廟破壊', 8, 1197, 1198, 'heading-only'), ('generic.shao-emperor-accession', 'generic.atwiki88.09', 'atwiki-88-generic', '少帝即位', 9, 1199, 1200, 'heading-only'), ('generic.xian-emperor-accession', 'generic.atwiki88.10', 'atwiki-88-generic', '献帝即位', 10, 1201, 1202, 'heading-only'), ('generic.xian-emperor-death', 'generic.atwiki88.11', 'atwiki-88-generic', '献帝崩御', 11, 1203, 1203, 'heading-only'), ('generic.visit-guan-lu', 'generic.atwiki88.12', 'atwiki-88-generic', '旅人訪問・管輅', 12, 1204, 1212, 'conditions-only'), ('generic.visit-xu-shao', 'generic.atwiki88.13', 'atwiki-88-generic', '旅人訪問・許劭', 13, 1213, 1220, 'conditions-only'), ('generic.visit-hua-tuo', 'generic.atwiki88.14', 'atwiki-88-generic', '旅人訪問・華佗', 14, 1221, 1221, 'heading-only'), ('generic.visit-yu-ji', 'generic.atwiki88.15', 'atwiki-88-generic', '旅人訪問・于吉', 15, 1222, 1234, 'substantive'), ('generic.visit-mi-heng', 'generic.atwiki88.16', 'atwiki-88-generic', '旅人訪問・禰衡', 16, 1235, 1248, 'substantive'), ('generic.visit-sima-hui-a', 'generic.atwiki88.17', 'atwiki-88-generic', '旅人訪問・司馬徽Ａ', 17, 1249, 1250, 'heading-only'), ('generic.visit-sima-hui-b', 'generic.atwiki88.18', 'atwiki-88-generic', '旅人訪問・司馬徽Ｂ', 18, 1251, 1252, 'heading-only'), ('generic.visit-huang-cheng-yan', 'generic.atwiki88.19', 'atwiki-88-generic', '旅人訪問・黄承彦', 19, 1253, 1254, 'heading-only'), ('generic.spousal-help', 'generic.atwiki88.20', 'atwiki-88-generic', '夫婦の助け', 20, 1255, 1256, 'heading-only'), ('generic.sworn-brothers-spirit', 'generic.atwiki88.21', 'atwiki-88-generic', '義兄弟の気炎', 21, 1257, 1258, 'heading-only'), ('generic.taishan-fengshan', 'generic.atwiki88.22', 'atwiki-88-generic', '泰山封禅', 22, 1259, 1268, 'substantive'), ('generic.volunteers', 'generic.atwiki88.23', 'atwiki-88-generic', '義勇兵', 23, 1269, 1270, 'heading-only'), ('generic.petition', 'generic.atwiki88.24', 'atwiki-88-generic', '嘆願', 24, 1271, 1272, 'heading-only'), ('generic.disaster-aid', 'generic.atwiki88.25', 'atwiki-88-generic', '災害援助', 25, 1273, 1274, 'heading-only'), ('generic.han-emperor-secret-envoy', 'generic.atwiki88.26', 'atwiki-88-generic', '漢帝密使', 26, 1275, 1276, 'heading-only'), ('generic.aid-han-emperor', 'generic.atwiki88.27', 'atwiki-88-generic', '漢帝援助', 27, 1277, 1277, 'heading-only'), ('generic.praise', 'generic.atwiki88.28', 'atwiki-88-generic', '賞賛', 28, 1278, 1283, 'qualitative-result-only'), ('generic.slander', 'generic.atwiki88.29', 'atwiki-88-generic', '誹謗', 29, 1284, 1285, 'heading-only'), ('generic.study-report-intellect', 'generic.atwiki88.30', 'atwiki-88-generic', '修行報告・知系', 30, 1286, 1286, 'heading-only'), ('generic.study-report-military', 'generic.atwiki88.31', 'atwiki-88-generic', '修行報告・武系', 31, 1287, 1287, 'heading-only'), ('generic.bronze-sparrow-acquisition', 'generic.gamersky2009.01.bronze-sparrow', 'gamersky-2009-01', '铜雀台', 1, 275, 276, 'supplementary'), ('generic.taishan-fengshan', 'generic.gamersky2009.13.taishan', 'gamersky-2009-13', '泰山封禅', 1, 336, 342, 'supplementary')]
EXPECTED_SOURCES = {'atwiki-88-generic': ('https://w.atwiki.jp/sangokushi11/pages/88.html', 'atwiki-88-generic.web-lines.txt', 'c20f0e46e0f2d7a7dd23650c7da7ab0cf419aea9302bb2a37e39fff1cc3300d9', 1126, 1287), 'gamersky-2009-01': ('https://www.gamersky.com/handbook/200902/134257.shtml', 'gamersky-2009-01.web-lines.txt', '9b38bf7a82ec854ddcece92a618619289180b443cd289fe891f18e222da2c479', 263, 276), 'gamersky-2009-13': ('https://www.gamersky.com/handbook/200902/134257_13.shtml', 'gamersky-2009-13.web-lines.txt', '1fd8f99a7cfb8af92133be43e10e802eb59badaac7222e38dc0ca5528b356d22', 336, 342)}
EXPECTED_ISSUES = {'bronze-rank': ['generic.atwiki88.02', 'generic.gamersky2009.01.bronze-sparrow'], 'bronze-location': ['generic.atwiki88.02', 'generic.gamersky2009.01.bronze-sparrow'], 'bronze-omitted-conditions': ['generic.atwiki88.02', 'generic.gamersky2009.01.bronze-sparrow'], 'bronze-post-acquisition': ['generic.atwiki88.02', 'generic.gamersky2009.01.bronze-sparrow'], 'taishan-geography': ['generic.atwiki88.22', 'generic.gamersky2009.13.taishan'], 'taishan-ability-precision': ['generic.atwiki88.22', 'generic.gamersky2009.13.taishan'], 'taishan-aptitude-vs-experience': ['generic.atwiki88.22', 'generic.gamersky2009.13.taishan'], 'taishan-subordinate-merit': ['generic.atwiki88.22', 'generic.gamersky2009.13.taishan'], 'yu-ji-choice-xp-scope': ['generic.atwiki88.15'], 'source-version-independence': ['generic.atwiki88.02', 'generic.gamersky2009.01.bronze-sparrow', 'generic.atwiki88.22', 'generic.gamersky2009.13.taishan']}
EXPECTED_HISTORICAL_HASHES = {'data/scenario-events/README.md': 'd88fccc00f9c3257588d2847e6a0dd38a166a13a3d6ee28707dfb290abdac453', 'data/scenario-events/atwiki-88.json': 'c309ed1024df30e62f5a7ff6f4f16bb82fd98cac3e7aed19f80a833afe746552', 'data/scenario-events/gamersky-2008.json': '45cb47718d2e90eebd59b06fcc81ea24972852bcae2dc436aa60e45c8fa1c8e5', 'data/scenario-events/inventory-schema.json': '5024d96e8235c25244406a077844f53cc4f522c83793efbc29401e2452633168', 'data/scenario-events/inventory.json': 'fc3d85dd243b37be9068960198787b64a871168469cae28576dd070b84763ce4', 'data/scenario-events/schema.json': '1f691e5a1276b292ad8a63534489992a5db6eb49dadc1e3a62a2667b4d2e2ccb'}
EXPECTED_QUANTITIES = {'generic.atwiki88.01': [{'name': 'scenario-elapsed', 'operator': 'gte', 'value': 360, 'unit': 'days'}, {'name': 'calendar-month', 'operator': 'one-of', 'value': [1, 4, 7, 10], 'unit': 'month'}, {'name': 'calendar-day', 'operator': 'eq', 'value': 1, 'unit': 'day'}, {'name': 'controlled-cities', 'operator': 'gte', 'value': 35, 'unit': 'cities'}, {'name': 'legions', 'operator': 'gte', 'value': 2, 'unit': 'legions'}, {'name': 'candidate-count', 'operator': 'gte', 'value': 1, 'unit': 'officers'}, {'name': 'suspect-loyalty', 'operator': 'lt', 'value': 100, 'unit': 'loyalty'}, {'name': 'candidate-count', 'operator': 'gte', 'value': 1, 'unit': 'officers'}, {'name': 'low-duty-threshold', 'operator': 'unknown', 'value': None, 'unit': 'duty'}, {'name': 'informer-loyalty', 'operator': 'delta', 'value': -20, 'unit': 'loyalty'}, {'name': 'subordinates-loyalty', 'operator': 'delta', 'value': -5, 'unit': 'loyalty'}, {'name': 'controlled-cities-order', 'operator': 'delta', 'value': -10, 'unit': 'public-order'}], 'generic.atwiki88.02': [{'name': 'scenario-elapsed', 'operator': 'gte', 'value': 360, 'unit': 'days'}, {'name': 'controlled-cities', 'operator': 'gte', 'value': 10, 'unit': 'cities'}, {'name': 'technology-increase', 'operator': 'qualitative', 'value': None, 'unit': 'unspecified'}], 'generic.atwiki88.03': [{'name': 'reported-cities', 'operator': 'eq', 'value': 1, 'unit': 'cities'}, {'name': 'reported-officers', 'operator': 'eq', 'value': 2, 'unit': 'officers'}, {'name': 'reported-consecutive-turns', 'operator': 'eq', 'value': 2, 'unit': 'turns'}, {'name': 'compatibility-threshold', 'operator': 'unknown', 'value': None, 'unit': 'unspecified'}], 'generic.atwiki88.04': [], 'generic.atwiki88.05': [{'name': 'controlled-cities', 'operator': 'gte', 'value': 10, 'unit': 'cities'}, {'name': 'calendar-month', 'operator': 'one-of', 'value': [1, 4, 7, 10], 'unit': 'month'}, {'name': 'strength', 'operator': 'gte', 'value': 90, 'unit': 'ability'}, {'name': 'merit', 'operator': 'gte', 'value': 20000, 'unit': 'merit'}, {'name': 'loyalty', 'operator': 'eq', 'value': 100, 'unit': 'loyalty'}, {'name': 'merit', 'operator': 'delta', 'value': 2000, 'unit': 'merit'}, {'name': 'strength-experience', 'operator': 'qualitative', 'value': None, 'unit': 'experience'}, {'name': 'leadership-experience', 'operator': 'qualitative', 'value': None, 'unit': 'experience'}, {'name': 'troop-aptitude-experience', 'operator': 'qualitative', 'value': None, 'unit': 'experience'}], 'generic.atwiki88.06': [], 'generic.atwiki88.07': [], 'generic.atwiki88.08': [], 'generic.atwiki88.09': [], 'generic.atwiki88.10': [], 'generic.atwiki88.11': [], 'generic.atwiki88.12': [{'name': 'search-city-order', 'operator': 'gte', 'value': 90, 'unit': 'public-order'}, {'name': 'trigger-probability', 'operator': 'unknown', 'value': None, 'unit': 'probability'}], 'generic.atwiki88.13': [{'name': 'search-city-order', 'operator': 'gte', 'value': 90, 'unit': 'public-order'}], 'generic.atwiki88.14': [], 'generic.atwiki88.15': [{'name': 'search-city-order', 'operator': 'gte', 'value': 90, 'unit': 'public-order'}, {'name': 'search-city-gold', 'operator': 'gte', 'value': 2001, 'unit': 'gold'}, {'name': 'offered-payment', 'operator': 'eq', 'value': 1000, 'unit': 'gold'}, {'name': 'charm-experience', 'operator': 'qualitative', 'value': None, 'unit': 'experience'}, {'name': 'technology-points', 'operator': 'delta', 'value': 50, 'unit': 'points'}, {'name': 'soldiers', 'operator': 'qualitative', 'value': None, 'unit': 'soldiers'}, {'name': 'public-order', 'operator': 'delta', 'value': -20, 'unit': 'public-order'}], 'generic.atwiki88.16': [{'name': 'intelligence', 'operator': 'gte', 'value': 70, 'unit': 'ability'}, {'name': 'technology-points', 'operator': 'range-inclusive', 'value': [1, 9900], 'unit': 'points'}, {'name': 'technology-points', 'operator': 'delta', 'value': 10, 'unit': 'points'}, {'name': 'politics-experience', 'operator': 'qualitative', 'value': None, 'unit': 'experience'}, {'name': 'technology-points', 'operator': 'delta', 'value': -1, 'unit': 'points'}, {'name': 'politics-experience', 'operator': 'qualitative', 'value': None, 'unit': 'experience'}, {'name': 'charm-experience', 'operator': 'qualitative', 'value': None, 'unit': 'experience'}], 'generic.atwiki88.17': [], 'generic.atwiki88.18': [], 'generic.atwiki88.19': [], 'generic.atwiki88.20': [], 'generic.atwiki88.21': [], 'generic.atwiki88.22': [{'name': 'controlled-xuzhou-cities', 'operator': 'gte', 'value': 1, 'unit': 'cities'}, {'name': 'ruler-all-abilities', 'operator': 'delta', 'value': 2, 'unit': 'ability'}, {'name': 'ruler-troop-experience', 'operator': 'qualitative', 'value': None, 'unit': 'experience'}, {'name': 'subordinates-merit', 'operator': 'qualitative', 'value': None, 'unit': 'merit'}], 'generic.atwiki88.23': [], 'generic.atwiki88.24': [], 'generic.atwiki88.25': [], 'generic.atwiki88.26': [], 'generic.atwiki88.27': [], 'generic.atwiki88.28': [{'name': 'praised-officer-merit', 'operator': 'qualitative', 'value': None, 'unit': 'merit'}], 'generic.atwiki88.29': [], 'generic.atwiki88.30': [], 'generic.atwiki88.31': [], 'generic.gamersky2009.01.bronze-sparrow': [], 'generic.gamersky2009.13.taishan': [{'name': 'ruler-abilities', 'operator': 'qualitative', 'value': None, 'unit': 'unspecified'}, {'name': 'ruler-aptitude', 'operator': 'qualitative', 'value': None, 'unit': 'unspecified'}]}

def validate_corpus(datasets, inventory, schema, index_schema):
    for s in (schema,index_schema): schema_contract(s)
    shape(inventory,index_schema)
    need(len(datasets)==2,'expected two independent datasets')
    need([d['datasetId'] for d in datasets]==['san11.generic.atwiki88.20261007','san11.generic.gamersky2009.20261007'],'dataset identity/order mismatch')
    all_events=[]
    for d in datasets:
        shape(d,schema);all_events.extend(d['observations'])
    need([d['versionScope'] for d in datasets]==[{'edition':'unspecified','platform':None,'patch':None,'basis':'not-stated'},{'edition':'PK','platform':None,'patch':None,'basis':'article-title-and-introduction'}],'invented version scope')
    catalog=[(e['eventId'],e['observationId'],e['sourceId'],e['sourceSection'],e['sourceOrdinal'],e['sourceLocator']['startLine'],e['sourceLocator']['endLine'],e['coverageKind']) for e in all_events]
    need(catalog==EXPECTED_CATALOG,'source-derived catalog differs')
    observations={e['observationId']:e for e in all_events}
    need(len(observations)==33 and len(set(e['eventId'] for e in all_events))==31,'duplicate/missing observation or mapping')
    need(inventory['observationCount']==33 and inventory['eventCount']==31,'incorrect independent counts')
    need([len(d['observations']) for d in datasets]==[31,2],'source dataset mixing')
    need(inventory['wikiCoverageCounts']==dict(Counter(e['coverageKind'] for e in datasets[0]['observations'])),'Wiki category counts mismatch')
    need(inventory['gamerskySelectedCount']==2,'incorrect supplementary count')
    for e in all_events:
        sid=e['sourceId']; url,_,hash_,start,end=EXPECTED_SOURCES[sid]
        need(e['sourceURL']==url and e['snapshotSha256']==hash_,'source reference mismatch')
        need(e['ordinalScope']==('selected-generic-section' if sid.startswith('atwiki') else 'selected-observations-on-page'),'ordinal scope mismatch')
        loc=e['sourceLocator'];need(start<=loc['startLine']<=loc['endLine']<=end,'source boundary mismatch')
        kind=e['coverageKind']
        need(e['conditionCompleteness']==('partial-source-description' if e['conditions'] else 'not-stated'),'false condition completeness')
        need(e['resultCompleteness']==('partial-source-description' if e['results'] else 'not-stated'),'false result completeness')
        if kind=='heading-only': need(not e['conditions'] and not e['results'] and not e['annotations'],'invented heading-only content')
        if kind=='conditions-only': need(e['conditions'] and not e['results'],'invented result in condition-only source')
        if kind=='unverified-anecdote':
            need(not e['conditions'] and not e['results'] and e['annotations'],'anecdote promoted to rule')
            need(all(c['certainty']=='source-unverified' for c in e['annotations']),'anecdote promoted to certainty')
        if kind=='qualitative-result-only': need(not e['conditions'] and e['results'],'invented praise condition')
        if kind in ('substantive','supplementary'): need(e['conditions'] and e['results'],'missing substantive claims')
        quantities=[]
        for field in ('conditions','results','annotations'):
            for c in e[field]:
                l=c['sourceLocator'];need(loc['startLine']<=l['startLine']<=l['endLine']<=loc['endLine'],'claim points outside observation')
                for q in c['quantities']:
                    quantities.append(q);op=q['operator'];value=q['value']
                    if op in ('unknown','qualitative'): need(value is None,'invented numerical precision')
                    elif op in ('one-of','range-inclusive'):
                        need(isinstance(value,list) and all(type(x) is int for x in value),'invalid numeric range/set')
                        need(len(value)==len(set(value)),'duplicate numeric set member')
                        if op=='range-inclusive': need(len(value)==2 and value[0]<=value[1],'reversed numeric range')
                    else: need(type(value) is int,'invalid numeric claim')
        need(exact(quantities,EXPECTED_QUANTITIES[e['observationId']]),'reviewed source quantities changed')
    need(len(inventory['sources'])==3,'incorrect source count')
    need([s['sourceId'] for s in inventory['sources']]==list(EXPECTED_SOURCES),'source order/identity mismatch')
    for s in inventory['sources']:
        sid=s['sourceId'];need((s['url'],s['snapshotFile'],s['snapshotSha256'],s['selectionStartLine'],s['selectionEndLine'])==EXPECTED_SOURCES[sid],'snapshot selection/provenance mismatch')
        es=[e for e in all_events if e['sourceId']==sid]
        need(s['expectedObservationCount']==len(es) and s['observationIds']==[e['observationId'] for e in es] and s['originalTitles']==[e['sourceSection'] for e in es],'source inventory mismatch')
    expected_mapping=[{'eventId':e['eventId'],'observationIds':[o['observationId'] for o in all_events if o['eventId']==e['eventId']],'identityBasis':'selected-source-topic-not-native-id'} for e in datasets[0]['observations']]
    need(inventory['mapping']==expected_mapping,'merged/reassigned source identity')
    issues=inventory['unresolvedIssues'];need(len(issues)==len(EXPECTED_ISSUES),'missing/duplicate unresolved issue')
    need({x['id']:x['observationIds'] for x in issues}==EXPECTED_ISSUES,'unresolved issue reference mismatch')
    need(inventory['historicalCorpus']['fileSha256']==EXPECTED_HISTORICAL_HASHES,'changed historical baseline hashes')
    # Pin uncertainty where source wording cannot justify a stronger assertion.
    def by(oid,field,line):
        matched=[c for c in observations[oid][field] if c['sourceLocator']['startLine']==line]
        need(len(matched)==1,'missing/duplicate uncertainty source claim')
        return matched[0]
    need(by('generic.atwiki88.15','results',1231)['certainty']=='source-ambiguous','resolved Yu Ji XP scope')
    need(by('generic.atwiki88.22','results',1267)['certainty']=='source-uncertain','resolved subordinate merit')
    need(by('generic.atwiki88.05','annotations',1189)['certainty']=='source-uncertain','upgraded guessed XP')
    need(by('generic.atwiki88.12','conditions',1209)['certainty']=='source-ambiguous','resolved Guan Lu conjunction')
    need(by('generic.gamersky2009.01.bronze-sparrow','conditions',276)['certainty']=='source-ambiguous','resolved bronze location')
    return {'datasets':2,'sources':3,'observations':33,'events':31,'wikiHeadingOnly':21,'unresolvedIssues':len(issues),'executionEnabled':False}

def check_files(root=ROOT, snapshots=None):
    data=root/'data/generic-events'
    ds=[load_json(data/n) for n in ('atwiki-88.json','gamersky-2009.json')]
    inventory=load_json(data/'inventory.json')
    result=validate_corpus(ds,inventory,load_json(data/'schema.json'),load_json(data/'inventory-schema.json'))
    actual={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((root/'data/scenario-events').glob('*')) if p.is_file()}
    need(actual==EXPECTED_HISTORICAL_HASHES,'historical corpus bytes changed')
    for folder in ('apps','packages/engine/src'):
        for p in (root/folder).rglob('*'):
            if p.is_file(): need('generic-events' not in p.read_text(encoding='utf-8'),'runtime imports inert generic corpus')
    if snapshots is not None:
        for sid,(_,file,hash_,start,end) in EXPECTED_SOURCES.items():
            path=Path(snapshots)/file;raw=path.read_bytes();need(hashlib.sha256(raw).hexdigest()==hash_,'snapshot hash mismatch')
            lines={int(m[1]):m[2] for m in re.finditer(r'^L(\d+): ?(.*)$',raw.decode('utf-8'),re.M)}
            need(list(lines)==list(range(start,end+1)),'incomplete rendered-line snapshot')
            expected=[e for d in ds for e in d['observations'] if e['sourceId']==sid]
            if sid=='atwiki-88-generic': need([(n,t[4:]) for n,t in lines.items() if t.startswith('### ')]==[(e['sourceLocator']['startLine'],e['sourceSection']) for e in expected],'snapshot headings mismatch')
            else:
                for e in expected: need(any(e['sourceSection'] in lines[n] for n in range(e['sourceLocator']['startLine'],e['sourceLocator']['endLine']+1)),'source heading absent')
        result['verifiedSnapshots']=3
    else: result['verifiedSnapshots']=0
    return result
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--snapshots',type=Path);args=p.parse_args()
    print(json.dumps(check_files(snapshots=args.snapshots),ensure_ascii=False))
