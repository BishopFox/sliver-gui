import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ImplantConfigComponent } from './implant-config.component';

describe('NewImplantComponent', () => {
  let component: ImplantConfigComponent;
  let fixture: ComponentFixture<ImplantConfigComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ImplantConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImplantConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
