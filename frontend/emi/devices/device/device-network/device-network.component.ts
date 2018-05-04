import { Component, OnInit, OnDestroy } from '@angular/core';
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
  constructor(
    private deviceService: DeviceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.subscribers.push(this.route.params
      .pipe(
        mergeMap(params => {
          return this.deviceService
            .getDeviceNetwork(params['id'])
            .pipe(first());
        })
      )
      .subscribe(result => {
        this.device = JSON.parse(JSON.stringify(result));
        this.subscribers.push(this.deviceService
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
          }));

          this.subscribers.push(this.deviceService
          .subscribeToDeviceModemStateReportedEvent$(this.device.id)
            .subscribe(result => {
              console.log(`Llega evento: ${JSON.stringify(result.data)}`);
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
          }));
      }));
  }

  ngOnDestroy() {
    if (this.subscribers) {
      this.subscribers.forEach(sub => {
        console.log(`Se finaliza sub: ${sub}`);
        sub.unsubscribe();
      });
    }
  }
}
