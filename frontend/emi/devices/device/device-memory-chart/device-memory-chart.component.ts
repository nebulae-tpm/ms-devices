import { Component, OnInit, Input, Inject, ViewChild } from '@angular/core';
import { DeviceService } from '../device.service';
import * as shape from 'd3-shape';
import { range } from 'rxjs/observable/range';
import {
  scan,
  first,
  mergeMap,
  map,
  toArray,
  distinct,
  groupBy,
  tap
} from 'rxjs/operators';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatSnackBar,
  MatTableDataSource,
  MatPaginator,
  PageEvent
} from '@angular/material';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs/Observable';
import { Subscription, BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'app-device-memory-chart',
  templateUrl: './device-memory-chart.component.html',
  styleUrls: ['./device-memory-chart.component.scss']
})
export class DeviceMemoryChartComponent implements OnInit {
  currentRange = 0;
  historyRanges;
  labels = [];
  selectedDelta = 5;
  histogramHour = {};
  deviceHistoric: any;
  subscribers: Subscription[] = [];
  tableSize: number;
  alarmDataSource = new MatTableDataSource();
  displayedColumns = ['alarmState', 'alarmHour'];
  page = 0;
  count = 3;
  pageEvent: PageEvent;

  sortByHour = (a, b) => {
    if (a.timestamp < b.timestamp) return -1;
    if (a.timestamp > b.timestamp) return 1;
    return 0;
  };

  constructor(
    private deviceServie: DeviceService,
    private deviceService: DeviceService,
    public dialogRef: MatDialogRef<DeviceMemoryChartComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe,
    public snackBar: MatSnackBar
  ) {
    if (this.data.range) {
      this.changeSelectedDelta(this.data.range);
      this.currentRange = (this.data.range);
    }
    this.buildDeviceMemoryHistory(
      this.data.type,
      this.data.device,
      this.selectedDelta,
      this.data.alarmThreshold
    );
    this.historyRanges = { ONE_HOUR: 0, TWO_HOURS: 1, THREE_HOURS: 2 };
  }

  ngOnInit(): void {
    this.deviceService.events$.forEach(event => {
      event.type = event.type == 'MEM' ? 'RAM' : event.type;
      if (this.deviceHistoric.type == event.type) {
        this.buildDeviceMemoryHistory(
          event.type,
          event.value,
          this.selectedDelta,
          this.data.alarmThreshold
        );
      }
    });

    this.subscribers.push(
      this.deviceService
        .getAlarmTableSize(
          this.data.device.id,
          (this.data.type = this.data.type == 'MEM' ? 'RAM' : this.data.type),
          this.selectedDelta
        )
        .subscribe(result => {
          this.tableSize = result;
        })
    );
  }

  onChange($event) {
    this.page = $event.pageIndex;
    this.count = $event.pageSize;
    this.refreshAlarmDataTable($event.pageIndex, $event.pageSize);
  }

  ngOnDestroy() {
    if (this.subscribers) {
      this.subscribers.forEach(sub => {
        sub.unsubscribe();
      });
    }
  }

  changeHour($event) {
    this.changeSelectedDelta($event.value);
    this.buildDeviceMemoryHistory(
      this.data.type,
      this.data.device,
      this.selectedDelta,
      this.data.alarmThreshold
    );
    this.subscribers.push(
      this.deviceService
        .getAlarmTableSize(
          this.data.device.id,
          (this.data.type = this.data.type == 'MEM' ? 'RAM' : this.data.type),
          this.selectedDelta
        )
        .subscribe(result => {
          this.tableSize = result;
        })
    );
  }

  changeSelectedDelta(selectedValue) {
    switch (selectedValue) {
      case 0:
        this.selectedDelta = 5;
        break;
      case 1:
        this.selectedDelta = 10;
        break;
      case 2:
        this.selectedDelta = 15;
        break;
    }
  }

  /**
   * build histogram widget of device volume or device ram
   * @param type Type of origin data in device (MEM,SD,FLASH)
   * @param device Device that will show in histogram
   * @param deltaTime Delta time (Interval)
   */
  buildDeviceMemoryHistory(type, device, deltaTime, alarmThreshold) {
    if (type == 'CPU') {
      this.buildDeviceCpuHistory(
        this.data.device,
        this.selectedDelta,
        alarmThreshold
      );
    } else {
      type = type == 'MEM' ? 'RAM' : type;
      this.histogramHour[type] = deltaTime;
      const intervalValue = deltaTime * 60000;
      let endTime = new Date().getTime();
      const initTime = endTime - intervalValue * 12;
      let lastValue: any;
      const deviceDataMemory =
        type == 'RAM'
          ? device.deviceStatus.ram
          : this.getDeviceMemory(device, type);
      const originWidgetInfo =
        type == 'RAM'
          ? this.deviceService.getRamAvgInRangeOfTime(
              initTime,
              endTime,
              device.id
            )
          : this.deviceService.getSdAvgInRangeOfTime(
              initTime,
              endTime,
              type,
              deltaTime,
              device.id
            );
      this.subscribers.push(
        this.sortDeviceMemoryAvgResult(originWidgetInfo, deviceDataMemory, type)
          .pipe(
            mergeMap(rawData =>
              this.deviceService.buildChartMemoryWidget(
                rawData,
                type,
                alarmThreshold
                  ? alarmThreshold[type.toLowerCase() + 'Threshold']
                  : undefined
              )
            )
          )
          .subscribe(rawData => {
            if (rawData && rawData.data && rawData.data.length > 0) {
              this.deviceHistoric = rawData;
              this.refreshAlarmDataTable(this.page, this.count);
            } else {
              this.snackBar.open(
                'No se encontraron datos para graficar',
                'Cerrar',
                {
                  duration: 2000
                }
              );
              this.dialogRef.close();
            }
          })
      );
    }
  }

