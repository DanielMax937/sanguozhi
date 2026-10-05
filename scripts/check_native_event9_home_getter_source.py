"""Independent event9 live-home getter proof, without production-model imports.

Stdlib checks fingerprinted complete byte rows and annotations, decoded call and
branch operands, recovery metadata and exact caller/callee semantics. --decode
freshly decodes every focused instruction with Capstone. Optional IDBs verify
entire fingerprints and all 1329 inherited/new selected intervals through raw
uncompressed ID1. No target machine code or original executable is run.
"""
import argparse
import ast
import copy
import io
import json
from pathlib import Path
import re
import struct
import sys
import unittest
from check_native_event9_troop_reset_source import NativeEvent9TroopResetSource, load_evidence as load_prior
from check_officer_relocation_source import SOURCE_HASHES, digest, verify_raw_id1
ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'docs/sources/native_event9_home_getter.json'
DIRECTORY=MANIFEST.with_suffix('')
BASELINE='d811288e5e9110036678719af23b597a2450650c'
HISTORICAL_EXTRACTION_BASELINE='b5390990c74d25ec23fc4e59f42619b91279b5c6'
PINS = {'docs/sources/native_event9_troop_reset.json': '96fd1721c16d5fd8aaa1b86a3a86840f0454f7c195697f4954ffa35887d3b1dc', 'scripts/check_native_event9_troop_reset_source.py': '80b118f2d5e4d5d640d4557eb7f48c920e4cb47d072be42dcbda9db1f5aa539e', 'scripts/native_event9_troop_reset_profile.py': 'e60a9fcd18745adab499ef5941369552d8624453380fd80962b5d41df7342574', 'scripts/native_event9_troop_reset_frame.py': 'b4a3949c63d8b047296090a7a1cbb4bc5bd2ce02ae1906d67dcfa3db18ef27f7', 'scripts/native_event9_troop_reset_primitives.py': 'aa1922b2c30117b5e7361967d9dfbe4702a2a2fd7cd33a3156c44cb93c921f7b', 'scripts/check_native_event9_troop_reset_profile.py': '69fd726691689625611045a0a58d8076d5c33cfc47b0f55461d4264be164494a', 'scripts/officer_return_finalizer_profile.py': 'ac58ba359548784492d748674429872a35fd3471bc7dff84559cc7f504e8d755'}
BODY_HASHES = {'00468E60': {'S1': {'endExclusive': '00468E66', 'sha256': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb', 'artifactSha256': 'e1e3c773b29f2e4dc6a77641a875b3c67b5e94c4a28c89b7763a5cd87beb15a3', 'kind': 'code', 'instructionCount': 2, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00468E60', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-00468E60.asm.txt', 'rawId1Sha256': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb'}, 'S2': {'endExclusive': '00468E66', 'sha256': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb', 'artifactSha256': 'e1e3c773b29f2e4dc6a77641a875b3c67b5e94c4a28c89b7763a5cd87beb15a3', 'kind': 'code', 'instructionCount': 2, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00468E60', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-00468E60.asm.txt', 'rawId1Sha256': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb'}}, '00472070': {'S1': {'endExclusive': '004720AB', 'sha256': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536', 'artifactSha256': '13c6734ce69bec80407e2095880eeabfd4302a1119fc9617b1d6328ff9189ac4', 'kind': 'code', 'instructionCount': 27, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00472070', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-00472070.asm.txt', 'rawId1Sha256': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'}, 'S2': {'endExclusive': '004720AB', 'sha256': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536', 'artifactSha256': '13c6734ce69bec80407e2095880eeabfd4302a1119fc9617b1d6328ff9189ac4', 'kind': 'code', 'instructionCount': 27, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00472070', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-00472070.asm.txt', 'rawId1Sha256': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'}}, '0047A630': {'S1': {'endExclusive': '0047A656', 'sha256': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d', 'artifactSha256': '92bc77145c9d5bc7ad3471f46ae6941efa917f6e5878ca0f2c79079b62eda4b0', 'kind': 'code', 'instructionCount': 18, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '0047A630', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-0047A630.asm.txt', 'rawId1Sha256': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'}, 'S2': {'endExclusive': '0047A656', 'sha256': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d', 'artifactSha256': '92bc77145c9d5bc7ad3471f46ae6941efa917f6e5878ca0f2c79079b62eda4b0', 'kind': 'code', 'instructionCount': 18, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '0047A630', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-0047A630.asm.txt', 'rawId1Sha256': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'}}, '004883D0': {'S1': {'endExclusive': '004883EB', 'sha256': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3', 'artifactSha256': '5b078aa445374e46ec420e6ce11317c4693513b242eacd09cb5f204806d0bf6d', 'kind': 'code', 'instructionCount': 9, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '004883D0', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-004883D0.asm.txt', 'rawId1Sha256': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3'}, 'S2': {'endExclusive': '004883EB', 'sha256': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3', 'artifactSha256': '5b078aa445374e46ec420e6ce11317c4693513b242eacd09cb5f204806d0bf6d', 'kind': 'code', 'instructionCount': 9, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '004883D0', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-004883D0.asm.txt', 'rawId1Sha256': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3'}}, '004883F0': {'S1': {'endExclusive': '00488422', 'sha256': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088', 'artifactSha256': 'fe0ecfa27c0fbf2d045cf70d27ae0ebf307f3b097d4d737a57bf307ef1222ec9', 'kind': 'code', 'instructionCount': 21, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '004883F0', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-004883F0.asm.txt', 'rawId1Sha256': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088'}, 'S2': {'endExclusive': '00488422', 'sha256': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088', 'artifactSha256': 'fe0ecfa27c0fbf2d045cf70d27ae0ebf307f3b097d4d737a57bf307ef1222ec9', 'kind': 'code', 'instructionCount': 21, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '004883F0', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-004883F0.asm.txt', 'rawId1Sha256': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088'}}, '00488430': {'S1': {'endExclusive': '00488461', 'sha256': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f', 'artifactSha256': '075a238a260621208616cf48e109c6ee28c9dc1385e15502c4a7a57d301f209b', 'kind': 'code', 'instructionCount': 20, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00488430', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-00488430.asm.txt', 'rawId1Sha256': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f'}, 'S2': {'endExclusive': '00488461', 'sha256': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f', 'artifactSha256': '075a238a260621208616cf48e109c6ee28c9dc1385e15502c4a7a57d301f209b', 'kind': 'code', 'instructionCount': 20, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00488430', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-00488430.asm.txt', 'rawId1Sha256': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f'}}, '00490B00': {'S1': {'endExclusive': '00490B24', 'sha256': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c', 'artifactSha256': 'd22eb058df38253ea680e66ba13459c3732d8abf1799a5a138a803a4b9162f71', 'kind': 'code', 'instructionCount': 10, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00490B00', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-00490B00.asm.txt', 'rawId1Sha256': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c'}, 'S2': {'endExclusive': '00490B24', 'sha256': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c', 'artifactSha256': 'd22eb058df38253ea680e66ba13459c3732d8abf1799a5a138a803a4b9162f71', 'kind': 'code', 'instructionCount': 10, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00490B00', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-00490B00.asm.txt', 'rawId1Sha256': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c'}}, '00490D00': {'S1': {'endExclusive': '00490D21', 'sha256': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a', 'artifactSha256': 'a82117690681914a52efc3d60a1cd9f4503ecb5f3185a1483caad5b2d0dc93da', 'kind': 'code', 'instructionCount': 10, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00490D00', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-00490D00.asm.txt', 'rawId1Sha256': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a'}, 'S2': {'endExclusive': '00490D21', 'sha256': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a', 'artifactSha256': 'a82117690681914a52efc3d60a1cd9f4503ecb5f3185a1483caad5b2d0dc93da', 'kind': 'code', 'instructionCount': 10, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00490D00', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-00490D00.asm.txt', 'rawId1Sha256': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a'}}, '00495520': {'S1': {'endExclusive': '00495556', 'sha256': '427b03ad80eb1190e7b578eb936803badf3701ea34fa20a70ced0b1d7f159dd9', 'artifactSha256': 'd51cf1967d18e482abe2469ad45298e0bf2947262e8e4d8c94c6180e73b7fc81', 'kind': 'code', 'instructionCount': 22, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00495520', 'evidenceUse': 'new-unique-interval', 'file': 'S1-00495520.asm.txt', 'rawId1Sha256': '427b03ad80eb1190e7b578eb936803badf3701ea34fa20a70ced0b1d7f159dd9'}, 'S2': {'endExclusive': '00495556', 'sha256': '427b03ad80eb1190e7b578eb936803badf3701ea34fa20a70ced0b1d7f159dd9', 'artifactSha256': 'd51cf1967d18e482abe2469ad45298e0bf2947262e8e4d8c94c6180e73b7fc81', 'kind': 'code', 'instructionCount': 22, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00495520', 'evidenceUse': 'new-unique-interval', 'file': 'S2-00495520.asm.txt', 'rawId1Sha256': '427b03ad80eb1190e7b578eb936803badf3701ea34fa20a70ced0b1d7f159dd9'}}, '00496040': {'S1': {'endExclusive': '00496095', 'sha256': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55', 'artifactSha256': 'ccf32cf0ec4aabacdb604e34f674a8585f2c1ecd7190772d2aad227e8c79c3b7', 'kind': 'code', 'instructionCount': 34, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00496040', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-00496040.asm.txt', 'rawId1Sha256': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55'}, 'S2': {'endExclusive': '00496095', 'sha256': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55', 'artifactSha256': 'ccf32cf0ec4aabacdb604e34f674a8585f2c1ecd7190772d2aad227e8c79c3b7', 'kind': 'code', 'instructionCount': 34, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '00496040', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-00496040.asm.txt', 'rawId1Sha256': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55'}}, '004A31E0': {'S1': {'endExclusive': '004A32E5', 'sha256': 'fd7ef4e3bfd60d45a9b9a85e729f77cfc44f945fe5c245285802befdcfa29a58', 'artifactSha256': '3e729c67a6d27a7d786c8d5c151421df714ed3a8d59e845a86f00446398ae5fa', 'kind': 'code', 'instructionCount': 96, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '004A31E0', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-004A31E0.asm.txt', 'rawId1Sha256': 'fd7ef4e3bfd60d45a9b9a85e729f77cfc44f945fe5c245285802befdcfa29a58'}, 'S2': {'endExclusive': '004A32E5', 'sha256': 'fd7ef4e3bfd60d45a9b9a85e729f77cfc44f945fe5c245285802befdcfa29a58', 'artifactSha256': '3e729c67a6d27a7d786c8d5c151421df714ed3a8d59e845a86f00446398ae5fa', 'kind': 'code', 'instructionCount': 96, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '004A31E0', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-004A31E0.asm.txt', 'rawId1Sha256': 'fd7ef4e3bfd60d45a9b9a85e729f77cfc44f945fe5c245285802befdcfa29a58'}}, '004BA1D0': {'S1': {'endExclusive': '004BA485', 'sha256': '70d2f33412b51e4e1337942addf82032c79021ea9c37cf562d95ad144daea67c', 'artifactSha256': '84efc22d01ecf41854fcb15aa23640624c49e72a33b322cfa2a894dc9e5d71a7', 'kind': 'code', 'instructionCount': 236, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '004BA1D0', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-004BA1D0.asm.txt', 'rawId1Sha256': '70d2f33412b51e4e1337942addf82032c79021ea9c37cf562d95ad144daea67c'}, 'S2': {'endExclusive': '004BA485', 'sha256': '70d2f33412b51e4e1337942addf82032c79021ea9c37cf562d95ad144daea67c', 'artifactSha256': '84efc22d01ecf41854fcb15aa23640624c49e72a33b322cfa2a894dc9e5d71a7', 'kind': 'code', 'instructionCount': 236, 'boundaryKind': 'complete-IDB-function', 'ownerFunction': '004BA1D0', 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-004BA1D0.asm.txt', 'rawId1Sha256': '70d2f33412b51e4e1337942addf82032c79021ea9c37cf562d95ad144daea67c'}}, '0079C780': {'S1': {'endExclusive': '0079C7D0', 'sha256': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c', 'artifactSha256': 'df7cb315fe2000845d12542e3092ad09a70cc37a3248020a858bbdb6d3f27f5f', 'kind': 'data', 'instructionCount': 0, 'boundaryKind': 'canonical-person-vtable-prefix', 'ownerFunction': None, 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-0079C780.data.txt', 'rawId1Sha256': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c'}, 'S2': {'endExclusive': '0079C7D0', 'sha256': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c', 'artifactSha256': 'df7cb315fe2000845d12542e3092ad09a70cc37a3248020a858bbdb6d3f27f5f', 'kind': 'data', 'instructionCount': 0, 'boundaryKind': 'canonical-person-vtable-prefix', 'ownerFunction': None, 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-0079C780.data.txt', 'rawId1Sha256': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c'}}, '0079CC18': {'S1': {'endExclusive': '0079CC80', 'sha256': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff', 'artifactSha256': '1e6f0026973996f3d716a1454deaeca399ca9f6105deb9982216c8b7a6a3f9ae', 'kind': 'data', 'instructionCount': 0, 'boundaryKind': 'canonical-common-troop-vtable-prefix', 'ownerFunction': None, 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S1-0079CC18.data.txt', 'rawId1Sha256': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff'}, 'S2': {'endExclusive': '0079CC80', 'sha256': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff', 'artifactSha256': '1e6f0026973996f3d716a1454deaeca399ca9f6105deb9982216c8b7a6a3f9ae', 'kind': 'data', 'instructionCount': 0, 'boundaryKind': 'canonical-common-troop-vtable-prefix', 'ownerFunction': None, 'evidenceUse': 'reused-exact-inherited-interval', 'file': 'S2-0079CC18.data.txt', 'rawId1Sha256': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff'}}}
VERIFICATION_HASHES = {'raw-verification.json': '26e62ad9b1492c4e3bda6e3722f61157d66a8a14b6d128e223513dc797d1e09c', 'recovery-evidence-S1.json': '87e3350298a76c9d238ef30191f643b34156d3e8e38513670949d67fa8108471', 'recovery-evidence-S2.json': 'f5317a94552c3bb5847269673e57b3086810c1fe23be86097f7816321f434f78'}
BUDGET = {'focusedIntervals': 28, 'reusedExactInheritedIntervals': 26, 'newUniqueIntervals': 2, 'codeIntervals': 24, 'completeIDBFunctionIntervals': 24, 'dataIntervals': 4, 'selectedBytesBothSources': 3150, 'instructions': 1010, 'callSites': 126, 'branchSites': 160, 'inheritedSelectedIntervals': 1327, 'allSelectedIntervals': 1329, 'newMachineCodeBytesRecovered': 108}
BOUNDARY_METADATA = {'S1:00495520': {'itemEnd': '00495521', 'name': 'sub_495520'}, 'S1:00495521': {'itemEnd': '00495523', 'name': ''}, 'S1:00495525': {'itemEnd': '00495528', 'name': ''}, 'S1:0049552C': {'itemEnd': '0049552F', 'name': ''}, 'S1:00495535': {'itemEnd': '0049553A', 'name': ''}, 'S1:0049553A': {'itemEnd': '0049553C', 'name': ''}, 'S1:0049553D': {'itemEnd': '00495542', 'name': ''}, 'S1:00495549': {'itemEnd': '0049554F', 'name': ''}, 'S1:00495551': {'itemEnd': '00495554', 'name': 'loc_495551'}, 'S1:00495556': {'itemEnd': '00495560', 'name': ''}, 'S1:00490D00': {'itemEnd': '00490D04', 'name': 'GetArchID'}, 'S1:00490D21': {'itemEnd': '00490D30', 'name': ''}, 'S1:004A31E0': {'itemEnd': '004A31E1', 'name': 'sub_4a31e0'}, 'S1:004A3209': {'itemEnd': '004A320F', 'name': ''}, 'S1:004A3272': {'itemEnd': '004A3278', 'name': ''}, 'S1:004A32E5': {'itemEnd': '004A32F0', 'name': ''}, 'S1:004BA44C': {'itemEnd': '004BA44E', 'name': ''}, 'S1:004BA44E': {'itemEnd': '004BA453', 'name': ''}, 'S1:004BA453': {'itemEnd': '004BA454', 'name': ''}, 'S1:004BA459': {'itemEnd': '004BA45E', 'name': ''}, 'S1:004BA45E': {'itemEnd': '004BA45F', 'name': ''}, 'S1:004BA467': {'itemEnd': '004BA46C', 'name': ''}, 'S1:004BA46C': {'itemEnd': '004BA470', 'name': 'loc_4BA46C'}, 'S2:00495520': {'itemEnd': '00495521', 'name': 'GetBuildingIDOfTroop'}, 'S2:00495521': {'itemEnd': '00495523', 'name': ''}, 'S2:00495525': {'itemEnd': '00495528', 'name': ''}, 'S2:0049552C': {'itemEnd': '0049552F', 'name': ''}, 'S2:00495535': {'itemEnd': '0049553A', 'name': ''}, 'S2:0049553A': {'itemEnd': '0049553C', 'name': ''}, 'S2:0049553D': {'itemEnd': '00495542', 'name': ''}, 'S2:00495549': {'itemEnd': '0049554F', 'name': ''}, 'S2:00495551': {'itemEnd': '00495554', 'name': 'loc_495551'}, 'S2:00495556': {'itemEnd': '00495560', 'name': ''}, 'S2:00490D00': {'itemEnd': '00490D04', 'name': 'GetBuildingPtrFromID'}, 'S2:00490D21': {'itemEnd': '00490D30', 'name': ''}, 'S2:004A31E0': {'itemEnd': '004A31E1', 'name': 'SetPersonBuilding'}, 'S2:004A3209': {'itemEnd': '004A320F', 'name': ''}, 'S2:004A3272': {'itemEnd': '004A3278', 'name': ''}, 'S2:004A32E5': {'itemEnd': '004A32F0', 'name': ''}, 'S2:004BA44C': {'itemEnd': '004BA44E', 'name': ''}, 'S2:004BA44E': {'itemEnd': '004BA453', 'name': ''}, 'S2:004BA453': {'itemEnd': '004BA454', 'name': ''}, 'S2:004BA459': {'itemEnd': '004BA45E', 'name': ''}, 'S2:004BA45E': {'itemEnd': '004BA45F', 'name': ''}, 'S2:004BA467': {'itemEnd': '004BA46C', 'name': ''}, 'S2:004BA46C': {'itemEnd': '004BA470', 'name': 'loc_4BA46C'}}
FUNCTION_REGIONS = {'S1:00495520': [{'start': '00495520', 'endExclusive': '00495556'}], 'S1:004A31E0': [{'start': '004A31E0', 'endExclusive': '004A32E5'}], 'S1:004BA1D0': [{'start': '004BA1D0', 'endExclusive': '004BA485'}], 'S1:00490B00': [{'start': '00490B00', 'endExclusive': '00490B24'}], 'S1:00490D00': [{'start': '00490D00', 'endExclusive': '00490D21'}], 'S1:0047A630': [{'start': '0047A630', 'endExclusive': '0047A656'}], 'S1:00472070': [{'start': '00472070', 'endExclusive': '004720AB'}], 'S1:00496040': [{'start': '00496040', 'endExclusive': '00496095'}], 'S1:004883F0': [{'start': '004883F0', 'endExclusive': '00488422'}], 'S1:00488430': [{'start': '00488430', 'endExclusive': '00488461'}], 'S1:004883D0': [{'start': '004883D0', 'endExclusive': '004883EB'}], 'S1:00468E60': [{'start': '00468E60', 'endExclusive': '00468E66'}], 'S2:00495520': [{'start': '00495520', 'endExclusive': '00495556'}], 'S2:004A31E0': [{'start': '004A31E0', 'endExclusive': '004A32E5'}], 'S2:004BA1D0': [{'start': '004BA1D0', 'endExclusive': '004BA485'}], 'S2:00490B00': [{'start': '00490B00', 'endExclusive': '00490B24'}], 'S2:00490D00': [{'start': '00490D00', 'endExclusive': '00490D21'}], 'S2:0047A630': [{'start': '0047A630', 'endExclusive': '0047A656'}], 'S2:00472070': [{'start': '00472070', 'endExclusive': '004720AB'}], 'S2:00496040': [{'start': '00496040', 'endExclusive': '00496095'}], 'S2:004883F0': [{'start': '004883F0', 'endExclusive': '00488422'}], 'S2:00488430': [{'start': '00488430', 'endExclusive': '00488461'}], 'S2:004883D0': [{'start': '004883D0', 'endExclusive': '004883EB'}], 'S2:00468E60': [{'start': '00468E60', 'endExclusive': '00468E66'}]}
SEMANTICS = {'entry': {'function': '004BA1D0', 'event': 9, 'nativeEntry': '004BA44C', 'nativeExit': '004BA45E', 'excludedEvents': [16, 18], 'policyDomain': 'canonical-live-event9-home-getter-v1'}, 'caller': {'savedTroopRegister': 'ESI', 'getterThisSite': '004BA44C', 'getterCallSite': '004BA44E', 'getter': '00495520', 'scalarPushSite': '004BA453', 'resolverManagerSite': '004BA454', 'resolverManager': 119544152, 'resolverCallSite': '004BA459', 'resolver': '00490D00', 'resultRegister': 'EAX', 'callerParameterStackDeltaAtExit': 0}, 'getter': {'function': '00495520', 'endExclusive': '00495556', 'savedTroopSite': '00495521', 'directTroopSlot': 8, 'directTroopCallSite': '00495525', 'troopWrapperGate': False, 'troopNullOrProbeGate': False, 'raw44Gate': False, 'liveLeaderOffset': 12, 'liveLeaderReadSite': '0049552C', 'leaderResolverSite': '00495535', 'leaderResolver': '00490B00', 'leaderSignedRange': [0, 1099], 'savedPersonSite': '0049553A', 'personValiditySite': '0049553D', 'personValidity': '0047A630', 'personHomeReadSite': '00495549', 'personHomeOffset': 152, 'personHomeWidthBytes': 4, 'falseResult': -1, 'falseResultBits': 4294967295, 'falseResultSite': '00495551', 'calleeReturnPopBytes': 0, 'callerEsiPreserved': True, 'troopLifetime': 'The direct virtual08 uses the live vtable of the same saved troop, with no invented wrapper/null/pointer-probe gate. Unknown08 is one ordered full-frame/RNG effect-query. False retains all callback changes and returns -1. True reads current leader+0C from the same saved troop after the callback. Missing reached storage is an explicit gap.', 'personLifetime': 'Resolve the live leader once, save that exact person pointer in ESI, then validate the saved person once. True reads current DWORD +98 of the same saved person; do not re-read troop leader or select another person after validity.', 'personDomain': 'Canonical person vtables and inherited allocated/status predicate only; no arbitrary person08 callback or vtableAddress extension.'}, 'person': {'canonicalVtable': '0079C780', 'validityFunction': '00488430', 'allocatedFunction': '004883F0', 'kindFunction': '004883D0', 'kindSlot': 44, 'kindArgument': 10, 'allocatedOffset': 380, 'statusOffset': 160, 'statusSignedRange': [0, 8], 'invalidStatusesWhenUnallocated': [6, 8], 'homeField': 'homeBaseId', 'homeOffset': 152, 'homeWidthBytes': 4, 'homeSignedDomain': [-2147483648, 2147483647], 'identityProofFunction': '004A31E0', 'identityProofEndExclusive': '004A32E5', 'identityProofSavedPersonSite': '004A31E1', 'identityProofOldHomeReadSite': '004A3209', 'identityProofHomeStoreSite': '004A3272', 'identityProofValueRegister': 'EBP', 'force98SameField': False}, 'buildingResolver': {'function': '00490D00', 'endExclusive': '00490D21', 'signedRange': [0, 16383], 'manager': 119544152, 'baseOffset': 562992, 'stride': 56, 'invalidResult': None, 'returnPopBytes': 4, 'purelyNumeric': True, 'buildingStorageRead': False, 'buildingValidityRead': False, 'virtual08Call': False}, 'boundary': {'presentationEntry': '004BA411', 'presentationExit': '004BA432', 'presentationClassification': 'unchanged whole combined full-frame/RNG observation', 'forceResetEntry': '004BA432', 'forceResetExit': '004BA442', 'troopResetEntry': '004BA442', 'troopResetExit': '004BA44C', 'getterEntry': '004BA44C', 'getterExit': '004BA45E', 'remainderEntry': '004BA45E', 'remainderExit': '004BA46C', 'remainderClassification': 'whole-frame/RNG event9-reaction-remainder observation', 'remainderCalls': ['004AD220'], 'remainderArgumentSites': ['004BA45E', '004BA45F', '004BA461'], 'remainderStackArguments': ['saved troop ESI', 4, 'resolved building pointer EAX'], 'remainderManagerSite': '004BA462', 'remainderManager': 127502684, 'remainderCallSite': '004BA467', 'savedContext': ['original manager', 'troop pointer', 'saved force pointer', 'event-memory domain', 'saved subject', 'saved target', 'old/new scalars', 'pre-presentation saved raw44', 'saved next-node cursor', 'returned signed home scalar', 'resolved numeric building pointer'], 'temporaryObject': 'Caller message-object bytes remain in stack storage. Argument cleanup proves neither destruction nor absence of aliasing or asynchronous retention. Later consumers of unrepresented temporary/formatter state remain open.'}, 'platform': 'Fixed readable canonical slots and inherited successful unchanged read/write pointer probes; no event-argument/control-stack/saved-local corruption, native SEH or concurrency certification.', 'excluded': ['reaction45E..46C native body execution and 004AD220 -> 005A8D20 effects', 'event16/18 and mutable event-argument protocol', 'presentation native body/formatter/temporary retention execution', 'unknown virtual body execution and arbitrary person virtuals', 'capture/surrender/captive/extinction and recursive ownership', 'positive refunds/resources', 'S2 patched presentation behavior', 'global RNG, runtime, clean-stock, Vanilla and console certification']}
CALL_LEDGERS = {'S1': {'00468E60': [], '00472070': [{'site': '00472080', 'bytes': 'ff 15 68 e2 74 00', 'kind': 'indirect', 'operand': 'dword ptr [0x74e268]'}, {'site': '00472094', 'bytes': 'ff 15 6c e2 74 00', 'kind': 'indirect', 'operand': 'dword ptr [0x74e26c]'}], '0047A630': [{'site': '0047A63E', 'bytes': 'e8 2d 7a ff ff', 'kind': 'direct', 'target': '00472070'}], '004883D0': [], '004883F0': [{'site': '004883F7', 'bytes': 'ff 50 2c', 'kind': 'indirect', 'operand': 'dword ptr [eax + 0x2c]'}], '00488430': [{'site': '00488435', 'bytes': 'ff 50 04', 'kind': 'indirect', 'operand': 'dword ptr [eax + 4]'}], '00490B00': [], '00490D00': [], '00495520': [{'site': '00495525', 'bytes': 'ff 50 08', 'kind': 'indirect', 'operand': 'dword ptr [eax + 8]'}, {'site': '00495535', 'bytes': 'e8 c6 b5 ff ff', 'kind': 'direct', 'target': '00490B00'}, {'site': '0049553D', 'bytes': 'e8 ee 50 fe ff', 'kind': 'direct', 'target': '0047A630'}], '00496040': [{'site': '00496045', 'bytes': 'ff 50 24', 'kind': 'indirect', 'operand': 'dword ptr [eax + 0x24]'}, {'site': '00496056', 'bytes': 'e8 a5 aa ff ff', 'kind': 'direct', 'target': '00490B00'}, {'site': '0049605C', 'bytes': 'e8 cf 45 fe ff', 'kind': 'direct', 'target': '0047A630'}], '004A31E0': [{'site': '004A31E6', 'bytes': 'e8 15 74 fd ff', 'kind': 'direct', 'target': '0047A600'}, {'site': '004A3202', 'bytes': 'e8 f9 da fe ff', 'kind': 'direct', 'target': '00490D00'}, {'site': '004A3215', 'bytes': 'e8 e6 da fe ff', 'kind': 'direct', 'target': '00490D00'}, {'site': '004A322F', 'bytes': 'e8 2c 35 fe ff', 'kind': 'direct', 'target': '00486760'}, {'site': '004A3236', 'bytes': 'e8 e5 34 fe ff', 'kind': 'direct', 'target': '00486720'}, {'site': '004A323E', 'bytes': 'e8 ed 73 fd ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004A324F', 'bytes': 'e8 9c 34 fe ff', 'kind': 'direct', 'target': '004866F0'}, {'site': '004A3257', 'bytes': 'e8 d4 73 fd ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004A326A', 'bytes': 'e8 41 fa ff ff', 'kind': 'direct', 'target': '004A2CB0'}, {'site': '004A328A', 'bytes': 'e8 d1 34 fe ff', 'kind': 'direct', 'target': '00486760'}, {'site': '004A3293', 'bytes': 'e8 88 34 fe ff', 'kind': 'direct', 'target': '00486720'}, {'site': '004A329B', 'bytes': 'e8 90 73 fd ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004A32AE', 'bytes': 'e8 3d 34 fe ff', 'kind': 'direct', 'target': '004866F0'}, {'site': '004A32B6', 'bytes': 'e8 75 73 fd ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004A32CB', 'bytes': 'e8 e0 8e fd ff', 'kind': 'direct', 'target': '0047C1B0'}, {'site': '004A32DA', 'bytes': 'e8 71 9a fd ff', 'kind': 'direct', 'target': '0047CD50'}], '004BA1D0': [{'site': '004BA216', 'bytes': 'e8 c5 e2 09 00', 'kind': 'direct', 'target': '005584E0'}, {'site': '004BA21E', 'bytes': 'ff 53 2c', 'kind': 'indirect', 'operand': 'dword ptr [ebx + 0x2c]'}, {'site': '004BA231', 'bytes': 'e8 3a 70 fd ff', 'kind': 'direct', 'target': '00491270'}, {'site': '004BA243', 'bytes': 'e8 98 e2 09 00', 'kind': 'direct', 'target': '005584E0'}, {'site': '004BA24B', 'bytes': 'ff 57 2c', 'kind': 'indirect', 'operand': 'dword ptr [edi + 0x2c]'}, {'site': '004BA25A', 'bytes': 'e8 11 70 fd ff', 'kind': 'direct', 'target': '00491270'}, {'site': '004BA270', 'bytes': 'e8 fb 91 0b 00', 'kind': 'direct', 'target': '00573470'}, {'site': '004BA278', 'bytes': 'ff 57 2c', 'kind': 'indirect', 'operand': 'dword ptr [edi + 0x2c]'}, {'site': '004BA2A0', 'bytes': 'e8 1b 80 fd ff', 'kind': 'direct', 'target': '004922C0'}, {'site': '004BA2A8', 'bytes': 'e8 83 03 fc ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004BA2CE', 'bytes': 'e8 0d ba fd ff', 'kind': 'direct', 'target': '00495CE0'}, {'site': '004BA2DB', 'bytes': 'e8 90 91 0b 00', 'kind': 'direct', 'target': '00573470'}, {'site': '004BA2E3', 'bytes': 'ff 55 2c', 'kind': 'indirect', 'operand': 'dword ptr [ebp + 0x2c]'}, {'site': '004BA2F1', 'bytes': 'e8 3a 03 fc ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004BA307', 'bytes': 'ff 52 40', 'kind': 'indirect', 'operand': 'dword ptr [edx + 0x40]'}, {'site': '004BA318', 'bytes': 'ff 50 40', 'kind': 'indirect', 'operand': 'dword ptr [eax + 0x40]'}, {'site': '004BA323', 'bytes': 'ff 52 40', 'kind': 'indirect', 'operand': 'dword ptr [edx + 0x40]'}, {'site': '004BA338', 'bytes': 'ff 50 40', 'kind': 'indirect', 'operand': 'dword ptr [eax + 0x40]'}, {'site': '004BA34B', 'bytes': 'e8 50 67 fd ff', 'kind': 'direct', 'target': '00490AA0'}, {'site': '004BA356', 'bytes': 'ff 52 48', 'kind': 'indirect', 'operand': 'dword ptr [edx + 0x48]'}, {'site': '004BA35E', 'bytes': 'e8 cd 02 fc ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004BA372', 'bytes': 'ff 50 48', 'kind': 'indirect', 'operand': 'dword ptr [eax + 0x48]'}, {'site': '004BA3A3', 'bytes': 'e8 f8 66 fd ff', 'kind': 'direct', 'target': '00490AA0'}, {'site': '004BA3B6', 'bytes': 'e8 e5 66 fd ff', 'kind': 'direct', 'target': '00490AA0'}, {'site': '004BA3C6', 'bytes': 'e8 85 ef ff ff', 'kind': 'direct', 'target': '004B9350'}, {'site': '004BA3D7', 'bytes': 'e8 c4 66 fd ff', 'kind': 'direct', 'target': '00490AA0'}, {'site': '004BA3EA', 'bytes': 'e8 b1 66 fd ff', 'kind': 'direct', 'target': '00490AA0'}, {'site': '004BA3FD', 'bytes': 'e8 4e ef ff ff', 'kind': 'direct', 'target': '004B9350'}, {'site': '004BA405', 'bytes': 'e8 26 02 fc ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004BA424', 'bytes': 'e8 17 76 10 00', 'kind': 'direct', 'target': '005C1A40'}, {'site': '004BA42A', 'bytes': 'e8 b1 b1 03 00', 'kind': 'direct', 'target': '004F55E0'}, {'site': '004BA43D', 'bytes': 'e8 de ab ff ff', 'kind': 'direct', 'target': '004B5020'}, {'site': '004BA447', 'bytes': 'e8 64 2e ff ff', 'kind': 'direct', 'target': '004AD2B0'}, {'site': '004BA44E', 'bytes': 'e8 cd b0 fd ff', 'kind': 'direct', 'target': '00495520'}, {'site': '004BA459', 'bytes': 'e8 a2 68 fd ff', 'kind': 'direct', 'target': '00490D00'}, {'site': '004BA467', 'bytes': 'e8 b4 2d ff ff', 'kind': 'direct', 'target': '004AD220'}], '0079C780': [], '0079CC18': []}, 'S2': {'00468E60': [], '00472070': [{'site': '00472080', 'bytes': 'ff 15 68 e2 74 00', 'kind': 'indirect', 'operand': 'dword ptr [0x74e268]'}, {'site': '00472094', 'bytes': 'ff 15 6c e2 74 00', 'kind': 'indirect', 'operand': 'dword ptr [0x74e26c]'}], '0047A630': [{'site': '0047A63E', 'bytes': 'e8 2d 7a ff ff', 'kind': 'direct', 'target': '00472070'}], '004883D0': [], '004883F0': [{'site': '004883F7', 'bytes': 'ff 50 2c', 'kind': 'indirect', 'operand': 'dword ptr [eax + 0x2c]'}], '00488430': [{'site': '00488435', 'bytes': 'ff 50 04', 'kind': 'indirect', 'operand': 'dword ptr [eax + 4]'}], '00490B00': [], '00490D00': [], '00495520': [{'site': '00495525', 'bytes': 'ff 50 08', 'kind': 'indirect', 'operand': 'dword ptr [eax + 8]'}, {'site': '00495535', 'bytes': 'e8 c6 b5 ff ff', 'kind': 'direct', 'target': '00490B00'}, {'site': '0049553D', 'bytes': 'e8 ee 50 fe ff', 'kind': 'direct', 'target': '0047A630'}], '00496040': [{'site': '00496045', 'bytes': 'ff 50 24', 'kind': 'indirect', 'operand': 'dword ptr [eax + 0x24]'}, {'site': '00496056', 'bytes': 'e8 a5 aa ff ff', 'kind': 'direct', 'target': '00490B00'}, {'site': '0049605C', 'bytes': 'e8 cf 45 fe ff', 'kind': 'direct', 'target': '0047A630'}], '004A31E0': [{'site': '004A31E6', 'bytes': 'e8 15 74 fd ff', 'kind': 'direct', 'target': '0047A600'}, {'site': '004A3202', 'bytes': 'e8 f9 da fe ff', 'kind': 'direct', 'target': '00490D00'}, {'site': '004A3215', 'bytes': 'e8 e6 da fe ff', 'kind': 'direct', 'target': '00490D00'}, {'site': '004A322F', 'bytes': 'e8 2c 35 fe ff', 'kind': 'direct', 'target': '00486760'}, {'site': '004A3236', 'bytes': 'e8 e5 34 fe ff', 'kind': 'direct', 'target': '00486720'}, {'site': '004A323E', 'bytes': 'e8 ed 73 fd ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004A324F', 'bytes': 'e8 9c 34 fe ff', 'kind': 'direct', 'target': '004866F0'}, {'site': '004A3257', 'bytes': 'e8 d4 73 fd ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004A326A', 'bytes': 'e8 41 fa ff ff', 'kind': 'direct', 'target': '004A2CB0'}, {'site': '004A328A', 'bytes': 'e8 d1 34 fe ff', 'kind': 'direct', 'target': '00486760'}, {'site': '004A3293', 'bytes': 'e8 88 34 fe ff', 'kind': 'direct', 'target': '00486720'}, {'site': '004A329B', 'bytes': 'e8 90 73 fd ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004A32AE', 'bytes': 'e8 3d 34 fe ff', 'kind': 'direct', 'target': '004866F0'}, {'site': '004A32B6', 'bytes': 'e8 75 73 fd ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004A32CB', 'bytes': 'e8 e0 8e fd ff', 'kind': 'direct', 'target': '0047C1B0'}, {'site': '004A32DA', 'bytes': 'e8 71 9a fd ff', 'kind': 'direct', 'target': '0047CD50'}], '004BA1D0': [{'site': '004BA216', 'bytes': 'e8 c5 e2 09 00', 'kind': 'direct', 'target': '005584E0'}, {'site': '004BA21E', 'bytes': 'ff 53 2c', 'kind': 'indirect', 'operand': 'dword ptr [ebx + 0x2c]'}, {'site': '004BA231', 'bytes': 'e8 3a 70 fd ff', 'kind': 'direct', 'target': '00491270'}, {'site': '004BA243', 'bytes': 'e8 98 e2 09 00', 'kind': 'direct', 'target': '005584E0'}, {'site': '004BA24B', 'bytes': 'ff 57 2c', 'kind': 'indirect', 'operand': 'dword ptr [edi + 0x2c]'}, {'site': '004BA25A', 'bytes': 'e8 11 70 fd ff', 'kind': 'direct', 'target': '00491270'}, {'site': '004BA270', 'bytes': 'e8 fb 91 0b 00', 'kind': 'direct', 'target': '00573470'}, {'site': '004BA278', 'bytes': 'ff 57 2c', 'kind': 'indirect', 'operand': 'dword ptr [edi + 0x2c]'}, {'site': '004BA2A0', 'bytes': 'e8 1b 80 fd ff', 'kind': 'direct', 'target': '004922C0'}, {'site': '004BA2A8', 'bytes': 'e8 83 03 fc ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004BA2CE', 'bytes': 'e8 0d ba fd ff', 'kind': 'direct', 'target': '00495CE0'}, {'site': '004BA2DB', 'bytes': 'e8 90 91 0b 00', 'kind': 'direct', 'target': '00573470'}, {'site': '004BA2E3', 'bytes': 'ff 55 2c', 'kind': 'indirect', 'operand': 'dword ptr [ebp + 0x2c]'}, {'site': '004BA2F1', 'bytes': 'e8 3a 03 fc ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004BA307', 'bytes': 'ff 52 40', 'kind': 'indirect', 'operand': 'dword ptr [edx + 0x40]'}, {'site': '004BA318', 'bytes': 'ff 50 40', 'kind': 'indirect', 'operand': 'dword ptr [eax + 0x40]'}, {'site': '004BA323', 'bytes': 'ff 52 40', 'kind': 'indirect', 'operand': 'dword ptr [edx + 0x40]'}, {'site': '004BA338', 'bytes': 'ff 50 40', 'kind': 'indirect', 'operand': 'dword ptr [eax + 0x40]'}, {'site': '004BA34B', 'bytes': 'e8 50 67 fd ff', 'kind': 'direct', 'target': '00490AA0'}, {'site': '004BA356', 'bytes': 'ff 52 48', 'kind': 'indirect', 'operand': 'dword ptr [edx + 0x48]'}, {'site': '004BA35E', 'bytes': 'e8 cd 02 fc ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004BA372', 'bytes': 'ff 50 48', 'kind': 'indirect', 'operand': 'dword ptr [eax + 0x48]'}, {'site': '004BA3A3', 'bytes': 'e8 f8 66 fd ff', 'kind': 'direct', 'target': '00490AA0'}, {'site': '004BA3B6', 'bytes': 'e8 e5 66 fd ff', 'kind': 'direct', 'target': '00490AA0'}, {'site': '004BA3C6', 'bytes': 'e8 85 ef ff ff', 'kind': 'direct', 'target': '004B9350'}, {'site': '004BA3D7', 'bytes': 'e8 c4 66 fd ff', 'kind': 'direct', 'target': '00490AA0'}, {'site': '004BA3EA', 'bytes': 'e8 b1 66 fd ff', 'kind': 'direct', 'target': '00490AA0'}, {'site': '004BA3FD', 'bytes': 'e8 4e ef ff ff', 'kind': 'direct', 'target': '004B9350'}, {'site': '004BA405', 'bytes': 'e8 26 02 fc ff', 'kind': 'direct', 'target': '0047A630'}, {'site': '004BA424', 'bytes': 'e8 17 76 10 00', 'kind': 'direct', 'target': '005C1A40'}, {'site': '004BA42A', 'bytes': 'e8 b1 b1 03 00', 'kind': 'direct', 'target': '004F55E0'}, {'site': '004BA43D', 'bytes': 'e8 de ab ff ff', 'kind': 'direct', 'target': '004B5020'}, {'site': '004BA447', 'bytes': 'e8 64 2e ff ff', 'kind': 'direct', 'target': '004AD2B0'}, {'site': '004BA44E', 'bytes': 'e8 cd b0 fd ff', 'kind': 'direct', 'target': '00495520'}, {'site': '004BA459', 'bytes': 'e8 a2 68 fd ff', 'kind': 'direct', 'target': '00490D00'}, {'site': '004BA467', 'bytes': 'e8 b4 2d ff ff', 'kind': 'direct', 'target': '004AD220'}], '0079C780': [], '0079CC18': []}}
BRANCH_LEDGERS = {'S1': {'00468E60': [], '00472070': [{'site': '00472078', 'bytes': '74 2c', 'target': '004720A6'}, {'site': '00472088', 'bytes': '75 1c', 'target': '004720A6'}, {'site': '00472090', 'bytes': '74 0c', 'target': '0047209E'}, {'site': '0047209C', 'bytes': '75 08', 'target': '004720A6'}], '0047A630': [{'site': '0047A637', 'bytes': '74 11', 'target': '0047A64A'}, {'site': '0047A648', 'bytes': '75 04', 'target': '0047A64E'}], '004883D0': [{'site': '004883D7', 'bytes': '74 0a', 'target': '004883E3'}, {'site': '004883DC', 'bytes': '74 05', 'target': '004883E3'}], '004883F0': [{'site': '004883FC', 'bytes': '74 19', 'target': '00488417'}, {'site': '00488406', 'bytes': '75 13', 'target': '0048841B'}, {'site': '00488410', 'bytes': '7c 05', 'target': '00488417'}, {'site': '00488415', 'bytes': '7e 04', 'target': '0048841B'}], '00488430': [{'site': '0048843A', 'bytes': '74 21', 'target': '0048845D'}, {'site': '00488444', 'bytes': '75 10', 'target': '00488456'}, {'site': '0048844F', 'bytes': '74 0c', 'target': '0048845D'}, {'site': '00488454', 'bytes': '74 07', 'target': '0048845D'}], '00490B00': [{'site': '00490B06', 'bytes': '7c 17', 'target': '00490B1F'}, {'site': '00490B0D', 'bytes': '7f 10', 'target': '00490B1F'}], '00490D00': [{'site': '00490D06', 'bytes': '7c 14', 'target': '00490D1C'}, {'site': '00490D0D', 'bytes': '7f 0d', 'target': '00490D1C'}], '00495520': [{'site': '0049552A', 'bytes': '74 25', 'target': '00495551'}, {'site': '00495547', 'bytes': '74 08', 'target': '00495551'}], '00496040': [{'site': '0049604B', 'bytes': '75 44', 'target': '00496091'}, {'site': '00496066', 'bytes': '74 29', 'target': '00496091'}, {'site': '00496072', 'bytes': '7c 0d', 'target': '00496081'}, {'site': '00496077', 'bytes': '7d 08', 'target': '00496081'}, {'site': '0049607F', 'bytes': '7d 10', 'target': '00496091'}, {'site': '00496088', 'bytes': '7c e6', 'target': '00496070'}], '004A31E0': [{'site': '004A31F0', 'bytes': '0f 84 eb 00 00 00', 'target': '004A32E1'}, {'site': '004A321E', 'bytes': '74 50', 'target': '004A3270'}, {'site': '004A3227', 'bytes': '74 26', 'target': '004A324F'}, {'site': '004A322A', 'bytes': '74 0a', 'target': '004A3236'}, {'site': '004A322D', 'bytes': '75 40', 'target': '004A326F'}, {'site': '004A3234', 'bytes': 'eb 05', 'target': '004A323B'}, {'site': '004A3248', 'bytes': '74 25', 'target': '004A326F'}, {'site': '004A324D', 'bytes': 'eb 1a', 'target': '004A3269'}, {'site': '004A3261', 'bytes': '74 0c', 'target': '004A326F'}, {'site': '004A3278', 'bytes': '74 65', 'target': '004A32DF'}, {'site': '004A3280', 'bytes': '74 2a', 'target': '004A32AC'}, {'site': '004A3283', 'bytes': '74 0c', 'target': '004A3291'}, {'site': '004A3286', 'bytes': '75 57', 'target': '004A32DF'}, {'site': '004A328F', 'bytes': 'eb 07', 'target': '004A3298'}, {'site': '004A32A5', 'bytes': '74 38', 'target': '004A32DF'}, {'site': '004A32AA', 'bytes': 'eb 1c', 'target': '004A32C8'}, {'site': '004A32C0', 'bytes': '74 1d', 'target': '004A32DF'}], '004BA1D0': [{'site': '004BA1FD', 'bytes': '74 68', 'target': '004BA267'}, {'site': '004BA202', 'bytes': '74 09', 'target': '004BA20D'}, {'site': '004BA207', 'bytes': '0f 85 6b 02 00 00', 'target': '004BA478'}, {'site': '004BA212', 'bytes': '74 15', 'target': '004BA229'}, {'site': '004BA223', 'bytes': '74 04', 'target': '004BA229'}, {'site': '004BA227', 'bytes': 'eb 02', 'target': '004BA22B'}, {'site': '004BA23F', 'bytes': '74 11', 'target': '004BA252'}, {'site': '004BA250', 'bytes': '75 02', 'target': '004BA254'}, {'site': '004BA265', 'bytes': 'eb 1e', 'target': '004BA285'}, {'site': '004BA26C', 'bytes': '74 11', 'target': '004BA27F'}, {'site': '004BA27D', 'bytes': '75 02', 'target': '004BA281'}, {'site': '004BA290', 'bytes': '0f 84 e2 01 00 00', 'target': '004BA478'}, {'site': '004BA2B2', 'bytes': '0f 84 b4 01 00 00', 'target': '004BA46C'}, {'site': '004BA2BD', 'bytes': '0f 8c a9 01 00 00', 'target': '004BA46C'}, {'site': '004BA2C6', 'bytes': '0f 8f a0 01 00 00', 'target': '004BA46C'}, {'site': '004BA2D7', 'bytes': '74 15', 'target': '004BA2EE'}, {'site': '004BA2EC', 'bytes': '75 02', 'target': '004BA2F0'}, {'site': '004BA2FB', 'bytes': '74 48', 'target': '004BA345'}, {'site': '004BA301', 'bytes': '74 42', 'target': '004BA345'}, {'site': '004BA30E', 'bytes': '75 0f', 'target': '004BA31F'}, {'site': '004BA312', 'bytes': '74 31', 'target': '004BA345'}, {'site': '004BA31D', 'bytes': 'eb 20', 'target': '004BA33F'}, {'site': '004BA328', 'bytes': '0f 85 3e 01 00 00', 'target': '004BA46C'}, {'site': '004BA332', 'bytes': '74 11', 'target': '004BA345'}, {'site': '004BA33F', 'bytes': '0f 85 27 01 00 00', 'target': '004BA46C'}, {'site': '004BA35B', 'bytes': '75 20', 'target': '004BA37D'}, {'site': '004BA368', 'bytes': '0f 84 c4 00 00 00', 'target': '004BA432'}, {'site': '004BA377', 'bytes': '0f 84 b5 00 00 00', 'target': '004BA432'}, {'site': '004BA389', 'bytes': '74 79', 'target': '004BA404'}, {'site': '004BA38E', 'bytes': '74 3d', 'target': '004BA3CD'}, {'site': '004BA393', 'bytes': '0f 85 99 00 00 00', 'target': '004BA432'}, {'site': '004BA3CB', 'bytes': 'eb 5c', 'target': '004BA429'}, {'site': '004BA402', 'bytes': 'eb 25', 'target': '004BA429'}, {'site': '004BA40F', 'bytes': '74 21', 'target': '004BA432'}, {'site': '004BA472', 'bytes': '0f 85 1e fe ff ff', 'target': '004BA296'}], '0079C780': [], '0079CC18': []}, 'S2': {'00468E60': [], '00472070': [{'site': '00472078', 'bytes': '74 2c', 'target': '004720A6'}, {'site': '00472088', 'bytes': '75 1c', 'target': '004720A6'}, {'site': '00472090', 'bytes': '74 0c', 'target': '0047209E'}, {'site': '0047209C', 'bytes': '75 08', 'target': '004720A6'}], '0047A630': [{'site': '0047A637', 'bytes': '74 11', 'target': '0047A64A'}, {'site': '0047A648', 'bytes': '75 04', 'target': '0047A64E'}], '004883D0': [{'site': '004883D7', 'bytes': '74 0a', 'target': '004883E3'}, {'site': '004883DC', 'bytes': '74 05', 'target': '004883E3'}], '004883F0': [{'site': '004883FC', 'bytes': '74 19', 'target': '00488417'}, {'site': '00488406', 'bytes': '75 13', 'target': '0048841B'}, {'site': '00488410', 'bytes': '7c 05', 'target': '00488417'}, {'site': '00488415', 'bytes': '7e 04', 'target': '0048841B'}], '00488430': [{'site': '0048843A', 'bytes': '74 21', 'target': '0048845D'}, {'site': '00488444', 'bytes': '75 10', 'target': '00488456'}, {'site': '0048844F', 'bytes': '74 0c', 'target': '0048845D'}, {'site': '00488454', 'bytes': '74 07', 'target': '0048845D'}], '00490B00': [{'site': '00490B06', 'bytes': '7c 17', 'target': '00490B1F'}, {'site': '00490B0D', 'bytes': '7f 10', 'target': '00490B1F'}], '00490D00': [{'site': '00490D06', 'bytes': '7c 14', 'target': '00490D1C'}, {'site': '00490D0D', 'bytes': '7f 0d', 'target': '00490D1C'}], '00495520': [{'site': '0049552A', 'bytes': '74 25', 'target': '00495551'}, {'site': '00495547', 'bytes': '74 08', 'target': '00495551'}], '00496040': [{'site': '0049604B', 'bytes': '75 44', 'target': '00496091'}, {'site': '00496066', 'bytes': '74 29', 'target': '00496091'}, {'site': '00496072', 'bytes': '7c 0d', 'target': '00496081'}, {'site': '00496077', 'bytes': '7d 08', 'target': '00496081'}, {'site': '0049607F', 'bytes': '7d 10', 'target': '00496091'}, {'site': '00496088', 'bytes': '7c e6', 'target': '00496070'}], '004A31E0': [{'site': '004A31F0', 'bytes': '0f 84 eb 00 00 00', 'target': '004A32E1'}, {'site': '004A321E', 'bytes': '74 50', 'target': '004A3270'}, {'site': '004A3227', 'bytes': '74 26', 'target': '004A324F'}, {'site': '004A322A', 'bytes': '74 0a', 'target': '004A3236'}, {'site': '004A322D', 'bytes': '75 40', 'target': '004A326F'}, {'site': '004A3234', 'bytes': 'eb 05', 'target': '004A323B'}, {'site': '004A3248', 'bytes': '74 25', 'target': '004A326F'}, {'site': '004A324D', 'bytes': 'eb 1a', 'target': '004A3269'}, {'site': '004A3261', 'bytes': '74 0c', 'target': '004A326F'}, {'site': '004A3278', 'bytes': '74 65', 'target': '004A32DF'}, {'site': '004A3280', 'bytes': '74 2a', 'target': '004A32AC'}, {'site': '004A3283', 'bytes': '74 0c', 'target': '004A3291'}, {'site': '004A3286', 'bytes': '75 57', 'target': '004A32DF'}, {'site': '004A328F', 'bytes': 'eb 07', 'target': '004A3298'}, {'site': '004A32A5', 'bytes': '74 38', 'target': '004A32DF'}, {'site': '004A32AA', 'bytes': 'eb 1c', 'target': '004A32C8'}, {'site': '004A32C0', 'bytes': '74 1d', 'target': '004A32DF'}], '004BA1D0': [{'site': '004BA1FD', 'bytes': '74 68', 'target': '004BA267'}, {'site': '004BA202', 'bytes': '74 09', 'target': '004BA20D'}, {'site': '004BA207', 'bytes': '0f 85 6b 02 00 00', 'target': '004BA478'}, {'site': '004BA212', 'bytes': '74 15', 'target': '004BA229'}, {'site': '004BA223', 'bytes': '74 04', 'target': '004BA229'}, {'site': '004BA227', 'bytes': 'eb 02', 'target': '004BA22B'}, {'site': '004BA23F', 'bytes': '74 11', 'target': '004BA252'}, {'site': '004BA250', 'bytes': '75 02', 'target': '004BA254'}, {'site': '004BA265', 'bytes': 'eb 1e', 'target': '004BA285'}, {'site': '004BA26C', 'bytes': '74 11', 'target': '004BA27F'}, {'site': '004BA27D', 'bytes': '75 02', 'target': '004BA281'}, {'site': '004BA290', 'bytes': '0f 84 e2 01 00 00', 'target': '004BA478'}, {'site': '004BA2B2', 'bytes': '0f 84 b4 01 00 00', 'target': '004BA46C'}, {'site': '004BA2BD', 'bytes': '0f 8c a9 01 00 00', 'target': '004BA46C'}, {'site': '004BA2C6', 'bytes': '0f 8f a0 01 00 00', 'target': '004BA46C'}, {'site': '004BA2D7', 'bytes': '74 15', 'target': '004BA2EE'}, {'site': '004BA2EC', 'bytes': '75 02', 'target': '004BA2F0'}, {'site': '004BA2FB', 'bytes': '74 48', 'target': '004BA345'}, {'site': '004BA301', 'bytes': '74 42', 'target': '004BA345'}, {'site': '004BA30E', 'bytes': '75 0f', 'target': '004BA31F'}, {'site': '004BA312', 'bytes': '74 31', 'target': '004BA345'}, {'site': '004BA31D', 'bytes': 'eb 20', 'target': '004BA33F'}, {'site': '004BA328', 'bytes': '0f 85 3e 01 00 00', 'target': '004BA46C'}, {'site': '004BA332', 'bytes': '74 11', 'target': '004BA345'}, {'site': '004BA33F', 'bytes': '0f 85 27 01 00 00', 'target': '004BA46C'}, {'site': '004BA35B', 'bytes': '75 20', 'target': '004BA37D'}, {'site': '004BA368', 'bytes': '0f 84 c4 00 00 00', 'target': '004BA432'}, {'site': '004BA377', 'bytes': '0f 84 b5 00 00 00', 'target': '004BA432'}, {'site': '004BA389', 'bytes': '74 79', 'target': '004BA404'}, {'site': '004BA38E', 'bytes': '74 3d', 'target': '004BA3CD'}, {'site': '004BA393', 'bytes': '0f 85 99 00 00 00', 'target': '004BA432'}, {'site': '004BA3CB', 'bytes': 'eb 5c', 'target': '004BA429'}, {'site': '004BA402', 'bytes': 'eb 25', 'target': '004BA429'}, {'site': '004BA40F', 'bytes': '74 21', 'target': '004BA432'}, {'site': '004BA472', 'bytes': '0f 85 1e fe ff ff', 'target': '004BA296'}], '0079C780': [], '0079CC18': []}}
IMPORT_METADATA = {'S1': {'0074E35C': {'name': 'LeaveCriticalSection', 'idapythonBytes': '00000000', 'rawId1LowBytes': '6ca64900', 'runtimeValueCertified': False}, '0074E360': {'name': 'EnterCriticalSection', 'idapythonBytes': '00000000', 'rawId1LowBytes': '54a64900', 'runtimeValueCertified': False}}, 'S2': {'0074E35C': {'name': 'LeaveCriticalSection', 'idapythonBytes': '00000000', 'rawId1LowBytes': '00000000', 'runtimeValueCertified': False}, '0074E360': {'name': 'EnterCriticalSection', 'idapythonBytes': '00000000', 'rawId1LowBytes': '00000000', 'runtimeValueCertified': False}}}

