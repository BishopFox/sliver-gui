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
--------------------------------------------------------------------------

This service is the common carrier for all IPC messages.

*/

import { Injectable } from '@angular/core';
import { Base64 } from 'js-base64';
import { Subject } from 'rxjs';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb'; // Protobuf

interface IPCMessage {
  id: number;
  type: string;
  method: string;
  data: string;
}

@Injectable({
  providedIn: 'root'
})
export class IPCService {

  private _ipcResponse$ = new Subject<IPCMessage>();
  ipcEvent$ = new Subject<clientpb.Event>();

  constructor() {
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      try {
        const msg: IPCMessage = JSON.parse(event.data);
        if (msg.type === 'response') {
          this._ipcResponse$.next(msg);
        } else if (msg.type === 'push') { 
          const event = clientpb.Event.deserializeBinary(Base64.toUint8Array(msg.data));
          this.ipcEvent$.next(event);
        }
      } catch (err) {
        console.error(`[IPCService] ${err}`);
      }
    });
  }

  request(method: string, data?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const msgId = this.randomId();
      const subscription = this._ipcResponse$.subscribe((msg: IPCMessage) => {
        if (msg.id === msgId) {
          subscription.unsubscribe();
          if (msg.method !== 'error') {
            resolve(msg.data);
          } else {
            reject(msg.data);
          }
        }
      });
      window.postMessage(JSON.stringify({
        id: msgId,
        type: 'request',
        method: method,
        data: data,
      }), window.location.origin);
    });
  }

  private randomId(): number {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    const bufView = new DataView(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    return bufView.getUint32(0, true) || 1; // In the unlikely event we get a 0 value, return 1 instead
  }

}
