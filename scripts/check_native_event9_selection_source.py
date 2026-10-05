"""Independent dual-IDB byte-column source proof for event9 troop selection.

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
from check_native_live_position_source import NativeLivePositionSource, load_evidence as load_prior
from check_live_zero_refund_source import branches
from check_officer_relocation_source import SOURCE_HASHES, digest, read_rows, verify_calls, verify_raw_id1
ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'docs/sources/native_event9_selection.json'
DIRECTORY=MANIFEST.with_suffix('')
BASELINE='82432a2c5b85ba8b9e443217b8da1b925441b10c'
PINS = {'docs/sources/native_live_position.json': '1f12ac9aeb7c27a77b00270b2c58c4ca216687178281aaa5f2c749fb06f87b56', 'scripts/check_native_live_position_source.py': '1c6b623d7c09773e621ecc5bbe3b749ac6b43df48236882708dea3e399b38cb7', 'scripts/native_live_position_profile.py': 'c40bbc01ff68f7a699450bca9b948aea774e1ffe2ed238a96daeb96dddf5dd84', 'scripts/native_live_position_frame.py': 'f3d13b7e334791b87cc6c29c700c1e43da171fd4c0ca479c4beece86a84c3b5f', 'scripts/native_live_position_primitives.py': '2bfa7d3bf95d1eb3365ac3233ffc852de6c57477c2e77932c25422f40659827a', 'scripts/check_native_live_position_profile.py': 'db642087907e3421824c511878e8d3442c652759db710a0f4f8f2deaa25369e8', 'scripts/native_troop_membership_primitives.py': 'cc8be8d9d6d4d586824e8b71385822db98ddda9af1803fb34f362e9c7faf7a06', 'scripts/return_route_primitives.py': 'd7a98e0209698c35c6ab6fc69d1ca961bab00965d3ef542f0240b73660a6ecc2', 'scripts/recursive_role_primitives.py': 'ad28535effcc10a4a096dccf67e1293ae552b94e0c9795e0ad14fd0ee19cf14e', 'scripts/officer_relocation_tables.py': 'be00dd195a64d5782e25fb17d89cb1784ed8f97b9c7245c80ce85fe49fc0872f'}
BODY_HASHES = {'0041C130': {'S1': {'endExclusive': '0041C135', 'sha256': '81794790c0ad77391e995d91903df71d532fdf23777b0a32cef0c4606e844a6f'}, 'S2': {'endExclusive': '0041C135', 'sha256': '81794790c0ad77391e995d91903df71d532fdf23777b0a32cef0c4606e844a6f'}}, '00468E60': {'S1': {'endExclusive': '00468E66', 'sha256': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb'}, 'S2': {'endExclusive': '00468E66', 'sha256': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb'}}, '00472070': {'S1': {'endExclusive': '004720AB', 'sha256': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'}, 'S2': {'endExclusive': '004720AB', 'sha256': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'}}, '0047A5B0': {'S1': {'endExclusive': '0047A5CA', 'sha256': 'c9fe611a0381b8ead3df441f6f5274109688d5c8952a69a5e49e130764c42369'}, 'S2': {'endExclusive': '0047A5CA', 'sha256': 'c9fe611a0381b8ead3df441f6f5274109688d5c8952a69a5e49e130764c42369'}}, '0047A5D0': {'S1': {'endExclusive': '0047A5D9', 'sha256': '336e6d1ac6f11f67df7db7d5f89a438c5a41aa1673b4e071afda2050a291f656'}, 'S2': {'endExclusive': '0047A5D9', 'sha256': '336e6d1ac6f11f67df7db7d5f89a438c5a41aa1673b4e071afda2050a291f656'}}, '0047A630': {'S1': {'endExclusive': '0047A656', 'sha256': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'}, 'S2': {'endExclusive': '0047A656', 'sha256': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'}}, '0047A690': {'S1': {'endExclusive': '0047A6CF', 'sha256': 'ab0f54956bf79e54dfaca38fb239d3c02f97944201c44732b3e58ef73ab506b0'}, 'S2': {'endExclusive': '0047A6CF', 'sha256': 'ab0f54956bf79e54dfaca38fb239d3c02f97944201c44732b3e58ef73ab506b0'}}, '0047A7B0': {'S1': {'endExclusive': '0047A7CB', 'sha256': '83b5164f882ebb2143935fc24fc191da2ee4741fc481291aa0245cd284277ede'}, 'S2': {'endExclusive': '0047A7CB', 'sha256': '83b5164f882ebb2143935fc24fc191da2ee4741fc481291aa0245cd284277ede'}}, '0047A830': {'S1': {'endExclusive': '0047A84B', 'sha256': '8a7117c6601fe56cfc5ff6d26c73c66aad30684e80698687e3200f10a8f9cd44'}, 'S2': {'endExclusive': '0047A84B', 'sha256': '8a7117c6601fe56cfc5ff6d26c73c66aad30684e80698687e3200f10a8f9cd44'}}, '0047AA80': {'S1': {'endExclusive': '0047AA90', 'sha256': '9a2bb180f23db262c8ced963c3328bd2d09e74d4690e53d97b55b240a525dcf3'}, 'S2': {'endExclusive': '0047AA90', 'sha256': '9a2bb180f23db262c8ced963c3328bd2d09e74d4690e53d97b55b240a525dcf3'}}, '0047B110': {'S1': {'endExclusive': '0047B116', 'sha256': '23334c82ef0133c65cc0394d318a2637276496cb9b99f6dd580d0ee4f6c9e7b5'}, 'S2': {'endExclusive': '0047B116', 'sha256': '23334c82ef0133c65cc0394d318a2637276496cb9b99f6dd580d0ee4f6c9e7b5'}}, '0047B120': {'S1': {'endExclusive': '0047B141', 'sha256': '0d2d36825aeb1660db12af0d55f77568a96538b7d00238fd42c360a609c4d3f3'}, 'S2': {'endExclusive': '0047B141', 'sha256': '0d2d36825aeb1660db12af0d55f77568a96538b7d00238fd42c360a609c4d3f3'}}, '0047B150': {'S1': {'endExclusive': '0047B15E', 'sha256': '52dc4158e437df16124a965fac71d33f46fcbe75856c9f9e760d32cb295fa52f'}, 'S2': {'endExclusive': '0047B15E', 'sha256': '52dc4158e437df16124a965fac71d33f46fcbe75856c9f9e760d32cb295fa52f'}}, '0047B2B0': {'S1': {'endExclusive': '0047B2DD', 'sha256': '2b871355a493a19960355b895dcbf725a6b3c931af48f71d233989991aac5017'}, 'S2': {'endExclusive': '0047B2DD', 'sha256': '2b871355a493a19960355b895dcbf725a6b3c931af48f71d233989991aac5017'}}, '0047C320': {'S1': {'endExclusive': '0047C324', 'sha256': '7e6bda0a031f94dbe8477fe3ce3ba2b7e3d761a050d55625bc7d92212670e60c'}, 'S2': {'endExclusive': '0047C324', 'sha256': '7e6bda0a031f94dbe8477fe3ce3ba2b7e3d761a050d55625bc7d92212670e60c'}}, '0047E050': {'S1': {'endExclusive': '0047E06B', 'sha256': '388757158c5ea3bed3590f126c4ea6fd728a232bca78990a37a4984c8b3b7d0b'}, 'S2': {'endExclusive': '0047E06B', 'sha256': '388757158c5ea3bed3590f126c4ea6fd728a232bca78990a37a4984c8b3b7d0b'}}, '0047E070': {'S1': {'endExclusive': '0047E099', 'sha256': '4f60021d67009a52e6791f4ac1455a00eab1cd6f6b0ee56280c769fcf3ff0b05'}, 'S2': {'endExclusive': '0047E099', 'sha256': '4f60021d67009a52e6791f4ac1455a00eab1cd6f6b0ee56280c769fcf3ff0b05'}}, '00480FA0': {'S1': {'endExclusive': '00480FB5', 'sha256': '483f6f19dd5e587ddf6bb26e39f28aa9c6d118dc3c472d31ca97f38bf74250ad'}, 'S2': {'endExclusive': '00480FB5', 'sha256': '483f6f19dd5e587ddf6bb26e39f28aa9c6d118dc3c472d31ca97f38bf74250ad'}}, '00480FD0': {'S1': {'endExclusive': '00480FEB', 'sha256': '232846f5c08de33b4165c4e96aab197a29c734c44342107d84e197c9554094bb'}, 'S2': {'endExclusive': '00480FEB', 'sha256': '232846f5c08de33b4165c4e96aab197a29c734c44342107d84e197c9554094bb'}}, '00480FF0': {'S1': {'endExclusive': '00481018', 'sha256': '176c12bc4fc33f51e7f7c5d839dcd44842f3701f84c5b3ef9cfe3966997fe0ad'}, 'S2': {'endExclusive': '00481018', 'sha256': '176c12bc4fc33f51e7f7c5d839dcd44842f3701f84c5b3ef9cfe3966997fe0ad'}}, '004834B0': {'S1': {'endExclusive': '004834D1', 'sha256': '4e8e7c70655f7142d2bd828383a216b5ca5d376862fe8dfe574f40df2d2cf74c'}, 'S2': {'endExclusive': '004834D1', 'sha256': '4e8e7c70655f7142d2bd828383a216b5ca5d376862fe8dfe574f40df2d2cf74c'}}, '004834E0': {'S1': {'endExclusive': '004834EE', 'sha256': '759d28c09d885b08eb016a6ea1191b957a930440356797c9f6ffdffbb4f53141'}, 'S2': {'endExclusive': '004834EE', 'sha256': '759d28c09d885b08eb016a6ea1191b957a930440356797c9f6ffdffbb4f53141'}}, '00483810': {'S1': {'endExclusive': '00483814', 'sha256': '07ad3a50b1c271e07fb57fb47d2f0e77f3342d41bfa410990cb1320a45035fb2'}, 'S2': {'endExclusive': '00483814', 'sha256': '07ad3a50b1c271e07fb57fb47d2f0e77f3342d41bfa410990cb1320a45035fb2'}}, '004839F0': {'S1': {'endExclusive': '004839FC', 'sha256': '56b58ce4a05e2ecdfa055b04e499f6a144840249d8e11b28065dfce3bcfee08e'}, 'S2': {'endExclusive': '004839FC', 'sha256': '56b58ce4a05e2ecdfa055b04e499f6a144840249d8e11b28065dfce3bcfee08e'}}, '00483B00': {'S1': {'endExclusive': '00483B1E', 'sha256': 'a5a4e3333b75a6d64582c4998ec5f87d3e2f929616a094182bdce39a99b4b412'}, 'S2': {'endExclusive': '00483B1E', 'sha256': 'a5a4e3333b75a6d64582c4998ec5f87d3e2f929616a094182bdce39a99b4b412'}}, '004863D0': {'S1': {'endExclusive': '004863F1', 'sha256': '5500e4a2326ca7c9ec310cf20083e9050f61f039bd6199011501d274f2e8c5ba'}, 'S2': {'endExclusive': '004863F1', 'sha256': '5500e4a2326ca7c9ec310cf20083e9050f61f039bd6199011501d274f2e8c5ba'}}, '00486400': {'S1': {'endExclusive': '00486424', 'sha256': 'c5f03d3151997a9c57011d7fec3a0e7a61a5f1989a4d5eba46a468965527e2d7'}, 'S2': {'endExclusive': '00486424', 'sha256': 'c5f03d3151997a9c57011d7fec3a0e7a61a5f1989a4d5eba46a468965527e2d7'}}, '00487B30': {'S1': {'endExclusive': '00487BB3', 'sha256': '8620689504983fed521867667ddfdcb2f6477ecc3f0249ed7132c2d22596ca79'}, 'S2': {'endExclusive': '00487BB3', 'sha256': '8620689504983fed521867667ddfdcb2f6477ecc3f0249ed7132c2d22596ca79'}}, '00487DC0': {'S1': {'endExclusive': '00487DC4', 'sha256': 'a97a61afc73231cb78bb2c78600f652c4d2d996c15d963c8764c5c055bf114d1'}, 'S2': {'endExclusive': '00487DC4', 'sha256': 'a97a61afc73231cb78bb2c78600f652c4d2d996c15d963c8764c5c055bf114d1'}}, '00487EB0': {'S1': {'endExclusive': '00488008', 'sha256': '2e8ba025d2f1180608985a96a793de0b18f35b225bf22d16c40b9e524f24730c'}, 'S2': {'endExclusive': '00488008', 'sha256': '2e8ba025d2f1180608985a96a793de0b18f35b225bf22d16c40b9e524f24730c'}}, '004880A0': {'S1': {'endExclusive': '004880B8', 'sha256': '672200b358bfbf28d0eca996b11adc2250ddb5de243887c13c6b8242c07ae09d'}, 'S2': {'endExclusive': '004880B8', 'sha256': '672200b358bfbf28d0eca996b11adc2250ddb5de243887c13c6b8242c07ae09d'}}, '004883B0': {'S1': {'endExclusive': '004883B7', 'sha256': 'b8daa47a1e2c23c0d84bc9ac1de08473d93f8b72166ba2ff5b06db32826f2236'}, 'S2': {'endExclusive': '004883B7', 'sha256': 'b8daa47a1e2c23c0d84bc9ac1de08473d93f8b72166ba2ff5b06db32826f2236'}}, '004883D0': {'S1': {'endExclusive': '004883EB', 'sha256': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3'}, 'S2': {'endExclusive': '004883EB', 'sha256': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3'}}, '004883F0': {'S1': {'endExclusive': '00488422', 'sha256': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088'}, 'S2': {'endExclusive': '00488422', 'sha256': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088'}}, '00488430': {'S1': {'endExclusive': '00488461', 'sha256': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f'}, 'S2': {'endExclusive': '00488461', 'sha256': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f'}}, '00489F10': {'S1': {'endExclusive': '00489F22', 'sha256': 'c9dfadf9bea7a72ed7f905c625e17ccb73ae47616ed799e24fccf78dc8697164'}, 'S2': {'endExclusive': '00489F22', 'sha256': 'c9dfadf9bea7a72ed7f905c625e17ccb73ae47616ed799e24fccf78dc8697164'}}, '0048D790': {'S1': {'endExclusive': '0048D7B1', 'sha256': '797bcaf4dc2e7080ec431b4469f29a065c37d744eef021c65f18d79a62057cb0'}, 'S2': {'endExclusive': '0048D7B1', 'sha256': '797bcaf4dc2e7080ec431b4469f29a065c37d744eef021c65f18d79a62057cb0'}}, '0048D7C0': {'S1': {'endExclusive': '0048D7CE', 'sha256': '34e04f73ca02433f61d2729cc654f93ab9df493e065c1e19e50bd9a6ba3bfa58'}, 'S2': {'endExclusive': '0048D7CE', 'sha256': '34e04f73ca02433f61d2729cc654f93ab9df493e065c1e19e50bd9a6ba3bfa58'}}, '00490A10': {'S1': {'endExclusive': '00490A32', 'sha256': '5fdb5f2212b319522010293ef4ce36bb915efdc6a44b48882a9faecbff95c4f4'}, 'S2': {'endExclusive': '00490A32', 'sha256': '5fdb5f2212b319522010293ef4ce36bb915efdc6a44b48882a9faecbff95c4f4'}}, '00490A40': {'S1': {'endExclusive': '00490A62', 'sha256': '8b122a1d07e6c7372d9e85d06a6fb3025f443cd8d359c150148707def85a97d6'}, 'S2': {'endExclusive': '00490A62', 'sha256': '8b122a1d07e6c7372d9e85d06a6fb3025f443cd8d359c150148707def85a97d6'}}, '00490A70': {'S1': {'endExclusive': '00490A92', 'sha256': 'a7f7198f20c14dd01bd48d9f7c3a356490fafad34d0e4d7d8e40c60d9635c822'}, 'S2': {'endExclusive': '00490A92', 'sha256': 'a7f7198f20c14dd01bd48d9f7c3a356490fafad34d0e4d7d8e40c60d9635c822'}}, '00490AA0': {'S1': {'endExclusive': '00490AC2', 'sha256': 'e9c9bd6a1d8baa85ea48e7f40425871ad9469d7a5a9896f24d16ca03242866db'}, 'S2': {'endExclusive': '00490AC2', 'sha256': 'e9c9bd6a1d8baa85ea48e7f40425871ad9469d7a5a9896f24d16ca03242866db'}}, '00490AD0': {'S1': {'endExclusive': '00490AF2', 'sha256': 'd03849242416ef33815626c63a49db94f0d84740bbe3ae137b638ad756be3333'}, 'S2': {'endExclusive': '00490AF2', 'sha256': 'd03849242416ef33815626c63a49db94f0d84740bbe3ae137b638ad756be3333'}}, '00490B00': {'S1': {'endExclusive': '00490B24', 'sha256': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c'}, 'S2': {'endExclusive': '00490B24', 'sha256': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c'}}, '00490B90': {'S1': {'endExclusive': '00490BB2', 'sha256': 'f15b07997daf87667fe34f62f99504c1f6f4efe454dd45036219e4aba32945b6'}, 'S2': {'endExclusive': '00490BB2', 'sha256': 'f15b07997daf87667fe34f62f99504c1f6f4efe454dd45036219e4aba32945b6'}}, '00490D00': {'S1': {'endExclusive': '00490D21', 'sha256': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a'}, 'S2': {'endExclusive': '00490D21', 'sha256': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a'}}, '00490E70': {'S1': {'endExclusive': '00490E94', 'sha256': '69dce2910ef46501efb42c693e70432a5d30e9156664c3ae48fb55303d72a1be'}, 'S2': {'endExclusive': '00490E94', 'sha256': '69dce2910ef46501efb42c693e70432a5d30e9156664c3ae48fb55303d72a1be'}}, '00491770': {'S1': {'endExclusive': '004917BC', 'sha256': '57db6d0a75e755ba06d4cf80f7dd9e634d89cf02e272c4c7ad3ae053e213f41b'}, 'S2': {'endExclusive': '004917BC', 'sha256': '57db6d0a75e755ba06d4cf80f7dd9e634d89cf02e272c4c7ad3ae053e213f41b'}}, '004922C0': {'S1': {'endExclusive': '00492348', 'sha256': '1238ab9a49364c9f3bc0f5b9b162146f4d9af4314acb01a405586d824ab34e88'}, 'S2': {'endExclusive': '00492348', 'sha256': '1238ab9a49364c9f3bc0f5b9b162146f4d9af4314acb01a405586d824ab34e88'}}, '004951D0': {'S1': {'endExclusive': '004951F1', 'sha256': 'd2c5ec2c8fa93d737e8fa17f16487ddc9621bc84186ebd8c4633670071fc6df4'}, 'S2': {'endExclusive': '004951F1', 'sha256': 'd2c5ec2c8fa93d737e8fa17f16487ddc9621bc84186ebd8c4633670071fc6df4'}}, '004955A0': {'S1': {'endExclusive': '004955D6', 'sha256': '48a97b0d8683f1bc3219f07baa1f5fd2e60e1ff31412e11440328d6233b53499'}, 'S2': {'endExclusive': '004955D6', 'sha256': '48a97b0d8683f1bc3219f07baa1f5fd2e60e1ff31412e11440328d6233b53499'}}, '00495CE0': {'S1': {'endExclusive': '00495E24', 'sha256': '712730249836ebc18ae880302e8fa56adab4cd17438eddef313fd334fcbe337d'}, 'S2': {'endExclusive': '00495E24', 'sha256': '712730249836ebc18ae880302e8fa56adab4cd17438eddef313fd334fcbe337d'}}, '00495E24': {'S1': {'endExclusive': '00495E3C', 'sha256': '002314239b99c1b5de9cf8c711bc4e5b640bd9587781ea5915ab840c12146eac'}, 'S2': {'endExclusive': '00495E3C', 'sha256': '002314239b99c1b5de9cf8c711bc4e5b640bd9587781ea5915ab840c12146eac'}}, '00495E3C': {'S1': {'endExclusive': '00495E49', 'sha256': 'bcc618dc98141b7aca81b2f267180dd878d8782f843d734787a4bf3d1100a2a4'}, 'S2': {'endExclusive': '00495E49', 'sha256': 'bcc618dc98141b7aca81b2f267180dd878d8782f843d734787a4bf3d1100a2a4'}}, '00495E4C': {'S1': {'endExclusive': '00495E5C', 'sha256': '1fe5c58902562e0a04d82534412cabad89f4e001a43511f3f39a944b0e1b3b12'}, 'S2': {'endExclusive': '00495E5C', 'sha256': '1fe5c58902562e0a04d82534412cabad89f4e001a43511f3f39a944b0e1b3b12'}}, '00495E5C': {'S1': {'endExclusive': '00495E6C', 'sha256': '37984025a317d1f33956d28de2c040fe7087e44d76396b3e23c70091dbbe99fe'}, 'S2': {'endExclusive': '00495E6C', 'sha256': '37984025a317d1f33956d28de2c040fe7087e44d76396b3e23c70091dbbe99fe'}}, '00496040': {'S1': {'endExclusive': '00496095', 'sha256': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55'}, 'S2': {'endExclusive': '00496095', 'sha256': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55'}}, '00496D90': {'S1': {'endExclusive': '00496DA2', 'sha256': '04fc43ea99ccb0bfbb25c4dfc4b2843bc5d1464f9b50d2c2fae1b5dd3a327b7a'}, 'S2': {'endExclusive': '00496DA2', 'sha256': '04fc43ea99ccb0bfbb25c4dfc4b2843bc5d1464f9b50d2c2fae1b5dd3a327b7a'}}, '004BA1D0': {'S1': {'endExclusive': '004BA485', 'sha256': '70d2f33412b51e4e1337942addf82032c79021ea9c37cf562d95ad144daea67c'}, 'S2': {'endExclusive': '004BA485', 'sha256': '70d2f33412b51e4e1337942addf82032c79021ea9c37cf562d95ad144daea67c'}}, '00557AC0': {'S1': {'endExclusive': '00557AC6', 'sha256': 'accecba762116532de10ac30681ff4b25ad91fe217568ec41c8ffd67b9ef2bcf'}, 'S2': {'endExclusive': '00557AC6', 'sha256': 'accecba762116532de10ac30681ff4b25ad91fe217568ec41c8ffd67b9ef2bcf'}}, '00573470': {'S1': {'endExclusive': '00573476', 'sha256': '21faa16607cb70438711aab3fa582829af50aa15d5946524996fc7aa8a8e4e6d'}, 'S2': {'endExclusive': '00573476', 'sha256': '21faa16607cb70438711aab3fa582829af50aa15d5946524996fc7aa8a8e4e6d'}}, '0065D6C0': {'S1': {'endExclusive': '0065D6C4', 'sha256': 'f7e0208f5e988ae39c7a45dfddbd12921d02f9c3deb5695d4c534c8ab0ccdb0f'}, 'S2': {'endExclusive': '0065D6C4', 'sha256': 'f7e0208f5e988ae39c7a45dfddbd12921d02f9c3deb5695d4c534c8ab0ccdb0f'}}, '0067F810': {'S1': {'endExclusive': '0067F816', 'sha256': '07297dca94be1b975a5dc696b5976f205b84057995fa3d3fbb157101b1ae8098'}, 'S2': {'endExclusive': '0067F816', 'sha256': '07297dca94be1b975a5dc696b5976f205b84057995fa3d3fbb157101b1ae8098'}}, '006903A0': {'S1': {'endExclusive': '006903A6', 'sha256': '7500687ab6484f894dd29beddc484e671de6539e4faf19ef80805cfd49e55624'}, 'S2': {'endExclusive': '006903A6', 'sha256': '7500687ab6484f894dd29beddc484e671de6539e4faf19ef80805cfd49e55624'}}, '0072EE10': {'S1': {'endExclusive': '0072EE18', 'sha256': '77ddeda12e629875ee9826a9a8fe918b047fae98914ca11f3dbe9526aa11bc40'}, 'S2': {'endExclusive': '0072EE22', 'sha256': '26beeea16e9a66774fde567ecd7d1e993a04fda888a79c09cf9c85994f77f9e2'}}, '0079BF58': {'S1': {'endExclusive': '0079BFA8', 'sha256': '53abf891e2facef0229898ea8c6462e1e99d0c0d60f2ef36c78e6eced74f08ce'}, 'S2': {'endExclusive': '0079BFA8', 'sha256': '53abf891e2facef0229898ea8c6462e1e99d0c0d60f2ef36c78e6eced74f08ce'}}, '0079BFB0': {'S1': {'endExclusive': '0079C000', 'sha256': 'cb2fe670413e8efe4faa99c693e9de77d689a0bfe99545d93beb2e597c1b3cd7'}, 'S2': {'endExclusive': '0079C000', 'sha256': 'cb2fe670413e8efe4faa99c693e9de77d689a0bfe99545d93beb2e597c1b3cd7'}}, '0079C0E8': {'S1': {'endExclusive': '0079C138', 'sha256': 'c795b528970e6dd14c97b609e7c1415e51e3fb2928be08a86153dc5981e7e9e5'}, 'S2': {'endExclusive': '0079C138', 'sha256': 'c795b528970e6dd14c97b609e7c1415e51e3fb2928be08a86153dc5981e7e9e5'}}, '0079C170': {'S1': {'endExclusive': '0079C1C0', 'sha256': '59b4c81d8253e970cf5504dd25c37126674093f84d4df7b532d92a508b8c5633'}, 'S2': {'endExclusive': '0079C1C0', 'sha256': '59b4c81d8253e970cf5504dd25c37126674093f84d4df7b532d92a508b8c5633'}}, '0079C2B0': {'S1': {'endExclusive': '0079C330', 'sha256': 'd692c5d627bf8182061c550e469f9e0b13e17d483aadbec413ec11491d3f0272'}, 'S2': {'endExclusive': '0079C330', 'sha256': 'c43c9e7e16ef2efa065e931224a872a8d97c6463bca829b7aaeb6212c2992d0d'}}, '0079C358': {'S1': {'endExclusive': '0079C558', 'sha256': '1baebecf5fe9802f84a50368e9602469796cba9a1a9b1b0f2bfe82d85dad6fac'}, 'S2': {'endExclusive': '0079C558', 'sha256': '1baebecf5fe9802f84a50368e9602469796cba9a1a9b1b0f2bfe82d85dad6fac'}}, '0079C718': {'S1': {'endExclusive': '0079C774', 'sha256': '93644003052b306a2543d1e4cd26359f5e743ec4450b0b0d59742f7f4ecaffec'}, 'S2': {'endExclusive': '0079C774', 'sha256': '93644003052b306a2543d1e4cd26359f5e743ec4450b0b0d59742f7f4ecaffec'}}, '0079C780': {'S1': {'endExclusive': '0079C7D0', 'sha256': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c'}, 'S2': {'endExclusive': '0079C7D0', 'sha256': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c'}}, '0079C7D0': {'S1': {'endExclusive': '0079C820', 'sha256': '4de624b4f1dccc089cf3e7f124a048c76b96ccd45f1b76ff439f919a00759f1c'}, 'S2': {'endExclusive': '0079C820', 'sha256': '4de624b4f1dccc089cf3e7f124a048c76b96ccd45f1b76ff439f919a00759f1c'}}, '0079CC18': {'S1': {'endExclusive': '0079CC80', 'sha256': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff'}, 'S2': {'endExclusive': '0079CC80', 'sha256': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff'}}}
VERIFICATION_HASHES = {'raw-verification.json': '606f0fe5aff15d2b517a57c28275caca47888c69c0bfe07879ec25433fbcdd43', 'recovery-evidence-S1.json': '45828cf89f143b46bab526ff868c0493df835fa3a1b84d8f028bf12d1cea4d5b', 'recovery-evidence-S2.json': '5a818b5fc014ed35659e704db8de2f9df531907c02049ae07f9e47e191a56638'}
BUDGET = {'focusedIntervals': 150, 'reusedExactInheritedIntervals': 116, 'newUniqueIntervals': 34, 'codeIntervals': 122, 'completeIDBFunctionIntervals': 122, 'dataIntervals': 28, 'selectedBytesBothSources': 9102, 'instructions': 2328, 'callSites': 212, 'branchSites': 319, 'inheritedSelectedIntervals': 1263, 'allSelectedIntervals': 1297, 'newMachineCodeBytesRecovered': 1280}

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


def s32(v):return struct.unpack('<i',struct.pack('<I',v&0xffffffff))[0]
def target_order(raw):
    """Independent interpretation of unsigned INC and the pinned switch tables."""
    index=(raw+1)&0xffffffff
    if index>12:return 'null'
    return ('null','null','kind','map','kind','base','kind','kind','base','base','base','kind','null')[index]


class NativeEvent9SelectionSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.e,cls.raw,cls.ins,cls.prior,cls.selected=load_evidence()
    def at(self,s,f,a,value):
        b=bytes.fromhex(value);o=a-int(f,16);self.assertEqual(self.raw[s,f][o:o+len(b)],b)
    def call(self,s,f,a,target):
        b=self.raw[s,f][a-int(f,16):a-int(f,16)+5]
        self.assertEqual(b[0],0xe8);self.assertEqual(a+5+struct.unpack_from('<i',b,1)[0],target)

    def test_01_source_identity_scope_and_baseline(self):
        self.assertEqual(self.e['profileId'],'source-idb-S1-S2-native-event9-selection-v1')
        self.assertEqual(self.e['frameProfileId'],'source-idb-S1-S2-native-event9-selection-frame-v1')
        self.assertEqual(self.e['baselineCommit'],BASELINE)
        self.assertEqual(self.e['sources'],self.prior[0]['sources'])
        self.assertEqual({s['source']:s['idbSha256'] for s in self.e['sources']},SOURCE_HASHES)
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        self.assertEqual(self.e['adoption'],{'PC-PK1.1':'compatibility-reconstruction','PC-Vanilla-assumed':'compatibility-assumption','PS2-Wii':'open'})
        for k in ['stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified','rawRuntimeMapCaptured']:self.assertIs(self.e[k],False)

    def test_02_frozen_inherited_closure(self):
        result=unittest.TextTestRunner(stream=io.StringIO()).run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeLivePositionSource))
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

    def test_05_event9_saved_scalars_and_subject_type_only_cast(self):
        for s in SOURCE_HASHES:
            f='004BA1D0'
            self.at(s,f,0x4ba1e3,'83 cd ff 83 e8 09 89 4c 24 20 c7 44 24 1c 00 00 00 00 89 6c 24 10 89 6c 24 14 74 68')
            self.at(s,f,0x4ba267,'8b 77 04 85 f6 74 11 8b 3e')
            self.call(s,f,0x4ba270,0x573470)
            self.at(s,f,0x4ba275,'50 8b ce ff 57 2c 85 c0 75 02 33 f6 89 74 24 1c')
            self.assertEqual(self.raw[s,'00573470'],bytes.fromhex('b8 05 00 00 00 c3'))
            # Event10 falls through9/16/18 dispatch and returns without list read.
            self.at(s,f,0x4ba1ff,'83 e8 07 74 09 83 e8 02 0f 85 6b 02 00 00')
        self.assertFalse(self.e['semantics']['entry']['subjectValidityChecked'])

    def test_06_head_once_and_saved_cursor_reload(self):
        for s in SOURCE_HASHES:
            f='004BA1D0'
            self.at(s,f,0x4ba285,'a1 d0 b4 3f 07 85 c0 89 44 24 18 0f 84 e2 01 00 00')
            self.assertEqual(self.raw[s,f].count(bytes.fromhex('a1 d0 b4 3f 07')),1)
            self.at(s,f,0x4ba296,'8d 44 24 18 50 b9 cc b4 3f 07')
            self.call(s,f,0x4ba2a0,0x4922c0)
            self.at(s,f,0x4ba2a5,'8b 30 56')
            self.at(s,f,0x4ba46c,'8b 44 24 18 85 c0 0f 85 1e fe ff ff')
        self.assertEqual(self.e['semantics']['iterator']['initialHeadReadCount'],1)

    def test_07_list_lock_probe_advance_then_payload_address(self):
        for s in SOURCE_HASHES:
            f='004922C0'
            self.at(s,f,0x4922d9,'68 68 78 ee 06 8b d9 ff 15 60 e3 74 00')
            self.at(s,f,0x4922e6,'8b 7c 24 20 8b 37 6a 01 6a 0c 56')
            self.call(s,f,0x4922f9,0x472070)
            self.at(s,f,0x49230a,'8b 06 89 07 ff 15 5c e3 74 00 5f 8d 46 08')
            self.at(s,f,0x49232b,'ff 15 5c e3 74 00 8b 4c 24 10 5f 5e 8d 43 1c')
            self.assertEqual([(r['site'],r['bytes']) for r in self.e['callLedgers'][s][f] if r['kind']=='indirect'],[('004922E0','ff 15 60 e3 74 00'),('0049230E','ff 15 5c e3 74 00'),('0049232B','ff 15 5c e3 74 00')])
        self.assertTrue(self.e['semantics']['iterator']['probeReadable']);self.assertTrue(self.e['semantics']['iterator']['probeWritable'])

    def test_08_platform_probe_and_import_metadata_not_runtime_values(self):
        for s in SOURCE_HASHES:
            f='00472070'
            self.at(s,f,0x472080,'ff 15 68 e2 74 00 85 c0 75 1c')
            self.at(s,f,0x47208a,'8b 44 24 14 85 c0 74 0c')
            self.at(s,f,0x472094,'ff 15 6c e2 74 00 85 c0 75 08')
            for a,name in [('0074E35C','LeaveCriticalSection'),('0074E360','EnterCriticalSection')]:
                metadata=self.e['importSlotMetadata'][s][a]
                self.assertEqual(metadata['name'],name);self.assertFalse(metadata['runtimeValueCertified'])
                self.assertNotIn((s,a),self.raw)
        self.assertNotEqual(self.e['importSlotMetadata']['S1']['0074E35C']['idapythonBytes'],self.e['importSlotMetadata']['S1']['0074E35C']['rawId1LowBytes'])

    def test_09_troop_validity_then_captured_force_range(self):
        for s in SOURCE_HASHES:
            self.call(s,'004BA1D0',0x4ba2a8,0x47a630)
            self.at(s,'004BA1D0',0x4ba2ad,'83 c4 04 85 c0 0f 84 b4 01 00 00 8b 5e 44 85 db 0f 8c a9 01 00 00 83 fb 2e 0f 8f a0 01 00 00')
            self.call(s,'004BA1D0',0x4ba2ce,0x495ce0)
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079CC18'],8)[0],0x496040)
            self.at(s,'00496040',0x496043,'8b 06 ff 50 24 83 f8 0b 75 44')
            self.call(s,'00496040',0x496056,0x490b00);self.call(s,'00496040',0x49605c,0x47a630)
            self.at(s,'00496040',0x496070,'85 c0 7c 0d 83 f8 02 7d 08 81 39 4c 04 00 00 7d 10')
        self.assertEqual(self.e['semantics']['rawFields']['requestedForce'],dict(offset=68,width=32,signed=True))

    def test_10_target_order_switch_unsigned_full_tables(self):
        labels={0x495d82:'null',0x495cff:'kind',0x495d75:'map',0x495d87:'base',0x495d97:'kind',0x495d56:'base'}
        for s in SOURCE_HASHES:
            self.at(s,'00495CE0',0x495ce4,'8b 46 2c 40 83 f8 0c 0f 87 91 00 00 00 0f b6 80 3c 5e 49 00 ff 24 85 24 5e 49 00')
            slots=struct.unpack('<6I',self.raw[s,'00495E24']);index=self.raw[s,'00495E3C']
            self.assertEqual(len(index),13)
            for order in range(-1,12):self.assertEqual(labels[slots[index[order+1]]],target_order(order))
            for order in [-2**31,-2,12,2**31-1]:self.assertEqual(target_order(order),'null')
            self.assertEqual(self.raw[s,'00495CE0'].count(bytes.fromhex('8b 46 2c')),1)
        self.assertEqual(self.e['semantics']['target']['dispatch'],{str(i):target_order(i) for i in range(-1,12)})

    def test_11_target_revalidation_precedes_live_kind_and_id(self):
        for s in SOURCE_HASHES:
            f='00495CE0'
            for site in [0x495d00,0x495d57,0x495d76,0x495d88,0x495d98]:self.call(s,f,site,0x47a630)
            self.at(s,f,0x495d0c,'8b 46 34 83 f8 ff 74 6e 83 f8 03 77 69 ff 24 85 4c 5e 49 00')
            self.at(s,f,0x495da4,'8b 46 34 83 f8 ff 74 d6 83 f8 03 77 d1 ff 24 85 5c 5e 49 00')
            self.assertEqual(struct.unpack('<4I',self.raw[s,'00495E4C']),(0x495d20,0x495d32,0x495dee,0x495d44))
            self.assertEqual(struct.unpack('<4I',self.raw[s,'00495E5C']),(0x495db8,0x495dca,0x495dee,0x495ddc))
            for site,op in [(0x495d20,'0f bf 4e 30'),(0x495d32,'0f bf 56 30'),(0x495d44,'0f bf 46 30'),(0x495d63,'0f bf 56 30'),(0x495db8,'0f bf 46 30'),(0x495dca,'0f bf 4e 30'),(0x495ddc,'0f bf 56 30')]:self.at(s,f,site,op)
            for site,target in [(0x495d2a,0x490d00),(0x495d3c,0x490e70),(0x495d4e,0x490b00),(0x495d6d,0x490d00),(0x495dc2,0x490d00),(0x495dd4,0x490e70),(0x495de6,0x490b00)]:self.call(s,f,site,target)

    def test_12_target_packed_map_no_invented_bounds(self):
        for s in SOURCE_HASHES:
            self.at(s,'00495CE0',0x495dee,'8b 76 38 0f bf c6 69 c0 c8 00 00 00 8b ce c1 f9 10 03 c1 8d 0c 80 6a 01 8d 0c 8d 68 0e fb 06')
            self.call(s,'00495CE0',0x495e11,0x47a5b0);self.call(s,'00495CE0',0x495e1c,0x490d00)
            self.assertEqual(self.raw[s,'0047A5B0'],bytes.fromhex('8b49048b442404c1e9055083e17f51e83c95000083c408c20400'))
            self.assertEqual(self.raw[s,'00483B00'],bytes.fromhex('8b4424048b048558c3790085c07d0e8b4c240885c97403f7d8c383c8ffc3'))
            self.at(s,'00490D00',0x490d04,'85 c0 7c 14 3d ff 3f 00 00 7f 0d')
            self.assertEqual(struct.unpack('<128i',self.raw[s,'0079C358'])[:42],tuple(range(42)))
        self.assertEqual(200*(-1)+200,-0)
        self.assertEqual(s32(-(-2**31)),-2**31)

    def test_13_target_cast_type_and_validity_sequence(self):
        for s in SOURCE_HASHES:
            self.at(s,'004BA1D0',0x4ba2d3,'8b f8 85 ff 74 15 8b 2f')
            self.call(s,'004BA1D0',0x4ba2db,0x573470)
            self.at(s,'004BA1D0',0x4ba2e0,'50 8b cf ff 55 2c 85 c0 8b 6c 24 14 75 02 33 ff 57')
            self.call(s,'004BA1D0',0x4ba2f1,0x47a630)
            for table,method in [('0079C718',0x4863d0),('0079CC18',0x4951d0),('0079C780',0x4883d0)]:self.assertEqual(struct.unpack_from('<I',self.raw[s,table],0x2c)[0],method)
            self.call(s,'004863D0',0x4863d6,0x47a830);self.at(s,'004863D0',0x4863df,'83 fe 05 74 04')
            self.call(s,'004951D0',0x4951d6,0x47a830);self.at(s,'004951D0',0x4951df,'83 fe 0b 74 04')
            self.assertEqual(self.raw[s,'004883D0'],bytes.fromhex('8b44240483f81a740a83f80a740533c0c20400b801000000c20400'))
            self.assertEqual(self.raw[s,'0047A830'],bytes.fromhex('8b44240483f81a740a83f81b740533c0c20400b801000000c20400'))

    def test_14_invalid_same_target_and_repeated_live_force_calls(self):
        for s in SOURCE_HASHES:
            f='004BA1D0'
            self.at(s,f,0x4ba2f6,'83 c4 04 85 c0 74 48 3b 7c 24 1c 74 42')
            self.at(s,f,0x4ba303,'8b 17 8b cf ff 52 40 3b 44 24 10 75 0f 3b dd 74 31')
            self.at(s,f,0x4ba314,'8b 06 8b ce ff 50 40 3b c5 eb 20')
            self.at(s,f,0x4ba31f,'8b 17 8b cf ff 52 40 3b c5 0f 85 3e 01 00 00 3b 5c 24 10 74 11')
            self.at(s,f,0x4ba334,'8b 06 8b ce ff 50 40 3b 44 24 10 0f 85 27 01 00 00')
        self.assertIn('call target+40 again',self.e['semantics']['eligibility'])

    def test_15_troop_force_revalidates_and_reloads_leader(self):
        for s in SOURCE_HASHES:
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079CC18'],0x40)[0],0x4955a0)
            self.at(s,'004955A0',0x4955a0,'56 8b f1 8b 06 ff 50 08 85 c0 74 25 8b 46 0c')
            self.call(s,'004955A0',0x4955b5,0x490b00);self.call(s,'004955A0',0x4955bd,0x47a630)
            self.at(s,'004955A0',0x4955c5,'85 c0 74 08 8b 16 8b ce 5e ff 62 40 83 c8 ff 5e c3')
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079C780'],0x40)[0],0x47b2b0)
            self.at(s,'0047B2B0',0x47b2b0,'8b 01 56 ff 50 44 50')
            self.call(s,'0047B2B0',0x47b2bc,0x490ad0);self.call(s,'0047B2B0',0x47b2c4,0x47a630)
            self.assertEqual(self.raw[s,'004883B0'],bytes.fromhex('8b8194000000c3'))
            self.assertEqual(self.raw[s,'0065D6C0'],bytes.fromhex('8b4104c3'))

    def test_16_base_force_retains_inherited_category_map_subtypes(self):
        for s in SOURCE_HASHES:
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079C718'],0x40)[0],0x487eb0)
            self.call(s,'00487EB0',0x487eb4,0x487b30)
            self.at(s,'00487EB0',0x487eb9,'85 c0 74 06 8b 46 0c 5e 59 c3')
            self.call(s,'00487EB0',0x487ed6,0x490b90)
            self.at(s,'00487EB0',0x487edb,'83 b8 b4 00 00 00 04 75 5e')
            self.call(s,'00487EB0',0x487f14,0x4839f0);self.call(s,'00487EB0',0x487f48,0x491770)
            for table,getter in [('0079BF58',0x47c320),('0079C170',0x483810),('0079C7D0',0x483810)]:self.assertEqual(struct.unpack_from('<II',self.raw[s,table],0x40),(0x47b2b0,getter))
            self.assertEqual(self.raw[s,'004839F0'],bytes.fromhex('8b4424040fb680b0c27900c3'))
            self.assertNotEqual(self.raw[s,'0079C2B0'],self.raw[s,'0079C358'][:128])

    def test_17_suffix_boundary_preserves_preconversion_force_and_presentation(self):
        for s in SOURCE_HASHES:
            f='004BA1D0'
            self.at(s,f,0x4ba345,'53 b9 58 19 20 07');self.call(s,f,0x4ba34b,0x490aa0)
            self.at(s,f,0x4ba350,'8b 16 8b ce 8b d8 ff 52 48 85 c0 75 20')
            self.at(s,f,0x4ba366,'85 c0 0f 84 c4 00 00 00')
            self.at(s,f,0x4ba375,'85 c0 0f 84 b5 00 00 00')
            for a,t in [(0x4ba424,0x5c1a40),(0x4ba42a,0x4f55e0),(0x4ba43d,0x4b5020),(0x4ba447,0x4ad2b0),(0x4ba44e,0x495520),(0x4ba459,0x490d00),(0x4ba467,0x4ad220)]:self.call(s,f,a,t)
        suffix=self.e['semantics']['suffix'];self.assertEqual((suffix['entry'],suffix['exit']),('004BA345','004BA46C'))
        self.assertIn('raw troop+44 in EBX',suffix['savedLocals']);self.assertIn('saved next-node cursor',suffix['savedLocals'])
        self.assertEqual(suffix['classification'],'exact whole-frame/RNG effect boundary')

    def test_18_virtual48_evidence_is_outside_native_selection(self):
        for s in SOURCE_HASHES:
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079CC18'],0x48)[0],0x47a690)
            self.at(s,'0047A690',0x47a690,'8b 01 56 ff 50 40 50')
            self.call(s,'0047A690',0x47a69c,0x490aa0)
            self.at(s,'0047A690',0x47a6bc,'ff 52 08 85 c0 75 04')
            self.at(s,'0047A690',0x47a6c7,'8b 06 8b ce 5e ff 60 48')
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079C0E8'],0x48)[0],0x480fa0)
            self.at(s,'00480FA0',0x480fa0,'8b 41 60 85 c0 7c 0b 83 f8 07 7f 06')
        self.assertIn('outside native selection claim',self.e['semantics']['suffix']['investigatedVirtual48'])

    def test_19_node_mutation_examples_and_no_snapshot_semantics(self):
        # Scalar source-order illustration: next is captured before callback,
        # then the next visit reads that node's current payload and next.
        nodes={10:[20,7],20:[30,7],30:[0,8]};cursor=10;seen=[]
        current=cursor;cursor=nodes[current][0];seen.append(nodes[current][1])
        nodes[current]=[0,99];nodes[20]=[30,9];del nodes[10]
        while cursor:
            current=cursor;cursor=nodes[current][0];seen.append(nodes[current][1])
        self.assertEqual(seen,[7,9,8])
        duplicates={10:(20,7),20:(30,7),30:(0,8)};cursor=10;seen=[]
        while cursor:
            next_node,payload=duplicates[cursor];seen.append(payload);cursor=next_node
        self.assertEqual(seen,[7,7,8]) # Duplicate payload IDs are not deduplicated.
        self.assertIn('No native visited set',self.e['semantics']['iterator']['cycle'])
        self.assertIn('atomic rejection',self.e['semantics']['iterator']['cycle'])
        self.assertIn('without advancing cursor',self.e['semantics']['iterator']['invalidProbe'])
        self.assertIn('not native-invalid',self.e['semantics']['unknownDispatch'])
        self.assertIn('effect-query',self.e['semantics']['unknownDispatch'])

    def test_20_recovery_reports_source_differences_and_no_extra_data(self):
        differences=[]
        for r in self.e['comparisons']:
            a,b=self.raw['S1',r['start']],self.raw['S2',r['start']]
            self.assertEqual(r['identical'],a==b)
            self.assertEqual(r['differingByteCount'],sum(x!=y for x,y in zip(a,b))+abs(len(a)-len(b)))
            if a!=b:differences.append(r['start'])
            for s,v in [('S1',a),('S2',b)]:self.assertEqual(r[s+'length'],len(v));self.assertEqual(r[s+'sha256'],digest(v))
        self.assertEqual(differences,['0072EE10','0079C2B0'])
        self.assertEqual({r['file']:r['sha256'] for r in self.e['provenance']['verificationArtifacts']},VERIFICATION_HASHES)
        for f,h in VERIFICATION_HASHES.items():self.assertEqual(digest((DIRECTORY/f).read_bytes()),h)
        for s in SOURCE_HASHES:
            recovery=json.loads((DIRECTORY/f'recovery-evidence-{s}.json').read_text())
            self.assertEqual(recovery['ranges'],[{k:v for k,v in r.items() if k!='evidenceUse'} for r in self.e['ranges'] if r['source']==s])
            self.assertEqual(recovery['functionRegions'],{k:v for k,v in self.e['functionRegions'].items() if k.startswith(s+':')})
            self.assertEqual(recovery['importSlotMetadata'],self.e['importSlotMetadata'][s])
        names={p.name for p in DIRECTORY.glob('*.asm.txt')}|{p.name for p in DIRECTORY.glob('*.data.txt')}
        self.assertEqual(names,{r['file'] for r in self.e['ranges']})

    def test_21_source_checker_independence(self):
        imports=[]
        for node in ast.walk(ast.parse(Path(__file__).read_text())):
            if isinstance(node,ast.Import):imports.extend(a.name.split('.')[0] for a in node.names)
            elif isinstance(node,ast.ImportFrom):imports.append((node.module or '').split('.')[0])
        self.assertTrue(set(imports)<={'argparse','ast','io','json','pathlib','struct','sys','unittest','check_native_live_position_source','check_live_zero_refund_source','check_officer_relocation_source'})
        for name in ['native_event9_selection_profile','native_event9_selection_frame','native_event9_selection_primitives','native_live_position_profile','native_troop_membership_profile']:self.assertNotIn(name,sys.modules)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--idb-s1',type=Path);parser.add_argument('--idb-s2',type=Path);parser.add_argument('--report',type=Path)
    args=parser.parse_args();result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeEvent9SelectionSource))
    if not result.wasSuccessful():return 1
    e,raw,ins,prior,selected=load_evidence();verified=[]
    for s,p in [('S1',args.idb_s1),('S2',args.idb_s2)]:
        if p is not None:
            verify_raw_id1(p,s,selected);verified.append(dict(source=s,idbSha256=SOURCE_HASHES[s],intervals=sum(k[0]==s for k in selected),selectedIntervalBytes=sum(len(b) for k,b in selected.items() if k[0]==s)))
    report=dict(checker=Path(__file__).name,sourceProfile=e['profileId'],baselineCommit=BASELINE,sourceTests=result.testsRun,inheritedSourceTests=21,nestedInheritedSourceTests=[17,12,13],sourceTestsPassed=True,rangeBudget=BUDGET,rawId1Verification=verified,machineCodeExecuted=False,originalExeExecuted=False,stockOriginalVerified=False,recordedExeHashesIndependentlyVerified=False,rawRuntimeMapCaptured=False,suffixEntry='004BA345',suffixExit='004BA46C',savedCursorBeforePayload=True,event16or18Implemented=False)
    if args.report:args.report.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,sort_keys=True));return 0
if __name__=='__main__':raise SystemExit(main())
