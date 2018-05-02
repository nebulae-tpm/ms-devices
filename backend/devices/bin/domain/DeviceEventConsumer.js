const Rx = require('rxjs');
const DeviceGeneralInformationFormatter = require('./DeviceGeneralInformationFormatter');
const DeviceDA = require('../data/DeviceDA');

let instance;

class DeviceEventConsumer {

    constructor() {

    }

    handleDeviceEventReported$(event) {  
        return DeviceGeneralInformationFormatter.formatReport$(event)
            .mergeMap(rawData => { 
                return DeviceDA.persistDevice$(rawData,event.et);
            });
    }

}

module.exports = () => {
    if (!instance) {
        instance = new DeviceEventConsumer();
        console.log('DeviceEventConsumer Singleton created');
    }
    return instance;
};