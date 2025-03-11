import { defineFunction } from '@aws-amplify/backend';

export const seedDatabase = defineFunction({
  name: 'seedDatabase',
  environment: {
    SEED_VERSION: '1.0',
  }
});