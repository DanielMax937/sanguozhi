import { canonical, clone, RULES, RULESET } from './rules.ts';
import type { EngineAdapters, GameState, Officer, RngState, RandomSource } from './types.ts';

export const seededRandom: RandomSource = {
  id: 'xorshift32-engine-v1',
  next(state: Readonly<RngState>) {
    if (state.algorithm !== this.id || !Number.isInteger(state.seed) || state.seed < 0 || state.seed > 0xffffffff ||
        !Number.isSafeInteger(state.draws) || state.draws < 0 || state.draws === Number.MAX_SAFE_INTEGER) {
      throw new Error('Invalid RNG state');
    }
    let word = state.seed || RULES['engine.rng'].value.zeroSeedReplacement;
    word ^= word << 13; word ^= word >>> 17; word ^= word << 5;
    const seed = word >>> 0;
    return { value: seed / 0x100000000, state: { algorithm: this.id, seed, draws: state.draws + 1 } };
  },
};
export const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number): value is number => Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
const id = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 200;
const keys = (value: Record<string, unknown>, names: string[]): boolean => canonical(Object.keys(value).sort()) === canonical(names.sort());
const facilities = ['none', 'building', 'complete'];

/** Runtime boundary for JSON imports. The supported domain is intentionally smaller than full SAN11. */
export function validateState(value: unknown, adapters: EngineAdapters): string[] {
  const errors: string[] = [];
  const fail = (message: string) => { errors.push(message); };
  if (!isRecord(value) || !keys(value, ['schemaVersion','scope','ruleset','date','turn','revision','force','corps','bases','officers','rng'])) return ['Invalid state shape'];
  if (value.schemaVersion !== 1 || value.scope !== 'synthetic-training-sandbox') fail('Unsupported state schema/scope');
  const expectedRules = { ...RULESET, gateProfile: adapters.gate.id };
  if (canonical(value.ruleset) !== canonical(expectedRules)) fail('Unsupported ruleset/profile (Vanilla and console builds are not implemented)');
  if (!isRecord(value.date) || !keys(value.date, ['year','month','day']) || !integer(value.date.year,1,RULES['engine.scope'].value.maxYear) || !integer(value.date.month,1,RULES['engine.calendar'].value.months) || !RULES['engine.calendar'].value.days.includes(value.date.day as number)) fail('Invalid xun calendar date');
  if (!integer(value.turn,0,Number.MAX_SAFE_INTEGER - 1) || !integer(value.revision,0,Number.MAX_SAFE_INTEGER - 1)) fail('Invalid turn/revision counter');
  if (!isRecord(value.rng) || !keys(value.rng,['algorithm','seed','draws']) || value.rng.algorithm !== adapters.random.id || !integer(value.rng.seed,0,0xffffffff) || !integer(value.rng.draws,0,Number.MAX_SAFE_INTEGER - 1)) fail('Unsupported or invalid RNG state');
  if (!isRecord(value.force) || !keys(value.force,['id','rulerId','adviserId','techniqueIds','techniquePoints'])) return [...errors,'Invalid force shape'];
  const force = value.force;
  if (!id(force.id) || !id(force.rulerId) || !(force.adviserId === null || id(force.adviserId))) fail('Invalid force identifiers');
  if (!integer(force.techniquePoints,0,RULES['resource.tpCap'].value)) fail('Technique points out of bounds');
  if (!Array.isArray(force.techniqueIds) || force.techniqueIds.some(t => t !== RULES['train.moraleCap'].value.techniqueId) || new Set(force.techniqueIds).size !== force.techniqueIds.length) fail('Only the existing trained-soldiers technique (ID16) is modeled');
  if (!isRecord(value.corps) || !keys(value.corps,['id','forceId','isFirst','actionPoints'])) return [...errors,'Invalid corps shape'];
  const corps = value.corps;
  if (!id(corps.id) || corps.forceId !== force.id || corps.isFirst !== true) fail('Only one first corps of the active force is supported');
  if (!integer(corps.actionPoints,0,RULES['ap.recovery'].value.bankCap)) fail('AP out of bounds');
  if (!Array.isArray(value.bases) || !value.bases.length || value.bases.length > 64) return [...errors,'Expected 1..64 synthetic bases'];
  if (!Array.isArray(value.officers) || !value.officers.length || value.officers.length > 1024) return [...errors,'Expected 1..1024 present synthetic officers'];
  const baseIds = new Set<string>();
  for (const base of value.bases) {
    if (!isRecord(base) || !keys(base,['id','name','kind','ownerForceId','corpsId','parentCityId','troops','morale','gold','trainingCompleted','facilities'])) { fail('Invalid base shape'); continue; }
    if (!id(base.id) || baseIds.has(base.id)) fail('Invalid/duplicate base ID'); else baseIds.add(base.id);
    if (!text(base.name) || !['city','port','gate'].includes(base.kind as string)) fail('Invalid base name/kind');
    if (!(base.ownerForceId === null || id(base.ownerForceId)) || !(base.corpsId === null || id(base.corpsId))) fail('Invalid base ownership');
    if (base.ownerForceId === force.id && base.corpsId !== corps.id) fail('Split-corps ownership is outside this slice');
    if (base.ownerForceId !== force.id && base.corpsId === corps.id) fail('Foreign base cannot belong to active corps');
    if (!(base.parentCityId === null || id(base.parentCityId)) || (base.kind === 'city' && base.parentCityId !== null) || (base.kind !== 'city' && base.parentCityId === null)) fail('Invalid parent-city reference');
    const caps = RULES['train.moraleCap'].value;
    const cap = Array.isArray(force.techniqueIds) && force.techniqueIds.includes(caps.techniqueId) && base.ownerForceId === force.id ? caps.trainedSoldiers : caps.ordinary;
    if (!integer(base.troops,0,RULES['engine.scope'].value.maxTroops) || !integer(base.morale,0,cap) || !integer(base.gold,0,Number.MAX_SAFE_INTEGER)) fail('Base resources outside supported bounds');
    if (typeof base.trainingCompleted !== 'boolean') fail('Invalid training flag');
    if (!isRecord(base.facilities) || !keys(base.facilities,['drillGround','militaryOffice','completedTalismanPlatforms']) || !facilities.includes(base.facilities.drillGround as string) || !facilities.includes(base.facilities.militaryOffice as string) || !integer(base.facilities.completedTalismanPlatforms,0,30)) fail('Invalid facilities');
    else if (base.kind !== 'city' && (base.facilities.drillGround !== 'none' || base.facilities.militaryOffice !== 'none' || base.facilities.completedTalismanPlatforms !== 0)) fail('City-only facilities cannot be assigned to port/gate');
  }
  for (const base of value.bases) {
    if (isRecord(base) && base.kind !== 'city' && !value.bases.some(p => isRecord(p) && p.id === base.parentCityId && p.kind === 'city')) fail('Missing port/gate parent city');
  }
  const officerIds = new Set<string>();
  for (const person of value.officers) {
    if (!isRecord(person) || !keys(person,['id','name','forceId','baseId','war','leadership','charisma','intelligence','warXp','merit','acted'])) { fail('Invalid officer shape'); continue; }
    if (!id(person.id) || officerIds.has(person.id)) fail('Invalid/duplicate officer ID'); else officerIds.add(person.id);
    if (!text(person.name) || person.forceId !== force.id || !baseIds.has(person.baseId as string)) fail('Officer must be an active-force present officer at a known base');
    if (!value.bases.some(b => isRecord(b) && b.id === person.baseId && b.ownerForceId === force.id && b.corpsId === corps.id)) fail('Officer station must belong to active corps');
    for (const attr of ['war','leadership','charisma','intelligence']) if (!integer(person[attr],0,RULES['engine.scope'].value.maxStat)) fail(`Officer ${String(person.id)} ${attr} outside synthetic 0..100 range`);
    if (!integer(person.warXp,0,RULES['engine.progression'].value.conversionThreshold - 1) || !integer(person.merit,0,RULES['resource.meritCap'].value) || typeof person.acted !== 'boolean') fail('Officer XP/merit/action state out of bounds');
  }
  if (!officerIds.has(force.rulerId as string) || (force.adviserId !== null && !officerIds.has(force.adviserId as string))) fail('Missing ruler/adviser');
  const adviser = value.officers.find(p => isRecord(p) && p.id === force.adviserId);
  if (isRecord(adviser) && !integer(adviser.intelligence,70,RULES['engine.scope'].value.maxStat)) fail('Synthetic adviser intelligence must be 70..100');
  if (!value.bases.some(b => isRecord(b) && b.kind === 'city' && b.ownerForceId === force.id && b.corpsId === corps.id)) fail('AP slice requires at least one controlled city');
  return errors;
}
export function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}
export function syntheticScenario(seed = 311): GameState {
  const officer = (id: string, name: string, war: number): Officer => ({ id, name, forceId:'f1',baseId:'city1',war,leadership:80,charisma:80,intelligence:80,warXp:0,merit:0,acted:false });
  return {
    schemaVersion:1,scope:'synthetic-training-sandbox',ruleset:clone(RULESET),
    date:{year:200,month:12,day:11},turn:0,revision:0,
    force:{id:'f1',rulerId:'o1',adviserId:'o2',techniqueIds:[],techniquePoints:0},
    corps:{id:'c1',forceId:'f1',isFirst:true,actionPoints:40},
    bases:[{id:'city1',name:'演练城（虚构）',kind:'city',ownerForceId:'f1',corpsId:'c1',parentCityId:null,
      troops:10000,morale:40,gold:1000,trainingCompleted:false,
      facilities:{drillGround:'complete',militaryOffice:'complete',completedTalismanPlatforms:0}}],
    officers:[officer('o1','甲（虚构）',100),officer('o2','乙（虚构）',80),officer('o3','丙（虚构）',60)],
    rng:{algorithm:seededRandom.id,seed,draws:0},
  };
}
