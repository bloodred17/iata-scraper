import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import {Browser, executablePath} from "puppeteer";
import {injectJquery, range} from "./scraping-util";
import {Prisma} from "./prisma";
import {Logger} from "./logger";

puppeteer.use(StealthPlugin());

const scrape = async (browser: Browser, alphabet: string) => {
  const prisma= Prisma.getInstance<Prisma>(Prisma);
  const logger= Logger.getInstance<Logger>(Logger);

  const page = await browser.newPage();

  const domain = 'https://airportcodes.aero/';
  const url = `${domain}/iata/${alphabet}`;
  await page.goto(url, {waitUntil: 'networkidle0', timeout: 50_000});
  await injectJquery(page);

  const selector = `//table//tbody//tr`;
  const rows = await page.$x(selector);
  const length = rows?.length;

  const lastLog = await logger.readLastLog();
  for await (const index of range({from: 2, to: length, step: 1})) {
    if (lastLog && lastLog?.alphabet === alphabet && index <= lastLog?.iteration) {
      continue;
    }
    const [row] = await page.$x(`(${selector})[${index}]`)
    let result;
    try {
      result = await page.evaluate((node) => {
        const _row: any = {};
        $(node)?.find('td')?.each(function (this, jdx) {
          const value = $(this)?.text();
          switch (jdx) {
            case 0:
              _row.code = value;
              break;
            case 1:
              _row.icao = value;
              break;
          }
        });
        return _row;
      }, row);
    } catch (e) {
      throw new Error(`Index ${index} of Alphabet ${alphabet} failed`);
    }

    let details;
    try {
      const detailPage = await browser.newPage();
      await detailPage.goto(domain + result?.code, {waitUntil: 'networkidle0', timeout: 50_000});
      await injectJquery(detailPage);
      const detailSelector: string = '.contentbody table tbody';

      details = await detailPage.evaluate((_selector) => {
        const _details: any = {};
        $(_selector)?.find('tr')?.each(function (this) {
          const getKey = () => $(this)?.find('td')?.eq(0)?.text();
          const getVal = () => $(this)?.find('td')?.eq(1)?.text();
          switch (getKey()) {
            case 'Name':
              _details.name = getVal();
              break;
            case 'Country':
              _details.country = getVal();
              break;
            case 'Elevation':
              _details.elevation = getVal();
              break;
            case 'Latitude':
              _details.latitude = getVal();
              break;
            case 'Longitude':
              _details.longitude = getVal();
              break;
          }
        });
        return _details;

      }, detailSelector);
      await detailPage.close();
    } catch (e) {
      throw new Error(`Failed to fetch details for ${result?.iata}`);
    }

    const iata = {
      ...result,
      ...details,
    };
    console.log(iata);

    try {
      await prisma.client.iata_airports.create({data: iata});
      await logger.createLastLog(alphabet, index, iata?.code);
    } catch (e) {
    }
  }

  await page?.close();
};


export const exampleScrape = async () => {
  const logger= Logger.getInstance<Logger>(Logger);
  const browser: Browser = await puppeteer.launch({
    // headless: false,
    executablePath: executablePath(),
    args: ['--no-sandbox'],
  });

  try {
    const lastLog = await logger.readLastLog();
    const alphabets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    for await (const alphabet of alphabets) {
      if (lastLog && lastLog?.alphabet && alphabet < lastLog?.alphabet) {
        continue;
      }
      await scrape(browser, alphabet);
    }

    await browser?.close();

    // return title;
  } catch (e) {
    try {
      await browser?.close();
    } catch (err) {
      console.log('Failed to close page and browser. Probably closed');
    }
    throw e;
  }
}
