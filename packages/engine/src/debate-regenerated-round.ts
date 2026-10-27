/** Bounded regenerated single-round v2; no session or Closing effects. */
import { parseDebateRoundTransactionInternal, resolveDebateRoundTransactionInternal, debateRoundTransactionFailureInternal,
  DEBATE_ROUND_TRANSACTION_POLICY_V1, DEBATE_ROUND_TRANSACTION_EVIDENCE_V1,
  type DebateRoundTransactionInputV1 } from './debate-round-transaction.ts';
import { parseDebateCheckedPlayInternal, resolveDebateCheckedPlayInternal, getDebateCheckedPlayFailureInternal } from './debate-checked-play.ts';
import { parseDebateRethinkActionInternal, resolveDebateRethinkActionInternal, getDebateRethinkActionFailureInternal } from './debate-rethink-action.ts';
import { resolveDebateTurnStartInternal, debateTurnStartFailureInternal } from './debate-turn-start.ts';
import { resolveDebateRoundTransitionInternal, debateRoundTransitionFailureInternal } from './debate-round-transition.ts';
import { resolveDebateAngerTransitionInternal, debateAngerTransitionFailureInternal } from './debate-anger-transition.ts';
import { fillRegeneratedDebateHandInternal, type RegeneratedDebateFillReceipt,
  type RegeneratedDebateFillFailure } from './debate-regenerated-fill-internal.ts';
import { type DebateHandFillInputV1 } from './debate-hand-fill.ts';
import { type DebateDeckGenerateRawDrawV1, type DebateDeckGenerateRhetoricCardCodeV1 } from './debate-deck-generate.ts';
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Pair<T> = [T,T];
type Team = 0 | 1;
type Phase = 'rethink' | 'turnStart';
type Pool = DebateDeckGenerateRhetoricCardCodeV1[];
type GenerateDraw = DebateDeckGenerateRawDrawV1;
type Packet = GenerateDraw[] | null;
const PROFILE = 'debate-regenerated-round-reference-v2' as const;
const MAX_INPUT_NODES = 100000;
const MAX_INPUT_DEPTH = 64;
const MAX_INPUT_ARRAY_LENGTH = 4017;
const MAX_CANONICAL_BYTES = 2097152;
const MAX_OUTPUT_NODES = 4000000;
const MAX_OUTPUT_BYTES = 67108864;
const POLICY = {
  id: 'debate-regenerated-round-bounded-policy-v2', profile: PROFILE,
  admission: 'round-v1-data-domain-without-v1-metadata-plus-explicit-ordered-pools-and-stage-generation-packets',
  sharedBodies: ['checked-play','rethink-action','turn-start','round-transition','anger-transition','round-transaction'],
  bodyMetadata: 'metadata-free-engineering-bodies-under-this-v2-policy-not-v1-regeneration-claims',
  originalV1PublicContract: 'retained-current-deck-only; runtime-compatibility-not-verified',
  generation: { poolCodes: [10,14], orderedUniquePoolLength: [0,5], packetMaxDraws: 4017,
    trigger: 'vacant-source-slot-and-cursor-equals-eighteen-only', perTeamMaximum: 1, roundMaximum: 2,
    replace: 'real-returned-entire-deck-and-ordered-pool-reset-cursor-after-generation-success',
    fillCompletion: 'exactly-once-after-all-source-vacancies-filled', unusedPackets: 'reject',
    noPreGeneration: true, noGlobalRng: true },
  sequence: ['first-actor-rethink','other-actor-rethink','ordinary-attack','two-anger-passes','turn-end-topic','team-zero-fill','team-one-fill'],
  terminal: 'classify-and-stop-before-Closing; no-transition-fill-generation-or-additional-timer-decrement',
  atomic: 'late-failure-publishes-no-state-or-partial-receipts',
  audit: 'complete-generator-swaps-deck-pool-provenance-completion-and-nested-domain-bodies',
  budgets: { inputNodes: MAX_INPUT_NODES, inputDepth: MAX_INPUT_DEPTH, inputArray: MAX_INPUT_ARRAY_LENGTH,
    inputCanonicalBytes: MAX_CANONICAL_BYTES, outputNodes: MAX_OUTPUT_NODES, outputDepth: 128,
    outputCanonicalBytes: MAX_OUTPUT_BYTES, events: 8050, meaning: 'conservative-bounds-not-simultaneous-attainability' },
  boundary: { P078AndDependencies: 'excluded', Closing: 'excluded', oldNineSessionFiles: 'unchanged',
    personBooksHooksTutorialGlobalRngLongSessionAndPersistence: 'excluded', nativeEquivalent: false, nativeGapTopics:43, snapshots:45 },
} as const;
const EVIDENCE = { sourceIdentity: 'modern-reference-plus-explicit-engineering-composition',
  base: DEBATE_ROUND_TRANSACTION_EVIDENCE_V1, nativeEquivalent: false,
  generator: 'unchanged-evaluateDebateDeckGenerate', completion: 'unchanged-completeDebateHandFill-once' } as const;
