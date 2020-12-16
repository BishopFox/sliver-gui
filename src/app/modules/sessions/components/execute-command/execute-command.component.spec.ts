import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecuteCommandComponent } from './execute-command.component';

describe('ExecuteCommandComponent', () => {
  let component: ExecuteCommandComponent;
  let fixture: ComponentFixture<ExecuteCommandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExecuteCommandComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecuteCommandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
