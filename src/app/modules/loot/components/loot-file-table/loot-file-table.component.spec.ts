import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LootFileTableComponent } from './loot-file-table.component';

describe('LootFileTableComponent', () => {
  let component: LootFileTableComponent;
  let fixture: ComponentFixture<LootFileTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LootFileTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LootFileTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
