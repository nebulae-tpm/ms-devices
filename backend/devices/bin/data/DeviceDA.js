'use strict';

const Rx = require('rxjs');
let mongoDB = require('./MongoDB')();
const broker = require('../tools/broker/BrokerFactory')();

class DeviceDA {
  static initTestMongoDB(mongo) {
    return new Promise((resolve, reject) => {
      this.mongoDB = mongo;
      mongo
        .init$()
        .subscribe(
          str => resolve(),
          error => reject(error),
          () => console.log('Mongo db init completed')
        );
    });
  }

  /**
   * gets Device detail by id
   * @param {String} id
   */
  static getDeviceDetail$(id) {
    const collection = mongoDB.db.collection('Devices');
    return Rx.Observable.fromPromise(collection.findOne({ id: id }));
  }

  /**
   * gets Devices
   *
   */
  static getDevices$(page, count) {
    const collection = mongoDB.db.collection('Devices');
    return Rx.Observable.fromPromise(
      collection
        .find({})
        .skip(count * page)
        .limit(count)
        .toArray()
    );
  }

  /**
   * Get the size of table Device
   *
   */
  static getDeviceTableSize$() {
    const collection = mongoDB.db.collection('Devices');
    return Rx.Observable.fromPromise(collection.count());
  }

  /**
   * Create or update the device info on the materialized view
   * @param {*} device
   */
  static persistDevice$(device, eventType) {    
    const collection = mongoDB.db.collection('Devices');
    return Rx.Observable.of(device).mergeMap(result => {
      return Rx.Observable.fromPromise(
        collection.findOneAndUpdate(
          {
            id: device.id
          },
          { $set: result },
          {
            upsert: true,
            returnOriginal: false
          }
        )
      )
        .mergeMap(result => {
          if (result && result.value) {            
            this.sendDeviceResultEvent(result.value, eventType);
            return this.persistDeviceHistory(result.value);
          } else {
            return Rx.Observable.of(undefined);
          }
        })
        .map(resultHistory => {
          return JSON.stringify(result);
        });
    });
  }

  static persistDeviceHistory(device) {
    device.timestamp = new Date().getTime();
    delete device._id
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.of(device).mergeMap(result => {
      return Rx.Observable.fromPromise(collection.insertOne(device));
    });
  }
  /**
   * Prepare and send the message to apiGateway
   * @param {*} device
   * @param {string} eventType
   */
  static sendDeviceResultEvent(device, eventType) {    
    let message;
    // DEVICE STATUS EVENTS
    switch (eventType) {
      case 'DeviceVolumesStateReported':
        message = { deviceStatus: {} };
        message.id = device.id;
        message.deviceStatus.deviceDataList =
          device.deviceStatus.deviceDataList;
        break;
      case 'DeviceDisplayStateReported':
        message = { deviceStatus: {} };
        message.id = device.id;
        message.deviceStatus.displaySn = device.deviceStatus.displaySn;
        break;
      case 'DeviceSystemStateReported':
        message = { deviceStatus: {} };
        message.id = device.id;
        message.deviceStatus.temperature = device.deviceStatus.temperature;
        message.deviceStatus.cpuStatus = device.deviceStatus.cpuStatus;
        message.deviceStatus.upTime = device.deviceStatus.upTime;
        message.deviceStatus.voltage = device.deviceStatus.voltage;
        message.deviceStatus.ram = device.deviceStatus.ram;
        break;
      case 'DeviceDeviceStateReported':
        message = { deviceStatus: {} };
        message.id = device.id;
        message.deviceStatus.devSn = device.deviceStatus.devSn;
        message.deviceStatus.type = device.deviceStatus.type;
        message.deviceStatus.hostname = device.deviceStatus.hostname;
        break;
      // DEVICE NETWORK EVENTS
      case 'DeviceNetworkStateReported':
        message = { deviceNetwork: {} };
        message.id = device.id;
        message.deviceNetwork.gateway = device.deviceNetwork.gateway;
        message.deviceNetwork.mac = device.deviceNetwork.mac;
        message.deviceNetwork.dns = device.deviceNetwork.dns;
        message.deviceNetwork.hostname = device.deviceNetwork.hostname;
        message.deviceNetwork.ipMaskMap = device.deviceNetwork.ipMaskMap;
        break;
      case 'DeviceModemStateReported':
        message = { deviceNetwork: {} };
        message.id = device.id;
        message.deviceNetwork.band = device.deviceNetwork.band;
        message.deviceNetwork.cellid = device.deviceNetwork.cellid;
        message.deviceNetwork.mode = device.deviceNetwork.mode;
        message.deviceNetwork.simImei = device.deviceNetwork.simImei;
        message.deviceNetwork.simStatus = device.deviceNetwork.simStatus;
        break;
      // APP STATUS EVENTS
      case 'DeviceMainAppStateReported':
        message = { appStatus: {} };
        message.id = device.id;
        message.appStatus.timestamp = device.appStatus.timestamp;
        message.appStatus.appTablesVersion = device.appStatus.appTablesVersion;
        message.appStatus.appVersions = device.appStatus.appVersions;
        break;
    }
    broker.send$(
      'MaterializedViewUpdates',
      `${eventType}Event`,
      JSON.parse(JSON.stringify(message))
    );
  }
}

module.exports = DeviceDA;
