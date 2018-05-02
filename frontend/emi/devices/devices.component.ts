import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef
} from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { fuseAnimations } from '../../../core/animations';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { DevicesService } from './devices.service';
import { FuseUtils } from '../../../core/fuseUtils';
import { locale as english } from './i18n/en';
import { locale as spanish } from './i18n/es';
import { FuseTranslationLoaderService } from '../../../core/services/translation-loader.service';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import { map, first } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'device',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  animations: fuseAnimations
})
export class DevicesComponent implements OnInit {
  dataSource = new MatTableDataSource();
  displayedColumns = ['name', 'serial', 'ram', 'sd', 'flash', 'online'];
  tableSize: number;
  keyUpSubscriber: Subscription;
  paginatorSubscriber: Subscription;
  tableSizeSubscription: Subscription;
  deviceDataListSubscription: Subscription;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;
  devicesList$: Observable<any[]>;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private devicesService: DevicesService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.refreshDataTable(0, 10, '');
    this.keyUpSubscriber = Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        let filterValue = this.filter.nativeElement.value;
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.dataSource.filter = this.filter.nativeElement.value;
      });
    this.paginatorSubscriber = this.paginator.page.subscribe(pageChanged => {
      this.refreshDataTable(pageChanged.pageIndex, pageChanged.pageSize, '');
    });
    this.tableSizeSubscription = this.devicesService.getDeviceTableSize().subscribe(result => {
      this.tableSize = result;
    });
  }

  refreshDataTable(page, count, filter) {
    this.devicesList$ = this.devicesService.getDevices$(page, count);
    this.deviceDataListSubscription = this.devicesList$.subscribe(model => {
      console.log(JSON.stringify(model));
      this.dataSource.data = model;
    });
  }

  getPercentage(device, type) {
    if (type == 'MEM') {
      return device.deviceStatus.ram?Math.floor(device.deviceStatus.ram.currentValue / device.deviceStatus.ram.totalValue * 100):0;
    }
    else {
      const deviceDataMemory = device.deviceStatus.deviceDataList.filter(
        data => data.memorytype == type
      )[0];
      return deviceDataMemory?Math.floor(deviceDataMemory.currentValue / deviceDataMemory.totalValue * 100):0;
    }
  }

  ngDestroy() {
    this.keyUpSubscriber.unsubscribe();
    this.paginatorSubscriber.unsubscribe();
    this.tableSizeSubscription.unsubscribe();
    this.deviceDataListSubscription.unsubscribe();
  }
}
