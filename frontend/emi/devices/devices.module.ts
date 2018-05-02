import { NgModule } from '@angular/core';
import { SharedModule } from '../../../core/modules/shared.module';
import { RouterModule } from '@angular/router';

import { DevicesComponent } from './devices.component';
import { DeviceStateComponent, AppVersionDialog } from './device/device-state/device-state.component'
import { DeviceComponent } from './device/device.component';
import { DevicePieChartComponent } from './device/device-pie-chart/device-pie-chart.component'
import { DevicesService } from './devices.service';
import { DeviceService } from './device/device.service';
import { DeviceNetworkComponent } from './device/device-network/device-network.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DummyDataService } from './dummy-data.service';
import { FuseWidgetModule } from '../../../core/components/widget/widget.module';
import { DeviceMemoryChartComponent } from './device/device-memory-chart/device-memory-chart.component';

const routes = [
  {
    path: '',
    component: DevicesComponent
  },
  {
    path: 'device/:id',
    component: DeviceComponent,
  }
];

@NgModule({
  declarations: [DevicesComponent,
    DeviceComponent,
    DevicePieChartComponent,
    DeviceStateComponent,
    DeviceNetworkComponent,
    AppVersionDialog,
    DeviceMemoryChartComponent
  ],
  entryComponents: [AppVersionDialog],
  imports: [SharedModule, RouterModule.forChild(routes), NgxChartsModule, FuseWidgetModule],
  providers: [DevicesService, DeviceService, DummyDataService]
})
export class DevicesModule {}
