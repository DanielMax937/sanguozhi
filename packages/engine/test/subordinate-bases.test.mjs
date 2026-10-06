import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const sources = new URL('../../../docs/sources/', import.meta.url);
const read = path => readFileSync(new URL(path, sources), 'utf8');
const catalog = JSON.parse(read('subordinate-bases.json'));
const citiesText = read('cities.json');
const cities = JSON.parse(citiesText).cities;
const sha = text => createHash('sha256').update(text).digest('hex');
function tsv(path, expectedHeader) {
  const [header, ...rows] = read(path).trimEnd().split('\n');
  assert.equal(header, expectedHeader);
  return rows.map(row => row.split('\t'));
}
const parentNames = {'晋陽':'晉陽', '寿春':'壽春', '呉':'吳', '会稽':'會稽'};
const displayNames = {
  '虎牢関':'虎牢關', '剣閣':'劍閣', '壺関':'壺關', '綿竹関':'綿竹關', '陽平関':'陽平關',
  '葭萌関':'葭萌關', '函谷関':'函谷關', '潼関':'潼關', '武関':'武關', '涪水関':'涪水關',
  '臨済港':'臨濟港', '解県港':'解縣港', '新豊港':'新豐港', '羅県港':'羅縣港', '巫県港':'巫縣港',
};

test('subordinate-base catalog has an explicit static community-source version boundary', () => {
  assert.equal(catalog.schemaVersion, 1);
  assert.equal(catalog.datasetVersion, 'atwiki-77-2021-08-04-v1');
  assert.equal(catalog.scope, 'static-subordinate-base-parentage');
  assert.equal(catalog.cityCatalog, 'cities.json');
  assert.equal(catalog.cityKey, 'name');
  assert.equal(catalog.sources.length, 1);
  const source = catalog.sources[0];
  assert.equal(source.id, 'atwiki-city-data-77');
  assert.equal(source.url, 'https://w.atwiki.jp/sangokushi11/pages/77.html');
  assert.equal(source.section, '一覧表 > 港関');
  assert.equal(source.parentCountSection, '一覧表 > 都市 / 港関');
  assert.equal(source.pageLastUpdatedLocal, '2021-08-04 08:20');
  assert.equal(source.pageLastUpdatedTimezone, 'not stated on page');
  assert.equal(source.retrievedDateUtc, '2026-10-06');
  assert.equal(source.evidenceClass, 'community-reference');
  assert.match(source.gameVersion, /do not identify edition, platform or patch/);
  assert.match(source.versionBoundary, /No clean-stock PC-PK, Vanilla, console, scenario or MOD equivalence is certified/);
});

test('subordinate-base factual source projections retain pinned bytes', () => {
  const source = catalog.sources[0];
  assert.equal(source.baseRows, 'subordinate-bases/atwiki-77-parentage.tsv');
  assert.equal(source.cityCountRows, 'subordinate-bases/atwiki-77-city-counts.tsv');
  assert.equal(source.baseRowsSha256, '3735dcab30f0dd2c59ae490bd1bb50995a2275008827cf858305850808bb88ca');
  assert.equal(source.cityCountRowsSha256, '81505dee643d0c43541ce07f74427cefce73eff7ffb273041dc7397a0c319002');
  assert.equal(sha(read(source.baseRows)), source.baseRowsSha256);
  assert.equal(sha(read(source.cityCountRows)), source.cityCountRowsSha256);
});

test('45 distinct subordinate bases have 10 gates, 35 ports and exact city references', () => {
  assert.deepEqual(catalog.counts, {cities:42, bases:45, gates:10, ports:35});
  assert.equal(cities.length, 42);
  assert.equal(catalog.bases.length, 45);
  assert.equal(catalog.bases.filter(base => base.kind === 'gate').length, 10);
  assert.equal(catalog.bases.filter(base => base.kind === 'port').length, 35);
  const cityNames = new Set(cities.map(city => city.name));
  assert.equal(cityNames.size, 42);
  for (const field of ['id', 'name']) assert.equal(new Set(catalog.bases.map(base => base[field])).size, 45);
  assert.equal(new Set(catalog.bases.map(base => base.evidence.sourceName)).size, 45);
  for (const base of catalog.bases) {
    assert.deepEqual(Object.keys(base).sort(), ['evidence','id','kind','name','parentCity']);
    assert.match(base.id, /^(gate|port)-[a-z]+$/);
    assert.ok(base.id.startsWith(`${base.kind}-`));
    assert.ok(cityNames.has(base.parentCity), `${base.id} parent ${base.parentCity}`);
  }
});

