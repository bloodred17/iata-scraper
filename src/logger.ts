import {Injectable} from "anti-di";
import {readFile, writeFile} from 'fs/promises';

export class Logger extends Injectable {
  async createLastLog(alphabet: string, iteration: number, code?: string) {
    await writeFile(`./temp/lastLog.json`, JSON.stringify({alphabet, iteration, code}), {encoding: 'utf-8', flag: 'w'});
  }

  async readLastLog(): Promise<{ alphabet: string, iteration: number, code?: string } | null> {
    try {
      const data = await readFile(`./temp/lastLog.json`, {encoding: 'utf-8', flag: 'r'});
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
}
