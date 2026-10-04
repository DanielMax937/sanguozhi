import { advanceDate, calculateApRecovery, calculateTraining, moraleCap } from './calculations.ts';
import { canonical, clone, evidence, RULES } from './rules.ts';
import { deepFreeze, isRecord, seededRandom, validateState } from './state.ts';
import type { Command, CommandResult, EngineAdapters, GameState, Preview, RuleEvidence, RuleUse, Session, TrainingGate } from './types.ts';

export const conservativeTrainingGate: TrainingGate = {
  id:'conservative-training-v1',
  evidence:clone(RULES['engine.gate']) as RuleEvidence,
  evaluate(state,base,officers) {
    const reasons: string[] = [];
    if (base.ownerForceId !== state.force.id || base.corpsId !== state.corps.id) reasons.push('Base is not controlled by the active corps');
    if (base.troops === 0) reasons.push('Conservative gate: base needs troops');
    if (base.morale >= moraleCap(state)) reasons.push('Conservative gate: morale is already at cap');
    if (base.trainingCompleted) reasons.push('Base has already trained this turn');
    for (const person of officers) {
      if (person.forceId !== state.force.id || person.baseId !== base.id) reasons.push(`Officer ${person.id} is not present at this owned base`);
      if (person.acted) reasons.push(`Officer ${person.id} has already acted`);
    }
    return reasons;
  },
};
export const DEFAULT_ADAPTERS: EngineAdapters = deepFreeze({ gate:conservativeTrainingGate, random:seededRandom });

function commandErrors(command: unknown): string[] {
  if (!isRecord(command)) return ['Command must be a JSON object'];
  if (command.type === 'EndTurn') return Object.keys(command).length === 1 ? [] : ['Unexpected EndTurn fields'];
  if (command.type !== 'Train') return ['Unsupported command type'];
  if (canonical(Object.keys(command).sort()) !== canonical(['baseId','officerIds','type'])) return ['Unexpected Train fields'];
  if (typeof command.baseId !== 'string' || !Array.isArray(command.officerIds) || command.officerIds.some(id => typeof id !== 'string')) return ['Train needs baseId and officerIds'];
  const f = RULES['train.formula'].value;
  if (command.officerIds.length < f.minOfficers || command.officerIds.length > f.maxOfficers) return ['Training requires 1..3 officers'];
  if (new Set(command.officerIds).size !== command.officerIds.length) return ['Duplicate officers are not allowed'];
  return [];
}
const rejected = (reasons: string[], uses: RuleUse[]): Preview => ({ok:false,reasons,calculation:{},evidence:uses,rngDraws:0});