test('every named parent relation matches its source row and retains source spellings', () => {
  const rows = tsv(catalog.sources[0].baseRows, 'sourceOrdinal\tkind\tsourceName\tparentCity');
  assert.equal(rows.length, 45);
  assert.deepEqual(rows.map(row => Number(row[0])), Array.from({length:45}, (_, i) => i + 1));
  assert.equal(new Set(catalog.bases.map(base => base.evidence.sourceOrdinal)).size, 45);
  for (const base of catalog.bases) {
    assert.deepEqual(Object.keys(base.evidence).sort(), ['sourceId','sourceName','sourceOrdinal','sourceParentCity']);
    assert.equal(base.evidence.sourceId, catalog.sources[0].id);
    assert.ok(Number.isInteger(base.evidence.sourceOrdinal));
    const row = rows[base.evidence.sourceOrdinal - 1];
    assert.ok(row, `missing row for ${base.id}`);
    const [, kind, name, parent] = row;
    assert.equal(base.kind, kind);
    assert.equal(base.evidence.sourceName, name);
    assert.equal(base.evidence.sourceParentCity, parent);
    assert.equal(base.name, displayNames[name] ?? name);
    assert.equal(base.parentCity, parentNames[parent] ?? parent);
  }
});

test('all 42 city totals agree with both source count rows and the unchanged city catalog', () => {
  const rows = tsv(catalog.sources[0].cityCountRows, 'sourceOrdinal\tsourceName\tportsAndGates');
  assert.equal(rows.length, 42);
  assert.deepEqual(rows.map(row => Number(row[0])), Array.from({length:42}, (_, i) => i + 1));
  const counts = new Map(rows.map(([, name, count]) => [parentNames[name] ?? name, Number(count)]));
  assert.equal(counts.size, 42);
  let total = 0;
  for (const city of cities) {
    const actual = catalog.bases.filter(base => base.parentCity === city.name).length;
    assert.equal(actual, city.portsAndGates, `${city.name}: existing city total`);
    assert.equal(actual, counts.get(city.name), `${city.name}: source total`);
    total += actual;
  }
  assert.equal(total, 45);
  assert.equal(cities.filter(city => city.portsAndGates === 0).length, 15);
  assert.equal(new Set(catalog.bases.map(base => base.parentCity)).size, 27);
});

test('spelling conversions are finite explicit aliases, including Japanese source city names', () => {
  assert.deepEqual(catalog.normalization.parentCityNames, parentNames);
  assert.deepEqual(catalog.normalization.displayNames, displayNames);
  for (const name of Object.keys(parentNames)) assert.ok(catalog.bases.some(base => base.evidence.sourceParentCity === name));
  for (const name of Object.keys(displayNames)) assert.ok(catalog.bases.some(base => base.evidence.sourceName === name));
});

test('subordinate-base repository IDs remain stable and are not native numeric IDs', () => {
  const slugs = 'hulao jiange huguan mianzhu yangping jiameng hangu tongguan wuguan fushui anping xihe baima gaotang linji changyang hailing jiangdu dunqiu guandu mengjin jiexian xinfeng xiayang ruxu wuhu hulin qua juzhang wankou poyang luling jiujiang lukou xiakou huyang zhonglu hanjin jiangjin wulin luoxian gongan dongting fangling wuxian'.split(' ');
  // A source locator is separate from the stable ID. Reordering catalog entries is harmless.
  for (const base of catalog.bases) {
    assert.equal(base.id, `${base.kind}-${slugs[base.evidence.sourceOrdinal - 1]}`);
  }
  assert.match(catalog.idPolicy, /not native game IDs or source-table row numbers/);
  assert.match(catalog.idPolicy, /Preserve IDs across display-name or source-order changes/);
});

test('static parentage leaves all existing city bytes and three unknown development splits intact', () => {
  assert.equal(sha(citiesText), 'aba65db9ceefb60a3187a1c6531090e30fc4ef56fb63708490bc0377b8dbce78');
  assert.deepEqual(cities.filter(city => city.developmentPatches === null).map(city => city.name), ['北海','建業','會稽']);
});

test('no source disagreement is erased or represented as an original-game certification', () => {
  assert.deepEqual(catalog.disagreements, []);
  assert.match(catalog.disagreementScope, /No parent-count mismatch/);
  assert.match(catalog.disagreementScope, /one community source, not an independent original-game verification/);
  assert.ok(catalog.notes.some(note => note.includes('no current faction ownership, legion, capture, income, order or event behavior')));
});
