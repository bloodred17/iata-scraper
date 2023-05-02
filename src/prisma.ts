import {Injectable} from "anti-di";
import {PrismaClient} from '@prisma/client'

export class Prisma extends Injectable {
  private _client = new PrismaClient();

  get client() {
    return this._client;
  }
}