def artifact_rows(row, supplied_text=None):
    pin=BODY_HASHES[row['start']][row['source']]
    assert row==dict(source=row['source'],start=row['start'],**pin)
    path=(DIRECTORY/row['file']).resolve();assert path.is_relative_to(DIRECTORY)
    encoded=path.read_bytes() if supplied_text is None else supplied_text.encode()
    assert digest(encoded)==pin['artifactSha256']
    expected=int(row['start'],16);rows=[]
    for line in encoded.decode().splitlines():
        tokens=line.split();assert tokens
        a=int(tokens[0],16);end=1
        while end<len(tokens) and re.fullmatch('[0-9a-fA-F]{2}',tokens[end]):end+=1
        b=bytes.fromhex(' '.join(tokens[1:end]));assert b and a==expected
        rows.append((a,b,' '.join(tokens[end:])));expected+=len(b)
    assert expected==int(row['endExclusive'],16)
    raw=b''.join(b for a,b,t in rows)
    assert digest(raw)==row['sha256']==row['rawId1Sha256']
    return raw,rows


def validate_metadata(e):
    assert e['profileId']=='source-idb-S1-S2-native-event9-home-getter-v1'
    assert e['frameProfileId']=='source-idb-S1-S2-native-event9-home-getter-frame-v1'
    assert e['baselineCommit']==BASELINE
    assert {r['path']:r['sha256'] for r in [e['priorEvidence']]+e['retainedFiles']}==PINS
    assert e['semantics']==SEMANTICS
    assert e['functionRegions']==FUNCTION_REGIONS
    assert e['boundaryMetadata']==BOUNDARY_METADATA
    assert e['callLedgers']==CALL_LEDGERS
    assert e['branchLedgers']==BRANCH_LEDGERS
    assert e['importSlotMetadata']==IMPORT_METADATA
    assert e['rangeBudget']==BUDGET
    assert len(e['ranges'])==len({(r['source'],r['start']) for r in e['ranges']})==BUDGET['focusedIntervals']
    assert {(r['source'],r['start']) for r in e['ranges']}=={(s,a) for a,d in BODY_HASHES.items() for s in d}
    for r in e['ranges']:assert r==dict(source=r['source'],start=r['start'],**BODY_HASHES[r['start']][r['source']])
    for k in ['stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified','rawRuntimeMapCaptured']:assert e[k] is False
    assert {r['file']:r['sha256'] for r in e['provenance']['verificationArtifacts']}==VERIFICATION_HASHES


