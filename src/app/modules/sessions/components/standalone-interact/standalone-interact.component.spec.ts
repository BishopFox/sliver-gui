import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandaloneInteractComponent } from './standalone-interact.component';

describe('StandaloneInteractComponent', () => {
  let component: StandaloneInteractComponent;
  let fixture: ComponentFixture<StandaloneInteractComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StandaloneInteractComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StandaloneInteractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
