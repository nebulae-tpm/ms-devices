const Rx = require('rxjs');

class DeviceGeneralInformationFormatter {
  /**
   * Decompress DeviceGeneralInformation report and format it to the standard format
   * @param {Object} rawData
   */
  static formatReport$(rawData) {
    return Rx.Observable.of(rawData).mergeMap(unformatted =>
      this.formatIncomingReport$(unformatted)
    );
  }

  /**
   * Process incoming De report from a device and formats to the standard format
   * @param {*} incomingReport
   */
  static formatIncomingReport$(incomingEvent) {
    switch (incomingEvent.etv) {
      case 1:
        return this.formatIncomingReportV1$(incomingEvent);
        break;
      default:
        throw new Error(
          'Incoming Device General Information has an unsupported version: ' +
            incomingEvent.v
        );

        break;
    }
  }

  /**
   * Process incoming compressed report (with version:1) from a device and formats to the standard format
   * @param {*} report
   */
  static formatIncomingReportV1$(event) {
    return Rx.Observable.forkJoin(
      Rx.Observable.of(event).map(rawData => {
        return { id: rawData.aid };
      }),
      this.extractDeviceNetworkStateReported$(event.data, event.et),
      this.extractDeviceStatusReported$(event.data, event.et),
      this.extractDeviceAppStatus$(event.data, event.et, event.timestamp)
    ).map(([device, deviceNetwork, deviceState, appStatus]) => {
      let result = {};
      if (deviceNetwork) {
        result = Object.assign({}, device, deviceNetwork);
      }
      if (deviceState) {
        result = Object.assign({}, device, deviceState);
      }
      if (appStatus) {
        result = Object.assign({}, device, appStatus);
      }
      return JSON.parse(JSON.stringify(result));
    });
  }

  static extractDeviceStatusReported$(eventData, eventType) {
    const deviceStatus = {};
    if (eventType == 'DeviceVolumesStateReported') {
      return Rx.Observable.from(eventData)
        .map(data => {
          return {
            totalValue: data.total,
            currentValue: data.current,
            memoryUnitInformation: data.unit,
            memorytype: data.type
          };
        })
        .toArray()
        .map(dataList => {
          deviceStatus['deviceStatus.deviceDataList'] = dataList;
          return deviceStatus;
        });
    } else if (eventType == 'DeviceDisplayStateReported') {
      return Rx.Observable.of(eventData).map(data => {
        deviceStatus['deviceStatus.displaySn'] = data.sn;
        return deviceStatus;
      });
    } else if (eventType == 'DeviceSystemStateReported') {
      return Rx.Observable.of(eventData).map(data => {
        deviceStatus['deviceStatus.temperature'] = data.temperature;
        deviceStatus['deviceStatus.cpuStatus'] = data.cpuStatus;
        deviceStatus['deviceStatus.upTime'] = data.upTime;
        if (data.voltage) {
          deviceStatus['deviceStatus.voltage.lowestValue'] = data.voltage.low;
          deviceStatus['deviceStatus.voltage.currentValue'] =
            data.voltage.current;
          deviceStatus['deviceStatus.voltage.highestValue'] = data.voltage.high;
        }
        if (data.ram) {
          deviceStatus['deviceStatus.ram.currentValue'] = data.ram.current;
          deviceStatus['deviceStatus.ram.totalValue'] = data.ram.total;
          deviceStatus['deviceStatus.ram.memoryUnitInformation'] =
            data.ram.unit;
        }
        return deviceStatus;
      });
    } else if (eventType == 'DeviceDeviceStateReported') {
      return Rx.Observable.of(eventData).map(data => {
        deviceStatus['deviceStatus.devSn'] = data.sn;
        deviceStatus['deviceStatus.type'] = data.type;
        deviceStatus['deviceStatus.hostname'] = data.hostname;
        deviceStatus['deviceStatus.groupName'] = data.groupName;
        return deviceStatus;
      });
    } else if (eventType == 'DeviceConnected') {
      return Rx.Observable.of(eventData).map(data => {
        deviceStatus['deviceStatus.online'] = data.connected;
        return deviceStatus;
      });
    } else if (eventType == 'DeviceDisconnected') {
      return Rx.Observable.of(eventData).map(data => {
        deviceStatus['deviceStatus.online'] = data.connected;
        return deviceStatus;
      });
    } else {
      return Rx.Observable.of(undefined);
    }
  }

  static extractDeviceNetworkStateReported$(eventData, eventType) {
    const deviceNetwork = {};
    if (eventType == 'DeviceNetworkStateReported') {
      const deviceInterfacesConverter$ = eventData.interfaces
      ? Rx.Observable.from(Object.keys(eventData.interfaces))
          .map(ipMaskMap => {
            return {
              name: ipMaskMap,
              addresses: eventData.interfaces[ipMaskMap]
            };
          })
          .toArray()
      : Rx.Observable.of(undefined);
      return Rx.Observable.forkJoin(
        Rx.Observable.of(eventData).map(data => {
          deviceNetwork['deviceNetwork.gateway'] = data.gateway;
          deviceNetwork['deviceNetwork.mac'] = data.mac;
          deviceNetwork['deviceNetwork.dns'] = data.dns.length > 0 ? data.dns[0]: undefined;
          deviceNetwork['deviceNetwork.hostname'] = data.hostname;
          return deviceNetwork;
        }),
        deviceInterfacesConverter$
      ).map(([deviceNetwork, deviceNetworkInteraces]) => {
        deviceNetwork['deviceNetwork.ipMaskMap'] = deviceNetworkInteraces;
        return deviceNetwork;
      });
    } else if (eventType == 'DeviceModemStateReported') {
      return Rx.Observable.of(eventData).map(data => {
        deviceNetwork['deviceNetwork.band'] = data.band;
        deviceNetwork['deviceNetwork.mode'] = data.mode;
        deviceNetwork['deviceNetwork.cellid'] = data.cellid;
        deviceNetwork['deviceNetwork.simImei'] = data.simImei;
        deviceNetwork['deviceNetwork.simStatus'] = data.simStatus;
        return deviceNetwork;
      });
    } else {
      return Rx.Observable.of(undefined);
    }
  }

  static extractDeviceAppStatus$(eventData, eventType, timestamp) {
    const appStatus = {};    
    if (eventType == 'DeviceMainAppStateReported') {
      const appVersConverter$ = eventData.appVers
      ? Rx.Observable.from(Object.keys(eventData.appVers))
          .map(data => {
            return { name: data, version: eventData.appVers[data] };
          })
          .toArray()
      : Rx.Observable.of(undefined);
      return Rx.Observable.forkJoin(
        Rx.Observable.of(eventData).map(data => {
          appStatus['appStatus.timestamp'] = timestamp;
          if (data.appTablesVers) {
            appStatus['appStatus.appTablesVersion.farePolicy'] =
              data.appTablesVers.TablaTrayectos;
            appStatus['appStatus.appTablesVersion.blackList'] =
              data.appTablesVers.ListaNegra;
          }
          return appStatus;
        }),
        appVersConverter$
      ).map(([appStatus, appVers]) => {
        appStatus['appStatus.appVersions'] = appVers;
        return appStatus;
      });
    } else {
      return Rx.Observable.of(undefined);
    }
  }
}

module.exports = DeviceGeneralInformationFormatter;
