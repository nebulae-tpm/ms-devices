import { Component, OnInit, Inject } from '@angular/core';
import { DeviceService } from '../device.service';
import { first, mergeMap, map, toArray, groupBy } from 'rxjs/operators';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatSnackBar,
  MatTableDataSource
} from '@angular/material';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-device-voltage-chart',
  templateUrl: './device-voltage-chart.component.html',
  styleUrls: ['./device-voltage-chart.component.scss']
})
export class DeviceVoltageChartComponent implements OnInit {
  historyRanges = { ONE_HOUR: 0, TWO_HOURS: 1, THREE_HOURS: 2 };
  deviceVoltage: any;
  selectedDelta = 5;
  currentRange = 0;
  page = 0;
  count = 3;
  alarmDataSource = new MatTableDataSource();
  displayedColumns = ['alarmState', 'alarmHour'];
  subscribers: Subscription[] = [];
  sortByHour = (a, b) => {
    if (a.timestamp < b.timestamp) return -1;
    if (a.timestamp > b.timestamp) return 1;
    return 0;
  };

  constructor(
    private deviceServie: DeviceService,
    private deviceService: DeviceService,
    public snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<DeviceVoltageChartComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe
  ) {
    if (this.data.range) {
      this.changeSelectedDelta(this.data.range);
      this.currentRange = (this.data.range);
    }
    this.buildDeviceVoltageHistory(this.data.device, this.selectedDelta);
  }

  ngOnInit(): void {
    this.deviceService.events$.forEach(event => {
      if (event.type == 'VOLT') {
        this.buildDeviceVoltageHistory(event.value, this.selectedDelta);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscribers) {
      this.subscribers.forEach(sub => {
        sub.unsubscribe();
      });
    }
  }

  /**
   * Event that fired when comboBox of hour in voltage histogram as changed
   * @param
   */
  onHourSelected($event) {
    this.changeSelectedDelta($event.value);
    this.buildDeviceVoltageHistory(this.data.device, this.selectedDelta);
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

  refreshAlarmDataTable(page, count) {
    const intervalValue = this.selectedDelta * 60000;
    const endTime = new Date().getTime();
    const initTime = endTime - intervalValue * 12;
    this.deviceService
      .getDeviceAlarms$(
        this.data.device.id,
        'VOLT',
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

  onChange($event) {
    this.page = $event.pageIndex;
    this.count = $event.pageSize;
    this.refreshAlarmDataTable($event.pageIndex, $event.pageSize);
  }

  /**
   * build histogram widget of device cpu
   * @param device Device that will show in histogram
   * @param deltaTime Delta time (Interval)
   */
  buildDeviceVoltageHistory(device, deltaTime) {
    const intervalValue = deltaTime * 60000;
    let endTime = new Date().getTime();
    const initTime = endTime - intervalValue * 12;
    let lastValue: any;
    const originWidgetInfo = this.deviceService.getVoltageInRangeOfTime(
      initTime,
      endTime,
      deltaTime,
      device.id
    );
    this.subscribers.push(
      this.sortVoltageAvgResult(originWidgetInfo)
        .pipe(
          mergeMap(rawData => {
            return rawData.length > 0
              ? this.deviceService.buildVoltageWidget(rawData)
              : Observable.of(undefined);
          })
        )
        .subscribe(rawData => {
          if (rawData && rawData.data && rawData.data.length > 0) {
            this.deviceVoltage = rawData;
            this.refreshAlarmDataTable(this.page, this.count)
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

  sortVoltageAvgResult(obsResult) {
    return (obsResult as Observable<any>).pipe(
      first(),
      mergeMap(result => {
        return Observable.from(result as any[]).pipe(
          map(rawData => {
            return {
              currentValue: rawData.deviceStatus.voltage.currentValue,
              highestValue: rawData.deviceStatus.voltage.highestValue,
              lowestValue: rawData.deviceStatus.voltage.lowestValue,
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
