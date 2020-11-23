import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateImplantConfigComponent } from './create-implant-config.component';

describe('NewImplantComponent', () => {
  let component: CreateImplantConfigComponent;
  let fixture: ComponentFixture<CreateImplantConfigComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateImplantConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateImplantConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
