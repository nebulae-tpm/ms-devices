import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot
} from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { range } from 'rxjs/observable/range';
import { DummyDataService } from '../dummy-data.service';
import { Devices } from '../gql/Devices';
import { GatewayService } from '../../../../api/gateway.service';
import { getDeviceState, getDeviceNetwork } from '../gql/Device';
import { map } from 'rxjs/operators';
import 'rxjs/Rx';
import { Subscription } from 'rxjs/Rx';
import { variable } from '@angular/compiler/src/output/output_ast';
import gql from 'graphql-tag';
@Injectable()
export class DeviceService {
  routeParams: any;
  device: any;
  deviceWidgets: any = {};

  constructor(
    private dummyDataService: DummyDataService,
    private gateway: GatewayService
  ) {}

  getDeviceState(deviceId): Observable<any> {
    return this.gateway.apollo
      .query<any>({
        query: getDeviceState,
        variables: {
          id: deviceId
        }
      })
      .pipe(map(rawData => rawData.data.getDeviceDetail));
  }

  getDeviceNetwork(id): Observable<any> {
    return this.gateway.apollo
      .query<any>({
        query: getDeviceNetwork,
        variables: {
          id: id
        }
      })
      .pipe(map(rawData => rawData.data.getDeviceDetail));
  }

  //TODO: se esta trabajando con datos dummy se debe realizar implementacion real
  getDeviceMemmoryAlarms() {
    return;
  }

  buildBarWidget(cpuStatus) {
    return {
      chartType: 'bar',
      datasets: [
        {
          label: 'CPU',
          data: cpuStatus
        }
      ],
      labels: ['1 min', '5 min', '15 min'],
      colors: [
        {
          borderColor: '#42a5f5',
          backgroundColor: '#42a5f5'
        }
      ],
      options: {
        spanGaps: false,
        legend: {
          display: false
        },
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 24,
            left: 16,
            right: 16,
            bottom: 16
          }
        },
        scales: {
          xAxes: [
            {
              display: false
            }
          ],
          yAxes: [
            {
              display: true,
              ticks: {
                min: 1,
                max: 100
              }
            }
          ]
        }
      }
    };
  }

  buildChartMemoryWidget(name, snapShots) {
    return {
      chartType: 'line',
      datasets: [
        {
          label: 'Usado',
          data: [0, 40, 20, 45, 80, 90],
          fill: 'start'
        },
        {
          label: 'Libre',
          data: [100, 60, 80, 55, 20, 10],
          fill: 'start'
        }
      ],
      labels: ['12am', '2am', '4am', '6am', '8am', '10am'],
      colors: [
        {
          borderColor: '#3949ab',
          backgroundColor: '#3949ab',
          pointBackgroundColor: '#3949ab',
          pointHoverBackgroundColor: '#3949ab',
          pointBorderColor: '#ffffff',
          pointHoverBorderColor: '#ffffff'
        },
        {
          borderColor: 'rgba(30, 136, 229, 0.87)',
          backgroundColor: 'rgba(30, 136, 229, 0.87)',
          pointBackgroundColor: 'rgba(30, 136, 229, 0.87)',
          pointHoverBackgroundColor: 'rgba(30, 136, 229, 0.87)',
          pointBorderColor: '#ffffff',
          pointHoverBorderColor: '#ffffff'
        }
      ],
      options: {
        spanGaps: false,
        legend: {
          display: false
        },
        maintainAspectRatio: false,
        tooltips: {
          position: 'nearest',
          mode: 'index',
          intersect: false
        },
        layout: {
          padding: {
            left: 24,
            right: 32
          }
        },
        elements: {
          point: {
            radius: 4,
            borderWidth: 2,
            hoverRadius: 4,
            hoverBorderWidth: 2
          }
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                fontColor: 'rgba(0,0,0,0.54)'
              }
            }
          ],
          yAxes: [
            {
              gridLines: {
                tickMarkLength: 16
              },
              ticks: {
                stepSize: 50
              }
            }
          ]
        },
        plugins: {
          filler: {
            propagate: false
          }
        }
      }
    };
  }

  buildPieWidget(
    color,
    valueStatus,
    currentValue,
    totalValue,
    unitInformation
  ) {
    return {
      scheme: {
        domain: [color, '#B6B2B2']
      },
      data: [
        {
          name: 'DEVICE.USED',
          value: valueStatus,
          totalValue: currentValue
        },
        {
          name: 'DEVICE.FREE',
          value: 100 - valueStatus,
          totalValue: totalValue - currentValue
        }
      ],
      currentValue: currentValue,
      totalValue: totalValue,
      unitInformation: unitInformation
    };
  }

  subscribeToDeviceVolumesStateReportedEvent$(deviceId): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          DeviceVolumesStateReportedEvent(id: "${deviceId}") {
            id
            deviceStatus {
              deviceDataList {
                totalValue
                currentValue
                memoryUnitInformation
                memorytype
              }
            }
          }
        }
      `
    });
  }

  subscribeToDeviceDisplayStateReportedEvent$(deviceId): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          DeviceDisplayStateReportedEvent(id: "${deviceId}") {
            id
            deviceStatus {
              displaySn
            }
          }
        }
      `
    });
  }

  subscribeToDeviceSystemStateReportedEvent$(deviceId): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          DeviceSystemStateReportedEvent(id: "${deviceId}") {
            id
            deviceStatus {
              temperature
              cpuStatus
              upTime
              voltage{
                currentValue
                highestValue
                lowestValue
              }
              ram {
                totalValue
                currentValue
                memoryUnitInformation
              }
            }
          }
        }
      `
    });
  }

  subscribeToDeviceDeviceStateReportedEvent$(deviceId): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          DeviceDeviceStateReportedEvent(id: "${deviceId}") {
            id
            deviceStatus {
              devSn
              hostname
            }
          }
        }
      `
    });
  }


  subscribeToDeviceNetworkStateReportedEvent$(deviceId): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          DeviceNetworkStateReportedEvent(id: "${deviceId}") {
            id
            deviceNetwork {
              gateway
              mac
              dns
              ipMaskMap {
                name
                addresses
              }
            }
          }
        }
      `
    });
  }

  subscribeToDeviceModemStateReportedEvent$(deviceId): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          DeviceModemStateReportedEvent(id: "${deviceId}") {
            id
            deviceNetwork {
              band
              mode
              simImei
              simStatus
            }
          }
        }
      `
    });
  }

  subscribeToDeviceMainAppStateReportedEvent$(deviceId): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          DeviceMainAppStateReportedEvent(id: "${deviceId}") {
            id
            appStatus {
              timestamp
              appTablesVersion {
                farePolicy
                blackList
              }
              appVersions {
                name
                version
              }
            }
          }
        }
      `
    });
  }
}
