/** Fixed completed synthetic sites only. Outer owner supplies current facts and commits once per Tick. */
import { projectInferredGatePortRepair } from '../inferred-combat-requests.ts';
import { detachBoundedCityData } from './bounded-city-json.ts';

export type SyntheticGatePortSite = Readonly<{
  id: string; kind: 'gate' | 'port'; ownerId: string; cellId: string;
  capacity: number; durability: number; governorActorId: string;
}>;
export type SyntheticGatePortGovernor = Readonly<{
  id: string; ownerId: string; role: 'resident' | 'deployed'; available: boolean; away: boolean; politics: number;
}>;
export type SyntheticGatePortRepairContext = Readonly<{
  profile: 'inferred-fixed-home-gate-port-repair-v1'; ownerId: string; turn: number;
  homeCellId: string; cellIds: readonly string[];
  sites: readonly SyntheticGatePortSite[]; governors: readonly SyntheticGatePortGovernor[];
}>;
const fail = (reason: string) => Object.freeze({ok: false as const, reason});
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, names: readonly string[]) => Object.keys(v).length === names.length && names.every(n => Object.hasOwn(v, n));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
function freeze<T>(v: T): Readonly<T> {
  if (v !== null && typeof v === 'object') { for (const value of Object.values(v)) freeze(value); Object.freeze(v); }
  return v;
}
function checked(raw: unknown) {
  if (!record(raw) || !exact(raw, ['profile','ownerId','turn','homeCellId','cellIds','sites','governors'])
    || raw.profile !== 'inferred-fixed-home-gate-port-repair-v1' || !id(raw.ownerId) || !uint(raw.turn, 0x7fffffff)
    || !id(raw.homeCellId) || !Array.isArray(raw.cellIds) || raw.cellIds.length < 1 || raw.cellIds.length > 512
    || !raw.cellIds.every(id) || new Set(raw.cellIds).size !== raw.cellIds.length || !raw.cellIds.includes(raw.homeCellId)
    || raw.cellIds.includes(raw.ownerId) || !Array.isArray(raw.sites) || raw.sites.length < 1 || raw.sites.length > 8
    || !Array.isArray(raw.governors) || raw.governors.length < 1 || raw.governors.length > 32) return fail('invalid-repair-context');
  const governors: SyntheticGatePortGovernor[] = [];
  for (const row of raw.governors) {
    if (!record(row) || !exact(row, ['id','ownerId','role','available','away','politics']) || !id(row.id)
      || row.id === raw.ownerId || raw.cellIds.includes(row.id) || governors.some(g => g.id === row.id)
      || row.ownerId !== raw.ownerId || (row.role !== 'resident' && row.role !== 'deployed')
      || typeof row.available !== 'boolean' || typeof row.away !== 'boolean' || !uint(row.politics, 100)) return fail('invalid-home-governor');
    governors.push({id:row.id,ownerId:row.ownerId as string,role:row.role,available:row.available,away:row.away,politics:row.politics});
  }
  const sites: SyntheticGatePortSite[] = [];
  for (const row of raw.sites) {
    if (!record(row) || !exact(row, ['id','kind','ownerId','cellId','capacity','durability','governorActorId'])
      || !id(row.id) || row.id === raw.ownerId || raw.cellIds.includes(row.id) || governors.some(g => g.id === row.id)
      || sites.some(s => s.id === row.id) || (row.kind !== 'gate' && row.kind !== 'port') || row.ownerId !== raw.ownerId
      || row.cellId !== raw.homeCellId || !uint(row.capacity, 1000000) || row.capacity === 0
      || !uint(row.durability, row.capacity) || row.durability === 0 || !id(row.governorActorId)
      || !governors.some(g => g.id === row.governorActorId)) return fail('invalid-fixed-home-site');
    sites.push({id:row.id,kind:row.kind,ownerId:row.ownerId as string,cellId:row.cellId as string,
      capacity:row.capacity,durability:row.durability,governorActorId:row.governorActorId});
  }
  sites.sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return {ok:true as const,turn:raw.turn,sites,governors};
}
/** Pure config/current-domain validation; does not simulate a repair. */
export function validateSyntheticGatePortRepairContext(raw: unknown) {
  try {
    const detached = detachBoundedCityData(raw);
    if (!detached.ok) return fail('invalid-repair-data');
    const context = checked(detached.value);
    return context.ok ? Object.freeze({ok:true as const}) : context;
  } catch { return fail('invalid-repair-data'); }
}
/** No scheduler, AP/gold writer, new entity, allegiance change, damage or finalizer. */
export function projectSyntheticGatePortRepairs(raw: unknown) {
  try {
    const detached = detachBoundedCityData(raw);
    if (!detached.ok) return fail('invalid-repair-data');
    const context = checked(detached.value);
    if (!context.ok) return context;
    const sitePatches: {id:string;before:number;after:number;amount:number}[] = [];
    const receipts: {siteId:string;governorActorId:string;politics:number;governorPresent:boolean;
      status:'repaired'|'full-skipped'|'governor-absent-skipped';requestedRepair:number;creditedRepair:number;before:number;after:number;sourcePolicy:string}[] = [];
    for (const site of context.sites) {
      const governor = context.governors.find(g => g.id === site.governorActorId)!;
      const governorPresent = governor.role === 'resident' && governor.available && !governor.away;
      const request = projectInferredGatePortRepair(governor.politics, governorPresent);
      if (!request.ok) return fail('repair-request-rejected');
      const amount = Math.min(request.requestedRepair, site.capacity - site.durability);
      const after = site.durability + amount;
      sitePatches.push({id:site.id,before:site.durability,after,amount});
      receipts.push({siteId:site.id,governorActorId:governor.id,politics:governor.politics,governorPresent,
        status:!governorPresent?'governor-absent-skipped':amount===0?'full-skipped':'repaired',
        requestedRepair:request.requestedRepair,creditedRepair:amount,before:site.durability,after,sourcePolicy:request.policyId});
    }
    return freeze({ok:true as const,turn:context.turn,sitePatches,receipts,
      policy:'inferred-fixed-home-gate-port-repair-v1' as const,
      governorPolicy:'same-home-resident-available-not-away-proxy-v1' as const,
      schedulerApplied:false as const,resourcesDebited:false as const,peopleModified:false as const,nativeEquivalent:false as const});
  } catch { return fail('invalid-repair-data'); }
}
