import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot
} from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { range } from 'rxjs/observable/range';
import { map, toArray } from 'rxjs/operators';
import { DummyDataService } from './dummy-data.service';
import { GatewayService } from '../../../api/gateway.service';
import { getDevices, getDeviceTableSize, getDeviceDetail } from './gql/Devices';
import { Subscription } from 'rxjs';

@Injectable()
export class DevicesService {
  devices: any[] = [];
  onDevicesChanged: BehaviorSubject<any> = new BehaviorSubject({});

  constructor(
    private http: HttpClient,
    private dummyDataService: DummyDataService,
    private gateway: GatewayService
  ) { }

  getDevices$(pageValue,countValue): Observable<any[]> {
    return this.gateway.apollo
      .query<any>({
        query: getDevices,
        variables: {
          page: pageValue,
          count: countValue
        },
      })
      .pipe(map(rawData => rawData.data.getDevices));
  }
  getDeviceTableSize(): Observable<number> {
    return this.gateway.apollo
    .query<any>({
      query: getDeviceTableSize
    })
    .pipe(map(rawData => rawData.data.getDeviceTableSize));
  }

  getDeviceDetail(id): Observable<any> {
    return this.gateway.apollo
      .query<any>({
        query: getDeviceDetail,
        variables: {
          id: id
        },
      })
      .pipe(map(rawData => rawData.data.getDeviceDetail));
  }
}
