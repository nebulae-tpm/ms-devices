'use strict'

const Rx = require('rxjs');
const MongoClient = require('mongodb').MongoClient;
const Event = require('../entities/Event');

class MongoStore {

    constructor({ url, eventStoreDbName, aggregatesDbName }) {
        this.url = url;
        this.eventStoreDbName = eventStoreDbName;
        this.aggregatesDbName = aggregatesDbName;
    }

    /**
     * Starts DB connections
     * Returns an Obserable that resolves to each coneection result
     */
    start$() {
        return Rx.Observable.bindNodeCallback(MongoClient.connect)(this.url)
            .map(client => {
                this.mongoClient = client;
                this.aggregatesDb = this.mongoClient.db(this.aggregatesDbName);
                return `MongoStore DB connected`;
            });
    }



    /**
     * Push an event into the store
     * Returns an observable that resolves to {aggregate,event,versionTimeStr}
     * where:
     *  - aggregate = current aggregate state
     *  - event = persisted event
     *  - versionTimeStr = EventStore date index where the event was store
     * 
     * @param {Event} event 
     */
    pushEvent$(event) {
        if (!event.timestamp) {
            event.timestamp = Date.now();
        }
        return this.incrementAggregateVersionAndGet$(event.at, event.aid, event.timestamp)
            .mergeMap(([aggregate, versionTimeStr]) => {
                event.av = aggregate.version;
                const eventStoreDb = this.mongoClient.db(`${this.eventStoreDbName}_${versionTimeStr}`);
                const collection = eventStoreDb.collection('Events');
                return Rx.Observable.fromPromise(collection.insertOne(
                    event,
                    { writeConcern: { w: "majority", wtimeout: 500, j: true } }
                ))
                    .mapTo({ aggregate, event, versionTimeStr });
            })
            ;
    }

    /**
     * Increments the aggregate version and return the aggregate itself
     * Returns an observable that resolve to the an array: [Aggregate, TimeString]
     * the TimeString is the name postfix of the EventStore DB where this aggregate version must be persisted
     * @param {string} type 
     * @param {string} id 
     * @param {number} versionTime 
     */
    incrementAggregateVersionAndGet$(type, id, versionTime) {
        // Get the documents collection        
        const collection = this.aggregatesDb.collection('Aggregates');
        //if the versionTime is not provided (production), then we generate with the current date time
        if (!versionTime) {
            versionTime = Date.now();
        }
        const versionDate = new Date(versionTime);
        const versionTimeStr = versionDate.getFullYear() + ("0" + (versionDate.getMonth() + 1)).slice(-2);

        return this.getAggreate$(type, id, true, versionTime)
            .switchMap(findResult => {
                const index = findResult.index && findResult.index[versionTimeStr] ? findResult.index[versionTimeStr] : { initVersion: findResult.version ? findResult.version + 1 : 1, initTime: findResult.versionTime };
                index.endVersion = findResult.version + 1;
                index.endTime = findResult.versionTime;

                const update = {
                    $inc: { version: 1 },
                    $set: {
                        versionTime,
                    }
                };
                update['$set'][`index.${versionTimeStr}`] = index;
                return Rx.Observable.bindNodeCallback(collection.findOneAndUpdate.bind(collection))(
                    { type, id },
                    update,
                    {
                        upsert: true,
                        returnOriginal: false
                    });
            })
            .pluck('value')
            .map(aggregate => [aggregate, versionTimeStr])
            ;
    }


    /**
     * Query an Aggregate in the store 
     * Returns an observable that resolve to the Aggregate 
     * @param {string} type 
     * @param {string} id 
     * @param {boolean} createIfNotExists if true, creates the aggregate if not found
     * @param {number} versionTime create time to set, ONLY FOR TESTING
     */
    getAggreate$(type, id, createIfNotExists = false, versionTime) {
        //if the versionTime is not provided (production), then we generate with the current date time
        if (!versionTime) {
            versionTime = Date.now();
        }
        // Get the documents collection        
        const collection = this.aggregatesDb.collection('Aggregates');
        return Rx.Observable.bindNodeCallback(collection.findOneAndUpdate.bind(collection))(
            {
                type, id
            },
            {
                $setOnInsert: {
                    creationTime: versionTime,
                },
            },
            {
                upsert: createIfNotExists,
                returnOriginal: false
            }
        )
            .map(result => result && result.value ? result.value : undefined)
            ;
    }


