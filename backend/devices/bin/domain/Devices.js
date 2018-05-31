'use strict';

const Rx = require('rxjs');
const DeviceDA = require('../data/DeviceDA');

class Devices {
  constructor() {}
  getDeviceDetail({ root, args, jwt }, authToken) {
    return DeviceDA.getDeviceDetail$(args.id);
  }

  getDevices({ root, args, jwt }, authToken) {
    return DeviceDA.getDevices$(
      args.page,
      args.count,
      args.filter,
      args.sortColumn,
      args.sortOrder
    );
  }

  getDeviceTableSize({ root, args, jwt }, authToken) {
    return DeviceDA.getDeviceTableSize$();
  }

  getAlarmTableSize({ root, args, jwt }, authToken) {
    return DeviceDA.getAlarmTableSize$();
  }

  getRamAvgInRangeOfTime({ root, args, jwt }, authToken) {
    return DeviceDA.getRamAvgInRangeOfTime$(
      args.initTime,
      args.endTime,
      args.deviceId
    );
  }

  getVolumeAvgInRangeOfTime({ root, args, jwt }, authToken) {
    return DeviceDA.getVolumeAvgInRangeOfTime$(
      args.initTime,
      args.endTime,
      args.volumeType,
      args.deviceId
    );
  }
  getCpuAvgInRangeOfTime({ root, args, jwt }, authToken) {
    return DeviceDA.getCpuAvgInRangeOfTime$(
      args.initTime,
      args.endTime,
      args.deviceId
    );
  }
  getVoltageInRangeOfTime({ root, args, jwt }, authToken) {
    return DeviceDA.getVoltageInRangeOfTime$(
      args.initTime,
      args.endTime,
      args.deviceId
    );
  }

  getDeviceAlarms({ root, args, jwt }, authToken) {
    return DeviceDA.getDeviceAlarms$(
      args.deviceId,
      args.alarmType,
      args.initTime,
      args.endTime,
      args.page,
      args.count
    );
  }
}

module.exports = Devices;
