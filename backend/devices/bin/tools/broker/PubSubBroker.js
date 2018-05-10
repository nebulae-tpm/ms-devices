'use strict'

const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');

class PubSubBroker {

    constructor({ replyTimeOut }) {
        this.replyTimeOut = replyTimeOut;

        /**
         * Rx Subject for every message reply
         */
        this.incomingMessages$ = new Rx.BehaviorSubject();
        this.senderId = uuidv4();
        /**
         * Map of verified topics
         */
        this.verifiedTopics = {};
        this.listeningTopics = {};

        const PubSub = require('@google-cloud/pubsub');
        this.pubsubClient = new PubSub({
        });
    }

    /**
     * Sends a Message to the given topic
     * @param {string} topic topic to publish
     * @param {string} type message type
     * @param {Object} message payload
     * @param {Object} ops {correlationId} 
     */
    send$(topic, type, payload, ops = {}) {
        return this.getTopic$(topic)
            .switchMap(topic => this.publish$(topic, type, payload, ops))
    }

    /**
     * Sends a Message to the given topic and wait for a reply
     * @param {string} topic send topic
     * @param {string} responseTopic response topic
     * @param {string} type message(payload) type
     * @param {Object} message payload
     * @param {number} timeout wait timeout millis
     * @param {boolean} ignoreSelfEvents ignore messages comming from this clien
     * @param {Object} ops {correlationId}
     * 
     * Returns an Observable that resolves the message response
     */
    sendAndGetReply$(topic, responseTopic, type, payload, timeout = this.replyTimeout, ignoreSelfEvents = true, ops = {}) {
        return this.forward$(topic, type, payload, ops)
            .switchMap((messageId) => this.getMessageReply$(responseTopic, messageId, timeout, ignoreSelfEvents))
    }


    /**
     * Returns an observable that waits for the message response or throws an error if timeout is exceded
     * @param {string} topic response topic
     * @param {string} correlationId 
     * @param {number} timeout 
     */
    getMessageReply$(topic, correlationId, timeout = this.replyTimeout, ignoreSelfEvents = true) {
        return this.configMessageListener$([topic])
            .switchMap(() =>
                this.incomingMessages$
                    .filter(msg => msg)
                    .filter(msg => !ignoreSelfEvents || msg.attributes.senderId !== this.senderId)
                    .filter(msg => msg && msg.correlationId === correlationId)
                    .map(msg => msg.data)
                    .timeout(timeout)
                    .first());
    }

    /**
     * Returns an Observable that will emit any message
     * @param {string[] ?} topics topic to listen
     * @param {string[] ?} types message types to listen
     * @param {boolean ?} ignoreSelfEvents 
     */
    getMessageListener$(topics = [], types = [], ignoreSelfEvents = true) {
        return this.configMessageListener$(topics)
            .switchMap(() =>
                this.incomingMessages$
                    .filter(msg => msg)
                    .filter(msg => !ignoreSelfEvents || msg.attributes.senderId !== this.senderId)
                    .filter(msg => topics.length === 0 || topics.indexOf(msg.topic) > -1)
                    .filter(msg => types.length === 0 || types.indexOf(msg.type) > -1)
            );
    }

