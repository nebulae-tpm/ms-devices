import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '../../../../core/animations';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FuseUtils } from '../../../../core/fuseUtils';
import { MatSnackBar } from '@angular/material';
import { Location } from '@angular/common';
import { DeviceService } from './device.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { locale as english } from '../i18n/en';
import { locale as spanish } from '../i18n/es';
import { FuseTranslationLoaderService } from '../../../../core/services/translation-loader.service';
import { mergeMap, first } from 'rxjs/operators';

@Component({
  selector: 'app-device',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class DeviceComponent implements OnInit {
  device: any;
  deviceVal: any;
  pageType: string;
  deviceForm: FormGroup;
  ramWidget = '';
  sdWidget = '';
  flashWidget = '';
  cpuWidget: any;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private location: Location,
    private deviceService: DeviceService,
    private router: ActivatedRoute
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.router.params
      .pipe(
        mergeMap(params => {
          return this.deviceService.getDeviceState(params['id']).pipe(first());
        })
      )
      .subscribe(result => {
        this.device = result;
        this.deviceVal = JSON.stringify(this.device);
      });
  }
}
