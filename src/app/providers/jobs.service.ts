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
import { ProtobufService } from './protobuf.service';
import { SliverPB, ClientPB } from '@rpc/pb'; // Constants
import * as clientpb from '@rpc/pb/client_pb'; // Protobuf
import * as sliverpb from '@rpc/pb/sliver_pb'; // Protobuf


@Injectable({
  providedIn: 'root'
})
export class JobsService extends ProtobufService {

  constructor(private _ipc: IPCService) {
    super();
  }

  async jobs(): Promise<clientpb.Jobs> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(ClientPB.MsgJobs);
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    return clientpb.Jobs.deserializeBinary(this.decode(resp));
  }

  async jobById(jobId: number): Promise<clientpb.Job> {
    const jobs = await this.jobs();
    const activeJobs = jobs.getActiveList();
    for (let index = 0; index < activeJobs.length; ++index) {
      if (jobId === activeJobs[index].getId()) {
        return activeJobs[index];
      }
    }
    return Promise.reject('Job not found');
  }

  async startMTLSListener(lport: number): Promise<clientpb.Job> {
    console.log(`Starting mTLS listener on port ${lport}`);
    if (lport < 1 || 65535 <= lport) {
      return Promise.reject('Invalid port number');
    }
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(ClientPB.MsgMtls);
    const mtlsReq = new clientpb.MTLSReq();
    mtlsReq.setLport(lport);
    reqEnvelope.setData(mtlsReq.serializeBinary());
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    const mtls = clientpb.MTLS.deserializeBinary(this.decode(resp));
    const job = await this.jobById(mtls.getJobid());
    return job;
  }

  async startHTTPListener(domain: string, website: string, lport: number): Promise<clientpb.Job> {
    if (lport < 1 || 65535 <= lport) {
      return Promise.reject('Invalid port number');
    }
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(ClientPB.MsgHttp);
    const httpReq = new clientpb.HTTPReq();
    httpReq.setLport(lport);
    httpReq.setDomain(domain);
    httpReq.setWebsite(website);
    reqEnvelope.setData(httpReq.serializeBinary());
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    const http = clientpb.HTTP.deserializeBinary(this.decode(resp));
    const job = await this.jobById(http.getJobid());
    return job;
  }

  async startHTTPSListener(domain: string, website: string, lport: number, acme: boolean): Promise<clientpb.Job> {
    if (lport < 1 || 65535 <= lport) {
      return Promise.reject('Invalid port number');
    }
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(ClientPB.MsgHttp);
    const httpReq = new clientpb.HTTPReq();
    httpReq.setLport(lport);
    httpReq.setDomain(domain);
    httpReq.setWebsite(website);
    httpReq.setSecure(true);
    httpReq.setAcme(acme ? true : false);
    reqEnvelope.setData(httpReq.serializeBinary());
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    const https = clientpb.HTTP.deserializeBinary(this.decode(resp));
    const job = await this.jobById(https.getJobid());
    return job;
  }

  async startDNSListener(domains: string[], canaries: boolean): Promise<clientpb.Job> {
    const reqEnvelope = new sliverpb.Envelope();
    reqEnvelope.setType(ClientPB.MsgDns);
    const dnsReq = new clientpb.DNSReq();
    dnsReq.setDomainsList(domains);
    dnsReq.setCanaries(canaries ? true : false);
    reqEnvelope.setData(dnsReq.serializeBinary());
    const resp = await this._ipc.request('rpc_request', this.encode(reqEnvelope));
    const dns = clientpb.DNS.deserializeBinary(this.decode(resp));
    const job = await this.jobById(dns.getJobid());
    return job;
  }

}
