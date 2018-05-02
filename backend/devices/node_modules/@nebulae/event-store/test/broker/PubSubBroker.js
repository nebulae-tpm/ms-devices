// // TEST LIBS
// const assert = require('assert');
// const Rx = require('rxjs');

// //LIBS FOR TESTING
// const PubSubBroker = require('../../lib/broker/PubSubBroker');
// const Event = require('../../lib/entities/Event');

// //GLOABAL VARS to use between tests
// let pubsubBroker = {};
// let eventPubsub = new Event('Test', 1, 'TestCreated', { id: 1, name: 'x' }, 'Mocha');


// /*
// NOTES:
// before run please start pubsub configure pubsub
// */

// describe('PUBSUB BROKER', function () {
//     describe('Prepare broker', function () {
//         it('instance PubSubBroker', function (done) {
//             //ENVIRONMENT VARS
//             const GOOGLE_APPLICATION_CREDENTIALS = './etc/gcloud-service-key.json'
//             process.env.GOOGLE_APPLICATION_CREDENTIALS = GOOGLE_APPLICATION_CREDENTIALS;
//             const projectId = 'ne-tpm-prod';
//             const eventsTopic = 'events';
//             const eventsTopicSubscription = 'events-ms-test';
//             pubsubBroker = new PubSubBroker({ eventsTopic, projectId, eventsTopicSubscription });
//             assert.ok(true, 'PubSubBroker constructor worked');
//             return done();
//         });
//     });
//     describe('Publish and listen', function () {
//         it('Publish event and recive my own event', function (done) {
//             this.timeout(10000);
//             let event = new Event('TestCreated', 1, 'Test', 1, 1, { id: 1, name: 'x' }, 'Mocha');
//             pubsubBroker.getEventListener$('Test', false)
//                 .first()
//                 .timeout(6000)
//                 .subscribe(
//                     (evt) => {
//                         incomingEvent = evt;
//                         assert.deepEqual(evt, event);
//                     },
//                     error => {
//                         return done(new Error(error));
//                     },
//                     () => {
//                         return done();
//                     }
//                 );
//             pubsubBroker.publish$(event).subscribe(
//                 () => { },
//                 (err) => console.error(err),
//                 () => { }
//             );
//         });
//         it('Publish event and DO NOT recieve my own event', function (done) {
//             this.timeout(10000);
//             let event = new Event('TestCreated', 1, 'Test', 1, 1, { id: 1, name: 'x' }, 'Mocha');
//             pubsubBroker.getEventListener$('Test')
//                 .first()
//                 .timeout(6000)
//                 .subscribe(
//                     (evt) => {
//                         incomingEvent = evt;
//                         assert.notEqual(evt.timestamp, event.timestamp, 'Seems I have recieved and different evt');                        
//                         //assert.fail(evt, 'nothing', 'Seems I have recieved the same evt I just sent');
//                     },
//                     error => {
//                         assert.equal(error.name, 'TimeoutError');
//                         return done();
//                     },
//                     () => {
//                         return done();
//                     }
//                 );
//             pubsubBroker.publish$(event).subscribe(
//                 () => { },
//                 (err) => console.error(err),
//                 () => { }
//             );
//         });
//     });
//     describe('de-prepare broker', function () {
//         it('stop PubSubBroker', function (done) {            
//             pubsubBroker.stopListening();
//             assert.ok(true, 'PubsubBroker stoped');
//             return done();
//         });        
//     });
// });
