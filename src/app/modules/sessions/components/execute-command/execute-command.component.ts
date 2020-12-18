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

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import { SliverService } from '@app/providers/sliver.service';
import { Terminal } from 'xterm';


@Component({
  selector: 'app-execute-command',
  templateUrl: './execute-command.component.html',
  styleUrls: ['./execute-command.component.scss']
})
export class ExecuteCommandComponent implements OnInit {

  command: string;
  session: clientpb.Session;
  terminals: Terminal[];
  selected = new FormControl(0);

  constructor(private _route: ActivatedRoute,
              private _sliverService: SliverService) { }

  ngOnInit() {
    this._route.parent.params.pipe(take(1)).subscribe(params => {
      const sessionId: number = parseInt(params['session-id'], 10);
      this._sliverService.sessionById(sessionId).then(session => {
        this.session = session;
      }).catch(err => {
        console.error(`No session with id ${sessionId} (${err})`);
      });
    });
  }

  execute() {

  }

  jumpToTop() {
    const term = this.terminals[this.selected?.value];
    if (term) {
      term.scrollToTop();
    }
  }

  jumpToBottom() {
    const term = this.terminals[this.selected?.value];
    if (term) {
      term.scrollToBottom();
    }
  }

  copyScrollback() {
    const term = this.terminals[this.selected?.value];
    if (term) {
      term.selectAll();
      document.execCommand('copy');
      term.clearSelection();
    }
  }

  removeTab() {
    if (this.terminals.length) {
      this.terminals.slice(this.selected?.value);
    }
  }

}
