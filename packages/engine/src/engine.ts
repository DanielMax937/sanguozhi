import { advanceDate, calculateApRecovery, calculateTraining, calculateWarGrowth, isActiveOfficer, moraleCap } from './calculations.ts';
import { canonical, clone, evidence, RULES, RULESET } from './rules.ts';
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
      if (!isActiveOfficer(person) || person.location !== 'base' || person.onMission) reasons.push(`Officer ${person.id} is unavailable for training`);
    }
    return reasons;
  },
};
export const DEFAULT_ADAPTERS: EngineAdapters = deepFreeze({ gate:conservativeTrainingGate, random:seededRandom,
  growth:{id:RULESET.progressionProfile,evidence:clone(RULES['engine.progression']) as RuleEvidence,config:clone(RULESET.progressionConfig)},
  turn:{id:RULESET.turnProfile,evidence:clone(RULES['engine.scheduler']) as RuleEvidence,phases:clone(RULESET.turnPhases)},
});

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
    const turn = {phases:clone(adapters.turn.phases),
      resetBaseIds:state.bases.filter(b => b.ownerForceId === state.force.id && b.corpsId === state.corps.id && b.trainingCompleted).map(b => b.id),
      resetOfficerIds:state.officers.filter(p => p.forceId === state.force.id && p.acted).map(p => p.id)};
    return {ok:true,reasons:[],calculation:{ap,calendar,turn},rngDraws:0,evidence:[...baseEvidence,
      evidence('engine.apScope','One first corps; unmodified synthetic abilities; no cross-corps state.'),
      evidence('engine.eligibility','AP counts active officers physically at bases; resetting acted does not complete missions or move absent/deployed people.'),
      evidence('ap.recovery',`core=${ap.coreRecovery}, talisman=${ap.talismanBonus}, computed=${ap.recovery}, credited=${ap.actualRecovery}`),
      evidence('engine.calendar',`Advance ${state.date.year}/${state.date.month}/${state.date.day} to ${calendar.next.year}/${calendar.next.month}/${calendar.next.day}`),
      evidence('turn.reset','Reset owned-base training flags before next usable turn.'),
      evidence('turn.schedulerOpen','S1 reset caller and field-morale xref recovered; stock equivalence and full scheduler/AP ordering remain open.'),
      {evidence:clone(adapters.turn.evidence),detail:`Turn adapter ${adapters.turn.id}; phases=${turn.phases.join(' -> ')}; reset bases=${turn.resetBaseIds.join(',')}; reset officers=${turn.resetOfficerIds.join(',')}.`},
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
    const gateOfficers = deepFreeze(command.officerIds.map(id => snapshot.officers.find(p => p.id === id)!));
    const result = adapters.gate.evaluate(snapshot,gateBase,gateOfficers);
    if (!Array.isArray(result) || result.some(s => typeof s !== 'string')) reasons.push('Eligibility adapter returned an invalid result');
    else reasons.push(...result);
  } catch {
    reasons.push('Eligibility adapter failed; command rejected atomically');
  }
  // Once-per-turn, selection ownership, resource and progression safety cannot be waived by a custom gate.
  if (base.trainingCompleted && !reasons.includes('Base has already trained this turn')) reasons.push('Base has already trained this turn');
  if (base.troops === 0 && !reasons.some(reason => reason.includes('needs troops'))) reasons.push('Training needs troops');
  if (base.morale >= moraleCap(state) && !reasons.some(reason => reason.includes('at cap'))) reasons.push('Training morale is already at cap');
  if (base.ownerForceId !== state.force.id || base.corpsId !== state.corps.id) reasons.push('Training ownership safety check failed');
  if (selected.some(p => p.forceId !== state.force.id || p.baseId !== base.id || p.acted || !isActiveOfficer(p) || p.location !== 'base' || p.onMission)) reasons.push('Training officer safety check failed');
  if (state.corps.actionPoints < training.apCost) reasons.push('Insufficient corps AP');
  const progression = selected.map(person => calculateWarGrowth(person,RULES['train.rewards'].value.warXp,adapters.growth.config));
  const growthEvidence = clone(adapters.growth.evidence);
  if (canonical(adapters.growth.config) !== canonical(RULESET.progressionConfig)) {
    growthEvidence.level = 'provisional-engine-rule';
    growthEvidence.originalEvidence = 'configured engine override; source constants are not applied unchanged';
    growthEvidence.value = clone(adapters.growth.config);
    growthEvidence.note = 'Effective non-default growth configuration is an explicit engineering override, not the source-profile formula.';
  }
  return {ok:reasons.length === 0,reasons,calculation:{training,progression},rngDraws:0,evidence:[...baseEvidence,
    {evidence:gateEvidence,detail:`Eligibility adapter ${adapters.gate.id}; conservative extra gates are explicit fallback.`},
    evidence('train.sourceGate','Recovered source S1 rejects full morale/zero troops; stock equivalence not certified.'),
    evidence('train.gateOpen','Source gate/parameter bodies recovered; complete stock/mission semantics remain open.'),
    evidence('train.once','One training command per base per turn.'),
    evidence('engine.eligibility','Identity, physical location and mission are separate eligibility checks; no original full-validator equivalence claimed.'),
    evidence('train.formula',`sum=${training.warSum}, max=${training.warMax}, denominator=${training.denominator}, baseGain=${training.baseGain}`),
    evidence('train.drill',`complete-city drill applied=${training.drillApplied}; gainBeforeCap=${training.gainBeforeCap}`),
    evidence('train.moraleCap',`cap=${training.moraleCap}; actualGain=${training.actualGain}`),
    evidence('train.ap',`AP=${training.apCost}; gold=0`),
    evidence('train.tp',`computed award=${training.techniquePointsBeforeCap}; based on actual morale gain`),
    evidence('resource.tpCap',`credited TP=${Math.min(training.techniquePointsBeforeCap,RULES['resource.tpCap'].value - state.force.techniquePoints)}`),
    evidence('train.rewards','Each selected officer: WAR XP +2, merit +50 subject to merit cap, acted=true; base trained=true.'),
    evidence('resource.meritCap','Merit clamps at 60000; before/after snapshots expose credited amounts.'),
    {evidence:growthEvidence,detail:`Growth adapter ${adapters.growth.id}; cumulative XP is retained, credited XP and actual WAR gain appear per officer in calculation.progression.`},
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
      const growth = preview.calculation.progression!.find(p => p.officerId === id)!;
      person.warXp = growth.xpAfter;
      person.war = growth.warAfter;
      person.merit = Math.min(RULES['resource.meritCap'].value,person.merit + RULES['train.rewards'].value.merit);
      person.acted = true;
    }
  } else {
    const plan = preview.calculation.turn!;
    for (const phase of plan.phases) {
      if (phase === 'advance-date') { next.date = clone(preview.calculation.calendar!.next); next.turn += 1; }
      else if (phase === 'recover-ap') next.corps.actionPoints += preview.calculation.ap!.actualRecovery;
      else if (phase === 'reset-base-training') for (const base of next.bases) { if (plan.resetBaseIds.includes(base.id)) base.trainingCompleted = false; }
      else if (phase === 'reset-officer-actions') for (const person of next.officers) { if (plan.resetOfficerIds.includes(person.id)) person.acted = false; }
    }
  }
  next.revision += 1;
  return {...preview,state:next};
}

