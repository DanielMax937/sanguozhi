/** Read-only facility markers for the fixed inferred development exercise layout. */
import { createInferredDevelopmentScenario } from './inferred-development-layout.ts';
import { saveFacilityConstructionState, loadFacilityConstructionState } from './facility-construction-lifecycle.ts';
import { moveOnSuppliedMap } from './supplied-map-movement.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freeze(item);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
const fail = (reason: string) => freeze({ ok: false as const, reason });
/** Only called on detached outputs of the existing strict validators. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const encoded = JSON.stringify(value);
    if (typeof encoded !== 'string') throw new Error('unsupported-canonical-value');
    return encoded;
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${canonical(object[key])}`).join(',')}}`;
}

export function projectInferredDevelopmentMarkers(cityName: string, startYear: number,
  constructionInput: unknown, movementInput: unknown) {
  try {
    const layout = createInferredDevelopmentScenario(cityName, startYear);
    if (!layout.ok) return fail(`layout:${layout.reason}`);
    // Full reconstruction proves commands/receipts/snapshot consistency, not source authorship.
    const saved = saveFacilityConstructionState(constructionInput);
    if (!saved.ok) return fail(`construction-save:${saved.reason}`);
    const loaded = loadFacilityConstructionState(saved.json);
    if (!loaded.ok) return fail(`construction-load:${loaded.reason}`);
    if (canonical(loaded.state.genesis) !== canonical(layout.constructionState.genesis)) return fail('construction-layout-genesis-mismatch');
    const current = moveOnSuppliedMap(movementInput);
    if (!current.ok) return fail(`movement-input:${current.reason}`);
    const input = current.request, expected = layout.movementRequest;
    if (input.path.length !== 0) return fail('projection-requires-empty-path');
    if (input.map.id !== expected.map.id || input.map.cells.length !== expected.map.cells.length
      || canonical(input.policy) !== canonical(expected.policy)) return fail('movement-layout-mismatch');
    const marker = input.state, initialMarker = expected.state;
    if (marker.unitId !== initialMarker.unitId || marker.landEquipmentId !== initialMarker.landEquipmentId
      || marker.navalEquipmentId !== initialMarker.navalEquipmentId || marker.transport !== initialMarker.transport
      || marker.budget > initialMarker.budget) return fail('unsupported-synthetic-marker');
    const lotCells = new Set(layout.mapping.map(lot => lot.cellId));
    // A stale marker bit on an actual lot is allowed and will be recomputed.
    // All other cells, terrain, adjacency, flags and collision inputs must match exactly.
    for (let index = 0; index < expected.map.cells.length; index++) {
      const before = input.map.cells[index]!, baseline = expected.map.cells[index]!;
      const normalized = lotCells.has(before.id) ? { ...before, facilityPresent: false } : before;
      if (canonical(normalized) !== canonical(baseline)) return fail('movement-cell-layout-mismatch');
    }
    const facilities = new Map(loaded.state.snapshot.facilities.map(facility => [facility.lotId, facility]));
    const markers = layout.mapping.map(lot => {
      const facility = facilities.get(lot.lotId);
      return { lotId: lot.lotId, cellId: lot.cellId, position: lot.position,
        facility: facility ? { id: facility.id, kind: facility.kind, status: facility.status,
          level: facility.level, effectiveLevel: facility.effectiveLevel, jobId: facility.jobId } : null };
    });
    const occupiedLotCells = new Set(markers.filter(marker => marker.facility !== null).map(marker => marker.cellId));
    const cells = input.map.cells.map(cell => lotCells.has(cell.id)
      ? { ...cell, facilityPresent: occupiedLotCells.has(cell.id) } : cell);
    const projection = moveOnSuppliedMap({ ...input, map: { ...input.map, cells }, path: [] });
    if (!projection.ok) return fail(`movement-projection:${projection.reason}`);
    return freeze({ ok: true as const, policyId: 'inferred-development-readonly-markers-v1' as const,
      evidence: 'explicit-layout-and-view-inference' as const, cityName, startYear,
      constructionRevision: loaded.state.snapshot.revision, constructionDate: loaded.state.snapshot.date,
      markers, movementRequest: projection.request,
      constructionCommandsExecuted: false as const, constructionStateModified: false as const,
      callerMovementStateModified: false as const, resourcesWritten: false as const,
      collisionRulesChanged: false as const, clocksShared: false as const,
      nativeMapRecovered: false as const, movementHistoryAuthenticated: false as const });
  } catch { return fail('invalid-projection-input'); }
}
