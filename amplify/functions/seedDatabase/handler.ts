import type { Handler } from 'aws-lambda';
import type { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/seedDatabase'; // Using the function name 'seedDatabase'

type ReflectionOption = Schema['ReflectionOption']['type'];

const REFLECTION_OPTIONS: {text: string, score: number, reflectionType: Exclude<ReflectionOption["reflectionType"], undefined>, isActive: boolean}[] = [
  {
    text: "I tried, but life happened.",
    score: 3,
    reflectionType: "tried_life_happened",
    isActive: true
  },
  {
    text: "Priorities shifted.",
    score: 2,
    reflectionType: "priorities_shifted",
    isActive: true
  },
  {
    text: "Not today, and that's okay.",
    score: 1,
    reflectionType: "not_today",
    isActive: true
  },
  {
    text: "I did it.",
    score: 5,
    reflectionType: "did_it",
    isActive: true
  }
];

const RANK_TIERS = [
  {
    name: "Peak",
    minScore: 3100,
    maxScore: 3360,
    description: "At the highest level of engagement, maintaining peak performance."
  },
  {
    name: "Momentum",
    minScore: 2700,
    maxScore: 3099,
    description: "Highly engaged, but could slip if not consistent."
  },
  {
    name: "Flowing",
    minScore: 2200,
    maxScore: 2699,
    description: "Strong, steady engagement with minor dips."
  },
  {
    name: "Steady",
    minScore: 1600,
    maxScore: 2199,
    description: "Moderately engaged, but not fully consistent."
  },
  {
    name: "Rebuilding",
    minScore: 1000,
    maxScore: 1599,
    description: "Gaining momentum after a drop or break."
  },
  {
    name: "Renewing",
    minScore: 400,
    maxScore: 999,
    description: "Low engagement, but showing signs of progress."
  },
  {
    name: "Starting",
    minScore: 0,
    maxScore: 399,
    description: "Almost inactive, starting over from a minimal base."
  }
];


export const handler: Handler = async () => {
  try {
    // Configure the Amplify client
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
    Amplify.configure(resourceConfig, libraryOptions);
    const client = generateClient<Schema>();

    // Check if already seeded
    const { data: configs } = await client.models.Config.list({
      filter: { key: { eq: 'seedVersion' } }
    });

    if (configs.length > 0 && configs[0].value === env.SEED_VERSION) {
      console.log('Database already seeded with version', env.SEED_VERSION);
      return { statusCode: 200, body: 'Already seeded' };
    }

    // Seed ReflectionOptions
    for (const option of REFLECTION_OPTIONS) {
      await client.models.ReflectionOption.create({
        ...option,
      });
    }

    // Seed RankTiers
    for (const tier of RANK_TIERS) {
      await client.models.RankTier.create({
        ...tier,
      });
    }

    // Update seed version
    await client.models.Config.create({
      key: 'seedVersion',
      value: env.SEED_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Database seeded successfully' })
    };
  } catch (error) {
    console.error('Seeding error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to seed database' })
    };
  }
};