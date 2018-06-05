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
                    return rawData ? DeviceDA.persistDevice$(rawData,event.et): Rx.Observable.of(undefined);             
            });
    }

    handleDeviceAlarmReported$(event) { 
        console.log('LLEGA ALARMA: ', JSON.stringify(event));
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