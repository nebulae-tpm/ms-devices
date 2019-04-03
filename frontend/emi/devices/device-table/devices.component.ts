import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { fuseAnimations } from '../../../../core/animations';
import {
  MatPaginator,
  MatSort,
  MatTableDataSource,
  Sort
} from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { DevicesService } from './devices.service';
import { locale as english } from '../i18n/en';
import { locale as spanish } from '../i18n/es';
import { FuseTranslationLoaderService } from '../../../../core/services/translation-loader.service';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import { ActivatedRoute, Router } from '@angular/router';
import { PresentationType } from './presentation-type';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'device',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  animations: fuseAnimations
})
export class DevicesComponent implements OnInit {
  dataSource = new MatTableDataSource();
  displayedColumns = [
    'name',
    'serial',
    'groupName',
    'temperature',
    'cpu',
    'ram',
    'sd',
    'online'
  ];
  tableSize: number;
  subscribers: Subscription[] = [];
  page = 0;
  count = 10;
  filterText = '';
  filterLastConnection = null;
  sortColumn = null;
  sortOrder = null;
  alarms = ['ALARMAS', 'CPU', 'RAM', 'SD', 'TEMP'];
  currentAlarmFilter = 'ALARMAS';
  deviceTitle = '';

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private devicesService: DevicesService,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
    this.translate.onLangChange.subscribe((e: Event) => {
      this.getAndInitTranslations();
    });
  }

  ngOnInit() {
    this.subscribers.push(
      this.route.queryParams.subscribe(params => {
        this.devicesService.setFilterTemplate(params['filterTemplate']);
        this.refreshDataTable(
          this.page,
          this.count
        );
        this.getAndInitTranslations();
      })
    );
    this.getAndInitTranslations();
  //this.deviceTitle = this.devicesService.presentationType== PresentationType.GENERAL_VIEW?
    this.refreshDataTable(this.page, this.count);
    this.subscribers.push(
      Observable.fromEvent(this.filter.nativeElement, 'keyup')
        .debounceTime(150)
        .distinctUntilChanged()
        .subscribe(() => {
          if (this.filter.nativeElement) {
            let filterValue = this.filter.nativeElement.value;
            filterValue = filterValue.trim();
            this.filterText = filterValue;
            this.refreshDataTable(this.page, this.count);
          }
        })
    );
    this.subscribers.push(
      this.paginator.page.subscribe(pageChanged => {
        this.page = pageChanged.pageIndex;
        this.count = pageChanged.pageSize;
        this.refreshDataTable(
          pageChanged.pageIndex,
          pageChanged.pageSize
        );
      })
    );
    this.subscribers.push(
      this.devicesService.getDeviceTableSize().subscribe(result => {
        this.tableSize = result;
      })
    );
  }

  getAndInitTranslations() {
    this.translate.get(['DEVICE.DEVICES']).subscribe(translation => {
      this.deviceTitle = this.devicesService.presentationType== PresentationType.GENERAL_VIEW?translation['DEVICE.DEVICES']: this.devicesService.filterTemplate.label;
    });
  }

  changeAlarmFilter($event) {
    this.refreshDataTable(this.page, this.count);
  }

  changeLastConnectionFilter() {
    this.refreshDataTable(this.page, this.count);
  }

  showFilters() {
    return this.devicesService.presentationType == PresentationType.GENERAL_VIEW;
  }

  sortData(sort: Sort) {
    if (sort.direction !== '') {
      this.sortOrder = sort.direction;
      this.sortColumn = sort.active;
    } else {
      this.sortOrder = null;
      this.sortColumn = null;
    }

    this.refreshDataTable(this.page, this.count);
  }

  refreshDataTable(page, count) {
    let filterObject;
      if (
        this.devicesService.presentationType == PresentationType.GENERAL_VIEW
      ) {
        filterObject = {
          id: 0,
          searchLastConnection: this.filterLastConnection ? this.filterLastConnection.getTime(): null,
          searchValue: this.filterText,
          sortColumn: this.sortColumn,
          sortOrder: this.sortOrder,
          alarmFilter: undefined
        };
        if (this.currentAlarmFilter != 'ALARMAS') {
          filterObject.alarmFilter = this.currentAlarmFilter;
        }
      } else if (
        this.devicesService.presentationType ==
        PresentationType.DASHBOARD_ALARM_VIEW
      ) {
        filterObject = this.devicesService.filterTemplate;
        filterObject.page = page;
        filterObject.count = count;
      }

    this.devicesService
      .getDevices$(page, count, filterObject)
      .pipe(first())
      .subscribe(model => {
        this.dataSource.data = model;
      });
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
    } else {
      return 0;
    }
  }

  clearFilter() {
    this.currentAlarmFilter = 'ALARMAS';
    this.filterText = '';
    this.filterLastConnection = null;
    this.devicesService.presentationType = PresentationType.GENERAL_VIEW;
    this.refreshDataTable(this.page, this.count);
    this.getAndInitTranslations();
  }

  ngOnDestroy() {
    if (this.subscribers) {
      this.subscribers.forEach(sub => {
        sub.unsubscribe();
      });
    }
  }
}