def load_evidence():
    e=json.loads(MANIFEST.read_text());validate_metadata(e)
    for path,expected in PINS.items():assert digest((ROOT/path).read_bytes())==expected,path
    prior=load_prior();selected=dict(prior[4]);raw={};rows={}
    assert e['sources']==prior[0]['sources'];assert e['adoption']==prior[0]['adoption']
    for r in e['ranges']:
        key=r['source'],r['start'];assert key not in raw
        raw[key],rows[key]=artifact_rows(r);fullkey=key+(r['endExclusive'],)
        if fullkey in selected:
            assert selected[fullkey]==raw[key]
            assert r['evidenceUse']=='reused-exact-inherited-interval'
        else:assert r['evidenceUse']=='new-unique-interval'
        selected[fullkey]=raw[key]
    image={}
    for (s,a,z),b in selected.items():
        for off,v in enumerate(b):
            key=s,int(a,16)+off;assert key not in image or image[key]==v;image[key]=v
    return e,raw,rows,prior,selected


def indirect_operand(b):
    """Decode the complete FF /2 or /4 ModRM/SIB operand; fail on leftovers."""
    assert b[0]==0xff and (b[1]>>3)&7 in (2,4)
    regs=['eax','ecx','edx','ebx','esp','ebp','esi','edi']
    mod,rm=b[1]>>6,b[1]&7;p=2
    if mod==3:assert len(b)==2;return regs[rm]
    terms=[];absolute=False
    if rm==4:
        sib=b[p];p+=1;scale=1<<(sib>>6);index=(sib>>3)&7;base=sib&7
        if not(mod==0 and base==5):terms.append(regs[base])
        else:absolute=True
        if index!=4:terms.append(regs[index] if scale==1 else regs[index]+'*'+str(scale))
    elif mod==0 and rm==5:absolute=True
    else:terms.append(regs[rm])
    disp=0
    if mod==1:disp=struct.unpack_from('<b',b,p)[0];p+=1
    elif mod==2 or absolute:
        disp=struct.unpack_from('<I' if absolute and not terms else '<i',b,p)[0];p+=4
    assert p==len(b)
    value=' + '.join(terms)
    if disp or not terms:
        number=str(abs(disp)) if abs(disp)<10 else hex(abs(disp))
        value+=((' - ' if disp<0 else ' + ') if value else '')+number
    return 'dword ptr ['+value+']'


