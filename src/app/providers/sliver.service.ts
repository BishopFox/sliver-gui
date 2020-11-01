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
import { SliverPB, ClientPB } from '@rpc/pb'; // Constants
import * as clientpb from '@rpc/pb/client_pb'; // Protobuf
import * as sliverpb from '@rpc/pb/sliver_pb'; // Protobuf


@Injectable({
  providedIn: 'root'
})
export class SliverService extends ProtobufService {

  constructor(private _ipc: IPCService) {
    super();
  }

  async sessions(): Promise<clientpb.Sessions> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(ClientPB.MsgSessions);
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return clientpb.Sessions.deserializeBinary(this.decode(resp));
  }

  async sessionById(id: number): Promise<clientpb.Sliver> {
    const sessions = await this.sessions();
    const slivers = sessions.getSliversList();
    for (let index = 0; index < slivers.length; ++index) {
      if (slivers[index].getId() === id) {
        return slivers[index];
      }
    }
    return Promise.reject(`No session with id '${id}'`);
  }

  async sliverBuilds(): Promise<clientpb.SliverBuilds> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(ClientPB.MsgListSliverBuilds);
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return clientpb.SliverBuilds.deserializeBinary(this.decode(resp));
  }

  async canaries(): Promise<clientpb.Canaries> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(ClientPB.MsgListCanaries);
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return clientpb.Canaries.deserializeBinary(this.decode(resp));
  }

  async generate(config: clientpb.SliverConfig): Promise<clientpb.Generate> {
    const reqEnvelope = new sliverpb.Envelope();
    const generateReq = new clientpb.GenerateReq();
    generateReq.setConfig(config);
    reqEnvelope.setType(ClientPB.MsgGenerate);
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return clientpb.Generate.deserializeBinary(this.decode(resp));
  }

  async regenerate(name: string): Promise<clientpb.Regenerate> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(ClientPB.MsgRegenerate);
    const regenReq = new clientpb.Regenerate();
    regenReq.setSlivername(name);
    reqEnvelope.setData(regenReq.serializeBinary());
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return clientpb.Regenerate.deserializeBinary(this.decode(resp));
  }

  async ps(sliverId: number): Promise<sliverpb.Ps> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(SliverPB.MsgPsReq);
    const psReq = new sliverpb.PsReq();
    psReq.setSliverid(sliverId);
    reqEnvelope.setData(psReq.serializeBinary());
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return sliverpb.Ps.deserializeBinary(this.decode(resp));
  }

  async ls(sliverId: number, targetDir: string): Promise<sliverpb.Ls> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(SliverPB.MsgLsReq);
    const lsReq = new sliverpb.LsReq();
    lsReq.setSliverid(sliverId);
    lsReq.setPath(targetDir);
    reqEnvelope.setData(lsReq.serializeBinary());
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return sliverpb.Ls.deserializeBinary(this.decode(resp));
  }

  async cd(sliverId: number, targetDir: string): Promise<sliverpb.Pwd> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(SliverPB.MsgCdReq);
    const cdReq = new sliverpb.CdReq();
    cdReq.setSliverid(sliverId);
    cdReq.setPath(targetDir);
    reqEnvelope.setData(cdReq.serializeBinary());
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return sliverpb.Pwd.deserializeBinary(this.decode(resp));
  }

  async rm(sliverId: number, target: string): Promise<sliverpb.Rm> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(SliverPB.MsgRmReq);
    const rmReq = new sliverpb.RmReq();
    rmReq.setSliverid(sliverId);
    rmReq.setPath(target);
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return sliverpb.Rm.deserializeBinary(this.decode(resp));
  }

  async mkdir(sliverId: number, targetDir: string): Promise<sliverpb.Mkdir> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(SliverPB.MsgMkdirReq);
    const mkdirReq = new sliverpb.MkdirReq();
    mkdirReq.setSliverid(sliverId);
    mkdirReq.setPath(targetDir);
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return sliverpb.Mkdir.deserializeBinary(this.decode(resp));
  }

  async download(sliverId: number, targetFile: string): Promise<sliverpb.Download> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(SliverPB.MsgDownloadReq);
    const downloadReq = new sliverpb.DownloadReq();
    downloadReq.setSliverid(sliverId);
    downloadReq.setPath(targetFile);
    reqEnvelope.setData(downloadReq.serializeBinary());
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return sliverpb.Download.deserializeBinary(this.decode(resp));
  }

  async upload(sliverId: number, data: Uint8Array, encoder: string, dst: string): Promise<sliverpb.Upload> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(SliverPB.MsgUploadReq);
    const uploadReq = new sliverpb.UploadReq();
    uploadReq.setSliverid(sliverId);
    uploadReq.setData(data);
    uploadReq.setEncoder(encoder);
    uploadReq.setPath(dst);
    reqEnvelope.setData(uploadReq.serializeBinary());
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return sliverpb.Upload.deserializeBinary(this.decode(resp));
  }

  async ifconfig(sliverId: number): Promise<sliverpb.Ifconfig> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(SliverPB.MsgIfconfigReq);
    const ifconfigReq = new sliverpb.IfconfigReq();
    ifconfigReq.setSliverid(sliverId);
    reqEnvelope.setData(ifconfigReq.serializeBinary());
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return sliverpb.Ifconfig.deserializeBinary(this.decode(resp));
  }

}
