import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LootCredentialTableComponent } from './loot-credential-table.component';

describe('LootCredentialTableComponent', () => {
  let component: LootCredentialTableComponent;
  let fixture: ComponentFixture<LootCredentialTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LootCredentialTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LootCredentialTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
