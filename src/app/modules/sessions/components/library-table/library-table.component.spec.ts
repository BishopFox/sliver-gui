import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryTableComponent } from './library-table.component';

describe('LibraryTableComponent', () => {
  let component: LibraryTableComponent;
  let fixture: ComponentFixture<LibraryTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LibraryTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LibraryTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