export function createSession(state: GameState, adapters: EngineAdapters = DEFAULT_ADAPTERS): Session {
  const errors = validateState(state,adapters);
  if (errors.length) throw new Error(errors.join('; '));
  return {saveVersion:2,engineVersion:'training-kernel-v2',initialState:clone(state),state:clone(state),trace:[]};
}
/** Rejections return a diagnostic but do not enter the accepted command log or change the session. */
export function dispatch(session: Session, command: Command, adapters: EngineAdapters = DEFAULT_ADAPTERS): {session:Session; result:CommandResult} {
  const result = executeCommand(session.state,command,adapters);
  if (!result.ok) return {session,result};
  const {state:after,...preview} = result;
  const entry = {...clone(preview),command:clone(command),before:clone(session.state),after:clone(after)};
  return {session:{...session,initialState:clone(session.initialState),state:clone(after),trace:[...clone(session.trace),entry]},result};
}

export function inspectState(state: GameState): string {
  return [
    'SAN11 PK training sandbox | synthetic data | incomplete game',
    `Profile ${state.ruleset.id} / ${state.ruleset.patchVersion} / ${state.ruleset.fixProfile}`,
    `Date ${state.date.year}/${state.date.month}/${state.date.day} | turn ${state.turn} | corps AP ${state.corps.actionPoints} | TP ${state.force.techniquePoints}`,
    ...state.bases.map(b => `${b.id} ${b.name}: troops ${b.troops}, morale ${b.morale}, gold ${b.gold}, trained ${b.trainingCompleted}`),
    ...state.officers.map(p => `${p.id} ${p.name}: WAR ${p.war} (talent ${p.warBase}), cumulative XP ${p.warXp}/${state.ruleset.progressionConfig.experienceCap}, progress ${p.warXp >= state.ruleset.progressionConfig.experienceCap ? 'FULL' : `${p.warXp % state.ruleset.progressionConfig.experiencePerPoint}/${state.ruleset.progressionConfig.experiencePerPoint}`} , merit ${p.merit}, acted ${p.acted}, identity ${p.identity}, location ${p.location}, mission ${p.onMission}`),
    `Core RNG ${state.rng.algorithm}: seed ${state.rng.seed}, draws ${state.rng.draws}; original presentation RNG omitted`,
    'Only Train / bounded EndTurn / cumulative WAR growth. No AI, economy, field-army actions, mission completion or historical scenario.',
  ].join('\n');
}
