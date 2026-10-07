"""Fresh corpus regressions. Prepared only; execute after the validation owner's release."""
import copy
import tempfile
import unittest
from pathlib import Path
from check_scenario_events import DATA,DataError,load_json,shape,schema_contract,validate_corpus,walk
EXPECTED_DISAGREEMENT_IDS = ['cao-cao-death-gates', 'chain-plot-aggregate-vs-stages', 'city-versus-base-and-assignment', 'date-month-boundaries', 'deposed-emperor-location', 'dian-wei-eligibility', 'emperor-dead-versus-absent', 'five-recruit-quantifiers', 'gan-ning-loyalty', 'guo-jia-eligibility', 'hanzhong-diplomacy', 'lu-meng-edition', 'lu-xun-merit', 'ma-brothers-gates', 'mi-marriage-eligibility', 'northern-campaign-order', 'opening-outcomes-unstated-vs-none', 'qiao-marriage-scope', 'recommendation-relationship', 'recruitment-debut-and-prior-service', 'recruitment-result-description-order', 'shu-accession-rank', 'southern-campaign-region', 'sun-ce-death-duration', 'sun-ce-sortie-actors', 'sun-shang-xiang-setting', 'three-visits-aggregate-vs-stages', 'tiger-sons-platform', 'two-powers-date', 'two-zhangs-eligibility', 'wei-accession-choice', 'wiki-heading-only-vs-chinese-details', 'wu-emperor-prerequisite', 'wu-king-timing', 'xu-chu-eligibility', 'yuan-shu-diplomacy', 'zhao-yun-duplicate', 'zhen-marriage-scope', 'zhou-yu-merit-equality', 'zhuge-death-equality', 'zhuge-marriage-eligibility']
class CorpusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original=[load_json(DATA/n) for n in ('gamersky-2008.json','atwiki-88.json')]
        cls.inventory=load_json(DATA/'inventory.json');cls.schema=load_json(DATA/'schema.json');cls.index_schema=load_json(DATA/'inventory-schema.json')
    def setUp(self): self.ds=copy.deepcopy(self.original);self.index=copy.deepcopy(self.inventory);self.event=self.ds[0]['events'][0]
    def valid(self): return validate_corpus(self.ds,self.index,self.schema,self.index_schema)
    def rejected(self):
        with self.assertRaises(DataError): self.valid()
    def event_for(self,source,id): return next(e for e in self.ds[source]['events'] if e['eventId']==id)
    def test_source_inventory(self):
        result=self.valid();self.assertEqual(result['observations'],105);self.assertEqual(result['events'],66);self.assertEqual(result['sources'],13)
        self.assertEqual(result['disagreements'],41);self.assertEqual(sorted(x['id'] for x in self.index['disagreements']),EXPECTED_DISAGREEMENT_IDS)
        self.assertEqual([len(d['events']) for d in self.ds],[44,61]);self.assertEqual([s['expectedSectionCount'] for s in self.index['sources'][:12]],[5,5,4,3,4,3,4,3,4,2,3,4])
    def test_unknown_flags_and_execution_boundary(self):
        for d in self.ds:
            self.assertIs(d['executionEnabled'],False)
            for e in d['events']: self.assertEqual(e['onceOnly'],{'status':'not-stated','flagId':None});self.assertEqual(e['evidence'],'public-guide-transcription')
    def test_six_wiki_empty_sections(self):
        empty={e['eventId'] for e in self.ds[1]['events'] if not e['conditions']}
        self.assertEqual(empty,{'guo-jia-death','xu-shu-arrives','liu-bei-death','wei-duke-accession','wei-king-accession','guan-yu-arrogance'})
        for e in self.ds[1]['events']:
            if not e['conditions']: self.assertEqual(e['orderedResults'][0]['operation'],'not-stated')
    def test_zhao_duplicate_and_chinese_scenario_date(self):
        self.assertEqual(sum(e['eventId']=='zhao-yun-reunion' for e in self.ds[1]['events']),2)
        f=self.event_for(0,'zhao-yun-reunion')['conditions'][0];self.assertEqual((f['subject'],f['field'],f['value']),('scenario','start-month',[195,1]))
    def test_explicit_two_direction_dislike(self):
        e=self.event_for(0,'recruit-dian-wei');facts=[n for n in walk(e['conditions']) if n.get('kind')=='fact']
        self.assertTrue(any(f['subject']==['典韦'] and f['field']=='disliked-officers' and f['operator']=='not-contains' and f['value']=='player-ruler' for f in facts))
        self.assertTrue(any(f['subject']=='player-ruler' and f['field']=='disliked-officers' and f['operator']=='contains-none' and f['value']==['典韦'] for f in facts))
        self.assertFalse(any(f['field']=='mutual-dislike-with-player-ruler' for f in facts))
    def test_wu_dates_preserve_unresolved_grouping(self):
        for id in ('wu-king-accession','wu-emperor-accession'):
            f=self.event_for(0,id)['conditions'][0];self.assertEqual(f['operator'],'unresolved');self.assertEqual(f['certainty'],'source-ambiguous');self.assertEqual(len(f['value']['possibleGroupings']),2)
    def test_shu_acceleration_not_hard_coded_baseline(self):
        for source in (0,1):
            e=self.event_for(source,'shu-emperor-accession')
            self.assertFalse(any(p.get('field') in ('start-month','elapsed-days') for p in e['conditions']))
            self.assertTrue(any(n.get('certainty')=='source-ambiguous' for n in walk(e['conditions'])))
            self.assertEqual(e['prerequisites'][0]['requirement'],'may-accelerate')
    def test_diao_chan_description_order(self):
        r=self.event_for(0,'chain-plot-assassination')['orderedResults'];self.assertEqual([(n.get('operation'),n.get('target')) for n in r[1:4]],[('join-force','貂蝉'),('move','貂蝉'),('set','貂蝉')])
    def test_three_visits_prerequisite_and_results(self):
        e=self.event_for(0,'three-visits-third');self.assertEqual(e['prerequisites'],[{'eventId':'three-visits-second','requirement':'required','delay':{'operator':'gte','value':30,'unit':'days'}}]);self.assertEqual(e['orderedResults'][1]['values'],{'role':'strategist','loyalty':100,'merit':12000})
    def test_source_native_months(self):
        self.assertEqual(self.event_for(0,'chain-plot-banquet')['orderedResults'][-1]['values']['duration'],{'value':18,'unit':'months'})
        self.assertEqual(self.event_for(0,'three-visits-first')['orderedResults'][0]['values']['duration'],{'value':36,'unit':'months'})
    def test_duplicate_wu_title_distinct_identity(self):
        e=[e for e in self.ds[0]['events'] if e['title']=='吴王即位'];self.assertEqual([x['eventId'] for x in e],['wu-king-accession','wu-emperor-accession']);self.assertEqual(e[1]['prerequisites'][0]['eventId'],'wei-emperor-accession')
    def test_malformed_order_preserved(self):
        p=next(p for p in self.event_for(0,'zhuge-liang-northern-campaign')['conditions'] if p.get('field')=='public-order');self.assertEqual((p['operator'],p['value'],p['certainty']),('source-addition-in-condition',15,'source-ambiguous'))
    def test_no_invented_equal_merit_branch(self):
        for id in ('zhou-yu-death','zhuge-liang-death'):
            b=[x for x in self.event_for(0,id)['orderedResults'] if x['kind']=='branch'];self.assertEqual([n['condition']['operator'] for n in b],['lt','gt'])
    def test_succession_order(self): self.assertEqual(self.event_for(0,'cao-cao-death')['orderedResults'][-1]['values']['priority'],['曹昂','曹丕','曹植','曹冲','曹彰'])
    def test_reject_execution(self): self.ds[0]['executionEnabled']=True;self.rejected()
    def test_reject_numeric_false(self): self.ds[0]['executionEnabled']=0;self.rejected()
    def test_reject_boolean_version(self): self.ds[0]['schemaVersion']=True;self.rejected()
    def test_reject_forged_evidence(self): self.event['evidence']='original-runtime-certified';self.rejected()
    def test_reject_once_flag(self): self.event['onceOnly']={'status':'explicit','flagId':'invented'};self.rejected()
    def test_reject_unknown_field(self): self.event['runtimeVerified']=True;self.rejected()
    def test_reject_duplicate_dataset(self): self.ds[1]['datasetId']=self.ds[0]['datasetId'];self.rejected()
    def test_reject_duplicate_observation(self): self.ds[0]['events'].append(copy.deepcopy(self.event));self.rejected()
    def test_reject_missing_section(self): self.ds[0]['events'].pop();self.rejected()
    def test_reject_bad_ordinal(self): self.event['sourceOrdinal']=2;self.rejected()
    def test_reject_bad_heading(self): self.event['sourceSection']='invented';self.rejected()
    def test_reject_wrong_url(self): self.event['sourceURL']='https://example.invalid/';self.rejected()
    def test_reject_empty_all(self): self.event['conditions']=[{'kind':'all','items':[]}];self.rejected()
    def test_reject_missing_fact_value(self): del self.event['conditions'][0]['value'];self.rejected()
    def test_reject_null_month(self): self.event_for(0,'depose-shao-emperor')['conditions'][0]['value']=None;self.rejected()
    def test_reject_string_month(self): self.event_for(0,'depose-shao-emperor')['conditions'][0]['value']='189-08';self.rejected()
    def test_reject_bad_month(self): self.event_for(0,'depose-shao-emperor')['conditions'][0]['value']=[189,13];self.rejected()
    def test_reject_bad_year(self): self.event_for(0,'depose-shao-emperor')['conditions'][0]['value']=[False,8];self.rejected()
    def test_reject_bad_full_date(self):
        self.event['conditions'].append({'kind':'fact','subject':'calendar','category':'date','field':'date','operator':'gte','value':[207,11,32],'certainty':'source-uncertain'});self.rejected()
    def test_reject_bad_reaches_month(self):
        self.event['conditions'].append({'kind':'fact','subject':'calendar','category':'date','field':'reaches-month','operator':'eq','value':None,'certainty':'source-uncertain'});self.rejected()
    def test_reject_reversed_locator(self): self.event['sourceLocator']={'startLine':20,'endLine':10};self.rejected()
    def test_reject_negative_delay(self): self.event_for(0,'three-visits-third')['prerequisites'][0]['delay']['value']=-1;self.rejected()
    def test_reject_unknown_prerequisite(self): self.event_for(0,'three-visits-third')['prerequisites'][0]['eventId']='missing';self.rejected()
    def test_reject_unindexed_prerequisite(self): self.event_for(0,'three-visits-third')['prerequisites']=[];self.rejected()
    def test_reject_hidden_cycle(self):
        z=[e for e in self.ds[1]['events'] if e['eventId']=='zhao-yun-reunion'];z[0]['prerequisites']=[{'eventId':'three-visits-overview','requirement':'required','delay':None}];self.event_for(1,'three-visits-overview')['prerequisites']=[{'eventId':'zhao-yun-reunion','requirement':'required','delay':None}];self.rejected()
    def test_reject_duplicate_choice(self):
        q=self.event_for(0,'yuan-shu-usurps')['orderedResults'][0];q['options'][1]['optionId']=q['options'][0]['optionId'];self.rejected()
    def test_reject_bad_ai_default(self): self.event_for(0,'yuan-shu-usurps')['orderedResults'][0]['aiDefault']='missing';self.rejected()
    def test_reject_inventory_string_count(self): self.index['observationCount']='105';self.rejected()
    def test_reject_inventory_unknown_field(self): self.index['certified']=True;self.rejected()
    def test_reject_empty_provenance(self): self.index['sources'][0]['retrievalKind']='';self.rejected()
    def test_reject_falsely_resolved_disagreement(self): self.index['disagreements'][0]['status']='resolved-by-preference';self.rejected()
    def test_reject_empty_wu_possible_groupings(self):
        self.event_for(0,'wu-king-accession')['conditions'][0]['value']['possibleGroupings']=[];self.rejected()
    def test_reject_unknown_wu_group_kind(self):
        self.event_for(0,'wu-king-accession')['conditions'][0]['value']['possibleGroupings'][0]['kind']='unknown';self.rejected()
    def test_reject_missing_wu_group_kind(self):
        del self.event_for(0,'wu-king-accession')['conditions'][0]['value']['possibleGroupings'][0]['kind'];self.rejected()
    def test_reject_empty_wu_nested_conditions(self):
        self.event_for(0,'wu-king-accession')['conditions'][0]['value']['possibleGroupings'][0]['items']=[];self.rejected()
    def test_reject_missing_shu_baseline(self):
        del self.event_for(0,'shu-emperor-accession')['conditions'][0]['value']['baselineConditions'];self.rejected()
    def test_reject_unknown_shu_baseline_kind(self):
        self.event_for(0,'shu-emperor-accession')['conditions'][0]['value']['baselineConditions']['kind']='unknown';self.rejected()
    def test_reject_empty_shu_baseline(self):
        self.event_for(0,'shu-emperor-accession')['conditions'][0]['value']['baselineConditions']['items']=[];self.rejected()
    def test_reject_invented_acceleration_threshold(self):
        self.event_for(0,'shu-emperor-accession')['conditions'][0]['value']['replacementConditions']={'elapsedDays':1};self.rejected()
    def test_reject_ref_sibling(self):
        s=copy.deepcopy(self.schema);s['$defs']['event']['$ref']='#/$defs/fact'
        with self.assertRaises(DataError): schema_contract(s)
    def test_reject_missing_acceleration_prerequisite(self):
        self.event_for(0,'shu-emperor-accession')['prerequisites']=[];self.rejected()
    def test_reject_wrong_acceleration_requirement(self):
        self.event_for(0,'shu-emperor-accession')['prerequisites'][0]['requirement']='required';self.rejected()
    def test_reject_wrong_acceleration_event(self):
        self.event_for(0,'shu-emperor-accession')['conditions'][0]['value']['accelerationEvent']='wu-king-accession';self.rejected()
    def test_reject_empty_disagreements(self): self.index['disagreements']=[];self.rejected()
    def test_reject_duplicate_branch_id(self):
        e=self.event_for(0,'recommend-guo-jia');b=[x for x in e['orderedResults'] if x['kind']=='branch'];b[1]['branchId']=b[0]['branchId'];self.rejected()
    def test_reject_duplicate_choice_id(self):
        e=self.event_for(0,'yuan-shu-usurps');e['orderedResults'].append(copy.deepcopy(e['orderedResults'][0]));self.rejected()
    def test_reject_nonboolean_debut(self):
        e=self.event_for(0,'recruit-dian-wei');n=next(n for n in walk(e) if n.get('field')=='debut-age-reached');n['value']=1;self.rejected()
    def test_reject_nonboolean_dies(self):
        self.event['conditions'].append({'kind':'fact','category':'actor','subject':'actor','field':'dies','operator':'eq','value':1,'certainty':'stated'});self.rejected()
    def test_reject_malformed_schema_keywords(self):
        cases=[('additionalProperties','false'),('anyOf',[]),('enum',[]),('type',['string']),('required','kind'),('minItems',True),('items',[]),('properties',[]),('pattern','[')]
        for key,value in cases:
            with self.subTest(keyword=key):
                schema=copy.deepcopy(self.schema);schema[key]=value
                with self.assertRaises(DataError): schema_contract(schema)
    def test_reject_unknown_schema_keyword(self):
        s=copy.deepcopy(self.schema);s['minProperties']=1
        with self.assertRaises(DataError): schema_contract(s)
    def test_reject_external_schema_reference(self):
        s=copy.deepcopy(self.schema);s['$defs']['event']={'$ref':'https://example.invalid/schema'}
        with self.assertRaises(DataError): schema_contract(s)
    def test_duplicate_json_keys(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'bad.json';p.write_text('{"x":0,"x":1}')
            with self.assertRaises(DataError): load_json(p)
    def test_nonfinite_json(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'bad.json';p.write_text('{"x":NaN}')
            with self.assertRaises(DataError): load_json(p)
    def test_typed_json_primitives(self):
        for v in (None,False,0,1,1.5,'x',[],{},[None,False,1]): shape(v,{'$ref':'#/$defs/json'},self.schema)
        with self.assertRaises(DataError): shape(True,{'type':'integer'},self.schema)
if __name__=='__main__': unittest.main(verbosity=2)
