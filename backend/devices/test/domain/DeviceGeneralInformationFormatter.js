const assert = require('assert');
const Rx = require('rxjs');

const DeviceGeneralInformationFormatter = require('../../bin/domain/DeviceGeneralInformationFormatter');

const deviceNetworkStateReported = {
    et: 'DeviceNetworkStateReported',
    etv: 1,
    at: 'Device',
    aid: 'sn0001-0001-TEST',
    data: {
      interfaces: {
        lo: ['127.0.0.1/8', '::1/128'],
        eth1: ['172.28.99.216/28', 'fe80::d82a:bdff:fe31:e408/64'],
        eth0: ['192.168.188.197/24', 'fe80::201:2ff:fe03:405/64']
      },
      hostname: 'OMVZ7',
      mac: '00:01:02:03:04:05',
      dns: ['192.168.188.188'],
      gateway: '192.168.188.188'
    },
    user: 'SYSTEM.DevicesReport.devices-report-handler',
    timestamp: 1524237929063,
    av: 13,
    _id: '5ada06697e23d14a39da8a83'
};

const deviceModemStateReported = {
    et: 'DeviceModemStateReported',
    etv: 1,
    at: 'Device',
    aid: 'sn0001-0001-TEST',
    data: {
      cellid: 6666666,
      band: 'WCDMA',
      mode: 'WCDMA',
      simStatus: 'OK',
      simImei: '359072061300642'
    },
    user: 'SYSTEM.DevicesReport.devices-report-handler',
    timestamp: 1524075387694,
    av: 74,
    _id: '5ad78b7b4eafd63c8b14c5da'
};

const deviceVolumesStateReported = {
    et: 'DeviceVolumesStateReported',
    etv: 1,
    at: 'Device',
    aid: 'sn0001-0001-TEST',
    data: [
      {
        current: 456912,
        total: 1026448,
        type: 'MEM',
        unit: 'KiB'
      },
      {
        current: 830,
        total: 7446,
        type: 'SD',
        unit: 'MiB'
      }
    ],
    user: 'SYSTEM.DevicesReport.devices-report-handler',
    timestamp: 1524075387696,
    av: 70,
    _id: '5ad78b7b4eafd63c8b14c5d8'
};

const deviceDisplayStateReported = {

    et: 'DeviceDisplayStateReported',
    etv: 1,
    at: 'Device',
    aid: 'sn0001-0001-TEST',
    data: {
      sn: 'sn0001-0001-DISP'
    },
    user: 'SYSTEM.DevicesReport.devices-report-handler',
    timestamp: 1524075387695,
    av: 71,
    _id: '5ad78b7b4eafd63c8b14c5d9'
};

const deviceSystemStateReported = {
    et: 'DeviceSystemStateReported',
    etv: 1,
    at: 'Device',
    aid: 'sn0001-0001-TEST',
    data: {
      temperature: 35,
      cpuStatus: [8, 18, 21],
      upTime: '15:43:58 up 2 days, 8:39, load average: 0.08, 0.18, 0.21'
    },
    user: 'SYSTEM.DevicesReport.devices-report-handler',
    timestamp: 1524075387696,
    av: 72,
    _id: '5ad78b7b4eafd63c8b14c5d7'
};

const deviceDeviceStateReported = {
    et: 'DeviceDeviceStateReported',
    etv: 1,
    at: 'Device',
    aid: 'sn0001-0001-TEST',
    data: {
      sn: 'sn0001-0001-TEST',
      type: 'OMVZ7',
      hostname: 'OMVZ7'
    },
    user: 'SYSTEM.DevicesReport.devices-report-handler',
    timestamp: 1524075387694,
    av: 69,
    _id: '5ad78b7b4eafd63c8b14c5d6'
};

const deviceMainAppStateReported = {
    et: 'DeviceMainAppStateReported',
    etv: 1,
    at: 'Device',
    aid: 'sn0001-0001-TEST',
    data: {
      appVers: {
        libgestionhardware: '15.05.22.01',
        libcontrolregistros: '17.10.31.1',
        'embedded.libgestionhardware': '18.02.13.3',
        libcommonentities: '17.12.21.1',
        AppUsosTrasnporte: '18.02.07.1',
        libcontrolmensajeria: '17.10.31.1',
        libparamoperacioncliente: '17.10.27.1',
        libcontrolconsecutivos: '13.07.19.1'
      },
      appTablesVers: {
        TablaTrayectos: '139',
        ListaNegra: '5378.07'
      }
    },
    user: 'SYSTEM.DevicesReport.devices-report-handler',
    timestamp: 1524091708222,
    av: 156,
    _id: '5ad7cb3c7e590343ad9fd502'
};

