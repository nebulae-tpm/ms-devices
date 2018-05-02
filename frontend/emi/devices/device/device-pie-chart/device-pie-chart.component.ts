import { Component, OnInit, Input } from '@angular/core';


@Component({
  selector: 'app-device-pie-chart',
  templateUrl: './device-pie-chart.component.html',
  styleUrls: ['./device-pie-chart.component.scss']
})
export class DevicePieChartComponent implements OnInit {

  @Input('title') title;
  constructor() { }

  private _widget: any
  ngOnInit() {

  }

  get widget(): any {
      return this._widget;
  }

  @Input()
  set widget(widgetValue: any) {
    this._widget = JSON.parse(widgetValue);
  }

}
