import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecuteShellcodeComponent } from './execute-shellcode.component';

describe('ExecuteShellcodeComponent', () => {
  let component: ExecuteShellcodeComponent;
  let fixture: ComponentFixture<ExecuteShellcodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExecuteShellcodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecuteShellcodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