const deviceLowestVoltageReported = {
    et: 'DeviceLowestVoltageReported',
    etv: 1,
    at: 'Device',
    aid: 'sn0001-0001-TEST',
    data: {
      voltage: 11.95,
      timestamp: 1523479571.524613
    },
    user: 'SYSTEM.DevicesReport.devices-report-handler',
    timestamp: 1524085766469,
    av: 115,
    _id: '5ad7b406e1916b41499bfddc'
};

const deviceHighestVoltageReported = {
    et: 'DeviceHighestVoltageReported',
    etv: 1,
    at: 'Device',
    aid: 'sn0001-0001-TEST',
    data: {
      voltage: 11.95,
      timestamp: 1523479571.524613
    },
    user: 'SYSTEM.DevicesReport.devices-report-handler',
    timestamp: 1524085766469,
    av: 115,
    _id: '5ad7b406e1916b41499bfddc'
};

const expectedDeviceModemStateReported = {
  id: 'sn0001-0001-TEST',
  'deviceNetwork.cellid': 6666666,
  'deviceNetwork.band': 'WCDMA',
  'deviceNetwork.mode': 'WCDMA',
  'deviceNetwork.simStatus': 'OK',
  'deviceNetwork.simImei': '359072061300642'
};

const expectedDeviceNetworkStateReported = {
  id: 'sn0001-0001-TEST',
  'deviceNetwork.gateway': '192.168.188.188',
  'deviceNetwork.mac': '00:01:02:03:04:05',
  'deviceNetwork.dns': '192.168.188.188',
  'deviceNetwork.hostname': 'OMVZ7',
  'deviceNetwork.ipMaskMap': [
    {
      name: 'lo',
      addresses: ['127.0.0.1/8', '::1/128']
    },
    {
      name: 'eth1',
      addresses: ['172.28.99.216/28', 'fe80::d82a:bdff:fe31:e408/64']
    },
    {
      name: 'eth0',
      addresses: ['192.168.188.197/24', 'fe80::201:2ff:fe03:405/64']
    }
  ]
};

const expectedDeviceVolumesStateReported = {
  id: 'sn0001-0001-TEST',
  'deviceStatus.deviceDataList': [
    {
      currentValue: 456912,
      totalValue: 1026448,
      memorytype: 'MEM',
      memoryUnitInformation: 'KiB'
    },
    {
      currentValue: 830,
      totalValue: 7446,
      memorytype: 'SD',
      memoryUnitInformation: 'MiB'
    }
  ]
};

const expectedDeviceDisplayStateReported = {
  id: 'sn0001-0001-TEST',
  'deviceStatus.displaySn': 'sn0001-0001-DISP'
};

const expectedDeviceSystemStateReported = {
  id: 'sn0001-0001-TEST',
  'deviceStatus.temperature': 35,
  'deviceStatus.cpuStatus': [8, 18, 21],
  'deviceStatus.upTime':
    '15:43:58 up 2 days, 8:39, load average: 0.08, 0.18, 0.21'
};

const expectedDeviceDeviceStateReported = {
  id: 'sn0001-0001-TEST',
  'deviceStatus.devSn': 'sn0001-0001-TEST',
  'deviceStatus.type': 'OMVZ7',
  'deviceStatus.hostname': 'OMVZ7'
};

const expectedDeviceMainAppStateReported = {
  id: 'sn0001-0001-TEST',
  'appStatus.timestamp': 1524091708222,
  'appStatus.appTablesVersion.farePolicy': '139',
  'appStatus.appTablesVersion.blackList': '5378.07',
  'appStatus.appVersions': [
    {
      name: 'libgestionhardware',
      version: '15.05.22.01'
    },
    {
      name: 'libcontrolregistros',
      version: '17.10.31.1'
    },
    {
      name: 'embedded.libgestionhardware',
      version: '18.02.13.3'
    },
    {
      name: 'libcommonentities',
      version: '17.12.21.1'
    },
    {
      name: 'AppUsosTrasnporte',
      version: '18.02.07.1'
    },
    {
      name: 'libcontrolmensajeria',
      version: '17.10.31.1'
    },
    {
      name: 'libparamoperacioncliente',
      version: '17.10.27.1'
    },
    {
      name: 'libcontrolconsecutivos',
      version: '13.07.19.1'
    }
  ]
};
const expectedDeviceLowestVoltageReported = {
  id: 'sn0001-0001-TEST',
  'deviceStatus.voltage.lowestValue': 11.95
};

