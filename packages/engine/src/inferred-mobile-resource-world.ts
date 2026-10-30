/** Single synthetic city/role/position owner with atomic mobile-field and travel xun coordination. */
import { createInferredSharedWorldClock } from './inferred-shared-world-clock.ts';
import { createBoundedSyntheticMobileTimeline, executeBoundedSyntheticMobileTimeline } from './bounded-city-piece-clock.ts';
import { executeInferredTravelWorld } from './inferred-travel-world.ts';
const MAX_COMMANDS = 32, MAX_JSON = 2000000;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, fields: readonly string[]) => Object.keys(v).length === fields.length && fields.every(k => Object.hasOwn(v, k));
const synthetic = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
function freeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
function detach(input: unknown): unknown {
  let nodes = 0, chars = 0; const active = new Set<object>();
  const invalid = (): never => { throw new Error('invalid-data'); };
  function visit(value: unknown, depth: number): unknown {
    if (++nodes > 200000 || depth > 64) return invalid();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isSafeInteger(value) && !Object.is(value, -0) ? value : invalid();
    if (typeof value === 'string') { chars += value.length; return chars <= MAX_JSON ? value : invalid(); }
    if (typeof value !== 'object' || isProxy(value) || active.has(value)) return invalid();
    const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) return invalid();
    const descriptors = Object.getOwnPropertyDescriptors(value), names = Reflect.ownKeys(descriptors);
    if (names.some(name => typeof name !== 'string' || !Object.hasOwn(descriptors[name]!, 'value')
      || (!descriptors[name]!.enumerable && !(array && name === 'length')))) return invalid();
    active.add(value);
    try {
      if (array) {
        const length = descriptors.length!.value as number;
        if (!uint(length, 10000) || names.length !== length + 1) return invalid();
        const out: unknown[] = [];
        for (let i = 0; i < length; i++) { const descriptor = descriptors[String(i)]; if (!descriptor) return invalid(); out.push(visit(descriptor.value, depth + 1)); }
        return out;
      }
      if (names.length > 128) return invalid();
      const out: Record<string, unknown> = {};
      for (const name of names as string[]) Object.defineProperty(out, name, { value: visit(descriptors[name]!.value, depth + 1), enumerable: true });
      return out;
    } finally { active.delete(value); }
  }
  return visit(input, 0);
}

type Command = { id: string; expectedRevision: number; action: Record<string, unknown> };
function commandFrom(v: unknown): Command | undefined {
  if (!record(v) || !exact(v, ['id', 'expectedRevision', 'action']) || !synthetic(v.id)
    || !uint(v.expectedRevision, MAX_COMMANDS - 1) || !record(v.action)) return undefined;
  const a = v.action;
  if(a.kind==='StartForge'&&exact(a,['kind','officerIds'])&&Array.isArray(a.officerIds)&&a.officerIds.length>=1&&a.officerIds.length<=3&&a.officerIds.every(synthetic))return{id:v.id,expectedRevision:v.expectedRevision,action:a};
  if(a.kind==='Train'&&exact(a,['kind','officerIds'])&&Array.isArray(a.officerIds)&&a.officerIds.length>=1&&a.officerIds.length<=3&&a.officerIds.every(synthetic))return{id:v.id,expectedRevision:v.expectedRevision,action:a};
  if (a.kind === 'Move' && exact(a,['kind','actorId','path']) && synthetic(a.actorId) && Array.isArray(a.path) && a.path.length > 0 && a.path.length <= 16 && a.path.every(synthetic)) return {id:v.id,expectedRevision:v.expectedRevision,action:a};
  if (a.kind === 'Deploy' && exact(a,['kind','actorId','troops']) && synthetic(a.actorId) && uint(a.troops,60000) && a.troops > 0) return { id:v.id,expectedRevision:v.expectedRevision,action:a };
  if (a.kind === 'Return' && exact(a,['kind','actorId']) && synthetic(a.actorId)) return { id:v.id,expectedRevision:v.expectedRevision,action:a };
  if (a.kind === 'WorldTick' && exact(a, ['kind', 'draws']) && Array.isArray(a.draws)) return { id: v.id, expectedRevision: v.expectedRevision, action: a };
  if (a.kind === 'Resource' && exact(a, ['kind', 'command']) && record(a.command) && ['Grant', 'Confiscate', 'Transfer'].includes(a.command.kind as string)) return { id: v.id, expectedRevision: v.expectedRevision, action: a };
  if (a.kind === 'City' && exact(a, ['kind', 'command']) && record(a.command)) return { id: v.id, expectedRevision: v.expectedRevision, action: a };
  if (a.kind === 'StartTravel' && exact(a, ['kind', 'travelerId', 'destination']) && typeof a.travelerId === 'string' && typeof a.destination === 'string') return { id: v.id, expectedRevision: v.expectedRevision, action: a };
  if (a.kind === 'Field' && exact(a, ['kind', 'command']) && record(a.command)
    && (a.command.kind === 'Cast' || a.command.kind === 'FireCast')) return { id: v.id, expectedRevision: v.expectedRevision, action: a };
  return undefined;
}
/** Closed city action whitelist, then the old service performs complete field/value checks. */
function cityActors(command: unknown): string[] | undefined {
  if (!record(command)) return undefined;
  if (command.type === 'StartPieceProduction') {
    if (!exact(command, ['type', 'cityId', 'officerIds', 'facilityId', 'equipmentType']) || !Array.isArray(command.officerIds) || !command.officerIds.every(synthetic)) return undefined;
    return command.officerIds as string[];
  }
  if (command.type !== 'ExecuteCityActions' || !exact(command, ['type', 'actions']) || !Array.isArray(command.actions)) return undefined;
  const ids: string[] = [];
  for (const a of command.actions) {
    if (!record(a)) return undefined;
    if (a.type === 'BuyFood' || a.type === 'SellFood') {
      if (!exact(a, ['type', 'cityId', 'officerId', 'foodAmount']) || !synthetic(a.officerId)) return undefined;
      ids.push(a.officerId);
    } else {
      const fields = a.type === 'Patrol' ? ['type', 'cityId', 'officerIds'] : a.type === 'Recruit' ? ['type', 'cityId', 'officerIds', 'facilityId']
        : a.type === 'Produce' ? ['type', 'cityId', 'officerIds', 'facilityId', 'equipmentType'] : null;
      if (!fields || !exact(a, fields) || !Array.isArray(a.officerIds) || !a.officerIds.every(synthetic)) return undefined;
      ids.push(...a.officerIds as string[]);
    }
  }
  return ids;
}

