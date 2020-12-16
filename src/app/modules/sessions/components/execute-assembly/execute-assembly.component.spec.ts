import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecuteAssemblyComponent } from './execute-assembly.component';

describe('ExecuteAssemblyComponent', () => {
  let component: ExecuteAssemblyComponent;
  let fixture: ComponentFixture<ExecuteAssemblyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExecuteAssemblyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecuteAssemblyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
