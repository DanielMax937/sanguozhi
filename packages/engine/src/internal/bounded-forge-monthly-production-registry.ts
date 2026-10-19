/** Exact monthly policy, with the unchanged delivered forge policy as its base. */
import { ROOT_POLICY as BASE_POLICY } from './bounded-forge-development-production-registry.ts';
export { CONSTRUCTION_CATALOG } from './bounded-forge-development-production-registry.ts';

export const MONTHLY_POLICY = {
  "id": "dynamic-forge-monthly-v1",
  "clock": "after-core-completion-at-month-start-v1",
  "slots": "explicit-lot-slots-from-current-v1",
  "governor": "fixed-officer-current-politics-0-to-100-v1",
  "initialDate": "no-create-catchup-v1",
  "payroll": "not-modeled",
  "order": [
    1,
    2,
    3
  ],
  "specialty": {
    "id": "documented-matching-complete-facilities-v1",
    "order": [
      1,
      2,
      3,
      4
    ],
    "matchingKinds": {
      "1": "forge",
      "2": "forge",
      "3": "forge",
      "4": "stable"
    },
    "completedFacilityWeight": 1,
    "governorRequired": true,
    "arithmeticProfile": "comment-f32-rne-trunc-v1",
    "kernelRequestCap": 1500,
    "nativeMatchingHelperRecovered": false
  },
  "arithmetic": {
    "id": "comment-f32-rne-trunc-v1",
    "constantBitsU32": {
      "half": 1056964608,
      "one": 1065353216,
      "quarter": 1048576000,
      "two": 1073741824,
      "tenth": 1036831949,
      "three": 1077936128
    },
    "factorTiers": [
      "count=1:1",
      "2..3:1+(count-1)*half",
      "4..7:2+(count-3)*quarter",
      "8..30:3+(count-7)*tenth"
    ],
    "factorStore": "one-binary32-round-to-nearest-even",
    "politicsTerm": "floor(politics/2)+60",
    "scaledValue": "politicsTerm*storedFactor*three",
    "converter": "truncate-toward-zero",
    "requestCap": 1500,
    "evidence": "provisional-comment-constants-and-converter"
  },
  "credit": {
    "id": "saturating-positive-credit-v1",
    "accepted": "min(requested,capacity-before)",
    "discarded": "requested-accepted",
    "bonusBasis": "requested-base",
    "caps": "explicit-scenario-not-native"
  }
} as const;

export const ROOT_POLICY = {
  id: 'bounded-forge-monthly-production-v1', version: 1,
  base: BASE_POLICY,
  monthly: MONTHLY_POLICY,
  budgets: {
  "acceptedCommands": 64,
  "traceAttempts": 128,
  "maxJobs": 1,
  "maxAdvances": 12,
  "maxOfficers": 8,
  "maxLots": 2,
  "maxFacilities": 2,
  "maxFieldUnits": 16,
  "maxHostileForces": 16,
  "maxUtf8Bytes": 8388608,
  "maxNodes": 250000,
  "maxDepth": 48,
  "maxArray": 4096,
  "maxObjectKeys": 128
}
} as const;
