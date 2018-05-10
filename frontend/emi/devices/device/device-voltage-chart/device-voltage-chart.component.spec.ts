import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceVoltageChartComponent } from './device-voltage-chart.component';

describe('DeviceVoltageChartComponent', () => {
  let component: DeviceVoltageChartComponent;
  let fixture: ComponentFixture<DeviceVoltageChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceVoltageChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceVoltageChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
