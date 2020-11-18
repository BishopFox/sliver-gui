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
import { ClientService } from '@app/providers/client.service';
import { SliverService } from '@app/providers/sliver.service';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf

@Component({
  selector: 'app-generate',
  templateUrl: './generate.component.html',
  styleUrls: ['./generate.component.scss']
})
export class GenerateComponent implements OnInit {


  isGenerating = false;

  constructor(private _sliverService: SliverService,
              private _clientService: ClientService) { }

  ngOnInit(): void {

  }

  async onImplantConfig(implantConfig: clientpb.ImplantConfig) {
    console.log(implantConfig);
  }

  async onGenerate() {
    this.isGenerating = true;
    const config = new clientpb.ImplantConfig();

    const generated = await this._sliverService.generate(config);
    const msg = `Save new implant ${generated.getName()}`;
    const save = await this._clientService.saveFile('Save File', msg, generated.getName(), generated.getData_asU8());
    console.log(`Saved file to: ${save}`);
  }

}
