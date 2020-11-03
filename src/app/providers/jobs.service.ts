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
import { IPCService } from './ipc.service';
import { Base64 } from 'js-base64';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb'; // Protobuf


@Injectable({
  providedIn: 'root'
})
export class JobsService {

  constructor(private _ipc: IPCService) {

  }

  async jobs(): Promise<clientpb.Job[]> {
    let jobs: string[] = await this._ipc.request('rpc_jobs');
    return jobs.map(job => clientpb.Job.deserializeBinary(Base64.toUint8Array(job)));
  }

  async jobById(jobId: number): Promise<clientpb.Job> {
    let job: string = await this._ipc.request('rpc_jobById', JSON.stringify({
      id: jobId
    }));
    return clientpb.Job.deserializeBinary(Base64.toUint8Array(job));
  }

  async startMTLSListener(host: string, port: number): Promise<clientpb.Job> {
    console.log(`Starting mTLS listener on port ${port}`);
    if (port < 1 || 65535 <= port) {
      return Promise.reject('Invalid port number');
    }
    let job: string = await this._ipc.request('rpc_startMTLSListener', JSON.stringify({
      host: host,
      port: port
    }));
    return clientpb.Job.deserializeBinary(Base64.toUint8Array(job));
  }

  async startHTTPListener(domain: string, website: string, host: string, port: number): Promise<clientpb.Job> {
    if (port < 1 || 65535 <= port) {
      return Promise.reject('Invalid port number');
    }
    let job = await this._ipc.request('rpc_startHTTPListener', JSON.stringify({
      host: host,
      port: port,
      domain: domain,
      website: website,
    }));
    return clientpb.Job.deserializeBinary(Base64.toUint8Array(job));
  }

  async startHTTPSListener(domain: string, website: string,  acme: boolean, host: string, port: number): Promise<clientpb.Job> {
    if (port < 1 || 65535 <= port) {
      return Promise.reject('Invalid port number');
    }
    let job = await this._ipc.request('rpc_startHTTPListener', JSON.stringify({
      host: host,
      port: port,
      domain: domain,
      website: website,
      acme: acme,
      cert: null, // TODO: Implement support for cert/key files
      key: null,
    }));
    return clientpb.Job.deserializeBinary(Base64.toUint8Array(job));
  }

  async startDNSListener(domains: string[], enableCanaries: boolean, host: string, port: number): Promise<clientpb.Job> {
    if (port < 1 || 65535 <= port) {
      return Promise.reject('Invalid port number');
    }
    let job = await this._ipc.request('rpc_startDNSListener', JSON.stringify({
      host: host,
      port: port,
      domains: domains,
      canaries: enableCanaries,
    }));
    return clientpb.Job.deserializeBinary(Base64.toUint8Array(job));
  }

}
