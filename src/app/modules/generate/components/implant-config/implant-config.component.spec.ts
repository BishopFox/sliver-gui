import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImplantConfigComponent } from './implant-config.component';

describe('ImplantConfigComponent', () => {
  let component: ImplantConfigComponent;
  let fixture: ComponentFixture<ImplantConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImplantConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImplantConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
