/*
  Sliver Implant Framework
  Copyright (C) 2020  Bishop Fox
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WorkersService } from '@app/providers/workers.service';
import { Terminal } from 'xterm';


@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, AfterViewChecked {

  execId: string;
  name: string;
  terminal: Terminal;

  readonly TERMINAL = "terminal";
  private terminalInitialized = false;

  constructor(private _route: ActivatedRoute,
              private _workersService: WorkersService) { }

  ngOnInit(): void {
    this._route.params.subscribe((params) => {
      this.execId = params['exec-id'];
      this.name = this._workersService.getWorkerName(this.execId);
      this.terminal = this._workersService.getWorkerTerminal(this.execId);
    });
  }

  ngAfterViewChecked(): void {
    if (!this.terminalInitialized) {
      this.terminalInitialized = true;
      this.terminal.open(document.getElementById(this.TERMINAL));
    }
  }

}
