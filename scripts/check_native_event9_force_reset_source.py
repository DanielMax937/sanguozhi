"""Independent event9 force-reset source proof; no production-model imports.

Stdlib checks fingerprinted byte columns, complete call/branch operands, recovery
metadata and exact caller/callee widths/order. Optional --decode re-decodes every
focused instruction with Capstone. Optional IDBs verify entire file fingerprints
and all 1323 inherited/new selected intervals through raw uncompressed ID1.
No native machine code or executable is run by this checker.
"""
import argparse
import ast
import io
import json
from pathlib import Path
import re
import struct
import sys
import unittest
from check_native_event9_presentation_source import NativeEvent9PresentationSource, load_evidence as load_prior
from check_officer_relocation_source import SOURCE_HASHES, digest, verify_raw_id1
ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'docs/sources/native_event9_force_reset.json'
DIRECTORY=MANIFEST.with_suffix('')
BASELINE='bbaaf647b62fa0814c8333eb1a1dc07f407649d7'
PINS = {'docs/sources/native_event9_presentation.json': '8d08f6e16eb28a2128f00ee30ac1db1458db25a4032276306cc4c1e92c31e926', 'scripts/check_native_event9_presentation_source.py': '888a8794847eb9f7045b948dba02721930797cbb3fd9f74a66290759369b9f8b', 'scripts/native_event9_presentation_profile.py': '7d3c8ef5c66923f6f095809f774345c5a0cef00721d32f3e9bc44936182b26fb', 'scripts/native_event9_presentation_frame.py': '097b66e3a66335e8874bd15ff41d6102c456a617c50c152e5e7372295d07cd13', 'scripts/native_event9_presentation_primitives.py': '6f4c049091d34dafe8284467ab77f63608f196256ca00bc3d265e48b8d4e1392', 'scripts/check_native_event9_presentation_profile.py': 'c160e336c83e2879c2ee0d835e8e702bd97cbb3ce72c958a8059847dd5b0d256'}
BODY_HASHES = {'0041C130': {'S1': {'endExclusive': '0041C135', 'sha256': '81794790c0ad77391e995d91903df71d532fdf23777b0a32cef0c4606e844a6f'}, 'S2': {'endExclusive': '0041C135', 'sha256': '81794790c0ad77391e995d91903df71d532fdf23777b0a32cef0c4606e844a6f'}}, '00468E60': {'S1': {'endExclusive': '00468E66', 'sha256': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb'}, 'S2': {'endExclusive': '00468E66', 'sha256': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb'}}, '00472070': {'S1': {'endExclusive': '004720AB', 'sha256': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'}, 'S2': {'endExclusive': '004720AB', 'sha256': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'}}, '0047A5B0': {'S1': {'endExclusive': '0047A5CA', 'sha256': 'c9fe611a0381b8ead3df441f6f5274109688d5c8952a69a5e49e130764c42369'}, 'S2': {'endExclusive': '0047A5CA', 'sha256': 'c9fe611a0381b8ead3df441f6f5274109688d5c8952a69a5e49e130764c42369'}}, '0047A5D0': {'S1': {'endExclusive': '0047A5D9', 'sha256': '336e6d1ac6f11f67df7db7d5f89a438c5a41aa1673b4e071afda2050a291f656'}, 'S2': {'endExclusive': '0047A5D9', 'sha256': '336e6d1ac6f11f67df7db7d5f89a438c5a41aa1673b4e071afda2050a291f656'}}, '0047A630': {'S1': {'endExclusive': '0047A656', 'sha256': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'}, 'S2': {'endExclusive': '0047A656', 'sha256': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'}}, '0047A690': {'S1': {'endExclusive': '0047A6CF', 'sha256': 'ab0f54956bf79e54dfaca38fb239d3c02f97944201c44732b3e58ef73ab506b0'}, 'S2': {'endExclusive': '0047A6CF', 'sha256': 'ab0f54956bf79e54dfaca38fb239d3c02f97944201c44732b3e58ef73ab506b0'}}, '0047A770': {'S1': {'endExclusive': '0047A7AD', 'sha256': 'c781ffe379c72b8fe4ea4908f6d93c767358971e4299a25ab369bc75e7ccc76c'}, 'S2': {'endExclusive': '0047A7AD', 'sha256': 'c781ffe379c72b8fe4ea4908f6d93c767358971e4299a25ab369bc75e7ccc76c'}}, '0047A7B0': {'S1': {'endExclusive': '0047A7CB', 'sha256': '83b5164f882ebb2143935fc24fc191da2ee4741fc481291aa0245cd284277ede'}, 'S2': {'endExclusive': '0047A7CB', 'sha256': '83b5164f882ebb2143935fc24fc191da2ee4741fc481291aa0245cd284277ede'}}, '0047A830': {'S1': {'endExclusive': '0047A84B', 'sha256': '8a7117c6601fe56cfc5ff6d26c73c66aad30684e80698687e3200f10a8f9cd44'}, 'S2': {'endExclusive': '0047A84B', 'sha256': '8a7117c6601fe56cfc5ff6d26c73c66aad30684e80698687e3200f10a8f9cd44'}}, '0047AA80': {'S1': {'endExclusive': '0047AA90', 'sha256': '9a2bb180f23db262c8ced963c3328bd2d09e74d4690e53d97b55b240a525dcf3'}, 'S2': {'endExclusive': '0047AA90', 'sha256': '9a2bb180f23db262c8ced963c3328bd2d09e74d4690e53d97b55b240a525dcf3'}}, '0047B110': {'S1': {'endExclusive': '0047B116', 'sha256': '23334c82ef0133c65cc0394d318a2637276496cb9b99f6dd580d0ee4f6c9e7b5'}, 'S2': {'endExclusive': '0047B116', 'sha256': '23334c82ef0133c65cc0394d318a2637276496cb9b99f6dd580d0ee4f6c9e7b5'}}, '0047B120': {'S1': {'endExclusive': '0047B141', 'sha256': '0d2d36825aeb1660db12af0d55f77568a96538b7d00238fd42c360a609c4d3f3'}, 'S2': {'endExclusive': '0047B141', 'sha256': '0d2d36825aeb1660db12af0d55f77568a96538b7d00238fd42c360a609c4d3f3'}}, '0047B150': {'S1': {'endExclusive': '0047B15E', 'sha256': '52dc4158e437df16124a965fac71d33f46fcbe75856c9f9e760d32cb295fa52f'}, 'S2': {'endExclusive': '0047B15E', 'sha256': '52dc4158e437df16124a965fac71d33f46fcbe75856c9f9e760d32cb295fa52f'}}, '0047B2B0': {'S1': {'endExclusive': '0047B2DD', 'sha256': '2b871355a493a19960355b895dcbf725a6b3c931af48f71d233989991aac5017'}, 'S2': {'endExclusive': '0047B2DD', 'sha256': '2b871355a493a19960355b895dcbf725a6b3c931af48f71d233989991aac5017'}}, '0047C320': {'S1': {'endExclusive': '0047C324', 'sha256': '7e6bda0a031f94dbe8477fe3ce3ba2b7e3d761a050d55625bc7d92212670e60c'}, 'S2': {'endExclusive': '0047C324', 'sha256': '7e6bda0a031f94dbe8477fe3ce3ba2b7e3d761a050d55625bc7d92212670e60c'}}, '0047E050': {'S1': {'endExclusive': '0047E06B', 'sha256': '388757158c5ea3bed3590f126c4ea6fd728a232bca78990a37a4984c8b3b7d0b'}, 'S2': {'endExclusive': '0047E06B', 'sha256': '388757158c5ea3bed3590f126c4ea6fd728a232bca78990a37a4984c8b3b7d0b'}}, '0047E070': {'S1': {'endExclusive': '0047E099', 'sha256': '4f60021d67009a52e6791f4ac1455a00eab1cd6f6b0ee56280c769fcf3ff0b05'}, 'S2': {'endExclusive': '0047E099', 'sha256': '4f60021d67009a52e6791f4ac1455a00eab1cd6f6b0ee56280c769fcf3ff0b05'}}, '00480FA0': {'S1': {'endExclusive': '00480FB5', 'sha256': '483f6f19dd5e587ddf6bb26e39f28aa9c6d118dc3c472d31ca97f38bf74250ad'}, 'S2': {'endExclusive': '00480FB5', 'sha256': '483f6f19dd5e587ddf6bb26e39f28aa9c6d118dc3c472d31ca97f38bf74250ad'}}, '00480FD0': {'S1': {'endExclusive': '00480FEB', 'sha256': '232846f5c08de33b4165c4e96aab197a29c734c44342107d84e197c9554094bb'}, 'S2': {'endExclusive': '00480FEB', 'sha256': '232846f5c08de33b4165c4e96aab197a29c734c44342107d84e197c9554094bb'}}, '00480FF0': {'S1': {'endExclusive': '00481018', 'sha256': '176c12bc4fc33f51e7f7c5d839dcd44842f3701f84c5b3ef9cfe3966997fe0ad'}, 'S2': {'endExclusive': '00481018', 'sha256': '176c12bc4fc33f51e7f7c5d839dcd44842f3701f84c5b3ef9cfe3966997fe0ad'}}, '00481590': {'S1': {'endExclusive': '004815AB', 'sha256': '6556db60830e7abc0386b43808eddae62705435a6d0739fd535de485f6170d6f'}, 'S2': {'endExclusive': '004815AB', 'sha256': '6556db60830e7abc0386b43808eddae62705435a6d0739fd535de485f6170d6f'}}, '004815B0': {'S1': {'endExclusive': '004815BD', 'sha256': '63d56f92af8549ae9aabfbf8a3d92d0c9e1be80d74e5c725a48ac462aff3707f'}, 'S2': {'endExclusive': '004815BD', 'sha256': '63d56f92af8549ae9aabfbf8a3d92d0c9e1be80d74e5c725a48ac462aff3707f'}}, '004834B0': {'S1': {'endExclusive': '004834D1', 'sha256': '4e8e7c70655f7142d2bd828383a216b5ca5d376862fe8dfe574f40df2d2cf74c'}, 'S2': {'endExclusive': '004834D1', 'sha256': '4e8e7c70655f7142d2bd828383a216b5ca5d376862fe8dfe574f40df2d2cf74c'}}, '004834E0': {'S1': {'endExclusive': '004834EE', 'sha256': '759d28c09d885b08eb016a6ea1191b957a930440356797c9f6ffdffbb4f53141'}, 'S2': {'endExclusive': '004834EE', 'sha256': '759d28c09d885b08eb016a6ea1191b957a930440356797c9f6ffdffbb4f53141'}}, '00483810': {'S1': {'endExclusive': '00483814', 'sha256': '07ad3a50b1c271e07fb57fb47d2f0e77f3342d41bfa410990cb1320a45035fb2'}, 'S2': {'endExclusive': '00483814', 'sha256': '07ad3a50b1c271e07fb57fb47d2f0e77f3342d41bfa410990cb1320a45035fb2'}}, '004839F0': {'S1': {'endExclusive': '004839FC', 'sha256': '56b58ce4a05e2ecdfa055b04e499f6a144840249d8e11b28065dfce3bcfee08e'}, 'S2': {'endExclusive': '004839FC', 'sha256': '56b58ce4a05e2ecdfa055b04e499f6a144840249d8e11b28065dfce3bcfee08e'}}, '00483B00': {'S1': {'endExclusive': '00483B1E', 'sha256': 'a5a4e3333b75a6d64582c4998ec5f87d3e2f929616a094182bdce39a99b4b412'}, 'S2': {'endExclusive': '00483B1E', 'sha256': 'a5a4e3333b75a6d64582c4998ec5f87d3e2f929616a094182bdce39a99b4b412'}}, '004863D0': {'S1': {'endExclusive': '004863F1', 'sha256': '5500e4a2326ca7c9ec310cf20083e9050f61f039bd6199011501d274f2e8c5ba'}, 'S2': {'endExclusive': '004863F1', 'sha256': '5500e4a2326ca7c9ec310cf20083e9050f61f039bd6199011501d274f2e8c5ba'}}, '00486400': {'S1': {'endExclusive': '00486424', 'sha256': 'c5f03d3151997a9c57011d7fec3a0e7a61a5f1989a4d5eba46a468965527e2d7'}, 'S2': {'endExclusive': '00486424', 'sha256': 'c5f03d3151997a9c57011d7fec3a0e7a61a5f1989a4d5eba46a468965527e2d7'}}, '00487B30': {'S1': {'endExclusive': '00487BB3', 'sha256': '8620689504983fed521867667ddfdcb2f6477ecc3f0249ed7132c2d22596ca79'}, 'S2': {'endExclusive': '00487BB3', 'sha256': '8620689504983fed521867667ddfdcb2f6477ecc3f0249ed7132c2d22596ca79'}}, '00487DC0': {'S1': {'endExclusive': '00487DC4', 'sha256': 'a97a61afc73231cb78bb2c78600f652c4d2d996c15d963c8764c5c055bf114d1'}, 'S2': {'endExclusive': '00487DC4', 'sha256': 'a97a61afc73231cb78bb2c78600f652c4d2d996c15d963c8764c5c055bf114d1'}}, '00487EB0': {'S1': {'endExclusive': '00488008', 'sha256': '2e8ba025d2f1180608985a96a793de0b18f35b225bf22d16c40b9e524f24730c'}, 'S2': {'endExclusive': '00488008', 'sha256': '2e8ba025d2f1180608985a96a793de0b18f35b225bf22d16c40b9e524f24730c'}}, '004880A0': {'S1': {'endExclusive': '004880B8', 'sha256': '672200b358bfbf28d0eca996b11adc2250ddb5de243887c13c6b8242c07ae09d'}, 'S2': {'endExclusive': '004880B8', 'sha256': '672200b358bfbf28d0eca996b11adc2250ddb5de243887c13c6b8242c07ae09d'}}, '004883B0': {'S1': {'endExclusive': '004883B7', 'sha256': 'b8daa47a1e2c23c0d84bc9ac1de08473d93f8b72166ba2ff5b06db32826f2236'}, 'S2': {'endExclusive': '004883B7', 'sha256': 'b8daa47a1e2c23c0d84bc9ac1de08473d93f8b72166ba2ff5b06db32826f2236'}}, '004883D0': {'S1': {'endExclusive': '004883EB', 'sha256': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3'}, 'S2': {'endExclusive': '004883EB', 'sha256': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3'}}, '004883F0': {'S1': {'endExclusive': '00488422', 'sha256': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088'}, 'S2': {'endExclusive': '00488422', 'sha256': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088'}}, '00488430': {'S1': {'endExclusive': '00488461', 'sha256': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f'}, 'S2': {'endExclusive': '00488461', 'sha256': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f'}}, '00489F10': {'S1': {'endExclusive': '00489F22', 'sha256': 'c9dfadf9bea7a72ed7f905c625e17ccb73ae47616ed799e24fccf78dc8697164'}, 'S2': {'endExclusive': '00489F22', 'sha256': 'c9dfadf9bea7a72ed7f905c625e17ccb73ae47616ed799e24fccf78dc8697164'}}, '0048D790': {'S1': {'endExclusive': '0048D7B1', 'sha256': '797bcaf4dc2e7080ec431b4469f29a065c37d744eef021c65f18d79a62057cb0'}, 'S2': {'endExclusive': '0048D7B1', 'sha256': '797bcaf4dc2e7080ec431b4469f29a065c37d744eef021c65f18d79a62057cb0'}}, '0048D7C0': {'S1': {'endExclusive': '0048D7CE', 'sha256': '34e04f73ca02433f61d2729cc654f93ab9df493e065c1e19e50bd9a6ba3bfa58'}, 'S2': {'endExclusive': '0048D7CE', 'sha256': '34e04f73ca02433f61d2729cc654f93ab9df493e065c1e19e50bd9a6ba3bfa58'}}, '00490A10': {'S1': {'endExclusive': '00490A32', 'sha256': '5fdb5f2212b319522010293ef4ce36bb915efdc6a44b48882a9faecbff95c4f4'}, 'S2': {'endExclusive': '00490A32', 'sha256': '5fdb5f2212b319522010293ef4ce36bb915efdc6a44b48882a9faecbff95c4f4'}}, '00490A40': {'S1': {'endExclusive': '00490A62', 'sha256': '8b122a1d07e6c7372d9e85d06a6fb3025f443cd8d359c150148707def85a97d6'}, 'S2': {'endExclusive': '00490A62', 'sha256': '8b122a1d07e6c7372d9e85d06a6fb3025f443cd8d359c150148707def85a97d6'}}, '00490A70': {'S1': {'endExclusive': '00490A92', 'sha256': 'a7f7198f20c14dd01bd48d9f7c3a356490fafad34d0e4d7d8e40c60d9635c822'}, 'S2': {'endExclusive': '00490A92', 'sha256': 'a7f7198f20c14dd01bd48d9f7c3a356490fafad34d0e4d7d8e40c60d9635c822'}}, '00490AA0': {'S1': {'endExclusive': '00490AC2', 'sha256': 'e9c9bd6a1d8baa85ea48e7f40425871ad9469d7a5a9896f24d16ca03242866db'}, 'S2': {'endExclusive': '00490AC2', 'sha256': 'e9c9bd6a1d8baa85ea48e7f40425871ad9469d7a5a9896f24d16ca03242866db'}}, '00490AD0': {'S1': {'endExclusive': '00490AF2', 'sha256': 'd03849242416ef33815626c63a49db94f0d84740bbe3ae137b638ad756be3333'}, 'S2': {'endExclusive': '00490AF2', 'sha256': 'd03849242416ef33815626c63a49db94f0d84740bbe3ae137b638ad756be3333'}}, '00490B00': {'S1': {'endExclusive': '00490B24', 'sha256': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c'}, 'S2': {'endExclusive': '00490B24', 'sha256': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c'}}, '00490B90': {'S1': {'endExclusive': '00490BB2', 'sha256': 'f15b07997daf87667fe34f62f99504c1f6f4efe454dd45036219e4aba32945b6'}, 'S2': {'endExclusive': '00490BB2', 'sha256': 'f15b07997daf87667fe34f62f99504c1f6f4efe454dd45036219e4aba32945b6'}}, '00490D00': {'S1': {'endExclusive': '00490D21', 'sha256': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a'}, 'S2': {'endExclusive': '00490D21', 'sha256': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a'}}, '00490E70': {'S1': {'endExclusive': '00490E94', 'sha256': '69dce2910ef46501efb42c693e70432a5d30e9156664c3ae48fb55303d72a1be'}, 'S2': {'endExclusive': '00490E94', 'sha256': '69dce2910ef46501efb42c693e70432a5d30e9156664c3ae48fb55303d72a1be'}}, '00491770': {'S1': {'endExclusive': '004917BC', 'sha256': '57db6d0a75e755ba06d4cf80f7dd9e634d89cf02e272c4c7ad3ae053e213f41b'}, 'S2': {'endExclusive': '004917BC', 'sha256': '57db6d0a75e755ba06d4cf80f7dd9e634d89cf02e272c4c7ad3ae053e213f41b'}}, '004922C0': {'S1': {'endExclusive': '00492348', 'sha256': '1238ab9a49364c9f3bc0f5b9b162146f4d9af4314acb01a405586d824ab34e88'}, 'S2': {'endExclusive': '00492348', 'sha256': '1238ab9a49364c9f3bc0f5b9b162146f4d9af4314acb01a405586d824ab34e88'}}, '004951D0': {'S1': {'endExclusive': '004951F1', 'sha256': 'd2c5ec2c8fa93d737e8fa17f16487ddc9621bc84186ebd8c4633670071fc6df4'}, 'S2': {'endExclusive': '004951F1', 'sha256': 'd2c5ec2c8fa93d737e8fa17f16487ddc9621bc84186ebd8c4633670071fc6df4'}}, '004955A0': {'S1': {'endExclusive': '004955D6', 'sha256': '48a97b0d8683f1bc3219f07baa1f5fd2e60e1ff31412e11440328d6233b53499'}, 'S2': {'endExclusive': '004955D6', 'sha256': '48a97b0d8683f1bc3219f07baa1f5fd2e60e1ff31412e11440328d6233b53499'}}, '00495CE0': {'S1': {'endExclusive': '00495E24', 'sha256': '712730249836ebc18ae880302e8fa56adab4cd17438eddef313fd334fcbe337d'}, 'S2': {'endExclusive': '00495E24', 'sha256': '712730249836ebc18ae880302e8fa56adab4cd17438eddef313fd334fcbe337d'}}, '00495E24': {'S1': {'endExclusive': '00495E3C', 'sha256': '002314239b99c1b5de9cf8c711bc4e5b640bd9587781ea5915ab840c12146eac'}, 'S2': {'endExclusive': '00495E3C', 'sha256': '002314239b99c1b5de9cf8c711bc4e5b640bd9587781ea5915ab840c12146eac'}}, '00495E3C': {'S1': {'endExclusive': '00495E49', 'sha256': 'bcc618dc98141b7aca81b2f267180dd878d8782f843d734787a4bf3d1100a2a4'}, 'S2': {'endExclusive': '00495E49', 'sha256': 'bcc618dc98141b7aca81b2f267180dd878d8782f843d734787a4bf3d1100a2a4'}}, '00495E4C': {'S1': {'endExclusive': '00495E5C', 'sha256': '1fe5c58902562e0a04d82534412cabad89f4e001a43511f3f39a944b0e1b3b12'}, 'S2': {'endExclusive': '00495E5C', 'sha256': '1fe5c58902562e0a04d82534412cabad89f4e001a43511f3f39a944b0e1b3b12'}}, '00495E5C': {'S1': {'endExclusive': '00495E6C', 'sha256': '37984025a317d1f33956d28de2c040fe7087e44d76396b3e23c70091dbbe99fe'}, 'S2': {'endExclusive': '00495E6C', 'sha256': '37984025a317d1f33956d28de2c040fe7087e44d76396b3e23c70091dbbe99fe'}}, '00496040': {'S1': {'endExclusive': '00496095', 'sha256': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55'}, 'S2': {'endExclusive': '00496095', 'sha256': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55'}}, '00496D90': {'S1': {'endExclusive': '00496DA2', 'sha256': '04fc43ea99ccb0bfbb25c4dfc4b2843bc5d1464f9b50d2c2fae1b5dd3a327b7a'}, 'S2': {'endExclusive': '00496DA2', 'sha256': '04fc43ea99ccb0bfbb25c4dfc4b2843bc5d1464f9b50d2c2fae1b5dd3a327b7a'}}, '0049AE90': {'S1': {'endExclusive': '0049AEEC', 'sha256': 'fa0afec05541020aba45cfa08040a097c299be3ec0ea86c6d7a68301ffb788b9'}, 'S2': {'endExclusive': '0049AEEC', 'sha256': 'fa0afec05541020aba45cfa08040a097c299be3ec0ea86c6d7a68301ffb788b9'}}, '0049B390': {'S1': {'endExclusive': '0049B3AF', 'sha256': '99be8b5ee1d22fd6a2c35f94a0487b8101f05a6fb11e7c4b6b41ce2e97369bad'}, 'S2': {'endExclusive': '0049B3AF', 'sha256': '99be8b5ee1d22fd6a2c35f94a0487b8101f05a6fb11e7c4b6b41ce2e97369bad'}}, '0049C430': {'S1': {'endExclusive': '0049C598', 'sha256': '5ac721972bd1a8d0597d16e39aaa96e7efe04ca9e18c24262223980b0abaef9a'}, 'S2': {'endExclusive': '0049C598', 'sha256': '5ac721972bd1a8d0597d16e39aaa96e7efe04ca9e18c24262223980b0abaef9a'}}, '0049CB60': {'S1': {'endExclusive': '0049CB74', 'sha256': 'dd26369fc2f2b358be68a07bbf146875b5b934e22243c7f112ced7f45fd40260'}, 'S2': {'endExclusive': '0049CB74', 'sha256': 'dd26369fc2f2b358be68a07bbf146875b5b934e22243c7f112ced7f45fd40260'}}, '0049CB80': {'S1': {'endExclusive': '0049CCBD', 'sha256': '16fa3ec2612bfd3702477fc9572c131548c842536fda937741ed43e2acb8725d'}, 'S2': {'endExclusive': '0049CCBD', 'sha256': '16fa3ec2612bfd3702477fc9572c131548c842536fda937741ed43e2acb8725d'}}, '0049CCC0': {'S1': {'endExclusive': '0049CCEC', 'sha256': 'e690c4190207ecba5540392c9dbb2bb63b413fa766f77fcd61faa22705eab322'}, 'S2': {'endExclusive': '0049CCEC', 'sha256': 'e690c4190207ecba5540392c9dbb2bb63b413fa766f77fcd61faa22705eab322'}}, '0049CCEC': {'S1': {'endExclusive': '0049CD07', 'sha256': 'f72c251d14b9a6af48ab60af0a065710076b82f81864e4dae3cdceed781c6ed5'}, 'S2': {'endExclusive': '0049CD07', 'sha256': 'f72c251d14b9a6af48ab60af0a065710076b82f81864e4dae3cdceed781c6ed5'}}, '004B5020': {'S1': {'endExclusive': '004B504E', 'sha256': 'b1368c4a9825c5787de21e58d6ac61f8ce10cb72bf4afc21d48080a6654ff299'}, 'S2': {'endExclusive': '004B504E', 'sha256': 'b1368c4a9825c5787de21e58d6ac61f8ce10cb72bf4afc21d48080a6654ff299'}}, '004BA1D0': {'S1': {'endExclusive': '004BA485', 'sha256': '70d2f33412b51e4e1337942addf82032c79021ea9c37cf562d95ad144daea67c'}, 'S2': {'endExclusive': '004BA485', 'sha256': '70d2f33412b51e4e1337942addf82032c79021ea9c37cf562d95ad144daea67c'}}, '004F55E0': {'S1': {'endExclusive': '004F563A', 'sha256': '817b8d49e3257d94b7b6b4314bcfff188abc68e4274be212884f4985ab1fcd00'}, 'S2': {'endExclusive': '004F563A', 'sha256': '817b8d49e3257d94b7b6b4314bcfff188abc68e4274be212884f4985ab1fcd00'}}, '00557AC0': {'S1': {'endExclusive': '00557AC6', 'sha256': 'accecba762116532de10ac30681ff4b25ad91fe217568ec41c8ffd67b9ef2bcf'}, 'S2': {'endExclusive': '00557AC6', 'sha256': 'accecba762116532de10ac30681ff4b25ad91fe217568ec41c8ffd67b9ef2bcf'}}, '00573470': {'S1': {'endExclusive': '00573476', 'sha256': '21faa16607cb70438711aab3fa582829af50aa15d5946524996fc7aa8a8e4e6d'}, 'S2': {'endExclusive': '00573476', 'sha256': '21faa16607cb70438711aab3fa582829af50aa15d5946524996fc7aa8a8e4e6d'}}, '005C1A40': {'S1': {'endExclusive': '005C1A6F', 'sha256': 'bee09d0adfd5024b679ddac759569a7e4976a6bab541a8c2f266183af78616c6'}, 'S2': {'endExclusive': '005C1A6F', 'sha256': 'bee09d0adfd5024b679ddac759569a7e4976a6bab541a8c2f266183af78616c6'}}, '0063ADD0': {'S1': {'endExclusive': '0063ADFD', 'sha256': '368069258f9ac708527de1e80126dc0b0296a4d353f4893843769fb38e6cebf9'}, 'S2': {'endExclusive': '0063ADFD', 'sha256': '29c94d2b048a651e44020613d627ed280e168787cb668320403da25dc2b02c46'}}, '0065D6C0': {'S1': {'endExclusive': '0065D6C4', 'sha256': 'f7e0208f5e988ae39c7a45dfddbd12921d02f9c3deb5695d4c534c8ab0ccdb0f'}, 'S2': {'endExclusive': '0065D6C4', 'sha256': 'f7e0208f5e988ae39c7a45dfddbd12921d02f9c3deb5695d4c534c8ab0ccdb0f'}}, '0067F810': {'S1': {'endExclusive': '0067F816', 'sha256': '07297dca94be1b975a5dc696b5976f205b84057995fa3d3fbb157101b1ae8098'}, 'S2': {'endExclusive': '0067F816', 'sha256': '07297dca94be1b975a5dc696b5976f205b84057995fa3d3fbb157101b1ae8098'}}, '006903A0': {'S1': {'endExclusive': '006903A6', 'sha256': '7500687ab6484f894dd29beddc484e671de6539e4faf19ef80805cfd49e55624'}, 'S2': {'endExclusive': '006903A6', 'sha256': '7500687ab6484f894dd29beddc484e671de6539e4faf19ef80805cfd49e55624'}}, '0072EE10': {'S1': {'endExclusive': '0072EE18', 'sha256': '77ddeda12e629875ee9826a9a8fe918b047fae98914ca11f3dbe9526aa11bc40'}, 'S2': {'endExclusive': '0072EE22', 'sha256': '26beeea16e9a66774fde567ecd7d1e993a04fda888a79c09cf9c85994f77f9e2'}}, '0079BF58': {'S1': {'endExclusive': '0079BFA8', 'sha256': '53abf891e2facef0229898ea8c6462e1e99d0c0d60f2ef36c78e6eced74f08ce'}, 'S2': {'endExclusive': '0079BFA8', 'sha256': '53abf891e2facef0229898ea8c6462e1e99d0c0d60f2ef36c78e6eced74f08ce'}}, '0079BFB0': {'S1': {'endExclusive': '0079C000', 'sha256': 'cb2fe670413e8efe4faa99c693e9de77d689a0bfe99545d93beb2e597c1b3cd7'}, 'S2': {'endExclusive': '0079C000', 'sha256': 'cb2fe670413e8efe4faa99c693e9de77d689a0bfe99545d93beb2e597c1b3cd7'}}, '0079C0E8': {'S1': {'endExclusive': '0079C138', 'sha256': 'c795b528970e6dd14c97b609e7c1415e51e3fb2928be08a86153dc5981e7e9e5'}, 'S2': {'endExclusive': '0079C138', 'sha256': 'c795b528970e6dd14c97b609e7c1415e51e3fb2928be08a86153dc5981e7e9e5'}}, '0079C170': {'S1': {'endExclusive': '0079C1C0', 'sha256': '59b4c81d8253e970cf5504dd25c37126674093f84d4df7b532d92a508b8c5633'}, 'S2': {'endExclusive': '0079C1C0', 'sha256': '59b4c81d8253e970cf5504dd25c37126674093f84d4df7b532d92a508b8c5633'}}, '0079C2B0': {'S1': {'endExclusive': '0079C330', 'sha256': 'd692c5d627bf8182061c550e469f9e0b13e17d483aadbec413ec11491d3f0272'}, 'S2': {'endExclusive': '0079C330', 'sha256': 'c43c9e7e16ef2efa065e931224a872a8d97c6463bca829b7aaeb6212c2992d0d'}}, '0079C358': {'S1': {'endExclusive': '0079C558', 'sha256': '1baebecf5fe9802f84a50368e9602469796cba9a1a9b1b0f2bfe82d85dad6fac'}, 'S2': {'endExclusive': '0079C558', 'sha256': '1baebecf5fe9802f84a50368e9602469796cba9a1a9b1b0f2bfe82d85dad6fac'}}, '0079C718': {'S1': {'endExclusive': '0079C774', 'sha256': '93644003052b306a2543d1e4cd26359f5e743ec4450b0b0d59742f7f4ecaffec'}, 'S2': {'endExclusive': '0079C774', 'sha256': '93644003052b306a2543d1e4cd26359f5e743ec4450b0b0d59742f7f4ecaffec'}}, '0079C780': {'S1': {'endExclusive': '0079C7D0', 'sha256': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c'}, 'S2': {'endExclusive': '0079C7D0', 'sha256': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c'}}, '0079C7D0': {'S1': {'endExclusive': '0079C820', 'sha256': '4de624b4f1dccc089cf3e7f124a048c76b96ccd45f1b76ff439f919a00759f1c'}, 'S2': {'endExclusive': '0079C820', 'sha256': '4de624b4f1dccc089cf3e7f124a048c76b96ccd45f1b76ff439f919a00759f1c'}}, '0079CC18': {'S1': {'endExclusive': '0079CC80', 'sha256': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff'}, 'S2': {'endExclusive': '0079CC80', 'sha256': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff'}}}
VERIFICATION_HASHES = {'raw-verification.json': 'a1c2a8ac1d7ed116bf4b96c75556bba57e57b3ab9e1f8acd54f0ab30a9b94b9a', 'recovery-evidence-S1.json': '4b0870b4c13afd6e1ef6d47a226aad60fd78ee2938319dc5acfac7c0cb162420', 'recovery-evidence-S2.json': '47d7226a6697157bf98aa53b5e7b3a5ba0c9329d425fbc0264ca65b4cd7f646c'}
BUDGET = {'focusedIntervals': 178, 'reusedExactInheritedIntervals': 172, 'newUniqueIntervals': 6, 'codeIntervals': 146, 'completeIDBFunctionIntervals': 146, 'dataIntervals': 32, 'selectedBytesBothSources': 11542, 'instructions': 3174, 'callSites': 298, 'branchSites': 347, 'inheritedSelectedIntervals': 1317, 'allSelectedIntervals': 1323, 'newMachineCodeBytesRecovered': 172}
BOUNDARY_METADATA = {'S1:00481590': {'itemEnd': '00481594', 'name': 'sub_481590'}, 'S1:004815AB': {'itemEnd': '004815B0', 'name': ''}, 'S1:004815B0': {'itemEnd': '004815B4', 'name': 'sub_4815b0'}, 'S1:004815BD': {'itemEnd': '004815C0', 'name': ''}, 'S1:004B5020': {'itemEnd': '004B5021', 'name': 'sub_4b5020'}, 'S1:004B504E': {'itemEnd': '004B5050', 'name': ''}, 'S1:004BA432': {'itemEnd': '004BA436', 'name': 'loc_4BA432'}, 'S1:004BA43D': {'itemEnd': '004BA442', 'name': ''}, 'S1:004BA442': {'itemEnd': '004BA444', 'name': ''}, 'S1:0074E35C': {'itemEnd': '0074E360', 'name': 'LeaveCriticalSection'}, 'S1:0074E360': {'itemEnd': '0074E364', 'name': 'EnterCriticalSection'}, 'S1:004BA345': {'itemEnd': '004BA346', 'name': 'loc_4BA345'}, 'S1:004BA46C': {'itemEnd': '004BA470', 'name': 'loc_4BA46C'}, 'S1:0049230A': {'itemEnd': '0049230C', 'name': ''}, 'S1:00492315': {'itemEnd': '00492318', 'name': ''}, 'S1:00495E24': {'itemEnd': '00495E3C', 'name': ''}, 'S1:00495E3C': {'itemEnd': '00495E49', 'name': ''}, 'S1:00495E49': {'itemEnd': '00495E4C', 'name': ''}, 'S1:00495E4C': {'itemEnd': '00495E5C', 'name': ''}, 'S1:00495E5C': {'itemEnd': '00495E6C', 'name': ''}, 'S2:00481590': {'itemEnd': '00481594', 'name': 'sub_481590'}, 'S2:004815AB': {'itemEnd': '004815B0', 'name': ''}, 'S2:004815B0': {'itemEnd': '004815B4', 'name': 'sub_4815b0'}, 'S2:004815BD': {'itemEnd': '004815C0', 'name': ''}, 'S2:004B5020': {'itemEnd': '004B5021', 'name': 'sub_4b5020'}, 'S2:004B504E': {'itemEnd': '004B5050', 'name': ''}, 'S2:004BA432': {'itemEnd': '004BA436', 'name': 'loc_4BA432'}, 'S2:004BA43D': {'itemEnd': '004BA442', 'name': ''}, 'S2:004BA442': {'itemEnd': '004BA444', 'name': ''}, 'S2:0074E35C': {'itemEnd': '0074E360', 'name': 'LeaveCriticalSection'}, 'S2:0074E360': {'itemEnd': '0074E364', 'name': 'EnterCriticalSection'}, 'S2:004BA345': {'itemEnd': '004BA346', 'name': 'loc_4BA345'}, 'S2:004BA46C': {'itemEnd': '004BA470', 'name': 'loc_4BA46C'}, 'S2:0049230A': {'itemEnd': '0049230C', 'name': ''}, 'S2:00492315': {'itemEnd': '00492318', 'name': ''}, 'S2:00495E24': {'itemEnd': '00495E3C', 'name': 'jpt_495CF8'}, 'S2:00495E3C': {'itemEnd': '00495E49', 'name': ''}, 'S2:00495E49': {'itemEnd': '00495E4C', 'name': ''}, 'S2:00495E4C': {'itemEnd': '00495E5C', 'name': 'jpt_495D19'}, 'S2:00495E5C': {'itemEnd': '00495E6C', 'name': 'jpt_495DB1'}}
FUNCTION_REGIONS = {'S1:004B5020': [{'start': '004B5020', 'endExclusive': '004B504E'}], 'S1:00481590': [{'start': '00481590', 'endExclusive': '004815AB'}], 'S1:004815B0': [{'start': '004815B0', 'endExclusive': '004815BD'}], 'S1:0049C430': [{'start': '0049C430', 'endExclusive': '0049C598'}], 'S1:0049AE90': [{'start': '0049AE90', 'endExclusive': '0049AEEC'}], 'S1:0049CB60': [{'start': '0049CB60', 'endExclusive': '0049CB74'}], 'S1:0049CB80': [{'start': '0049CB80', 'endExclusive': '0049CCBD'}], 'S1:0049B390': [{'start': '0049B390', 'endExclusive': '0049B3AF'}], 'S1:0047A770': [{'start': '0047A770', 'endExclusive': '0047A7AD'}], 'S1:0063ADD0': [{'start': '0063ADD0', 'endExclusive': '0063ADFD'}], 'S1:005C1A40': [{'start': '005C1A40', 'endExclusive': '005C1A6F'}], 'S1:004F55E0': [{'start': '004F55E0', 'endExclusive': '004F563A'}], 'S1:004BA1D0': [{'start': '004BA1D0', 'endExclusive': '004BA485'}], 'S1:004922C0': [{'start': '004922C0', 'endExclusive': '00492348'}, {'start': '0072EE10', 'endExclusive': '0072EE18'}], 'S1:00495CE0': [{'start': '00495CE0', 'endExclusive': '00495E24'}], 'S1:004955A0': [{'start': '004955A0', 'endExclusive': '004955D6'}], 'S1:0047A5B0': [{'start': '0047A5B0', 'endExclusive': '0047A5CA'}], 'S1:0047A630': [{'start': '0047A630', 'endExclusive': '0047A656'}], 'S1:00472070': [{'start': '00472070', 'endExclusive': '004720AB'}], 'S1:00496040': [{'start': '00496040', 'endExclusive': '00496095'}], 'S1:004883F0': [{'start': '004883F0', 'endExclusive': '00488422'}], 'S1:00488430': [{'start': '00488430', 'endExclusive': '00488461'}], 'S1:004883D0': [{'start': '004883D0', 'endExclusive': '004883EB'}], 'S1:004863D0': [{'start': '004863D0', 'endExclusive': '004863F1'}], 'S1:004951D0': [{'start': '004951D0', 'endExclusive': '004951F1'}], 'S1:0047A830': [{'start': '0047A830', 'endExclusive': '0047A84B'}], 'S1:00468E60': [{'start': '00468E60', 'endExclusive': '00468E66'}], 'S1:00573470': [{'start': '00573470', 'endExclusive': '00573476'}], 'S1:0067F810': [{'start': '0067F810', 'endExclusive': '0067F816'}], 'S1:00486400': [{'start': '00486400', 'endExclusive': '00486424'}], 'S1:00490B00': [{'start': '00490B00', 'endExclusive': '00490B24'}], 'S1:00490D00': [{'start': '00490D00', 'endExclusive': '00490D21'}], 'S1:00490E70': [{'start': '00490E70', 'endExclusive': '00490E94'}], 'S1:00483B00': [{'start': '00483B00', 'endExclusive': '00483B1E'}], 'S1:00487EB0': [{'start': '00487EB0', 'endExclusive': '00488008'}], 'S1:00487B30': [{'start': '00487B30', 'endExclusive': '00487BB3'}], 'S1:00490B90': [{'start': '00490B90', 'endExclusive': '00490BB2'}], 'S1:004839F0': [{'start': '004839F0', 'endExclusive': '004839FC'}], 'S1:00490A10': [{'start': '00490A10', 'endExclusive': '00490A32'}], 'S1:00490A40': [{'start': '00490A40', 'endExclusive': '00490A62'}], 'S1:00490A70': [{'start': '00490A70', 'endExclusive': '00490A92'}], 'S1:00491770': [{'start': '00491770', 'endExclusive': '004917BC'}], 'S1:00487DC0': [{'start': '00487DC0', 'endExclusive': '00487DC4'}], 'S1:0047B2B0': [{'start': '0047B2B0', 'endExclusive': '0047B2DD'}], 'S1:004883B0': [{'start': '004883B0', 'endExclusive': '004883B7'}], 'S1:0047C320': [{'start': '0047C320', 'endExclusive': '0047C324'}], 'S1:00483810': [{'start': '00483810', 'endExclusive': '00483814'}], 'S1:00490AD0': [{'start': '00490AD0', 'endExclusive': '00490AF2'}], 'S1:0047E070': [{'start': '0047E070', 'endExclusive': '0047E099'}], 'S1:0047E050': [{'start': '0047E050', 'endExclusive': '0047E06B'}], 'S1:0065D6C0': [{'start': '0065D6C0', 'endExclusive': '0065D6C4'}], 'S1:0047A690': [{'start': '0047A690', 'endExclusive': '0047A6CF'}], 'S1:00490AA0': [{'start': '00490AA0', 'endExclusive': '00490AC2'}], 'S1:00480FF0': [{'start': '00480FF0', 'endExclusive': '00481018'}], 'S1:00480FD0': [{'start': '00480FD0', 'endExclusive': '00480FEB'}], 'S1:00480FA0': [{'start': '00480FA0', 'endExclusive': '00480FB5'}], 'S1:004880A0': [{'start': '004880A0', 'endExclusive': '004880B8'}], 'S1:00496D90': [{'start': '00496D90', 'endExclusive': '00496DA2'}], 'S1:00489F10': [{'start': '00489F10', 'endExclusive': '00489F22'}], 'S1:0047AA80': [{'start': '0047AA80', 'endExclusive': '0047AA90'}], 'S1:0047A5D0': [{'start': '0047A5D0', 'endExclusive': '0047A5D9'}], 'S1:0041C130': [{'start': '0041C130', 'endExclusive': '0041C135'}], 'S1:0047B150': [{'start': '0047B150', 'endExclusive': '0047B15E'}], 'S1:004834E0': [{'start': '004834E0', 'endExclusive': '004834EE'}], 'S1:0048D7C0': [{'start': '0048D7C0', 'endExclusive': '0048D7CE'}], 'S1:0047B110': [{'start': '0047B110', 'endExclusive': '0047B116'}], 'S1:006903A0': [{'start': '006903A0', 'endExclusive': '006903A6'}], 'S1:00557AC0': [{'start': '00557AC0', 'endExclusive': '00557AC6'}], 'S1:0047B120': [{'start': '0047B120', 'endExclusive': '0047B141'}], 'S1:004834B0': [{'start': '004834B0', 'endExclusive': '004834D1'}], 'S1:0048D790': [{'start': '0048D790', 'endExclusive': '0048D7B1'}], 'S1:0047A7B0': [{'start': '0047A7B0', 'endExclusive': '0047A7CB'}], 'S2:004B5020': [{'start': '004B5020', 'endExclusive': '004B504E'}], 'S2:00481590': [{'start': '00481590', 'endExclusive': '004815AB'}], 'S2:004815B0': [{'start': '004815B0', 'endExclusive': '004815BD'}], 'S2:0049C430': [{'start': '0049C430', 'endExclusive': '0049C598'}], 'S2:0049AE90': [{'start': '0049AE90', 'endExclusive': '0049AEEC'}], 'S2:0049CB60': [{'start': '0049CB60', 'endExclusive': '0049CB74'}], 'S2:0049CB80': [{'start': '0049CB80', 'endExclusive': '0049CCBD'}], 'S2:0049B390': [{'start': '0049B390', 'endExclusive': '0049B3AF'}], 'S2:0047A770': [{'start': '0047A770', 'endExclusive': '0047A7AD'}], 'S2:0063ADD0': [{'start': '0063ADD0', 'endExclusive': '0063ADFD'}], 'S2:005C1A40': [{'start': '005C1A40', 'endExclusive': '005C1A6F'}], 'S2:004F55E0': [{'start': '004F55E0', 'endExclusive': '004F563A'}], 'S2:004BA1D0': [{'start': '004BA1D0', 'endExclusive': '004BA485'}], 'S2:004922C0': [{'start': '004922C0', 'endExclusive': '00492348'}, {'start': '0072EE10', 'endExclusive': '0072EE22'}], 'S2:00495CE0': [{'start': '00495CE0', 'endExclusive': '00495E24'}], 'S2:004955A0': [{'start': '004955A0', 'endExclusive': '004955D6'}], 'S2:0047A5B0': [{'start': '0047A5B0', 'endExclusive': '0047A5CA'}], 'S2:0047A630': [{'start': '0047A630', 'endExclusive': '0047A656'}], 'S2:00472070': [{'start': '00472070', 'endExclusive': '004720AB'}], 'S2:00496040': [{'start': '00496040', 'endExclusive': '00496095'}], 'S2:004883F0': [{'start': '004883F0', 'endExclusive': '00488422'}], 'S2:00488430': [{'start': '00488430', 'endExclusive': '00488461'}], 'S2:004883D0': [{'start': '004883D0', 'endExclusive': '004883EB'}], 'S2:004863D0': [{'start': '004863D0', 'endExclusive': '004863F1'}], 'S2:004951D0': [{'start': '004951D0', 'endExclusive': '004951F1'}], 'S2:0047A830': [{'start': '0047A830', 'endExclusive': '0047A84B'}], 'S2:00468E60': [{'start': '00468E60', 'endExclusive': '00468E66'}], 'S2:00573470': [{'start': '00573470', 'endExclusive': '00573476'}], 'S2:0067F810': [{'start': '0067F810', 'endExclusive': '0067F816'}], 'S2:00486400': [{'start': '00486400', 'endExclusive': '00486424'}], 'S2:00490B00': [{'start': '00490B00', 'endExclusive': '00490B24'}], 'S2:00490D00': [{'start': '00490D00', 'endExclusive': '00490D21'}], 'S2:00490E70': [{'start': '00490E70', 'endExclusive': '00490E94'}], 'S2:00483B00': [{'start': '00483B00', 'endExclusive': '00483B1E'}], 'S2:00487EB0': [{'start': '00487EB0', 'endExclusive': '00488008'}], 'S2:00487B30': [{'start': '00487B30', 'endExclusive': '00487BB3'}], 'S2:00490B90': [{'start': '00490B90', 'endExclusive': '00490BB2'}], 'S2:004839F0': [{'start': '004839F0', 'endExclusive': '004839FC'}], 'S2:00490A10': [{'start': '00490A10', 'endExclusive': '00490A32'}], 'S2:00490A40': [{'start': '00490A40', 'endExclusive': '00490A62'}], 'S2:00490A70': [{'start': '00490A70', 'endExclusive': '00490A92'}], 'S2:00491770': [{'start': '00491770', 'endExclusive': '004917BC'}], 'S2:00487DC0': [{'start': '00487DC0', 'endExclusive': '00487DC4'}], 'S2:0047B2B0': [{'start': '0047B2B0', 'endExclusive': '0047B2DD'}], 'S2:004883B0': [{'start': '004883B0', 'endExclusive': '004883B7'}], 'S2:0047C320': [{'start': '0047C320', 'endExclusive': '0047C324'}], 'S2:00483810': [{'start': '00483810', 'endExclusive': '00483814'}], 'S2:00490AD0': [{'start': '00490AD0', 'endExclusive': '00490AF2'}], 'S2:0047E070': [{'start': '0047E070', 'endExclusive': '0047E099'}], 'S2:0047E050': [{'start': '0047E050', 'endExclusive': '0047E06B'}], 'S2:0065D6C0': [{'start': '0065D6C0', 'endExclusive': '0065D6C4'}], 'S2:0047A690': [{'start': '0047A690', 'endExclusive': '0047A6CF'}], 'S2:00490AA0': [{'start': '00490AA0', 'endExclusive': '00490AC2'}], 'S2:00480FF0': [{'start': '00480FF0', 'endExclusive': '00481018'}], 'S2:00480FD0': [{'start': '00480FD0', 'endExclusive': '00480FEB'}], 'S2:00480FA0': [{'start': '00480FA0', 'endExclusive': '00480FB5'}], 'S2:004880A0': [{'start': '004880A0', 'endExclusive': '004880B8'}], 'S2:00496D90': [{'start': '00496D90', 'endExclusive': '00496DA2'}], 'S2:00489F10': [{'start': '00489F10', 'endExclusive': '00489F22'}], 'S2:0047AA80': [{'start': '0047AA80', 'endExclusive': '0047AA90'}], 'S2:0047A5D0': [{'start': '0047A5D0', 'endExclusive': '0047A5D9'}], 'S2:0041C130': [{'start': '0041C130', 'endExclusive': '0041C135'}], 'S2:0047B150': [{'start': '0047B150', 'endExclusive': '0047B15E'}], 'S2:004834E0': [{'start': '004834E0', 'endExclusive': '004834EE'}], 'S2:0048D7C0': [{'start': '0048D7C0', 'endExclusive': '0048D7CE'}], 'S2:0047B110': [{'start': '0047B110', 'endExclusive': '0047B116'}], 'S2:006903A0': [{'start': '006903A0', 'endExclusive': '006903A6'}], 'S2:00557AC0': [{'start': '00557AC0', 'endExclusive': '00557AC6'}], 'S2:0047B120': [{'start': '0047B120', 'endExclusive': '0047B141'}], 'S2:004834B0': [{'start': '004834B0', 'endExclusive': '004834D1'}], 'S2:0048D790': [{'start': '0048D790', 'endExclusive': '0048D7B1'}], 'S2:0047A7B0': [{'start': '0047A7B0', 'endExclusive': '0047A7CB'}]}


