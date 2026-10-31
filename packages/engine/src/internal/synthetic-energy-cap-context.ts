/** Private derived-cap transport, never a persistent balance or public research authority. */
export type SyntheticEnergyCaps = ReadonlyMap<string, 100 | 120>;
export function readSyntheticEnergyCaps(value: unknown): SyntheticEnergyCaps | undefined {
  if (!Array.isArray(value) || value.length > 8) return undefined;
  const result = new Map<string, 100 | 120>();
  for (const row of value) {
    if (row === null || typeof row !== 'object' || Array.isArray(row)
      || Object.keys(row).sort().join(',') !== 'actorId,cap'
      || typeof row.actorId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,95}$/.test(row.actorId)
      || result.has(row.actorId) || (row.cap !== 100 && row.cap !== 120)) return undefined;
    result.set(row.actorId, row.cap);
  }
  return result;
}
