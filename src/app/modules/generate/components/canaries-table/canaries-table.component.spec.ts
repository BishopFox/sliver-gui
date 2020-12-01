import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanariesTableComponent } from './canaries-table.component';

describe('CanariesComponent', () => {
  let component: CanariesTableComponent;
  let fixture: ComponentFixture<CanariesTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CanariesTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CanariesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
