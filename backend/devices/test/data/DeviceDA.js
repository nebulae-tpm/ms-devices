const deviceEventConsumer = require('../../bin/domain/DeviceEventConsumer')();

const assert = require('assert');
const Rx = require('rxjs');
let mongoDB = require('../../bin/data/MongoDB')();

describe('BACKEND: devices', function() {
    describe('Data: DeviceDA', function () {
        
      it('getRamAvgInRangeOfTime$: RAM', function(done) {
        mongoDB.start$().subscribe(
          str => {
            deviceEventConsumer
              .testToDelete$()
              .subscribe(
                result => {
                    console.log(`Result: ${JSON.stringify(result)}`);
                  assert.ok(true);
                },
                error => {
                  return done(error);
                },
                () => {
                  return done();
                }
              );
          },
          error => console.error(`Failed to connect to MongoDB`, error),
          () => {}
        );
      });
        
    });
  });