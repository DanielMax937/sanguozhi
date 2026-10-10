#!/usr/bin/env python3
"""Closed schema, exact tutorial, evidence and documentation mutation guard.

Uses the already installed standards-compliant jsonschema Draft202012Validator.
No code bytes are invented; passing verifies tutorial metadata and boundaries,
not executable identity, native runtime, loyalty, recruitment, or S1 callers.
"""
from copy import deepcopy
import hashlib
import json
from pathlib import Path

from jsonschema import Draft202012Validator, ValidationError
from affinity_distance_source_oracle import (
    EVIDENCE, PROFILE, SOURCE_SHA, SOURCE_BLOB, TutorialMachine, parse_listing,
)

ROOT = Path(__file__).resolve().parents[1]
PROFILE_FILE = ROOT/'docs/sources/affinity-distance.json'
SCHEMA_FILE = ROOT/'docs/sources/affinity-distance.schema.json'
SOURCE_FILE = ROOT/'docs/sources/affinity-distance-tutorial-original.md'
GUIDE = 'docs/rules/affinity-distance.md'
MNEMONIC_SHA = '74280ae3a22486cf499119b2b2e366eae2bf527d0d402e90eab9560e11a77ad3'
sha = lambda raw: hashlib.sha256(raw).hexdigest()
blob = lambda raw: hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()

