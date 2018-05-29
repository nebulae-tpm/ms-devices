'use strict'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const mongoDB = require('./data/MongoDB')();
const Rx = require('rxjs');

const start = () => { 
    Rx.Observable.concat(
        // initializing needed resources
        mongoDB.start$(),
        // executing maintenance tasks
        mongoDB.createIndexes$(),
        // stoping resources
        mongoDB.stop$(),
    ).subscribe(
        (evt) => console.log(evt),
        (error) => {
            console.error('Failed to prepare',error);
            process.exit(1);
        },
        () => {
            console.log('devices-report-handler prepared');
            process.exit(0);
        }
    );
}

start();



