import { generateClient } from 'aws-amplify/api';
import { type Schema } from "@/amplify/data/resource";

export const amplifyClient = generateClient<Schema>();

export type ModelListType<T extends keyof Schema> = Array<Schema[T]["type"]>;