const expectedDeviceHighestVoltageReported = {
  id: 'sn0001-0001-TEST',
  'deviceStatus.voltage.highestValue': 11.95 
};

describe('BACKEND: devices', function() {
  describe('Domain: DeviceGeneralInformationFormatter', function() {
    it('formatIncomingReportV1$: deviceNetworkStateReported', function(done) {
      DeviceGeneralInformationFormatter.formatIncomingReportV1$(
        deviceNetworkStateReported
      ).subscribe(
        result => {
          assert.deepEqual(result, expectedDeviceNetworkStateReported);
        },
        error => {
          return done(error);
        },
        () => {
          return done();
        }
      );
    });

    it('formatIncomingReportV1$: DeviceModemStateReported', function(done) {
      DeviceGeneralInformationFormatter.formatIncomingReportV1$(
        deviceModemStateReported
      ).subscribe(
        result => {
          assert.deepEqual(result, expectedDeviceModemStateReported);
        },
        error => {
          return done(error);
        },
        () => {
          return done();
        }
      );
    });

    it('formatIncomingReportV1$: DeviceVolumesStateReported', function(done) {
      DeviceGeneralInformationFormatter.formatIncomingReportV1$(
        deviceVolumesStateReported
      ).subscribe(
        result => {
          assert.deepEqual(result, expectedDeviceVolumesStateReported);
        },
        error => {
          return done(error);
        },
        () => {
          return done();
        }
      );
    });

    it('formatIncomingReportV1$: DeviceDisplayStateReported', function(done) {
      DeviceGeneralInformationFormatter.formatIncomingReportV1$(
        deviceDisplayStateReported
      ).subscribe(
        result => {
          assert.deepEqual(result, expectedDeviceDisplayStateReported);
        },
        error => {
          return done(error);
        },
        () => {
          return done();
        }
      );
    });

    it('formatIncomingReportV1$: DeviceSystemStateReported', function(done) {
      DeviceGeneralInformationFormatter.formatIncomingReportV1$(
        deviceSystemStateReported
      ).subscribe(
        result => {
          assert.deepEqual(result, expectedDeviceSystemStateReported);
        },
        error => {
          return done(error);
        },
        () => {
          return done();
        }
      );
    });

    it('formatIncomingReportV1$: DeviceDeviceStateReported', function(done) {
      DeviceGeneralInformationFormatter.formatIncomingReportV1$(
        deviceDeviceStateReported
      ).subscribe(
        result => {
          assert.deepEqual(result, expectedDeviceDeviceStateReported);
        },
        error => {
          return done(error);
        },
        () => {
          return done();
        }
      );
    });

    it('formatIncomingReportV1$: DeviceMainAppStateReported', function(done) {
      DeviceGeneralInformationFormatter.formatIncomingReportV1$(
        deviceMainAppStateReported
      ).subscribe(
        result => {
          assert.deepEqual(result, expectedDeviceMainAppStateReported);
        },
        error => {
          return done(error);
        },
        () => {
          return done();
        }
      );
    });

    it('formatIncomingReportV1$: DeviceLowestVoltageReported', function(done) {
      DeviceGeneralInformationFormatter.formatIncomingReportV1$(
        deviceLowestVoltageReported
      ).subscribe(
        result => {
          assert.deepEqual(result, expectedDeviceLowestVoltageReported);
        },
        error => {
          return done(error);
        },
        () => {
          return done();
        }
      );
    });

    it('formatIncomingReportV1$: DeviceHighestVoltageReported', function(done) {
      DeviceGeneralInformationFormatter.formatIncomingReportV1$(
        deviceHighestVoltageReported
      ).subscribe(
        result => {
          assert.deepEqual(result, expectedDeviceHighestVoltageReported);
        },
        error => {
          return done(error);
        },
        () => {
          return done();
        }
      );
    });
  });
});
