const assert = require('assert');
const Rx = require('rxjs');
const deviceEventConsumer = require('../../bin/domain/DeviceEventConsumer')();
let mongoDB = require('../../bin/data/MongoDB')();

const eventNetwork = {
  et: 'DeviceNetworkStateReported',
  etv: 1,
  at: 'Device',
  aid: 'sn0003-0001-TEST',
  data: {
    interfaces: {
      lo: ['127.0.0.1/8', '::1/128'],
      eth1: ['172.28.99.216/28', 'fe80::d82a:bdff:fe31:e408/64'],
      eth0: ['192.168.188.197/24', 'fe80::201:2ff:fe03:405/64']
    },
    hostname: 'OMVZ7',
    mac: '00:01:02:03:04:05',
    dns: ['192.168.188.188'],
    gateway: '192.168.188.188'
  },
  user: 'SYSTEM.DevicesReport.devices-report-handler',
  timestamp: 1524595228064,
  av: 8,
  _id: '5adf7a1c657bbe5c4735a161'
};

const deviceModemStateReported = {
  et: 'DeviceModemStateReported',
  etv: 1,
  at: 'Device',
  aid: 'sn0003-0001-TEST',
  data: {
    cellid: 6666666,
    band: 'WCDMA',
    mode: 'WCDMA',
    simStatus: 'OK',
    simImei: '359072061300642'
  },
  user: 'SYSTEM.DevicesReport.devices-report-handler',
  timestamp: 1524075387694,
  av: 74,
  _id: '5ad78b7b4eafd63c8b14c5da'
};

describe('BACKEND: devices', function() {
  describe('Domain: DeviceEventConsumer', function() {
    it('handleDeviceEventReported$: DeviceNetworkStateReported', function(done) {
      mongoDB.start$().subscribe(
        str => {
          deviceEventConsumer
            .handleDeviceEventReported$(eventNetwork)
            .subscribe(
              result => {
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

    it('handleDeviceEventReported$: DeviceModemStateReported', function(done) {
      mongoDB.start$().subscribe(
        str => {
          deviceEventConsumer
            .handleDeviceEventReported$(deviceModemStateReported)
            .subscribe(
              result => {
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
