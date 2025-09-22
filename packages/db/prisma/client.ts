import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

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