def decoded_ledgers(rows):
    calls=[];branches=[];indirect_jumps=[]
    for a,b,annotation in rows:
        if b[0]==0xe8:
            assert len(b)==5;target=a+5+struct.unpack_from('<i',b,1)[0]
            calls.append(dict(site=f'{a:08X}',bytes=b.hex(' '),kind='direct',target=f'{target:08X}'))
            assert annotation=='call '+hex(target)
        elif b[0]==0xff and (b[1]>>3)&7==2:
            operand=indirect_operand(b)
            calls.append(dict(site=f'{a:08X}',bytes=b.hex(' '),kind='indirect',operand=operand))
            assert annotation=='call '+operand
        target=None
        if b[0] in (0xe9,0xeb) or 0x70<=b[0]<=0x7f:
            width=4 if b[0]==0xe9 else 1;assert len(b)==1+width
            target=a+len(b)+int.from_bytes(b[1:],'little',signed=True)
        elif len(b)>=2 and b[0]==0x0f and 0x80<=b[1]<=0x8f:
            assert len(b)==6;target=a+6+struct.unpack_from('<i',b,2)[0]
        if target is not None:
            branches.append(dict(site=f'{a:08X}',bytes=b.hex(' '),target=f'{target:08X}'))
            assert annotation.split()[-1]==hex(target)
        elif b[0]==0xff and (b[1]>>3)&7==4:
            operand=indirect_operand(b);assert annotation=='jmp '+operand
            indirect_jumps.append(dict(site=f'{a:08X}',bytes=b.hex(' '),operand=operand))
    return calls,branches,indirect_jumps


