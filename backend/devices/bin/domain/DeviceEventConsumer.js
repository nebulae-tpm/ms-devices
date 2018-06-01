const Rx = require('rxjs');
const DeviceGeneralInformationFormatter = require('./DeviceGeneralInformationFormatter');
const DeviceDA = require('../data/DeviceDA');

let instance;

class DeviceEventConsumer {

    constructor() {

    }

    handleDeviceEventReported$(event) {  
        return DeviceGeneralInformationFormatter.formatDeviceStateReport$(event)
            .mergeMap(rawData => { 
                return DeviceDA.persistDevice$(rawData,event.et);
            });
    }

    handleDeviceAlarmReported$(event) {  
        return Rx.Observable.forkJoin(
            DeviceDA.updateDeviceTemperatureAlarm$(event.data,event.et, event.aid),
            DeviceDA.persistDeviceAlarm$(event.data,event.et, event.aid)
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