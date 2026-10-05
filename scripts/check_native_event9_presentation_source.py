"""Independent dual-IDB byte-column source proof for event9 presentation decision.

No production-model import or target-code execution. Optional IDB verification
checks complete file fingerprints and every inherited/new interval with raw ID1.
"""
import argparse
import ast
import io
import json
from pathlib import Path
import struct
import sys
import unittest
from check_native_event9_selection_source import NativeEvent9SelectionSource, load_evidence as load_prior
from check_live_zero_refund_source import branches
from check_officer_relocation_source import SOURCE_HASHES, digest, read_rows, verify_calls, verify_raw_id1
ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'docs/sources/native_event9_presentation.json'
DIRECTORY=MANIFEST.with_suffix('')
BASELINE='f9c55c48c95fa84c1594bd9fb5ddcaf5849dcbe1'
PINS = {'docs/sources/native_event9_selection.json': '077ef91630d3cc5e76852e4ad4d2bd2e5e81957a988bec3bdb708680e2e3cea5', 'scripts/check_native_event9_selection_source.py': 'd5c685ebcf6f2b1a8ecaa5a9c423619a5955792033d04f4711d135f2d0c826bb', 'scripts/native_event9_selection_profile.py': '917b06a65b24f741f63628851e1a61bd299edb7171b3c12de51f41ce1206977b', 'scripts/native_event9_selection_frame.py': '4fbe7f6c78275b05f6f9728e7a631b461749f50afd4fcf9b0d68d4d786309bab', 'scripts/native_event9_selection_primitives.py': '3919cdb230ec4c23bbe38800377e59a3ce4213b155da10b09118f5188ab37fbb', 'scripts/check_native_event9_selection_profile.py': '708b5b994cf5cdbbe0cfee7bec3fc09d6605e6a87bf0387c3043df3478b477e4', 'scripts/native_live_position_profile.py': 'c40bbc01ff68f7a699450bca9b948aea774e1ffe2ed238a96daeb96dddf5dd84', 'scripts/native_troop_membership_primitives.py': 'cc8be8d9d6d4d586824e8b71385822db98ddda9af1803fb34f362e9c7faf7a06', 'scripts/return_route_frame.py': '12ac3d443a33e8596eb6641cc0bd4db482a8bed82e795b31571af9446feb54e1', 'scripts/return_route_primitives.py': 'd7a98e0209698c35c6ab6fc69d1ca961bab00965d3ef542f0240b73660a6ecc2'}
BODY_HASHES = {'0041C130': {'S1': {'endExclusive': '0041C135', 'sha256': '81794790c0ad77391e995d91903df71d532fdf23777b0a32cef0c4606e844a6f'}, 'S2': {'endExclusive': '0041C135', 'sha256': '81794790c0ad77391e995d91903df71d532fdf23777b0a32cef0c4606e844a6f'}}, '00468E60': {'S1': {'endExclusive': '00468E66', 'sha256': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb'}, 'S2': {'endExclusive': '00468E66', 'sha256': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb'}}, '00472070': {'S1': {'endExclusive': '004720AB', 'sha256': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'}, 'S2': {'endExclusive': '004720AB', 'sha256': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'}}, '0047A5B0': {'S1': {'endExclusive': '0047A5CA', 'sha256': 'c9fe611a0381b8ead3df441f6f5274109688d5c8952a69a5e49e130764c42369'}, 'S2': {'endExclusive': '0047A5CA', 'sha256': 'c9fe611a0381b8ead3df441f6f5274109688d5c8952a69a5e49e130764c42369'}}, '0047A5D0': {'S1': {'endExclusive': '0047A5D9', 'sha256': '336e6d1ac6f11f67df7db7d5f89a438c5a41aa1673b4e071afda2050a291f656'}, 'S2': {'endExclusive': '0047A5D9', 'sha256': '336e6d1ac6f11f67df7db7d5f89a438c5a41aa1673b4e071afda2050a291f656'}}, '0047A630': {'S1': {'endExclusive': '0047A656', 'sha256': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'}, 'S2': {'endExclusive': '0047A656', 'sha256': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'}}, '0047A690': {'S1': {'endExclusive': '0047A6CF', 'sha256': 'ab0f54956bf79e54dfaca38fb239d3c02f97944201c44732b3e58ef73ab506b0'}, 'S2': {'endExclusive': '0047A6CF', 'sha256': 'ab0f54956bf79e54dfaca38fb239d3c02f97944201c44732b3e58ef73ab506b0'}}, '0047A770': {'S1': {'endExclusive': '0047A7AD', 'sha256': 'c781ffe379c72b8fe4ea4908f6d93c767358971e4299a25ab369bc75e7ccc76c'}, 'S2': {'endExclusive': '0047A7AD', 'sha256': 'c781ffe379c72b8fe4ea4908f6d93c767358971e4299a25ab369bc75e7ccc76c'}}, '0047A7B0': {'S1': {'endExclusive': '0047A7CB', 'sha256': '83b5164f882ebb2143935fc24fc191da2ee4741fc481291aa0245cd284277ede'}, 'S2': {'endExclusive': '0047A7CB', 'sha256': '83b5164f882ebb2143935fc24fc191da2ee4741fc481291aa0245cd284277ede'}}, '0047A830': {'S1': {'endExclusive': '0047A84B', 'sha256': '8a7117c6601fe56cfc5ff6d26c73c66aad30684e80698687e3200f10a8f9cd44'}, 'S2': {'endExclusive': '0047A84B', 'sha256': '8a7117c6601fe56cfc5ff6d26c73c66aad30684e80698687e3200f10a8f9cd44'}}, '0047AA80': {'S1': {'endExclusive': '0047AA90', 'sha256': '9a2bb180f23db262c8ced963c3328bd2d09e74d4690e53d97b55b240a525dcf3'}, 'S2': {'endExclusive': '0047AA90', 'sha256': '9a2bb180f23db262c8ced963c3328bd2d09e74d4690e53d97b55b240a525dcf3'}}, '0047B110': {'S1': {'endExclusive': '0047B116', 'sha256': '23334c82ef0133c65cc0394d318a2637276496cb9b99f6dd580d0ee4f6c9e7b5'}, 'S2': {'endExclusive': '0047B116', 'sha256': '23334c82ef0133c65cc0394d318a2637276496cb9b99f6dd580d0ee4f6c9e7b5'}}, '0047B120': {'S1': {'endExclusive': '0047B141', 'sha256': '0d2d36825aeb1660db12af0d55f77568a96538b7d00238fd42c360a609c4d3f3'}, 'S2': {'endExclusive': '0047B141', 'sha256': '0d2d36825aeb1660db12af0d55f77568a96538b7d00238fd42c360a609c4d3f3'}}, '0047B150': {'S1': {'endExclusive': '0047B15E', 'sha256': '52dc4158e437df16124a965fac71d33f46fcbe75856c9f9e760d32cb295fa52f'}, 'S2': {'endExclusive': '0047B15E', 'sha256': '52dc4158e437df16124a965fac71d33f46fcbe75856c9f9e760d32cb295fa52f'}}, '0047B2B0': {'S1': {'endExclusive': '0047B2DD', 'sha256': '2b871355a493a19960355b895dcbf725a6b3c931af48f71d233989991aac5017'}, 'S2': {'endExclusive': '0047B2DD', 'sha256': '2b871355a493a19960355b895dcbf725a6b3c931af48f71d233989991aac5017'}}, '0047C320': {'S1': {'endExclusive': '0047C324', 'sha256': '7e6bda0a031f94dbe8477fe3ce3ba2b7e3d761a050d55625bc7d92212670e60c'}, 'S2': {'endExclusive': '0047C324', 'sha256': '7e6bda0a031f94dbe8477fe3ce3ba2b7e3d761a050d55625bc7d92212670e60c'}}, '0047E050': {'S1': {'endExclusive': '0047E06B', 'sha256': '388757158c5ea3bed3590f126c4ea6fd728a232bca78990a37a4984c8b3b7d0b'}, 'S2': {'endExclusive': '0047E06B', 'sha256': '388757158c5ea3bed3590f126c4ea6fd728a232bca78990a37a4984c8b3b7d0b'}}, '0047E070': {'S1': {'endExclusive': '0047E099', 'sha256': '4f60021d67009a52e6791f4ac1455a00eab1cd6f6b0ee56280c769fcf3ff0b05'}, 'S2': {'endExclusive': '0047E099', 'sha256': '4f60021d67009a52e6791f4ac1455a00eab1cd6f6b0ee56280c769fcf3ff0b05'}}, '00480FA0': {'S1': {'endExclusive': '00480FB5', 'sha256': '483f6f19dd5e587ddf6bb26e39f28aa9c6d118dc3c472d31ca97f38bf74250ad'}, 'S2': {'endExclusive': '00480FB5', 'sha256': '483f6f19dd5e587ddf6bb26e39f28aa9c6d118dc3c472d31ca97f38bf74250ad'}}, '00480FD0': {'S1': {'endExclusive': '00480FEB', 'sha256': '232846f5c08de33b4165c4e96aab197a29c734c44342107d84e197c9554094bb'}, 'S2': {'endExclusive': '00480FEB', 'sha256': '232846f5c08de33b4165c4e96aab197a29c734c44342107d84e197c9554094bb'}}, '00480FF0': {'S1': {'endExclusive': '00481018', 'sha256': '176c12bc4fc33f51e7f7c5d839dcd44842f3701f84c5b3ef9cfe3966997fe0ad'}, 'S2': {'endExclusive': '00481018', 'sha256': '176c12bc4fc33f51e7f7c5d839dcd44842f3701f84c5b3ef9cfe3966997fe0ad'}}, '004834B0': {'S1': {'endExclusive': '004834D1', 'sha256': '4e8e7c70655f7142d2bd828383a216b5ca5d376862fe8dfe574f40df2d2cf74c'}, 'S2': {'endExclusive': '004834D1', 'sha256': '4e8e7c70655f7142d2bd828383a216b5ca5d376862fe8dfe574f40df2d2cf74c'}}, '004834E0': {'S1': {'endExclusive': '004834EE', 'sha256': '759d28c09d885b08eb016a6ea1191b957a930440356797c9f6ffdffbb4f53141'}, 'S2': {'endExclusive': '004834EE', 'sha256': '759d28c09d885b08eb016a6ea1191b957a930440356797c9f6ffdffbb4f53141'}}, '00483810': {'S1': {'endExclusive': '00483814', 'sha256': '07ad3a50b1c271e07fb57fb47d2f0e77f3342d41bfa410990cb1320a45035fb2'}, 'S2': {'endExclusive': '00483814', 'sha256': '07ad3a50b1c271e07fb57fb47d2f0e77f3342d41bfa410990cb1320a45035fb2'}}, '004839F0': {'S1': {'endExclusive': '004839FC', 'sha256': '56b58ce4a05e2ecdfa055b04e499f6a144840249d8e11b28065dfce3bcfee08e'}, 'S2': {'endExclusive': '004839FC', 'sha256': '56b58ce4a05e2ecdfa055b04e499f6a144840249d8e11b28065dfce3bcfee08e'}}, '00483B00': {'S1': {'endExclusive': '00483B1E', 'sha256': 'a5a4e3333b75a6d64582c4998ec5f87d3e2f929616a094182bdce39a99b4b412'}, 'S2': {'endExclusive': '00483B1E', 'sha256': 'a5a4e3333b75a6d64582c4998ec5f87d3e2f929616a094182bdce39a99b4b412'}}, '004863D0': {'S1': {'endExclusive': '004863F1', 'sha256': '5500e4a2326ca7c9ec310cf20083e9050f61f039bd6199011501d274f2e8c5ba'}, 'S2': {'endExclusive': '004863F1', 'sha256': '5500e4a2326ca7c9ec310cf20083e9050f61f039bd6199011501d274f2e8c5ba'}}, '00486400': {'S1': {'endExclusive': '00486424', 'sha256': 'c5f03d3151997a9c57011d7fec3a0e7a61a5f1989a4d5eba46a468965527e2d7'}, 'S2': {'endExclusive': '00486424', 'sha256': 'c5f03d3151997a9c57011d7fec3a0e7a61a5f1989a4d5eba46a468965527e2d7'}}, '00487B30': {'S1': {'endExclusive': '00487BB3', 'sha256': '8620689504983fed521867667ddfdcb2f6477ecc3f0249ed7132c2d22596ca79'}, 'S2': {'endExclusive': '00487BB3', 'sha256': '8620689504983fed521867667ddfdcb2f6477ecc3f0249ed7132c2d22596ca79'}}, '00487DC0': {'S1': {'endExclusive': '00487DC4', 'sha256': 'a97a61afc73231cb78bb2c78600f652c4d2d996c15d963c8764c5c055bf114d1'}, 'S2': {'endExclusive': '00487DC4', 'sha256': 'a97a61afc73231cb78bb2c78600f652c4d2d996c15d963c8764c5c055bf114d1'}}, '00487EB0': {'S1': {'endExclusive': '00488008', 'sha256': '2e8ba025d2f1180608985a96a793de0b18f35b225bf22d16c40b9e524f24730c'}, 'S2': {'endExclusive': '00488008', 'sha256': '2e8ba025d2f1180608985a96a793de0b18f35b225bf22d16c40b9e524f24730c'}}, '004880A0': {'S1': {'endExclusive': '004880B8', 'sha256': '672200b358bfbf28d0eca996b11adc2250ddb5de243887c13c6b8242c07ae09d'}, 'S2': {'endExclusive': '004880B8', 'sha256': '672200b358bfbf28d0eca996b11adc2250ddb5de243887c13c6b8242c07ae09d'}}, '004883B0': {'S1': {'endExclusive': '004883B7', 'sha256': 'b8daa47a1e2c23c0d84bc9ac1de08473d93f8b72166ba2ff5b06db32826f2236'}, 'S2': {'endExclusive': '004883B7', 'sha256': 'b8daa47a1e2c23c0d84bc9ac1de08473d93f8b72166ba2ff5b06db32826f2236'}}, '004883D0': {'S1': {'endExclusive': '004883EB', 'sha256': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3'}, 'S2': {'endExclusive': '004883EB', 'sha256': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3'}}, '004883F0': {'S1': {'endExclusive': '00488422', 'sha256': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088'}, 'S2': {'endExclusive': '00488422', 'sha256': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088'}}, '00488430': {'S1': {'endExclusive': '00488461', 'sha256': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f'}, 'S2': {'endExclusive': '00488461', 'sha256': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f'}}, '00489F10': {'S1': {'endExclusive': '00489F22', 'sha256': 'c9dfadf9bea7a72ed7f905c625e17ccb73ae47616ed799e24fccf78dc8697164'}, 'S2': {'endExclusive': '00489F22', 'sha256': 'c9dfadf9bea7a72ed7f905c625e17ccb73ae47616ed799e24fccf78dc8697164'}}, '0048D790': {'S1': {'endExclusive': '0048D7B1', 'sha256': '797bcaf4dc2e7080ec431b4469f29a065c37d744eef021c65f18d79a62057cb0'}, 'S2': {'endExclusive': '0048D7B1', 'sha256': '797bcaf4dc2e7080ec431b4469f29a065c37d744eef021c65f18d79a62057cb0'}}, '0048D7C0': {'S1': {'endExclusive': '0048D7CE', 'sha256': '34e04f73ca02433f61d2729cc654f93ab9df493e065c1e19e50bd9a6ba3bfa58'}, 'S2': {'endExclusive': '0048D7CE', 'sha256': '34e04f73ca02433f61d2729cc654f93ab9df493e065c1e19e50bd9a6ba3bfa58'}}, '00490A10': {'S1': {'endExclusive': '00490A32', 'sha256': '5fdb5f2212b319522010293ef4ce36bb915efdc6a44b48882a9faecbff95c4f4'}, 'S2': {'endExclusive': '00490A32', 'sha256': '5fdb5f2212b319522010293ef4ce36bb915efdc6a44b48882a9faecbff95c4f4'}}, '00490A40': {'S1': {'endExclusive': '00490A62', 'sha256': '8b122a1d07e6c7372d9e85d06a6fb3025f443cd8d359c150148707def85a97d6'}, 'S2': {'endExclusive': '00490A62', 'sha256': '8b122a1d07e6c7372d9e85d06a6fb3025f443cd8d359c150148707def85a97d6'}}, '00490A70': {'S1': {'endExclusive': '00490A92', 'sha256': 'a7f7198f20c14dd01bd48d9f7c3a356490fafad34d0e4d7d8e40c60d9635c822'}, 'S2': {'endExclusive': '00490A92', 'sha256': 'a7f7198f20c14dd01bd48d9f7c3a356490fafad34d0e4d7d8e40c60d9635c822'}}, '00490AA0': {'S1': {'endExclusive': '00490AC2', 'sha256': 'e9c9bd6a1d8baa85ea48e7f40425871ad9469d7a5a9896f24d16ca03242866db'}, 'S2': {'endExclusive': '00490AC2', 'sha256': 'e9c9bd6a1d8baa85ea48e7f40425871ad9469d7a5a9896f24d16ca03242866db'}}, '00490AD0': {'S1': {'endExclusive': '00490AF2', 'sha256': 'd03849242416ef33815626c63a49db94f0d84740bbe3ae137b638ad756be3333'}, 'S2': {'endExclusive': '00490AF2', 'sha256': 'd03849242416ef33815626c63a49db94f0d84740bbe3ae137b638ad756be3333'}}, '00490B00': {'S1': {'endExclusive': '00490B24', 'sha256': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c'}, 'S2': {'endExclusive': '00490B24', 'sha256': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c'}}, '00490B90': {'S1': {'endExclusive': '00490BB2', 'sha256': 'f15b07997daf87667fe34f62f99504c1f6f4efe454dd45036219e4aba32945b6'}, 'S2': {'endExclusive': '00490BB2', 'sha256': 'f15b07997daf87667fe34f62f99504c1f6f4efe454dd45036219e4aba32945b6'}}, '00490D00': {'S1': {'endExclusive': '00490D21', 'sha256': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a'}, 'S2': {'endExclusive': '00490D21', 'sha256': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a'}}, '00490E70': {'S1': {'endExclusive': '00490E94', 'sha256': '69dce2910ef46501efb42c693e70432a5d30e9156664c3ae48fb55303d72a1be'}, 'S2': {'endExclusive': '00490E94', 'sha256': '69dce2910ef46501efb42c693e70432a5d30e9156664c3ae48fb55303d72a1be'}}, '00491770': {'S1': {'endExclusive': '004917BC', 'sha256': '57db6d0a75e755ba06d4cf80f7dd9e634d89cf02e272c4c7ad3ae053e213f41b'}, 'S2': {'endExclusive': '004917BC', 'sha256': '57db6d0a75e755ba06d4cf80f7dd9e634d89cf02e272c4c7ad3ae053e213f41b'}}, '004922C0': {'S1': {'endExclusive': '00492348', 'sha256': '1238ab9a49364c9f3bc0f5b9b162146f4d9af4314acb01a405586d824ab34e88'}, 'S2': {'endExclusive': '00492348', 'sha256': '1238ab9a49364c9f3bc0f5b9b162146f4d9af4314acb01a405586d824ab34e88'}}, '004951D0': {'S1': {'endExclusive': '004951F1', 'sha256': 'd2c5ec2c8fa93d737e8fa17f16487ddc9621bc84186ebd8c4633670071fc6df4'}, 'S2': {'endExclusive': '004951F1', 'sha256': 'd2c5ec2c8fa93d737e8fa17f16487ddc9621bc84186ebd8c4633670071fc6df4'}}, '004955A0': {'S1': {'endExclusive': '004955D6', 'sha256': '48a97b0d8683f1bc3219f07baa1f5fd2e60e1ff31412e11440328d6233b53499'}, 'S2': {'endExclusive': '004955D6', 'sha256': '48a97b0d8683f1bc3219f07baa1f5fd2e60e1ff31412e11440328d6233b53499'}}, '00495CE0': {'S1': {'endExclusive': '00495E24', 'sha256': '712730249836ebc18ae880302e8fa56adab4cd17438eddef313fd334fcbe337d'}, 'S2': {'endExclusive': '00495E24', 'sha256': '712730249836ebc18ae880302e8fa56adab4cd17438eddef313fd334fcbe337d'}}, '00495E24': {'S1': {'endExclusive': '00495E3C', 'sha256': '002314239b99c1b5de9cf8c711bc4e5b640bd9587781ea5915ab840c12146eac'}, 'S2': {'endExclusive': '00495E3C', 'sha256': '002314239b99c1b5de9cf8c711bc4e5b640bd9587781ea5915ab840c12146eac'}}, '00495E3C': {'S1': {'endExclusive': '00495E49', 'sha256': 'bcc618dc98141b7aca81b2f267180dd878d8782f843d734787a4bf3d1100a2a4'}, 'S2': {'endExclusive': '00495E49', 'sha256': 'bcc618dc98141b7aca81b2f267180dd878d8782f843d734787a4bf3d1100a2a4'}}, '00495E4C': {'S1': {'endExclusive': '00495E5C', 'sha256': '1fe5c58902562e0a04d82534412cabad89f4e001a43511f3f39a944b0e1b3b12'}, 'S2': {'endExclusive': '00495E5C', 'sha256': '1fe5c58902562e0a04d82534412cabad89f4e001a43511f3f39a944b0e1b3b12'}}, '00495E5C': {'S1': {'endExclusive': '00495E6C', 'sha256': '37984025a317d1f33956d28de2c040fe7087e44d76396b3e23c70091dbbe99fe'}, 'S2': {'endExclusive': '00495E6C', 'sha256': '37984025a317d1f33956d28de2c040fe7087e44d76396b3e23c70091dbbe99fe'}}, '00496040': {'S1': {'endExclusive': '00496095', 'sha256': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55'}, 'S2': {'endExclusive': '00496095', 'sha256': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55'}}, '00496D90': {'S1': {'endExclusive': '00496DA2', 'sha256': '04fc43ea99ccb0bfbb25c4dfc4b2843bc5d1464f9b50d2c2fae1b5dd3a327b7a'}, 'S2': {'endExclusive': '00496DA2', 'sha256': '04fc43ea99ccb0bfbb25c4dfc4b2843bc5d1464f9b50d2c2fae1b5dd3a327b7a'}}, '0049AE90': {'S1': {'endExclusive': '0049AEEC', 'sha256': 'fa0afec05541020aba45cfa08040a097c299be3ec0ea86c6d7a68301ffb788b9'}, 'S2': {'endExclusive': '0049AEEC', 'sha256': 'fa0afec05541020aba45cfa08040a097c299be3ec0ea86c6d7a68301ffb788b9'}}, '0049B390': {'S1': {'endExclusive': '0049B3AF', 'sha256': '99be8b5ee1d22fd6a2c35f94a0487b8101f05a6fb11e7c4b6b41ce2e97369bad'}, 'S2': {'endExclusive': '0049B3AF', 'sha256': '99be8b5ee1d22fd6a2c35f94a0487b8101f05a6fb11e7c4b6b41ce2e97369bad'}}, '0049C430': {'S1': {'endExclusive': '0049C598', 'sha256': '5ac721972bd1a8d0597d16e39aaa96e7efe04ca9e18c24262223980b0abaef9a'}, 'S2': {'endExclusive': '0049C598', 'sha256': '5ac721972bd1a8d0597d16e39aaa96e7efe04ca9e18c24262223980b0abaef9a'}}, '0049CB60': {'S1': {'endExclusive': '0049CB74', 'sha256': 'dd26369fc2f2b358be68a07bbf146875b5b934e22243c7f112ced7f45fd40260'}, 'S2': {'endExclusive': '0049CB74', 'sha256': 'dd26369fc2f2b358be68a07bbf146875b5b934e22243c7f112ced7f45fd40260'}}, '0049CB80': {'S1': {'endExclusive': '0049CCBD', 'sha256': '16fa3ec2612bfd3702477fc9572c131548c842536fda937741ed43e2acb8725d'}, 'S2': {'endExclusive': '0049CCBD', 'sha256': '16fa3ec2612bfd3702477fc9572c131548c842536fda937741ed43e2acb8725d'}}, '0049CCC0': {'S1': {'endExclusive': '0049CCEC', 'sha256': 'e690c4190207ecba5540392c9dbb2bb63b413fa766f77fcd61faa22705eab322'}, 'S2': {'endExclusive': '0049CCEC', 'sha256': 'e690c4190207ecba5540392c9dbb2bb63b413fa766f77fcd61faa22705eab322'}}, '0049CCEC': {'S1': {'endExclusive': '0049CD07', 'sha256': 'f72c251d14b9a6af48ab60af0a065710076b82f81864e4dae3cdceed781c6ed5'}, 'S2': {'endExclusive': '0049CD07', 'sha256': 'f72c251d14b9a6af48ab60af0a065710076b82f81864e4dae3cdceed781c6ed5'}}, '004BA1D0': {'S1': {'endExclusive': '004BA485', 'sha256': '70d2f33412b51e4e1337942addf82032c79021ea9c37cf562d95ad144daea67c'}, 'S2': {'endExclusive': '004BA485', 'sha256': '70d2f33412b51e4e1337942addf82032c79021ea9c37cf562d95ad144daea67c'}}, '004F55E0': {'S1': {'endExclusive': '004F563A', 'sha256': '817b8d49e3257d94b7b6b4314bcfff188abc68e4274be212884f4985ab1fcd00'}, 'S2': {'endExclusive': '004F563A', 'sha256': '817b8d49e3257d94b7b6b4314bcfff188abc68e4274be212884f4985ab1fcd00'}}, '00557AC0': {'S1': {'endExclusive': '00557AC6', 'sha256': 'accecba762116532de10ac30681ff4b25ad91fe217568ec41c8ffd67b9ef2bcf'}, 'S2': {'endExclusive': '00557AC6', 'sha256': 'accecba762116532de10ac30681ff4b25ad91fe217568ec41c8ffd67b9ef2bcf'}}, '00573470': {'S1': {'endExclusive': '00573476', 'sha256': '21faa16607cb70438711aab3fa582829af50aa15d5946524996fc7aa8a8e4e6d'}, 'S2': {'endExclusive': '00573476', 'sha256': '21faa16607cb70438711aab3fa582829af50aa15d5946524996fc7aa8a8e4e6d'}}, '005C1A40': {'S1': {'endExclusive': '005C1A6F', 'sha256': 'bee09d0adfd5024b679ddac759569a7e4976a6bab541a8c2f266183af78616c6'}, 'S2': {'endExclusive': '005C1A6F', 'sha256': 'bee09d0adfd5024b679ddac759569a7e4976a6bab541a8c2f266183af78616c6'}}, '0063ADD0': {'S1': {'endExclusive': '0063ADFD', 'sha256': '368069258f9ac708527de1e80126dc0b0296a4d353f4893843769fb38e6cebf9'}, 'S2': {'endExclusive': '0063ADFD', 'sha256': '29c94d2b048a651e44020613d627ed280e168787cb668320403da25dc2b02c46'}}, '0065D6C0': {'S1': {'endExclusive': '0065D6C4', 'sha256': 'f7e0208f5e988ae39c7a45dfddbd12921d02f9c3deb5695d4c534c8ab0ccdb0f'}, 'S2': {'endExclusive': '0065D6C4', 'sha256': 'f7e0208f5e988ae39c7a45dfddbd12921d02f9c3deb5695d4c534c8ab0ccdb0f'}}, '0067F810': {'S1': {'endExclusive': '0067F816', 'sha256': '07297dca94be1b975a5dc696b5976f205b84057995fa3d3fbb157101b1ae8098'}, 'S2': {'endExclusive': '0067F816', 'sha256': '07297dca94be1b975a5dc696b5976f205b84057995fa3d3fbb157101b1ae8098'}}, '006903A0': {'S1': {'endExclusive': '006903A6', 'sha256': '7500687ab6484f894dd29beddc484e671de6539e4faf19ef80805cfd49e55624'}, 'S2': {'endExclusive': '006903A6', 'sha256': '7500687ab6484f894dd29beddc484e671de6539e4faf19ef80805cfd49e55624'}}, '0072EE10': {'S1': {'endExclusive': '0072EE18', 'sha256': '77ddeda12e629875ee9826a9a8fe918b047fae98914ca11f3dbe9526aa11bc40'}, 'S2': {'endExclusive': '0072EE22', 'sha256': '26beeea16e9a66774fde567ecd7d1e993a04fda888a79c09cf9c85994f77f9e2'}}, '0079BF58': {'S1': {'endExclusive': '0079BFA8', 'sha256': '53abf891e2facef0229898ea8c6462e1e99d0c0d60f2ef36c78e6eced74f08ce'}, 'S2': {'endExclusive': '0079BFA8', 'sha256': '53abf891e2facef0229898ea8c6462e1e99d0c0d60f2ef36c78e6eced74f08ce'}}, '0079BFB0': {'S1': {'endExclusive': '0079C000', 'sha256': 'cb2fe670413e8efe4faa99c693e9de77d689a0bfe99545d93beb2e597c1b3cd7'}, 'S2': {'endExclusive': '0079C000', 'sha256': 'cb2fe670413e8efe4faa99c693e9de77d689a0bfe99545d93beb2e597c1b3cd7'}}, '0079C0E8': {'S1': {'endExclusive': '0079C138', 'sha256': 'c795b528970e6dd14c97b609e7c1415e51e3fb2928be08a86153dc5981e7e9e5'}, 'S2': {'endExclusive': '0079C138', 'sha256': 'c795b528970e6dd14c97b609e7c1415e51e3fb2928be08a86153dc5981e7e9e5'}}, '0079C170': {'S1': {'endExclusive': '0079C1C0', 'sha256': '59b4c81d8253e970cf5504dd25c37126674093f84d4df7b532d92a508b8c5633'}, 'S2': {'endExclusive': '0079C1C0', 'sha256': '59b4c81d8253e970cf5504dd25c37126674093f84d4df7b532d92a508b8c5633'}}, '0079C2B0': {'S1': {'endExclusive': '0079C330', 'sha256': 'd692c5d627bf8182061c550e469f9e0b13e17d483aadbec413ec11491d3f0272'}, 'S2': {'endExclusive': '0079C330', 'sha256': 'c43c9e7e16ef2efa065e931224a872a8d97c6463bca829b7aaeb6212c2992d0d'}}, '0079C358': {'S1': {'endExclusive': '0079C558', 'sha256': '1baebecf5fe9802f84a50368e9602469796cba9a1a9b1b0f2bfe82d85dad6fac'}, 'S2': {'endExclusive': '0079C558', 'sha256': '1baebecf5fe9802f84a50368e9602469796cba9a1a9b1b0f2bfe82d85dad6fac'}}, '0079C718': {'S1': {'endExclusive': '0079C774', 'sha256': '93644003052b306a2543d1e4cd26359f5e743ec4450b0b0d59742f7f4ecaffec'}, 'S2': {'endExclusive': '0079C774', 'sha256': '93644003052b306a2543d1e4cd26359f5e743ec4450b0b0d59742f7f4ecaffec'}}, '0079C780': {'S1': {'endExclusive': '0079C7D0', 'sha256': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c'}, 'S2': {'endExclusive': '0079C7D0', 'sha256': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c'}}, '0079C7D0': {'S1': {'endExclusive': '0079C820', 'sha256': '4de624b4f1dccc089cf3e7f124a048c76b96ccd45f1b76ff439f919a00759f1c'}, 'S2': {'endExclusive': '0079C820', 'sha256': '4de624b4f1dccc089cf3e7f124a048c76b96ccd45f1b76ff439f919a00759f1c'}}, '0079CC18': {'S1': {'endExclusive': '0079CC80', 'sha256': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff'}, 'S2': {'endExclusive': '0079CC80', 'sha256': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff'}}}
VERIFICATION_HASHES = {'raw-verification.json': '44e933d4fa8f2f3682ce7719b70acf640d9f78599e595afe183ac53d0f26e72a', 'recovery-evidence-S1.json': '8c859a6578297a7e5b3cb40f44ea565a346898d754c19e1db8b5b8d4a3f526f0', 'recovery-evidence-S2.json': 'b6a922da8dfc7f067dfd4d650943ba467f45d7837147897abca8e687af9d3ad5'}
BUDGET = {'focusedIntervals': 172, 'reusedExactInheritedIntervals': 152, 'newUniqueIntervals': 20, 'codeIntervals': 140, 'completeIDBFunctionIntervals': 140, 'dataIntervals': 32, 'selectedBytesBothSources': 11370, 'instructions': 3116, 'callSites': 292, 'branchSites': 339, 'inheritedSelectedIntervals': 1297, 'allSelectedIntervals': 1317, 'newMachineCodeBytesRecovered': 1946}

