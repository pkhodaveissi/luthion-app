import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
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
    goals: a.hasMany('Goal', 'userId'),
    reflections: a.hasMany('Reflection', 'userId'),
    dailyScores: a.hasMany('DailyScore', 'userId'),
    weeklyScores: a.hasMany('WeeklyScore', 'userId'),
    userRank: a.hasOne('UserRank', 'userId'),
  }).secondaryIndexes((index) => [index("cognitoSub")]),

  Goal: a.model({
    userId: a.id(),
    user: a.belongsTo('User', 'userId'),
    text: a.string().required(),
    status: a.enum(['draft', 'committed', 'reflected']), // Updated status options
    createdAt: a.datetime().required(),
    lockedAt: a.datetime(), // New field
    reflectedAt: a.datetime(),
    updatedAt: a.datetime().required(),
    reflection: a.hasOne('Reflection', 'goalId'),
  }),

  Reflection: a.model({
    userId: a.id(),
    user: a.belongsTo('User', 'userId'),
    goalId: a.id(),
    goal: a.belongsTo('Goal', 'goalId'),
    reflectionOptionId: a.id(),
    reflectionOption: a.belongsTo('ReflectionOption', 'reflectionOptionId'),
    score: a.integer().required(),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
  }),

  DailyScore: a.model({
    userId: a.id(),
    user: a.belongsTo('User', 'userId'),
    date: a.datetime().required(),
    score: a.integer().required(),
    reflectionCount: a.integer().required(),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
    weeklyScore: a.belongsTo('WeeklyScore', 'weeklyScoreId'),
    weeklyScoreId: a.id(),
  }),

  WeeklyScore: a.model({
    userId: a.id(),
    user: a.belongsTo('User', 'userId'),
    weekStart: a.datetime().required(),
    weekEnd: a.datetime().required(),
    score: a.integer().required(),
    isComplete: a.boolean().required(),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
    dailyScores: a.hasMany('DailyScore', 'weeklyScoreId'),
  }),

  RankTier: a.model({
    name: a.string().required(),
    emoji: a.string().required(),
    minScore: a.integer().required(),
    maxScore: a.integer().required(),
    description: a.string().required(),
    userRanks: a.hasMany('UserRank', 'rankTierId'),
  }),

  UserRank: a.model({
    userId: a.id(),
    user: a.belongsTo('User', 'userId'),
    rankTierId: a.id(),
    rankTier: a.belongsTo('RankTier', 'rankTierId'),
    currentScore: a.integer().required(),
    progressInTier: a.float().required(),
    lastCalculatedAt: a.datetime().required(),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
  }),

  ReflectionOption: a.model({
    text: a.string().required(),
    score: a.integer().required(),
    reflectionType: a.enum(['tried_life_happened', 'priorities_shifted', 'not_today', 'did_it']),
    reflections: a.hasMany('Reflection', 'reflectionOptionId'),
  }),
}).authorization((allow) => [
  allow.owner().to(['create', 'read', 'update', 'delete']),
  // allow.publicApiKey().to(['read']),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
