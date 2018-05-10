'use strict'

const Rx = require('rxjs');
const EventResult = require('./entities/Event');

class EventStore {


    /**
     * Create a new EventStore
     * 
     * @param {Object} brokerConfig 
     *    {
     *        type,
     *        eventsTopic,
     *        brokerUrl,
     *        eventsTopicSubscription,
     *        projectId,
     *    }         
     * @param {Object} storeConfig 
     *      {
     *        type,
     *        url,
     *        eventStoreDbName,
     *        aggregatesDbName
     *       }
     */
    constructor(brokerConfig, storeConfig) {
        switch (brokerConfig.type) {
            case "PUBSUB":
                const PubSubBroker = require('./broker/PubSubBroker');
                this.broker = new PubSubBroker(brokerConfig);
                break;
            case "MQTT":
                const MqttBroker = require('./broker/MqttBroker');
                this.broker = new MqttBroker(brokerConfig);
                break;
            default:
                throw new Error(`Invalid EventStore broker type: ${brokerConfig.type} `);
        }

        switch (storeConfig.type) {
            case "MONGO":
                const MongoStore = require('./store/MongoStore');
                this.storeDB = new MongoStore(storeConfig);
                break;
            default:
                throw new Error(`Invalid EventStore store type: ${storeConfig.type} `);
        }
    }

    /**
     * Starts Event Broker + Store
     */
    start$() {
        return Rx.Observable.merge(
            this.broker.start$(),
            this.storeDB.start$()
        );
    }

    /**
     * Stops Event Broker + Store
     */
    stop$() {
        return Rx.Observable.merge(
            this.broker.stop$(),
            this.storeDB.stop$()
        );
    }

    /**
     * Appends and emit a new Event
     * 
     * @param {Event} event Event to store and emit
     * 
     * Returns an obseravable that resolves to:
     * {
     *  storeResult :  {aggregate,event,versionTimeStr},
     *  brokerResult: { messageId }
     * }
     * 
     * where:
     *  - aggregate = current aggregate state
     *  - event = persisted event
     *  - versionTimeStr = EventStore date index where the event was store
     *  - messageId: sent message ID
     *      
     */
    emitEvent$(event) {
        return this.storeDB.pushEvent$(event)
            .concatMap((storeResult) =>
                this.broker.publish$(storeResult.event)
                    .map(messageId => {
                        return { storeResult, brokerResult: { messageId } };
                    })
            );
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
    retrieveEvents$(aggregateType, aggregateId, version = 0, limit = 20) {
        return this.storeDB.getEvents$(aggregateType, aggregateId, version, limit)
    }

    /**
     * Find Aggregates that were created after the given date
     * 
     * @param {string} type 
     * @param {number} createTimestamp 
     * @param {Object} ops {offset,pageSize}
     * 
     * Returns an observable that publish every found aggregate 
     */
    findAgregatesCreatedAfter$(type, createTimestamp = 0) {
        return this.storeDB.findAgregatesCreatedAfter$(type, createTimestamp);
    }

    /**
     * Returns an Observable that will emit any event related to the given aggregateType
     * @param {string} aggregateType 
     */
    getEventListener$(aggregateType, ignoreSelfEvents = true) {
        return this.broker.getEventListener$(aggregateType, ignoreSelfEvents);
    }
}

module.exports = EventStore;