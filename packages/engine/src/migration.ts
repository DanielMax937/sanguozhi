import { DEFAULT_ADAPTERS } from './engine.ts';
import { canonical, clone, RULESET } from './rules.ts';
import { isRecord, validateState } from './state.ts';
import type { GameState } from './types.ts';

const LEGACY_RULESET = {
  id:'pk-training-slice-v1',rulesetVersion:'pk',patchVersion:'1.1',fixProfile:'original',
  gateProfile:'conservative-training-v1',apProfile:'single-first-corps-c9-v1',
  turnProfile:'training-only-turn-v1',progressionProfile:'reject-stat-growth-v1',
  presentationProfile:'omit-training-presentation-v1',
};
/** Explicit state-only import. It validates the snapshot, not the historical v1 command trace. */
export function migrateLegacyState(value: unknown): {state:GameState; migration:{id:string; historicalTracePreserved:false; note:string}} {
  if (!isRecord(value) || Object.hasOwn(value,'originProfile') || value.schemaVersion !== 1 || canonical(value.ruleset) !== canonical(LEGACY_RULESET) || !Array.isArray(value.officers)) throw new Error('Only default v1 state snapshots can migrate');
  const legacyFields = ['id','name','forceId','baseId','war','leadership','charisma','intelligence','warXp','merit','acted'].sort();
  for (const person of value.officers) {
    if (!isRecord(person) || canonical(Object.keys(person).sort()) !== canonical(legacyFields) || !Number.isSafeInteger(person.warXp) || (person.warXp as number) < 0 || (person.warXp as number) >= 100) throw new Error('Legacy officer must have original v1 fields and XP below100');
  }
  const candidate = clone(value);
  candidate.schemaVersion = 2;
  candidate.originProfile = 'legacy-v1-state';
  candidate.ruleset = clone(RULESET);
  candidate.officers = value.officers.map(person => {
    const old = person as Record<string,unknown>;
    return {...clone(old),warBase:old.war,identity:old.id === (value.force as Record<string,unknown> | undefined)?.rulerId ? 0 : 3,location:'base',onMission:false};
  });
  const errors = validateState(candidate,DEFAULT_ADAPTERS);
  if (errors.length) throw new Error(`Invalid legacy state: ${errors.join('; ')}`);
  return {state:candidate as unknown as GameState,migration:{id:'v1-state-to-cumulative-v2',historicalTracePreserved:false,
    note:'XP0..99 copied unchanged as cumulative XP; WAR becomes unmodified talent. Start a new v2 session. Historical v1 trace is neither migrated nor certified.'}};
}
