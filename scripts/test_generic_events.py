"""Static corpus regressions and fail-closed malformed-data probes; no game runtime."""
import ast
import copy
import json
import tempfile
import unittest
from pathlib import Path
from check_generic_events import DATA, ROOT, DataError, check_files, load_json, schema_contract, shape, validate_corpus

class GenericEventTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original=[load_json(DATA/n) for n in ('atwiki-88.json','gamersky-2009.json')]
        cls.original_index=load_json(DATA/'inventory.json');cls.schema=load_json(DATA/'schema.json');cls.index_schema=load_json(DATA/'inventory-schema.json')
    def setUp(self): self.ds=copy.deepcopy(self.original);self.index=copy.deepcopy(self.original_index);self.event=self.ds[0]['observations'][0]
    def valid(self): return validate_corpus(self.ds,self.index,self.schema,self.index_schema)
    def rejected(self):
        with self.assertRaises(DataError): self.valid()
    def wiki(self,n): return self.ds[0]['observations'][n-1]
    def test_complete_source_catalog(self):
        self.assertEqual(self.valid(),{'datasets':2,'sources':3,'observations':33,'events':31,'wikiHeadingOnly':21,'unresolvedIssues':10,'executionEnabled':False})
        self.assertEqual(self.index['wikiCoverageCounts'],{'substantive':6,'conditions-only':2,'unverified-anecdote':1,'qualitative-result-only':1,'heading-only':21})
        self.assertEqual(self.wiki(1)['sourceLocator']['startLine'],1127);self.assertEqual(self.wiki(31)['sourceLocator']['endLine'],1287)
    def test_all_ids_separate_from_historical(self):
        old={e['eventId'] for n in ['atwiki-88.json','gamersky-2008.json'] for e in load_json(ROOT/'data/scenario-events'/n)['events']}
        self.assertFalse(old & {e['eventId'] for d in self.ds for e in d['observations']})
    def test_preserves_old_files_and_no_runtime_dependency(self): self.assertEqual(check_files()['verifiedSnapshots'],0)
    def test_heading_only_has_no_rules(self):
        for e in self.ds[0]['observations']:
            if e['coverageKind']=='heading-only': self.assertEqual((e['conditions'],e['results'],e['annotations']),([],[],[]))
    def test_anecdote_not_eligibility(self):
        e=self.wiki(3);self.assertEqual(e['conditions'],[]);self.assertEqual(e['results'],[])
        self.assertTrue(all(x['certainty']=='source-unverified' for x in e['annotations']))
    def test_conditions_only_is_not_no_change(self):
        for n in (12,13): self.assertEqual(self.wiki(n)['results'],[]);self.assertEqual(self.wiki(n)['resultCompleteness'],'not-stated')
    def test_unknown_runtime_metadata(self):
        for d in self.ds:
            for e in d['observations']:
                self.assertIsNone(e['nativeEventId']);self.assertIsNone(e['triggerProbability']);self.assertEqual(e['onceOnly'],{'status':'not-stated','flagId':None})
    def test_unknown_qualitative_values(self):
        for d in self.ds:
            for e in d['observations']:
                for field in ('conditions','results','annotations'):
                    for c in e[field]:
                        for q in c['quantities']:
                            if q['operator'] in ('unknown','qualitative'): self.assertIsNone(q['value'])
    def test_versions_are_not_same_version_corroboration(self):
        self.assertEqual(self.ds[0]['versionScope']['edition'],'unspecified');self.assertEqual(self.ds[1]['versionScope']['edition'],'PK')
        self.assertEqual(self.index['sourceIndependence'],'not-established')
    def test_bronze_literal_rank_and_location(self):
        self.assertTrue(any('大将軍' in c['text'] for c in self.wiki(2)['conditions']))
        c=self.ds[1]['observations'][0]['conditions'][0];self.assertIn('大司马',c['text']);self.assertIn('“邻”',c['text']);self.assertEqual(c['certainty'],'source-ambiguous')
    def test_development_benefit_is_result_annotation(self):
        self.assertFalse(any('技术力' in c['text'] for c in self.wiki(2)['conditions']))
        self.assertTrue(any('技术力' in c['text'] for c in self.wiki(2)['results']))
    def test_initial_ten_days_not_first_day(self):
        c=next(c for c in self.wiki(5)['conditions'] if c['sourceLocator']['startLine']==1177)
        self.assertIn('初旬',c['text']);self.assertEqual([q['name'] for q in c['quantities']],['calendar-month'])
    def test_yu_ji_branches_and_unresolved_xp_scope(self):
        self.assertEqual([c['scope'] for c in self.wiki(15)['results']],['choice-prompt-unresolved-xp-scope','give-gold','decline-gold','execute-yu-ji'])
        self.assertEqual(self.wiki(15)['results'][0]['certainty'],'source-ambiguous');self.assertEqual(self.wiki(23)['results'],[])
    def test_mi_heng_retains_win_loss_ignore(self): self.assertEqual([c['scope'] for c in self.wiki(16)['results']],['event','debate-win','debate-loss','ignore-challenge'])
    def test_taishan_distinct_geography_and_precision(self):
        self.assertIn('徐州',self.wiki(22)['conditions'][1]['text']);self.assertIn('小沛',self.ds[1]['observations'][1]['conditions'][1]['text'])
        self.assertEqual(self.wiki(22)['results'][0]['quantities'][0]['value'],2)
        self.assertTrue(all(q['value'] is None for q in self.ds[1]['observations'][1]['results'][0]['quantities']))
        self.assertEqual(self.wiki(22)['results'][2]['certainty'],'source-uncertain')
    def test_praise_is_qualitative_without_conditions(self):
        e=self.wiki(28);self.assertFalse(e['conditions']);self.assertIsNone(e['results'][0]['quantities'][0]['value'])
    def test_checker_has_only_standard_library_imports(self):
        allowed={'__future__','argparse','hashlib','json','re','collections','pathlib'}
        tree=ast.parse((ROOT/'scripts/check_generic_events.py').read_text())
        imports={n.module.split('.')[0] for n in ast.walk(tree) if isinstance(n,ast.ImportFrom)}|{a.name.split('.')[0] for n in ast.walk(tree) if isinstance(n,ast.Import) for a in n.names}
        self.assertLessEqual(imports,allowed)
    def test_reject_dataset_execution(self): self.ds[0]['executionEnabled']=True;self.rejected()
    def test_reject_observation_execution(self): self.event['executionEnabled']=True;self.rejected()
    def test_reject_inventory_execution(self): self.index['executionEnabled']=True;self.rejected()
    def test_reject_false_as_zero(self): self.event['executionEnabled']=0;self.rejected()
    def test_reject_boolean_version(self): self.ds[0]['schemaVersion']=True;self.rejected()
    def test_reject_native_id(self): self.event['nativeEventId']=1;self.rejected()
    def test_reject_native_flag(self): self.event['onceOnly']['flagId']=0;self.rejected()
    def test_reject_trigger_probability(self): self.event['triggerProbability']=1;self.rejected()
    def test_reject_engine_handler(self): self.event['handler']='apply_event';self.rejected()
    def test_reject_evidence_upgrade(self): self.event['evidence']='native-exact';self.rejected()
    def test_reject_heading_only_filled(self): self.wiki(4)['conditions']=copy.deepcopy(self.event['conditions'][:1]);self.rejected()
    def test_reject_missing_heading(self): self.ds[0]['observations'].pop();self.rejected()
    def test_reject_reordered_titles(self): self.ds[0]['observations'][0:2]=reversed(self.ds[0]['observations'][0:2]);self.rejected()
    def test_reject_duplicate_title_identity(self): self.wiki(31)['observationId']=self.event['observationId'];self.rejected()
    def test_reject_historical_id_merge(self): self.wiki(10)['eventId']='depose-shao-emperor';self.rejected()
    def test_reject_generic_id_reassignment(self): self.wiki(10)['eventId']=self.wiki(9)['eventId'];self.rejected()
    def test_reject_wrong_ordinal(self): self.event['sourceOrdinal']=2;self.rejected()
    def test_reject_invented_heading(self): self.event['sourceSection']='不存在';self.rejected()
    def test_reject_wrong_url(self): self.event['sourceURL']='https://example.invalid/';self.rejected()
    def test_reject_2008_source_mix(self): self.ds[1]['observations'][0]['sourceURL']='https://www.gamersky.com/handbook/200809/124174.shtml';self.rejected()
    def test_reject_wrong_snapshot(self): self.event['snapshotSha256']='a'*64;self.rejected()
    def test_reject_false_html_provenance(self): self.index['sources'][0]['rawHtmlAvailable']=True;self.rejected()
    def test_reject_raw_html_line_claim(self): self.index['sources'][0]['lineNumberKind']='raw-html';self.rejected()
    def test_reject_reversed_locator(self): self.event['sourceLocator']={'startLine':1152,'endLine':1127};self.rejected()
    def test_reject_claim_outside_section(self): self.event['conditions'][0]['sourceLocator']['endLine']=9999;self.rejected()
    def test_reject_invented_complete_conditions(self): self.event['conditionCompleteness']='complete';self.rejected()
    def test_reject_anecdote_as_rule(self): self.wiki(3)['conditions']=copy.deepcopy(self.wiki(3)['annotations']);self.rejected()
    def test_reject_anecdote_upgraded(self): self.wiki(3)['annotations'][0]['certainty']='source-stated';self.rejected()
    def test_reject_unknown_increment_filled(self): self.wiki(28)['results'][0]['quantities'][0]['value']=50;self.rejected()
    def test_reject_experience_guess_filled(self): self.wiki(5)['results'][1]['quantities'][0]['value']=100;self.rejected()
    def test_reject_numeric_bool(self): self.event['conditions'][0]['quantities'][0]['value']=True;self.rejected()
    def test_reject_numeric_string(self): self.event['conditions'][0]['quantities'][0]['value']='360';self.rejected()
    def test_reject_changed_threshold(self): self.wiki(15)['conditions'][1]['quantities'][1]['value']=2000;self.rejected()
    def test_reject_invented_day(self): self.wiki(5)['conditions'][2]['quantities'].append({'name':'calendar-day','operator':'eq','value':1,'unit':'day'});self.rejected()
    def test_reject_reversed_range(self): self.wiki(16)['conditions'][1]['quantities'][1]['value']=[9900,1];self.rejected()
    def test_reject_missing_difference(self): self.index['unresolvedIssues'].pop();self.rejected()
    def test_reject_duplicate_difference(self): self.index['unresolvedIssues'][1]=copy.deepcopy(self.index['unresolvedIssues'][0]);self.rejected()
    def test_reject_resolved_difference(self): self.index['unresolvedIssues'][0]['status']='resolved';self.rejected()
    def test_reject_wrong_difference_reference(self): self.index['unresolvedIssues'][0]['observationIds']=['generic.atwiki88.01'];self.rejected()
    def test_reject_wrong_mapping(self): self.index['mapping'][0]['observationIds'].append('generic.atwiki88.02');self.rejected()
    def test_reject_duplicate_source(self): self.index['sources'][1]=copy.deepcopy(self.index['sources'][0]);self.rejected()
    def test_reject_source_mismatch_heading(self): self.index['sources'][0]['originalTitles'][0]='不存在';self.rejected()
    def test_reject_source_missing_observation(self): self.index['sources'][0]['observationIds'].pop();self.rejected()
    def test_reject_wrong_count(self): self.index['observationCount']=34;self.rejected()
    def test_reject_historical_count_change(self): self.index['historicalCorpus']['observationCount']=138;self.rejected()
    def test_reject_historical_hash_change(self): self.index['historicalCorpus']['fileSha256']['data/scenario-events/schema.json']='a'*64;self.rejected()
    def test_reject_same_version_claim(self): self.ds[0]['versionScope']['edition']='PK';self.rejected()
    def test_reject_platform_inference(self): self.ds[1]['versionScope']['platform']='PC';self.rejected()
    def test_reject_patch_inference(self): self.ds[1]['versionScope']['patch']='1.1';self.rejected()
    def test_reject_source_independence_claim(self): self.index['sourceIndependence']='independently-confirmed';self.rejected()
    def test_reject_yu_ji_scope_resolved(self): self.wiki(15)['results'][0]['certainty']='source-stated';self.rejected()
    def test_reject_taishan_merit_resolved(self): self.wiki(22)['results'][2]['certainty']='source-stated';self.rejected()
    def test_reject_guessed_xp_upgraded(self): self.wiki(5)['annotations'][0]['certainty']='source-stated';self.rejected()
    def test_reject_guan_lu_and_or_resolved(self): self.wiki(12)['conditions'][1]['certainty']='source-stated';self.rejected()
    def test_reject_bronze_typo_resolved(self): self.ds[1]['observations'][0]['conditions'][0]['certainty']='source-stated';self.rejected()
    def test_reject_duplicate_json_key(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'bad.json';p.write_text('{"a":1,"a":2}')
            with self.assertRaises(DataError): load_json(p)
    def test_reject_nonfinite_json(self):
        for bad in ['NaN','Infinity','-Infinity']:
            with self.subTest(bad=bad),tempfile.TemporaryDirectory() as tmp:
                p=Path(tmp)/'bad.json';p.write_text('{"a":'+bad+'}')
                with self.assertRaises(DataError): load_json(p)
    def test_reject_unknown_schema_vocabulary(self):
        with self.assertRaises(DataError): schema_contract({'unevaluatedProperties':False})
    def test_reject_duplicate_schema_enum(self):
        with self.assertRaises(DataError): schema_contract({'enum':[1,1]})
    def test_const_uses_strict_numeric_types(self):
        with self.assertRaises(DataError): shape(True,{'const':1})
        with self.assertRaises(DataError): shape(0,{'const':False})
    def test_snapshot_failure_is_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            for s in self.index['sources']: (Path(tmp)/s['snapshotFile']).write_text('corrupt')
            with self.assertRaises(DataError): check_files(snapshots=Path(tmp))

if __name__=='__main__': unittest.main()
