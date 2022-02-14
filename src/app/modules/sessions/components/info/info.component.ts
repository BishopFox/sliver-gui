/*
  Sliver Implant Framework
  Copyright (C) 2021  Bishop Fox
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
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb'; // Protobuf

import { SliverService } from '@app/providers/sliver.service';


@Component({
  selector: 'sessions-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {

  session: clientpb.Session;
  ifconfig: sliverpb.Ifconfig;

  constructor(private _route: ActivatedRoute,
              private _sliverService: SliverService) { }

  ngOnInit() {
    this._route.parent.params.pipe(take(1)).subscribe((params) => {
      const sessionId: string = params['session-id'];
      this._sliverService.sessionById(sessionId).then((session) => {
        this.session = session;
        this.fetchIfconfig();
      }).catch(() => {
        console.error(`No session with id ${sessionId}`);
      });
    });
  }

  async fetchIfconfig() {
    this.ifconfig = await this._sliverService.ifconfig(this.session.getId());
  }

  get interfaces(): sliverpb.NetInterface[] {
    if (!this.ifconfig) {
      return [];
    }
    return this.ifconfig.getNetinterfacesList();
  }

}
