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
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import * as xterm from 'xterm';

import { SliverService } from '@app/providers/sliver.service';
import { TunnelService, Tunnel } from '@app/providers/tunnel.service';


@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit, AfterViewInit, OnDestroy {

  readonly SCROLLBACK = 100000;

  @ViewChild('terminal') el: ElementRef;
  session: clientpb.Session;
  terminal: xterm.Terminal;
  recvSub: Subscription;
  tunnel: Tunnel;
  active = false;
  textEncoder = new TextEncoder();

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
    if (this.recvSub) {
      this.recvSub.unsubscribe();
      this.active = false;
    }
  }

  ngAfterViewInit() {
    /* Terminal setup */
    this.terminal = new xterm.Terminal({
      cursorBlink: true,
      scrollback: this.SCROLLBACK,
    });
    this.terminal.open(this.el.nativeElement);
    this.terminal.write('\r\x1b[80;1HSystem Ready ');
  }

  async openShell() {
    this.active = true;
    this.terminal.clear();
    this.terminal.write('\r\x1b[1m\x1b[36m[*] \x1b[0m Connecting ...');
    this.tunnel = await this._tunnelService.createTunnel(this.session.getId());
    this.terminal.clear();

  }

}

