import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  Input,
} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { DeviceService } from '../device.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DeviceMemoryChartComponent } from '../device-memory-chart/device-memory-chart.component';
import { DeviceVoltageChartComponent } from '../device-voltage-chart/device-voltage-chart.component';
import { Overlay } from '@angular/cdk/overlay';
import { DeviceAlarmTempDialog } from '../device-alarm-temp-dialog/device-alarm-temp-dialog.component';
import { Subject } from 'rxjs';

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
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private overlay: Overlay
  ) {}

  device$: Observable<any>;
  device: any;
  cpuWidget: any;
  HistoryRamChart: any;
  subscribers: Subscription[] = [];
  deviceRamHistoric: any;
  deviceSdHistoric: any;
  deviceCpuHistoric: any;
  deviceFlashHistoric: any;
  deviceVoltage: any;
  currentRange = 0;
  deviceAlarmThresholds: any;
  filterTemplate: any;
  deviceChanged = new Subject<any>();

  @Input()
  set deviceValue(deviceVal: any) {
    if (this.subscribers) {
      this.subscribers.forEach(sub => {
        sub.unsubscribe();
      });
    }
    if (deviceVal) {
      this.device = JSON.parse(deviceVal);
      this.cpuWidget = this.deviceService.buildBarWidget(
        this.device.deviceStatus.cpuStatus
      );
      this.startSubscribers();
      this.deviceChanged.next();
    }
  }
  get deviceValue(): any {
    return this.device;
  }

  ngOnInit() {
    this.deviceService.getDeviceAlarmThresholds().subscribe(result => {
      this.deviceAlarmThresholds = JSON.parse(JSON.stringify(result));
    });
    this.subscribers.push(
      this.route.queryParams.subscribe(params => {
        try {
          this.filterTemplate = JSON.parse(params['filterTemplate']);
        } catch (error) {
          console.log('Invalid JSON FILTER: ', error);
        }
        this.deviceChanged.asObservable().subscribe(() => {
          setTimeout(() => {
            if (this.filterTemplate) {
              if (this.filterTemplate.type == 'TEMP') {
                this.openTempAlarmsDialog();
              } else if (this.filterTemplate.type == 'VOLT') {
                this.openDeviceVoltageDialog();
              } else {
                let type =
                  this.filterTemplate.type == 'RAM'
                    ? 'MEM'
                    : this.filterTemplate.type;
                this.openDeviceMemoryDialog(type);
              }
            }
          }, 500);
        });
      })
    );
  }

  /**
   * Start all graphql subscriptions
   */
  startSubscribers() {
    this.subscribers.push(
      this.deviceService
        .subscribeToDeviceDeviceStateReportedEvent$([this.device.id])
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
              this.device.timestamp = rawData.timestamp;
              this.device.deviceStatus = deviceStatus;
            }
          }
        })
    );

    this.subscribers.push(
      this.deviceService
        .subscribeToDeviceTemperatureAlarmActivatedEvent$([this.device.id])
        .subscribe(result => {
          if (result.data) {
            const rawData = JSON.parse(
              JSON.stringify(result.data.DeviceTemperatureAlarmActivatedEvent)
            );
            if (rawData.deviceStatus) {
              Object.keys(rawData.deviceStatus).forEach(
                k =>
                  rawData.deviceStatus[k] === undefined &&
                  delete rawData.deviceStatus[k]
              );
              const deviceStatus = {
                ...this.device.deviceStatus,
                ...JSON.parse(JSON.stringify(rawData.deviceStatus))
              };
              this.device.timestamp = rawData.timestamp;
              this.device.deviceStatus = deviceStatus;
            }
          }
        })
    );

    this.subscribers.push(
      this.deviceService
        .subscribeToDeviceTemperatureAlarmActivatedEvent$([this.device.id])
        .subscribe(result => {
          if (result.data) {
            const rawData = JSON.parse(
              JSON.stringify(result.data.DeviceTemperatureAlarmActivatedEvent)
            );
            if (rawData.deviceStatus) {
              Object.keys(rawData.deviceStatus).forEach(
                k =>
                  rawData.deviceStatus[k] === undefined &&
                  delete rawData.deviceStatus[k]
              );
              const deviceStatus = {
                ...this.device.deviceStatus,
                ...JSON.parse(JSON.stringify(rawData.deviceStatus))
              };
              this.device.timestamp = rawData.timestamp;
              this.device.deviceStatus = deviceStatus;
            }
          }
        })
    );

    this.subscribers.push(
      this.deviceService
        .subscribeToDeviceTemperatureAlarmDeactivatedEvent$([this.device.id])
        .subscribe(result => {
          if (result.data) {
            const rawData = JSON.parse(
              JSON.stringify(result.data.DeviceTemperatureAlarmDeactivatedEvent)
            );
            if (rawData.deviceStatus) {
              Object.keys(rawData.deviceStatus).forEach(
                k =>
                  rawData.deviceStatus[k] === undefined &&
                  delete rawData.deviceStatus[k]
              );
              const deviceStatus = {
                ...this.device.deviceStatus,
                ...JSON.parse(JSON.stringify(rawData.deviceStatus))
              };
              this.device.timestamp = rawData.timestamp;
              this.device.deviceStatus = deviceStatus;
            }
          }
        })
    );

    this.subscribers.push(
      this.deviceService
        .subscribeToDeviceConnectedEvent$([this.device.id])
        .subscribe(result => {
          if (result.data) {
            const rawData = JSON.parse(
              JSON.stringify(result.data.DeviceConnectedEvent)
            );
            if (rawData.deviceStatus) {
              Object.keys(rawData.deviceStatus).forEach(
                k =>
                  rawData.deviceStatus[k] === undefined &&
                  delete rawData.deviceStatus[k]
              );
              const deviceStatus = {
                ...this.device.deviceStatus,
                ...JSON.parse(JSON.stringify(rawData.deviceStatus))
              };
              this.device.timestamp = rawData.timestamp;
              this.device.deviceStatus = deviceStatus;
            }
          }
        })
    );

    this.subscribers.push(
      this.deviceService
        .subscribeToDeviceDisconnectedEvent$([this.device.id])
        .subscribe(result => {
          if (result.data) {
            const rawData = JSON.parse(
              JSON.stringify(result.data.DeviceDisconnectedEvent)
            );
            if (rawData.deviceStatus) {
              Object.keys(rawData.deviceStatus).forEach(
                k =>
                  rawData.deviceStatus[k] === undefined &&
                  delete rawData.deviceStatus[k]
              );
              const deviceStatus = {
                ...this.device.deviceStatus,
                ...JSON.parse(JSON.stringify(rawData.deviceStatus))
              };
              this.device.timestamp = rawData.timestamp;
              this.device.deviceStatus = deviceStatus;
            }
          }
        })
    );

    this.subscribers.push(
      this.deviceService
        .subscribeToDeviceVolumesStateReportedEvent$([this.device.id])
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
              this.device.timestamp = rawData.timestamp;
              this.device.deviceStatus = deviceStatus;
              this.deviceService.newEvent({
                type: 'SD',
                value: this.device
              });
            }
          }
        })
    );

    this.subscribers.push(
      this.deviceService
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
              this.device.timestamp = rawData.timestamp;
              this.device.appStatus = appStatus;
            }
          }
        })
    );

    this.subscribers.push(
      this.deviceService
        .subscribeToDeviceSystemStateReportedEvent$([this.device.id])
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
              this.device.timestamp = rawData.timestamp;
              this.device.deviceStatus = deviceStatus;

              this.deviceService.newEvent({
                type: 'MEM',
                value: this.device
              });

              this.deviceService.newEvent({
                type: 'CPU',
                value: this.device
              });
              this.deviceService.newEvent({
                type: 'VOLT',
                value: this.device
              });

              //TODO: aqui se debe refrescar histograma de RAM, CPU y VOLT
              /*
              const currentRAMHistogramHour = this.histogramHour['RAM'];
              this.buildDeviceMemoryHistory('MEM', this.device, currentRAMHistogramHour ? currentRAMHistogramHour : 0);
              const currentCPUHistogramHour = this.histogramHour['CPU'];
              this.buildDeviceCpuHistory(this.device, currentCPUHistogramHour ? currentCPUHistogramHour : 0);
              const currentVOLTHistogramHour = this.histogramHour['VOLT'];
              this.buildDeviceVoltageHistory(this.device, currentVOLTHistogramHour? currentVOLTHistogramHour: 0);
              */
              this.cpuWidget = this.deviceService.buildBarWidget(
                this.device.deviceStatus.cpuStatus
              );
            }
          }
        })
    );
  }
  /**
   * Open detail dialog of app versions
   */
  openVersionDialog(): void {
    let dialogRef = this.dialog.open(AppVersionDialog, {
      width: '400px',
      data: { versions: this.device.appStatus.appVersions }
    });
  }

  openTempAlarmsDialog(): void {
    let data = {
      device: this.device,
      alarmThreshold: this.deviceAlarmThresholds,
      range: undefined
    };
    if (this.filterTemplate) {
      data.range = this.filterTemplate.range;
    }
    let dialogRef = this.dialog.open(DeviceAlarmTempDialog, {
      width: '500px',
      data
    });
  }

  openDeviceMemoryDialog(type): void {
    console.log('openFilter: ', this.filterTemplate);
    console.log('type: ', type);
    let data = {
      type: type,
      device: this.device,
      alarmThreshold: this.deviceAlarmThresholds,
      range: undefined
    };
    if (this.filterTemplate) {
      data.range = this.filterTemplate.range;
    }
    console.log('data: ', data);
    let dialogRef = this.dialog.open(DeviceMemoryChartComponent, {
      width: '80%',
      data
    });
  }

  openDeviceVoltageDialog(): void {
    let data = { device: this.device, range: undefined };
    if (this.filterTemplate) {
      data.range = this.filterTemplate.range;
    }
    let dialogRef = this.dialog.open(DeviceVoltageChartComponent, {
      width: '80%',
      data
    });
  }
  /**
   * build pie widget of device volume or device ram
   * @param device Device that will show in pie
   * @param type Type of origin data in device (MEM,SD,FLASH)
   */
  buildDevicePieWidget(device, type) {
    let deviceDataMemory = this.getDeviceMemory(device, type);
    if (!deviceDataMemory) {
      deviceDataMemory = {
        totalValue: 1,
        currentValue: 0,
        memoryUnitInformation: 'NA'
      };
    }
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
    return widget;
  }

  getPercentage(device, type) {
    if (type == 'MEM') {
      return device.deviceStatus.ram
        ? Math.floor(
            (device.deviceStatus.ram.currentValue /
              device.deviceStatus.ram.totalValue) *
              100
          )
        : 0;
    } else if (type == 'SD') {
      return device.deviceStatus.sdStatus
        ? Math.floor(
            (device.deviceStatus.sdStatus.currentValue /
              device.deviceStatus.sdStatus.totalValue) *
              100
          )
        : 0;
    }
  }

  getDeviceMemory(device, type) {
    if (type == 'MEM') {
      return device.deviceStatus.ram;
    } else if (type == 'SD') {
      return device.deviceStatus.sdStatus;
    } else {
      return { totalValue: 1, currentValue: 0, memoryUnitInformation: 'NA' };
    }
  }


  ngOnDestroy() {
    if (this.subscribers) {
      this.subscribers.forEach(sub => {
        sub.unsubscribe();
      });
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

