import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptingComponent } from './scripting.component';

describe('ScriptingComponent', () => {
  let component: ScriptingComponent;
  let fixture: ComponentFixture<ScriptingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScriptingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScriptingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
