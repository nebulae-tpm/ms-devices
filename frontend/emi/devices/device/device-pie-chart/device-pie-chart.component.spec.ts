import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DevicePieChartComponent } from './device-pie-chart.component';

describe('DevicePieChartComponent', () => {
  let component: DevicePieChartComponent;
  let fixture: ComponentFixture<DevicePieChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DevicePieChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DevicePieChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
