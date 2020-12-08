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
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import { ClientService } from '@app/providers/client.service';
import { SliverService } from '@app/providers/sliver.service';


@Component({
  selector: 'app-build-details',
  templateUrl: './build-details.component.html',
  styleUrls: ['./build-details.component.scss']
})
export class BuildDetailsComponent implements OnInit {

  name: string;
  implantConfig: clientpb.ImplantConfig;

  constructor(private _route: ActivatedRoute,
              private _snackBar: MatSnackBar,
              private _clientService: ClientService,
              private _sliverService: SliverService) { }

  ngOnInit(): void {
    this._route.params.pipe(take(1)).subscribe(async (params) => {
      const [name, config] = await this._sliverService.implantBuildByName(params['name']);
      this.name = name;
      this.implantConfig = config;
    });
  }

  back() {
    window.history.back();
  }

  async regenerate() {
    this._snackBar.open(`Regenerating ${this.name}, please wait...`, 'Dismiss', {
      duration: 5000,
    });
    const regenerated = await this._sliverService.regenerate(this.name);
    if (regenerated) {
      const msg = `Save regenerated file ${regenerated.getName()}`;
      const path = await this._clientService.saveFile('Save File', msg, regenerated.getName(), regenerated.getData_asU8());
      console.log(`Saved file to: ${path}`);
    } else {
      console.error(`Failed to regenerate sliver ${this.name}`);
    }
  }

}
