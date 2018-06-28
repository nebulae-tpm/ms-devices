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
  getSdAvgInRangeOfTime,
  getCpuAvgInRangeOfTime,
  getVoltageInRangeOfTime,
  getDeviceAlarmThresholds,
  getDeviceAlarms,
  getAlarmTableSize
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

  //#region GRAPHQL_QUERIES
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
  getDeviceAlarms$(
    deviceId,
    alarmType,
    initTime,
    endTime,
    page,
    count
  ): Observable<any> {
    return this.gateway.apollo
      .query<any>({
        query: getDeviceAlarms,
        variables: {
          deviceId,
          alarmType,
          initTime,
          endTime,
          page,
          count
        }
      })
      .pipe(map(rawData => rawData.data.getDeviceAlarms));
  }

  getDeviceAlarmThresholds(): Observable<any> {
    return this.gateway.apollo
      .query<any>({
        query: getDeviceAlarmThresholds
      })
      .pipe(map(rawData => rawData.data.getDeviceAlarmThresholds));
  }

  getAlarmTableSize(deviceId, alarmType, selectedDelta): Observable<number> {
    const endTime = new Date().getTime();
    const intervalValue = selectedDelta * 60000;
    const initTime = endTime - intervalValue * 12;
    return this.gateway.apollo
      .query<any>({
        query: getAlarmTableSize,
        variables: {
          deviceId,
          alarmType,
          initTime,
          endTime
        }
      })
      .pipe(map(rawData => rawData.data.getAlarmTableSize));
  }

  getRamAvgInRangeOfTime(initTime, endTime, deviceId): Observable<any> {
    return this.gateway.apollo
      .query<any>({
        query: getRamAvgInRangeOfTime,
        variables: {
          initTime: initTime,
          endTime: endTime,
          deviceId: deviceId
        }
      })
      .pipe(
        map(rawData => {
          return rawData.data.getRamAvgInRangeOfTime;
        })
      );
  }

  getSdAvgInRangeOfTime(
    initTime,
    endTime,
    type,
    deltaTime,
    deviceId
  ): Observable<any> {
    return this.gateway.apollo
      .query<any>({
        query: getSdAvgInRangeOfTime,
        variables: {
          initTime: initTime,
          endTime: endTime,
          deltaTime: deltaTime,
          deviceId: deviceId
        }
      })
      .pipe(map(rawData => rawData.data.getSdAvgInRangeOfTime));
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
  //#endregion

  //#region DEVICE HISTORY CHARTS

  buildChartMemoryWidget(deviceList, type, threshold) {
    return Observable.from(deviceList).pipe(
      map(memoryValue => {
        return {
          name: (memoryValue as any).timeInterval,
          value: (memoryValue as any).value
        };
      }),
      toArray(),
      map(memoryList => {
        return this.buildMemoryWidget(memoryList, type, threshold);
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
              return {
                name: (toCurrentValueList as any).timeInterval,
                value: (toCurrentValueList as any).currentValue
              };
            })
            .toArray(),
          Observable.from(sortedIntervals)
            .map(toHighestValueList => {
              return {
                name: (toHighestValueList as any).timeInterval,
                value: (toHighestValueList as any).highestValue
              };
            })
            .toArray(),
          Observable.from(sortedIntervals)
            .map(toLowestValueList => {
              return {
                name: (toLowestValueList as any).timeInterval,
                value: (toLowestValueList as any).lowestValue
              };
            })
            .toArray()
        );
      }),
      map(([currentValueList, highestValueList, lowestValueList]) => {
        if (
          (!currentValueList || currentValueList.length < 1) &&
          (!highestValueList || highestValueList.length < 1) &&
          (!lowestValueList || lowestValueList.length < 1)
        ) {
          return undefined;
        } else {
          return {
            scheme: {
              domain: ['#ffc107', '#5c84f1', '#f44336']
            },
            today: '12,540',
            change: {
              value: 321,
              percentage: 2.05
            },
            data: [
              {
                name: 'Min.',
                series: lowestValueList
              },
              {
                name: 'Actual',
                series: currentValueList
              },
              {
                name: 'Max',
                series: highestValueList
              }
            ],
            dataMin: 538,
            dataMax: 541
          };
        }
      })
    );
  }

  buildMemoryWidget(memoryList, type, threshold) {
    if (!memoryList || memoryList.length < 1) {
      return undefined;
    } else {
      const data = [
        {
          name: type,
          series: memoryList
        }
      ];
      if (threshold) {
        data.push({
          name: 'Umbral',
          series: [
            { name: memoryList[0].name, value: threshold },
            { name: memoryList[memoryList.length - 1].name, value: threshold }
          ]
        });
      }
      return {
        type: type,
        scheme: {
          domain: ['#5c84f1', '#f44336']
        },
        maxValue: type == 'CPU' ? 200 : 100,
        data: data
      };
    }
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

  //#endregion

  //#region GRAPHQL SUBSCRIPTIONS
  subscribeToDeviceVolumesStateReportedEvent$(deviceId): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          DeviceVolumesStateReportedEvent(ids: "${deviceId}") {
            id
            deviceStatus {
              sdStatus {
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

  subscribeToDeviceTemperatureAlarmActivatedEvent$(deviceId): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          DeviceTemperatureAlarmActivatedEvent(id: "${deviceId}") {
            id
            deviceStatus {
              alarmTempActive
            }
          }
        }
      `
    });
  }

  subscribeToDeviceTemperatureAlarmDeactivatedEvent$(
    deviceId
  ): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: gql`
        subscription {
          DeviceTemperatureAlarmDeactivatedEvent(id: "${deviceId}") {
            id
            deviceStatus {
              alarmTempActive
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
  //#endregion
}
