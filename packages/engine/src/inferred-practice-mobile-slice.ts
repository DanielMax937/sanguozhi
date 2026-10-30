/** Bounded view of the existing synthetic practice generator, not a new map algorithm. */
import { createInferredPracticeMovementRequest } from './inferred-practice-map.ts';
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
function freeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object') { for (const item of Object.values(value)) freeze(item); Object.freeze(value); }
  return value;
}
/** No unit, balance, clock, field action or movement execution is created by a map view. */
export function createInferredPracticeMobileSlice(originX: unknown, originY: unknown, width: unknown, height: unknown) {
  if (!uint(originX, 199) || !uint(originY, 199) || !uint(width, 16) || width < 1 || !uint(height, 16) || height < 1
    || width * height > 16 || originX + width > 200 || originY + height > 200) return fail('invalid-practice-slice-bounds');
  const source = createInferredPracticeMovementRequest();
  const selection = new Map<string, string>();
  for (let x = originX; x < originX + width; x++) for (let y = originY; y < originY + height; y++) selection.set(`g-${x}-${y}`, `synthetic-practice-${x}-${y}`);
  const selected = [...selection].map(([oldId, newId]) => ({ source: source.map.cells.find(cell => cell.id === oldId), oldId, newId }));
  // The mobile profile derives fires/occupancy from its actual roster. A future nonzero
  // generator flag cannot be silently dropped or interpreted as a world fire entity.
  if (selected.some(row => !row.source || row.source.flagsU32 !== 0 || row.source.occupied)) return fail('unsupported-source-flags-or-occupancy');
  const cells = selected.map(row => { const cell = row.source!; return { id: row.newId, terrainInfoU32: cell.terrainInfoU32,
    adjacent: cell.adjacent.filter(id => selection.has(id)).map(id => selection.get(id)!),
    blocked: cell.blocked, unsupportedContext: cell.unsupportedContext, facilityPresent: cell.facilityPresent }; });
  return freeze({ ok: true as const, fieldCells: cells.map(cell => cell.id),
    movementMap: { id: `synthetic-practice-slice-${originX}-${originY}-${width}-${height}`, cells },
    sourceMapId: source.map.id, sourceWindow: { originX, originY, width, height },
    sourceMapping: selected.map(row => ({ cellId: row.newId, sourceCellId: row.oldId, sourceTerrainInfoU32: row.source!.terrainInfoU32,
      sourceFlagsU32: row.source!.flagsU32, sourceOccupied: row.source!.occupied,
      excludedBoundaryEdges: row.source!.adjacent.filter(id => !selection.has(id)) })),
    policyId: 'inferred-practice-map-induced-window-v1', nativeMapRecovered: false as const,
    fullMapMovementSupported: false as const, crossSliceMovementSupported: false as const, worldCreated: false as const });
}
