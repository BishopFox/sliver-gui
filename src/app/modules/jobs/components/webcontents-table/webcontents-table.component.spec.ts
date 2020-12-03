import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebContentsTableComponent } from './webcontents-table.component';

describe('WebcontentsTableComponent', () => {
  let component: WebContentsTableComponent;
  let fixture: ComponentFixture<WebContentsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebContentsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebContentsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
