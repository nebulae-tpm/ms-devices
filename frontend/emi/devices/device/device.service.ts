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
import {
  getDeviceState,
  getDeviceNetwork,
  getRamAvgInRangeOfTime,
  getVolumeAvgInRangeOfTime,
  getCpuAvgInRangeOfTime,
  getVoltageInRangeOfTime
} from '../gql/Device';
import { map, first, mergeMap, toArray, pairwise } from 'rxjs/operators';
import 'rxjs/Rx';
import { Subscription } from 'rxjs/Rx';
import { variable } from '@angular/compiler/src/output/output_ast';
import gql from 'graphql-tag';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class DeviceService {
  routeParams: any;
  device: any;
  deviceWidgets: any = {};
  INTERVAL_VALUE = 600000;
  private _subject = new Subject<any>();

  newEvent(event) {
    this._subject.next(event);
  }

  get events$() {
    return this._subject.asObservable();
  }
  constructor(
    private dummyDataService: DummyDataService,
    private gateway: GatewayService,
    private datePipe: DatePipe
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

  getRamAvgInRangeOfTime(
    initTime,
    endTime,
    deviceId
  ): Observable<any> {
    console.log(`iniTime: ${initTime} endTime: ${endTime} deviceId: ${deviceId}`)
    return this.gateway.apollo
      .query<any>({
        query: getRamAvgInRangeOfTime,
        variables: {
          initTime: initTime,
          endTime: endTime,
          deviceId: deviceId
        }
      })
      .pipe(map(rawData => {
        return rawData.data.getRamAvgInRangeOfTime;
      }));
  }

  getVolumeAvgInRangeOfTime(
    initTime,
    endTime,
    type,
    deltaTime,
    deviceId
  ): Observable<any> {
    return this.gateway.apollo
      .query<any>({
        query: getVolumeAvgInRangeOfTime,
        variables: {
          initTime: initTime,
          endTime: endTime,
          type: type,
          deltaTime: deltaTime,
          deviceId: deviceId
        }
      })
      .pipe(map(rawData => rawData.data.getVolumeAvgInRangeOfTime));
  }

  getCpuAvgInRangeOfTime(
    initTime,
    endTime,
    deltaTime,
    deviceId
  ): Observable<any> {
    return this.gateway.apollo
      .query<any>({
        query: getCpuAvgInRangeOfTime,
        variables: {
          initTime: initTime,
          endTime: endTime,
          deltaTime: deltaTime,
          deviceId: deviceId
        }
      })
      .pipe(map(rawData => rawData.data.getCpuAvgInRangeOfTime));
  }

  getVoltageInRangeOfTime(
    initTime,
    endTime,
    deltaTime,
    deviceId
  ): Observable<any> {
    return this.gateway.apollo
      .query<any>({
        query: getVoltageInRangeOfTime,
        variables: {
          initTime: initTime,
          endTime: endTime,
          deltaTime: deltaTime,
          deviceId: deviceId
        }
      })
      .pipe(map(rawData => rawData.data.getVoltageInRangeOfTime));
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
                max: 200
              }
            }
          ]
        }
      }
    };
  }

  buildChartMemoryWidget(deviceList, type) {
    return Observable.from(deviceList).pipe(
      toArray(),
      mergeMap(sortedIntervals => {
        return Observable.forkJoin(
          Observable.from(sortedIntervals)
            .map(toValueList => (toValueList as any).value)
            .toArray(),
          Observable.from(sortedIntervals)
            .map(toTimeIntervalList => (toTimeIntervalList as any).timeInterval)
            .toArray()
        );
      }),
      map(([valueList, timeIntervalList]) => {
        return this.buildMemoryWidget(
          valueList,
          timeIntervalList,
          type
        );
      })
    );
  }

  buildVoltageWidget(voltageList) {
    return Observable.from(voltageList).pipe(
      toArray(),
      mergeMap(sortedIntervals => {
        return Observable.forkJoin(
          Observable.from(sortedIntervals)
            .map(toCurrentValueList => {
              return {name:(toCurrentValueList as any).timeInterval , value: (toCurrentValueList as any).currentValue };
            })
            .toArray(),
          Observable.from(sortedIntervals)
            .map(toHighestValueList => {
              return {name:(toHighestValueList as any).timeInterval , value: (toHighestValueList as any).highestValue };
            })
            .toArray(),
          Observable.from(sortedIntervals)
            .map(toLowestValueList =>
              {
                return {name:(toLowestValueList as any).timeInterval , value: (toLowestValueList as any).lowestValue };
              })
            .toArray()
        );
      }),
      map(([currentValueList, highestValueList, lowestValueList]) => {
        return {
          scheme: {
            domain: [ '#ffc107','#5c84f1', '#f44336']
          },
          today: '12,540',
          change: {
            value: 321,
            percentage: 2.05
          },
          data: [
            {
              name: 'Mas bajo',
              series: lowestValueList
            },
            {
              name: 'Actual',
              series: currentValueList
            },
            {
              name: 'Mas alto',
              series: highestValueList
            }
          ],
          dataMin: 538,
          dataMax: 541
        };
      })
    );
  }

  buildMemoryWidget(valueList, timeIntervalList, type) {
    return {
      type: type,
      chartType: 'line',
      datasets: [
        {
          label: `${type}(%)`,
          data: valueList,
          fill: 'start'
        }
      ],
      labels: timeIntervalList,
      colors: [
        {
          borderColor: "rgba(30, 136, 229, 0.0)",
          backgroundColor: "rgba(30, 136, 229, 0.0)",
          pointBackgroundColor: "rgba(30, 136, 229, 1)",
          pointHoverBackgroundColor: "rgba(30, 136, 229, 1)",
          pointBorderColor: "#ffffff",
          pointHoverBorderColor: "#ffffff"
        },
        {
          borderColor: "rgba(30, 136, 229, 0.0)",
          backgroundColor: "rgba(30, 136, 229, 0.0)",
          pointBackgroundColor: "rgba(30, 136, 229, 1)",
          pointHoverBackgroundColor: "rgba(30, 136, 229, 1)",
          pointBorderColor: "#ffffff",
          pointHoverBorderColor: "#ffffff"
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
          name: 'Usado',
          value: valueStatus,
          totalValue: currentValue
        },
        {
          name: 'Libre',
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
          DeviceVolumesStateReportedEvent(ids: "${deviceId}") {
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

  subscribeToDeviceConnectedEvent$(deviceId): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          DeviceConnectedEvent(ids: "${deviceId}") {
            id
            deviceStatus {
              online
            }
          }
        }
      `
    });
  }

  subscribeToDeviceDisconnectedEvent$(deviceId): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          subscribeToDeviceDisconnectedEvent(ids: "${deviceId}") {
            id
            deviceStatus {
              online
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
          DeviceSystemStateReportedEvent(ids: "${deviceId}") {
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
          DeviceDeviceStateReportedEvent(ids: "${deviceId}") {
            id
            deviceStatus {
              devSn
              hostname
              groupName
              type
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
