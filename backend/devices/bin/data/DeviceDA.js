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
    return Rx.Observable.fromPromise(collection.findOne({ id: id }));
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
    return Rx.Observable.fromPromise(
      collection
        .find(filterObject)
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
            return Rx.Observable.concat(
              this.persistDeviceHistory$(result.value),
              this.sendDeviceResultEvent$(result.value, eventType)
            );
          } else {
            return Rx.Observable.of(undefined);
          }
        })
        .map(resultHistory => {
          return JSON.stringify(result);
        });
    });
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
      return Rx.Observable.fromPromise(collection.insertOne(device));
    });
  }
  /**
   * Returns a list that contains the metrics in time of RAM
   * @param {Number} initTime
   * @param {Number} endTime
   * @param {Number} deltaTime
   * @param {string} deviceId
   */
  static getRamAvgInRangeOfTime$(initTime, endTime, deltaTime, deviceId) {
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.fromPromise(
      collection
        .aggregate([
          {
            $match: {
              timestamp: { $gte: initTime, $lt: endTime },
              id: deviceId,
              'deviceStatus.ram': { $exists: true }
            }
          },
          {
            $project: {
              date: { $add: [new Date(0), '$timestamp'] },
              timestamp: 1,
              'deviceStatus.ram.currentValue': 1
            }
          },
          {
            $group: {
              _id: {
                interval: {
                  $add: [
                    '$timestamp',
                    {
                      $subtract: [
                        {
                          $multiply: [
                            {
                              $subtract: [
                                deltaTime,
                                { $mod: [{ $minute: '$date' }, deltaTime] }
                              ]
                            },
                            60000
                          ]
                        },
                        {
                          $add: [
                            { $multiply: [{ $second: '$date' }, 1000] },
                            { $millisecond: '$date' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              },
              grouped_data: { $avg: '$deviceStatus.ram.currentValue' }
            }
          },
          {
            $project: {
              _id: 0,
              interval: '$_id.interval',
              grouped_data: 1
            }
          }
        ])
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
  static getVolumeAvgInRangeOfTime$(
    initTime,
    endTime,
    type,
    deltaTime,
    deviceId
  ) {
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.fromPromise(
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
              date: { $add: [new Date(0), '$timestamp'] },
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
              date: 1,
              timestamp: 1,
              customValue: {
                $arrayElemAt: ['$currValue.currentValue', 0]
              }
            }
          },
          {
            $group: {
              _id: {
                interval: {
                  $add: [
                    '$timestamp',
                    {
                      $subtract: [
                        {
                          $multiply: [
                            {
                              $subtract: [
                                deltaTime,
                                { $mod: [{ $minute: '$date' }, deltaTime] }
                              ]
                            },
                            60000
                          ]
                        },
                        {
                          $add: [
                            { $multiply: [{ $second: '$date' }, 1000] },
                            { $millisecond: '$date' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              },
              grouped_data: { $avg: '$customValue' }
            }
          },
          {
            $project: {
              _id: 0,
              interval: '$_id.interval',
              grouped_data: 1
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
  static getVoltageInRangeOfTime$(initTime, endTime, deltaTime, deviceId) {
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.fromPromise(
      collection
        .aggregate([
          {
            $match: {
              timestamp: { $gte: initTime, $lt: endTime },
              id: deviceId,
              'deviceStatus.voltage': { $exists: true }
            }
          },
          {
            $project: {
              date: { $add: [new Date(0), '$timestamp'] },
              timestamp: 1,
              'deviceStatus.voltage.currentValue': 1,
              'deviceStatus.voltage.highestValue': 1,
              'deviceStatus.voltage.lowestValue': 1
            }
          },
          {
            $group: {
              _id: {
                interval: {
                  $add: [
                    '$timestamp',
                    {
                      $subtract: [
                        {
                          $multiply: [
                            {
                              $subtract: [
                                deltaTime,
                                { $mod: [{ $minute: '$date' }, deltaTime] }
                              ]
                            },
                            60000
                          ]
                        },
                        {
                          $add: [
                            { $multiply: [{ $second: '$date' }, 1000] },
                            { $millisecond: '$date' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              },
              currentValue: { $avg: '$deviceStatus.voltage.currentValue' },
              highestValue: { $avg: '$deviceStatus.voltage.highestValue' },
              lowestValue: { $avg: '$deviceStatus.voltage.lowestValue' }
            }
          },
          {
            $project: {
              _id: 0,
              interval: '$_id.interval',
              currentValue: 1,
              highestValue: 1,
              lowestValue: 1
            }
          }
        ])
        .toArray()
    ).map(item => {
      return item;
    });
  }

  /**
   * Returns a list that contains the metrics in time of CPU status
   * @param {Number} initTime
   * @param {Number} endTime
   * @param {Number} deltaTime
   * @param {string} deviceId
   */
  static getCpuAvgInRangeOfTime$(initTime, endTime, deltaTime, deviceId) {
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.fromPromise(
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
              date: { $add: [new Date(0), '$timestamp'] },
              timestamp: 1,
              customValue: {
                $arrayElemAt: ['$deviceStatus.cpuStatus', 0]
              }
            }
          },
          {
            $group: {
              _id: {
                interval: {
                  $add: [
                    '$timestamp',
                    {
                      $subtract: [
                        {
                          $multiply: [
                            {
                              $subtract: [
                                deltaTime,
                                { $mod: [{ $minute: '$date' }, deltaTime] }
                              ]
                            },
                            60000
                          ]
                        },
                        {
                          $add: [
                            { $multiply: [{ $second: '$date' }, 1000] },
                            { $millisecond: '$date' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              },
              grouped_data: { $avg: '$customValue' }
            }
          },
          {
            $project: {
              _id: 0,
              interval: '$_id.interval',
              grouped_data: 1
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
          message.appStatus.appTablesVersion = device.appStatus.appTablesVersion;
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
    }
    else { 
      return Rx.Observable.of(undefined);
    }
  }
}

module.exports = DeviceDA;

