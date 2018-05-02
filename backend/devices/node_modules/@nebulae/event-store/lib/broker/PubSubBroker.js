'use strict'

const Rx = require('rxjs');
// Imports the Google Cloud client library
const uuidv4 = require('uuid/v4');
const PubSub = require('@google-cloud/pubsub');

class PubSubBroker {

    constructor({ projectId, eventsTopic, eventsTopicSubscription }) {
        this.projectId = projectId;
        this.gatewayEventsTopic = eventsTopic;
        this.gatewayEventsTopicSubscription = eventsTopicSubscription;
                
        /**
         * Rx Subject for every incoming event
         */
        this.incomingEvents$ = new Rx.BehaviorSubject();        
        this.senderId = uuidv4();

        this.pubsubClient = new PubSub({
            projectId: projectId,
        });

        this.topic = this.pubsubClient.topic(eventsTopic);

        //lets start listening to messages
        this.startMessageListener();
    }


    /**
     * Publish data throught a the events topic
     * Returns an Observable that resolves to the sent message ID
     * @param {Object} data 
     */
    publish$(data) {
        const dataBuffer = Buffer.from(JSON.stringify(data));
        return Rx.Observable.fromPromise(
            this.topic.publisher().publish(dataBuffer,{senderId:this.senderId}))
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
            //.do(msg => console.log(`=============== ${ignoreSelfEvents} -- ${msg.attributes.senderId} vs ${this.senderId}`))
            .map(msg => msg.data)
            .filter(evt => evt.at === aggregateType);
    }

    /**
     * Returns an Observable that resolves to the subscription
     * @param {string} subscriptionName 
     */
    getSubscription$(subscriptionName) {
        return Rx.Observable.fromPromise(
            this.topic.subscription(subscriptionName)
                .get({ autoCreate: true }))
            .map(results => results[0]);
    }

    /**
     * Starts to listen messages
     */
    startMessageListener() {
        this.getSubscription$(this.gatewayEventsTopicSubscription)
            .subscribe(
                (pubSubSubscription) => {
                    pubSubSubscription.on(`message`, message => {
                        message.ack();
                        //console.log(`Received message ${message.id}:`);                                                
                        this.incomingEvents$.next({
                            data: JSON.parse(message.data),
                            id: message.id,
                            attributes: message.attributes
                        });              
                        //console.log(`Execute ack message ${message.id}:`);                                                                                  
                    });
                },
                (err) => {
                    console.error('Failed to obtain GatewayEvents subscription', err);
                },
                () => {
                    //console.log('GatewayEvents listener has completed!');
                }
            );
    }

    stopListening(){
        this.getSubscription$(this.gatewayEventsTopicSubscription).subscribe(
            (subscription) => subscription.removeListener(`message`)
        );
    }
}

module.exports = PubSubBroker;