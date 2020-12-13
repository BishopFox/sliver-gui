/*
  Sliver Implant Framework
  Copyright (C) 2019  Bishop Fox
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


import { 
  Component, OnInit, ViewChildren, AfterViewInit, OnDestroy, Input, QueryList, // Directive
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import { SliverService } from '@app/providers/sliver.service';
import { ShellService, Shell } from '@app/providers/shell.service';
import { NgTerminalComponent } from '@app/modules/terminal/ng-terminal.component';


// @Directive({selector: 'ng-terminal'})
// export class NgTerminalDirective {
//   @Input() id!: string;
// }


@Component({
  selector: 'sessions-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() selectAfterAdding = true;
  session: clientpb.Session;
  textEncoder = new TextEncoder();
  selected = new FormControl(0);
  @ViewChildren(NgTerminalComponent) terminalChildren!: QueryList<NgTerminalComponent>;

  constructor(private _route: ActivatedRoute,
              private _sliverService: SliverService,
              private _shellService: ShellService) { }

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

  get shells(): Shell[] {
    return this._shellService.getOpenShells();
  }

  ngOnDestroy() {

  }

  ngAfterViewInit() {

  }

  jumpToTop() {
    const selectedShell = this.shells[this.selected?.value];
    if (selectedShell) {
      selectedShell.terminal.scrollToTop();
    }
  }

  jumpToBottom() {
    const selectedShell = this.shells[this.selected?.value];
    if (selectedShell) {
      selectedShell.terminal.scrollToBottom();
    }
  }

  copyScrollback() {
    const selectedShell = this.shells[this.selected?.value];
    if (selectedShell) {
      selectedShell.terminal.selectAll();
      document.execCommand('copy');
      selectedShell.terminal.clearSelection();
    }
  }

  onKeyEvent(event, shell: Shell) {
    shell.tunnel.stdin.next(this.textEncoder.encode(event.key));
  }

  async addTab() {
    await this._shellService.openShell(this.session.getId(), '/bin/bash', true);
    if (this.selectAfterAdding) {
      this.selected.setValue(this.shells.length - 1);
    }
  }

  removeTab(index: number) {
    // this.tabs.splice(index, 1);
  }

}

