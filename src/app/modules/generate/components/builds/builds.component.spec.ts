import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BuildsComponent } from './builds.component';

describe('HistoryComponent', () => {
  let component: BuildsComponent;
  let fixture: ComponentFixture<BuildsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BuildsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
