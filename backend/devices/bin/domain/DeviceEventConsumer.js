const Rx = require('rxjs');
const DeviceGeneralInformationFormatter = require('./DeviceGeneralInformationFormatter');
const DeviceDA = require('../data/DeviceDA');

let instance;

class DeviceEventConsumer {
  constructor() {}

  handleDeviceEventReported$(event) {
    return DeviceGeneralInformationFormatter.formatDeviceStateReport$(
      event
    ).mergeMap(rawData => {
      return rawData
        ? DeviceDA.persistDevice$(rawData, event.et)
        : Rx.Observable.of(undefined);
    });
  }

  handleDeviceAlarmReported$(event) {
    return Rx.Observable.forkJoin(
      DeviceDA.updateDeviceAlarm$(event.data, event.et, event.aid),
      DeviceDA.persistDeviceAlarm$(event.data, event.et, event.aid)
    );
  }

  handleDeviceVoltageAlarmReported$(event) {
    return DeviceDA.persistDeviceVoltageAlarm$(event.data, event.et, event.aid);
  }

  /**
   * obsoleteThreshold in hours
   */
  removeAllObsoleteMongoDocuments$(evt) {
    const hoursBefore = evt.data ? evt.data.obsoleteThreshold : 3;
    const obsoleteThreshold =
      Date.now() - ((hoursBefore * 60 * 60 * 1000) + (10 * 60 * 1000));
    return Rx.Observable.forkJoin(
      DeviceDA.removeObsoleteDeviceHistory$(obsoleteThreshold),
      DeviceDA.removeObsoleteAlarmHistory$(obsoleteThreshold)
    );
  }
}

module.exports = () => {
  if (!instance) {
    instance = new DeviceEventConsumer();
    console.log('DeviceEventConsumer Singleton created');
  }
  return instance;
};
