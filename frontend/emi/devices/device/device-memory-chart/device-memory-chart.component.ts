import { Component, OnInit, Input } from '@angular/core';
import { DeviceService } from '../device.service';
import * as shape from 'd3-shape';
import { range } from 'rxjs/observable/range';
import { scan } from 'rxjs/operators';
@Component({
  selector: 'app-device-memory-chart',
  templateUrl: './device-memory-chart.component.html',
  styleUrls: ['./device-memory-chart.component.scss']
})
export class DeviceMemoryChartComponent implements OnInit {
  historyChart: any;
  currentRange = 0;
  historyRanges;
  @Input('widget') widget;

  constructor(private deviceServie: DeviceService) {}

  ngOnInit() {
    this.historyRanges = { ONE_HOUR: 0, TWO_HOURS: 1, THREE_HOURS: 2 };
    this.historyChart = this.deviceServie.buildChartMemoryWidget(null, null);
  }

  doSomething($event) {
    const currentTime = Date.now();
    let hourList: number[];
    hourList.push(currentTime);
    let multiplierValue: number;
    switch ($event.value) {
      case 0:
        multiplierValue = 600000;
        break;
      case 1:
        multiplierValue = 1200000;
        break;
      case 2:
        multiplierValue = 1800000;
        break;
    }
    //range(1, 5).pipe(scan(acc, curr) => acc - multiplierValue));

  }
}
