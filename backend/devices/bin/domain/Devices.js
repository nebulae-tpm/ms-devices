'use strict';

const Rx = require('rxjs');
const DeviceDA = require('../data/DeviceDA');
const { CustomError , DefaultError} = require('../tools/customError')

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
    return Rx.Observable.of(rawRespponse).map(resp => ({
      data: resp,
      result: {
        code: 200
      }
    })
    )
  }

  /**
   * Error catcher
   * @param {Error} err 
   */
  errorHandler$(err) {
    return Rx.Observable.of(err).map(err => {
      const exception = { data: null, result: {} };
      const isCustomError = err instanceof CustomError;
      if (!isCustomError) {
        err = new DefaultError(err);
      }
      exception.result = {
        code: err.code,
        error: { ...err.getContent() }
      };
      return exception;
    });
  }
}

/**
 * @returns {Devices}
 */
module.exports = () => {
  if (!instance) {
    instance = new Devices();
    console.log("Devices Singleton created");
  }
  return instance;
};