# Independent reviewed facts, not inferred from the candidate schema/profile.
PINNED_PROFILE_FACTS = {'scope': 'standalone-resolved-uint8-numerical-affinity-distance-only',
 'source': {'repository': 'sjn4048/311MemoryResearch',
            'commit': '66e167e40c3440929ec016f3872aefc3486434c1',
            'path': 'SireCustomizedPackageDev/README.md',
            'url': 'https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/SireCustomizedPackageDev/README.md',
            'gitBlobSha1': '82420492d65150f217effd8cb6b93febdf1c3c2d',
            'snapshot': 'docs/sources/affinity-distance-tutorial-original.md',
            'snapshotEncoding': 'UTF-8',
            'snapshotBytes': 33369,
            'snapshotSha256': 'd5e496619ce21736861f796223523e3897591a2b3374e482aa0505b03606acb3',
            'transformation': 'none; complete original tutorial bytes preserved, including surrounding '
                              'patches, comments and incorrect prose',
            'authority': '37 textual instruction mnemonics from a tutorial; no opcode bytes for this '
                         'entry; addresses and symbolic call names are tutorial claims, not authenticated '
                         'executable facts'},
 'license': {'spdx': 'Apache-2.0',
             'url': 'https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/LICENSE',
             'snapshot': 'docs/sources/production-price-LICENSE.txt',
             'bytes': 11357,
             'sha256': 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
             'gitBlobSha1': '261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64',
             'attribution': 'sjn4048/311MemoryResearch; existing Apache-2.0 license copy covers the pinned '
                            'tutorial snapshot'},
 'domain': {'sourceAffinityByte': [0, 255],
            'targetAffinityByte': [0, 255],
            'normalGameDomainContext': [0, 149],
            'normalGameDomainClaim': 'context only; never input coercion, modular normalization, '
                                     'clean-stock certification or a recovered upstream constraint',
            'validation': 'closed own data properties: profile, sourceAffinityByte, targetAffinityByte; '
                          'strict integer uint8, no coercion, symbols, unknown keys, accessors or '
                          'inherited required fields; engineering rejection is not native invalid-ID or '
                          'invalid-pointer return'},
 'arithmetic': {'absoluteDifference': 'd = abs(sourceAffinityByte - targetAffinityByte)',
                'complement': '150 - d',
                'signedComparisonBranch': 'signed d < complement => keep-d; otherwise use-complement, '
                                          'including d=75 tie',
                'returnedSigned32': 'signed min(d,150-d), range -105..75',
                'returnedEax': 'returnedSigned32 modulo 2^32 as unsigned register word',
                'returnedAl': 'returnedEax & 255; not sign-extended int8',
                'normalDomainPairCount': 22500,
                'uint8PairCount': 65536,
                'negativeReturnPairCount': 11130,
                'forbiddenSubstitutions': ['no modulo-150 normalization',
                                           'no zero clamping',
                                           'no signed-byte affinity loads',
                                           'no signed-byte return conversion',
                                           'no unsigned complement comparison',
                                           'no native pointer or ID emulation in production API']},
 'entryObservations': {'nativeTargetIdDomain': 'signed int32 0..1099 (0x44B), read from first stack '
                                               'argument',
                       'nativeInvalidId': 'XOR AL,AL clears only low eight bits, preserving upper 24 EAX '
                                          'bits from target ID; no pointer calls or affinity reads',
                       'externalCalls': 'GetPersonPtr and IsLegalPtr stay opaque; oracle uses explicit '
                                        'ABI/return observations, not reconstructed callee bodies',
                       'validatorConsumption': 'TEST EAX,EAX consumes complete uint32; 0 fails, 256 and '
                                               '0x80000000 succeed',
                       'invalidPointer': 'validator EAX=0 skips both affinity reads and returns EAX=0; '
                                         'this does not establish invalid-ID EAX=0',
                       'sourcePointer': 'source ECX pointer is saved in EDI; no source-pointer validator '
                                        'appears in this listed entry',
                       'affinityReadOrder': ['00489FB3 target byte [ESI+69h], MOVZX ECX',
                                             '00489FB7 source byte [EDI+69h], MOVZX EAX'],
                       'stack': 'PUSH/POP preserve EDI and ESI; RETN 4 pops return address plus one '
                                'four-byte argument; no three-result stack contract'},
 'sourceCorrections': [{'topic': 'return registers',
                        'tutorialProse': 'invalid ID returns 0',
                        'projection': 'only AL is cleared on invalid ID; EAX upper 24 bits are preserved'},
                       {'topic': 'stack',
                        'tutorialProse': 'function pushes three values; RETN 4 prose conflates argument '
                                         'and return address',
                        'projection': 'callee-saved register traffic is not three outputs; RETN 4 returns '
                                      'and additionally removes one four-byte argument'}],
 'remainingOpen': ['same-version opcode bytes and authenticated clean-stock executable identity',
                   'GetPersonPtr and IsLegalPtr complete bodies and ABI/runtime provenance',
                   'actual caller read width and mutable memory observations outside this restricted '
                   'projection',
                   'S1 callers and natural-loyalty probability/writer integration',
                   'recruitment/loyalty command effects and entry eligibility',
                   'Train/EndTurn, state/save/replay and native runtime integration',
                   'Vanilla/PC-PK/console and cross-version equivalence'],
 'inputSchema': {'$schema': 'https://json-schema.org/draft/2020-12/schema',
                 '$id': 'urn:san11:affinity-distance-tutorial-u8-v1:input',
                 'title': 'JSON input contract; own-data properties and non-JSON values additionally '
                          'guarded by TypeScript',
                 'type': 'object',
                 'additionalProperties': False,
                 'required': ['profile', 'sourceAffinityByte', 'targetAffinityByte'],
                 'properties': {'profile': {'type': 'string', 'const': 'affinity-distance-tutorial-u8-v1'},
                                'sourceAffinityByte': {'type': 'integer', 'minimum': 0, 'maximum': 255},
                                'targetAffinityByte': {'type': 'integer', 'minimum': 0, 'maximum': 255}}}}
PINNED_TOP_LEVEL_KEYS = {'arithmetic',
 'counterexamples',
 'domain',
 'entryObservations',
 'evidence',
 'inputSchema',
 'level',
 'license',
 'loyaltyIntegrated',
 'machineCodeVerified',
 'opcodeBytes',
 'originalExecutableExecuted',
 'originalListing',
 'profileId',
 'recruitmentIntegrated',
 'remainingOpen',
 's1CallerIntegrated',
 'scope',
 'source',
 'sourceCorrections',
 'stockOriginalVerified'}


def exact_schema(value):
    if type(value) is dict:
        return {'type':'object','additionalProperties':False,'required':list(value),
                'properties':{k:exact_schema(v) for k,v in value.items()}}
    if type(value) is list:
        return {'type':'array','minItems':len(value),'maxItems':len(value),
                'prefixItems':[exact_schema(v) for v in value],'items':False}
    return {'type':{str:'string',int:'integer',bool:'boolean',type(None):'null'}[type(value)],
            'const':value}


