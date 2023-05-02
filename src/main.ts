import {exampleScrape} from './iata.scraper'
import {Prisma} from "./prisma";


(async () => {
  const prisma = Prisma.getInstance<Prisma>(Prisma);
  await prisma.client.$connect();
  const data = await exampleScrape();
  console.log(data);
  await prisma.client.$disconnect();
  process.exit();
})()
