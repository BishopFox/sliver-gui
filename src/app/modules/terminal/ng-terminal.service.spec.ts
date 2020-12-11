import { TestBed } from '@angular/core/testing';

import { NgTerminalService } from './ng-terminal.service';

describe('NgTerminalService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgTerminalService = TestBed.get(NgTerminalService);
    expect(service).toBeTruthy();
  });
});
