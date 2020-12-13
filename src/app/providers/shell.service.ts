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

import { Injectable } from '@angular/core';
import { Subject, Observer, Subscription } from 'rxjs';
import { Terminal } from 'xterm';
import { TunnelService, Tunnel } from './tunnel.service';
import * as uuid from 'uuid';
import { IPCService } from './ipc.service';


export interface Shell {
  id: string;
  name?: string;

  terminal: Terminal;
  tunnel: Tunnel;
  stdoutSub: Subscription;
}


@Injectable({
  providedIn: 'root'
})
export class ShellService {

  private shells = new Map<string, Shell>();

  constructor(private _ipcService: IPCService,
              private _tunnelService: TunnelService) { }


  async openShell(sessionId: number, path: string, enablePty: boolean): Promise<Shell> {
    const tunnelIpcId = uuid.v4();

    const stdin: Observer<Uint8Array> = {
      next: (raw: Uint8Array) => {
        console.log(`[tunnel service] stdin (outgoing): ${raw}`);
        this._tunnelService.outgoing({
          tunnelIpcId: tunnelIpcId,
          data: raw,
        });
      },
      complete: () => {
        this.shells.delete(tunnelIpcId);
        if (this._tunnelService.has(tunnelIpcId)) {
          this._tunnelService.delete(tunnelIpcId);
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

    this._tunnelService.set(tunnelIpcId, tunnel);
    await this._ipcService.request('rpc_shell', JSON.stringify({
      tunnelIpcId: tunnelIpcId,
      sessionId: sessionId,
      path: path,
      pty: enablePty,
    }));

    const terminal = new Terminal({ scrollback: Number.MAX_VALUE });
    const stdoutSub = tunnel.stdout.subscribe(data => {
      terminal.write(data);
    });

    const shell: Shell = {
      id: tunnelIpcId,
      terminal: terminal,
      tunnel: tunnel,
      stdoutSub: stdoutSub,
    };
    this.shells.set(tunnelIpcId, shell);
    return shell;
  }

  getOpenShells(): Shell[] {
    return Array.from(this.shells.values());
  }

  has(id: string): boolean {
    return this.shells.has(id);
  }

  get(id: string): Shell {
    return this.shells.get(id);
  }

  closeShell(id: string) {
    if (this.has(id)) {
      const shell = this.shells.get(id);
      this.shells.delete(id);
      shell.tunnel.stdin.complete();
      shell.stdoutSub?.unsubscribe();
    }
  }

}
