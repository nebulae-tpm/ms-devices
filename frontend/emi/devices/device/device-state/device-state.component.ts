import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { DeviceService } from '../device.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { first, map, toArray, mergeMap } from 'rxjs/operators';
import 'rxjs/add/observable/from';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-device-state',
  templateUrl: './device-state.component.html',
  styleUrls: ['./device-state.component.scss']
})
export class DeviceStateComponent implements OnInit, OnDestroy {
  constructor(
    private deviceService: DeviceService,
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  device$: Observable<any>;
  device: any;
  cpuWidget: any;
  HistoryRamChart: any;
  historyRanges: any;
  subscribers: Subscription[] = [];


  widget5: any;
  ngOnInit() {
    this.subscribers.push(this.route.params
      .pipe(
        mergeMap(params => {
          return this.deviceService.getDeviceState(params['id']).pipe(first());
        })
      )
      .subscribe(result => {
        this.device = JSON.parse(JSON.stringify(result));
        this.cpuWidget = this.deviceService.buildBarWidget(
          result.deviceStatus.cpuStatus
        );
        this.subscribers.push(this.deviceService
          .subscribeToDeviceDeviceStateReportedEvent$(this.device.id)
          .subscribe(result => {
            if (result.data) {
              const rawData = JSON.parse(
                JSON.stringify(result.data.DeviceDeviceStateReportedEvent)
              );
              if (rawData.deviceStatus) {
                Object.keys(rawData.deviceStatus).forEach(
                  k =>
                    !rawData.deviceStatus[k] &&
                    rawData.deviceStatus[k] !== undefined &&
                    delete rawData.deviceStatus[k]
                );
                const deviceStatus = {
                  ...this.device.deviceStatus,
                  ...JSON.parse(JSON.stringify(rawData.deviceStatus))
                };
                this.device.deviceStatus = deviceStatus;
              }
            }
          }));

        this.subscribers.push(
          this.deviceService
            .subscribeToDeviceVolumesStateReportedEvent$(this.device.id)
            .subscribe(result => {
              if (result.data) {
                const rawData = JSON.parse(
                  JSON.stringify(result.data.DeviceVolumesStateReportedEvent)
                );
                if (rawData.deviceStatus) {
                  Object.keys(rawData.deviceStatus).forEach(
                    k =>
                      !rawData.deviceStatus[k] &&
                      rawData.deviceStatus[k] !== undefined &&
                      delete rawData.deviceStatus[k]
                  );
                  const deviceStatus = {
                    ...this.device.deviceStatus,
                    ...JSON.parse(JSON.stringify(rawData.deviceStatus))
                  };
                  this.device.deviceStatus = deviceStatus;
                }
              }
            }));

        this.subscribers.push(this.deviceService
          .subscribeToDeviceMainAppStateReportedEvent$(this.device.id)
          .subscribe(result => {
            if (result.data) {
              const rawData = JSON.parse(
                JSON.stringify(result.data.DeviceMainAppStateReportedEvent)
              );
              if (rawData.appStatus) {
                Object.keys(rawData.appStatus).forEach(
                  k =>
                    !rawData.appStatus[k] &&
                    rawData.appStatus[k] !== undefined &&
                    delete rawData.appStatus[k]
                );
                const appStatus = {
                  ...this.device.appStatus,
                  ...JSON.parse(JSON.stringify(rawData.appStatus))
                };
                this.device.appStatus = appStatus;
              }
            }
          }));

        this.subscribers.push(this.deviceService
          .subscribeToDeviceSystemStateReportedEvent$(this.device.id)
          .subscribe(result => {
            if (result.data) {
              const rawData = JSON.parse(
                JSON.stringify(result.data.DeviceSystemStateReportedEvent)
              );
              if (rawData.deviceStatus) {
                Object.keys(rawData.deviceStatus).forEach(
                  k =>
                    !rawData.deviceStatus[k] &&
                    rawData.deviceStatus[k] !== undefined &&
                    delete rawData.deviceStatus[k]
                );
                const deviceStatus = {
                  ...this.device.deviceStatus,
                  ...JSON.parse(JSON.stringify(rawData.deviceStatus))
                };
                this.device.deviceStatus = deviceStatus;
              }
            }
          }));
      }));
  }

  openVersionDialog(): void {
    let dialogRef = this.dialog.open(AppVersionDialog, {
      width: '400px',
      data: { versions: this.device.appStatus.appVersions }
    });
  }

  buildDevicePieWidget(device, type) {
    const deviceDataMemory = this.getDeviceMemory(device, type);
    const memmoryPercentage = this.getPercentage(device, type);
    const pieColor =
      memmoryPercentage >= 80
        ? '#f44336'
        : memmoryPercentage <= 79 && memmoryPercentage >= 51
          ? '#ffc107'
          : '#43a047';
    const widget = JSON.stringify(
      this.deviceService.buildPieWidget(
        pieColor,
        memmoryPercentage,
        deviceDataMemory.currentValue,
        deviceDataMemory.totalValue,
        deviceDataMemory.memoryUnitInformation
      )
    );
    if (type == 'SD') {
      //console.log(`Se actualiza: ${widget}`);
    }
    return widget;
  }

  buildDeviceMemoryHistory(type) {
    //TODO: se debe cambiar por valores reales
    return Observable.from([100, 100, 100, 7, 89, 50]).pipe(
      map(val => {
        return { name: `${Math.floor(Math.random() * 1000)}`, value: val };
      }),
      toArray(),
      map(result =>
        JSON.stringify(this.deviceService.buildChartMemoryWidget('RAM', result))
      ),
      first()
    );
  }

  ngOnDestroy() {
    if (this.subscribers) {
      this.subscribers.forEach(sub => {
        console.log(`Se finaliza sub: ${sub}`);
        sub.unsubscribe();
      });
    }
  }

  getPercentage(device, type) {
    if (type == 'MEM') {
      return device.deviceStatus.ram
        ? Math.floor(
            device.deviceStatus.ram.currentValue /
              device.deviceStatus.ram.totalValue *
              100
          )
        : 0;
    } else {
      const deviceDataMemory = this.getDeviceMemory(device, type);
      return deviceDataMemory
        ? Math.floor(
            deviceDataMemory.currentValue / deviceDataMemory.totalValue * 100
          )
        : 0;
    }
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
}

@Component({
  selector: 'app-version-dialog',
  templateUrl: 'app-version-dialog.html'
})
export class AppVersionDialog {
  constructor(
    public dialogRef: MatDialogRef<AppVersionDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
