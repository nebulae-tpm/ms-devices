// TEST LIBS
const assert = require('assert');
const Rx = require('rxjs');
const should = require('chai').should();

//LIBS FOR TESTING
const MongoStore = require('../../lib/store/MongoStore');
const Event = require('../../lib/entities/Event');

//GLOABAL VARS to use between tests
let store = {};


/*
NOTES:
before run please start mongo:
  docker run --rm  -d  -p 27017:27017  mongo --storageEngine wiredTiger
*/

describe('MONGO STORE', function () {
    describe('Prepare store', function () {
        it('instance MongoStore', function (done) {
            store = new MongoStore({ url: 'mongodb://localhost:27017', aggregatesDbName: 'Aggregates', eventStoreDbName: 'EventStore' });
            store.start$()
                .subscribe(
                    () => {
                    },
                    (error) => {
                        console.error(`Failed to connect MongoStore`);
                        return done(error);
                    },
                    () => {
                        console.log(`MongoStore connected`);
                        should.exist(store.mongoClient, 'mongoClient not defined');
                        should.exist(store.aggregatesDb, 'aggregatesDb not defined');
                        return done();
                    }
                );
        });
    });
    describe('Aggregates store', function () {
        it('increment and get aggregate version', function (done) {
            const aggreateType = 'TestAggregate_increment_version';
            const aggreateId = '1234567890';
            Rx.Observable.concat(
                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId),
                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId),
                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId))
                .reduce((acc, val) => { acc.push(val); return acc; }, [])
                .subscribe(
                    ([[v1, t1], [v2, t2], [v3, t3]]) => {
                        assert.equal(v2.version, v1.version + 1);
                        assert.equal(v3.version, v2.version + 1);
                    },
                    (error) => {
                        console.log(`Error incrementing and getting Aggregate versions`, error);
                        return done(error);
                    },
                    () => {
                        return done();
                    }
                );
        });
        it('increment and get aggregate version setting fixed version time', function (done) {
            const aggreateType = 'TestAggregate_increment_version_fixed_time';
            const aggreateId = Math.random();
            const monthTime = 1000 * 86400 * 30;
            const time1 = Date.now();
            const time2 = Date.now() + monthTime;
            const time3 = Date.now() + monthTime + monthTime;
            const minute = 60000;
            Rx.Observable.concat(
                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId, (time1)),
                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId, (time1 + minute)),
                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId, (time1 + minute + minute)),

                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId, (time2)),
                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId, (time2 + minute)),
                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId, (time2 + minute + minute)),

                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId, (time3)),
                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId, (time3 + minute)),
                store.incrementAggregateVersionAndGet$(aggreateType, aggreateId, (time3 + minute + minute)),
            ).reduce((acc, val) => { acc.push(val); return acc; }, [])
                .subscribe(
                    ([[v1], [v2], [v3], [v4], [v5], [v6], [v7], [v8], [v9]]) => {

                        // assert version incremental
                        assert.equal(v2.version, v1.version + 1);
                        assert.equal(v3.version, v2.version + 1);
                        assert.equal(v4.version, v3.version + 1);
                        assert.equal(v5.version, v4.version + 1);
                        assert.equal(v6.version, v5.version + 1);
                        assert.equal(v7.version, v6.version + 1);
                        assert.equal(v8.version, v7.version + 1);
                        assert.equal(v9.version, v8.version + 1);

                        //chech every month index has 3 records
                        Object.keys(v9.index).forEach(indexTag => {
                            assert.equal((v9.index[indexTag].endVersion - v9.index[indexTag].initVersion), 2);
                        })

                        // assert(v9.version, v8.version + 1);                        
                        // assert(parseInt(Object.keys(v4.index)[0]), parseInt(Object.keys(v1.index)[0]) + 1);

                    },
                    (error) => {
                        console.log(`Error incrementing and getting Aggregate versions fixing times`, error);
                        return done(error);
                    },
                    () => {
                        return done();
                    }
                );
        });

        it('get aggregates created after a date', function (done) {
            this.timeout(3000);
            
            const aggreateType = 'TestAggregate_icreated_after_date_'+Math.random();
            const aggreateId = Math.random();
            const monthTime = 1000 * 86400 * 30;
            const time1 = Date.now();
            const time2 = Date.now() + monthTime;
            const time3 = Date.now() + monthTime + monthTime;
            const minute = 60000;

            Rx.Observable.concat(
                store.incrementAggregateVersionAndGet$(aggreateType, Math.random(), (time1)),
                store.incrementAggregateVersionAndGet$(aggreateType, Math.random(), (time1 + minute)),
                store.incrementAggregateVersionAndGet$(aggreateType, Math.random(), (time1 + minute + minute)),

                store.incrementAggregateVersionAndGet$(aggreateType, Math.random(), (time2)),
                store.incrementAggregateVersionAndGet$(aggreateType, Math.random(), (time2 + minute)),
                store.incrementAggregateVersionAndGet$(aggreateType, Math.random(), (time2 + minute + minute)),

                store.incrementAggregateVersionAndGet$(aggreateType, Math.random(), (time3)),
                store.incrementAggregateVersionAndGet$(aggreateType, Math.random(), (time3 + minute)),
                store.incrementAggregateVersionAndGet$(aggreateType, Math.random(), (time3 + minute + minute))
            )
            .reduce((acc, val) => { acc.push(val); return acc; }, [])
                .subscribe(
                    (aggregatesVsTimeArray) => {
                        let index = 2;
                        let verifiedCount = 0;
                        const  verifiedTotal = 6;
                        store.findAgregatesCreatedAfter$(aggreateType, aggregatesVsTimeArray[index][0].creationTime)
                            .subscribe(
                                (aggregate) => {
                                    ++index;                                    
                                    //console.log(`${aggregate.creationTime} vs ${aggregatesVsTimeArray[index][0].creationTime}`);
                                    assert.equal(aggregate.creationTime,aggregatesVsTimeArray[index][0].creationTime);
                                    ++verifiedCount;
                                },
                                (error) => {
                                    console.log(`Error invoking findAgregatesCreatedAfter`, error);
                                    return done(error);
                                },
                                () => {                                    
                                    assert.equal(verifiedCount,verifiedTotal);                                    
                                    return done();
                                }
                            );

                    },
                    (error) => {
                        console.log(`Error incrementing and getting Aggregates created after a date`, error);
                        return done(error);
                    },
                    () => {
                        
                    }
                );
        });

    });

    describe('Events Store', function () {
        it('Push an event', function (done) {
            const evt = new Event(
                {
                    eventType: 'TestEventPushed',
                    eventTypeVersion: 1,
                    aggregateType: 'TestAggregate',
                    aggregateId: '12345',
                    data: { a: 1, b: 2, c: 3 },
                    user: 'MochaTest'
                });
            Rx.Observable.concat(store.pushEvent$(evt))
                .reduce((acc, val) => { acc.push(val); return acc; }, [])
                .subscribe(
                    ([{ aggregate, event, versionTimeStr }]) => {
                        assert.equal(event.av, aggregate.version);
                        assert.equal(event.timestamp, aggregate.versionTime);
                    },
                    (error) => {
                        console.log(`Error incrementing and getting Aggregate versions`, error);
                        return done(error);
                    },
                    () => {
                        return done();
                    }
                );
        });
        it('get events on same month', function (done) {
            let evtVersionChecker = 1;
            aggregateId = `aggregate-id-${Math.random()}`;
            const evt = new Event(
                {
                    eventType: `TestAggregate_retrieval_same_month_event`,
                    eventTypeVersion: 1,
                    aggregateType: 'TestAggregate_retrieval_same_month',
                    aggregateId,
                    data: { a: 1, b: 2, c: 3 },
                    user: 'MochaTest'
                });
            Rx.Observable.range(0, 10)
                .map(i => store.pushEvent$({ ...evt }))
                .concatAll()
                .reduce((acc, evt) => {
                    acc.push(evt);
                    return acc;
                }, [])
                .mergeMap(pushedVersions => store.getEvents$('TestAggregate_retrieval_same_month', aggregateId, 0))
                .subscribe(
                    (evt) => {
                        assert.equal(evtVersionChecker++, evt.av);
                    },
                    (error) => {
                        console.error(`Error retrieving events`, error);
                        return done(error);
                    },
                    () => {
                        assert.equal(evtVersionChecker - 1, 10);
                        console.log(`TestAggregate_retrieval_same_month_event completed`);
                        return done();
                    }
                );
        });

        it('get events on multiple months', function (done) {
            const monthTime = 1000 * 86400 * 30;

            const aggregateId = `aggregate-id-${Math.random()}`;
            console.log(`get events on multiple months: aggregateId = ${aggregateId}`);

            const total = 30;
            const offset = 15;
            let evtVersionChecker = 15;

            const evt = new Event(
                {
                    eventType: `TestAggregate_retrieval_multiple_months_event`,
                    eventTypeVersion: 1,
                    aggregateType: 'TestAggregate_retrieval_multiple_months',
                    aggregateId,
                    data: { a: 1, b: 2, c: 3 },
                    user: 'MochaTest'
                });
                
            Rx.Observable.range(0, 3)
                .map(i => i * monthTime)
                .concatMap(monthOffsetMillis =>
                    Rx.Observable.range(0, 10)
                        .map(evtNumber => { return { monthOffsetMillis, evtNumber }; })
                )
                .map(({ monthOffsetMillis, evtNumber }) => {
                    const newEvt = { ...evt };
                    newEvt.timestamp = Date.now() + monthOffsetMillis;
                    return store.pushEvent$(newEvt);
                })
                .concatAll()
                .reduce((acc, evt) => {
                    acc.push(evt);
                    return acc;
                }, [])
                .mergeMap(pushedVersions => store.getEvents$('TestAggregate_retrieval_multiple_months', aggregateId, offset))
                .subscribe(
                    (evt) => {
                        evtVersionChecker = evtVersionChecker + 1;
                        assert.equal(evt.av, evtVersionChecker);
                    },
                    (error) => {
                        console.error(`Error retrieving events`, error);
                        return done(error);
                    },
                    () => {
                        //assert.equal((evtVersionChecker - offset), total - offset);
                        console.log(`TestAggregate_retrieval_multiple_months completed`);
                        return done();
                    }
                );
        });
    });
    describe('de-prepare MongoStore', function () {
        it('stop MongoStore', function (done) {
            store.stop$()
                .subscribe(
                    next => console.log(next),
                    (error) => {
                        console.error(`Error stopping MongoStore`, error);
                        return done(error);
                    },
                    () => {
                        console.log('MongoStore stopped');
                        assert.ok(true, 'MqttBroker stoped');
                        return done();
                    }
                );
        });
    });
});
