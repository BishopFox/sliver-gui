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
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { FadeInOut } from '@app/shared/animations';
import { SliverService } from '@app/providers/sliver.service';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf
import { ClientService } from '@app/providers/client.service';


@Component({
  selector: 'sessions-standalone-interact',
  templateUrl: './standalone-interact.component.html',
  styleUrls: ['./standalone-interact.component.scss'],
  animations: [FadeInOut]
})
export class StandaloneInteractComponent implements OnInit {

  sessionId: number;
  session: clientpb.Session;

  constructor(public dialog: MatDialog,
              private _route: ActivatedRoute,
              private _sliverService: SliverService,
              private _clientService: ClientService) { }

  ngOnInit() {
    this._route.params.subscribe((params) => {
      this.sessionId = parseInt(params['session-id'], 10);
      this._sliverService.sessionById(this.sessionId).then((session) => {
        this.session = session;
      }).catch(() => {
        console.log(`No session with id ${this.sessionId}`);
      });
    });
  }

  get ActiveC2(): string {
    return this.session ? this.session.getActivec2() : null;
  }

}