function replay(input: unknown) {
  const enabled=record(input)&&Object.hasOwn(input,'progressConfig'),forgeEnabled=record(input)&&Object.hasOwn(input,'forgeConfig'),foodEnabled=record(input)&&Object.hasOwn(input,'foodConfig'),incomeEnabled=record(input)&&Object.hasOwn(input,'incomeConfig');
  if (!record(input) || !exact(input,['schema','cityName','cityScenario','travelScenario','fieldCells','fieldTemplates','movementMap','movementProfiles','troopsBudget','resourceConfig','transportInitial','commands',...(enabled?['progressConfig']:[]),...(forgeEnabled?['forgeConfig']:[]),...(foodEnabled?['foodConfig']:[]),...(incomeEnabled?['incomeConfig']:[])])
    || input.schema !== 'inferred-mobile-resource-world-v3' || typeof input.cityName !== 'string'
    || !uint(input.troopsBudget,Number.MAX_SAFE_INTEGER) || !Array.isArray(input.commands) || input.commands.length > MAX_COMMANDS) return fail('invalid-dynamic-world');
  const shared = createInferredSharedWorldClock(input.cityName,input.cityScenario,input.travelScenario);
  if (!shared.ok) return fail(`shared-genesis:${shared.reason}`);
  const created = createBoundedSyntheticMobileTimeline(shared.state.cityScenario,input.resourceConfig,input.transportInitial,input.fieldCells,input.fieldTemplates,input.movementMap,input.movementProfiles,enabled?input.progressConfig:undefined,forgeEnabled?input.forgeConfig:undefined,foodEnabled?input.foodConfig:undefined,incomeEnabled?input.incomeConfig:undefined);
  if (!created.ok) return fail(`dynamic-genesis:${created.reason}`);
  const g = created.genesis;
  if (shared.travel.genesis.travelers.some(t => g.officers.some(o => t.id === `traveler-${o.id}`))) return fail('traveler-officer-alias-excluded');
  if (created.current.ledger.troops + created.transports.reduce((n,t)=>n+t.stock.troops,0) !== input.troopsBudget) return fail('initial-troops-allocation-mismatch');
  let city = created, travel = shared.travel;
  const commands:Command[]=[],seen=new Set<string>(),receipts:unknown[]=[];
  const root=()=>({schema:'inferred-mobile-resource-world-v3' as const,cityName:input.cityName as string,cityScenario:g,travelScenario:shared.state.travelScenario,
    fieldCells:created.field.state.cells,fieldTemplates:created.field.state.templates,movementMap:created.field.state.movementMap,movementProfiles:created.field.state.movementProfiles,troopsBudget:input.troopsBudget as number,
    resourceConfig:input.resourceConfig,transportInitial:input.transportInitial,...(enabled?{progressConfig:input.progressConfig}:{}),...(forgeEnabled?{forgeConfig:input.forgeConfig}:{}),...(foodEnabled?{foodConfig:input.foodConfig}:{}),...(incomeEnabled?{incomeConfig:input.incomeConfig}:{}),commands:[...commands]});
  const fits=()=>{detach(root());return JSON.stringify({state:root(),city,travel,receipts}).length<=MAX_JSON-8192;};
  if(!fits())return fail('world-output-budget');
  for(const raw of input.commands){
    const c=commandFrom(raw);if(!c||c.expectedRevision!==commands.length||seen.has(c.id))return fail('invalid-or-duplicate-world-command');
    const a=c.action,innerId=`synthetic-world-${commands.length}`;
    let nextCity=city,nextTravel=travel;
    if(a.kind!=='StartTravel'){
      if(a.kind==='City'&&!cityActors(a.command))return fail('invalid-city-action');
      const action=a.kind==='WorldTick'?{kind:'Tick',draws:a.draws}:a.kind==='Resource'?a.command:a;
      const moved=executeBoundedSyntheticMobileTimeline(city.state,{id:innerId,expectedRevision:city.revision,action});
      if(!moved.ok)return fail(`dynamic-step:${moved.reason}`);
      nextCity=moved;
    }
    if(a.kind==='StartTravel'||a.kind==='WorldTick'){
      const moved=executeInferredTravelWorld(travel,{commandId:innerId,expectedRevision:travel.revision,
        action:a.kind==='WorldTick'?{kind:'AdvanceTravelTurn'}:{kind:'StartTravel',travelerId:a.travelerId,destination:a.destination}});
      if(!moved.ok)return fail(`travel-step:${moved.reason}`);if(moved.duplicate)return fail('unexpected-travel-duplicate');
      nextTravel=moved.state;
    }
    const clock=nextCity.current.clock;
    if(clock.turn!==nextTravel.turn||clock.turn!==nextCity.field.turn||clock.date.year!==nextTravel.date.year||clock.date.month!==nextTravel.date.month||clock.date.day!==nextTravel.date.day)return fail('world-clock-divergence');
    const remaining=Math.max(0,'completionTicksRequired' in nextCity?nextCity.completionTicksRequired??0:0,...nextCity.current.jobs.filter(j=>j.status==='active').map(j=>j.remainingTurns));
    if(MAX_COMMANDS-commands.length-1<remaining||MAX_COMMANDS-nextCity.revision<remaining||MAX_COMMANDS-nextCity.field.revision<remaining)return fail('reserve-shared-completion-slots');
    receipts.push({commandId:c.id,kind:a.kind,turnBefore:city.current.clock.turn,turnAfter:clock.turn,cityRevisionBefore:city.revision,cityRevisionAfter:nextCity.revision,
      fieldRevisionBefore:city.field.revision,fieldRevisionAfter:nextCity.field.revision});
    city=nextCity;travel=nextTravel;commands.push(c);seen.add(c.id);if(!fits())return fail('world-output-budget');
  }
  return freeze({ok:true as const,state:root(),city,travel,receipts,revision:commands.length,clock:city.current.clock,
    troopAllocation:{initialTotal:input.troopsBudget,city:city.current.ledger.troops,field:city.field.roster.reduce((n,a)=>n+(a.role==='deployed'?a.troops:0),0),transports:city.transports.reduce((n,t)=>n+t.stock.troops,0)},
    identityPolicy:'same-id-mobile-role-single-city-field-owner-v3',resourcePolicy:'single-city-ledger-and-loyalty-owner-v1',
    dynamicDeploymentSupported:true as const,movementSupported:true as const,realPeopleWritten:false as const,nativeCampaignEquivalent:false as const});
}
export function readInferredMobileResourceWorld(input:unknown){try{return replay(detach(input));}catch{return fail('invalid-world-data');}}
export function createInferredMobileResourceWorld(cityName:string,cityScenario:unknown,travelScenario:unknown,fieldCells:unknown,fieldTemplates:unknown,movementMap:unknown,movementProfiles:unknown,troopsBudget:number,resourceConfig:unknown,transportInitial:unknown,progressConfig?:unknown,forgeConfig?:unknown,foodConfig?:unknown,incomeConfig?:unknown){
  return readInferredMobileResourceWorld({schema:'inferred-mobile-resource-world-v3',cityName,cityScenario,travelScenario,fieldCells,fieldTemplates,movementMap,movementProfiles,troopsBudget,resourceConfig,transportInitial,...(progressConfig===undefined?{}:{progressConfig}),...(forgeConfig===undefined?{}:{forgeConfig}),...(foodConfig===undefined?{}:{foodConfig}),...(incomeConfig===undefined?{}:{incomeConfig}),commands:[]});
}
export function executeInferredMobileResourceWorld(input:unknown,rawCommand:unknown){
  const current=readInferredMobileResourceWorld(input);if(!current.ok)return current;
  let command:Command|undefined;try{command=commandFrom(detach(rawCommand));}catch{return fail('invalid-world-command');}
  if(!command||command.expectedRevision!==current.revision||current.revision>=MAX_COMMANDS)return fail('invalid-command-or-capacity');
  return readInferredMobileResourceWorld({...current.state,commands:[...current.state.commands,command]});
}
export function saveInferredMobileResourceWorld(input:unknown){const result=readInferredMobileResourceWorld(input);if(!result.ok)return result;const json=JSON.stringify(result.state);return json.length<=MAX_JSON?Object.freeze({ok:true as const,json}):fail('world-save-budget');}
export function loadInferredMobileResourceWorld(json:unknown){if(typeof json!=='string'||json.length>MAX_JSON)return fail('invalid-world-save');try{return readInferredMobileResourceWorld(JSON.parse(json));}catch{return fail('invalid-world-save');}}
