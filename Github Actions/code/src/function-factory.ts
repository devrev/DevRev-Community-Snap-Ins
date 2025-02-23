import workflow from './functions/workflow';

export const functionFactory = {
  workflow,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
