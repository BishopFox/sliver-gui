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

import { Component, Input, OnInit } from '@angular/core';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';


@Component({
  selector: 'generate-implant-config',
  templateUrl: './implant-config.component.html',
  styleUrls: ['./implant-config.component.scss']
})
export class ImplantConfigComponent implements OnInit {

  @Input() implantConfig: clientpb.ImplantConfig;

  constructor() { }

  ngOnInit(): void { }

  getGoos() {
    return this.implantConfig?.getGoos();
  }

  getFormat(): string {
    switch (this.implantConfig.getFormat()) {
      case clientpb.OutputFormat.EXECUTABLE:
        return "Executable";
      case clientpb.OutputFormat.SERVICE:
        return "Service";
      case clientpb.OutputFormat.SHARED_LIB:
        return "Shared Library";
      case clientpb.OutputFormat.SHELLCODE:
        return "Shellcode";
      default:
        return "Unknown";
    }
  }

  getC2s(): clientpb.ImplantC2[] {
    return this.implantConfig.getC2List();
  }

}
