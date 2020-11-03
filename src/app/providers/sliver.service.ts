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

This service is responsible for all of the Sliver Server interactions that
use protobuf.

*/

import { Injectable } from '@angular/core';
import { IPCService } from './ipc.service';
import { ProtobufService } from './protobuf.service';
import { Base64 } from 'js-base64';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb'; // Protobuf
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';


@Injectable({
  providedIn: 'root'
})
export class SliverService extends ProtobufService {

  constructor(private _ipc: IPCService) {
    super();
  }

  async sessions(): Promise<clientpb.Session[]> {
    let sessions: string[] = await this._ipc.request('rpc_sessions');
    return sessions.map(session => clientpb.Session.deserializeBinary(Base64.toUint8Array(session)));
  }

  async sessionById(id: number): Promise<clientpb.Session> {
    let session: string = await this._ipc.request('rpc_sessionById', JSON.stringify({ id: id }));
    if (session.length) {
      return clientpb.Session.deserializeBinary(Base64.toUint8Array(session));
    }
    return Promise.reject(`No session with id '${id}'`);
  }

  async implantBuilds(): Promise<clientpb.ImplantBuilds> {
    let builds: string = await this._ipc.request('rpc_sessions');
    if (builds.length) {
      return clientpb.ImplantBuilds.deserializeBinary(Base64.toUint8Array(builds));
    }
    return Promise.reject(`Empty IPC response`);
  }

  async canaries(): Promise<clientpb.DNSCanary[]> {
    let canaries: string[] = await this._ipc.request('rpc_canaries');
    return canaries.map(canary => clientpb.DNSCanary.deserializeBinary(Base64.toUint8Array(canary)));
  }

  async generate(config: clientpb.ImplantConfig): Promise<clientpb.Generate> {

    return null;
  }

  async regenerate(name: string): Promise<clientpb.Generate> {
    
    return null;
  }

  // Session Interaction
  async ps(sessionId: number): Promise<sliverpb.Ps> {

    return null;
  }

  async ls(sessionId: number, targetDir: string): Promise<sliverpb.Ls> {
    
    return null;
  }

  async cd(sessionId: number, targetDir: string): Promise<sliverpb.Pwd> {
    
    return null;
  }

  async rm(sessionId: number, target: string): Promise<sliverpb.Rm> {
    
    return null;
  }

  async mkdir(sessionId: number, targetDir: string): Promise<sliverpb.Mkdir> {
    
    return null;
  }

  async download(sessionId: number, targetFile: string): Promise<sliverpb.Download> {
    
    return null;
  }

  async upload(sessionId: number, data: Uint8Array, encoder: string, dst: string): Promise<sliverpb.Upload> {
    
    return null;
  }

  async ifconfig(sessionId: number): Promise<sliverpb.Ifconfig> {
    
    return null;
  }

}
