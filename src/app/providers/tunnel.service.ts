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

import { Injectable } from '@angular/core';
import { Subject, Observer } from 'rxjs';

import { IPCService } from './ipc.service';


export interface Tunnel {
  tunnelIpcId: string;
  stdin: Observer<Uint8Array>;
  stdout: Subject<Uint8Array>;
}

export interface TunnelEvent {
  tunnelIpcId: string;
  data: Uint8Array;
}


@Injectable({
  providedIn: 'root'
})
export class TunnelService {

  private tunnels = new Map<string, Tunnel>();

  constructor(private _ipc: IPCService) {
    this._ipc.incomingTunnelEvent$.subscribe(event => {
      const tunnel = this.tunnels.get(event.tunnelIpcId);
      tunnel?.stdout.next(event.data);
    });
  }

  async outgoing(event: TunnelEvent) {
    this._ipc.outgoingTunnelEvent$.next(event);
  }

  set(tunnelIpcId: string, tunnel: Tunnel): void {
    this.tunnels.set(tunnelIpcId, tunnel);
  }

  has(tunnelIpcId: string): boolean {
    return this.tunnels.has(tunnelIpcId);
  }

  delete(tunnelIpcId: string): void {
    this.tunnels.delete(tunnelIpcId);
    // tell client the close connection
  }

}
