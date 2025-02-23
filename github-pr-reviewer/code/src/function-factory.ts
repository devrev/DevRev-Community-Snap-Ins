import on_pr_creation from "./functions/on_pr_creation";

export const functionFactory = {
    on_pr_creation
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
