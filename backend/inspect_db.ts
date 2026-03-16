
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const apiKeys = await prisma.apiKey.findMany({
    include: {
      organization: true
    }
  });
  console.log('API KEYS:', JSON.stringify(apiKeys, null, 2));

  const flags = await prisma.featureFlag.findMany({
    where: { key: 'ki-search' }
  });
  console.log('KI-SEARCH FLAGS:', JSON.stringify(flags, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