def fresh_decode(e,rows,decoder_path=None):
    if decoder_path:sys.path.insert(0,str(decoder_path))
    import capstone
    from capstone.x86_const import X86_OP_IMM
    decoder=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_32);decoder.detail=True
    counts=dict(intervals=0,codeIntervals=0,instructions=0,calls=0,relativeBranches=0,indirectJumps=0)
    for r in e['ranges']:
        counts['intervals']+=1
        if r['kind']=='data':continue
        counts['codeIntervals']+=1;s,a=r['source'],r['start'];source=rows[s,a]
        raw=b''.join(b for _,b,_ in source);ins=list(decoder.disasm(raw,int(a,16)))
        assert len(ins)==len(source)==r['instructionCount']
        assert b''.join(bytes(i.bytes) for i in ins)==raw
        calls=[];branches=[];indirect_jumps=[];starts={i.address for i in ins}
        for i,(addr,b,annotation) in zip(ins,source):
            assert (i.address,bytes(i.bytes))==(addr,b)
            assert ' '.join((i.mnemonic+' '+i.op_str).split())==annotation
            if i.group(capstone.CS_GRP_CALL):
                c=dict(site=f'{addr:08X}',bytes=b.hex(' '))
                if i.operands[0].type==X86_OP_IMM:c.update(kind='direct',target=f'{i.operands[0].imm & 0xffffffff:08X}')
                else:c.update(kind='indirect',operand=i.op_str)
                calls.append(c)
            if i.group(capstone.CS_GRP_JUMP):
                if i.operands[0].type==X86_OP_IMM:
                    t=i.operands[0].imm & 0xffffffff
                    branches.append(dict(site=f'{addr:08X}',bytes=b.hex(' '),target=f'{t:08X}'))
                    if int(a,16)<=t<int(r['endExclusive'],16):assert t in starts
                    else:assert a=='0072EE10' and t in (0x409170,0x707466)
                else:indirect_jumps.append(dict(site=f'{addr:08X}',bytes=b.hex(' '),operand=i.op_str))
        assert (calls,branches,indirect_jumps)==decoded_ledgers(source)
        assert calls==e['callLedgers'][s][a];assert branches==e['branchLedgers'][s][a]
        counts['instructions']+=len(ins);counts['calls']+=len(calls);counts['relativeBranches']+=len(branches);counts['indirectJumps']+=len(indirect_jumps)
    return dict(passed=True,decoder='Capstone '+capstone.__version__,mode='x86-32',counts=counts,allInstructionBytesAndAnnotationsExact=True,allDirectAndIndirectCallOperandsExact=True,allRelativeBranchesExact=True,allIndirectJumpsExact=True,machineCodeExecuted=False)


