import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InteractComponent } from './interact.component';

describe('InteractComponent', () => {
  let component: InteractComponent;
  let fixture: ComponentFixture<InteractComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InteractComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