def load_evidence():
    e=json.loads(MANIFEST.read_text())
    assert {r['path']:r['sha256'] for r in [e['priorEvidence']]+e['retainedFiles']}==PINS
    for path,expected in PINS.items():assert digest((ROOT/path).read_bytes())==expected,path
    prior=load_prior();selected=dict(prior[4]);raw={};ins={}
    for row in e['ranges']:
        key=row['source'],row['start'];assert key not in raw
        raw[key],ins[key]=read_rows(DIRECTORY,row);fullkey=key+(row['endExclusive'],)
        if fullkey in selected:
            assert selected[fullkey]==raw[key]
            assert row['evidenceUse']=='reused-exact-inherited-interval'
        else:assert row['evidenceUse']=='new-unique-interval'
        selected[fullkey]=raw[key]
    image={}
    for (s,a,z),value in selected.items():
        for offset,byte in enumerate(value):
            key=s,int(a,16)+offset;assert key not in image or image[key]==byte,key;image[key]=byte
    return e,raw,ins,prior,selected



class NativeEvent9PresentationSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.e,cls.raw,cls.ins,cls.prior,cls.selected=load_evidence()
    def at(self,s,f,a,value):
        b=bytes.fromhex(value);o=a-int(f,16);self.assertEqual(self.raw[s,f][o:o+len(b)],b)
    def call(self,s,f,a,target):
        b=self.raw[s,f][a-int(f,16):a-int(f,16)+5]
        self.assertEqual(b[0],0xe8);self.assertEqual(a+5+struct.unpack_from('<i',b,1)[0],target)

    def test_01_source_identity_scope_and_baseline(self):
        self.assertEqual(self.e['profileId'],'source-idb-S1-S2-native-event9-presentation-v1')
        self.assertEqual(self.e['frameProfileId'],'source-idb-S1-S2-native-event9-presentation-frame-v1')
        self.assertEqual(self.e['baselineCommit'],BASELINE)
        self.assertEqual(self.e['sources'],self.prior[0]['sources'])
        self.assertEqual({s['source']:s['idbSha256'] for s in self.e['sources']},SOURCE_HASHES)
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        self.assertEqual(self.e['adoption'],{'PC-PK1.1':'compatibility-reconstruction','PC-Vanilla-assumed':'compatibility-assumption','PS2-Wii':'open'})
        for k in ['stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified','rawRuntimeMapCaptured']:self.assertIs(self.e[k],False)

    def test_02_frozen_inherited_closure(self):
        result=unittest.TextTestRunner(stream=io.StringIO()).run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeEvent9SelectionSource))
        self.assertTrue(result.wasSuccessful(),(result.failures,result.errors));self.assertEqual(result.testsRun,21)
        self.assertEqual(len(self.prior[4]),BUDGET['inheritedSelectedIntervals'])
        self.assertEqual(len(self.selected),BUDGET['allSelectedIntervals'])

    def test_03_complete_function_bodies_and_exact_budgets(self):
        self.assertEqual(set(self.raw),{(s,a) for a,d in BODY_HASHES.items() for s in d})
        for r in self.e['ranges']:
            pin=BODY_HASHES[r['start']][r['source']]
            self.assertEqual(r['endExclusive'],pin['endExclusive'])
            self.assertEqual(digest(self.raw[r['source'],r['start']]),pin['sha256'])
            self.assertEqual(r['rawId1Sha256'],pin['sha256'])
            if r['kind']=='code':
                self.assertEqual(r['boundaryKind'],'complete-IDB-function')
                self.assertIn(dict(start=r['start'],endExclusive=r['endExclusive']),self.e['functionRegions'][r['source']+':'+r['ownerFunction']])
        self.assertEqual(self.e['rangeBudget'],BUDGET)
        self.assertEqual(len(self.raw),BUDGET['focusedIntervals'])
        self.assertEqual(sum(map(len,self.raw.values())),BUDGET['selectedBytesBothSources'])
        code=[r for r in self.e['ranges'] if r['kind']=='code']
        self.assertEqual(len(code),BUDGET['codeIntervals'])
        self.assertEqual(sum(len(self.ins[r['source'],r['start']]) for r in code),BUDGET['instructions'])
        old={(s,int(a,16)+i) for s,a,z in self.prior[4] for i in range(int(z,16)-int(a,16))}
        new={(r['source'],int(r['start'],16)+i) for r in code for i in range(len(self.raw[r['source'],r['start']]))}-old
        self.assertEqual(len(new),BUDGET['newMachineCodeBytesRecovered'])
        self.assertEqual(sum(r['evidenceUse']=='new-unique-interval' for r in self.e['ranges']),BUDGET['newUniqueIntervals'])

    def test_04_call_branch_and_seh_chunk_ledgers(self):
        calls=jumps=0
        for r in self.e['ranges']:
            s,a=r['source'],r['start'];ledger=self.e['callLedgers'][s][a]
            if r['kind']=='data':self.assertEqual(ledger,[]);continue
            calls+=verify_calls(self.ins[s,a],ledger)
            expected=branches(self.ins[s,a]);self.assertEqual(self.e['branchLedgers'][s][a],expected);jumps+=len(expected)
            for branch in expected:
                target=int(branch['target'],16)
                if not int(a,16)<=target<int(r['endExclusive'],16):
                    self.assertEqual(a,'0072EE10')
                    self.assertIn(target,[0x409170,0x707466])
        self.assertEqual(calls,BUDGET['callSites']);self.assertEqual(jumps,BUDGET['branchSites'])
        for s,end in [('S1','0072EE18'),('S2','0072EE22')]:
            self.assertEqual(self.e['functionRegions'][s+':004922C0'],[dict(start='004922C0',endExclusive='00492348'),dict(start='0072EE10',endExclusive=end)])
            self.at(s,'0072EE10',0x72ee10,'8d 4d f0 e9 58 a3 cd ff')
        self.at('S2','0072EE10',0x72ee18,'b8 e8 c2 88 00 e9 44 86 fd ff')

    def test_05_saved_raw44_resolves_once_before_troop48(self):
        for s in SOURCE_HASHES:
            f='004BA1D0'
            self.at(s,f,0x4ba2b8,'8b 5e 44 85 db')
            self.at(s,f,0x4ba345,'53 b9 58 19 20 07')
            self.call(s,f,0x4ba34b,0x490aa0)
            self.at(s,f,0x4ba350,'8b 16 8b ce 8b d8 ff 52 48')
            self.at(s,'00490AA0',0x490aa0,'8b 44 24 04 85 c0 7c 15 83 f8 2e 7f 10 69 c0 2c 01 00 00 8d 84 08 f8 7a 00 00')
        fact=self.e['semantics']['savedForce']
        self.assertEqual((fact['admittedRange'],fact['getterDomain']),([0,46],[0,46]))
        self.assertEqual((fact['forceStride'],fact['forceBaseOffset']),(0x12c,0x7af8))
        self.assertIn('Never recompute',fact['lifetime'])

    def test_06_troop48_resolves_live_force_without_entry_validity(self):
        for s in SOURCE_HASHES:
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079CC18'],0x48)[0],0x47a690)
            self.at(s,'0047A690',0x47a690,'8b 01 56 ff 50 40 50 b9 58 19 20 07')
            self.call(s,'0047A690',0x47a69c,0x490aa0)
            self.at(s,'0047A690',0x47a6a1,'8b f0 85 f6 74 1c 6a 01 6a 04 56')
            self.call(s,'0047A690',0x47a6ac,0x472070)
            self.at(s,'0047A690',0x47a6b1,'83 c4 0c 85 c0 74 0b 8b 16 8b ce ff 52 08 85 c0 75 04 33 c0 5e c3')
        fact=self.e['semantics']['troop48']
        self.assertFalse(fact['troopEntryValidityGate']);self.assertTrue(fact['forceValidityGate'])

    def test_07_force_validity_live_type_then_signed_ruler(self):
        for s in SOURCE_HASHES:
            v=self.raw[s,'0079C0E8']
            self.assertEqual(struct.unpack_from('<I',v,8)[0],0x480ff0)
            self.assertEqual(struct.unpack_from('<I',v,0x2c)[0],0x480fd0)
            self.at(s,'00480FF0',0x480ff0,'56 8b f1 8b 06 6a 01 ff 50 2c 85 c0 74 16 8b 76 04 85 f6 7c 0f 81 fe 4b 04 00 00 7f 07')
            self.at(s,'00480FF0',0x48100d,'b8 01 00 00 00 5e c3 33 c0 5e c3')
            self.at(s,'00480FD0',0x480fd0,'8b 44 24 04 83 f8 1a 74 0a 83 f8 01 74 05 33 c0 c2 04 00 b8 01 00 00 00 c2 04 00')
        self.assertEqual(self.e['semantics']['force']['rulerSignedRange'],[0,1099])
        self.assertEqual([0<=x<=1099 for x in [-2**31,-1,0,1099,1100,2**31-1]],[False,False,True,True,False,False])

    def test_08_force48_raw_player_signed_range_and_no_validity(self):
        expected=bytes.fromhex('8b 41 60 85 c0 7c 0b 83 f8 07 7f 06 b8 01 00 00 00 c3 33 c0 c3')
        for s in SOURCE_HASHES:
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079C0E8'],0x48)[0],0x480fa0)
            self.assertEqual(self.raw[s,'00480FA0'],expected)
            self.assertEqual(self.e['callLedgers'][s]['00480FA0'],[])
        self.assertFalse(self.e['semantics']['force']['playerPredicateValidatesForce'])
        self.assertEqual([0<=x<=7 for x in [-2**31,-1,0,1,7,8,2**31-1]],[False,False,True,True,True,False,False])

    def test_09_force_pointer_saved_but_vtable_reread_after_validity(self):
        for s in SOURCE_HASHES:
            self.at(s,'0047A690',0x47a6c7,'8b 06 8b ce 5e ff 60 48')
            self.at(s,'004BA1D0',0x4ba35d,'53')
            self.call(s,'004BA1D0',0x4ba35e,0x47a630)
            self.at(s,'004BA1D0',0x4ba36e,'8b 03 8b cb ff 50 48')
        self.assertTrue(self.e['semantics']['troop48']['vtableRereadAfterValidity'])
        self.assertIn('rereading reached vtables',self.e['semantics']['unknownDispatch'])

    def test_10_gate_short_circuit_branch_targets(self):
        expected={0x4ba35b:0x4ba37d,0x4ba368:0x4ba432,0x4ba377:0x4ba432}
        for s in SOURCE_HASHES:
            actual={int(b['site'],16):int(b['target'],16) for b in branches(self.ins[s,'004BA1D0'])}
            for site,target in expected.items():self.assertEqual(actual[site],target)
            self.at(s,'004BA1D0',0x4ba359,'85 c0 75 20')
            self.at(s,'004BA1D0',0x4ba366,'85 c0 0f 84 c4 00 00 00')
            self.at(s,'004BA1D0',0x4ba375,'85 c0 0f 84 b5 00 00 00')

    def test_11_original_event_argument_word_is_reread(self):
        for s in SOURCE_HASHES:
            self.at(s,'004BA1D0',0x4ba1da,'8b bc 24 98 0b 00 00 8b 07')
            self.at(s,'004BA1D0',0x4ba37d,'8b 8c 24 98 0b 00 00 8b 01 83 e8 09 74 79 83 e8 07 74 3d 83 e8 02 0f 85 99 00 00 00')
        fact=self.e['semantics']['eventMemory']
        self.assertEqual(fact['domain'],'immutable-command-event-v1')
        self.assertEqual(fact['callerArgumentOffset'],0xb98)
        self.assertIn('Native event memory is reread, not immutable',fact['claim'])
        self.assertIn('control stack and saved control-flow locals',fact['claim'])
        self.assertIn('does not exclude the known temporary message-object writes',fact['claim'])
        self.assertEqual(fact['temporaryStackObjectWrites'],'observed-inside-004BA411..004BA432')

    def test_12_event9_revalidates_saved_target_after_callbacks(self):
        for s in SOURCE_HASHES:
            self.at(s,'004BA1D0',0x4ba2d3,'8b f8 85 ff')
            self.at(s,'004BA1D0',0x4ba404,'57')
            self.call(s,'004BA1D0',0x4ba405,0x47a630)
            self.at(s,'004BA1D0',0x4ba40a,'83 c4 04 85 c0 74 21')
        fact=self.e['semantics']['decision']
        self.assertEqual(fact['targetRevalidationSite'],'004BA405')
        self.assertIn('False target skips presentation only',fact['order'])

    def test_13_presentation_stack_arguments_and_balanced_exit(self):
        for s in SOURCE_HASHES:
            f='004BA1D0'
            self.at(s,f,0x4ba411,'6a ff 6a 01 56 57 56 68 9c 20 00 00 8d 8c 24 dc 07 00 00')
            self.call(s,f,0x4ba424,0x5c1a40)
            self.at(s,f,0x4ba429,'50')
            self.call(s,f,0x4ba42a,0x4f55e0)
            self.at(s,f,0x4ba42f,'83 c4 10')
            self.at(s,'005C1A40',0x5c1a69,'8b c6 5e c2 0c 00')
        # Six pushes, constructor callee-pop3, return local pointer push1,
        # consumer cdecl, caller cleanup4. Stack delta at432 is exactly zero.
        self.assertEqual(-6*4+3*4-4+4*4,0)
        self.assertEqual(-6*4+0x7dc,0x7c4)
        fact=self.e['semantics']['presentation']
        self.assertEqual(fact['messageId'],0x209c)
        self.assertEqual(fact['callerLocalOffset'],0x7c4)
        self.assertEqual(fact['consumerArguments'],['temporary constructor result','saved troop pointer',1,-1])

    def test_14_constructor_retains_same_this_and_calls_effectful_helpers(self):
        for s in SOURCE_HASHES:
            f='005C1A40'
            self.at(s,f,0x5c1a40,'8b 44 24 04 56 50 8b f1')
            for site,target in [(0x5c1a48,0x49cb60),(0x5c1a56,0x49cb80),(0x5c1a64,0x49cb80)]:self.call(s,f,site,target)
            self.at(s,f,0x5c1a4d,'8b 4c 24 0c 51 6a 00 8b ce')
            self.at(s,f,0x5c1a5b,'8b 54 24 10 52 6a 00 8b ce')
            self.at(s,f,0x5c1a69,'8b c6 5e c2 0c 00')
            self.at(s,'0049CB60',0x49cb60,'8b 44 24 04 56 8b f1 89 06')
            self.call(s,'0049CB60',0x49cb69,0x49c430)

    def test_15_initializer_is_caller_object_storage_not_stable_string(self):
        for s in SOURCE_HASHES:
            f='0049C430'
            self.at(s,f,0x49c430,'8b d1 33 c0 8d 4a 04')
            self.at(s,f,0x49c569,'8d ba 6c 01 00 00 81 c2 ac 03 00 00 b9 90 00 00 00 f3 ab')
            self.at(s,f,0x49c57c,'89 02 89 42 04 89 42 08 89 42 0c 89 42 10 89 42 14 89 42 18 89 42 1c 89 42 20 5f c3')
            self.assertEqual(self.e['callLedgers'][s][f],[])
        self.assertEqual(0x16c+0x90*4,0x3ac)
        self.assertEqual(0x3ac+0x20+4,0x3d0)
        self.assertEqual(0x7c4+0x3d0,0xb94)
        self.assertFalse(self.e['semantics']['presentation']['temporaryEscapesProtocol'])
        self.assertIn('No stable string/message pointer',self.e['semantics']['presentation']['temporaryLifetime'])

    def test_16_message_object_type_dispatch_tables_remain_observed(self):
        for s in SOURCE_HASHES:
            self.at(s,'0049CB80',0x49cb90,'8b 06 8b ce ff 50 24 48 83 f8 1a 0f 87 17 01 00 00 0f b6 88 ec cc 49 00 ff 24 8d c0 cc 49 00')
            table=struct.unpack('<11I',self.raw[s,'0049CCC0'])
            indices=self.raw[s,'0049CCEC'];self.assertEqual(len(indices),27)
            self.assertTrue(all(i<len(table) for i in indices))
            starts={a for a,b in self.ins[s,'0049CB80']}
            self.assertTrue(set(table)<=starts)
        self.assertIn('object virtual24',self.e['semantics']['presentation']['effects'])

    def test_17_consumer_formats_before_live_force_and_position(self):
        for s in SOURCE_HASHES:
            f='004F55E0'
            self.call(s,f,0x4f55e8,0x49b390)
            self.at(s,f,0x4f55ed,'8b 74 24 18 8b 7c 24 20 83 c4 04 85 f6 8b d8 74 38 83 ff ff 75 09 8b ce')
            self.call(s,f,0x4f5605,0x47a770)
            self.at(s,f,0x4f560c,'8b 16 8b ce ff 52 3c 8b 00')
            self.at(s,f,0x4f561f,'85 c0 0f 95 c1')
            self.at(s,f,0x4f5628,'51 53 57 52 b9 00 4e c2 09')
            self.call(s,f,0x4f5631,0x63add0)
            self.at(s,f,0x4f5636,'5f 5e 5b c3')
            self.at(s,'0047A770',0x47a770,'8b 01 56 ff 50 40')
            self.at(s,'0047A770',0x47a79c,'ff 52 08 85 c0 74 05 8b 46 44')
        self.assertIn('never presumed pure formatting',self.e['semantics']['presentation']['effects'])

    def test_18_formatter_global_lock_and_deeper_calls_not_closed(self):
        for s in SOURCE_HASHES:
            self.at(s,'0049B390',0x49b390,'33 c0 3d b8 ca 67 07 75 06')
            self.at(s,'0049B390',0x49b39f,'8b 4c 24 04 51 b9 b8 ca 67 07')
            self.call(s,'0049B390',0x49b3a9,0x49ae90)
            self.at(s,'0049AE90',0x49aeb8,'8d be 6c 12 00 00 57 ff 15 60 e3 74 00')
            self.call(s,'0049AE90',0x49aecc,0x49c5a0)
            self.call(s,'0049AE90',0x49aed6,0x498a90)
            self.at(s,'0049AE90',0x49aede,'ff 15 5c e3 74 00')
        self.assertIn('allocation',self.e['semantics']['presentation']['temporaryLifetime'])
        self.assertIn('asynchronous retention remain opaque',self.e['semantics']['presentation']['temporaryLifetime'])

    def test_19_source_specific_presentation_subcall_remains_opaque(self):
        for s,target in [('S1',0x482480),('S2',0x8ece20)]:
            self.call(s,'0063ADD0',0x63ade7,target)
            self.call(s,'0063ADD0',0x63adf4,0x639f90)
            self.at(s,'0063ADD0',0x63adf9,'5e c2 10 00')
        self.assertNotEqual(self.raw['S1','0063ADD0'],self.raw['S2','0063ADD0'])
        self.assertIn('S1:482480 or S2:8ECE20',self.e['semantics']['presentation']['effects'])
        for address in ['00482480','008ECE20','00639F90']:
            self.assertNotIn(('S1',address),self.raw) # No claim that callees are recovered here.

    def test_20_two_ordered_boundaries_and_saved_reaction_identity(self):
        for s in SOURCE_HASHES:
            f='004BA1D0'
            self.at(s,f,0x4ba432,'8b 7c 24 20 6a 00 6a ff 53 8b cf')
            for site,target in [(0x4ba43d,0x4b5020),(0x4ba447,0x4ad2b0),(0x4ba44e,0x495520),(0x4ba459,0x490d00),(0x4ba467,0x4ad220)]:self.call(s,f,site,target)
            self.at(s,f,0x4ba46c,'8b 44 24 18 85 c0 0f 85 1e fe ff ff')
        p,r=self.e['semantics']['presentation'],self.e['semantics']['reaction']
        self.assertEqual((p['entry'],p['exit'],r['entry'],r['exit']),('004BA411','004BA432','004BA432','004BA46C'))
        for fact in (p,r):self.assertEqual(fact['classification'],'exact whole-frame/RNG effect boundary')
        self.assertEqual(r['firstArguments'],['saved force pointer',-1,0])
        self.assertIn('saved next-node cursor',p['savedLocals'])
        self.assertIn('saved force pointer EBX',p['savedLocals'])

    def test_21_independent_gate_truth_table_preserves_short_circuit(self):
        # These truth-table checks only illustrate the raw branches proved above;
        # they do not execute native x86 or import the production decision model.
        def gate(troop48,valid,saved48,targetvalid):
            calls=['troop48'];enabled=troop48
            if not enabled:
                calls.append('saved08')
                if valid:calls.append('saved48');enabled=saved48
            if enabled:
                calls.extend(['event-word','target08'])
                if targetvalid:calls.append('presentation')
            calls.append('reaction');return calls
        for troop in [False,True]:
            for valid in [False,True]:
                for force in [False,True]:
                    for target in [False,True]:
                        sequence=gate(troop,valid,force,target)
                        self.assertEqual(sequence[-1],'reaction')
                        self.assertEqual('saved08' in sequence,not troop)
                        self.assertEqual('saved48' in sequence,not troop and valid)
                        self.assertEqual('presentation' in sequence,(troop or valid and force) and target)
        self.assertEqual(gate(True,False,False,False),['troop48','event-word','target08','reaction'])

    def test_22_saved_force_example_survives_owner_and_raw44_changes(self):
        # Saved native scalars/pointer identities are independent of live storage.
        frame={'raw44':3,'owner':4,'forces':{3:{'player':8},4:{'player':-1}}}
        saved_raw=frame['raw44'];saved_force=saved_raw
        frame={'raw44':5,'owner':6,'forces':{3:{'player':0},6:{'player':8}}}
        current_force=frame['owner']
        self.assertEqual((saved_raw,saved_force,current_force),(3,3,6))
        self.assertFalse(0<=frame['forces'][current_force]['player']<=7)
        self.assertTrue(0<=frame['forces'][saved_force]['player']<=7)
        self.assertIn('remains the same pointer',self.e['semantics']['savedForce']['lifetime'])

    def test_23_native_event_reread_alternatives_are_not_silently_normalized(self):
        for s in SOURCE_HASHES:
            actual={int(b['site'],16):int(b['target'],16) for b in branches(self.ins[s,'004BA1D0'])}
            for site,target in [(0x4ba389,0x4ba404),(0x4ba38e,0x4ba3cd),(0x4ba393,0x4ba432)]:self.assertEqual(actual[site],target)
            self.at(s,'004BA1D0',0x4ba399,'8b 54 24 10')
        self.assertEqual(self.e['semantics']['entry']['excludedEvents'],[16,18])
        self.assertIn('Mutated16/18 paths are not implemented',self.e['semantics']['eventMemory']['otherWordBehavior'])

    def test_24_recovery_reports_differences_and_exact_artifacts(self):
        differences=[]
        for r in self.e['comparisons']:
            a,b=self.raw['S1',r['start']],self.raw['S2',r['start']]
            self.assertEqual(r['identical'],a==b)
            self.assertEqual(r['differingByteCount'],sum(x!=y for x,y in zip(a,b))+abs(len(a)-len(b)))
            if a!=b:differences.append(r['start'])
            for s,v in [('S1',a),('S2',b)]:self.assertEqual(r[s+'length'],len(v));self.assertEqual(r[s+'sha256'],digest(v))
        self.assertEqual(differences,['0063ADD0','0072EE10','0079C2B0'])
        self.assertEqual({r['file']:r['sha256'] for r in self.e['provenance']['verificationArtifacts']},VERIFICATION_HASHES)
        for f,h in VERIFICATION_HASHES.items():self.assertEqual(digest((DIRECTORY/f).read_bytes()),h)
        for s in SOURCE_HASHES:
            recovery=json.loads((DIRECTORY/f'recovery-evidence-{s}.json').read_text())
            self.assertEqual(recovery['ranges'],[{k:v for k,v in r.items() if k!='evidenceUse'} for r in self.e['ranges'] if r['source']==s])
            self.assertEqual(recovery['functionRegions'],{k:v for k,v in self.e['functionRegions'].items() if k.startswith(s+':')})
            self.assertEqual(recovery['importSlotMetadata'],self.e['importSlotMetadata'][s])
        names={p.name for p in DIRECTORY.glob('*.asm.txt')}|{p.name for p in DIRECTORY.glob('*.data.txt')}
        self.assertEqual(names,{r['file'] for r in self.e['ranges']})

    def test_25_unknown_effects_and_remaining_scope_are_explicit(self):
        semantics=self.e['semantics']
        self.assertIn('full-frame/RNG effect-query',semantics['unknownDispatch'])
        self.assertIn('explicit gap',semantics['unknownDispatch'])
        for phrase in ['reaction432..46C','event16/18','capture/surrender','positive refunds','S2 patch','runtime/clean-stock']:
            self.assertTrue(any(phrase in e for e in semantics['excluded']),phrase)
        for k in ['stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified','rawRuntimeMapCaptured']:self.assertFalse(self.e[k])

    def test_26_source_checker_independence(self):
        imports=[]
        for node in ast.walk(ast.parse(Path(__file__).read_text())):
            if isinstance(node,ast.Import):imports.extend(a.name.split('.')[0] for a in node.names)
            elif isinstance(node,ast.ImportFrom):imports.append((node.module or '').split('.')[0])
        self.assertTrue(set(imports)<={'argparse','ast','io','json','pathlib','struct','sys','unittest','check_native_event9_selection_source','check_live_zero_refund_source','check_officer_relocation_source'})
        for name in ['native_event9_presentation_profile','native_event9_presentation_frame','native_event9_presentation_primitives','native_event9_selection_profile','native_event9_selection_primitives']:self.assertNotIn(name,sys.modules)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--idb-s1',type=Path);parser.add_argument('--idb-s2',type=Path);parser.add_argument('--report',type=Path)
    args=parser.parse_args();result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeEvent9PresentationSource))
    if not result.wasSuccessful():return 1
    e,raw,ins,prior,selected=load_evidence();verified=[]
    for s,p in [('S1',args.idb_s1),('S2',args.idb_s2)]:
        if p is not None:
            verify_raw_id1(p,s,selected);verified.append(dict(source=s,idbSha256=SOURCE_HASHES[s],intervals=sum(k[0]==s for k in selected),selectedIntervalBytes=sum(len(b) for k,b in selected.items() if k[0]==s)))
    report=dict(checker=Path(__file__).name,sourceProfile=e['profileId'],baselineCommit=BASELINE,sourceTests=result.testsRun,inheritedSourceTests=21,nestedInheritedSourceTests=[21,17,12,13],sourceTestsPassed=True,rangeBudget=BUDGET,rawId1Verification=verified,machineCodeExecuted=False,originalExeExecuted=False,stockOriginalVerified=False,recordedExeHashesIndependentlyVerified=False,rawRuntimeMapCaptured=False,decisionEntry='004BA345',presentationEntry='004BA411',presentationExit='004BA432',reactionEntry='004BA432',reactionExit='004BA46C',eventMemoryDomain='immutable-command-event-v1',eventMemoryNativeImmutable=False,messagePointerExposed=False,sourceSpecificPresentationSubcall={'S1':'00482480','S2':'008ECE20'},reactionBodyExecuted=False,event16or18Implemented=False)
    if args.report:args.report.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,sort_keys=True));return 0
if __name__=='__main__':raise SystemExit(main())