    /**
     * Find all events of an especific aggregate
     * @param {String} aggregateType Aggregate type
     * @param {String} aggregateId Aggregate Id
     * @param {number} version version to recover from (exclusive), defualt = 0
     * @param {limit} limit max number of events to return, default = 20
     * 
     * Returns an Observable that emits each found event one by one
     */
    getEvents$(aggregateType, aggregateId, version = 0, limit = 20) {
        const minVersion = version + 1;
        const maxVersion = version + limit;
        //console.log(`====== getEvents$: minVersion=${minVersion}, maxVersion=${maxVersion}`);
        return this.getAggreate$(aggregateType, aggregateId)
            .map(aggregate => {
                if (!aggregate) {
                    throw new Error(`Aggregate not found: aggregateType=${aggregateType}  aggregateId=${aggregateId}`);
                }
                return aggregate;
            })
            .switchMap(aggregate =>
                Rx.Observable.from(Object.entries(aggregate.index))
                    .filter(([time, index]) => minVersion <= index.endVersion)
                    //.do(([time, index]) => console.log(`======== selected time frame: ${time}`))
                    .map(([time, index]) => {
                        const eventStoreDb = this.mongoClient.db(`${this.eventStoreDbName}_${time}`);
                        const collection = eventStoreDb.collection('Events');
                        const lowLimit = minVersion > index.initVersion ? minVersion : index.initVersion;
                        const highLimit = maxVersion < index.endVersion ? maxVersion : index.endVersion;
                        const realLimit = highLimit - lowLimit + 1;
                        //console.log(`========== ${time}: lowLimit=${lowLimit} highLimit=${highLimit}  realLimit=${realLimit} `);
                        return Rx.Observable.bindNodeCallback(collection.find.bind(collection))({
                            at: aggregateType,
                            aid: aggregateId,
                            av: { $gt: version }
                        })
                            .concatMap(cursor => Rx.Observable.range(lowLimit, realLimit).mapTo(cursor))
                            .concatMap(cursor => Rx.Observable.fromPromise(this.extractNextFromMongoCursor(cursor)))
                    })
                    .concatAll()
                    //.do(data => console.log(`============ ${data ? data.av : 'null'}`))
                    .filter(data => data)
                    .take(limit)
            )
    }

    /**
     * Extracts the next value from a mongo cursos if available, returns undefined otherwise
     * @param {*} cursor 
     */
    async extractNextFromMongoCursor(cursor) {
        const hasNext = await cursor.hasNext();
        if (hasNext) {
            const obj = await cursor.next();
            return obj;
        }
        return undefined;
    }


    /**
     * Find Aggregates that were created after the given date
     * Returns an observable that publish every aggregate found
     * @param {string} type 
     * @param {number} createTimestamp 
     * @param {Object} ops {offset,pageSize}
     * 
     */
    findAgregatesCreatedAfter$(type, createTimestamp = 0) {
        return Rx.Observable.create(async observer => {
            const collection = this.aggregatesDb.collection('Aggregates');
            const cursor = collection.find({ creationTime: { $gt: createTimestamp }, type: type });
            let obj = await this.extractNextFromMongoCursor(cursor);
            while (obj) {
                observer.next(obj);
                obj = await this.extractNextFromMongoCursor(cursor);
            }
            
            observer.complete();
        });
    }




    /**
     * stops DB connections
     * returns an observable that resolves to text result of each closing db
     */
    stop$() {
        return Rx.Observable.create(observer => {
            this.mongoClient.close();
            observer.next('Mongo DB client closed');
            observer.complete();
        });
    }
}

module.exports = MongoStore;