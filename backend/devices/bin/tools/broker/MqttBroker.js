'use strict'

const MQTT = require("async-mqtt");
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');

class MqttBroker {

    constructor({ mqttServerUrl, replyTimeout }) {
        this.mqttServerUrl = mqttServerUrl;
        this.senderId = uuidv4();
        this.replyTimeout = replyTimeout;
        /**
         * Rx Subject for incoming messages
         */
        this.incomingMessages$ = new Rx.BehaviorSubject();
        /**
         * MQTT Client
         */
        this.listeningTopics = [];
        this.mqttClient = MQTT.connect(this.mqttServerUrl);
        this.mqttClient.on('connect', () => console.log(`Mqtt client connected`));
        this.mqttClient.on('message', (topic, message) => {
            const envelope = JSON.parse(message);
            // message is Buffer
            this.incomingMessages$.next(
                {
                    topic: topic,
                    id: envelope.id,
                    type: envelope.type,
                    data: envelope.data,
                    attributes: envelope.attributes,
                    correlationId: envelope.attributes.correlationId
                }
            );
        });
    }

    /**
     * Sends a Message to the given topic
     * @param {string} topic topic to publish
     * @param {string} type message type
     * @param {Object} message payload
     * @param {Object} ops {correlationId, messageId} 
     */
    send$(topic, type, payload, ops = {}) {
        return this.publish$(topic, type, payload, ops);
    }

    /**
     * Sends a Message to the given topic and wait for a reply
     * @param {string} topic send topic
     * @param {string} responseTopic response topic
     * @param {string} type message(payload) type
     * @param {Object} message payload
     * @param {number} timeout wait timeout millis
     * @param {boolean} ignoreSelfEvents ignore messages comming from this clien
     * @param {Object} ops {correlationId, messageId}
     * 
     * Returns an Observable that resolves the message response
     */
    sendAndGetReply$(topic, responseTopic, type, payload, timeout = this.replyTimeout, ignoreSelfEvents = true, ops = {}) {
        return this.send$(topic, type, payload, ops)
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
     * Publish data throught a topic
     * Returns an Observable that resolves to the sent message ID
     * @param {string} topicName 
     * @param {string} type message(data) type 
     * @param {Object} data 
     * @param {Object} ops {correlationId, messageId} 
     */
    publish$(topicName, type, data, { correlationId, messageId } = {}) {
        const uuid = messageId || uuidv4();
        const dataBuffer = JSON.stringify(
            {
                id: uuid,
                type,
                data,
                attributes: {
                    senderId: this.senderId,
                    correlationId
                }
            }
        );
        return Rx.Observable.fromPromise(this.mqttClient.publish(`${topicName}`, dataBuffer, { qos: 0 }))
            .mapTo(uuid);
    }


    /**
     * Config the broker to listen to several topics
     * Returns an observable that resolves to a stream of subscribed topics
     * @param {Array} topics topics to listen
     */
    configMessageListener$(topics) {
        return Rx.Observable.from(topics)
            .filter(topic => this.listeningTopics.indexOf(topic) === -1)
            .mergeMap(topic =>
                Rx.Observable.fromPromise(this.mqttClient.subscribe(topic))
                    .map(() => {
                        this.listeningTopics.push(topic);
                        return topic;
                    })
            ).reduce((acc, topic) => {
                acc.push(topic);
                return acc;
            }, []);
    }

    /**
     * Disconnect the broker and return an observable that completes when disconnected
     */
    disconnectBroker$() {
        return Rx.Observable.fromPromise(this.mqttClient.end());
    }
}

module.exports = MqttBroker;