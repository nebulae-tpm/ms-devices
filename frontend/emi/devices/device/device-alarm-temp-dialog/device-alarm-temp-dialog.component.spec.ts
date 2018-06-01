import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceMemoryChartComponent } from './device-memory-chart.component';

describe('DeviceMemoryChartComponent', () => {
  let component: DeviceMemoryChartComponent;
  let fixture: ComponentFixture<DeviceMemoryChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceMemoryChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceMemoryChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