/** Shared calculation path for UI/headless preview and execution. No caller state mutation or RNG calls. */
export function previewCommand(state: GameState, command: Command, adapters: EngineAdapters = DEFAULT_ADAPTERS): Preview {
  const baseEvidence = [evidence('engine.scope','Validate the bounded synthetic state before any mutation.'), evidence('engine.version','PC-PK1.1/original profile only.')];
  const stateErrors = validateState(state,adapters);
  if (stateErrors.length) return rejected(stateErrors,baseEvidence);
  const errors = commandErrors(command);
  if (errors.length) return rejected(errors,[...baseEvidence,evidence('engine.gate','Command shape/selection invalid; no mutation.')]);
  if (state.revision >= Number.MAX_SAFE_INTEGER - 1) return rejected(['Revision limit reached'],baseEvidence);
  if (command.type === 'EndTurn') {
    const calendar = advanceDate(state.date);
    if (calendar.next.year > RULES['engine.scope'].value.maxYear || state.turn >= Number.MAX_SAFE_INTEGER - 1) return rejected(['Synthetic calendar/turn limit reached'],baseEvidence);
    const ap = calculateApRecovery(state);
    return {ok:true,reasons:[],calculation:{ap,calendar},rngDraws:0,evidence:[...baseEvidence,
      evidence('engine.apScope','One first corps; present unmodified synthetic abilities; no deployed or cross-corps state.'),
      evidence('ap.recovery',`core=${ap.coreRecovery}, talisman=${ap.talismanBonus}, computed=${ap.recovery}, credited=${ap.actualRecovery}`),
      evidence('engine.calendar',`Advance ${state.date.year}/${state.date.month}/${state.date.day} to ${calendar.next.year}/${calendar.next.month}/${calendar.next.day}`),
      evidence('turn.reset','Reset owned-base training flags before next usable turn.'),
      evidence('turn.schedulerOpen','Exact original reset order/caller remains open.'),
      evidence('engine.scheduler','Only calendar, this corps AP, owned-base training flags and synthetic officer action flags.'),
      evidence('engine.rng','No core random draws in this bounded EndTurn adapter.'),
    ]};
  }
  const base = state.bases.find(b => b.id === command.baseId);
  const officers = command.officerIds.map(id => state.officers.find(p => p.id === id));
  if (!base || officers.some(p => p === undefined)) return rejected(['Unknown base/officer'],[...baseEvidence,evidence('engine.gate','Unknown identifier')]);
  const selected = officers.filter(p => p !== undefined);
  const training = calculateTraining(state,base,selected);
  const reasons: string[] = [];
  const gateEvidence = clone(adapters.gate.evidence);
  try {
    const snapshot = deepFreeze(clone(state));
    const gateBase = snapshot.bases.find(b => b.id === base.id)!;
    const gateOfficers = command.officerIds.map(id => snapshot.officers.find(p => p.id === id)!);
    const result = adapters.gate.evaluate(snapshot,gateBase,gateOfficers);
    if (!Array.isArray(result) || result.some(s => typeof s !== 'string')) reasons.push('Eligibility adapter returned an invalid result');
    else reasons.push(...result);
  } catch {
    reasons.push('Eligibility adapter failed; command rejected atomically');
  }
  // Once-per-turn, selection ownership, resource and progression safety cannot be waived by a custom gate.
  if (base.trainingCompleted && !reasons.includes('Base has already trained this turn')) reasons.push('Base has already trained this turn');
  if (base.ownerForceId !== state.force.id || base.corpsId !== state.corps.id) reasons.push('Training ownership safety check failed');
  if (selected.some(p => p.forceId !== state.force.id || p.baseId !== base.id || p.acted)) reasons.push('Training officer safety check failed');
  if (state.corps.actionPoints < training.apCost) reasons.push('Insufficient corps AP');
  if (selected.some(p => p.warXp + RULES['train.rewards'].value.warXp >= RULES['engine.progression'].value.conversionThreshold)) reasons.push('Unsupported progression: training would reach WAR XP 100; stat growth is outside this slice');
  return {ok:reasons.length === 0,reasons,calculation:{training},rngDraws:0,evidence:[...baseEvidence,
    {evidence:gateEvidence,detail:`Eligibility adapter ${adapters.gate.id}; conservative extra gates are explicit fallback.`},
    evidence('train.gateOpen','005C4100/005B8320 full bodies are not reproduced.'),
    evidence('train.once','One training command per base per turn.'),
    evidence('train.formula',`sum=${training.warSum}, max=${training.warMax}, denominator=${training.denominator}, baseGain=${training.baseGain}`),
    evidence('train.drill',`complete-city drill applied=${training.drillApplied}; gainBeforeCap=${training.gainBeforeCap}`),
    evidence('train.moraleCap',`cap=${training.moraleCap}; actualGain=${training.actualGain}`),
    evidence('train.ap',`AP=${training.apCost}; gold=0`),
    evidence('train.tp',`computed award=${training.techniquePointsBeforeCap}; based on actual morale gain`),
    evidence('resource.tpCap',`credited TP=${Math.min(training.techniquePointsBeforeCap,RULES['resource.tpCap'].value - state.force.techniquePoints)}`),
    evidence('train.rewards','Each selected officer: WAR XP +2, merit +50 subject to merit cap, acted=true; base trained=true.'),
    evidence('resource.meritCap','Merit clamps at 60000; before/after snapshots expose credited amounts.'),
    evidence('engine.progression','Reject XP conversion threshold before mutation; synthetic scenario stays below it.'),
    evidence('engine.rng','Training calculation and modeled core side effects draw zero from the engineering RNG.'),
    evidence('engine.presentationOmitted','Original speaker-selection RNG is intentionally omitted; full original/global RNG-stream equivalence is not claimed.'),
  ]};
}

