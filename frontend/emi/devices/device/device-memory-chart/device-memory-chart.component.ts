import { Component, OnInit, Input, Inject } from '@angular/core';
import { DeviceService } from '../device.service';
import * as shape from 'd3-shape';
import { range } from 'rxjs/observable/range';
import { scan, first, mergeMap, map, toArray, distinct, groupBy, tap } from 'rxjs/operators';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatSnackBar
} from '@angular/material';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs/Observable';

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
    this.buildDeviceMemoryHistory(
      this.data.type,
      this.data.device,
      this.selectedDelta
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
          this.selectedDelta
        );
      }
    });
  }

  changeHour($event) {
    switch ($event.value) {
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
    this.buildDeviceMemoryHistory(
      this.data.type,
      this.data.device,
      this.selectedDelta
    );
  }

  /**
   * build histogram widget of device volume or device ram
   * @param type Type of origin data in device (MEM,SD,FLASH)
   * @param device Device that will show in histogram
   * @param deltaTime Delta time (Interval)
   */
  buildDeviceMemoryHistory(type, device, deltaTime) {
    if (type == 'CPU') {
      this.buildDeviceCpuHistory(this.data.device, this.selectedDelta);
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
          : this.deviceService.getVolumeAvgInRangeOfTime(
              initTime,
              endTime,
              type,
              deltaTime,
              device.id
            );
      this.sortDeviceMemoryAvgResult(originWidgetInfo, deviceDataMemory, type)
        .pipe(
          mergeMap(rawData =>
            this.deviceService.buildChartMemoryWidget(rawData, type)
          )
        )
        .subscribe(rawData => {
          if (rawData && rawData.labels.length > 0) {
            this.deviceHistoric = rawData;
            this.labels.length = 0;
            for (let i = 0; i < this.deviceHistoric.labels.length; i++) {
              this.labels.push(this.deviceHistoric.labels[i]);
            }
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
        });
    }
  }

  /**
   * build histogram widget of device cpu
   * @param device Device that will show in histogram
   * @param deltaTime Delta time (Interval)
   */
  buildDeviceCpuHistory(device, deltaTime) {
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
    this.sortCpuAvgResult(originWidgetInfo).subscribe(rawData => {
      if (rawData.length < 1) {
        this.snackBar.open('No se encontraron datos para graficar', 'Cerrar', {
          duration: 2000
        });
        this.dialogRef.close();
        return;
      }
      else {
        this.deviceService
        .buildChartMemoryWidget(rawData, 'CPU')
        .subscribe(result => {
          this.deviceHistoric = result;
          this.labels.length = 0;
          for (let i = 0; i < this.deviceHistoric.labels.length; i++) {
            this.labels.push(this.deviceHistoric.labels[i]);
          }
        });
      }
    });
  }

  getDeviceMemory(device, type) {
    if (type == 'MEM') {
      return device.deviceStatus.ram;
    } else {
      return (
        device.deviceStatus.deviceDataList.filter(
          data => data.memorytype == type
        )[0] || { totalValue: 1, currentValue: 0, memoryUnitInformation: 'NA' }
      );
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
            } else {
              return {
                value: Math.floor(
                  rawData.value / deviceDataMemory.totalValue * 100
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
            return unsortedArray.sort(this.sortByHour)
          }),
          mergeMap(sortedArray => {
            return Observable.from(sortedArray).pipe(groupBy(memoryValue => (memoryValue as any).timeInterval),
            mergeMap(group => group.pipe(first())),)
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
            return unsortedArray.sort(this.sortByHour)
          }),
          mergeMap(sortedArray => {
            return Observable.from(sortedArray).pipe(groupBy(memoryValue => (memoryValue as any).timeInterval),
            mergeMap(group => group.pipe(first())),)
          }),
          toArray()
        );
      })
    );
  }
}
