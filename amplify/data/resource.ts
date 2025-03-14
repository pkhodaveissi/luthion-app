import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { seedDatabase } from '../functions/seedDatabase/resource';


const schema = a.schema({
  User: a.model({
    id: a.id(), // Auto-generated, optimized for DB operations
    cognitoSub: a.string().required(), // Indexed for quick lookups
    email: a.string().required(),
    name: a.string().required(),
    isGuest: a.boolean().required(),
    guestId: a.string(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    lastCommittedAt: a.datetime(),
    lastReflectionAt: a.datetime(), // New fiel
    goals: a.hasMany('Goal', 'userId'),
    dailyScores: a.hasMany('DailyScore', 'userId'),
    weeklyScores: a.hasMany('WeeklyScore', 'userId'),
    userRank: a.hasOne('UserRank', 'userId'),
  }).secondaryIndexes((index) => [index("cognitoSub")]),

  Goal: a.model({
    id: a.id(), // Auto-generated, optimized for DB operations
    userId: a.id(),
    user: a.belongsTo('User', 'userId'),
    text: a.string().required(),
    status: a.enum(['draft', 'committed', 'reflected']), // Updated status options
    createdAt: a.datetime(),
    committedAt: a.datetime(), // When the 5-minute timer started
    lockedAt: a.datetime(),    // When the goal was locked after editing
    reflectedAt: a.datetime(),
    updatedAt: a.datetime(),
    reflection: a.hasOne('Reflection', 'goalId'),
  }).secondaryIndexes((index) => [
    index("userId").sortKeys(["reflectedAt"]).queryField("listGoalsByUserOrderedbyReflection"),
  ]),

  Reflection: a.model({
    id: a.id(), // Auto-generated, optimized for DB operations
    goalId: a.id(),
    goal: a.belongsTo('Goal', 'goalId'),
    reflectionOptionId: a.id(),
    reflectionOption: a.belongsTo('ReflectionOption', 'reflectionOptionId'),
    score: a.integer().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }),
  ReflectionOption: a.model({
    id: a.id(), // Auto-generated, optimized for DB operations
    text: a.string().required(),
    score: a.integer().required(),
    isActive: a.boolean().required(),
    reflectionType: a.enum(['tried_life_happened', 'priorities_shifted', 'not_today', 'did_it']),
    reflections: a.hasMany('Reflection', 'reflectionOptionId'),
  }).authorization((allow) => [
    allow.authenticated().to(['read'])
  ]),
  
  DailyScore: a.model({
    id: a.id(), // Auto-generated, optimized for DB operations
    userId: a.id(),
    user: a.belongsTo('User', 'userId'),
    date: a.datetime().required(),
    score: a.integer().required(),
    reflectionCount: a.integer().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    weeklyScore: a.belongsTo('WeeklyScore', 'weeklyScoreId'),
    weeklyScoreId: a.id(),
  }),

  WeeklyScore: a.model({
    id: a.id(), // Auto-generated, optimized for DB operations
    userId: a.id(),
    user: a.belongsTo('User', 'userId'),
    weekStart: a.datetime().required(),
    weekEnd: a.datetime().required(),
    score: a.integer().required(),
    isComplete: a.boolean().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    dailyScores: a.hasMany('DailyScore', 'weeklyScoreId'),
  }),

  RankTier: a.model({
    id: a.id(), // Auto-generated, optimized for DB operations
    name: a.string().required(),
    minScore: a.integer().required(),
    maxScore: a.integer().required(),
    description: a.string().required(),
    userRanks: a.hasMany('UserRank', 'rankTierId'),
    nextRankName:  a.string(),
    previousRankName:  a.string(),
  }).authorization((allow) => [
    allow.authenticated().to(['read'])
  ]),

  UserRank: a.model({
    id: a.id(), // Auto-generated, optimized for DB operations
    userId: a.id(),
    user: a.belongsTo('User', 'userId'),
    rankTierId: a.id(),
    rankTier: a.belongsTo('RankTier', 'rankTierId'),
    currentScore: a.integer().required(),
    progressInTier: a.float().required(),
    lastCalculatedAt: a.datetime().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }),
  Config: a.model({
    id: a.id(),
    key: a.string().required(),
    value: a.string().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  })
  
}).authorization((allow) => [
  allow.owner(),
  allow.resource(seedDatabase)
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
