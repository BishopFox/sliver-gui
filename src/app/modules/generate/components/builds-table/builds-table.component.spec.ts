import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BuildsTableComponent } from './builds-table.component';

describe('HistoryComponent', () => {
  let component: BuildsTableComponent;
  let fixture: ComponentFixture<BuildsTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BuildsTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
