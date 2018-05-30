'use strict'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const graphQlService = require('./services/gateway/GraphQlService')();
const mongoDB = require('./data/MongoDB')();
const eventSourcing = require('./tools/EventSourcing')();
const eventStoreService = require('./services/event-store/EventStoreService')();
const Rx = require('rxjs');

const start = () => { 
    Rx.Observable.concat(
        eventSourcing.eventStore.start$(),
        eventStoreService.start$(),
        mongoDB.start$(),
        graphQlService.start$()
    ).subscribe(
        (evt) => console.log(evt),
        (error) => {
            console.error('Failed to start',error);
            process.exit(1);
        },
        () => console.log('devices-report-handler started')
    );
}

start();