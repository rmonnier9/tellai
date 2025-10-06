import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
// import { LibSQLStore } from '@mastra/libsql';
import { PostgresStore } from '@mastra/pg';

import { weatherAgent } from './agents/weather-agent';
import { businessDataExtractorWorkflow } from '../workflows/business-data-extractor';
import { keywordIdeasGeneratorWorkflow } from '../workflows/keyword-ideas-generator';
import { articleContentGeneratorWorkflow } from '../workflows/article-content-generator';

export const mastra = new Mastra({
  agents: { weatherAgent },
  workflows: {
    businessDataExtractorWorkflow,
    keywordIdeasGeneratorWorkflow,
    articleContentGeneratorWorkflow,
  },
  // storage: new LibSQLStore({
  //   // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
  //   url: ":memory:",
  // }),
  // storage: new PostgresStore({
  //   // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
  //   connectionString: process.env.DATABASE_URL!,
  //   schemaName: 'mastra',
  // }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
