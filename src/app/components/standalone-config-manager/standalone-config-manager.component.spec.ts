import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandaloneConfigManagerComponent } from './standalone-config-manager.component';

describe('StandaloneConfigManagerComponent', () => {
  let component: StandaloneConfigManagerComponent;
  let fixture: ComponentFixture<StandaloneConfigManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StandaloneConfigManagerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StandaloneConfigManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
