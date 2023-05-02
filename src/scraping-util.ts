import {Frame, Page} from "puppeteer";

export const delay =
  (timeout: number): Promise<void> =>
    new Promise((resolve) =>
      setTimeout(() => resolve(), timeout));

export async function injectJquery(page: Page | Frame, version?: string) {
  await page?.addScriptTag({
    url: `https://code.jquery.com/jquery-${version || '3.6.0'}.min.js`,
  });
}

export const range =
  ({to = 0, from = 0, step = 1, length = Math.ceil((to - from) / step)}) =>
    Array.from({length}, (_, i) => from + i * step)
