import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebsitesTableComponent } from './websites-table.component';

describe('WebsitesTableComponent', () => {
  let component: WebsitesTableComponent;
  let fixture: ComponentFixture<WebsitesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebsitesTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebsitesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
