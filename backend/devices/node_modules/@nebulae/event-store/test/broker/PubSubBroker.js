// TEST LIBS
const assert = require('assert');
const Rx = require('rxjs');

//LIBS FOR TESTING
const PubSubBroker = require('../../lib/broker/PubSubBroker');
const Event = require('../../lib/entities/Event');

//GLOABAL VARS to use between tests
let broker = {};
let subscription = {};
let event = new Event(
    {
        eventType: 'TestCreated', eventTypeVersion: 1,
        aggregateType: 'Test', aggregateId: 1,
        data: { id: 1, name: 'x' },
        user: 'Mocha', aggregateVersion: 1
    });



describe('PUBSUB BROKER', function () {
    describe('Prepare pubsub broker', function () {
        it('instance PubSubBroker', function (done) {
            //ENVIRONMENT VARS
            process.env.GOOGLE_APPLICATION_CREDENTIALS = "/Users/sebastianmolano/NebulaE/Projects/TPM/gateway/etc/gcloud-service-key.json";
            const eventsTopic = 'Test';
            const eventsTopicSubscription = 'TestSubscription';
            broker = new PubSubBroker({ eventsTopic, eventsTopicSubscription });
            assert.ok(true, 'PubSubBroker constructor worked');
            return done();
        });
        it('start PubSubBroker', function (done) {
            subscription = broker.start$()
                .subscribe(
                    (evt) => console.log(`start PubSubBroker: ${evt}`),
                    (error) => {
                        console.error(`error starting PubSubBroker`, error);
                        return done(error);
                    },
                    () => {
                        console.log('PubSubBroker Broker started!');
                        return done();
                    }
                );
        });
    });
    describe('Publish and listen on PubSub', function () {
        it('Publish event and recive my own event on PubSub', function (done) {
            this.timeout(10000);
            let event1 = new Event(
                {
                    eventType: 'TestCreated', eventTypeVersion: 1,
                    aggregateType: 'Test', aggregateId: 1,
                    data: { id: 1, name: 'x' },
                    user: 'Mocha', aggregateVersion: 1
                });
            //let event1 = new Event('Test', 1, 'TestCreated', { id: 1, name: 'x' }, 'Mocha');
            broker.getEventListener$('Test', false)
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
            broker.publish$(event1).subscribe(
                () => { },
                (err) => console.error(err),
                () => { }
            );
        });
        it('Publish event and DO NOT recieve my own event on PubSubBroker', function (done) {
            let event2 = new Event('TestCreated', 1, 'Test', 1, 1, { id: 1, name: 'x' }, 'Mocha');
            broker.getEventListener$('Test')
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
            broker.publish$(event2).subscribe(
                () => { },
                (err) => console.error(err),
                () => { }
            );
        });
    });
    describe('de-prepare PubSub broker', function () {
        it('stop PubSubBroker', function (done) {
            broker.stop$()
                .subscribe(
                    (evt) => console.log(`stop PubSubBroker: ${evt}`),
                    (error) => {
                        console.error('Error stopping PubSubBroker', error);
                        return done(error);
                    },
                    () => {
                        console.log('PubSubBroker broker stoped');
                        subscription.unsubscribe();
                        return done();
                    }
                );
        });
    });
});
