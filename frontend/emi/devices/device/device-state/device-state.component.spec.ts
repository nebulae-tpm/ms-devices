import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceStateComponent } from './device-state.component';

describe('DeviceStateComponent', () => {
  let component: DeviceStateComponent;
  let fixture: ComponentFixture<DeviceStateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceStateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
