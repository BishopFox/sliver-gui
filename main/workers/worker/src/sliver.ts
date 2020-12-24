import * as commonpb from 'sliver-script/lib/pb/commonpb/common_pb';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb';
import * as Base64 from 'js-base64';
import { Subject } from 'rxjs';

import { APP_ORIGIN } from './constants';


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
      // console.log(`Post message (${APP_ORIGIN}) -> ${data}`);
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
    const sessions: string[] = await this.request('rpc_sessions');
    return sessions.map(session => clientpb.Session.deserializeBinary(Base64.toUint8Array(session)));
  }

  async sessionById(id: number): Promise<clientpb.Session> {
    const session: string = await this.request('rpc_sessionById', JSON.stringify({ id: id }));
    if (session.length) {
      return clientpb.Session.deserializeBinary(Base64.toUint8Array(session));
    }
    return Promise.reject(`No session with id '${id}'`);
  }

  async implantBuilds(): Promise<clientpb.ImplantBuilds> {
    const builds: string = await this.request('rpc_sessions');
    if (builds.length) {
      return clientpb.ImplantBuilds.deserializeBinary(Base64.toUint8Array(builds));
    }
    return Promise.reject(`Empty IPC response`);
  }

  async canaries(): Promise<clientpb.DNSCanary[]> {
    const canaries: string[] = await this.request('rpc_canaries');
    return canaries.map(canary => clientpb.DNSCanary.deserializeBinary(Base64.toUint8Array(canary)));
  }

  async generate(config: clientpb.ImplantConfig): Promise<commonpb.File> {
    const generated: string = await this.request('rpc_generate', JSON.stringify({
      config: Base64.fromUint8Array(config.serializeBinary())
    }));
    return commonpb.File.deserializeBinary(Base64.toUint8Array(generated));
  }

  async regenerate(name: string): Promise<commonpb.File> {
    const regenerated: string = await this.request('rpc_regenerate', JSON.stringify({
      name: name
    }));
    return commonpb.File.deserializeBinary(Base64.toUint8Array(regenerated));
  }

  // Session Interaction
  async ps(sessionId: number): Promise<commonpb.Process[]> {
    const ps: string[] = await this.request('rpc_ps', JSON.stringify({ sessionId: sessionId }));
    return ps.map(p => commonpb.Process.deserializeBinary(Base64.toUint8Array(p)));
  }

  async ls(sessionId: number, targetDir: string): Promise<sliverpb.Ls> {
    const ls: string = await this.request('rpc_ls', JSON.stringify({
      sessionId: sessionId,
      targetDir: targetDir,
    }));
    return sliverpb.Ls.deserializeBinary(Base64.toUint8Array(ls));
  }

  async cd(sessionId: number, targetDir: string): Promise<sliverpb.Pwd> {
    const pwd: string = await this.request('rpc_cd', JSON.stringify({
      sessionId: sessionId,
      targetDir: targetDir,
    }));
    return sliverpb.Pwd.deserializeBinary(Base64.toUint8Array(pwd));
  }

  async rm(sessionId: number, target: string): Promise<sliverpb.Rm> {
    const rm: string = await this.request('rpc_rm', JSON.stringify({
      sessionId: sessionId,
      target: target,
    }));
    return sliverpb.Rm.deserializeBinary(Base64.toUint8Array(rm));
  }

  async mkdir(sessionId: number, targetDir: string): Promise<sliverpb.Mkdir> {
    const mkdir: string = await this.request('rpc_mkdir', JSON.stringify({
      sessionId: sessionId,
      targetDir: targetDir,
    }));
    return sliverpb.Mkdir.deserializeBinary(Base64.toUint8Array(mkdir));
  }

  async download(sessionId: number, target: string): Promise<Uint8Array> {
    const data: string = await this.request('rpc_download', JSON.stringify({
      sessionId: sessionId,
      target: target,
    }));
    return Base64.toUint8Array(data);
  }

  async upload(sessionId: number, data: Uint8Array, path: string): Promise<sliverpb.Upload> {
    const upload: string = await this.request('rpc_upload', JSON.stringify({
      sessionId: sessionId,
      data: Base64.fromUint8Array(data),
      path: path,
    }));
    return sliverpb.Upload.deserializeBinary(Base64.toUint8Array(upload));
  }

  async ifconfig(sessionId: number): Promise<sliverpb.Ifconfig> {
    const ifconfig: string = await this.request('rpc_ifconfig', JSON.stringify({
      sessionId: sessionId,
    }));
    return sliverpb.Ifconfig.deserializeBinary(Base64.toUint8Array(ifconfig));
  }

}