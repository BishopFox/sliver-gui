import { TestBed } from '@angular/core/testing';

import { ShellService } from './shell.service';

describe('ShellService', () => {
  let service: ShellService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShellService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
