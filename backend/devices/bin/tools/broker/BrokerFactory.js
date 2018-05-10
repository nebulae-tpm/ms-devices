'use strict'

let instance = null;

class BrokerFactory {
    /**
     * Factory instance and config
     */
    constructor() {
        switch (process.env.BROKER_TYPE) {
            case 'PUBSUB':
                const PubSubBroker = require('./PubSubBroker');
                this.broker = new PubSubBroker({
                    replyTimeout: process.env.REPLY_TIMEOUT || 2000
                });
                break;
            case 'MQTT':
                const MqttBroker = require('./MqttBroker');
                this.broker = new MqttBroker({
                    mqttServerUrl: process.env.MQTT_SERVER_URL,
                    replyTimeout: process.env.REPLY_TIMEOUT || 2000
                });
                break;
        }
    }
    /**
     * Get the broker instance
     */
    getBroker() {
        return broker
    }
}

module.exports = () => {
    if (!instance) {
        instance = new BrokerFactory();
        console.log('NEW instance!!');
    }
    return instance.broker;
};