    /**
     * Config the broker to listen to several topics
     * Returns an observable that resolves to a stream of subscribed topics
     * @param {Array} topics topics to listen
     */
    configMessageListener$(topics) {
        return Rx.Observable.create((observer) => {
            Rx.Observable.from(topics)
                .filter(topicName => Object.keys(this.listeningTopics).indexOf(topicName) === -1)
                .mergeMap(topicName => {
                    const subscriptionName = `${topicName}_devices`;

                    return this.getSubscription$(topicName, subscriptionName)
                        .map(subsription => { 
                            return { topicName, subsription, subscriptionName };
                         })
                })
                .subscribe(
                    ({ topicName, subsription, subscriptionName }) => {
                        this.listeningTopics[topicName] = subscriptionName;
                        subsription.on(`message`, message => {
                            // console.log(`Received message ${message.id}:`);
                            this.incomingMessages$.next(
                                {
                                    id: message.id,
                                    data: JSON.parse(message.data),
                                    attributes: message.attributes,
                                    correlationId: message.attributes.correlationId,
                                    topic: topicName,
                                    type: message.attributes.type,
                                }
                            );
                            message.ack();
                        });
                        observer.next(topicName);
                    },
                    (err) => {
                        console.error('Failed to obtain GatewayReplies subscription', err);
                        observer.error(err);
                    },
                    () => {
                        observer.complete();
                    }

                )
        })
            .reduce((acc, topic) => {
                acc.push(topic);
                return acc;
            }, []);

        ;

    }


    /**
     * Gets an observable that resolves to the topic object
     * @param {string} topicName 
     */
    getTopic$(topicName) {
        //Tries to get a cached topic
        const cachedTopic = this.verifiedTopics[topicName];
        if (!cachedTopic) {
            //if not cached, then tries to know if the topic exists
            const topic = this.pubsubClient.topic(topicName);

            return Rx.Observable.fromPromise(topic.exists())
                .map(data => data[0])
                .switchMap(exists => {
                    if (exists) {
                        //if it does exists, then store it on the cache and return it
                        this.verifiedTopics[topicName] = topic;
                        console.log(`Topic ${topicName} already existed and has been set into the cache`);
                        return Rx.Observable.of(topic);
                    } else {
                        //if it does NOT exists, then create it, store it in the cache and return it
                        return this.createTopic$(topicName);
                    }
                })
                ;
        }
        //return cached topic
        return Rx.Observable.of(cachedTopic);
    }

    /**
     * Creates a Topic and return an observable that resolves to the created topic
     * @param {string} topicName 
     */
    createTopic$(topicName) {
        return Rx.Observable.fromPromise(this.pubsubClient.createTopic(topicName))
            .switchMap(data => {
                this.verifiedTopics[topicName] = this.pubsubClient.topic(topicName);
                return Rx.Observable.of(this.verifiedTopics[topicName]);
            });
    }

    /**
    * Publish data throught a topic
    * Returns an Observable that resolves to the sent message ID
    * @param {Topic} topic 
    * @param {string} type message(data) type 
    * @param {Object} data 
    * @param {Object} ops {correlationId} 
    */
    publish$(topic, type, data, { correlationId } = {}) {
        const dataBuffer = Buffer.from(JSON.stringify(data));
        return Rx.Observable.fromPromise(
            topic.publisher().publish(
                dataBuffer,
                {
                    type,
                    senderId: this.senderId,
                    correlationId
                }))
            //.do(messageId => console.log(`Message published through ${topic.name}, MessageId=${messageId}`))
            ;
    }

    /**
     * Returns an Observable that resolves to the subscription
     * @param {string} topicName 
     * @param {string} subscriptionName 
     */
    getSubscription$(topicName, subscriptionName) {
        return this.getTopic$(topicName)
            .switchMap(topic => Rx.Observable.fromPromise(
                topic.subscription(subscriptionName)
                    .get({ autoCreate: true }))
            ).map(results => results[0]);
    }

    /**
     * Stops broker 
     */
    disconnectBroker() {
        return Rx.Observable.create((observer) => {
            Rx.Observable.from(Object.entries(listeningTopics))
                .mergeMap(([topicName, subscriptionName]) => this.getSubscription$(topicName, subscriptionName))
                .subscribe(
                    (subscription) => {
                        subscription.removeListener(`message`);
                        observer.next(`Removed listener for ${subscription}`);
                    },
                    (error) => {
                        console.error(`Error disconnecting Broker`, error);
                        observer.error(error);
                    },
                    () => {
                        observer.complete();
                    }
                );
        });
    }
}

module.exports = PubSubBroker;