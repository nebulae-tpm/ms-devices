'use strict'

const Rx = require('rxjs');
// Imports the Google Cloud client library
const uuidv4 = require('uuid/v4');
const PubSub = require('@google-cloud/pubsub');

class PubSubBroker {

    constructor({ eventsTopic, eventsTopicSubscription }) {
        //this.projectId = projectId;
        this.eventsTopic = eventsTopic;
        this.eventsTopicSubscription = eventsTopicSubscription;

        /**
         * Rx Subject for every incoming event
         */
        this.incomingEvents$ = new Rx.BehaviorSubject();
        this.senderId = uuidv4();

        this.pubsubClient = new PubSub({
            //projectId: projectId,
        });

        this.topic = this.pubsubClient.topic(eventsTopic);
    }

    /**
     * Starts Broker connections
     * Returns an Obserable that resolves to each connection result
     */
    start$() {
        return Rx.Observable.create(observer => {
            this.startMessageListener();
            observer.next(`Event Store PubSub Broker listening: Topic=${this.eventsTopic}, subscriptionName=${this.eventsTopicSubscription}`);
            observer.complete();
        });
    }

    /**
     * Disconnect the broker and return an observable that completes when disconnected
     */
    stop$() {
        return Rx.Observable.create(observer => {
            this.getSubscription$().subscribe(
                (subscription) => {
                    subscription.removeListener(`message`, this.onMessage);
                    observer.next(`Event Store PubSub Broker removed listener: Topic=${this.eventsTopic}, subscriptionName=${subscription}`);
                },
                (error) => observer.error(error),
                () => {
                    this.messageListenerSubscription.unsubscribe();
                    observer.complete();                    
                }
            );

        });

    }

    /**
     * Publish data throught the events topic
     * Returns an Observable that resolves to the sent message ID
     * @param {string} topicName 
     * @param {Object} data 
     */
    publish$(data) {
        const dataBuffer = Buffer.from(JSON.stringify(data));
        return Rx.Observable.fromPromise(
            this.topic.publisher().publish(
                dataBuffer,
                { senderId: this.senderId }))
            //.do(messageId => console.log(`PubSub Message published through ${this.topic.name}, Message=${JSON.stringify(data)}`))
            ;
    }

    /**
     * Returns an Observable that will emit any event related to the given aggregateType
     * @param {string} aggregateType 
     */
    getEventListener$(aggregateType, ignoreSelfEvents = true) {
        return this.incomingEvents$
            .filter(msg => msg)
            .filter(msg => !ignoreSelfEvents || msg.attributes.senderId !== this.senderId)
            .map(msg => msg.data)
            .filter(evt => evt.at === aggregateType)
    }


    /**
     * Returns an Observable that resolves to the subscription
     */
    getSubscription$() {
        return Rx.Observable.fromPromise(
            this.topic.subscription(this.eventsTopicSubscription)
                .get({ autoCreate: true }))
            .map(results => results[0]);
    }

    /**
     * Starts to listen messages
     */
    startMessageListener() {
        this.messageListenerSubscription = this.getSubscription$()
            .subscribe(
                (pubSubSubscription) => {
                    this.onMessage = message => {
                        message.ack();
                        //console.log(`Received message ${message.id}:`);                                                
                        this.incomingEvents$.next({
                            data: JSON.parse(message.data),
                            id: message.id,
                            attributes: message.attributes,
                            correlationId: message.attributes.correlationId
                        });
                        //console.log(`Execute ack message ${message.id}:`);                                                                                  
                    };
                    pubSubSubscription.on(`message`, this.onMessage);
                },
                (err) => {
                    console.error('Failed to obtain EventStore subscription', err);
                },
                () => {
                    console.log('GatewayEvents listener has completed!');
                }
            );
    }

}

module.exports = PubSubBroker;