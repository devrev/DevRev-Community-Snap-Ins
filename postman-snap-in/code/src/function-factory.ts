import create_collection_article from './functions/create_collection_article';
import run_postman_collection from './functions/run_postman_collection';
import show_collections from './functions/show_collections';

export const functionFactory = {
  // Add your functions here
  run_postman_collection,
  show_collections,
  create_collection_article,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
