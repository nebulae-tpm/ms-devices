'use strict';

const Rx = require('rxjs');
const DeviceDA = require('../data/DeviceDA');
const CustomError = require('../tools/customError')

let instance;

class Devices {
  constructor() {}
  getDeviceDetail({ root, args, jwt }, authToken) {
    return DeviceDA.getDeviceDetail$(args.id)
    .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
    .catch(err => this.errorHandler$(err));;
  }

  getDevices({ root, args, jwt }, authToken) {
    return DeviceDA.getDevices$(
      args.page,
      args.count,
      args.filter
    )
    .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
    .catch(err => this.errorHandler$(err));;
  }

  getDeviceTableSize({ root, args, jwt }, authToken) {
    return DeviceDA.getDeviceTableSize$()
    .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
    .catch(err => this.errorHandler$(err));;
  }

  getAlarmTableSize({ root, args, jwt }, authToken) {
    return DeviceDA.getAlarmTableSize$(
      args.deviceId,
      args.alarmType,
      args.initTime,
      args.endTime,)
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.errorHandler$(err));;
  }

  getRamAvgInRangeOfTime({ root, args, jwt }, authToken) {
    return DeviceDA.getRamAvgInRangeOfTime$(
      args.initTime,
      args.endTime,
      args.deviceId
    )
    .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
    .catch(err => this.errorHandler$(err));;
  }

  getSdAvgInRangeOfTime({ root, args, jwt }, authToken) {
    return DeviceDA.getSdAvgInRangeOfTime$(
      args.initTime,
      args.endTime,
      args.deviceId
    )
    .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
    .catch(err => this.errorHandler$(err));;
  }
  getCpuAvgInRangeOfTime({ root, args, jwt }, authToken) {
    return DeviceDA.getCpuAvgInRangeOfTime$(
      args.initTime,
      args.endTime,
      args.deviceId
    )
    .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
    .catch(err => this.errorHandler$(err));;
  }
  getVoltageInRangeOfTime({ root, args, jwt }, authToken) {
    return DeviceDA.getVoltageInRangeOfTime$(
      args.initTime,
      args.endTime,
      args.deviceId
    )
    .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
    .catch(err => this.errorHandler$(err));;
  }

  getDeviceAlarms({ root, args, jwt }, authToken) {
    return DeviceDA.getDeviceAlarms$(
      args.deviceId,
      args.alarmType,
      args.initTime,
      args.endTime,
      args.page,
      args.count
    )
    .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
    .catch(err => this.errorHandler$(err));;
  }

  buildSuccessResponse$(rawRespponse) {
    return Rx.Observable.of(rawRespponse).map(resp => {
      return {
        data: resp,
        result: {
          code: 200
        }
      };
    });
  }

  errorHandler$(err) {
    return Rx.Observable.of(err).map(err => {
      const exception = { data: null, result: {} };
      if (err instanceof CustomError) {
        exception.result = {
          code: err.code,
          error: err.getContent()
        };
      } else {
        exception.result = {
          code: new DefaultError(err.message).code,
          error: {
            name: 'Error',
            msg: err.toString()
          }
        };
      }
      return exception;
    });
  }
}

module.exports = () => {
  if (!instance) {
    instance = new Devices();
    console.log("Devices Singleton created");
  }
  return instance;
};