def check(profile, raw, schema):
    Draft202012Validator.check_schema(schema)
    Draft202012Validator(schema).validate(profile)
    assert schema == {
        '$schema':'https://json-schema.org/draft/2020-12/schema',
        '$id':'urn:san11:'+PROFILE,
        'title':'Closed tutorial-source projection evidence for uint8 affinity distance',
        **exact_schema(profile),
    }, 'schema must retain every closed typed field and exact constant'
    assert set(profile)==PINNED_TOP_LEVEL_KEYS, 'profile root contract changed'
    for key,value in PINNED_PROFILE_FACTS.items():
        assert json.dumps(profile[key],sort_keys=True)==json.dumps(value,sort_keys=True), 'independent typed evidence fact changed: '+key
    assert len(raw)==33369 and sha(raw)==SOURCE_SHA and blob(raw)==SOURCE_BLOB
    text=raw.decode('utf-8'); listing=parse_listing(text)
    canonical=''.join(f'{i.address:08X} {i.op} '+', '.join(i.args)+'\n' for i in listing.values())
    assert sha(canonical.encode())==MNEMONIC_SHA
    assert profile['profileId']==PROFILE and profile['level']=='tutorial-source-projection'
    assert profile['source']['snapshotSha256']==SOURCE_SHA
    assert profile['source']['gitBlobSha1']==SOURCE_BLOB
    assert profile['originalListing']['canonicalMnemonicSha256']==MNEMONIC_SHA
    assert profile['evidence']==EVIDENCE
    for name in ['machineCodeVerified','stockOriginalVerified','originalExecutableExecuted',
                 's1CallerIntegrated','loyaltyIntegrated','recruitmentIntegrated']:
        assert profile[name] is False and profile['evidence'][name] is False
    assert profile['opcodeBytes'] is None
    original=profile['originalListing']
    assert original['start']=='00489F80' and original['endInclusive']=='00489FD7'
    assert original['opcodeBytes'] is None and original['opcodeBytesSha256'] is None
    assert original['machineCodeByteLength'] is None
    assert original['instructionCount']==len(listing)==37
    calls=[{'address':f'{i.address:08X}','symbol':i.args[0],'bodyVerified':False}
           for i in listing.values() if i.op=='call']
    branches=[{'address':f'{i.address:08X}','mnemonic':i.op,
               'target':f'{int(i.args[0].split("loc_")[1],16):08X}'}
              for i in listing.values() if i.op.startswith('j')]
    assert calls==original['calls'] and len(calls)==2
    assert original['conditionalBranchCount']==5
    assert branches==original['branches'] and len(branches)==5
    assert original['conditionalBranchOutcomeCount']==2*len(branches)==10
    assert [(e['sourceAffinityByte'],e['targetAffinityByte']) for e in profile['counterexamples']]==[(1,149),(0,75),(0,151),(0,255)]
    for example in profile['counterexamples']:
        machine=TutorialMachine(listing,example['sourceAffinityByte'],example['targetAffinityByte'])
        actual=machine.run()
        assert actual=={key:value for key,value in example.items() if key not in ('sourceAffinityByte','targetAffinityByte')}
    license_raw=(ROOT/profile['license']['snapshot']).read_bytes()
    assert len(license_raw)==profile['license']['bytes']==11357
    assert sha(license_raw)==profile['license']['sha256']=='c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
    assert blob(license_raw)==profile['license']['gitBlobSha1']=='261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64'


def check_input_schema(schema):
    """Standards validation of actual input records, separate from metadata."""
    Draft202012Validator.check_schema(schema)
    validator=Draft202012Validator(schema)
    def valid(a=1,b=149):
        return {'profile':PROFILE,'sourceAffinityByte':a,'targetAffinityByte':b}
    count=0
    for a in range(256):
        for b in range(256):
            validator.validate(valid(a,b));count+=1
    invalid=[None,True,False,0,1,'1',[],{},[valid()]]
    for field in ('sourceAffinityByte','targetAffinityByte'):
        for value in (-1,256,1.5,'1',True,False,None,[],{}):
            changed=valid();changed[field]=value;invalid.append(changed)
    for value in ('wrong-profile','S1','',0,True,None,[],{}):
        changed=valid();changed['profile']=value;invalid.append(changed)
    for field in valid():
        changed=valid();del changed[field];invalid.append(changed)
    invalid += [{**valid(),'extra':1},{**valid(),'sourcePointer':123},
                {**valid(),'targetId':7},{**valid(),'evidence':{}}]
    for index,value in enumerate(invalid):
        try:
            validator.validate(value)
        except ValidationError:
            continue
        raise AssertionError('JSON input-schema rejection survived: '+str(index))
    assert count==65536
    return {'validator':'jsonschema.Draft202012Validator',
            'schemaLocation':'docs/sources/affinity-distance.json#/inputSchema',
            'validUint8Inputs':count,'rejectedJsonInputs':len(invalid),
            'nonJsonAndOwnDataInputs':'separately exercised against actual TypeScript export by source oracle and Node tests'}


