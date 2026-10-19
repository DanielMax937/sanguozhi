import type { ConstructionCompletion, ConstructionCompletionInput, ConstructionCompletionServices, ConstructionProgress, ConstructionProgressTarget, ConstructionReward } from './facility-construction-types.ts';

/** Mutate one job in the owner's detached candidate; no calendar or completion ownership. */
export function advanceConstructionWork(job: ConstructionProgressTarget): ConstructionProgress {
  const remainingBefore = job.remainingTurns, workBefore = job.work?.current ?? null; job.remainingTurns--;
  if (job.work !== null) job.work.current = Math.min(job.work.required, job.work.current + job.work.perAdvance);
  return { jobId: job.id, remainingBefore, remainingAfter: job.remainingTurns, workBefore, workAfter: job.work?.current ?? null };
}

/** The owner guards completion and resolves each reserved officer at its original write point. */
export function completeConstructionPhase(input: ConstructionCompletionInput, services: ConstructionCompletionServices): ConstructionCompletion {
  const { job, facility, force, currentTurn, requestedTechniquePoints, policies: p } = input;
  const techniquePoints = services.write(force.techniquePoints, requestedTechniquePoints, p.writer.techniquePointCap, p.writer.id); force.techniquePoints = techniquePoints.after;
  const rewards: ConstructionReward[] = job.officerIds.map(officerId => {
    const o = services.requireReservedOfficer(officerId);
    const xp = job.kind === 'absorption' ? p.rewards.absorptionPoliticsXp : (job.facilityKind === 'mint' || job.facilityKind === 'granary' ? p.rewards.supportDevelopmentPoliticsXp : p.rewards.ordinaryDevelopmentPoliticsXp);
    const requestedMerit = job.kind === 'development' && job.facilityKind === 'mint' ? p.rewards.mintDevelopmentMerit : p.rewards.otherMerit;
    const politicsXp = services.write(o.politicsXp, xp, p.writer.rewardCap, p.rewards.id);
    const merit = services.write(o.merit, requestedMerit, p.writer.rewardCap, p.rewards.id);
    o.politicsXp = politicsXp.after; o.merit = merit.after; o.reservationJobId = null; o.actedTurn = p.completionActors.actedOnCompletion ? currentTurn : null;
    return { officerId, politicsXp, merit, politicsBefore: o.politics, politicsAfter: o.politics };
  });
  facility.status = 'complete'; facility.effectiveLevel = job.targetLevel; facility.jobId = null; job.completedTurn = currentTurn;
  return { jobId: job.id, facilityId: facility.id, typeId: facility.typeId, level: job.targetLevel, effectiveLevel: job.targetLevel, techniquePoints, rewards, releasedOfficerIds: [...job.officerIds], policyId: p.scheduler.id };
}