def artifact_rows(row):
    path=(DIRECTORY/row['file']).resolve();assert path.is_relative_to(DIRECTORY)
    assert digest(path.read_bytes())==row['artifactSha256']
    expected=int(row['start'],16);rows=[]
    for line in path.read_text().splitlines():
        tokens=line.split();assert tokens
        a=int(tokens[0],16);end=1
        while end<len(tokens) and re.fullmatch('[0-9a-fA-F]{2}',tokens[end]):end+=1
        b=bytes.fromhex(' '.join(tokens[1:end]));assert b and a==expected
        rows.append((a,b,' '.join(tokens[end:])));expected+=len(b)
    assert expected==int(row['endExclusive'],16)
    raw=b''.join(b for a,b,t in rows)
    assert digest(raw)==row['sha256']==row['rawId1Sha256']
    return raw,rows


def load_evidence():
    e=json.loads(MANIFEST.read_text())
    assert {r['path']:r['sha256'] for r in [e['priorEvidence']]+e['retainedFiles']}==PINS
    for path,expected in PINS.items():assert digest((ROOT/path).read_bytes())==expected,path
    prior=load_prior();selected=dict(prior[4]);raw={};rows={}
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


class NativeEvent9ForceResetSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.e,cls.raw,cls.rows,cls.prior,cls.selected=load_evidence()
    def at(self,s,f,a,value):
        b=bytes.fromhex(value);off=a-int(f,16)
        self.assertEqual(self.raw[s,f][off:off+len(b)],b)
    def call(self,s,f,a,target):
        b=self.raw[s,f][a-int(f,16):a-int(f,16)+5]
        self.assertEqual(b[0],0xe8);self.assertEqual(a+5+struct.unpack_from('<i',b,1)[0],target)

    def test_01_source_identity_and_exact_inherited_pins(self):
        self.assertEqual(self.e['profileId'],'source-idb-S1-S2-native-event9-force-reset-v1')
        self.assertEqual(self.e['frameProfileId'],'source-idb-S1-S2-native-event9-force-reset-frame-v1')
        self.assertEqual(self.e['baselineCommit'],BASELINE)
        self.assertEqual(self.e['sources'],self.prior[0]['sources'])
        self.assertEqual({s['source']:s['idbSha256'] for s in self.e['sources']},SOURCE_HASHES)
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        self.assertEqual(self.e['adoption'],{'PC-PK1.1':'compatibility-reconstruction','PC-Vanilla-assumed':'compatibility-assumption','PS2-Wii':'open'})
        for k in ['stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified','rawRuntimeMapCaptured']:self.assertIs(self.e[k],False)

    def test_02_frozen_presentation_and_prior_source_closure(self):
        result=unittest.TextTestRunner(stream=io.StringIO()).run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeEvent9PresentationSource))
        self.assertTrue(result.wasSuccessful(),(result.failures,result.errors));self.assertEqual(result.testsRun,26)
        self.assertEqual(len(self.prior[4]),1317);self.assertEqual(len(self.selected),1323)

    def test_03_complete_functions_hashes_and_interval_budgets(self):
        self.assertEqual(set(self.raw),{(s,a) for a,d in BODY_HASHES.items() for s in d})
        self.assertEqual(self.e['functionRegions'],FUNCTION_REGIONS)
        for r in self.e['ranges']:
            pin=BODY_HASHES[r['start']][r['source']]
            self.assertEqual(r['endExclusive'],pin['endExclusive']);self.assertEqual(digest(self.raw[r['source'],r['start']]),pin['sha256'])
            if r['kind']=='code':
                self.assertEqual(r['boundaryKind'],'complete-IDB-function')
                self.assertIn(dict(start=r['start'],endExclusive=r['endExclusive']),FUNCTION_REGIONS[r['source']+':'+r['ownerFunction']])
                self.assertEqual(len(self.rows[r['source'],r['start']]),r['instructionCount'])
        self.assertEqual(self.e['rangeBudget'],BUDGET);self.assertEqual(len(self.raw),178)
        self.assertEqual(sum(map(len,self.raw.values())),11542)
        self.assertEqual(sum(r['evidenceUse']=='new-unique-interval' for r in self.e['ranges']),6)
        old={(s,int(a,16)+i) for s,a,z in self.prior[4] for i in range(int(z,16)-int(a,16))}
        new={(r['source'],int(r['start'],16)+i) for r in self.e['ranges'] if r['kind']=='code' for i in range(len(self.raw[r['source'],r['start']]))}-old
        self.assertEqual(len(new),172)
        self.assertEqual({r['start'] for r in self.e['ranges'] if r['evidenceUse']=='new-unique-interval'},{'004B5020','00481590','004815B0'})

    def test_04_every_call_operand_branch_target_and_function_row(self):
        calls=branches=instructions=0
        for r in self.e['ranges']:
            s,a=r['source'],r['start'];rows=self.rows[s,a]
            if r['kind']=='data':
                self.assertEqual(self.e['callLedgers'][s][a],[]);self.assertEqual(self.e['branchLedgers'][s][a],[]);continue
            c,b,j=decoded_ledgers(rows)
            self.assertEqual(c,self.e['callLedgers'][s][a]);self.assertEqual(b,self.e['branchLedgers'][s][a])
            starts={addr for addr,raw,text in rows}
            for branch in b:
                t=int(branch['target'],16)
                if int(a,16)<=t<int(r['endExclusive'],16):self.assertIn(t,starts)
                else:self.assertEqual(a,'0072EE10');self.assertIn(t,(0x409170,0x707466))
            calls+=len(c);branches+=len(b);instructions+=len(rows)
        self.assertEqual((instructions,calls,branches),(3174,298,347))

    def test_05_saved_force_resolved_once_before_presentation(self):
        for s in SOURCE_HASHES:
            f='004BA1D0';self.at(s,f,0x4ba2b8,'8b 5e 44 85 db')
            self.at(s,f,0x4ba345,'53 b9 58 19 20 07');self.call(s,f,0x4ba34b,0x490aa0)
            self.at(s,f,0x4ba350,'8b 16 8b ce 8b d8 ff 52 48')
            self.at(s,'00490AA0',0x490aa0,'8b 44 24 04 85 c0 7c 15 83 f8 2e 7f 10 69 c0 2c 01 00 00 8d 84 08 f8 7a 00 00')
        self.assertEqual(self.e['semantics']['caller']['savedForceSaveSite'],'004BA354')
        self.assertIn('Never recompute',self.e['semantics']['helper']['forceLifetime'])

    def test_06_exact_caller_432_to_442_order_and_arguments(self):
        expected=bytes.fromhex('8b 7c 24 20 6a 00 6a ff 53 8b cf e8 de ab ff ff')
        for s in SOURCE_HASHES:
            f='004BA1D0';self.assertEqual(self.raw[s,f][0x432-0x1d0:0x442-0x1d0],expected)
            self.call(s,f,0x4ba43d,0x4b5020)
            calls=[c for c in self.e['callLedgers'][s][f] if 0x4ba432<=int(c['site'],16)<0x4ba442]
            self.assertEqual(calls,[dict(site='004BA43D',bytes='e8 de ab ff ff',kind='direct',target='004B5020')])
        self.assertEqual(self.e['semantics']['caller']['stackArguments'],['saved force EBX',-1,0])

    def test_07_complete_reset_helper_saves_pointer_and_gates_once(self):
        expected=bytes.fromhex('56 8b 74 24 08 56 e8 05 56 fc ff 83 c4 04 85 c0 74 18 8b 44 24 0c 50 8b ce e8 52 c5 fc ff 8b 4c 24 10 51 8b ce e8 66 c5 fc ff 5e c2 0c 00')
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s,'004B5020'],expected)
            self.assertEqual([(c['site'],c['target']) for c in self.e['callLedgers'][s]['004B5020']],[('004B5026','0047A630'),('004B5039','00481590'),('004B5045','004815B0')])
            self.assertEqual(self.e['branchLedgers'][s]['004B5020'],[dict(site='004B5030',bytes='74 18',target='004B504A')])
        fact=self.e['semantics']['helper']
        for k in ['readsIncomingManagerEcx','secondValidityGate','dynamicSetterDispatch']:self.assertFalse(fact[k])
        self.assertEqual(fact['forceValiditySite'],'004B5026')
        self.assertIn('True unknown08 continues to both direct setters',fact['forceLifetime'])

    def test_08_raw94_is_exact_signed_argument_range_and_dword_store(self):
        expected=bytes.fromhex('8b 44 24 04 83 f8 ff 74 09 85 c0 7c 0b 83 f8 2e 7f 06 89 81 94 00 00 00 c2 04 00')
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s,'00481590'],expected)
            self.assertEqual(self.e['callLedgers'][s]['00481590'],[])
            self.assertEqual([(b['site'],b['target']) for b in self.e['branchLedgers'][s]['00481590']],[('00481597','004815A2'),('0048159B','004815A8'),('004815A0','004815A8')])
        # Illustrations of the source predicates, not the production model.
        values=[-2**31,-2,-1,0,46,47,2**31-1]
        self.assertEqual([v==-1 or 0<=v<=46 for v in values],[False,False,True,True,True,False,False])
        fact=self.e['semantics']['raw94'];self.assertEqual((fact['offset'],fact['widthBytes'],fact['event9Value']),(148,4,0xffffffff))
        self.assertEqual(fact['storedUnsignedDomain'],[0,0xffffffff]);self.assertFalse(fact['generalSetterPublic'])

    def test_09_raw98_is_exact_low_byte_read_and_byte_store(self):
        expected=bytes.fromhex('8a 44 24 04 88 81 98 00 00 00 c2 04 00')
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s,'004815B0'],expected)
            self.assertEqual(self.e['callLedgers'][s]['004815B0'],[]);self.assertEqual(self.e['branchLedgers'][s]['004815B0'],[])
        fact=self.e['semantics']['raw98'];self.assertEqual((fact['offset'],fact['widthBytes'],fact['event9Value']),(152,1,0))
        self.assertEqual(fact['storedUnsignedDomain'],[0,255]);self.assertFalse(fact['generalSetterPublic'])
        self.assertEqual([x&255 for x in [-1,0,255,256,257]],[255,0,255,0,1])

    def test_10_force_validity_wrapper_null_probe_and_tail_dispatch(self):
        for s in SOURCE_HASHES:
            self.at(s,'0047A630',0x47a630,'56 8b 74 24 08 85 f6 74 11 6a 01 6a 04 56')
            self.call(s,'0047A630',0x47a63e,0x472070)
            self.at(s,'0047A630',0x47a643,'83 c4 0c 85 c0 75 04 33 c0 5e c3 8b 06 8b ce 5e ff 60 08')
            self.assertEqual(self.e['callLedgers'][s]['00472070'],[dict(site='00472080',bytes='ff 15 68 e2 74 00',kind='indirect',operand='dword ptr [0x74e268]'),dict(site='00472094',bytes='ff 15 6c e2 74 00',kind='indirect',operand='dword ptr [0x74e26c]')])
        fact=self.e['semantics']['validity'];self.assertEqual((fact['tailSlot'],fact['probeArgumentBytes']),(8,4))
        self.assertTrue(fact['nullReturnsFalse']);self.assertTrue(fact['probeRequireWritable'])
        self.assertIn('full-frame/RNG effect-query',fact['unknown08']);self.assertIn('explicit gap',fact['unknown08'])

    def test_11_canonical_force_live_type_then_signed_ruler(self):
        for s in SOURCE_HASHES:
            v=self.raw[s,'0079C0E8'];self.assertEqual(struct.unpack_from('<I',v,8)[0],0x480ff0);self.assertEqual(struct.unpack_from('<I',v,0x2c)[0],0x480fd0)
            self.at(s,'00480FF0',0x480ff0,'56 8b f1 8b 06 6a 01 ff 50 2c 85 c0 74 16 8b 76 04 85 f6 7c 0f 81 fe 4b 04 00 00 7f 07')
            self.at(s,'00480FF0',0x48100d,'b8 01 00 00 00 5e c3 33 c0 5e c3')
            self.at(s,'00480FD0',0x480fd0,'8b 44 24 04 83 f8 1a 74 0a 83 f8 01 74 05 33 c0 c2 04 00 b8 01 00 00 00 c2 04 00')
        self.assertEqual(self.e['semantics']['validity']['rulerSignedRange'],[0,1099])
        self.assertEqual([0<=x<=1099 for x in [-2**31,-1,0,1099,1100,2**31-1]],[False,False,True,True,False,False])

    def test_12_store_order_and_balanced_parameter_stack_at_442(self):
        for s in SOURCE_HASHES:
            self.at(s,'004B5020',0x4b5032,'8b 44 24 0c 50 8b ce')
            self.at(s,'004B5020',0x4b503e,'8b 4c 24 10 51 8b ce')
            self.at(s,'004B5020',0x4b504a,'5e c2 0c 00')
            self.at(s,'00481590',0x4815a8,'c2 04 00');self.at(s,'004815B0',0x4815ba,'c2 04 00')
        # Helper ESI save -4; cdecl validity arg -4+4; setter args -4+4 each;
        # ESI restore +4. Caller pushes 3 args, helper RET12 removes exactly 3.
        self.assertEqual(-4-4+4-4+4-4+4+4,0);self.assertEqual(-3*4+12,0)
        self.assertEqual(self.e['semantics']['caller']['callerParameterStackDeltaAtExit'],0)

    def test_13_presentation_remains_combined_before_reset(self):
        for s in SOURCE_HASHES:
            self.at(s,'004BA1D0',0x4ba411,'6a ff 6a 01 56 57 56 68 9c 20 00 00 8d 8c 24 dc 07 00 00')
            self.call(s,'004BA1D0',0x4ba424,0x5c1a40);self.call(s,'004BA1D0',0x4ba42a,0x4f55e0)
            self.at(s,'004BA1D0',0x4ba42f,'83 c4 10')
        boundary=self.e['semantics']['boundary'];self.assertEqual((boundary['presentationEntry'],boundary['presentationExit']),('004BA411','004BA432'))
        self.assertIn('neither destruction',boundary['temporaryObject']);self.assertIn('no read of that local',boundary['temporaryObject'])

    def test_14_remainder_starts_exactly_442_and_retains_ordered_calls(self):
        for s in SOURCE_HASHES:
            self.at(s,'004BA1D0',0x4ba442,'6a ff 56 8b cf')
            self.at(s,'004BA1D0',0x4ba44c,'8b ce')
            self.at(s,'004BA1D0',0x4ba453,'50 b9 58 19 20 07')
            self.at(s,'004BA1D0',0x4ba45e,'50 6a 04 56 b9 5c 89 99 07')
            self.at(s,'004BA1D0',0x4ba46c,'8b 44 24 18')
            actual=[(c['site'],c['target']) for c in self.e['callLedgers'][s]['004BA1D0'] if 0x4ba442<=int(c['site'],16)<0x4ba46c]
            self.assertEqual(actual,[('004BA447','004AD2B0'),('004BA44E','00495520'),('004BA459','00490D00'),('004BA467','004AD220')])
        b=self.e['semantics']['boundary'];self.assertEqual((b['resetEntry'],b['resetExit'],b['remainderEntry'],b['remainderExit']),('004BA432','004BA442','004BA442','004BA46C'))
        self.assertEqual(b['savedContext'],['original manager','troop pointer','saved force pointer','event-memory domain','saved subject','saved target','old/new scalars','saved next-node cursor'])

    def test_15_recovery_call_ledgers_ranges_boundaries_and_imports_exact(self):
        self.assertEqual(self.e['boundaryMetadata'],BOUNDARY_METADATA)
        self.assertEqual({r['file']:r['sha256'] for r in self.e['provenance']['verificationArtifacts']},VERIFICATION_HASHES)
        for f,h in VERIFICATION_HASHES.items():self.assertEqual(digest((DIRECTORY/f).read_bytes()),h)
        for s in SOURCE_HASHES:
            r=json.loads((DIRECTORY/f'recovery-evidence-{s}.json').read_text())
            self.assertEqual(r['sources'],self.e['sources'])
            self.assertEqual(r['ranges'],[{k:v for k,v in x.items() if k!='evidenceUse'} for x in self.e['ranges'] if x['source']==s])
            self.assertEqual(r['functionRegions'],{k:v for k,v in self.e['functionRegions'].items() if k.startswith(s+':')})
            self.assertEqual(r['callLedgers'][s],self.e['callLedgers'][s])
            self.assertEqual(r['boundaryMetadata'],{k:v for k,v in self.e['boundaryMetadata'].items() if k.startswith(s+':')})
            self.assertEqual(r['importSlotMetadata'],self.e['importSlotMetadata'][s])
            # IDAPython may synthesize zero IAT bytes while raw ID1 preserves
            # low-byte payload. Both distinct views are provenance, not runtime.
            self.assertEqual(r['importSlotMetadata'],self.prior[0]['importSlotMetadata'][s])
            for v in r['importSlotMetadata'].values():
                self.assertEqual(len(bytes.fromhex(v['idapythonBytes'])),4)
                self.assertEqual(len(bytes.fromhex(v['rawId1LowBytes'])),4)
                self.assertFalse(v['runtimeValueCertified'])
        self.assertEqual({p.name for p in DIRECTORY.glob('*.asm.txt')}|{p.name for p in DIRECTORY.glob('*.data.txt')},{r['file'] for r in self.e['ranges']})

    def test_16_dual_source_comparisons_include_no_new_divergence(self):
        differences=[]
        for r in self.e['comparisons']:
            a,b=self.raw['S1',r['start']],self.raw['S2',r['start']]
            self.assertEqual(r['identical'],a==b);self.assertEqual(r['differingByteCount'],sum(x!=y for x,y in zip(a,b))+abs(len(a)-len(b)))
            if a!=b:differences.append(r['start'])
            for s,v in [('S1',a),('S2',b)]:self.assertEqual(r[s+'length'],len(v));self.assertEqual(r[s+'sha256'],digest(v))
        self.assertEqual(differences,['0063ADD0','0072EE10','0079C2B0'])
        for f in ['004B5020','00481590','004815B0']:self.assertEqual(self.raw['S1',f],self.raw['S2',f])

    def test_17_source_independence_and_explicit_limits(self):
        imports=[]
        for node in ast.walk(ast.parse(Path(__file__).read_text())):
            if isinstance(node,ast.Import):imports.extend(a.name.split('.')[0] for a in node.names)
            elif isinstance(node,ast.ImportFrom):imports.append((node.module or '').split('.')[0])
        self.assertTrue(set(imports)<={'argparse','ast','io','json','pathlib','re','struct','sys','unittest','check_native_event9_presentation_source','check_officer_relocation_source','capstone'})
        for name in ['native_event9_force_reset_profile','native_event9_force_reset_frame','native_event9_force_reset_primitives','native_event9_presentation_profile']:self.assertNotIn(name,sys.modules)
        for phrase in ['reaction442..46C','event16/18','presentation native','unknown virtual','capture/surrender','positive refunds','S2 patched','clean-stock']:
            self.assertTrue(any(phrase in x for x in self.e['semantics']['excluded']),phrase)


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--idb-s1',type=Path);p.add_argument('--idb-s2',type=Path);p.add_argument('--report',type=Path);p.add_argument('--decode',action='store_true');p.add_argument('--decoder-path',type=Path)
    args=p.parse_args();result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeEvent9ForceResetSource))
    if not result.wasSuccessful():return 1
    e,raw,rows,prior,selected=load_evidence();verified=[]
    for s,path in [('S1',args.idb_s1),('S2',args.idb_s2)]:
        if path is not None:
            verify_raw_id1(path,s,selected);verified.append(dict(source=s,idbSha256=SOURCE_HASHES[s],inheritedIntervals=sum(k[0]==s for k in prior[4]),intervals=sum(k[0]==s for k in selected),selectedIntervalBytes=sum(len(b) for k,b in selected.items() if k[0]==s),allRawId1BytesMatch=True))
    decoded=fresh_decode(e,rows,args.decoder_path) if args.decode else None
    report=dict(checker=Path(__file__).name,sourceProfile=e['profileId'],baselineCommit=BASELINE,sourceTests=result.testsRun,inheritedSourceTests=26,nestedInheritedSourceTests=[21,21,17,12,13],sourceTestsPassed=True,rangeBudget=BUDGET,rawId1Verification=verified,freshDecoderVerification=decoded,allCallOperandsAndBranchesVerified=True,recoveryMetadataVerified=True,machineCodeExecuted=False,originalExeExecuted=False,stockOriginalVerified=False,recordedExeHashesIndependentlyVerified=False,rawRuntimeMapCaptured=False,resetEntry='004BA432',resetExit='004BA442',reactionRemainderEntry='004BA442',reactionRemainderExit='004BA46C',newSourceSpecificDifferences=0,event9Raw94=4294967295,event9Raw98=0,generalSetterExposed=False,reactionRemainderBodyExecuted=False,presentationBodyExecuted=False,event16or18Implemented=False)
    if args.report:args.report.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,sort_keys=True));return 0
if __name__=='__main__':raise SystemExit(main())
