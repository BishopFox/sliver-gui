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

import { Injectable } from '@angular/core';
import { Subject, Observer } from 'rxjs';
import { IPCService } from './ipc.service';
import { ProtobufService } from './protobuf.service';


export interface Tunnel {
  id: number;
  sliverID: number;
  send: Observer<Uint8Array>;
  recv: Subject<Uint8Array>;
}


@Injectable({
  providedIn: 'root'
})
export class TunnelService extends ProtobufService {

  constructor(private _ipc: IPCService) {
    super();
  }

  async createTunnel(sessionId: number, enablePty?: boolean): Promise<Tunnel> {

    return null;
  }

}
