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
*/

import { Injectable } from '@angular/core';
import { IPCService } from './ipc.service';
import { Base64 } from 'js-base64';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';


@Injectable({
  providedIn: 'root'
})
export class JobsService {

  constructor(private _ipc: IPCService) { }

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

  async killJob(jobId: number): Promise<clientpb.KillJob> {
    let kill: string = await this._ipc.request('rpc_killJob', JSON.stringify({
      id: jobId
    }));
    return clientpb.KillJob.deserializeBinary(Base64.toUint8Array(kill));
  }

  async websites(): Promise<clientpb.Website[]> {
    const websites = await this._ipc.request('rpc_websites');
    return websites.map(web => clientpb.Website.deserializeBinary(Base64.toUint8Array(web)));
  }

  async websiteByName(name: string): Promise<clientpb.Website> {
    const website: string = await this._ipc.request('rpc_website', JSON.stringify({
      name: name,
    }));
    return website.length ? clientpb.Website.deserializeBinary(Base64.toUint8Array(website)) : null;
  }

  async addWebsite(name: string): Promise<clientpb.Website> {
    const website: string = await this._ipc.request('rpc_addWebsite', JSON.stringify({
      name: name,
    }));
    return website.length ? clientpb.Website.deserializeBinary(Base64.toUint8Array(website)) : null;
  }

  async websiteAddContentFromFile(name: string, path: string, contentType: string): Promise<clientpb.Website> {
    const website = await this._ipc.request('rpc_addWebContentFromFile', JSON.stringify({
      name: name,
      path: path,
      contentType: contentType,
    }));
    return website.length ? clientpb.Website.deserializeBinary(Base64.toUint8Array(website)) : null;
  }

  async websiteAddContentFromDirectory(name: string, path: string): Promise<clientpb.Website> {
    const website = await this._ipc.request('rpc_addWebContentFromDirectory', JSON.stringify({
      name: name,
      path: path,
    }));
    return website.length ? clientpb.Website.deserializeBinary(Base64.toUint8Array(website)) : null;
  }

  async removeWebsite(name: string): Promise<void> {
    await this._ipc.request('rpc_removeWebsite', JSON.stringify({
      name: name,
    }));
  }

  async startMTLSListener(host: string, port: number, persistent = false): Promise<clientpb.Job> {
    console.log(`Starting mTLS listener on port ${port}`);
    if (this.isValidPort(port)) {
      return Promise.reject('Invalid port number');
    }
    let job: string = await this._ipc.request('rpc_startMTLSListener', JSON.stringify({
      host: host,
      port: port,
      persistent: persistent,
    }));
    return clientpb.Job.deserializeBinary(Base64.toUint8Array(job));
  }

  async startHTTPListener(domain: string, website: string, host: string, port: number, persistent = false): Promise<clientpb.Job> {
    if (this.isValidPort(port)) {
      return Promise.reject('Invalid port number');
    }
    let job = await this._ipc.request('rpc_startHTTPListener', JSON.stringify({
      host: host,
      port: port,
      domain: domain,
      website: website,
      persistent: persistent,
    }));
    return clientpb.Job.deserializeBinary(Base64.toUint8Array(job));
  }

  async startHTTPSListener(domain: string, website: string,  acme: boolean, cert: string, key: string, 
                            host: string, port: number, persistent = false): Promise<clientpb.Job>
  {
    if (this.isValidPort(port)) {
      return Promise.reject('Invalid port number');
    }
    let job = await this._ipc.request('rpc_startHTTPSListener', JSON.stringify({
      host: host,
      port: port,
      domain: domain,
      website: website,
      acme: acme,
      cert: cert,
      key: key,
      persistent: persistent,
    }));
    return clientpb.Job.deserializeBinary(Base64.toUint8Array(job));
  }

  async startDNSListener(domains: string[], enableCanaries: boolean, host: string, port: number, persistent = false): Promise<clientpb.Job> {
    if (!this.isValidPort(port)) {
      return Promise.reject('Invalid port number');
    }
    let job = await this._ipc.request('rpc_startDNSListener', JSON.stringify({
      host: host,
      port: port,
      domains: domains,
      canaries: enableCanaries,
      persistent: persistent,
    }));
    return clientpb.Job.deserializeBinary(Base64.toUint8Array(job));
  }

  async startWGListener(port: number, nport: number, keyPort: number, persistent = false): Promise<clientpb.Job> {
    if (!this.isValidPort(port)) {
      return Promise.reject('Invalid port number');
    }
    if (!this.isValidPort(nport)) {
      return Promise.reject('Invalid nport number');
    }
    if (!this.isValidPort(keyPort)) {
      return Promise.reject('Invalid key port number');
    }
    let job = await this._ipc.request('rpc_startWGListener', JSON.stringify({
      port: port,
      nport: nport,
      key_port: keyPort,
      persistent: persistent,
    }));
    return clientpb.Job.deserializeBinary(Base64.toUint8Array(job));
  }

  private isValidPort(port: number): boolean {
    if (port < 1 || 65535 <= port) {
      return false;
    }
    return true;
  }

}
