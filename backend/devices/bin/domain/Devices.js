'use strict'

const Rx = require('rxjs');
const DeviceDA = require('../data/DeviceDA');

class Devices {
    constructor() {
    }
    getDeviceDetail({ root, args, jwt }, authToken) {        
        return DeviceDA.getDeviceDetail$(args.id);
    }

    getDevices({ root, args, jwt }, authToken) { 
        return DeviceDA.getDevices$(args.page, args.count)
    }

    getDeviceTableSize({ root, args, jwt }, authToken) { 
        return DeviceDA.getDeviceTableSize$()
    }

}

module.exports = Devices;