import { Component, OnInit, Inject} from '@angular/core';
import { DeviceService } from '../device.service';

import {
  first
} from 'rxjs/operators';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatSnackBar,
  MatTableDataSource,
  PageEvent
} from '@angular/material';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-device-alarm-temp-dialog',
  templateUrl: './device-alarm-temp-dialog.component.html',
  styleUrls: ['./device-alarm-temp-dialog.component.scss']
})
export class DeviceAlarmTempDialog implements OnInit {
  currentRange = 0;
  historyRanges;
  selectedDelta = 5;
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
    private deviceService: DeviceService,
    public dialogRef: MatDialogRef<DeviceAlarmTempDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {
    if (this.data.range) {
      this.changeSelectedDelta(this.data.range);
      this.currentRange = (this.data.range);
    }
    this.historyRanges = { ONE_HOUR: 0, TWO_HOURS: 1, THREE_HOURS: 2 };
  }

  ngOnInit(): void {
    this.refreshAlarmDataTable(this.page, this.count);
    this.subscribers.push(
      this.deviceService
        .getAlarmTableSize(this.data.device.id, 'TEMP', this.selectedDelta)
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
    this.subscribers.push(
      this.deviceService
        .getAlarmTableSize(this.data.device.id, 'TEMP', this.selectedDelta)
        .subscribe(result => {
          this.tableSize = result;
        })
    );
    this.refreshAlarmDataTable(this.page, this.count)
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
        'TEMP',
        initTime,
        endTime,
        this.page,
        this.count
      )
      .pipe(first())
      .subscribe(result => {
        if (result && result.length > 0) {
          this.alarmDataSource.data = result;
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

  alarmHour(timestamp) {
    return this.datePipe.transform(new Date(timestamp), 'HH:mm');
  }
}
