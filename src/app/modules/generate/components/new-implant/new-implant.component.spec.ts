import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NewImplantComponent } from './new-implant.component';

describe('NewImplantComponent', () => {
  let component: NewImplantComponent;
  let fixture: ComponentFixture<NewImplantComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NewImplantComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewImplantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
