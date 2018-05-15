import { Component, OnInit, Input, Inject } from '@angular/core';
import { DeviceService } from '../device.service';
import * as shape from 'd3-shape';
import { range } from 'rxjs/observable/range';
import { scan, first, mergeMap, map, toArray } from 'rxjs/operators';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-device-voltage-chart',
  templateUrl: './device-voltage-chart.component.html',
  styleUrls: ['./device-voltage-chart.component.scss']
})
export class DeviceVoltageChartComponent implements OnInit {
  historyRanges = { ONE_HOUR: 0, TWO_HOURS: 1, THREE_HOURS: 2 };
  deviceVoltage = {};
  selectedDelta = 5;
  currentRange = 0;
  sortByHour = (a, b) => {
    if (a.timeInterval < b.timeInterval) return -1;
    if (a.timeInterval > b.timeInterval) return 1;
    return 0;
  };

  constructor(
    private deviceServie: DeviceService,
    private deviceService: DeviceService,
    public dialogRef: MatDialogRef<DeviceVoltageChartComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe
  ) {
    this.buildDeviceVoltageHistory(this.data.device, this.selectedDelta);
  }

  ngOnInit(): void {
    this.deviceService.events$.forEach(event => {
      if (event.type == 'VOLT') {
        this.buildDeviceVoltageHistory(event.value, this.selectedDelta);
      }
    });
  }

  /**
   * Event that fired when comboBox of hour in voltage histogram as changed
   * @param
   */
  onHourSelected($event) {
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
    this.buildDeviceVoltageHistory(this.data.device, this.selectedDelta);
  }

  /**
   * build histogram widget of device cpu
   * @param device Device that will show in histogram
   * @param deltaTime Delta time (Interval)
   */
  buildDeviceVoltageHistory(device, deltaTime) {
    const intervalValue = deltaTime * 60000;
    let endTime = new Date().getTime();
    const roundedEndTime =
      endTime +
      (deltaTime -
        Number(this.datePipe.transform(new Date(endTime), 'mm')) % deltaTime) *
        60000;
    const initTime = roundedEndTime - intervalValue * 7;
    let lastValue: any;
    const originWidgetInfo = this.deviceService.getVoltageInRangeOfTime(
      initTime,
      roundedEndTime,
      deltaTime,
      device.id
    );

    this.sortVoltageAvgResult(originWidgetInfo).subscribe(rawData => {
      const currentHour = this.datePipe.transform(
        new Date(roundedEndTime),
        'HH:mm'
      );
      rawData[0] = {
        currentValue: this.data.device.deviceStatus.voltage.currentValue,
        highestValue: this.data.device.deviceStatus.voltage.highestValue,
        lowestValue: this.data.device.deviceStatus.voltage.lowestValue,
        timeInterval: currentHour
      };
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
                currentValue: lastValue
                  ? Math.floor(lastValue.currentValue)
                  : 0,
                highestValue: lastValue
                  ? Math.floor(lastValue.highestValue)
                  : 0,
                lowestValue: lastValue ? Math.floor(lastValue.lowestValue) : 0
              };
          widgetValueList.push(currentDelta);
          lastValue = currentDelta;
        });
        widgetValueList.sort(this.sortByHour);
        this.deviceService
          .buildVoltageWidget(widgetValueList)
          .subscribe(result => {
            this.deviceVoltage = result;
          });
      });
    });
  }

  sortVoltageAvgResult(obsResult) {
    return (obsResult as Observable<any>).pipe(
      first(),
      mergeMap(result => {
        return Observable.from(result as any[]).pipe(
          map(rawData => {
            return {
              currentValue: rawData.currentValue,
              highestValue: rawData.highestValue,
              lowestValue: rawData.lowestValue,
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
