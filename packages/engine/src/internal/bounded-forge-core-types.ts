import type { Scenario } from './bounded-forge-development-production-types.ts';

export type ForgeCoreFacts = Pick<Scenario,
  | 'advanceLimit'
  | 'activeForceId'
  | 'force'
  | 'corps'
  | 'city'
  | 'officers'
  | 'lots'
  | 'domestic'
  | 'constructionEnvironment'
  | 'productionCatalog'
  | 'constructionCatalog'
  | 'policy'
>;

export type ForgeCoreStartContext = {
  genesis: ForgeCoreFacts;
  revision: number;
};
