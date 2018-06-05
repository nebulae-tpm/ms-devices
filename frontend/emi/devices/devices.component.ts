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
import { MatPaginator, MatSort, MatTableDataSource, Sort } from '@angular/material';
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
  displayedColumns = ['name', 'serial', 'groupName', 'temperature', 'cpu', 'ram', 'sd', 'online'];
  tableSize: number;
  keyUpSubscriber: Subscription;
  paginatorSubscriber: Subscription;
  tableSizeSubscription: Subscription;
  deviceDataListSubscription: Subscription;
  page = 0;
  count = 10;
  filterText = '';
  sortColumn = null;
  sortOrder = null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private devicesService: DevicesService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.refreshDataTable(this.page, this.count, this.filterText, this.sortColumn, this.sortOrder);
    this.keyUpSubscriber = Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (this.filter.nativeElement) {
          let filterValue = this.filter.nativeElement.value;
          filterValue = filterValue.trim();
          this.filterText = filterValue;
          this.refreshDataTable(this.page, this.count, filterValue, this.sortColumn, this.sortOrder);
        }
      });
      console.log('paginador de disp: ', this.paginator);
    this.paginatorSubscriber = this.paginator.page.subscribe(pageChanged => {
      this.page = pageChanged.pageIndex;
      this.count = pageChanged.pageSize;
      this.refreshDataTable(pageChanged.pageIndex, pageChanged.pageSize, this.filterText, this.sortColumn, this.sortOrder);
    });
    this.tableSizeSubscription = this.devicesService.getDeviceTableSize().subscribe(result => {
      this.tableSize = result;
    });
  }
  sortData(sort: Sort) {
    if (sort.direction !== '') {
      this.sortOrder = sort.direction;
      this.sortColumn = sort.active;
    }
    else {
      this.sortOrder = null;
      this.sortColumn = null;
    }
    console.log(`column: ${this.sortColumn} order: ${this.sortOrder}`)
    this.refreshDataTable(this.page, this.count, this.filterText, this.sortColumn, this.sortOrder);
  }

  refreshDataTable(page, count, filter, sortColumn, sortOrder) {
    this.devicesService.getDevices$(page, count, filter, sortColumn, sortOrder).pipe(first()).subscribe(model => {
      console.log('LLegan disp: ', model);
      this.dataSource.data = model;
    });
  }

  getPercentage(device, type) {
    if (type == 'MEM') {
      return device.deviceStatus.ram ? Math.floor(device.deviceStatus.ram.currentValue / device.deviceStatus.ram.totalValue * 100) : 0;
    }
    else if (type == 'SD') {
      return device.deviceStatus.sdStatus ? Math.floor(device.deviceStatus.sdStatus.currentValue / device.deviceStatus.sdStatus.totalValue * 100) : 0;
    }
    else {
      return 0;
    }
  }

  ngDestroy() {
    this.keyUpSubscriber.unsubscribe();
    this.paginatorSubscriber.unsubscribe();
    this.tableSizeSubscription.unsubscribe();
    this.deviceDataListSubscription.unsubscribe();
  }
}