class NativeEvent9HomeGetterSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.e,cls.raw,cls.rows,cls.prior,cls.selected=load_evidence()
    def at(self,s,f,a,value):
        b=bytes.fromhex(value);off=a-int(f,16)
        self.assertEqual(self.raw[s,f][off:off+len(b)],b)
    def call(self,s,f,a,target):
        b=self.raw[s,f][a-int(f,16):a-int(f,16)+5]
        self.assertEqual(b[0],0xe8);self.assertEqual(a+5+struct.unpack_from('<i',b,1)[0],target)

    def test_01_source_identity_exact_pins_and_uncertified_runtime(self):
        validate_metadata(self.e)
        self.assertEqual({s['source']:s['idbSha256'] for s in self.e['sources']},SOURCE_HASHES)
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        self.assertEqual(self.e['adoption'],{'PC-PK1.1':'compatibility-reconstruction','PC-Vanilla-assumed':'compatibility-assumption','PS2-Wii':'open'})
        for p,h in PINS.items():self.assertEqual(digest((ROOT/p).read_bytes()),h)

    def test_02_frozen_troop_reset_and_entire_prior_source_closure(self):
        result=unittest.TextTestRunner(stream=io.StringIO()).run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeEvent9TroopResetSource))
        self.assertTrue(result.wasSuccessful(),(result.failures,result.errors));self.assertEqual(result.testsRun,20)
        self.assertEqual(len(self.prior[4]),1327);self.assertEqual(len(self.selected),1329)
        self.assertTrue(all(self.selected[k]==v for k,v in self.prior[4].items()))

    def test_03_complete_bodies_annotations_boundaries_and_budgets(self):
        for r in self.e['ranges']:
            b,rows=artifact_rows(r);self.assertEqual(b,self.raw[r['source'],r['start']])
            if r['kind']=='code':
                self.assertEqual(r['boundaryKind'],'complete-IDB-function')
                self.assertIn(dict(start=r['start'],endExclusive=r['endExclusive']),FUNCTION_REGIONS[r['source']+':'+r['ownerFunction']])
                self.assertEqual(len(rows),r['instructionCount'])
        self.assertEqual(len(self.raw),28)
        self.assertEqual(sum(r['evidenceUse']=='new-unique-interval' for r in self.e['ranges']),2)
        self.assertEqual({r['start'] for r in self.e['ranges'] if r['evidenceUse']=='new-unique-interval'},{'00495520'})
        old={(s,int(a,16)+i) for s,a,z in self.prior[4] for i in range(int(z,16)-int(a,16))}
        new={(r['source'],int(r['start'],16)+i) for r in self.e['ranges'] if r['kind']=='code' for i in range(len(self.raw[r['source'],r['start']]))}-old
        self.assertEqual(len(new),108)
        self.assertEqual(sum(map(len,self.raw.values())),BUDGET['selectedBytesBothSources'])

    def test_04_every_call_operand_branch_target_and_instruction_row(self):
        calls=branches=instructions=indirect_jumps=0
        for r in self.e['ranges']:
            s,a=r['source'],r['start'];rows=self.rows[s,a]
            if r['kind']=='data':
                self.assertEqual(self.e['callLedgers'][s][a],[]);self.assertEqual(self.e['branchLedgers'][s][a],[]);continue
            c,b,j=decoded_ledgers(rows)
            self.assertEqual(c,CALL_LEDGERS[s][a]);self.assertEqual(b,BRANCH_LEDGERS[s][a])
            starts={addr for addr,raw,text in rows}
            for branch in b:self.assertIn(int(branch['target'],16),starts)
            calls+=len(c);branches+=len(b);instructions+=len(rows);indirect_jumps+=len(j)
        self.assertEqual((instructions,calls,branches),(BUDGET['instructions'],BUDGET['callSites'],BUDGET['branchSites']))
        self.assertEqual(indirect_jumps,2)

    def test_05_exact_caller_44c_to_45e_order_and_fixed_manager(self):
        expected=bytes.fromhex('8b ce e8 cd b0 fd ff 50 b9 58 19 20 07 e8 a2 68 fd ff')
        for s in SOURCE_HASHES:
            f='004BA1D0';self.assertEqual(self.raw[s,f][0x44c-0x1d0:0x45e-0x1d0],expected)
            self.call(s,f,0x4ba44e,0x495520);self.call(s,f,0x4ba459,0x490d00)
            calls=[(c['site'],c['target']) for c in CALL_LEDGERS[s][f] if 0x4ba44c<=int(c['site'],16)<0x4ba45e]
            self.assertEqual(calls,[('004BA44E','00495520'),('004BA459','00490D00')])
        self.assertEqual(SEMANTICS['caller']['resolverManager'],0x07201958)

    def test_06_complete_getter_direct_troop08_without_wrapper_gate(self):
        expected=bytes.fromhex('56 8b f1 8b 06 ff 50 08 85 c0 74 25 8b 46 0c 50 b9 58 19 20 07 e8 c6 b5 ff ff 8b f0 56 e8 ee 50 fe ff 83 c4 04 85 c0 74 08 8b 86 98 00 00 00 5e c3 83 c8 ff 5e c3')
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s,'00495520'],expected)
            self.assertEqual(CALL_LEDGERS[s]['00495520'],[dict(site='00495525',bytes='ff 50 08',kind='indirect',operand='dword ptr [eax + 8]'),dict(site='00495535',bytes='e8 c6 b5 ff ff',kind='direct',target='00490B00'),dict(site='0049553D',bytes='e8 ee 50 fe ff',kind='direct',target='0047A630')])
            self.assertEqual([t for a,b,t in self.rows[s,'00495520'] if a<0x495525],['push esi','mov esi, ecx','mov eax, dword ptr [esi]'])
        for k in ['troopWrapperGate','troopNullOrProbeGate','raw44Gate']:self.assertIs(SEMANTICS['getter'][k],False)

    def test_07_false_direct08_returns_minus_one_and_retains_effects(self):
        for s in SOURCE_HASHES:
            self.at(s,'00495520',0x495528,'85 c0 74 25')
            self.at(s,'00495520',0x495551,'83 c8 ff 5e c3')
            self.assertEqual(BRANCH_LEDGERS[s]['00495520'],[dict(site='0049552A',bytes='74 25',target='00495551'),dict(site='00495547',bytes='74 08',target='00495551')])
        self.assertEqual((SEMANTICS['getter']['falseResult'],SEMANTICS['getter']['falseResultBits']),(-1,0xffffffff))
        self.assertIn('False retains all callback changes',SEMANTICS['getter']['troopLifetime'])
        self.assertIn('ordered full-frame/RNG effect-query',SEMANTICS['getter']['troopLifetime'])

    def test_08_true_direct08_reads_live_leader_of_saved_troop(self):
        for s in SOURCE_HASHES:
            self.at(s,'00495520',0x495521,'8b f1 8b 06 ff 50 08')
            self.at(s,'00495520',0x49552c,'8b 46 0c 50 b9 58 19 20 07')
            self.call(s,'00495520',0x495535,0x490b00)
            reads=[a for a,b,t in self.rows[s,'00495520'] if '[esi + 0xc]' in t]
            self.assertEqual(reads,[0x49552c])
        self.assertIn('after the callback',SEMANTICS['getter']['troopLifetime'])
        self.assertIn('Missing reached storage is an explicit gap',SEMANTICS['getter']['troopLifetime'])

    def test_09_person_resolver_signed_range_and_numeric_identity(self):
        expected=bytes.fromhex('8b 44 24 04 85 c0 7c 17 3d 4b 04 00 00 7f 10 69 c0 90 01 00 00 8d 84 08 bc c0 00 00 c2 04 00 33 c0 c2 04 00')
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s,'00490B00'],expected);self.assertEqual(CALL_LEDGERS[s]['00490B00'],[])
        self.assertEqual(SEMANTICS['getter']['leaderSignedRange'],[0,1099])
        self.assertEqual([0<=x<=1099 for x in [-2**31,-1,0,1099,1100,2**31-1]],[False,False,True,True,False,False])

    def test_10_saved_person_validated_once_then_live_home_read(self):
        for s in SOURCE_HASHES:
            self.at(s,'00495520',0x49553a,'8b f0 56 e8 ee 50 fe ff 83 c4 04 85 c0 74 08 8b 86 98 00 00 00')
            c=[c for c in CALL_LEDGERS[s]['00495520'] if c.get('target')=='0047A630'];self.assertEqual(len(c),1)
            self.assertEqual([t for a,b,t in self.rows[s,'00495520'] if 0x49553a<a<0x49554f and t.startswith('mov esi')],[])
        self.assertIn('same saved person',SEMANTICS['getter']['personLifetime'])
        self.assertIn('do not re-read troop leader',SEMANTICS['getter']['personLifetime'])
        self.assertIn('no arbitrary person08 callback',SEMANTICS['getter']['personDomain'])

    def test_11_saved_person_wrapper_null_probe_and_live_tail08(self):
        expected=bytes.fromhex('56 8b 74 24 08 85 f6 74 11 6a 01 6a 04 56 e8 2d 7a ff ff 83 c4 0c 85 c0 75 04 33 c0 5e c3 8b 06 8b ce 5e ff 60 08')
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s,'0047A630'],expected)
            self.assertEqual(CALL_LEDGERS[s]['00472070'],[dict(site='00472080',bytes='ff 15 68 e2 74 00',kind='indirect',operand='dword ptr [0x74e268]'),dict(site='00472094',bytes='ff 15 6c e2 74 00',kind='indirect',operand='dword ptr [0x74e26c]')])

    def test_12_canonical_person_dispatch_and_validity_predicate(self):
        for s in SOURCE_HASHES:
            v=self.raw[s,'0079C780'];self.assertEqual(struct.unpack_from('<I',v,8)[0],0x488430);self.assertEqual(struct.unpack_from('<I',v,4)[0],0x4883f0);self.assertEqual(struct.unpack_from('<I',v,44)[0],0x4883d0)
            self.at(s,'00488430',0x488430,'56 8b f1 8b 06 ff 50 04 85 c0 74 21')
            self.at(s,'00488430',0x48843c,'8b 86 7c 01 00 00 85 c0 75 10 8b b6 a0 00 00 00 83 fe 06 74 0c 83 fe 08 74 07')
            self.at(s,'004883F0',0x4883f5,'6a 0a ff 50 2c 85 c0 74 19')
            self.at(s,'004883F0',0x4883fe,'8b 86 7c 01 00 00 85 c0 75 13 8b b6 a0 00 00 00 85 f6 7c 05 83 fe 08 7e 04')
            self.assertEqual(self.raw[s,'004883D0'],bytes.fromhex('8b 44 24 04 83 f8 1a 74 0a 83 f8 0a 74 05 33 c0 c2 04 00 b8 01 00 00 00 c2 04 00'))
        self.assertEqual(SEMANTICS['person']['invalidStatusesWhenUnallocated'],[6,8])

    def test_13_canonical_troop_direct08_still_uses_live_leader_and_deputies(self):
        for s in SOURCE_HASHES:
            v=self.raw[s,'0079CC18'];self.assertEqual(struct.unpack_from('<I',v,8)[0],0x496040);self.assertEqual(struct.unpack_from('<I',v,36)[0],0x468e60)
            self.assertEqual(self.raw[s,'00468E60'],bytes.fromhex('b8 0b 00 00 00 c3'))
            self.at(s,'00496040',0x496043,'8b 06 ff 50 24 83 f8 0b')
            self.call(s,'00496040',0x496056,0x490b00);self.call(s,'00496040',0x49605c,0x47a630)
            self.at(s,'00496040',0x496079,'81 39 4c 04 00 00 7d 10')
        self.assertEqual(SEMANTICS['getter']['directTroopSlot'],8)

    def test_14_complete_relocation_body_proves_person_home_identity(self):
        for s in SOURCE_HASHES:
            f='004A31E0';self.at(s,f,0x4a31e0,'56 8b 74 24 08 56');self.at(s,f,0x4a31f7,'8b 6c 24 10')
            self.at(s,f,0x4a31fc,'55 b9 58 19 20 07');self.call(s,f,0x4a3202,0x490d00)
            self.at(s,f,0x4a3207,'8b f8 8b 86 98 00 00 00 50 b9 58 19 20 07');self.call(s,f,0x4a3215,0x490d00)
            self.at(s,f,0x4a3272,'89 ae 98 00 00 00')
            self.at(s,f,0x4a32e1,'5e c2 08 00')
            self.assertEqual(len(self.raw[s,f]),261)
        text=(ROOT/'scripts/officer_return_finalizer_profile.py').read_text()
        self.assertIn("p['homeBaseId']=target['id'];step('004A3272',field='homeBaseId'",text)
        self.assertEqual((SEMANTICS['person']['homeField'],SEMANTICS['person']['homeOffset'],SEMANTICS['person']['homeWidthBytes']),('homeBaseId',152,4))
        self.assertIs(SEMANTICS['person']['force98SameField'],False)

    def test_15_existing_home_field_retains_full_signed32_no_coercion(self):
        text=(ROOT/'scripts/officer_return_finalizer_profile.py').read_text()
        self.assertIn("for k in ('status','homeBaseId','locationId','rawLegionId','missionId'): integer(p[k],k,I32_MIN,I32_MAX)",text)
        self.assertEqual(SEMANTICS['person']['homeSignedDomain'],[-2**31,2**31-1])
        for value in [-2**31,-2,-1,0,16383,16384,2**31-1]:
            self.assertEqual(struct.unpack('<i',struct.pack('<i',value))[0],value)
        self.assertEqual(struct.pack('<i',-1),bytes.fromhex('ff ff ff ff'))

    def test_16_complete_building_resolver_is_only_signed_arithmetic(self):
        expected=bytes.fromhex('8b 44 24 04 85 c0 7c 14 3d ff 3f 00 00 7f 0d 6b c0 38 8d 84 08 30 97 08 00 c2 04 00 33 c0 c2 04 00')
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s,'00490D00'],expected);self.assertEqual(CALL_LEDGERS[s]['00490D00'],[])
            loads=[t for a,b,t in self.rows[s,'00490D00'] if t.startswith('mov')]
            self.assertEqual(loads,['mov eax, dword ptr [esp + 4]'])
            self.assertEqual([t for a,b,t in self.rows[s,'00490D00'] if t.startswith('lea')],['lea eax, [eax + ecx + 0x89730]'])
        fact=SEMANTICS['buildingResolver'];self.assertIs(fact['purelyNumeric'],True)
        for k in ['buildingStorageRead','buildingValidityRead','virtual08Call']:self.assertIs(fact[k],False)
        self.assertEqual((fact['signedRange'],fact['manager'],fact['baseOffset'],fact['stride']),([0,16383],0x07201958,0x89730,0x38))

    def test_17_signed_building_bounds_null_and_unread_pointer_identity(self):
        values=[-2**31,-1,0,16383,16384,2**31-1]
        def native_numeric(v):return 0x07201958+0x89730+v*0x38 if 0<=v<=16383 else None
        self.assertEqual([native_numeric(v) for v in values],[None,None,0x0728b088,0x0736b050,None,None])
        self.assertEqual(SEMANTICS['buildingResolver']['invalidResult'],None)
        self.assertFalse(SEMANTICS['buildingResolver']['buildingStorageRead'])

    def test_18_saved_registers_and_stack_balance(self):
        for s in SOURCE_HASHES:
            self.at(s,'00495520',0x495520,'56');self.at(s,'00495520',0x49554f,'5e c3');self.at(s,'00495520',0x495554,'5e c3')
            self.at(s,'00495520',0x495542,'83 c4 04')
            self.at(s,'00490D00',0x490d19,'c2 04 00');self.at(s,'00490D00',0x490d1e,'c2 04 00')
            self.assertFalse(any(re.search(r'\b(?:ebx|edi)\b',t) for a,b,t in self.rows[s,'00495520']))
        self.assertEqual(-4+4-4+4,0);self.assertEqual(-4+4,0)
        self.assertEqual(SEMANTICS['getter']['calleeReturnPopBytes'],0)
        self.assertEqual(SEMANTICS['caller']['callerParameterStackDeltaAtExit'],0)

    def test_19_reset_order_saved_force_and_no_raw44_getter_gate(self):
        for s in SOURCE_HASHES:
            f='004BA1D0';self.at(s,f,0x4ba2b8,'8b 5e 44 85 db')
            self.call(s,f,0x4ba34b,0x490aa0);self.at(s,f,0x4ba350,'8b 16 8b ce 8b d8 ff 52 48')
            self.call(s,f,0x4ba43d,0x4b5020);self.call(s,f,0x4ba447,0x4ad2b0);self.call(s,f,0x4ba44e,0x495520)
            self.assertFalse(any('0x44]' in t for a,b,t in self.rows[s,'00495520']))
        self.assertIn('saved force pointer',SEMANTICS['boundary']['savedContext'])
        self.assertIn('pre-presentation saved raw44',SEMANTICS['boundary']['savedContext'])

    def test_20_exact_reaction_45e_continuation_arguments_and_manager(self):
        for s in SOURCE_HASHES:
            f='004BA1D0';self.at(s,f,0x4ba45e,'50 6a 04 56 b9 5c 89 99 07');self.call(s,f,0x4ba467,0x4ad220)
            self.at(s,f,0x4ba46c,'8b 44 24 18')
        b=SEMANTICS['boundary'];self.assertEqual((b['remainderEntry'],b['remainderExit']),('004BA45E','004BA46C'))
        self.assertEqual(b['remainderStackArguments'],['saved troop ESI',4,'resolved building pointer EAX'])
        self.assertEqual(b['savedContext'][-2:],['returned signed home scalar','resolved numeric building pointer'])
        self.assertEqual(b['remainderClassification'],'whole-frame/RNG event9-reaction-remainder observation')

    def test_21_recovery_metadata_artifacts_import_views_and_inventory(self):
        for f,h in VERIFICATION_HASHES.items():self.assertEqual(digest((DIRECTORY/f).read_bytes()),h)
        for s in SOURCE_HASHES:
            r=json.loads((DIRECTORY/f'recovery-evidence-{s}.json').read_text())
            self.assertEqual(r['sources'],self.e['sources'])
            self.assertEqual(r['ranges'],[{k:v for k,v in x.items() if k!='evidenceUse'} for x in self.e['ranges'] if x['source']==s])
            self.assertEqual(r['functionRegions'],{k:v for k,v in FUNCTION_REGIONS.items() if k.startswith(s+':')})
            self.assertEqual(r['callLedgers'][s],CALL_LEDGERS[s]);self.assertEqual(r['boundaryMetadata'],{k:v for k,v in BOUNDARY_METADATA.items() if k.startswith(s+':')})
            self.assertEqual(r['importSlotMetadata'],self.e['importSlotMetadata'][s]);self.assertEqual(r['importSlotMetadata'],self.prior[0]['importSlotMetadata'][s])
            for v in r['importSlotMetadata'].values():self.assertIs(v['runtimeValueCertified'],False)
        self.assertEqual({p.name for p in DIRECTORY.glob('*.asm.txt')}|{p.name for p in DIRECTORY.glob('*.data.txt')},{r['file'] for r in self.e['ranges']})

    def test_22_full_raw_idb_verification_counts_and_dual_source_comparison(self):
        v=json.loads((DIRECTORY/'raw-verification.json').read_text());self.assertEqual(v['baselineCommit'],HISTORICAL_EXTRACTION_BASELINE)
        for k in ['machineCodeExecuted','originalExeExecuted','stockOriginalVerified','recordedExeHashesIndependentlyVerified']:self.assertIs(v[k],False)
        for r in v['rawId1Verification']:
            s=r['source'];self.assertEqual(r['idbSha256'],SOURCE_HASHES[s]);self.assertTrue(r['allInheritedAndNewRawId1BytesMatch'])
            self.assertEqual(r['inheritedSelectedIntervals'],sum(k[0]==s for k in self.prior[4]));self.assertEqual(r['selectedIntervals'],sum(k[0]==s for k in self.selected))
            self.assertEqual(r['selectedIntervalBytes'],sum(len(x) for k,x in self.selected.items() if k[0]==s))
        self.assertEqual([(r['source'],r['inheritedSelectedIntervals'],r['selectedIntervals']) for r in v['rawId1Verification']],[('S1',657,658),('S2',670,671)])
        self.assertEqual(len(self.e['comparisons']),14)
        for r in self.e['comparisons']:
            a,b=self.raw['S1',r['start']],self.raw['S2',r['start']];self.assertEqual(a,b);self.assertIs(r['identical'],True);self.assertEqual(r['differingByteCount'],0)
            for s,v in [('S1',a),('S2',b)]:self.assertEqual(r[s+'length'],len(v));self.assertEqual(r[s+'sha256'],digest(v))

    def test_23_independence_explicit_domain_and_open_effects(self):
        imports=[]
        for node in ast.walk(ast.parse(Path(__file__).read_text())):
            if isinstance(node,ast.Import):imports.extend(a.name.split('.')[0] for a in node.names)
            elif isinstance(node,ast.ImportFrom):imports.append((node.module or '').split('.')[0])
        self.assertTrue(set(imports)<={'argparse','ast','copy','io','json','pathlib','re','struct','sys','unittest','check_native_event9_troop_reset_source','check_officer_relocation_source','capstone'})
        for name in ['native_event9_home_getter_profile','native_event9_home_getter_frame','native_event9_home_getter_primitives','native_event9_troop_reset_profile','officer_return_finalizer_profile']:self.assertNotIn(name,sys.modules)
        for phrase in ['reaction45E..46C','event16/18','presentation native','unknown virtual','capture/surrender','positive refunds','S2 patched','clean-stock']:
            self.assertTrue(any(phrase in x for x in SEMANTICS['excluded']),phrase)
        for phrase in ['control-stack/saved-local corruption','SEH','concurrency']:self.assertIn(phrase,SEMANTICS['platform'])
        self.assertIn('neither destruction',SEMANTICS['boundary']['temporaryObject'])

    def test_24_metadata_mutations_rejected_with_clean_control(self):
        cases=[(('semantics','getter','troopWrapperGate'),True),(('semantics','getter','troopNullOrProbeGate'),True),(('semantics','getter','raw44Gate'),True),(('semantics','getter','liveLeaderReadSite'),'00495521'),(('semantics','getter','savedPersonSite'),'00495549'),(('semantics','getter','personHomeOffset'),0x98+1),(('semantics','person','homeWidthBytes'),1),(('semantics','person','homeSignedDomain'),[0,16383]),(('semantics','person','force98SameField'),True),(('semantics','buildingResolver','buildingStorageRead'),True),(('semantics','buildingResolver','buildingValidityRead'),True),(('semantics','buildingResolver','signedRange'),[0,16384]),(('semantics','boundary','remainderEntry'),'004BA44C'),(('semantics','boundary','remainderManager'),0x07201958),(('semantics','boundary','savedContext'),['troop pointer']),(('rangeBudget','allSelectedIntervals'),1327),(('callLedgers','S1','00495520',0,'operand'),'dword ptr [eax + 4]'),(('branchLedgers','S1','00495520',0,'target'),'00495549'),(('functionRegions','S1:00495520',0,'endExclusive'),'00495555'),(('boundaryMetadata','S1:00495549','itemEnd'),'00495550'),(('ranges',0,'artifactSha256'),'0'*64),(('ranges',0,'rawId1Sha256'),'0'*64),(('baselineCommit',),'0'*40),(('stockOriginalVerified',),True)]
        for path,value in cases:
            with self.subTest(path=path):
                validate_metadata(copy.deepcopy(self.e))
                mutant=copy.deepcopy(self.e);target=mutant
                for k in path[:-1]:target=target[k]
                target[path[-1]]=value
                with self.assertRaises(AssertionError):validate_metadata(mutant)
        self.assertEqual(len(cases),24)

    def test_25_byte_address_annotation_mutations_rejected_with_clean_control(self):
        row=next(r for r in self.e['ranges'] if r['source']=='S1' and r['start']=='00495520')
        text=(DIRECTORY/row['file']).read_text()
        cases=[text.replace('00495520','0049551F',1),text.replace('00495549','00495548',1),text.replace('ff 50 08','ff 50 04',1),text.replace('74 25','74 1d',1),text.replace('98 00 00 00','99 00 00 00',1),text.replace('mov      esi, ecx','mov      esi, eax',1),text.replace('call     dword ptr [eax + 8]','call     dword ptr [eax + 4]',1),text.replace('je       0x495551','je       0x495549',1),text.replace('or       eax, 0xffffffff','or       eax, 0',1),text.replace('00495555  c3                             ret\n','')]
        for i,mutant in enumerate(cases):
            with self.subTest(case=i):
                artifact_rows(row,text);self.assertNotEqual(mutant,text)
                with self.assertRaises(AssertionError):artifact_rows(row,mutant)
        self.assertEqual(len(cases),10)


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--idb-s1',type=Path);p.add_argument('--idb-s2',type=Path);p.add_argument('--report',type=Path);p.add_argument('--decode',action='store_true');p.add_argument('--decoder-path',type=Path)
    args=p.parse_args();result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeEvent9HomeGetterSource))
    if not result.wasSuccessful():return 1
    e,raw,rows,prior,selected=load_evidence();verified=[]
    for s,path in [('S1',args.idb_s1),('S2',args.idb_s2)]:
        if path is not None:
            verify_raw_id1(path,s,selected);verified.append(dict(source=s,idbSha256=SOURCE_HASHES[s],inheritedIntervals=sum(k[0]==s for k in prior[4]),intervals=sum(k[0]==s for k in selected),selectedIntervalBytes=sum(len(b) for k,b in selected.items() if k[0]==s),allRawId1BytesMatch=True))
    decoded=fresh_decode(e,rows,args.decoder_path) if args.decode else None
    report=dict(checker=Path(__file__).name,sourceProfile=e['profileId'],baselineCommit=BASELINE,sourceTests=result.testsRun,inheritedSourceTests=20,nestedInheritedSourceTests=[17,26,21,21,17,12,13],sourceTestsPassed=True,rangeBudget=BUDGET,rawId1Verification=verified,freshDecoderVerification=decoded,allByteColumnsAddressesAndAnnotationsPinned=True,allCallOperandsAndBranchesVerified=True,recoveryMetadataVerified=True,metadataMutationsRejected=24,artifactMutationsRejected=10,everyMutationCleanControlPassed=True,machineCodeExecuted=False,originalExeExecuted=False,stockOriginalVerified=False,recordedExeHashesIndependentlyVerified=False,rawRuntimeMapCaptured=False,getterEntry='004BA44C',getterExit='004BA45E',reactionRemainderEntry='004BA45E',reactionRemainderExit='004BA46C',newSourceSpecificDifferences=0,directTroop08HasWrapperGate=False,savedPersonReadLiveAfterValidity=True,homeField='homeBaseId',homeSignedDomain=[-2147483648,2147483647],buildingResolverStorageRead=False,buildingResolverValidityRead=False,arbitraryPerson08Implemented=False,reactionRemainderBodyExecuted=False,presentationBodyExecuted=False,event16or18Implemented=False)
    if args.report:args.report.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,sort_keys=True));return 0
if __name__=='__main__':raise SystemExit(main())
