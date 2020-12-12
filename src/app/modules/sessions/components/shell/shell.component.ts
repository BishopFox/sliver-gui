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


import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import { NgTerminal } from '@app/modules/terminal/ng-terminal';
import { SliverService } from '@app/providers/sliver.service';
import { TunnelService } from '@app/providers/tunnel.service';


@Component({
  selector: 'sessions-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit, AfterViewInit, OnDestroy {

  readonly SCROLLBACK = 100000;
  session: clientpb.Session;
  @ViewChild('term', { static: true }) terminal: NgTerminal;

  textEncode = new TextEncoder();

  constructor(private _route: ActivatedRoute,
              private _sliverService: SliverService,
              private _tunnelService: TunnelService) { }

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

  ngOnDestroy() {

  }

  ngAfterViewInit() {

  }

  async openShell() {
    const tunnel = await this._tunnelService.shell(this.session.getId(), '/bin/bash', true);
    tunnel.stdout.subscribe(data => {
      this.terminal.write(data);
    });
    this.terminal.keyEventInput.subscribe(e => {
      const data = this.textEncode.encode(e.key);
      console.log(`[shell component] stdin: ${data}`);
      tunnel.stdin.next(data);
    });
  }

}

