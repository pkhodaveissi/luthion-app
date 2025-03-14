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
    description: "You're operating at your best—fully engaged, fully aligned. Keep nurturing this momentum to stay in flow.",
    previousRankName: "Momentum",
    nextRankName: null
  },
  {
    name: "Momentum",
    minScore: 2700,
    maxScore: 3099,
    description: "You're thriving with consistent effort. A small push could elevate you to your highest level.",
    previousRankName: "Flowing",
    nextRankName: "Peak"
  },
  {
    name: "Flowing",
    minScore: 2200,
    maxScore: 2699,
    description: "You're in rhythm, steadily progressing. Some adjustments can help you reach an even stronger state.",
    previousRankName: "Steady",
    nextRankName: "Momentum"
  },
  {
    name: "Steady",
    minScore: 1600,
    maxScore: 2199,
    description: "You're maintaining progress, but there’s room to strengthen your commitment. Small shifts will build momentum.",
    previousRankName: "Rebuilding",
    nextRankName: "Flowing"
  },
  {
    name: "Rebuilding",
    minScore: 1000,
    maxScore: 1599,
    description: "You're regaining ground. Keep stacking your efforts—every step forward strengthens your foundation.",
    previousRankName: "Renewing",
    nextRankName: "Steady"
  },
  {
    name: "Renewing",
    minScore: 400,
    maxScore: 999,
    description: "You're re-engaging, shaking off the rust. Keep showing up, and growth will follow.",
    previousRankName: "Starting",
    nextRankName: "Rebuilding"
  },
  {
    name: "Starting",
    minScore: 0,
    maxScore: 399,
    description: "You're at the starting point. The first step matters—commit to small, consistent actions to build momentum.",
    previousRankName: null,
    nextRankName: "Renewing"
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