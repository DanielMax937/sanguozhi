/** Read-only price-domain adapter. Never a person-stat, XP, inventory or trade writer. */
import catalog from '../../../../data/catalogs/city-merchant-politics-v1.json' with { type: 'json' };
import { detachBoundedCityData } from './bounded-city-json.ts';

export type SyntheticMerchantPricePoliticsInput = Readonly<{officerId: string; effectivePolitics: number}>;
const fail = (reason: string) => Object.freeze({ok:false as const,reason});
/** Owner supplies the one current effective projection; only the price view saturates. */
export function projectSyntheticMerchantPricePolitics(raw: unknown) {
  try {
    const detached = detachBoundedCityData(raw);
    if (!detached.ok) return fail('invalid-pricing-view-data');
    const value = detached.value;
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return fail('invalid-pricing-view');
    const row = value as Record<string,unknown>;
    if (Object.keys(row).length !== 2 || !Object.hasOwn(row,'officerId') || !Object.hasOwn(row,'effectivePolitics')
      || typeof row.officerId !== 'string' || !/^synthetic-[a-z0-9-]{1,48}$/.test(row.officerId)
      || typeof row.effectivePolitics !== 'number' || !Number.isSafeInteger(row.effectivePolitics)
      || Object.is(row.effectivePolitics,-0) || row.effectivePolitics < 0 || row.effectivePolitics > 255) return fail('invalid-pricing-view');
    if (catalog.minPolitics !== 20 || catalog.maxPolitics !== 100
      || catalog.version !== 'merchant-politics-observed-linear-v1') return fail('unsupported-pricing-catalog');
    const effectivePolitics = row.effectivePolitics;
    const pricePolitics = Math.max(catalog.minPolitics,Math.min(catalog.maxPolitics,effectivePolitics));
    const receipt = Object.freeze({officerId:row.officerId,effectivePolitics,pricePolitics,
      policyId:'inferred-merchant-politics-endpoint-saturation-v1' as const,
      catalogVersion:catalog.version,minimumPricePolitics:20 as const,maximumPricePolitics:100 as const,
      adjustment:effectivePolitics<20?'lower-endpoint' as const:effectivePolitics>100?'upper-endpoint' as const:'identity' as const,
      nativeEquivalent:false as const,personAttributesWritten:false as const});
    return Object.freeze({ok:true as const,officerId:row.officerId,pricePolitics,receipt});
  } catch { return fail('invalid-pricing-view-data'); }
}
