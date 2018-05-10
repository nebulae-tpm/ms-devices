import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { DeviceService } from '../device.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { mergeMap, first } from 'rxjs/operators';

@Component({
  selector: 'app-device-network',
  templateUrl: './device-network.component.html',
  styleUrls: ['./device-network.component.scss']
})
export class DeviceNetworkComponent implements OnInit, OnDestroy {
  device$: Observable<any>;
  device: any;
  subscribers: Subscription[] = [];
  constructor(private deviceService: DeviceService) {}

  @Input()
  set deviceValue(deviceVal: any) {
    if (this.subscribers) {
      this.subscribers.forEach(sub => {
        sub.unsubscribe();
      });
    }

    if (deviceVal) {
      this.device = JSON.parse(deviceVal);
      this.startSubscribers();
    }
  }
  get deviceValue(): any {
    return this.device;
  }

  ngOnInit() {}
  startSubscribers() {
    this.subscribers.push(
      this.deviceService
        .subscribeToDeviceNetworkStateReportedEvent$(this.device.id)
        .subscribe(result => {
          if (result.data) {
            const rawData = JSON.parse(
              JSON.stringify(result.data.DeviceNetworkStateReportedEvent)
            );
            if (rawData.deviceNetwork) {
              Object.keys(rawData.deviceNetwork).forEach(
                k =>
                  !rawData.deviceNetwork[k] &&
                  rawData.deviceNetwork[k] !== undefined &&
                  delete rawData.deviceNetwork[k]
              );
              const deviceNetwork = {
                ...this.device.deviceNetwork,
                ...JSON.parse(JSON.stringify(rawData.deviceNetwork))
              };
              this.device.deviceNetwork = deviceNetwork;
            }
          }
        })
    );

    this.subscribers.push(
      this.deviceService
        .subscribeToDeviceModemStateReportedEvent$(this.device.id)
        .subscribe(result => {
          if (result.data) {
            const rawData = JSON.parse(
              JSON.stringify(result.data.DeviceModemStateReportedEvent)
            );
            if (rawData.deviceNetwork) {
              Object.keys(rawData.deviceNetwork).forEach(
                k =>
                  rawData.deviceNetwork[k] === undefined &&
                  delete rawData.deviceNetwork[k]
              );
              const deviceNetwork = {
                ...this.device.deviceNetwork,
                ...rawData.deviceNetwork
              };
              this.device.deviceNetwork = deviceNetwork;
            }
          }
        })
    );
  }

  ngOnDestroy() {
    if (this.subscribers) {
      this.subscribers.forEach(sub => {
        sub.unsubscribe();
      });
    }
  }
}