def docs_check(docs):
    guide=docs[GUIDE]
    for phrase in [
        'tutorial-source-projection','opcodeBytes=null','machineCodeVerified=false',
        'stockOriginalVerified=false','originalExecutableExecuted=false',
        's1CallerIntegrated=false','loyaltyIntegrated=false','recruitmentIntegrated=false',
        '00489F80..00489FD7','00489FB3','00489FB7','00489FCA','GetPersonPtr','IsLegalPtr',
        '65536','22500','11130','4294967295','4294967191','signedComparisonBranch',
        'keep-d','use-complement','affinity-distance-tutorial-original.md','affinity-distance.schema.json',
    ]:
        assert phrase in guide, 'missing guide boundary: '+phrase
    for phrase in ['machineCodeVerified=true','stockOriginalVerified=true',
                   's1CallerIntegrated=true','loyaltyIntegrated=true','recruitmentIntegrated=true']:
        assert phrase not in guide, 'unearned evidence claim: '+phrase


def leaves(value, path=()):
    if type(value) is dict:
        for key,child in value.items():
            yield from leaves(child,path+(key,))
    elif type(value) is list:
        for index,child in enumerate(value):
            yield from leaves(child,path+(index,))
    else:
        yield path,value


def changed_at(value,path,substitute):
    changed=deepcopy(value); target=changed
    for key in path[:-1]:
        target=target[key]
    target[path[-1]]=substitute
    return changed


def rejected(label, operation):
    try:
        operation()
    except (AssertionError,ValidationError,ValueError,KeyError,TypeError,UnicodeError):
        return
    raise AssertionError('controlled mutation survived: '+label)


