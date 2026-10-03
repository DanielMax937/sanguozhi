import { RULES } from './rules.ts';
import type { ApCalculation, Base, GameDate, GameState, Officer, TrainingCalculation } from './types.ts';

export function moraleCap(state: GameState): number {
  const caps = RULES['train.moraleCap'].value;
  return state.force.techniqueIds.includes(caps.techniqueId) ? caps.trainedSoldiers : caps.ordinary;
}
export function calculateTraining(state: GameState, base: Base, officers: readonly Officer[]): TrainingCalculation {
  const f = RULES['train.formula'].value;
  const warSum = officers.reduce((sum,p) => sum + p.war,0);
  const warMax = Math.max(...officers.map(p => p.war));
  const denominator = Math.min(f.denominatorCap,f.denominatorBase + Math.floor(base.troops / f.troopsDivisor));
  const baseGain = Math.floor((warSum + warMax) / denominator) + f.flatGain;
  const drillApplied = base.kind === 'city' && base.facilities.drillGround === 'complete';
  const drill = RULES['train.drill'].value;
  const gainBeforeCap = drillApplied ? Math.floor(baseGain * drill.numerator / drill.denominator) : baseGain;
  const cap = moraleCap(state);
  const actualGain = Math.min(gainBeforeCap,Math.max(0,cap - base.morale));
  const tp = RULES['train.tp'].value;
  const ap = RULES['train.ap'].value;
  return { denominator,warSum,warMax,baseGain,drillApplied,gainBeforeCap,moraleCap:cap,actualGain,
    techniquePointsBeforeCap:Math.floor(actualGain / tp.divisor) + tp.flat,
    apCost:base.kind === 'city' && base.facilities.militaryOffice === 'complete' ? ap.militaryOffice : ap.ordinary };
}
export function calculateApRecovery(state: GameState): ApCalculation {
  const r = RULES['ap.recovery'].value;
  const leader = state.officers.find(p => p.id === state.force.rulerId)!;
  const adviser = state.officers.find(p => p.id === state.force.adviserId);
  const owned = state.bases.filter(b => b.ownerForceId === state.force.id && b.corpsId === state.corps.id);
  const cities = owned.filter(b => b.kind === 'city');
  const eligible = owned.filter(b => b.kind === 'city' || cities.some(c => c.id === b.parentCityId));
  const counts = eligible.map(b => ({baseId:b.id,count:Math.min(r.officersPerBase,state.officers.filter(p => p.baseId === b.id && p.forceId === state.force.id).length)}));
  // Ties affect only reported order, not the sum. IDs make serialization stable.
  counts.sort((a,b) => b.count - a.count || (a.baseId < b.baseId ? -1 : a.baseId > b.baseId ? 1 : 0));
  const countedBases = counts.slice(0,r.baseCount);
  const leaderParam = r.leaderBase + Math.max(Math.floor(Math.max(leader.leadership,leader.charisma) / r.leaderDivisor) - r.leaderOffset,0);
  const cityParam = Math.min(r.cityStep * (cities.length - 1),r.cityCap);
  const officerParam = countedBases.reduce((sum,b) => sum + b.count,0);
  const adviserPercent = adviser ? r.adviserBasePercent + Math.floor(adviser.intelligence / r.adviserDivisor) : r.noAdviserPercent;
  // Integer percentage prevents IEEE-754 artifacts such as floor(100*1.15)=114.
  const coreRecovery = Math.floor((leaderParam + cityParam + officerParam) * adviserPercent / 100);
  const talismanBonus = cities.reduce((sum,b) => sum + b.facilities.completedTalismanPlatforms,0) * r.talismanBonus;
  const recovery = coreRecovery + talismanBonus;
  return {leaderParam,cityParam,officerParam,adviserPercent,countedBases,coreRecovery,talismanBonus,recovery,
    actualRecovery:Math.min(recovery,r.bankCap - state.corps.actionPoints)};
}
/** Main 00-turn-scenario §1: 1/11/21 xun, month/season markers only. */
export function advanceDate(date: GameDate): { next: GameDate; monthBoundary: boolean; seasonBoundary: boolean; yearBoundary: boolean } {
  const monthBoundary = date.day === 21;
  const yearBoundary = monthBoundary && date.month === 12;
  const month = monthBoundary ? (yearBoundary ? 1 : date.month + 1) : date.month;
  const next: GameDate = {year:date.year + (yearBoundary ? 1 : 0),month,day:date.day === 1 ? 11 : date.day === 11 ? 21 : 1};
  return {next,monthBoundary,yearBoundary,seasonBoundary:monthBoundary && [1,4,7,10].includes(month)};
}
