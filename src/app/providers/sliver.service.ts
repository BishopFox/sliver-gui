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

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb'; // Protobuf


@Injectable({
  providedIn: 'root'
})
export class SliverService extends ProtobufService {

  constructor(private _ipc: IPCService) {
    super();
  }

  async sessions(): Promise<clientpb.Sessions> {

    return null;
  }

  async sessionById(id: number): Promise<clientpb.Session> {

    return Promise.reject(`No session with id '${id}'`);
  }

  async sliverBuilds(): Promise<clientpb.ImplantBuilds> {

    return null;
  }

  async canaries(): Promise<clientpb.Canaries> {

    return null;
  }

  async generate(config: clientpb.ImplantConfig): Promise<clientpb.Generate> {

    return null;
  }

  async regenerate(name: string): Promise<clientpb.RegenerateReq> {
    
    return null;
  }

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
