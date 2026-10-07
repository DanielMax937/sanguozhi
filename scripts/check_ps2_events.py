"""Validate the independent, inert PS2 historical-event guide corpus. Never run game events.

Dependency-free validator for this package's explicit JSON Schema vocabulary only.
It is not a general JSON Schema implementation, source authenticity proof or engine.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import re
from collections import Counter
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/ps2-scenario-events'
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
    def finite_float(text):
        value = float(text)
        need(math.isfinite(value), 'nonfinite JSON number')
        return value
    return json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=pairs, parse_constant=invalid, parse_float=finite_float)
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

def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

def source_structure(lines, start, end):
    """Recover source indentation only. This is not a game-rule logic parser."""
    result=[]; stack=[]; section=None
    for line in range(start+1,end+1):
        text=lines[line]
        if not text: continue
        match=re.match(r'^( *)\* (.*)$',text)
        if match:
            spaces=len(match[1]); need(spaces>=2 and spaces%2==0,'unexpected source indentation')
            depth=spaces//2-1
            while stack and stack[-1][0]>=depth: stack.pop()
            parent=stack[-1][1] if stack else None
            if depth==0:
                section='condition' if match[2].startswith('条件') else 'result' if match[2].startswith('結果') else 'reference'
                role=section+'-label' if section in ('condition','result') else section
            else: role=section
            stack.append((depth,line))
        else: depth=0;parent=None;role='annotation';stack=[]
        result.append((line,hashlib.sha256(text.encode()).hexdigest(),depth,parent,role))
    return result

# Fixed source catalog/line structure and recovered approved data fingerprints.
# These pins are not proof of original-game correctness.
EXPECTED_SNAPSHOT = 'f1ab94d5e25170370285523cd90ab212099e4bd8515c00faffa2641e57fac40e'
EXPECTED_SOURCE = {'sourceId': 'atwiki-100-ps2', 'url': 'https://w.atwiki.jp/sangokushi11/pages/100.html', 'title': '史実イベント（PS2）', 'retrievedUTC': '2026-10-07', 'displayedLastUpdated': '2010-03-09 16:52; timezone not stated', 'toolFreshness': 'Crawled: last month; not a live origin freshness certificate', 'snapshotFile': 'atwiki-100-ps2-rendered-lines.txt', 'snapshotSha256': 'f1ab94d5e25170370285523cd90ab212099e4bd8515c00faffa2641e57fac40e', 'snapshotFormat': 'web-rendered-text-normalized-line-boundaries-not-raw-html', 'selectionStartLine': 116, 'selectionEndLine': 1061, 'bodyStartLine': 191, 'bodyEndLine': 1061, 'commentsIncluded': False, 'colorInformationRetained': False, 'expectedObservationCount': 64}
EXPECTED_PRESERVED = {'historicalCounts': {'observations': 105, 'events': 66, 'unresolvedDifferences': 41}, 'genericCounts': {'observations': 33, 'events': 31, 'unresolvedIssues': 10}, 'files': [{'path': 'data/scenario-events/README.md', 'sha256': 'd88fccc00f9c3257588d2847e6a0dd38a166a13a3d6ee28707dfb290abdac453'}, {'path': 'data/scenario-events/atwiki-88.json', 'sha256': 'c309ed1024df30e62f5a7ff6f4f16bb82fd98cac3e7aed19f80a833afe746552'}, {'path': 'data/scenario-events/gamersky-2008.json', 'sha256': '45cb47718d2e90eebd59b06fcc81ea24972852bcae2dc436aa60e45c8fa1c8e5'}, {'path': 'data/scenario-events/inventory-schema.json', 'sha256': '5024d96e8235c25244406a077844f53cc4f522c83793efbc29401e2452633168'}, {'path': 'data/scenario-events/inventory.json', 'sha256': 'fc3d85dd243b37be9068960198787b64a871168469cae28576dd070b84763ce4'}, {'path': 'data/scenario-events/schema.json', 'sha256': '1f691e5a1276b292ad8a63534489992a5db6eb49dadc1e3a62a2667b4d2e2ccb'}, {'path': 'data/generic-events/README.md', 'sha256': 'fa384f796eac4bad72f245bb25fa888f9d5192eebcd8d3211bc0b3caa1ddfe39'}, {'path': 'data/generic-events/atwiki-88.json', 'sha256': 'cd76844fe0b6f8417acea0f84fbeaf3f94d5b2edfc51b645ce07be026e330d28'}, {'path': 'data/generic-events/gamersky-2009.json', 'sha256': '1285ebb2097ef373b9404316aa47977df7d501b9c9d62768def80da31ca7c29d'}, {'path': 'data/generic-events/inventory-schema.json', 'sha256': '0c033b181e12293baf481d0da4b90995b83edc72b95391880b41fc4610149edf'}, {'path': 'data/generic-events/inventory.json', 'sha256': '0d819b4a2f3252ca3b5a0794a88aea540fba13ff2c18974c94cbc71988d3bc53'}, {'path': 'data/generic-events/schema.json', 'sha256': 'f1aa0986c587a43f6d69356b96b3a922f5626a11dde62520e843d26eca48a9c6'}]}
EXPECTED_CATALOG = [('ps2.historical.01', 'ps2.atwiki100.01', 1, '黄巾の乱', 191, 195, 'conditions-only'), ('ps2.historical.02', 'ps2.atwiki100.02', 2, '桃園の誓い', 196, 200, 'conditions-only'), ('ps2.historical.03', 'ps2.atwiki100.03', 3, '少帝廃立', 201, 211, 'conditions-and-results'), ('ps2.historical.04', 'ps2.atwiki100.04', 4, '反董卓連合', 212, 215, 'conditions-only'), ('ps2.historical.05', 'ps2.atwiki100.05', 5, '長安遷都', 216, 245, 'conditions-and-results'), ('ps2.historical.06', 'ps2.atwiki100.06', 6, '反董卓連合崩壊', 246, 256, 'conditions-and-results'), ('ps2.historical.07', 'ps2.atwiki100.07', 7, '連環の計①酒宴', 257, 268, 'conditions-and-results'), ('ps2.historical.08', 'ps2.atwiki100.08', 8, '連環の計②鳳儀亭', 269, 275, 'conditions-and-results'), ('ps2.historical.09', 'ps2.atwiki100.09', 9, '連環の計③謀殺', 276, 302, 'conditions-and-results'), ('ps2.historical.10', 'ps2.atwiki100.10', 10, '虎を追うもの', 303, 313, 'conditions-and-results'), ('ps2.historical.11', 'ps2.atwiki100.11', 11, '悪来対許褚', 314, 329, 'conditions-and-results'), ('ps2.historical.12', 'ps2.atwiki100.12', 12, '荀彧、郭嘉を推挙す', 330, 340, 'conditions-and-results'), ('ps2.historical.13', 'ps2.atwiki100.13', 13, '郭嘉、劉曄を推挙す', 341, 351, 'conditions-and-results'), ('ps2.historical.14', 'ps2.atwiki100.14', 14, '劉曄、満寵・呂虔を推挙す', 352, 362, 'conditions-and-results'), ('ps2.historical.15', 'ps2.atwiki100.15', 15, '曹嵩惨殺', 363, 374, 'conditions-and-results'), ('ps2.historical.16', 'ps2.atwiki100.16', 16, '徐州禅譲', 375, 386, 'conditions-and-results'), ('ps2.historical.17', 'ps2.atwiki100.17', 17, '糜氏と劉備（結婚）', 387, 400, 'conditions-and-results'), ('ps2.historical.18', 'ps2.atwiki100.18', 18, '許昌遷都', 401, 413, 'conditions-and-results'), ('ps2.historical.19', 'ps2.atwiki100.19', 19, '孫策出陣', 414, 418, 'conditions-only'), ('ps2.historical.20', 'ps2.atwiki100.20', 20, '小覇王孫策', 419, 427, 'conditions-and-results'), ('ps2.historical.21', 'ps2.atwiki100.21', 21, '二張推挙', 428, 446, 'conditions-and-results'), ('ps2.historical.22', 'ps2.atwiki100.22', 22, '張紘、顧雍を推挙す', 447, 457, 'conditions-and-results'), ('ps2.historical.23', 'ps2.atwiki100.23', 23, '二喬婚礼', 458, 472, 'conditions-and-results'), ('ps2.historical.24', 'ps2.atwiki100.24', 24, '周瑜、魯粛を推挙す', 473, 483, 'conditions-and-results'), ('ps2.historical.25', 'ps2.atwiki100.25', 25, '魯粛、諸葛瑾を推挙す', 484, 494, 'conditions-and-results'), ('ps2.historical.26', 'ps2.atwiki100.26', 26, '偽帝僭称', 495, 517, 'conditions-and-results'), ('ps2.historical.27', 'ps2.atwiki100.27', 27, '董承の密勅', 518, 536, 'conditions-and-results'), ('ps2.historical.28', 'ps2.atwiki100.28', 28, '二強開戦（曹vs袁）', 537, 547, 'conditions-and-results'), ('ps2.historical.29', 'ps2.atwiki100.29', 29, '趙雲再会', 548, 557, 'conditions-and-results'), ('ps2.historical.30', 'ps2.atwiki100.30', 30, '好漢劉備', 558, 566, 'conditions-and-results'), ('ps2.historical.31', 'ps2.atwiki100.31', 31, '袁家分裂', 567, 584, 'conditions-and-results'), ('ps2.historical.32', 'ps2.atwiki100.32', 32, '御曹司一番乗り', 585, 599, 'conditions-and-results'), ('ps2.historical.33', 'ps2.atwiki100.33', 33, '郭嘉の死', 600, 607, 'conditions-and-results'), ('ps2.historical.34', 'ps2.atwiki100.34', 34, '孫策の死', 608, 611, 'reference-only'), ('ps2.historical.35', 'ps2.atwiki100.35', 35, '甘寧亡命', 612, 623, 'conditions-and-results'), ('ps2.historical.36', 'ps2.atwiki100.36', 36, '徐庶登場', 624, 632, 'conditions-and-results'), ('ps2.historical.37', 'ps2.atwiki100.37', 37, '徐庶去る', 633, 647, 'conditions-and-results'), ('ps2.historical.38', 'ps2.atwiki100.38', 38, '曹操の南征', 648, 660, 'conditions-and-results'), ('ps2.historical.39', 'ps2.atwiki100.39', 39, '三顧の礼①', 661, 672, 'conditions-and-results'), ('ps2.historical.40', 'ps2.atwiki100.40', 40, '三顧の礼②', 673, 678, 'conditions-and-results'), ('ps2.historical.41', 'ps2.atwiki100.41', 41, '三顧の礼③', 679, 687, 'conditions-and-results'), ('ps2.historical.42', 'ps2.atwiki100.42', 42, '孔明の嫁とり', 688, 700, 'conditions-and-results'), ('ps2.historical.43', 'ps2.atwiki100.43', 43, '荊州分裂', 701, 733, 'conditions-and-results'), ('ps2.historical.44', 'ps2.atwiki100.44', 44, '孫劉同盟', 734, 758, 'conditions-and-results'), ('ps2.historical.45', 'ps2.atwiki100.45', 45, '馬氏の五常', 759, 769, 'conditions-and-results'), ('ps2.historical.46', 'ps2.atwiki100.46', 46, '孫尚香の結婚', 770, 785, 'conditions-and-results'), ('ps2.historical.47', 'ps2.atwiki100.47', 47, '呉下の阿蒙にあらず', 786, 799, 'conditions-and-results'), ('ps2.historical.48', 'ps2.atwiki100.48', 48, '周瑜の死', 800, 810, 'conditions-and-results'), ('ps2.historical.49', 'ps2.atwiki100.49', 49, '落第県令', 811, 828, 'conditions-and-results'), ('ps2.historical.50', 'ps2.atwiki100.50', 50, '魏公騒動', 829, 854, 'conditions-and-results'), ('ps2.historical.51', 'ps2.atwiki100.51', 51, '魏王即位', 855, 873, 'conditions-and-results'), ('ps2.historical.52', 'ps2.atwiki100.52', 52, '漢中王即位', 874, 890, 'conditions-and-results'), ('ps2.historical.53', 'ps2.atwiki100.53', 53, '美髯公には及ばず', 891, 907, 'conditions-and-results'), ('ps2.historical.54', 'ps2.atwiki100.54', 54, '曹操の死', 908, 920, 'conditions-and-results'), ('ps2.historical.55', 'ps2.atwiki100.55', 55, '魏帝即位', 921, 946, 'conditions-and-results'), ('ps2.historical.56', 'ps2.atwiki100.56', 56, '蜀帝即位', 947, 964, 'conditions-and-results'), ('ps2.historical.57', 'ps2.atwiki100.57', 57, '虎の子（関張2代目義兄弟）', 965, 975, 'conditions-and-results'), ('ps2.historical.58', 'ps2.atwiki100.58', 58, '呉王即位', 976, 992, 'conditions-and-results'), ('ps2.historical.59', 'ps2.atwiki100.59', 59, '陸遜登場', 993, 1006, 'conditions-and-results'), ('ps2.historical.60', 'ps2.atwiki100.60', 60, '劉備の死', 1007, 1014, 'conditions-and-results'), ('ps2.historical.61', 'ps2.atwiki100.61', 61, '九品中正法', 1015, 1026, 'conditions-and-results'), ('ps2.historical.62', 'ps2.atwiki100.62', 62, '呉帝即位', 1027, 1039, 'conditions-and-results'), ('ps2.historical.63', 'ps2.atwiki100.63', 63, '諸葛亮の北伐', 1040, 1052, 'conditions-and-results'), ('ps2.historical.64', 'ps2.atwiki100.64', 64, '諸葛亮の死', 1053, 1061, 'conditions-and-results')]
EXPECTED_STRUCTURE = {'ps2.atwiki100.01': 'ecca1ec3db375ba7b2f728793b3803e66ea7dd602eb6e16ccb93c0872a7390e4', 'ps2.atwiki100.02': '6fa8c87a8188d0038a4ecfe3e7b095e3d875a333153f9f73b80a7d524b22087a', 'ps2.atwiki100.03': 'c13ae6c0c40d843a3b2719bdf082c158d79bad2b17ac72a52d50bee843dcc01d', 'ps2.atwiki100.04': '47f4cf1cb3766d658a03f2eacb863f081a79a6a017d1e786452e7541d5236094', 'ps2.atwiki100.05': 'b601607c5517f66359a64af32c783d6d7b74c5804e92bd3cdf4d2b8a5e8bab68', 'ps2.atwiki100.06': 'dc6f00b4834141f1722451d62ce3dfb458fe13ec2908e4c851fc959647d1773e', 'ps2.atwiki100.07': '01862920f3ae6ed36cb6aa0b0d51a196dd3343d2f248903e8bcfaeb6c405664e', 'ps2.atwiki100.08': 'ee92e3c0d1f5e73db0d8fc92aea7bdd087d6ec9af799371d5e87e87911e81c88', 'ps2.atwiki100.09': 'b08249f25de8691ee78ad21651d417bf3e2dd3263da19600e25f324e1ec8fe6d', 'ps2.atwiki100.10': '4f96c8d7b264b0fed08f2ed8bfeb798c26fb45c1553def5e06f618943bd8992d', 'ps2.atwiki100.11': 'dc778e884a174228b18f7042485bbbdb95c9ff0c2b5e4ae5942982a15f39325e', 'ps2.atwiki100.12': '1e82585892d98431476df66e22c9ac0921ee4fd24ee0342d5a001d96f1ba966b', 'ps2.atwiki100.13': '10a6b7270a65e5df08cb37761036b9f26ba0c407785d4668867f47ade0d48816', 'ps2.atwiki100.14': '67602c20a35123b88ef77ad7de25ec635625affffffc8f7799b6fe6ab67c66b8', 'ps2.atwiki100.15': '0c19b01ad7f3dc3d31da688eda8b8154657d482870fa3f63e97957dcb48a4dea', 'ps2.atwiki100.16': '258853f8a0881dc64f88e11f723b9802700a468f70300724af04341226133232', 'ps2.atwiki100.17': 'd67f3fd254386b992b7b9b8e5b77f15b7883dc82879ad535cd99855b45294658', 'ps2.atwiki100.18': 'c6070a911a6992ac1cc16e7b5731da8755a93016d3b08a1f28e215e0ef0ffd03', 'ps2.atwiki100.19': '1ff5253d483b805f04e6ebdfb7ec10e74cac6e25d12c3d19364c0d6829c6d064', 'ps2.atwiki100.20': 'dbfab3db4e58764f4933a3fffab764cb958483cfad3f94f4ad37cac9e5496ed5', 'ps2.atwiki100.21': 'f12c26b197e20bac05b52b0e18372244409d1d05471354c8d4958ab38757c684', 'ps2.atwiki100.22': 'e39858f1f36e579eb2b692faba8b4da432ab230e894ac1f0664895bc6f29f75a', 'ps2.atwiki100.23': '2b5cdfde046f2f7fe5deb6267532d69f4aee61ff4bb1a9d07bf648867b444f6a', 'ps2.atwiki100.24': '564bb9e0aecf3aaf2d523b392fd959d6ee39fb3258cdeb093ed8f8253bb0a865', 'ps2.atwiki100.25': '7fd240969fd113dfb23a0d591c83d0a90df05664500a3a4478caf898702ef83a', 'ps2.atwiki100.26': '83fa1130fc88315d99f82cb785c76f08e02894c5d3b594ed8c43f6657755c0fb', 'ps2.atwiki100.27': 'f5164752caa2003e8de0e07a1dc65929bd850c32d97c2a2790db6f719cb6cdca', 'ps2.atwiki100.28': 'b53c31a7316febd6b81327d90d756de80afcf744a98842978e6b8faa5580b836', 'ps2.atwiki100.29': '6921d0fc996350e0b91330561bbc1524db136598bfbda5758f65ac409a16b7b5', 'ps2.atwiki100.30': '3750d486153caf533fb3751d956abe22c76f0917c1e90939058c5b9d18570292', 'ps2.atwiki100.31': 'c81d8d46e96c25350bb6216fb0833aa0c0936cdbdde5175f57770399a62221c3', 'ps2.atwiki100.32': 'dbb3d1a6d6b271b109922cd60a87738c7cfae34a0f038535118c93b3b7d54c2d', 'ps2.atwiki100.33': '47bd30589c25e832a7374986a64fadbccd662e9b0863a085e4b1c4f8835b367e', 'ps2.atwiki100.34': '75362d117b5a56cb3bde9024a2850854a8fa10a98856aa39bcbce903db723f2a', 'ps2.atwiki100.35': '531662cb0b55105a3a3ef1139e1baaef0501b320b9835c8e377f5372a6cc0646', 'ps2.atwiki100.36': '42c4269fc43ec2996ba4685f1506b698937abc00e3184aa67e417677ac7131dd', 'ps2.atwiki100.37': '59c73e017f98bbf9576c5bec400c4588d62e4b29cb7886b802e6e1561b83fab7', 'ps2.atwiki100.38': '8c54897d67329b661b68bf95121adba0a246a36d51d6def63c758925b18470f0', 'ps2.atwiki100.39': 'f66884e78457c9b646d3ef0cb2635027814bb5e98dc362f6371de6d8b1c3fcf3', 'ps2.atwiki100.40': '685f9eb2acb102c01ecc811e020f4e0f06bd5762beca02fa667633ff280d9b63', 'ps2.atwiki100.41': '66115fc7265a4d37498c862eb9a9536e749af1ae6a4a8a87837bfbd4c57a6886', 'ps2.atwiki100.42': 'daddf9cea5aac858d3660a51baaad4c8c6219a46d6570d0c11c6c21d68151f3d', 'ps2.atwiki100.43': 'ecbd412931023556b06a768d53d3617121fb1d0022e75f7257345279c9793090', 'ps2.atwiki100.44': 'cecc99e815d94129773f63d6aa05bfff3a75e7d9cc09df298069b5c8a6e57cb6', 'ps2.atwiki100.45': '0236a59c6aba652bbf7c29611bd62e7f34859bbbf908e2078aa0535f69038d73', 'ps2.atwiki100.46': '9efd5a05aa6acada237814684a23d5305e8ca79505ecfb266f6472190372a58c', 'ps2.atwiki100.47': '72135fc6a812768da0f22b8c4fac4932939ce1f2fbd2de178b7bc7a4a73528bd', 'ps2.atwiki100.48': 'ea0e6bf02d958f952df65e6338ca54e4bfe1046630d43745057988f3626329c4', 'ps2.atwiki100.49': '3b1f9037234a01bc2f76f37c7e44d7024f96ddd6d6d49009824987b5e7724186', 'ps2.atwiki100.50': '61682a422337320288f458f845358183c335b5252a0b9c19e914b220a0d51e3e', 'ps2.atwiki100.51': 'cc20b0c3acb1ce3ddfa4f1e4ab0876b2f3aed3a2e06bf9e1c4598fc2540c95ff', 'ps2.atwiki100.52': 'c3c107d08558929b3108a0c970576d02f0a2613015a207631b262ca80869d86b', 'ps2.atwiki100.53': 'e2fc8a4def265e2a52ce0800a526cfa3c1d4e5d93bedf5fc6079c4dcadba88e2', 'ps2.atwiki100.54': '2ffd1d28c2ff8ee3db6517851a12739922983b95ab2ac0c33da255426a53d385', 'ps2.atwiki100.55': '5fc8ae46d604b737188d869d26d5e84000be1ee6d3656fce73df496b46a807ba', 'ps2.atwiki100.56': '4b98e6331492c6a0bf0733182c9beb64361f7bc9d4830a550bc413ccb5156d43', 'ps2.atwiki100.57': 'ba73b7c8d7fd095d0ff5ddab529d1e194e5fe66f61c1ca4d1490eea94086da1e', 'ps2.atwiki100.58': '7145bd4d7fafda646572db2d10f0bc6b2fa8bdf4e7880aebe949eb082f76ec45', 'ps2.atwiki100.59': 'bec0991169e69271e5ae445efb7af6a6e061aac02889b138759f6f8fb06d88d2', 'ps2.atwiki100.60': 'd51040b02cd50c68721f09fdda6b42e57eb90bb69eb4083cdc7dc1757133f740', 'ps2.atwiki100.61': 'ae357b0fa02c221cfde12e2c64de84b96cbbd6f8bd9b0ae4a94bda04c7df2b71', 'ps2.atwiki100.62': 'a2fe72dd71d2747ab1e4b4a32ad1c56ea29e86167c2e6e115b3fbe28bc9d5106', 'ps2.atwiki100.63': '72bdc3d0a7b5ba223a82ab09acf86e5d7c395d989e418b6212c549f0a07f953c', 'ps2.atwiki100.64': 'fa3a9891ad7e71ac661ec9d8302a2ca9a83943f0c0321d08555faff3dcf48521'}
EXPECTED_REVIEW_HASHES = {'ps2.atwiki100.01': '34188d92f2a810f0b00b4acd232ecab2590af33c945bc92551c96666fbd32d5b', 'ps2.atwiki100.02': 'b055b181442da16fa2438c106c0e27538c882577d5bbc880947cafcc00e6e2ba', 'ps2.atwiki100.03': 'e59fe68cc10b6557e2ac9e24a90d3b883ba35a31cc55673f3b6936014b0bd331', 'ps2.atwiki100.04': '857c8b807546b474cb4c882d6eae4c5338e3017d04569860cb647e33e32ac92a', 'ps2.atwiki100.05': 'd891f4c76412d0a93155654578b69b38ae577c0f5c2198c81032971b3efd7a93', 'ps2.atwiki100.06': 'b60ac9db4c891cfc15fe4cf804af0917859450076942dab5366f9c348d06c38b', 'ps2.atwiki100.07': '0ffa35f6e6f29d3de048622be1eb3fad1f19d6374fb25f2fc81be4c1bf80f6ff', 'ps2.atwiki100.08': 'a51152346d6c8337610c17d960b49100da21d27647d496aba1775f0c455c0cea', 'ps2.atwiki100.09': '8b86bfc784f8938954a26e9a19170fedb3545c24ff2f820ca56dc3bdf1920759', 'ps2.atwiki100.10': '7bf8843f7d5381d612419874c40bc685b4fd8382097f20d356a9f495d4f79aed', 'ps2.atwiki100.11': 'f5ecc6b8cdc27b90d0e6ab2b88eaf9a49a65634083cd868255a69d3f43b72315', 'ps2.atwiki100.12': 'bf7aaf1c107f4b932d0afa1530cc1b42cbac29376812607953fce784530f032c', 'ps2.atwiki100.13': '5ef313d3a5ef8d6ed1559e35fa83c07e0386a04e0f8369e8769439b424697eaa', 'ps2.atwiki100.14': '2d640f7330544a2fdb2c8eb2b1bfbc2115e864f7908d185eeaeaff190cf46484', 'ps2.atwiki100.15': 'b069a93bca23cbe2a695e6f6fd0c305ae073be42fe10e7472a68a596ee41eff6', 'ps2.atwiki100.16': '2888d018786290912f698a5209510a990aef65d08338776eb90bf47213d81c1d', 'ps2.atwiki100.17': '8813a2ee3aeeacded754d85393cdafab0e1b69d991742f169246a2eae68d4fc4', 'ps2.atwiki100.18': 'fd4851e8ff5ff13aa06ac0221db8c56c9284ddeaba009d8cf16d3ff1bc749442', 'ps2.atwiki100.19': '0ff29f2df8c6d08a5c53a7546448eac53d21aa741fb5aecbdf396bf3dbd1dd0e', 'ps2.atwiki100.20': '9c477ed3294324b8ddc254e47987a1a520f4c69c06e8adfd9eea7a1ea43bee0a', 'ps2.atwiki100.21': 'cf661ebdfbac05435c5eb2642b9eddeb412f2d239bb5815aff075fe864b93374', 'ps2.atwiki100.22': 'aa24bd5bf4c8c3774d3c91bb7a71b52418353aa46a9934672f48c0d7da72e81e', 'ps2.atwiki100.23': 'c1f3e030a0008fd03302849d2226c0bf3fdb92b2c68f56412b7bc14e39319c06', 'ps2.atwiki100.24': '9dbaa1a234ea5b1a6e0b98cfe14863ab8b8fced69fa807d62ba20eb585dfa35d', 'ps2.atwiki100.25': 'be08f90c3f76e2df0cc928a3ff4ec880e78fceb2656b3ac02bed9bc9d39c5d7e', 'ps2.atwiki100.26': 'da1f013cccf368692136e62ff91d8fa8d054d1baf1827d300a8aaa2edc22b755', 'ps2.atwiki100.27': '5d32ea91c072d6593c542f13c5a13c03de74242348573dbf2ad43c706e3178b7', 'ps2.atwiki100.28': '1385020b61bd01cae58987c51cb56f1cb9e31466691064132bc08d931c3cb538', 'ps2.atwiki100.29': '8d1305fc0fd96367ec021b958bfc91931923361642423e0fd795c7c58922ea93', 'ps2.atwiki100.30': '216a7fc0bb90867da02bd3dd782aa241aa07fa3d6e11b088200a68ff39b23279', 'ps2.atwiki100.31': 'c1378d03173a3b9d84d9c4157eef933919c7e9ef2037c9ed81faa726137a00ec', 'ps2.atwiki100.32': 'c880cb21cb8cc3a7c6c0f87caeabf929f59018f073f536ef5a5ec6a358cb3959', 'ps2.atwiki100.33': 'ac2c8cfcc58da45ec91acf9c4e1b968d44b18e13d8f73ce7098f60bd43a106b1', 'ps2.atwiki100.34': '6f861747efe4cbb2ba54c01319b3c285f4888d956f9e969e3cd5b4354652643c', 'ps2.atwiki100.35': '545858c3060beb6068bd38b3fe2e31c0fe0345688dd0c334819bd05c463584db', 'ps2.atwiki100.36': 'b643b7ec463be34133352e3d85ded0da1c50ac061273fd86c3b7057063f20203', 'ps2.atwiki100.37': '2d35607b71e87121086f35119bbd1273455de5b5738ff833ade732712ce3ffc2', 'ps2.atwiki100.38': '28298ac552a8e322bbc4a349004780481f1099d2088afa22b705b645ed463994', 'ps2.atwiki100.39': '90a4bfeaa0b86bd1bcd68d3d5e123d11f990b38813484e06794846fc1a01f445', 'ps2.atwiki100.40': 'd341ed39f1942922af0cefd9898e7a03cd66434ea0c40e58e610bce3d3e64f0f', 'ps2.atwiki100.41': 'c0f062e801bb12df49eb9a7493f8f237a9c0d2ac5b7596db77ab09f8832d5014', 'ps2.atwiki100.42': '5d1d926b48002ea15f3cfe848e985ba71f53af540d45d972f4fb29f8d3b07f8d', 'ps2.atwiki100.43': 'ba61bc2fc72fe18094b6604560cf000e8e9611e2784c84a087e918b669dff058', 'ps2.atwiki100.44': '4a2c22b6192e91834b07ca67d87b0c8ed3c5c74065d19dd39cc98c60f94fed54', 'ps2.atwiki100.45': 'b4e93ae4e6eefc8b800061f134197feed9e4a0b861d2b7b305c51a3153bb8400', 'ps2.atwiki100.46': '8f564642736f909acf0d8af72ab16b005b57975b743ea26e9ea8e7d982623542', 'ps2.atwiki100.47': 'bf9bb1da72263ac092d6bb95a78fc729c39c22f82595cb6237bfaa8edd2bff15', 'ps2.atwiki100.48': '1839ec0d962aac9ec10363928458a2f5a7e930b836f7c1ad5ac4047421351f8e', 'ps2.atwiki100.49': 'adeee86e1acaa233e4836353bf9dc988e6887c3b7ab67648ee23b12eeb4bf539', 'ps2.atwiki100.50': '5bc6c32273c390d2b3193994969f4c7a94c339f1ec7e534a3361694ee264829f', 'ps2.atwiki100.51': '4f73ce2f4f16a90434ad8c2e09aef9d586ae8ac71d20e2ef534d5896c59a555d', 'ps2.atwiki100.52': 'cda9c0b84dce8d6d60db9b14980c28ddb8428bc36ff6b2ffbc78cfdcdb14fb78', 'ps2.atwiki100.53': '7ef7cbb9e66ab39bd40d614c3006ef610f7cb3248e3fa5b4e80e9b3771b56a84', 'ps2.atwiki100.54': 'ec53cee743fee71a7dc9bd2685846f282db6ba6cf541016b38ca04763dfb4380', 'ps2.atwiki100.55': 'd1dc49c0ef375d39da7b80d32b0146a65757d311c7d256f3e38c56c79ee24199', 'ps2.atwiki100.56': '08ffa7e26d1a80c60680072f6110dee4b0ca07ba303a4902de2a3487e8a8abd7', 'ps2.atwiki100.57': 'e4ec079558530e310176a4913193cdf1942a08d362cc89796b31be393054a2ae', 'ps2.atwiki100.58': '13ab7685ad8e830d7a68c65824ddab6b1e57620c73167be71400d3a1aa4c517c', 'ps2.atwiki100.59': '364b325cbfed979ec8c1f5b9035aa926e582eae29f0d96e097f80780d46b74ff', 'ps2.atwiki100.60': '10a3383b607866196bb04dcbdf4c0a1515f5254ae0995c58c1343bd8bfafe50c', 'ps2.atwiki100.61': '064b9968e052765dc572790c506233d87f35b5275b79d8199f5c7c16cad4f20b', 'ps2.atwiki100.62': '9cb5d3318cc2e65b19528debddea2b632abc773dcbdcb6ac3390d2d4152b6ace', 'ps2.atwiki100.63': '8b15146ecc732ea6709dba2ae483a0a74809fd2d3f77a4463539792fd532c0eb', 'ps2.atwiki100.64': 'c3b2d21a5b7b405c4edcfef860ea1939083cc442e5ae9ab6607cab77bee392f8'}
EXPECTED_ISSUES = [{'id': 'pk-color-loss', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.01', 'ps2.atwiki100.02', 'ps2.atwiki100.03', 'ps2.atwiki100.04', 'ps2.atwiki100.05', 'ps2.atwiki100.06', 'ps2.atwiki100.07', 'ps2.atwiki100.08', 'ps2.atwiki100.09', 'ps2.atwiki100.10', 'ps2.atwiki100.11', 'ps2.atwiki100.12', 'ps2.atwiki100.13', 'ps2.atwiki100.14', 'ps2.atwiki100.15', 'ps2.atwiki100.16', 'ps2.atwiki100.17', 'ps2.atwiki100.18', 'ps2.atwiki100.19', 'ps2.atwiki100.20', 'ps2.atwiki100.21', 'ps2.atwiki100.22', 'ps2.atwiki100.23', 'ps2.atwiki100.24', 'ps2.atwiki100.25', 'ps2.atwiki100.26', 'ps2.atwiki100.27', 'ps2.atwiki100.28', 'ps2.atwiki100.29', 'ps2.atwiki100.30', 'ps2.atwiki100.31', 'ps2.atwiki100.32', 'ps2.atwiki100.33', 'ps2.atwiki100.34', 'ps2.atwiki100.35', 'ps2.atwiki100.36', 'ps2.atwiki100.37', 'ps2.atwiki100.38', 'ps2.atwiki100.39', 'ps2.atwiki100.40', 'ps2.atwiki100.41', 'ps2.atwiki100.42', 'ps2.atwiki100.43', 'ps2.atwiki100.44', 'ps2.atwiki100.45', 'ps2.atwiki100.46', 'ps2.atwiki100.47', 'ps2.atwiki100.48', 'ps2.atwiki100.49', 'ps2.atwiki100.50', 'ps2.atwiki100.51', 'ps2.atwiki100.52', 'ps2.atwiki100.53', 'ps2.atwiki100.54', 'ps2.atwiki100.55', 'ps2.atwiki100.56', 'ps2.atwiki100.57', 'ps2.atwiki100.58', 'ps2.atwiki100.59', 'ps2.atwiki100.60', 'ps2.atwiki100.61', 'ps2.atwiki100.62', 'ps2.atwiki100.63', 'ps2.atwiki100.64'], 'sourceLines': [126], 'description': '页面说明蓝字条目仅限PK，但已保存的web工具纯文本没有保留颜色，无法逐项确认PK限定范围。不得把这64条全部归为PS2原版或全部归为PK；版本适用性仍未解决。'}, {'id': 'opening-results-not-stated', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.01', 'ps2.atwiki100.02', 'ps2.atwiki100.04', 'ps2.atwiki100.19'], 'sourceLines': [193, 194, 198, 199, 214, 215, 416, 417], 'description': '四个开场事件只有条件，正文未给结果。空结果只能表示来源未述，不能补成无变化、已完整收录或任何剧情带来的状态写入。'}, {'id': 'relay-effects-not-stated', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.08', 'ps2.atwiki100.40'], 'sourceLines': [275, 678], 'description': '两条结果仅陈述接续下一事件，没有列出该阶段独立的状态变化。保留接续描述，不据此认定无状态变化，也不把后续事件效果搬入当前条目。'}, {'id': 'sun-ce-death-reference-only', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.34'], 'sourceLines': [608, 610], 'description': '孙策之死正文仅参照另一页的于吉之咒，没有本页条件或结果。本批不跨页扩展，不使用既有generic数据填补，保留reference-only；目标页内容与本页PS2适用性的关系仍未核验。'}, {'id': 'hou-cheng-source-spelling', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.09'], 'sourceLines': [296, 301], 'description': '两处人物名单写作候成，疑为侯成，但本来源文本没有提供纠错依据。保留候成原字；规范姓名及人物映射留待独立证据确认。'}, {'id': 'zhang-kai-action-status-anomaly', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.15'], 'sourceLines': [374], 'description': '正文写張闓已经行动时下野，不能按相邻条件常用的未行动要求反转其意义。该方向是否为原攻略错字尚无实机或第二来源证据，本批按原字转述并保留疑点。'}, {'id': 'zi-sang-source-spelling', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.20'], 'sourceLines': [424], 'description': '正文城市名写紫桑，疑为柴桑，但不能静默修正或据此映射城市ID。原文保留紫桑，规范地点名仍未核验。'}, {'id': 'sun-quan-recommendation-merit', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.22', 'ps2.atwiki100.24', 'ps2.atwiki100.25'], 'sourceLines': [456, 482, 493], 'description': '普通分支写功绩500，孙权分支括注写功绩+2000。不能确定后者是独立增量、目标值或相对普通分支另加2000；不得自行算成2000或2500。保留括注表达及作用分支。'}, {'id': 'xu-chang-nonplayer-outcome', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.18'], 'sourceLines': [407, 408, 409, 410, 411, 412], 'description': '结果段只明确曹操为玩家时可以选择迁都或不迁都，没有明确非玩家曹操的处理。不能从长安迁都的COM默认行为迁移规则。'}, {'id': 'false-emperor-refusal-outcome', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.26'], 'sourceLines': [505, 506, 507, 508, 509, 513], 'description': '正文仅给COM袁术或玩家选择称帝时的结果，未列玩家拒绝称帝的后果。不得补写拒绝必定无变化。'}, {'id': 'zhao-yun-guide-correction-unverified', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.29'], 'sourceLines': [555], 'description': '页面作者声称攻略本只要求刘备未行动、实际还要求关羽与张飞未行动；本批未查看该攻略本或做实机验证。保留作者所述纠正及其来源层级，不把纠正标成已独立验证。'}, {'id': 'xu-shu-timing-correction-unverified', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.37'], 'sourceLines': [636], 'description': '页面作者以90日及徐庶登场后的下一回合说明替代其转述的攻略本360日条件；攻略本原文与实际触发均未独立核验。保留两种说法的归属及特殊路径，不能把作者纠正当作实机证据。'}, {'id': 'jing-zhou-start-date-conjecture', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.43'], 'sourceLines': [703], 'description': '页面把攻略本的208年12月解释为疑似误植，并采用207年12月；原文使用推测措辞。保留推测性纠错而非确定纠错，开始日期边界仍待独立证据确认。'}, {'id': 'jing-zhou-guide-corrections-unverified', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.43'], 'sourceLines': [709, 729], 'description': '页面明确声称刘备应为两城以下、指定五人不论所属势力都强制下野，并反驳其转述的攻略本说法。本批未核验攻略本或原游戏，保留这些作者主张，不能提高为独立实机结论。'}, {'id': 'sun-liu-nonplayer-outcome', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.44'], 'sourceLines': [749, 750, 751, 752, 753, 754, 755, 756, 757, 758], 'description': '结果树明确以玩家控制孙家为前提，未单列玩家控制其他势力或双方COM的处理。不能补出非玩家默认同盟或默认拒绝。'}, {'id': 'sun-liu-forced-alliance-effects', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.44'], 'sourceLines': [750, 751, 752, 753, 754, 755, 756, 757], 'description': '拒绝后舌战落败的分支只说强制成立同盟，没有明确是否同时继承主动同盟分支的友好变化与诸葛亮功绩奖励。保留分支差异，不自动复制奖励。'}, {'id': 'zhou-yu-equal-merit-gap', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.48'], 'sourceLines': [808, 809, 810], 'description': '鲁肃功绩只列低于周瑜时设成同值、高于时加2000，等于周瑜时的行为未述。不能补入任一分支或假定不变。'}, {'id': 'pang-tong-destination-ambiguity', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.49'], 'sourceLines': [827], 'description': '迁移目的地原文为玩家势力所属的城市，势力本身没有唯一所属城的表达，疑似漏写君主但未获证实。不得擅自修为玩家君主所在城或任选玩家城市。'}, {'id': 'wei-emperor-branch-scope', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.55'], 'sourceLines': [935, 936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946], 'description': '帝位分支只有汉帝消失、君主皇帝及国号魏缩进在内；治安、气力、忠诚及外交条目在源文与该分支同级。其是否也仅在登位时生效、拒绝登位的具体后果均未明确。保留原缩进，不擅自重组或断言拒绝也会触发这些效果。'}, {'id': 'shu-emperor-accelerated-timing', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.56'], 'sourceLines': [950], 'description': '魏帝即位已发生时，原文仅说蜀帝即位的发生时间提早，没有给提早量或替代等待阈值。不得补成某个天数、下回合或立即发生。'}, {'id': 'wu-king-cao-city-count', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.58'], 'sourceLines': [982, 983], 'description': '孙家条件明确写八城以上，但曹家条件只写含鄴、洛阳的八城，没有以上二字。不能据常识把后者改为至少八城；等于或下限语义待验证。'}, {'id': 'wu-king-diplomacy-grouping', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.58'], 'sourceLines': [991, 992], 'description': '外交结果把非同盟、友好不足好意、皇帝势力与或者刘家势力写在同一复合句中，或者的作用范围不够明确。保留原句和缩进，不选择某一种布尔括号解释。'}, {'id': 'zhuge-liang-equal-merit-overlap', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.64'], 'sourceLines': [1061], 'description': '姜维功绩低于或等于诸葛亮时设成同值，高于或等于时增加4000，两个原文分支在相等时重叠。不能自行改成严格大于、选定优先级或同时执行。'}, {'id': 'zhuge-liang-item-transfer-scope', 'status': 'unresolved', 'observationIds': ['ps2.atwiki100.64'], 'sourceLines': [1061], 'description': '功绩的两种比较与诸葛亮物品移交姜维写在同一句中，物品移交是否附属于后一分支、还是两分支共同效果未被明确分层。保留完整复合句，不自行指定分支作用域。'}]

def validate_corpus(dataset, inventory, schema, inventory_schema):
    for value,definition in ((dataset,schema),(inventory,inventory_schema)):
        schema_contract(definition);shape(value,definition)
    need(dataset['snapshotSha256']==EXPECTED_SNAPSHOT,'dataset snapshot mismatch')
    need(inventory['source']==EXPECTED_SOURCE,'source provenance changed')
    need(inventory['preservedCorpora']==EXPECTED_PRESERVED,'preserved corpus contract changed')
    events=dataset['observations']
    catalog=[(e['eventId'],e['observationId'],e['sourceOrdinal'],e['sourceSection'],e['sourceLocator']['startLine'],e['sourceLocator']['endLine'],e['coverageKind']) for e in events]
    need(catalog==EXPECTED_CATALOG,'missing/reordered/reassigned PS2 catalog')
    need(inventory['observationCount']==len(events)==64 and inventory['eventCount']==len({e['eventId'] for e in events})==64,'incorrect independent counts')
    need(len({e['observationId'] for e in events})==64,'duplicate observation')
    need(inventory['coverageCounts']==dict(Counter(e['coverageKind'] for e in events))=={'conditions-and-results':59,'conditions-only':4,'reference-only':1},'coverage mismatch')
    count=0; actual_catalog=[]
    for e in events:
        start=e['sourceLocator']['startLine'];end=e['sourceLocator']['endLine']
        need(191<=start<=end<=1061,'section outside source selection')
        nodes=e['clauses']; count+=len(nodes);prior={};stack=[];section=None;signature=[]
        for node in nodes:
            n=node['sourceLine'];depth=node['depth'];parent=node['parentLine'];role=node['role']
            need(start<n<=end and n not in prior,'duplicate/outside clause line')
            need(not prior or n>max(prior),'reordered clause line')
            while stack and stack[-1][0]>=depth:stack.pop()
            if depth==0:
                need(parent is None,'root clause has parent')
                need(role in ('condition-label','result-label','reference','annotation'),'unscoped root rule')
                section=role.removesuffix('-label')
            else:
                need(stack and depth==stack[-1][0]+1 and parent==stack[-1][1],'nonlocal/broken clause ancestry')
                need(section in ('condition','result') and role==section,'clause crosses source section')
            signature.append((n,node['sourceLineSha256'],depth,parent,role));prior[n]=node;stack.append((depth,n))
        need(digest(signature)==EXPECTED_STRUCTURE[e['observationId']],'source clause coverage/hierarchy changed')
        has_conditions=any(n['role']=='condition' for n in nodes);has_results=any(n['role']=='result' for n in nodes)
        need(e['conditionCompleteness']==('partial-source-description' if has_conditions else 'not-stated'),'false condition completeness')
        need(e['resultCompleteness']==('partial-source-description' if has_results else 'not-stated'),'false result completeness')
        if e['coverageKind']=='conditions-only':need(has_conditions and not has_results,'invented result')
        if e['coverageKind']=='reference-only':need(not has_conditions and not has_results and len(nodes)==1 and nodes[0]['role']=='reference','invented reference-only rule')
        if e['coverageKind']=='conditions-and-results':need(has_conditions and has_results,'missing descriptive rule')
        if e['observationId']=='ps2.atwiki100.34':
            need(e['references']==[{'sourceLine':610,'label':'于吉の呪い','url':'https://www4.atwiki.jp/sangokushi11/pages/5.html','status':'not-transcribed'}],'reference destination/scope changed')
        else:need(e['references']==[],'invented external reference')
        hash_=digest(e);need(hash_==EXPECTED_REVIEW_HASHES[e['observationId']],'reviewed transcription changed')
        actual_catalog.append({k:e[k] for k in ('eventId','observationId','sourceOrdinal','sourceSection','sourceLocator','coverageKind')}|{'clauseCount':len(nodes),'reviewedObservationSha256':hash_})
    need(count==inventory['clauseCount']==741,'clause count mismatch')
    need(inventory['catalog']==actual_catalog,'inventory mapping mismatch')
    need(inventory['continuationOnlyResultObservationIds']==['ps2.atwiki100.08','ps2.atwiki100.40'],'continuation-only result scope changed')
    need(inventory['unresolvedIssues']==EXPECTED_ISSUES,'unresolved source limitations changed')
    for issue in inventory['unresolvedIssues']:
        need(issue['observationIds'] and len(issue['observationIds'])==len(set(issue['observationIds'])),'missing/duplicate issue target')
        need(set(issue['observationIds'])<={e['observationId'] for e in events},'dangling issue target')
        need(issue['sourceLines'] and all(116<=n<=1061 for n in issue['sourceLines']),'issue outside selection')
    return {'sources':1,'observations':64,'events':64,'clauses':741,'conditionsAndResults':59,'conditionsOnly':4,'referenceOnly':1,'continuationOnlyResults':2,'unresolvedIssues':len(EXPECTED_ISSUES),'executionEnabled':False}

def check_files(root=ROOT,snapshots=None):
    data=root/'data/ps2-scenario-events'
    ds=load_json(data/'atwiki-100.json');inv=load_json(data/'inventory.json')
    result=validate_corpus(ds,inv,load_json(data/'schema.json'),load_json(data/'inventory-schema.json'))
    actual=[]
    for directory in ('data/scenario-events','data/generic-events'):
        for p in sorted((root/directory).iterdir()):
            need(p.is_file() and not p.is_symlink(),'unexpected preserved corpus entry')
            actual.append({'path':str(p.relative_to(root)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    need(actual==EXPECTED_PRESERVED['files'],'old corpus file set/bytes changed')
    for folder in ('apps','packages/engine/src'):
        for p in (root/folder).rglob('*'):
            if p.is_file():need('ps2-scenario-events' not in p.read_text(encoding='utf-8'),'runtime depends on inert PS2 data')
    result['verifiedSnapshots']=0
    if snapshots is not None:
        raw=(Path(snapshots)/EXPECTED_SOURCE['snapshotFile']).read_bytes()
        need(hashlib.sha256(raw).hexdigest()==EXPECTED_SNAPSHOT,'snapshot hash mismatch')
        lines={}
        for row in raw.decode().splitlines():
            m=re.fullmatch(r'L(\d+): ?(.*)',row);need(m is not None,'non-line content in snapshot')
            n=int(m[1]);need(n not in lines,'duplicate snapshot line');lines[n]=m[2]
        need(list(lines)==list(range(116,1062)),'snapshot has gaps/reordering')
        expected=[(e['sourceLocator']['startLine'],e['sourceSection']) for e in ds['observations']]
        need([(n,t[4:]) for n,t in lines.items() if n>=191 and t.startswith('### ')]==expected,'snapshot headings differ')
        for e in ds['observations']:
            loc=e['sourceLocator'];got=source_structure(lines,loc['startLine'],loc['endLine'])
            want=[(n['sourceLine'],n['sourceLineSha256'],n['depth'],n['parentLine'],n['role']) for n in e['clauses']]
            need(got==want,'snapshot clause structure/line fingerprint mismatch')
        result['verifiedSnapshots']=1
    return result
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--snapshots',type=Path)
    args=parser.parse_args();print(json.dumps(check_files(snapshots=args.snapshots),ensure_ascii=False))
