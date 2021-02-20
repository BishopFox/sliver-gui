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
--------------------------------------------------------------------------

This service is responsible for all of the Sliver Server interactions that
use protobuf.

*/

import { Injectable } from '@angular/core';
import { IPCService } from './ipc.service';
import { Base64 } from 'js-base64';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb';
import * as commonpb from 'sliver-script/lib/pb/commonpb/common_pb';
import { profile } from 'console';


@Injectable({
  providedIn: 'root'
})
export class SliverService {

  constructor(private _ipc: IPCService) { }

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
    let builds: string = await this._ipc.request('rpc_implantBuilds');
    if (builds.length) {
      return clientpb.ImplantBuilds.deserializeBinary(Base64.toUint8Array(builds));
    }
    return Promise.reject(`Empty IPC response`);
  }

  async implantBuildByName(name: string): Promise<[string, clientpb.ImplantConfig]> {
    const builds = await this.implantBuilds();
    return [name, builds.getConfigsMap().get(name)];
  }

  async deleteImplantBuild(name: string): Promise<void> {
    await this._ipc.request('rpc_deleteImplantBuild', JSON.stringify({
      name: name,
    }));
  }

  async saveImplantProfile(profile: clientpb.ImplantProfile): Promise<clientpb.ImplantProfile> {
    const saved: string = await this._ipc.request('rpc_saveImplantProfile', JSON.stringify({
      profile: Base64.fromUint8Array(profile.serializeBinary()),
    }));
    return clientpb.ImplantProfile.deserializeBinary(Base64.toUint8Array(saved));
  }

  async implantProfiles(): Promise<clientpb.ImplantProfile[]> {
    const profiles: string[] = await this._ipc.request('rpc_implantProfiles');
    return profiles.map(profile => clientpb.ImplantProfile.deserializeBinary(Base64.toUint8Array(profile)));
  }

  async implantProfileByName(name: string): Promise<clientpb.ImplantProfile|null> {
    const profiles = await this.implantProfiles();
    const filteredProfiles = profiles.filter(profile => profile.getName() === name);
    return filteredProfiles.length > 0 ? filteredProfiles[0] : null;
  }

  async deleteImplantProfile(name: string): Promise<void> {
    await this._ipc.request('rpc_deleteImplantProfile', JSON.stringify({
      name: name,
    }));
  }

  async canaries(): Promise<clientpb.DNSCanary[]> {
    const canaries: string[] = await this._ipc.request('rpc_canaries');
    return canaries.map(canary => clientpb.DNSCanary.deserializeBinary(Base64.toUint8Array(canary)));
  }

  async generate(config: clientpb.ImplantConfig): Promise<commonpb.File> {
    const generated: string = await this._ipc.request('rpc_generate', JSON.stringify({
      config: Base64.fromUint8Array(config.serializeBinary())
    }));
    return commonpb.File.deserializeBinary(Base64.toUint8Array(generated));
  }

  async regenerate(name: string): Promise<commonpb.File> {
    const regenerated: string = await this._ipc.request('rpc_regenerate', JSON.stringify({
      name: name
    }));
    return commonpb.File.deserializeBinary(Base64.toUint8Array(regenerated));
  }

  // Session Interaction
  async ps(sessionId: number): Promise<commonpb.Process[]> {
    const ps: string[] = await this._ipc.request('rpc_ps', JSON.stringify({ sessionId: sessionId }));
    return ps.map(p => commonpb.Process.deserializeBinary(Base64.toUint8Array(p)));
  }

  async ls(sessionId: number, targetDir: string): Promise<sliverpb.Ls> {
    const ls: string = await this._ipc.request('rpc_ls', JSON.stringify({
      sessionId: sessionId,
      targetDir: targetDir,
    }));
    return sliverpb.Ls.deserializeBinary(Base64.toUint8Array(ls));
  }

  async cd(sessionId: number, targetDir: string): Promise<sliverpb.Pwd> {
    const pwd: string = await this._ipc.request('rpc_cd', JSON.stringify({
      sessionId: sessionId,
      targetDir: targetDir,
    }));
    return sliverpb.Pwd.deserializeBinary(Base64.toUint8Array(pwd));
  }

  async rm(sessionId: number, target: string): Promise<sliverpb.Rm> {
    let rm: string = await this._ipc.request('rpc_rm', JSON.stringify({
      sessionId: sessionId,
      target: target,
    }));
    return sliverpb.Rm.deserializeBinary(Base64.toUint8Array(rm));
  }

  async mkdir(sessionId: number, targetDir: string): Promise<sliverpb.Mkdir> {
    const mkdir: string = await this._ipc.request('rpc_mkdir', JSON.stringify({
      sessionId: sessionId,
      targetDir: targetDir,
    }));
    return sliverpb.Mkdir.deserializeBinary(Base64.toUint8Array(mkdir));
  }

  async download(sessionId: number, target: string): Promise<Uint8Array> {
    const data: string = await this._ipc.request('rpc_download', JSON.stringify({
      sessionId: sessionId,
      target: target,
    }));
    return Base64.toUint8Array(data);
  }

  async upload(sessionId: number, path: string): Promise<sliverpb.Upload[]> {
    const uploads: string[] = await this._ipc.request('rpc_upload', JSON.stringify({
      sessionId: sessionId,
      path: path,
    }));
    return uploads.map(upload => sliverpb.Upload.deserializeBinary(Base64.toUint8Array(upload)));
  }

  async ifconfig(sessionId: number): Promise<sliverpb.Ifconfig> {
    const ifconfig: string = await this._ipc.request('rpc_ifconfig', JSON.stringify({
      sessionId: sessionId,
    }));
    return sliverpb.Ifconfig.deserializeBinary(Base64.toUint8Array(ifconfig));
  }

  async execute(sessionId: number, exe: string, args: string[], output: boolean = true): Promise<sliverpb.Execute> {
    const executed: string = await this._ipc.request('rpc_execute', JSON.stringify({
      sessionId: sessionId,
      exe: exe,
      args: args,
      output: output,
    }));
    return sliverpb.Execute.deserializeBinary(Base64.toUint8Array(executed));
  }

  async executeAssembly(sessionId: number, libraryName: string, libraryId: string, args: string, process: string, amsi: boolean, etw: boolean): Promise<sliverpb.ExecuteAssembly> {
    const executed: string = await this._ipc.request('rpc_executeAssembly', JSON.stringify({
      sessionId: sessionId,
      libraryName: libraryName,
      libraryId: libraryId,
      args: args,
      process: process,
      amsi: amsi,
      etw: etw,
    }));
    return sliverpb.ExecuteAssembly.deserializeBinary(Base64.toUint8Array(executed));
  }

}
