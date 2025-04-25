import sync_circleci_data from "./functions/sync_circleci_data";
import generate_insights from "./functions/generate_insights";

export const functionFactory = {
  // Add your functions here
  sync_circleci_data,
  generate_insights,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
