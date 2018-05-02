import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceNetworkComponent } from './device-network.component';

describe('DeviceNetworkComponent', () => {
  let component: DeviceNetworkComponent;
  let fixture: ComponentFixture<DeviceNetworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceNetworkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
