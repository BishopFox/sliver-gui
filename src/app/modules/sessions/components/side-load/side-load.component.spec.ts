import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideLoadComponent } from './side-load.component';

describe('SideLoadComponent', () => {
  let component: SideLoadComponent;
  let fixture: ComponentFixture<SideLoadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SideLoadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SideLoadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
