import * as commonpb from 'sliver-script/lib/pb/commonpb/common_pb';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb';
import * as Base64 from 'js-base64';

import { Subject } from 'rxjs';

const APP_ORIGIN = 'app://sliver';

interface IPCMessage {
  id: number;
  type: string;
  method: string;
  data: string;
}

export class Sliver {

  private _ipcResponse$ = new Subject<IPCMessage>();
  ipcEvent$ = new Subject<clientpb.Event>();

  constructor() {
    window.addEventListener('message', (event) => {
      try {
        const msg: IPCMessage = JSON.parse(event.data);
        if (msg.type === 'response') {
          this._ipcResponse$.next(msg);
        }
      } catch (err) {
        console.error(`${err}`);
      }
    });
  }

  private request(method: string, data?: string): Promise<any> {
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
      console.log(`Post message (${APP_ORIGIN}) -> ${data}`);
      parent.postMessage(JSON.stringify({
        id: msgId,
        type: 'request',
        method: method,
        data: data,
      }), APP_ORIGIN);
      
    });
  }

  private randomId(): number {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    const bufView = new DataView(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    return bufView.getUint32(0, true) || 1; // In the unlikely event we get a 0 value, return 1 instead
  }

  // Public Methods

  async sessions(): Promise<clientpb.Session[]> {
    let sessions: string[] = await this.request('rpc_sessions');
    return sessions.map(session => clientpb.Session.deserializeBinary(Base64.toUint8Array(session)));
  }

}

/* Export to 'window' */
declare global {
  interface Window { CommonPB: any; }
  interface Window { ClientPB: any; }
  interface Window { SliverPB: any; }
  interface Window { Base64: any; }
  interface Window { Sliver: Sliver; }
}

window.CommonPB = commonpb;
window.ClientPB = clientpb;
window.SliverPB = sliverpb;
window.Base64 = Base64;
window.Sliver = new Sliver();
