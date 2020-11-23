import { ComponentFixture, TestBed } from '@angular/core/testing';

import { C2TableComponent } from './c2-table.component';

describe('C2TableComponent', () => {
  let component: C2TableComponent;
  let fixture: ComponentFixture<C2TableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ C2TableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(C2TableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
