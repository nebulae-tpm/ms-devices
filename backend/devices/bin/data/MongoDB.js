'use strict';

const Rx = require('rxjs');
const MongoClient = require('mongodb').MongoClient;

let instance = null;

class MongoDB {
  /**
   * initialize and configure Mongo DB
   * @param { { url, dbName } } ops
   */
  constructor({ url, dbName }) {
    this.url = url;
    this.dbName = dbName;
  }

  /**
   * Starts DB connections
   * Returns an Obserable that resolve to the DB client
   */
  start$() {
    return Rx.Observable.bindNodeCallback(MongoClient.connect)(this.url).map(
      client => {
        this.client = client;
        this.db = this.client.db(this.dbName);
        return `MongoDB connected to dbName= ${this.dbName}`;
      }
    );
  }
}

module.exports = () => {
  if (!instance) {
    instance = new MongoDB({
      url: process.env.MONGODB_URL,
      dbName: process.env.MONGODB_DB_NAME
    });
    console.log(`MongoDB instance created: ${process.env.MONGODB_DB_NAME}`);
  }
  return instance;
};
