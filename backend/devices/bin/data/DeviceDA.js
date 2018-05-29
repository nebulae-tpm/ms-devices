'use strict';

const Rx = require('rxjs');
let mongoDB = require('./MongoDB')();
const broker = require('../tools/broker/BrokerFactory')();

const MATERIALIZED_VIEW_TOPIC = 'materialized-view-updates';

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
    return Rx.Observable.defer(() => collection.findOne({ id: id }));
  }

  /**
   * gets Devices
   *
   */
  static getDevices$(page, count, filter, sortColumn, order) {
    let filterObject = {};
    const orderObject = {};
    if (filter && filter != '') {
      filterObject = {
        $or: [
          { 'deviceStatus.hostname': { $regex: `${filter}.*`, $options: 'i' } },
          { 'deviceStatus.type': { $regex: `${filter}.*`, $options: 'i' } },
          {
            'deviceStatus.groupName': { $regex: `${filter}.*`, $options: 'i' }
          },
          { id: { $regex: `${filter}.*`, $options: 'i' } }
        ]
      };
    }
    if (sortColumn && order) {
      let column;
      switch (sortColumn) {
        case 'serial':
          column = 'id';
          break;
        case 'hostName':
          column = 'deviceStatus.hostname';
          break;
        case 'groupName':
          column = 'deviceStatus.groupName';
          break;
        case 'ram':
          column = 'deviceStatus.ram.currentValue';
          break;
        case 'online':
          column = 'deviceStatus.online';
          break;
      }
      orderObject[column] = order == 'asc' ? 1 : -1;
    }
    const collection = mongoDB.db.collection('Devices');
    return Rx.Observable.defer(() =>
      collection
        .find(filterObject)
        .project({
          _id: 0,
          id: 1,
          deviceStatus: 1
        })
        .sort(orderObject)
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
    return Rx.Observable.defer(() => collection.count());
  }

  /**
   * Create or update the device info on the materialized view
   * @param {*} device
   */
  static persistDevice$(device, eventType) {
    if (device && device.id) {
      const collection = mongoDB.db.collection('Devices');

      return Rx.Observable.of(device)
        .mergeMap(dev => {
          return Rx.Observable.defer(() =>
            collection.findOneAndUpdate(
              {
                "_id": dev.id
              },
              { $set: { "_id": dev.id, "id": dev.id, ...dev } },
              {
                upsert: true,
                returnOriginal: false
              }
            )
          )
            .mergeMap(result => {
              if (result && result.value) {
                return Rx.Observable.concat(
                  this.persistDeviceHistory$(result.value),
                  this.sendDeviceResultEvent$(result.value, eventType)
                );
              } else {
                return Rx.Observable.of(undefined);
              }
            })
            .map(resultHistory => {
              return JSON.stringify(dev);
            });
        });
    }
    else {
      return Rx.Observable.of(undefined);
    }
  }
  /**
   * Persist new register in the collection DeviceHistory
   * @param {*} device
   */
  static persistDeviceHistory$(device) {
    device.timestamp = new Date().getTime();
    delete device._id;
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.of(device).mergeMap(result => {
      return Rx.Observable.defer(() => collection.insertOne(device));
    });
  }
  /**
   * Returns a list that contains the metrics in time of RAM
   * @param {Number} initTime
   * @param {Number} endTime
   * @param {Number} deltaTime
   * @param {string} deviceId
   */
  static getRamAvgInRangeOfTime$(initTime, endTime, deviceId) {
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.defer(() =>
      collection
        .find({
          timestamp: { $gte: initTime, $lt: endTime },
          id: deviceId,
          'deviceStatus.ram': { $exists: true }
        })
        .project({
          _id: 0,
          id: 1,
          timestamp: 1,
          'deviceStatus.ram': 1
        })
        .toArray()
    ).map(item => {
      return item;
    });
  }
  /**
   * Returns a list that contains the metrics in time of volume memory
   * @param {Number} initTime
   * @param {Number} endTime
   * @param {string} type
   * @param {Number} deltaTime
   * @param {string} deviceId
   */
  static getVolumeAvgInRangeOfTime$(initTime, endTime, type, deviceId) {
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.defer(() =>
      collection
        .aggregate([
          {
            $match: {
              timestamp: { $gte: initTime, $lt: endTime },
              id: deviceId,
              'deviceStatus.deviceDataList': { $exists: true }
            }
          },
          {
            $project: {
              timestamp: 1,
              currValue: {
                $filter: {
                  input: '$deviceStatus.deviceDataList',
                  as: 'value',
                  cond: { $eq: ['$$value.memorytype', type] }
                }
              }
            }
          },
          {
            $project: {
              timestamp: 1,
              value: {
                $arrayElemAt: ['$currValue.currentValue', 0]
              }
            }
          }
        ])
        .toArray()
    ).map(item => {
      return item;
    });
  }

  /**
   * Returns a list that contains the metrics in time of Voltage status
   * @param {Number} initTime
   * @param {Number} endTime
   * @param {Number} deltaTime
   * @param {string} deviceId
   */
  static getVoltageInRangeOfTime$(initTime, endTime, deviceId) {
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.defer(() =>
      collection
        .find({
          timestamp: { $gte: initTime, $lt: endTime },
          id: deviceId,
          'deviceStatus.voltage': { $exists: true }
        })
        .project({
          _id: 0,
          id: 1,
          timestamp: 1,
          'deviceStatus.voltage': 1
        })
        .toArray()
    ).map(item => {
      return item;
    });
  }

  /**
   * Returns a list that contains the metrics in time of CPU status
   * @param {Number} initTime
   * @param {Number} endTime
   * @param {string} deviceId
   */
  static getCpuAvgInRangeOfTime$(initTime, endTime, deviceId) {
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.defer(() =>
      collection
        .aggregate([
          {
            $match: {
              timestamp: { $gte: initTime, $lt: endTime },
              id: deviceId,
              'deviceStatus.cpuStatus': { $exists: true }
            }
          },
          {
            $project: {
              timestamp: 1,
              value: {
                $arrayElemAt: ['$deviceStatus.cpuStatus', 0]
              }
            }
          }
        ])
        .toArray()
    ).map(item => {
      return item;
    });
  }

  /**
   * Prepare and send the message to apiGateway
   * @param {*} device
   * @param {string} eventType
   */
  static sendDeviceResultEvent$(device, eventType) {
    let message;
    // DEVICE STATUS EVENTS
    switch (eventType) {
      case 'DeviceVolumesStateReported':
        if (device.deviceStatus.deviceDataList) {
          message = { deviceStatus: {} };
          message.id = device.id;
          message.deviceStatus.deviceDataList =
            device.deviceStatus.deviceDataList;
        }
        break;
      case 'DeviceDisplayStateReported':
        if (device.deviceStatus) {
          message = { deviceStatus: {} };
          message.id = device.id;
          message.deviceStatus.displaySn = device.deviceStatus.displaySn;
        }
        break;
      case 'DeviceSystemStateReported':
        if (device.deviceStatus) {
          message = { deviceStatus: {} };
          message.id = device.id;
          message.deviceStatus.temperature = device.deviceStatus.temperature;
          message.deviceStatus.cpuStatus = device.deviceStatus.cpuStatus;
          message.deviceStatus.upTime = device.deviceStatus.upTime;
          message.deviceStatus.voltage = device.deviceStatus.voltage;
          message.deviceStatus.ram = device.deviceStatus.ram;
        }
        break;
      case 'DeviceDeviceStateReported':
        if (device.deviceStatus) {
          message = { deviceStatus: {} };
          message.id = device.id;
          message.deviceStatus.devSn = device.deviceStatus.devSn;
          message.deviceStatus.type = device.deviceStatus.type;
          message.deviceStatus.groupName = device.deviceStatus.groupName;
          message.deviceStatus.hostname = device.deviceStatus.hostname;
        }
        break;
      case 'DeviceConnected':
        if (device.deviceStatus) {
          message = { deviceStatus: {} };
          message.deviceStatus.online = device.deviceStatus.online;
        }
        break;
      case 'DeviceDisconnected':
        if (device.deviceStatus) {
          message = { deviceStatus: {} };
          message.deviceStatus.online = device.deviceStatus.online;
        }
        break;
      // DEVICE NETWORK EVENTS
      case 'DeviceNetworkStateReported':
        if (device.deviceNetwork) {
          message = { deviceNetwork: {} };
          message.id = device.id;
          message.deviceNetwork.gateway = device.deviceNetwork.gateway;
          message.deviceNetwork.mac = device.deviceNetwork.mac;
          message.deviceNetwork.dns = device.deviceNetwork.dns;
          message.deviceNetwork.hostname = device.deviceNetwork.hostname;
          message.deviceNetwork.ipMaskMap = device.deviceNetwork.ipMaskMap;
        }
        break;
      case 'DeviceModemStateReported':
        if (device.deviceNetwork) {
          message = { deviceNetwork: {} };
          message.id = device.id;
          message.deviceNetwork.band = device.deviceNetwork.band;
          message.deviceNetwork.cellid = device.deviceNetwork.cellid;
          message.deviceNetwork.mode = device.deviceNetwork.mode;
          message.deviceNetwork.simImei = device.deviceNetwork.simImei;
          message.deviceNetwork.simStatus = device.deviceNetwork.simStatus;
        }
        break;
      // APP STATUS EVENTS
      case 'DeviceMainAppStateReported':
        if (device.appStatus) {
          message = { appStatus: {} };
          message.id = device.id;
          message.appStatus.timestamp = device.appStatus.timestamp;
          message.appStatus.appTablesVersion =
            device.appStatus.appTablesVersion;
          message.appStatus.appVersions = device.appStatus.appVersions;
        }
        break;
    }
    if (message) {
      return broker.send$(
        MATERIALIZED_VIEW_TOPIC,
        `${eventType}Event`,
        JSON.parse(JSON.stringify(message))
      );
    } else {
      return Rx.Observable.of(undefined);
    }
  }
}

module.exports = DeviceDA;
