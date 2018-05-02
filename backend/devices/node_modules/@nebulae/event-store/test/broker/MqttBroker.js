// TEST LIBS
const assert = require('assert');
const Rx = require('rxjs');

//LIBS FOR TESTING
const MqttBroker = require('../../lib/broker/MqttBroker');
const Event = require('../../lib/entities/Event');

//GLOABAL VARS to use between tests
let mqttBroker = {};
let eventMqtt = new Event(
    {
        eventType: 'TestCreated', eventTypeVersion: 1,
        aggregateType: 'Test', aggregateId: 1,
        data: { id: 1, name: 'x' },
        user: 'Mocha', aggregateVersion: 1
    });


/*
NOTES:
before run please start mqtt:
  docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto  
*/

describe('MQTT BROKER', function () {
    describe('Prepare mqtt broker', function () {
        it('instance MqttBroker', function (done) {
            //ENVIRONMENT VARS
            const brokerUrl = 'mqtt://localhost:1883';
            const projectId = 'MqttBrokerTest';
            const eventsTopic = 'MqttBrokerTest';
            mqttBroker = new MqttBroker({ brokerUrl, eventsTopic, projectId });
            assert.ok(true, 'MqttBroker constructor worked');            
            return done();
        });
        it('start MqttBroker', function (done) {
            mqttBroker.start$()
            .subscribe(
                (evt) => console.log(`start MqttBroker: ${evt}`),
                (error) => {
                    console.error(`error starting MqttBroker`,error);
                    return done(error);
                },
                () => { 
                    console.log('MQTT Broker started!');
                    return done();
                }
            );
        });
    });
    describe('Publish and listen on MQTT', function () {
        it('Publish event and recive my own event on MQTT', function (done) {
            this.timeout(10000);
            let event1 = new Event(
                {
                    eventType: 'TestCreated', eventTypeVersion: 1,
                    aggregateType: 'Test', aggregateId: 1,
                    data: { id: 1, name: 'x' },
                    user: 'Mocha', aggregateVersion: 1
                });
            //let event1 = new Event('Test', 1, 'TestCreated', { id: 1, name: 'x' }, 'Mocha');
            mqttBroker.getEventListener$('Test', false)
                .first()
                //.timeout(1500)
                .subscribe(
                    (evt) => {
                        incomingEvent = evt;
                        //console.log('==============> Expected message -> ', event1.timestamp + " -- "+ evt.timestamp);
                        assert.deepEqual(evt, event1);
                    },
                    error => {
                        return done(new Error(error));
                    },
                    () => {
                        return done();
                    }
                );
            mqttBroker.publish$(event1).subscribe(
                () => { },
                (err) => console.error(err),
                () => { }
            );
        });
        it('Publish event and DO NOT recieve my own event on MQTT', function (done) {
            let event2 = new Event('TestCreated', 1, 'Test', 1, 1, { id: 1, name: 'x' }, 'Mocha');
            mqttBroker.getEventListener$('Test')
                .first()
                .timeout(500)
                .subscribe(
                    (evt) => {
                        incomingEvent = evt;
                        //console.log('==============> Unexpected message -> ', event2.timestamp + " -- "+ evt.timestamp);
                        assert.notDeepEqual(evt, event2);
                        //assert.fail(evt, 'nothing', 'Seems I have recieved the same evt I just sent');
                    },
                    error => {
                        assert.equal(error.name, 'TimeoutError');
                        return done();
                    },
                    () => {
                        return done();
                    }
                );
            mqttBroker.publish$(event2).subscribe(
                () => { },
                (err) => console.error(err),
                () => { }
            );
        });
    });
    describe('de-prepare mqtt broker', function () {
        it('stop MqttBroker', function (done) {            
            mqttBroker.stop$()
            .subscribe(
                (evt) => console.log(`stop MqttBroker: ${evt}`),
                (error) => {
                    console.error('Error stopping MqttBroker',error);
                    return done(error);
                },
                () => {
                    console.log('Mqtt broker stoped');
                    return done();
                }
            );            
        });
    });
});