def main():
    profile=json.loads(PROFILE_FILE.read_text())
    schema=json.loads(SCHEMA_FILE.read_text())
    raw=SOURCE_FILE.read_bytes()
    check(profile,raw,schema)
    profile_mutations=[]
    for key in profile:
        changed=deepcopy(profile); del changed[key]
        profile_mutations.append(('missing-'+key,changed))
    for path,value in leaves(profile):
        if type(value) is bool:
            substitute=not value
        elif value is None:
            substitute='invented-opcodes'
        elif type(value) is int:
            substitute=value+1
        else:
            substitute=value+'-mutated'
        profile_mutations.append(('.'.join(map(str,path)),changed_at(profile,path,substitute)))
    for key in ('machineCodeVerified','stockOriginalVerified','originalExecutableExecuted'):
        profile_mutations.append(('bool-int-'+key,changed_at(profile,(key,),0)))
    changed=deepcopy(profile); changed['extra']='not allowed'; profile_mutations.append(('extra-field',changed))
    changed=deepcopy(profile); changed['source']['extra']='not allowed'; profile_mutations.append(('nested-extra',changed))
    for label,changed in profile_mutations:
        rejected(label,lambda:check(changed,raw,schema))
    source_mutations=[
        (b'xor     al, al',b'xor     eax, eax'),
        (b'cmp     eax, 44Bh',b'cmp     eax, 44Ah'),
        (b'test    eax, eax',b'test    al, al'),
        (b'movzx   ecx, byte ptr [esi+69h]',b'movsx   ecx, byte ptr [esi+69h]'),
        (b'movzx   eax, byte ptr [edi+69h]',b'movsx   eax, byte ptr [edi+69h]'),
        (b'mov     ecx, 96h',b'mov     ecx, 95h'),
        (b'jl      short loc_489FD5',b'jb      short loc_489FD5'),
        (b'call    GetPersonPtr',b'call    GetCountryPtr'),
        (b'call    IsLegalPtr',b'call    IsAlwaysTrue'),
        (b'.text:00489FD7                 retn    4',b'.text:00489FD7                 retn    0'),
    ]
    for before,after in source_mutations:
        assert before in raw
        changed=raw.replace(before,after,1)
        rejected(before.decode(),lambda:check(profile,changed,schema))
    schema_mutations=[]
    for path,value in [
        (('additionalProperties',),True),
        (('properties','source','additionalProperties'),True),
        (('properties','opcodeBytes','type'),'string'),
        (('properties','machineCodeVerified','const'),True),
        (('$schema',),'https://json-schema.org/draft-07/schema'),
    ]:
        schema_mutations.append(changed_at(schema,path,value))
    changed=deepcopy(schema);changed['required'].remove('evidence');schema_mutations.append(changed)
    for index,changed in enumerate(schema_mutations):
        rejected('schema-'+str(index),lambda:check(profile,raw,changed))
    # Mutate profile and regenerate its matching schema together. These must
    # fail the independent facts above, rather than a candidate schema constant.
    coupled_mutations=[
        (('source','commit'),'0'*40),
        (('source','path'),'SireCustomizedPackageDev/other.md'),
        (('source','url'),'https://example.invalid/not-the-pinned-source'),
        (('source','snapshotBytes'),33368),
        (('domain','sourceAffinityByte',1),511),
        (('domain','targetAffinityByte',0),-128),
        (('domain','normalGameDomainContext',1),150),
        (('arithmetic','complement'),'max(0,150-d)'),
        (('arithmetic','signedComparisonBranch'),'unsigned comparison with tie keeping d'),
        (('arithmetic','returnedAl'),'signed int8 result'),
        (('arithmetic','negativeReturnPairCount'),0),
        (('remainingOpen',0),'clean-stock opcode bytes are verified'),
        (('inputSchema','properties','sourceAffinityByte','maximum'),256),
        (('inputSchema','additionalProperties'),True),
        (('inputSchema','additionalProperties'),0),
        (('entryObservations','validatorConsumption'),'TEST AL,AL consumes the low byte only'),
        (('scope',),'loyalty-and-recruitment-command-integrated'),
    ]
    for path,value in coupled_mutations:
        candidate=changed_at(profile,path,value)
        candidate_schema={k:v for k,v in schema.items() if k in ('$schema','$id','title')}
        candidate_schema.update(exact_schema(candidate))
        # Establish that the forged pair is standards-valid and self-consistent.
        Draft202012Validator.check_schema(candidate_schema)
        Draft202012Validator(candidate_schema).validate(candidate)
        rejected('coupled-'+'.'.join(map(str,path)),lambda:check(candidate,raw,candidate_schema))
    docs={GUIDE:(ROOT/GUIDE).read_text()};docs_check(docs)
    document_mutations=[
        ('tutorial-source-projection','native-machine-code-exact'),
        ('opcodeBytes=null','opcodeBytes=88'),
        ('machineCodeVerified=false','machineCodeVerified=true'),
        ('stockOriginalVerified=false','stockOriginalVerified=true'),
        ('originalExecutableExecuted=false','originalExecutableExecuted=true'),
        ('s1CallerIntegrated=false','s1CallerIntegrated=true'),
        ('loyaltyIntegrated=false','loyaltyIntegrated=true'),
        ('recruitmentIntegrated=false','recruitmentIntegrated=true'),
        ('00489FB3','00489FB4'),('00489FB7','00489FB8'),('00489FCA','00489FCB'),
        ('4294967295','0'),('4294967191','105'),('11130','0'),
    ]
    for before,after in document_mutations:
        changed={GUIDE:docs[GUIDE].replace(before,after)}
        rejected('doc-'+before,lambda:docs_check(changed))
    check(profile,raw,schema);docs_check(docs)
    report={'standardSchemaValidator':'jsonschema.Draft202012Validator',
            'sourceBytes':len(raw),'sourceSha256':SOURCE_SHA,'sourceGitBlobSha1':SOURCE_BLOB,
            'instructionCount':37,'conditionalBranchCount':5,'conditionalBranchOutcomeCount':10,
            'opcodeBytes':None,'profileMutationsKilled':len(profile_mutations),
            'sourceMutationsKilled':len(source_mutations),'schemaMutationsKilled':len(schema_mutations),
            'documentMutationsKilled':len(document_mutations),'documentsChecked':list(docs),
            'coupledMetadataMutationsKilled':len(coupled_mutations),
            'inputSchemaValidation':check_input_schema(profile['inputSchema']),
            'scope':'exact tutorial snapshot and closed evidence; no stock or game-runtime certification'}
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':
    main()
