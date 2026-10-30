/** Load and execute one explicitly synthetic Recruit through the existing service. */
import { createInferredCityCommandScenario } from './inferred-blueprints.ts';
import { createCityCommandState, executeCityCommand } from './city-command-lifecycle.ts';
import type { CityScenarioV1, CityCommandEnvelopeV1 } from './city-command-lifecycle.ts';

const fail = (reason: string) => Object.freeze({ ok: false as const, reason });

/** Each call creates a NEW exercise; continuing an existing state uses executeCityCommand. */
export function runInferredRecruitmentExercise(cityName: string, startYear: number, commandId: string) {
  if (typeof commandId !== 'string' || !/^synthetic-[a-z0-9-]{1,48}$/.test(commandId)) return fail('invalid-synthetic-command-id');
  const blueprint = createInferredCityCommandScenario(cityName, startYear);
  if (!blueprint.ok) return blueprint;
  const cityId = 'synthetic-recruit-city', forceId = 'synthetic-recruit-force';
  const scenario: CityScenarioV1 = {
    ...blueprint.scenario,
    activeForceId: forceId,
    corps: { ...blueprint.scenario.corps, id: 'synthetic-recruit-corps' },
    city: { ...blueprint.scenario.city, id: cityId },
    officers: blueprint.scenario.officers.map((officer, index) => ({ ...officer,
      id: `synthetic-recruit-officer-${index + 1}`, forceId, cityId })),
    facilities: blueprint.scenario.facilities.map((facility, index) => ({ ...facility,
      id: `synthetic-recruit-facility-${index + 1}`, cityId })),
  };
  const initialState = createCityCommandState(scenario);
  if ('ok' in initialState) return initialState;
  const facility = initialState.facilities.find(candidate => candidate.kind === 'barracks');
  const officer = initialState.officers[0];
  if (!facility || !officer) return fail('missing-synthetic-recruitment-input');
  const envelope: CityCommandEnvelopeV1 = Object.freeze({ id: commandId, expectedRevision: initialState.revision,
    command: Object.freeze({ type: 'Recruit' as const, cityId, facilityId: facility.id,
      officerIds: Object.freeze([officer.id]) }) });
  const result = executeCityCommand(initialState, envelope);
  if (!result.ok) return result;
  return Object.freeze({ ok: true as const, policyId: 'inferred-neutral-recruitment-exercise-v1' as const,
    evidence: 'existing-service-with-explicit-synthetic-initialization' as const,
    cityName, initialState, envelope, state: result.state, receipt: result.receipt, duplicate: result.duplicate,
    followupConsumer: 'executeCityCommand' as const, saveConsumer: 'saveCityCommandState' as const,
    campaignWorldWritten: false as const, originalPersonsModified: false as const,
    historicalScenarioReconstructed: false as const, nativeRecruitmentWriterVerified: false as const,
    newExerciseEachCall: true as const });
}