export function executeCommand(state: GameState, command: Command, adapters: EngineAdapters = DEFAULT_ADAPTERS): CommandResult {
  const preview = previewCommand(state,command,adapters);
  if (!preview.ok) return {...preview,state};
  const next = clone(state);
  if (command.type === 'Train') {
    const calc = preview.calculation.training!;
    const base = next.bases.find(b => b.id === command.baseId)!;
    base.morale += calc.actualGain;
    base.trainingCompleted = true;
    next.corps.actionPoints -= calc.apCost;
    next.force.techniquePoints = Math.min(RULES['resource.tpCap'].value,next.force.techniquePoints + calc.techniquePointsBeforeCap);
    for (const id of command.officerIds) {
      const person = next.officers.find(p => p.id === id)!;
      person.warXp += RULES['train.rewards'].value.warXp;
      person.merit = Math.min(RULES['resource.meritCap'].value,person.merit + RULES['train.rewards'].value.merit);
      person.acted = true;
    }
  } else {
    next.date = clone(preview.calculation.calendar!.next);
    next.turn += 1;
    next.corps.actionPoints += preview.calculation.ap!.actualRecovery;
    for (const base of next.bases) if (base.ownerForceId === next.force.id && base.corpsId === next.corps.id) base.trainingCompleted = false;
    for (const person of next.officers) person.acted = false;
  }
  next.revision += 1;
  return {...preview,state:next};
}

export function createSession(state: GameState, adapters: EngineAdapters = DEFAULT_ADAPTERS): Session {
  const errors = validateState(state,adapters);
  if (errors.length) throw new Error(errors.join('; '));
  return {saveVersion:1,engineVersion:'training-kernel-v1',initialState:clone(state),state:clone(state),trace:[]};
}
/** Rejections return a diagnostic but do not enter the accepted command log or change the session. */
export function dispatch(session: Session, command: Command, adapters: EngineAdapters = DEFAULT_ADAPTERS): {session:Session; result:CommandResult} {
  const result = executeCommand(session.state,command,adapters);
  if (!result.ok) return {session,result};
  const {state:after,...preview} = result;
  const entry = {...preview,command:clone(command),before:clone(session.state),after:clone(after)};
  return {session:{...session,initialState:clone(session.initialState),state:clone(after),trace:[...clone(session.trace),entry]},result};
}

export function inspectState(state: GameState): string {
  return [
    'SAN11 PK training sandbox | synthetic data | incomplete game',
    `Profile ${state.ruleset.id} / ${state.ruleset.patchVersion} / ${state.ruleset.fixProfile}`,
    `Date ${state.date.year}/${state.date.month}/${state.date.day} | turn ${state.turn} | corps AP ${state.corps.actionPoints} | TP ${state.force.techniquePoints}`,
    ...state.bases.map(b => `${b.id} ${b.name}: troops ${b.troops}, morale ${b.morale}, gold ${b.gold}, trained ${b.trainingCompleted}`),
    ...state.officers.map(p => `${p.id} ${p.name}: WAR ${p.war}, XP ${p.warXp}, merit ${p.merit}, acted ${p.acted}`),
    `Core RNG ${state.rng.algorithm}: seed ${state.rng.seed}, draws ${state.rng.draws}; original presentation RNG omitted`,
    'Only Train / bounded EndTurn. No AI, economy, field armies, stat-growth conversion or historical scenario.',
  ].join('\n');
}
