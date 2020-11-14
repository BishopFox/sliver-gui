import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StartListenerComponent } from './start-listener.component';

describe('StartListenerComponent', () => {
  let component: StartListenerComponent;
  let fixture: ComponentFixture<StartListenerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StartListenerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartListenerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