  refreshAlarmDataTable(page, count) {
    const intervalValue = this.selectedDelta * 60000;
    const endTime = new Date().getTime();
    const initTime = endTime - intervalValue * 12;
    this.deviceService
      .getDeviceAlarms$(
        this.data.device.id,
        (this.data.type = this.data.type == 'MEM' ? 'RAM' : this.data.type),
        initTime,
        endTime,
        this.page,
        this.count
      )
      .pipe(first())
      .subscribe(result => {
        this.alarmDataSource.data = result;
      });
  }

  alarmHour(timestamp) {
    return this.datePipe.transform(new Date(timestamp), 'HH:mm');
  }

  /**
   * build histogram widget of device cpu
   * @param device Device that will show in histogram
   * @param deltaTime Delta time (Interval)
   */
  buildDeviceCpuHistory(device, deltaTime, alarmThreshold) {
    const intervalValue = deltaTime * 60000;
    let endTime = new Date().getTime();
    const initTime = endTime - intervalValue * 12;
    let lastValue: any;
    const originWidgetInfo = this.deviceService.getCpuAvgInRangeOfTime(
      initTime,
      endTime,
      deltaTime,
      device.id
    );
    this.subscribers.push(
      this.sortCpuAvgResult(originWidgetInfo).subscribe(rawData => {
        this.refreshAlarmDataTable(this.page, this.count);
        if (rawData.length < 1) {
          this.snackBar.open(
            'No se encontraron datos para graficar',
            'Cerrar',
            {
              duration: 2000
            }
          );
          this.dialogRef.close();
          return;
        } else {
          this.subscribers.push(
            this.deviceService
              .buildChartMemoryWidget(
                rawData,
                'CPU',
                alarmThreshold['cpuThreshold']
              )
              .subscribe(rawData => {
                if (rawData && rawData.data && rawData.data.length > 0) {
                  this.deviceHistoric = rawData;
                } else {
                  this.snackBar.open(
                    'No se encontraron datos para graficar',
                    'Cerrar',
                    {
                      duration: 2000
                    }
                  );
                  this.dialogRef.close();
                }
              })
          );
        }
      })
    );
  }

  getDeviceMemory(device, type) {
    if (type == 'MEM') {
      return device.deviceStatus.ram;
    } else if (type == 'SD') {
      return device.deviceStatus.sdStatus;
    }
  }

  sortDeviceMemoryAvgResult(obsResult, deviceDataMemory, type) {
    return (obsResult as Observable<any>).pipe(
      first(),
      mergeMap(result => {
        return Observable.from(result as any[]).pipe(
          map(rawData => {
            if (type == 'RAM') {
              return {
                value: Math.floor(
                  rawData.deviceStatus.ram.currentValue /
                  deviceDataMemory.totalValue *
                  100
                ),
                timeInterval: this.datePipe.transform(
                  new Date(rawData.timestamp),
                  'HH:mm'
                ),
                timestamp: rawData.timestamp
              };
            }
            else if (type == 'SD') {
              return {
                value: Math.floor(
                  rawData.deviceStatus.sdStatus.currentValue /
                  deviceDataMemory.totalValue *
                  100
                ),
                timeInterval: this.datePipe.transform(
                  new Date(rawData.timestamp),
                  'HH:mm'
                ),
                timestamp: rawData.timestamp
              };
            }
          }),
          toArray(),
          map(unsortedArray => {
            return unsortedArray.sort(this.sortByHour);
          }),
          mergeMap(sortedArray => {
            return Observable.from(sortedArray).pipe(
              groupBy(memoryValue => (memoryValue as any).timeInterval),
              mergeMap(group => group.pipe(first()))
            );
          }),
          toArray()
        );
      })
    );
  }

  sortCpuAvgResult(obsResult) {
    return (obsResult as Observable<any>).pipe(
      first(),
      mergeMap(result => {
        return Observable.from(result as any[]).pipe(
          map(rawData => {
            return {
              value: Math.floor(rawData.value),
              timeInterval: this.datePipe.transform(
                new Date(rawData.timestamp),
                'HH:mm'
              ),
              timestamp: rawData.timestamp
            };
          }),
          toArray(),
          map(unsortedArray => {
            return unsortedArray.sort(this.sortByHour);
          }),
          mergeMap(sortedArray => {
            return Observable.from(sortedArray).pipe(
              groupBy(memoryValue => (memoryValue as any).timeInterval),
              mergeMap(group => group.pipe(first()))
            );
          }),
          toArray()
        );
      })
    );
  }
}
