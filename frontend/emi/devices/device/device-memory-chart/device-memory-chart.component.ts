import { Component, OnInit, Input, Inject } from '@angular/core';
import { DeviceService } from '../device.service';
import * as shape from 'd3-shape';
import { range } from 'rxjs/observable/range';
import { scan, first, mergeMap, map, toArray } from 'rxjs/operators';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
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
    if (a.timeInterval < b.timeInterval) return -1;
    if (a.timeInterval > b.timeInterval) return 1;
    return 0;
  };

  constructor(
    private deviceServie: DeviceService,
    private deviceService: DeviceService,
    public dialogRef: MatDialogRef<DeviceMemoryChartComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe
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
        console.log('ingresa a actualizar: ', event.type);
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
      const roundedEndTime =
        endTime +
        (deltaTime -
          Number(this.datePipe.transform(new Date(endTime), 'mm')) %
            deltaTime) *
          60000;
      const initTime = roundedEndTime - intervalValue * 7;
      let lastValue: any;
      const deviceDataMemory =
        type == 'RAM'
          ? device.deviceStatus.ram
          : this.getDeviceMemory(device, type);
      const originWidgetInfo =
        type == 'RAM'
          ? this.deviceService.getRamAvgInRangeOfTime(
              initTime,
              roundedEndTime,
              deltaTime,
              device.id
            )
          : this.deviceService.getVolumeAvgInRangeOfTime(
              initTime,
              roundedEndTime,
              type,
              deltaTime,
              device.id
            );
      this.sortDeviceMemoryAvgResult(
        originWidgetInfo,
        deviceDataMemory
      ).subscribe(rawData => {
        this.buildAvgDeltas(roundedEndTime, intervalValue).subscribe(deltas => {
          let widgetValueList = [];
          let lastValue;
          deltas.forEach(hour => {
            const temporalDelta = rawData.filter(
              widgetValue => widgetValue.timeInterval === hour
            )[0];
            const currentDelta = temporalDelta
              ? temporalDelta
              : {
                  timeInterval: hour,
                  freeValue: lastValue ? lastValue.freeValue : 100,
                  usedValue: lastValue ? lastValue.usedValue : 0
                };
            widgetValueList.push(currentDelta);
            lastValue = currentDelta;
          });
          widgetValueList.sort(this.sortByHour);
          this.deviceService
            .buildChartMemoryWidget(widgetValueList, type)
            .subscribe(result => {
              this.deviceHistoric = result;
              this.labels.length = 0;
              for (let i = 0; i < this.deviceHistoric.labels.length; i++) {
                this.labels.push(this.deviceHistoric.labels[i]);
              }
            });
        });
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
    const roundedEndTime =
      endTime +
      (deltaTime -
        Number(this.datePipe.transform(new Date(endTime), 'mm')) % deltaTime) *
        60000;
    const initTime = roundedEndTime - intervalValue * 7;
    let lastValue: any;
    const originWidgetInfo = this.deviceService.getCpuAvgInRangeOfTime(
      initTime,
      roundedEndTime,
      deltaTime,
      device.id
    );
    this.sortCpuAvgResult(originWidgetInfo).subscribe(rawData => {
      this.buildAvgDeltas(roundedEndTime, intervalValue).subscribe(deltas => {
        let widgetValueList = [];
        let lastValue;
        deltas.forEach(hour => {
          const temporalDelta = rawData.filter(
            widgetValue => widgetValue.timeInterval === hour
          )[0];
          const currentDelta = temporalDelta
            ? temporalDelta
            : {
                timeInterval: hour,
                freeValue: lastValue ? lastValue.freeValue : 100,
                usedValue: lastValue ? lastValue.usedValue : 0
              };
          widgetValueList.push(currentDelta);
          lastValue = currentDelta;
        });
        widgetValueList.sort(this.sortByHour);
        this.deviceService
          .buildChartMemoryWidget(widgetValueList, 'CPU')
          .subscribe(result => {
            this.deviceHistoric = result;
            this.labels.length = 0;
            for (let i = 0; i < this.deviceHistoric.labels.length; i++) {
              this.labels.push(this.deviceHistoric.labels[i]);
            }
          });
      });
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

  sortDeviceMemoryAvgResult(obsResult, deviceDataMemory) {
    return (obsResult as Observable<any>).pipe(
      first(),
      mergeMap(result => {
        return Observable.from(result as any[]).pipe(
          map(rawData => {
            return {
              freeValue: Math.floor(
                (deviceDataMemory.totalValue - rawData.grouped_data) /
                  deviceDataMemory.totalValue *
                  100
              ),
              usedValue: Math.floor(
                rawData.grouped_data / deviceDataMemory.totalValue * 100
              ),
              timeInterval: this.datePipe.transform(
                new Date(rawData.interval),
                'HH:mm'
              )
            };
          }),
          toArray(),
          map(unsortedArray => unsortedArray.sort(this.sortByHour))
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
              freeValue: Math.floor(100 - rawData.grouped_data),
              usedValue: Math.floor(rawData.grouped_data),
              timeInterval: this.datePipe.transform(
                new Date(rawData.interval),
                'HH:mm'
              )
            };
          }),
          toArray(),
          map(unsortedArray => unsortedArray.sort(this.sortByHour))
        );
      })
    );
  }

  buildAvgDeltas(endTime, intervalValue) {
    //TODO: organizar range dinamico
    endTime = endTime + intervalValue;
    return Observable.range(1, 12).pipe(
      map(value => {
        const intervalTime = endTime - intervalValue * value;
        return this.datePipe.transform(new Date(intervalTime), 'HH:mm');
      }),
      toArray()
    );
  }
}