type RoundData = Omit<DebateRoundTransactionInputV1,'schemaVersion'|'profile'|'policies'>;
type Input = { schemaVersion: 2; profile: typeof PROFILE; policies: typeof POLICY;
  round: RoundData; rhetoricCards: Pair<Pool>; generationPackets: {rethink:Pair<Packet>;turnStart:Pair<Packet>} };
type Admitted = Omit<Input,'round'> & {round: ReturnType<typeof parseDebateRoundTransactionInternal>};
type ComponentFailure = NonNullable<ReturnType<typeof debateRoundTransactionFailureInternal>
  | ReturnType<typeof getDebateCheckedPlayFailureInternal> | ReturnType<typeof getDebateRethinkActionFailureInternal>
  | ReturnType<typeof debateTurnStartFailureInternal> | ReturnType<typeof debateRoundTransitionFailureInternal>
  | ReturnType<typeof debateAngerTransitionFailureInternal>>;
type Reason = 'unsupported-runtime'|'input-limit'|'output-limit'|'malformed-data'|'unknown-field'|'unsupported-profile'|'unsupported-policy'
  |'invalid-pool'|'invalid-generation-packet'|'generation-limit'|'unused-generation-packet';
type Failure = {ok:false;reason:Reason} | {ok:false;reason:'component-failure';stage:string;detail:ComponentFailure|RegeneratedDebateFillFailure};
class Invalid extends Error {
  readonly result: Failure;
  constructor(result: Failure) {super(result.reason);this.result=result;}
}
function fail(reason: Reason): never {throw new Invalid({ok:false,reason});}
function component(stage:string,detail:ComponentFailure|RegeneratedDebateFillFailure):never {throw new Invalid({ok:false,reason:'component-failure',stage,detail});}
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
/** Called only for detached JSON data or trusted internal constants. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const record = value as Record<string, unknown>;
  return '{' + Object.keys(record).sort().map(key => JSON.stringify(key) + ':' + canonical(record[key])).join(',') + '}';
}
function utf8Bytes(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return bytes;
}
function getProxyDetector(): ((value: unknown) => boolean) | null {
  try {
    const runtime = globalThis as {
      process?: { getBuiltinModule?: (id: string) => { types?: { isProxy?: (value: unknown) => boolean } } };
    };
    if (typeof runtime.process?.getBuiltinModule !== 'function') return null;
    const detector = runtime.process.getBuiltinModule('node:util').types?.isProxy;
    return typeof detector === 'function' ? detector : null;
  } catch {
    return null;
  }
}
const proxyDetector = getProxyDetector();

/**
 * Reject proxies before reflection; read only data descriptors, not getters.
 * Reject symbols, hidden/decorated fields, nonplain prototypes, sparse arrays,
 * cycles, nonintegral/unsafe numbers, negative zero, and non-JSON values.
 * Repeated acyclic references are independently copied and budgeted each time.
 */
