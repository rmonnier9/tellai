import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
export * from './generated/enums';
import { attachDatabasePool } from '@vercel/functions';

const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  attachDatabasePool(pool);

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: [
      'error',
      // {
      //   emit: 'event',
      //   level: 'query',
      // },
    ],
  });
  // .$on('query', async (e) => {
  //   console.log(`${e.query} ${e.params}`);
  // })
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
