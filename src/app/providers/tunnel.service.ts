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
import * as uuid from 'uuid';


export interface Tunnel {
  tunnelIpcId: string;
  stdin: Observer<Uint8Array>;
  stdout: Subject<Uint8Array>;
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

  async outgoing(tunnelIpcId: string, data: string) {
    this._ipc.outgoingTunnelEvent$
  }

  async shell(sessionId: number, path: string, enablePty: boolean): Promise<Tunnel> {
    const tunnelIpcId = uuid.v4();

    const stdin: Observer<Uint8Array> = {
      next: (raw: Uint8Array) => {
        console.log(`[tunnel service] stdin (outgoing): ${raw}`);
        this._ipc.outgoingTunnelEvent$.next({
          tunnelIpcId: tunnelIpcId,
          data: raw,
        });
      },
      complete: () => {
        if (this.tunnels.has(tunnelIpcId)) {
          this.tunnels.delete(tunnelIpcId);
        }
      },
      error: (err) => {
        console.error(`Tunnel stdin error (${tunnelIpcId}): ${err}`);
      },
    };

    const tunnel = {
      tunnelIpcId: tunnelIpcId,
      stdout: new Subject<Uint8Array>(),
      stdin: stdin,
    };

    this.tunnels.set(tunnelIpcId, tunnel);
    await this._ipc.request('rpc_shell', JSON.stringify({
      tunnelIpcId: tunnelIpcId,
      sessionId: sessionId,
      path: path,
      pty: enablePty,
    }));

    return tunnel;
  }

}