function detach(value: unknown): unknown {
  if (!proxyDetector) fail('unsupported-runtime');
  let nodes = 0, bytes = 0;
  const active = new Set<object>();
  function visit(current: unknown, depth: number): unknown {
    if (++nodes > MAX_INPUT_NODES || depth > MAX_INPUT_DEPTH) fail('input-limit');
    if (current === null || typeof current === 'boolean') return current;
    if (typeof current === 'string') {
      if (current.length > MAX_CANONICAL_BYTES) fail('input-limit');
      bytes += utf8Bytes(current);
      if (bytes > MAX_CANONICAL_BYTES) fail('input-limit');
      return current;
    }
    if (typeof current === 'number') {
      if (!Number.isSafeInteger(current) || Object.is(current, -0)) fail('malformed-data');
      return current;
    }
    if (typeof current !== 'object' || proxyDetector!(current) || active.has(current)) fail('malformed-data');
    const isArray = Array.isArray(current);
    const prototype = Object.getPrototypeOf(current);
    if (prototype !== (isArray ? Array.prototype : Object.prototype) && !(prototype === null && !isArray)) fail('malformed-data');
    const keys = Reflect.ownKeys(current);
    if (keys.length > MAX_INPUT_NODES) fail('input-limit');
    const descriptors = Object.getOwnPropertyDescriptors(current);
    for (const key of keys) {
      if (typeof key !== 'string') fail('malformed-data');
      const descriptor = descriptors[key]!;
      if (!Object.hasOwn(descriptor, 'value') || (!descriptor.enumerable && !(isArray && key === 'length'))) fail('malformed-data');
      if (key.length > MAX_CANONICAL_BYTES) fail('input-limit');
      bytes += utf8Bytes(key);
      if (bytes > MAX_CANONICAL_BYTES) fail('input-limit');
    }
    active.add(current);
    try {
      if (isArray) {
        const length = descriptors.length!.value as number;
        if (length > MAX_INPUT_ARRAY_LENGTH) fail('input-limit');
        if (keys.length !== length + 1) fail('malformed-data');
        const detached: unknown[] = [];
        for (let index = 0; index < length; index++) {
          const descriptor = descriptors[String(index)];
          if (!descriptor) fail('malformed-data');
          detached.push(visit(descriptor.value, depth + 1));
        }
        return detached;
      }
      const detached: Record<string, unknown> = {};
      for (const key of keys as string[]) {
        Object.defineProperty(detached, key, {
          value: visit(descriptors[key]!.value, depth + 1),
          enumerable: true,
          configurable: true,
          writable: true,
        });
      }
      return detached;
    } finally {
      active.delete(current);
    }
  }
  const result = visit(value, 0);
  if (utf8Bytes(canonical(result)) > MAX_CANONICAL_BYTES) fail('input-limit');
  return result;
}
function object(value:unknown,keys:readonly string[]):Record<string,unknown> {
  if(value===null||typeof value!=='object'||Array.isArray(value))fail('malformed-data');
  const r=value as Record<string,unknown>;
  if(Object.keys(r).some(k=>!keys.includes(k)))fail('unknown-field');
  if(keys.some(k=>!Object.hasOwn(r,k)))fail('malformed-data');
  return r;
}
function pair(value:unknown):Pair<unknown> {
  if(!Array.isArray(value)||value.length!==2)fail('malformed-data');
  return [value[0],value[1]];
}
function pool(value:unknown):Pool {
  if(!Array.isArray(value)||value.length>5)fail('invalid-pool');
  const result:Pool=[];
  for(const card of value){
    if(typeof card!=='number'||card<10||card>14||result.includes(card as DebateDeckGenerateRhetoricCardCodeV1))fail('invalid-pool');
    result.push(card as DebateDeckGenerateRhetoricCardCodeV1);
  }
  return result;
}
function packet(value:unknown):Packet {
  if(value===null)return null;
  if(!Array.isArray(value)||value.length>4017)fail('invalid-generation-packet');
  return value.map<GenerateDraw>(item=>{
    const d=object(item,['role','bound','value']);
    if(typeof d.bound!=='number'||typeof d.value!=='number'||d.value<0||d.value>=d.bound)fail('invalid-generation-packet');
    if((d.role==='debate-deck-small-topic'||d.role==='debate-deck-medium-topic'||d.role==='debate-deck-large-topic')&&d.bound===3)
      return {role:d.role,bound:3,value:d.value};
    if(d.role==='debate-deck-rhetoric-swap'&&d.bound>=1&&d.bound<=5)
      return {role:d.role,bound:d.bound as 1|2|3|4|5,value:d.value};
    if(d.role==='debate-deck-tail-fallback'&&d.bound===9)return {role:d.role,bound:9,value:d.value};
    if(d.role==='debate-deck-table-swap'&&d.bound===18)return {role:d.role,bound:18,value:d.value};
    return fail('invalid-generation-packet');
  });
}
function parse(value:unknown):Admitted {
  const r=object(detach(value),['schemaVersion','profile','policies','round','rhetoricCards','generationPackets']);
  if(r.schemaVersion!==2||r.profile!==PROFILE)fail('unsupported-profile');
  if(canonical(r.policies)!==canonical(POLICY))fail('unsupported-policy');
  const p=pair(r.rhetoricCards),pools:Pair<Pool>=[pool(p[0]),pool(p[1])];
  const g=object(r.generationPackets,['rethink','turnStart']),rr=pair(g.rethink),tt=pair(g.turnStart);
  const generationPackets={rethink:[packet(rr[0]),packet(rr[1])] as Pair<Packet>,turnStart:[packet(tt[0]),packet(tt[1])] as Pair<Packet>};
  for(const team of [0,1] as const)if(generationPackets.rethink[team]!==null&&generationPackets.turnStart[team]!==null)fail('generation-limit');
  const rd=object(r.round,['genericOnly','isTutorial','winner','firstTeam','currentTopic','characters','combo','crumbledLevels','plans','attackRawDraws','angerPassDraws','topicRawDraws','fillRawDraws','terminal']);
  const round=parseDebateRoundTransactionInternal({...rd,schemaVersion:1,profile:'debate-round-transaction-reference-v1',policies:DEBATE_ROUND_TRANSACTION_POLICY_V1});
  return {schemaVersion:2,profile:PROFILE,policies:POLICY,round,rhetoricCards:pools,generationPackets};
}
type AuditEvent = {
  index:number; stage:'rethink-generation'|'rethink-repair'|'rethink-calm'|'ordinary-attack'|'anger-combo'|'turn-end-topic'|'turn-start-generation'|'turn-start-repair';
  team:Team|null; localIndex:number; payload:unknown;
};
function resolve(input:Admitted) {
  const pools:Pair<Pool>=[input.rhetoricCards[0].slice(),input.rhetoricCards[1].slice()];
  const beforePools:Pair<Pool>=[pools[0].slice(),pools[1].slice()];
  let afterPlayPools:Pair<Pool>=[pools[0].slice(),pools[1].slice()];
  const called={rethink:[false,false],turnStart:[false,false]};
  const generationCounts:Pair<number>=[0,0];
  const fill=(source:DebateHandFillInputV1,team:Team,phase:Phase)=>{
    if(called[phase][team])fail('generation-limit');
    called[phase][team]=true;
    const result=fillRegeneratedDebateHandInternal({playableSlots:source.playableSlots,cardTape:source.cardTape,deckCursor:source.deckCursor,
      rhetoricCards:pools[team],generationRawDraws:input.generationPackets[phase][team],rawDraws:source.rawDraws});
    if(!result.ok)component(phase+'-fill-team-'+team,result);
    if(result.receipt.generation!==null){generationCounts[team]++;if(generationCounts[team]>1)fail('generation-limit');}
    pools[team]=result.rhetoricCards.slice();
    return result;
  };
  const body=resolveDebateRoundTransactionInternal(input.round,{
    play:value=>{
      const result=resolveDebateCheckedPlayInternal(parseDebateCheckedPlayInternal(value),(action,team)=>
        resolveDebateRethinkActionInternal(parseDebateRethinkActionInternal(action),source=>fill(source,team,'rethink')));
      afterPlayPools=[pools[0].slice(),pools[1].slice()];
      return result;
    },
    angerTransition:value=>resolveDebateAngerTransitionInternal(value,round=>
      resolveDebateRoundTransitionInternal(round,start=>
        resolveDebateTurnStartInternal(start,(source,team)=>fill(source,team,'turnStart')))),
  });
  // Terminal/unvisited phases must not silently discard supplied generation.
  for(const phase of ['rethink','turnStart'] as const)for(const team of [0,1] as const)
    if(!called[phase][team]&&input.generationPackets[phase][team]!==null)fail('unused-generation-packet');
  const events:AuditEvent[]=[];
  const add=(stage:AuditEvent['stage'],team:Team|null,localIndex:number,payload:unknown)=>events.push({index:events.length,stage,team,localIndex,payload});
  const generationEvents=(receipt:RegeneratedDebateFillReceipt,phase:Phase,team:Team)=>{
    if(receipt.generation!==null)for(const [localIndex,draw] of receipt.generation.generation.consumedDraws.entries())
      add(phase==='rethink'?'rethink-generation':'turn-start-generation',team,localIndex,draw);
  };
  for(const selection of body.receipt.play.receipt.selections){
    const rethink=selection.rethink;if(rethink===null)continue;
    generationEvents(rethink.receipt.fill,'rethink',selection.team);
    for(const event of rethink.receipt.randomEvents)
      add(event.kind==='integer-draw'?'rethink-repair':'rethink-calm',selection.team,event.eventIndex,event);
  }
  if(body.receipt.attack.receipt.consumedDraws===1)add('ordinary-attack',null,0,input.round.attackRawDraws[0]!);
  const anger=body.receipt.angerTransition;
  if(anger!==null){
    for(const use of anger.receipt.consumedDraws)if(use.stage==='anger-combo')add('anger-combo',use.teamIndex,use.flatDrawIndex,use);
    const transition=anger.receipt.transition;
    if(transition!==null){
      for(const [index,draw] of transition.receipt.sophistry.consumedDraws.entries())add('turn-end-topic',null,index,draw);
      for(const team of transition.receipt.turnStart.teams){
        generationEvents(team.fill,'turnStart',team.teamIndex);
        for(const [index,draw] of team.fill.consumedDraws.entries())add('turn-start-repair',team.teamIndex,index,draw);
      }
    }
  }
  if(events.length>8050)fail('output-limit');
  const finalPools:Pair<Pool>=[pools[0].slice(),pools[1].slice()];
  const withPools=(state:typeof body.state,ordered:Pair<Pool>)=>({...state,characters:[
    {...state.characters[0],rhetoricCards:ordered[0].slice()},
    {...state.characters[1],rhetoricCards:ordered[1].slice()},
  ] as const});
  return {ok:true as const,schemaVersion:2 as const,profile:PROFILE,policy:POLICY,evidence:EVIDENCE,
    state:withPools(body.state,finalPools),nextCheckpoint:body.nextCheckpoint,
    receipt:{...body.receipt,before:withPools(body.receipt.before,beforePools),afterPlay:withPools(body.receipt.afterPlay,afterPlayPools),
      afterAttack:withPools(body.receipt.afterAttack,afterPlayPools),after:withPools(body.receipt.after,finalPools),
      nonGenerationEvents:body.receipt.events,nonGenerationEventCount:body.receipt.eventCount,events,eventCount:events.length,generationCounts,
      phaseVisited:called,completeGeneratorAuditsRetained:true as const},
  };
}
function enforceOutputBudget(value:unknown):void {
  let nodes=0;
  function visit(v:unknown,depth:number):void {
    if(++nodes>MAX_OUTPUT_NODES||depth>128)fail('output-limit');
    if(v!==null&&typeof v==='object')for(const child of Object.values(v))visit(child,depth+1);
  }
  visit(value,0);
  if(utf8Bytes(canonical(value))>MAX_OUTPUT_BYTES)fail('output-limit');
}
export type DebateRegeneratedRoundInputV2=Frozen<Input>;
export type DebateRegeneratedRoundSuccessV2=Frozen<ReturnType<typeof resolve>>;
export type DebateRegeneratedRoundFailureV2=Frozen<Failure>;
export type DebateRegeneratedRoundResultV2=DebateRegeneratedRoundSuccessV2|DebateRegeneratedRoundFailureV2;
export const DEBATE_REGENERATED_ROUND_POLICY_V2=freeze(POLICY);
export const DEBATE_REGENERATED_ROUND_EVIDENCE_V2=freeze(EVIDENCE);
/** Pure, full-admission-before-domain-work transaction; no caller callbacks. */
export function evaluateDebateRegeneratedRound(input:unknown):DebateRegeneratedRoundResultV2 {
  try {const result=resolve(parse(input));enforceOutputBudget(result);return freeze(result);}
  catch(error){
    if(error instanceof Invalid)return freeze(error.result);
    const stages=[
      ['round',debateRoundTransactionFailureInternal(error)],['play',getDebateCheckedPlayFailureInternal(error)],
      ['rethink',getDebateRethinkActionFailureInternal(error)],['turn-start',debateTurnStartFailureInternal(error)],
      ['round-transition',debateRoundTransitionFailureInternal(error)],['anger-transition',debateAngerTransitionFailureInternal(error)],
    ] as const;
    for(const [stage,detail]of stages)if(detail!==null)return freeze({ok:false,reason:'component-failure',stage,detail});
    return freeze({ok:false,reason:'malformed-data'});
  }
}
