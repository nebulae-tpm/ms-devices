'use strict';

const Rx = require('rxjs');
let mongoDB = require('./MongoDB')();
const broker = require('../tools/broker/BrokerFactory')();
const dateFormat = require('dateformat');

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

  //#region DEVICE_QUERIES
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
  static getDevices$(page, count, filter) {
    return Rx.Observable.of(filter)
      .map(rawData => {
        let jsonObj;
        try {
          jsonObj = JSON.parse(rawData);
        } catch (error) {
          console.log('Invalid Json Object in filterTemplate');
        }

        return jsonObj;
      })
      .mergeMap(filterTemplate =>
        this.buildDeviceFilterObject(filterTemplate, page, count)
      );
  }

  /**
   * Get devices by a search filter and alarm type
   */
  static getDevicesByGeneralFilter(filterTemplate, page, count) {
    const collection = mongoDB.db.collection('Devices');
    let orderObject = {};
    const filterObject = {
      $or: [
        {
          'deviceStatus.hostname': {
            $regex: `${filterTemplate.searchValue}.*`,
            $options: 'i'
          }
        },
        {
          'deviceStatus.type': {
            $regex: `${filterTemplate.searchValue}.*`,
            $options: 'i'
          }
        },
        {
          'deviceStatus.groupName': {
            $regex: `${filterTemplate.searchValue}.*`,
            $options: 'i'
          }
        },
        { id: { $regex: `${filterTemplate.searchValue}.*`, $options: 'i' } }
      ]
    };
    if (filterTemplate.alarmFilter) {
      switch (filterTemplate.alarmFilter) {
        case 'RAM':
          filterObject['deviceStatus.alarmRamActive'] = true;
          break;
        case 'SD':
          filterObject['deviceStatus.alarmSdActive'] = true;
          break;
        case 'CPU':
          filterObject['deviceStatus.alarmCpuActive'] = true;
          break;
        case 'TEMP':
          filterObject['deviceStatus.alarmTempActive'] = true;
          break;
      }
    }
    if (filterTemplate.sortColumn && filterTemplate.sortOrder) {
      let column;
      switch (filterTemplate.sortColumn) {
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
        case 'sd':
          column = 'deviceStatus.sdStatus.currentValue';
          break;
        case 'cpu':
          column = 'deviceStatus.currentCpuStatus';
          break;
        case 'temperature':
          column = 'deviceStatus.temperature';
          break;
        case 'online':
          column = 'deviceStatus.online';
          break;
      }
      orderObject[column] = filterTemplate.sortOrder == 'asc' ? 1 : -1;
    }
    return Rx.Observable.defer(() => {
      return collection
        .find(filterObject)
        .project({
          _id: 0,
          id: 1,
          deviceStatus: 1
        })
        .sort(orderObject)
        .skip(count * page)
        .limit(count)
        .toArray();
    });
  }
  /**
   * Get the size of table Device
   *
   */
  static getDeviceTableSize$() {
    const collection = mongoDB.db.collection('Devices');
    return Rx.Observable.defer(() => collection.count());
  }

  //#endregion

  //#region DEVICE_HISTORY_QUERIES

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
   * Returns a list that contains the metrics in time of SD
   * @param {Number} initTime
   * @param {Number} endTime
   * @param {Number} deltaTime
   * @param {string} deviceId
   */
  static getSdAvgInRangeOfTime$(initTime, endTime, deviceId) {
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.defer(() =>
      collection
        .find({
          timestamp: { $gte: initTime, $lt: endTime },
          id: deviceId,
          'deviceStatus.sdStatus': { $exists: true }
        })
        .project({
          _id: 0,
          id: 1,
          timestamp: 1,
          'deviceStatus.sdStatus': 1
        })
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

  //#endregion

  //#region DEVICE_ALARM_QUERIES
  /**
   * gets Devices
   *
   */
  static getDeviceAlarms$(
    deviceId,
    alarmType,
    initTimestamp,
    endTimestamp,
    page,
    count
  ) {
    const filterObject = {
      $and: [
        { deviceId: deviceId },
        {
          type:
            alarmType == 'VOLT'
              ? { $in: ['LOW_VOLTAGE', 'HIGH_VOLTAGE'] }
              : alarmType
        },
        { timestamp: { $gt: initTimestamp } },
        { timestamp: { $lt: endTimestamp } }
      ]
    };

    const collection = mongoDB.db.collection('DeviceAlarm');
    return Rx.Observable.defer(() =>
      collection
        .find(filterObject)
        .skip(count * page)
        .limit(count)
        .toArray()
    );
  }

  /**
   * get number of alerts grouped by deviceId
   * @param {number} initTime lowest date in millis to fecth alerts
   * @param {string} type of alert
   */
  static getAlarmsInRangeOfTime(initTime, alarmType, count, page) {
    const collection = mongoDB.db.collection('DeviceAlarm');
    return Rx.Observable.defer(() =>
      collection
        .aggregate([
          {
            $match: {
              timestamp: { $gte: initTime },
              type:
                alarmType == 'VOLT'
                  ? { $in: ['LOW_VOLTAGE', 'HIGH_VOLTAGE'] }
                  : alarmType,
              active: true
            }
          },
          {
            $group: {
              _id: '$deviceId',
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              deviceId: '$_id',
              count: 1,
              _id: 0
            }
          },
          {
            $sort: { count: -1 }
          }
        ])
        .skip(count * page)
        .limit(count)
        .toArray()
    );
  }

  /**
   * Get devices filtered by alarms activated in range of time
   */
  static getDevicesByAlarmsInRangeOfTime(filterTemplate) {
    const collection = mongoDB.db.collection('Devices');
    return this.getAlarmsInRangeOfTime(
      filterTemplate.initTime,
      filterTemplate.type,
      filterTemplate.count,
      filterTemplate.page
    ).mergeMap(result =>
      Rx.Observable.from(result)
        .map(result => {
          return result.deviceId;
        })
        .toArray()
        .mergeMap(deviceIdList => {
          return Rx.Observable.defer(() => {
            return collection
              .find({ _id: { $in: deviceIdList } })
              .project({
                _id: 0,
                id: 1,
                deviceStatus: 1
              })
              .toArray();
          });
        })
        .mergeMap(result => Rx.Observable.from(result))
        .map(device => {
          const deviceAlarmObject = result.filter(
            deviceAlarm => deviceAlarm.deviceId == device.id
          )[0];
          if (deviceAlarmObject) {
            device.count = deviceAlarmObject.count;
          }
          return device;
        })
        .toArray()
        .map(unsortedArray =>
          unsortedArray.sort((a, b) => {
            if (a.count < b.count) return 1;
            if (a.count > b.count) return -1;
            return 0;
          })
        )
    );
  }

  /**
   * Get the size of table DeviceAlarm
   *
   */
  static getAlarmTableSize$(deviceId, alarmType, initTime, endTime) {
    const filterObject = {
      $and: [
        { deviceId: deviceId },
        { type: alarmType },
        { timestamp: { $gt: initTime } },
        { timestamp: { $lt: endTime } }
      ]
    };
    const collection = mongoDB.db.collection('DeviceAlarm');
    return Rx.Observable.defer(() => collection.count(filterObject));
  }
  //#endregion

  //#region DEVICE_MUTATIONS

  /**
   * Create or update the device info on the materialized view
   * @param {*} device
   */
  static persistDevice$(device, eventType) {
    if (device && device.id) {
      const collection = mongoDB.db.collection('Devices');

      return Rx.Observable.of(device).mergeMap(dev => {
        return Rx.Observable.defer(() =>
          collection.findOneAndUpdate(
            {
              _id: dev.id
            },
            { $set: { _id: dev.id, id: dev.id, ...dev } },
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
    } else {
      return Rx.Observable.of(undefined);
    }
  }

  //#endregion

  //#region DEVICE_ALARM_MUTATIONS

  /**
   * Persist new register in the collection DeviceAlarm
   * @param {*} deviceAlarm
   * @param {String} eventType
   */
  static persistDeviceAlarm$(deviceAlarm, eventType, deviceId) {
    const collection = mongoDB.db.collection('DeviceAlarm');

    return Rx.Observable.of(deviceAlarm)
      .map(devAlarm => {
        const rawData = { deviceId };
        switch (eventType) {
          case 'DeviceRamuUsageAlarmActivated':
          case 'DeviceRamUsageAlarmDeactivated':
            rawData.active = eventType == 'DeviceRamuUsageAlarmActivated';
            rawData.type = 'RAM';
            break;
          case 'DeviceSdUsageAlarmActivated':
          case 'DeviceSdUsageAlarmDeactivated':
            rawData.active = eventType == 'DeviceSdUsageAlarmActivated';
            rawData.type = 'SD';
            break;
          case 'DeviceCpuUsageAlarmActivated':
          case 'DeviceCpuUsageAlarmDeactivated':
            rawData.active = eventType == 'DeviceCpuUsageAlarmActivated';
            rawData.type = 'CPU';
            break;
          case 'DeviceTemperatureAlarmActivated':
          case 'DeviceTemperatureAlarmDeactivated':
            rawData.active = eventType == 'DeviceTemperatureAlarmActivated';
            rawData.type = 'TEMP';
            break;
        }
        return Object.assign(devAlarm, rawData);
      })
      .mergeMap(mergeData => {
        return Rx.Observable.defer(() => collection.insertOne(mergeData));
      });
  }

  /**
   * Remove all documents before the obsolete Threshold
   * @param {double} obsoleteThreshold
   */
  static removeObsoleteAlarmHistory$(obsoleteThreshold) {
    const collection = mongoDB.db.collection('DeviceAlarm');
    return Rx.Observable.defer(() =>
      collection.remove({ timestamp: { $lt: obsoleteThreshold } })
    ).map(r => r.result);
  }

  static persistDeviceVoltageAlarm$(deviceAlarm, eventType, deviceId) {
    const collection = mongoDB.db.collection('DeviceAlarm');

    return Rx.Observable.of(deviceAlarm)
      .map(devAlarm => {
        const rawData = { deviceId };
        switch (eventType) {
          case 'DeviceHighVoltageAlarmReported':
            rawData.type = 'HIGH_VOLTAGE';
            break;
          case 'DeviceLowVoltageAlarmReported':
            rawData.type = 'LOW_VOLTAGE';
            break;
        }
        rawData.active = true;
        rawData.value = deviceAlarm.voltage;
        rawData.unit = 'VOLT';
        rawData.timestamp = deviceAlarm.timestamp;
        return rawData;
      })
      .mergeMap(mergeData => {
        return Rx.Observable.defer(() => collection.insertOne(mergeData));
      });
  }

  static updateDeviceAlarm$(deviceAlarm, eventType, deviceId) {
    let updateObject;
    if (
      eventType == 'DeviceTemperatureAlarmActivated' ||
      eventType == 'DeviceTemperatureAlarmDeactivated'
    ) {
      updateObject = {
        $set: {
          'deviceStatus.alarmTempActive':
            eventType == 'DeviceTemperatureAlarmActivated'
        }
      };
    } else if (
      eventType == 'DeviceRamuUsageAlarmActivated' ||
      eventType == 'DeviceRamUsageAlarmDeactivated'
    ) {
      updateObject = {
        $set: {
          'deviceStatus.alarmRamActive':
            eventType == 'DeviceRamuUsageAlarmActivated'
        }
      };
    } else if (
      eventType == 'DeviceSdUsageAlarmActivated' ||
      eventType == 'DeviceSdUsageAlarmDeactivated'
    ) {
      updateObject = {
        $set: {
          'deviceStatus.alarmSdActive':
            eventType == 'DeviceSdUsageAlarmActivated'
        }
      };
    } else if (
      eventType == 'DeviceCpuUsageAlarmActivated' ||
      eventType == 'DeviceCpuUsageAlarmDeactivated'
    ) {
      updateObject = {
        $set: {
          'deviceStatus.alarmCpuActive':
            eventType == 'DeviceCpuUsageAlarmActivated'
        }
      };
    }
    if (updateObject) {
      const collection = mongoDB.db.collection('Devices');
      return Rx.Observable.of(deviceAlarm)
        .map(alarm => {
          deviceAlarm.id = deviceId;
          return deviceAlarm;
        })
        .mergeMap(alarm => {
          return collection.updateOne({ _id: deviceId }, updateObject);
        })
        .mergeMap(peristed => {
          return this.sendDeviceResultEvent$(deviceAlarm, eventType);
        });
    } else {
      return Rx.Observable.of(undefined);
    }
  }

  //#endregion

  //#region DEVICE_HISTORY_MUTATIONS
  /**
   * Persist new register in the collection DeviceHistory
   * @param {*} device
   */
  static persistDeviceHistory$(device) {
    device.timestamp = device.timestamp
      ? device.timestamp
      : new Date().getTime();
    device.dateTime = dateFormat(device.timestamp, 'yyyy-mm-dd HH:MM');
    delete device._id;
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.of(device).mergeMap(result => {
      return Rx.Observable.defer(() =>
        collection.updateOne(
          {
            dateTime: device.dateTime
          },
          {
            $set: device
          },
          {
            upsert: true
          }
        )
      );
    });
  }

  /**
   * Remove all documents before the obsolete Threshold
   * @param {double} obsoleteThreshold
   */
  static removeObsoleteDeviceHistory$(obsoleteThreshold) {
    const collection = mongoDB.db.collection('DeviceHistory');
    return Rx.Observable.defer(() =>
      collection.remove({ timestamp: { $lt: obsoleteThreshold } })
    ).map(r => r.result);
  }

  //#endregion

  //#region DEVICE_SUBSCRIPTIONS
  /**
   * Prepare and send the message to apiGateway
   * @param {*} device
   * @param {string} eventType
   */
  static sendDeviceResultEvent$(device, eventType) {
    let message = {};
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
          message.id = device.id;
          message.deviceStatus.online = device.deviceStatus.online;
        }
        break;
      case 'DeviceDisconnected':
        if (device.deviceStatus) {
          message = { deviceStatus: {} };
          message.id = device.id;
          message.deviceStatus.online = device.deviceStatus.online;
        }
        break;
      case 'DeviceTemperatureAlarmActivated':
      case 'DeviceTemperatureAlarmDeactivated':
        message = { deviceStatus: {} };
        message.id = device.id;
        message.deviceStatus.alarmTempActive =
          eventType == 'DeviceTemperatureAlarmActivated';
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
  //#endregion

  //#region FILTER_TEMPLATE_BUILDER

  /**
   * Build filter object based on filterTemplate
   * @param {*} filterTemplate
   */
  static buildDeviceFilterObject(filterTemplate, page, count) {
    if (!filterTemplate) { 
      filterTemplate = {};
    }
    //GENERAL FILTER
    if (filterTemplate.id == 0) {
      return this.getDevicesByGeneralFilter(filterTemplate, page, count);
    }
    // DASHBOARD_DEVICE_FILTER
    else if (filterTemplate.id == 1) {
      return this.getDevicesByAlarmsInRangeOfTime(filterTemplate);
    }
    return Rx.Observable.of(undefined);
  }

  //#endregion
}

module.exports = DeviceDA;