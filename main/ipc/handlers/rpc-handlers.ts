/*
  Sliver Implant Framework
  Copyright (C) 2020  Bishop Fox
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

import { dialog } from 'electron';
import { Base64 } from 'js-base64';
import { homedir } from 'os';
import * as fs from 'fs';
import * as path from 'path';

import { IPCHandlers } from '../../ipc/ipc';
import { jsonSchema } from '../../ipc/json-schema';
import { isConnected } from '../../ipc/is-connected';
import { walk } from '../../ipc/util';
import { logger } from '../../logs';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

const MINUTE = 60;


export const RPC_NAMESPACE = "rpc";
export class RPCHandlers {

  
    // ----------
    // > RPC
    // ----------
  
    // Sessions / Implants
  
    @isConnected()
    async rpc_sessions(ipc: IPCHandlers): Promise<string[]> {
      const sessions = await ipc.client.sessions();
      return sessions.map(session => Base64.fromUint8Array(session.serializeBinary()));
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "id": { "type": "number" },
      },
      "required": ["id"],
      "additionalProperties": false,
    })
    async rpc_sessionById(ipc: IPCHandlers, req: any): Promise<string> {
      const sessionId = req.id;
      // Remember JS is *terrible* and any direct compares to NaN will
      // return false, for example `sessionId == NaN` is always false
      if (isNaN(sessionId) || sessionId <= 0) {
        return '';
      }
      const sessions = await ipc.client.sessions();
      for (let index = 0; index < sessions.length; ++index) {
        if (sessions[index].getId() === sessionId) {
          return Base64.fromUint8Array(sessions[index].serializeBinary());
        }
      }
      return '';
    }
  
    @isConnected()
    async rpc_implantBuilds(ipc: IPCHandlers): Promise<string> {
      const builds = await ipc.client.implantBuilds();
      return Base64.fromUint8Array(builds.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 1 },
      },
      "required": ["name"],
      "additionalProperties": false
    })
    async rpc_deleteImplantBuild(ipc: IPCHandlers, req: any): Promise<void> {
      return ipc.client.deleteImplantBuild(req.name);
    }
  
    @isConnected()
    async rpc_canaries(ipc: IPCHandlers): Promise<string[]> {
      const canaries = await ipc.client.canaries();
      return canaries.map(canary => Base64.fromUint8Array(canary.serializeBinary()));
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "config": { "type": "string", "minLength": 1 },
      },
      "required": ["config"],
      "additionalProperties": false
    })
    async rpc_generate(ipc: IPCHandlers, req: any): Promise<string> {
      const config = clientpb.ImplantConfig.deserializeBinary(Base64.toUint8Array(req.config));
      const generated = await ipc.client.generate(config, 120 * MINUTE);
      return Base64.fromUint8Array(generated.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 1 },
      },
      "required": ["name"],
      "additionalProperties": false,
    })
    async rpc_regenerate(ipc: IPCHandlers, req: any): Promise<string> {
      const regenerated = await ipc.client.regenerate(req.name);
      return Base64.fromUint8Array(regenerated.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "profile": {"type": "string", "minLength": 1},
      },
      "required": ["profile"],
      "additionalProperties": false
    })
    async rpc_saveImplantProfile(ipc: IPCHandlers, req: any): Promise<string> {
      const profile = clientpb.ImplantProfile.deserializeBinary(Base64.toUint8Array(req.profile));
      const savedProfile = await ipc.client.saveImplantProfile(profile);
      return Base64.fromUint8Array(savedProfile.serializeBinary());
    }
  
    @isConnected()
    async rpc_implantProfiles(ipc: IPCHandlers): Promise<string[]> {
      const profiles = await ipc.client.implantProfiles();
      return profiles.map(profile => Base64.fromUint8Array(profile.serializeBinary()));
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 1 },
      },
      "required": ["name"],
      "additionalProperties": false
    })
    async rpc_deleteImplantProfile(ipc: IPCHandlers, req: any): Promise<void> {
      return ipc.client.deleteImplantProfile(req.name);
    }
  
    // Session Interaction
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "tunnelIpcId": { "type": "string", "minLength": 1 },
        "sessionId": { "type": "number" },
        "path": { "type": "string" },
        "pty": { "type": "boolean" }
      },
      "required": ["tunnelIpcId", "sessionId", "path", "pty"],
      "additionalProperties": false,
    })
    async rpc_shell(ipc: IPCHandlers, req: any): Promise<void> {
      const interact =  await ipc.client.interact(req.sessionId);
      const tunnel = await interact.shell(req.path, req.pty);
      ipc.windowManager.tunnels.set(req.tunnelIpcId, tunnel);
  
      // stdout
      const tunSub = tunnel.stdout.subscribe(data => {
        logger.silly(`Tunnel (${req.tunnelIpcId}) stdout: ${data}`);
        ipc.windowManager.send('tunnel-incoming', JSON.stringify({
          tunnelIpcId: req.tunnelIpcId,
          data: Base64.fromUint8Array(data)
        }), true);
      }, (err) => {
        // on error
        logger.error(`Tunnel error (ipc: ${req.tunnelIpcId}) ${err}`);
      }, () => {
        // on complete
        logger.debug(`Closing tunnel (ipc: ${req.tunnelIpcId})`);
        if (ipc.windowManager.tunnels.has(req.tunnelIpcId)) {
          ipc.windowManager.tunnels.delete(req.tunnelIpcId);
        }
        tunSub?.unsubscribe();
      });
  
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "sessionId": { "type": "number" }
      },
      "required": ["sessionId"],
      "additionalProperties": false,
    })
    async rpc_ps(ipc: IPCHandlers, req: any): Promise<string[]> {
      const session = await ipc.client.interact(req.sessionId);
      const ps = await session.ps();
      return ps.map(p => Base64.fromUint8Array(p.serializeBinary()));
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "sessionId": { "type": "number" },
        "targetDir": { "type": "string" },
      },
      "required": ["sessionId"],
      "additionalProperties": false,
    })
    async rpc_ls(ipc: IPCHandlers, req: any): Promise<string> {
      const session = await ipc.client.interact(req.sessionId);
      const ls = await session.ls(req.targetDir);
      return Base64.fromUint8Array(ls.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "sessionId": { "type": "number" },
        "targetDir": { "type": "string" },
      },
      "required": ["sessionId"],
      "additionalProperties": false,
    })
    async rpc_cd(ipc: IPCHandlers, req: any): Promise<string> {
      const session = await ipc.client.interact(req.sessionId);
      const cd = await session.cd(req.targetDir);
      return Base64.fromUint8Array(cd.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "sessionId": { "type": "number" },
        "target": { "type": "string" },
      },
      "required": ["sessionId"],
      "additionalProperties": false,
    })
    async rpc_rm(ipc: IPCHandlers, req: any): Promise<string> {
      const session = await ipc.client.interact(req.sessionId);
      const rm = await session.rm(req.target);
      return Base64.fromUint8Array(rm.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "sessionId": { "type": "number" },
        "targetDir": { "type": "string" },
      },
      "required": ["sessionId"],
      "additionalProperties": false,
    })
    async rpc_mkdir(ipc: IPCHandlers, req: any): Promise<string> {
      const session = await ipc.client.interact(req.sessionId);
      const mkdir = await session.mkdir(req.targetDir);
      return Base64.fromUint8Array(mkdir.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "sessionId": { "type": "number" },
        "target": { "type": "string" },
      },
      "required": ["sessionId"],
      "additionalProperties": false,
    })
    async rpc_download(ipc: IPCHandlers, req: any): Promise<string> {
      const session = await ipc.client.interact(req.sessionId);
      const data = await session.download(req.target);
      return Base64.fromUint8Array(data);
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "sessionId": { "type": "number" },
        "data": { "type": "string" },
        "path": { "type": "string" },
      },
      "required": ["sessionId"],
      "additionalProperties": false,
    })
    async rpc_upload(ipc: IPCHandlers, req: any): Promise<string> {
      const session = await ipc.client.interact(req.sessionId);
      const data = Base64.toUint8Array(req.data);
      const upload = await session.upload(req.path, Buffer.from(data));
      return Base64.fromUint8Array(upload.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "sessionId": { "type": "number" },
      },
      "required": ["sessionId"],
      "additionalProperties": false,
    })
    async rpc_ifconfig(ipc: IPCHandlers, req: any): Promise<string> {
      const session = await ipc.client.interact(req.sessionId);
      const ifconfig = await session.ifconfig();
      return Base64.fromUint8Array(ifconfig.serializeBinary());
    }
  
    // Websites
    @isConnected()
    async rpc_websites(ipc: IPCHandlers, _: any): Promise<string[]> {
      const websites = await ipc.client.websites();
      return websites.map(web => Base64.fromUint8Array(web.serializeBinary()));
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 1 },
      },
      "required": ["name"],
      "additionalProperties": false,
    })
    async rpc_addWebsite(ipc: IPCHandlers, req: any): Promise<string> {
      const contents = new Map<string, clientpb.WebContent>();
      const website = await ipc.client.websiteAddContent(req.name, contents);
      return Base64.fromUint8Array(website.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 1 },
      },
      "required": ["name"],
      "additionalProperties": false,
    })
    async rpc_website(ipc: IPCHandlers, req: any): Promise<string> {
      const website = await ipc.client.website(req.name);
      return Base64.fromUint8Array(website.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "contentType": {"type": "string", "minLength": 1 },
        "path": { "type": "string", "minLength": 1 },
      },
      "required": ["name", "path", "contentType"],
      "additionalProperties": false,
    })
    async rpc_addWebContentFromFile(ipc: IPCHandlers, req: any): Promise<string> {
      const openDialog = await dialog.showOpenDialog({
        title: "Add Web Content",
        message: "Upload file to website",
        defaultPath: path.join(homedir()),
        properties: ["openFile", "showHiddenFiles", "dontAddToRecent"],
      });
      if (openDialog.canceled || openDialog.filePaths.length < 1) {
        return Promise.reject('User cancel');
      }
  
      const contents = new Map<string, clientpb.WebContent>();
      return new Promise((resolve, reject) => {
        fs.readFile(openDialog.filePaths[0], async (err, data: Buffer) => {
          if (err) {
            return reject(err);
          }
          const webContent = new clientpb.WebContent();
          webContent.setContenttype(req.contentType);
          webContent.setContent(data);
          webContent.setPath(req.path);
          contents.set(req.path, webContent);
          logger.debug(contents);
          const website = await ipc.client.websiteAddContent(req.name, contents);
          resolve(Base64.fromUint8Array(website.serializeBinary()));
        });
      });
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "path": { "type": "string", "minLength": 1 },
      },
      "required": ["name", "path"],
      "additionalProperties": false,
    })
    async rpc_addWebContentFromDirectory(ipc: IPCHandlers, req: any): Promise<string> {
      const openDialog = await dialog.showOpenDialog({
        title: "Add Web Content",
        message: "Upload directory to website",
        defaultPath: path.join(homedir()),
        properties: ["openDirectory", "showHiddenFiles", "dontAddToRecent"],
      });
      if (openDialog.canceled || openDialog.filePaths.length < 1) {
        return '';
      }
  
      const contents = new Map<string, clientpb.WebContent>();
      const rootPath = openDialog.filePaths[0];
      for await (const fPath of walk(rootPath)) {
        let contentPath = path.join(req.path, fPath).replace(rootPath, "");
        if (!contentPath.startsWith("/")) {
          contentPath = `/${contentPath}`;
        }
        logger.debug(`AddWebContentFromDirectory: ${contentPath}`);
        const data: Buffer = await fs.promises.readFile(fPath);
        const webContent = new clientpb.WebContent();
        webContent.setPath(contentPath);
        webContent.setContent(data);
        contents.set(contentPath, webContent);
      }
      const website = await ipc.client.websiteAddContent(req.name, contents);
      return Base64.fromUint8Array(website.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 1 },
      },
      "required": ["name"],
      "additionalProperties": false,
    })
    async rpc_removeWebsite(ipc: IPCHandlers, req: any): Promise<void> {
      return ipc.client.websiteRemove(req.name);
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "paths": {
          "type": "array",
          "uniqueItems": true,
          "additionalItems": false,
          "items": { "type": "string", "minLength": 1 },
        },
      },
      "required": ["name"],
      "additionalProperties": false,
    })
    async rpc_removeWebContents(ipc: IPCHandlers, req: any): Promise<string> {
      const website = await ipc.client.websiteRemoveContent(req.name, req.paths);
      return Base64.fromUint8Array(website.serializeBinary());
    }
  
    // Jobs
    @isConnected()
    async rpc_jobs(ipc: IPCHandlers): Promise<string[]> {
      const jobs = await ipc.client.jobs();
      return jobs.map(job => Base64.fromUint8Array(job.serializeBinary()));
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "id": { "type": "number" },
      },
      "required": ["id"],
      "additionalProperties": false,
    })
    async rpc_jobById(ipc: IPCHandlers, req: any): Promise<string> {
      const jobId = req.id;
      if (isNaN(jobId) || jobId <= 0) {
        return Promise.reject('Invalid Job ID');
      }
      const jobs = await ipc.client.jobs();
      for (let index = 0; index < jobs.length; ++index) {
        if (jobs[index].getId() === jobId) {
          return Base64.fromUint8Array(jobs[index].serializeBinary());
        }
      }
      return Promise.reject('Invalid Job ID');
    }
    
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "id": { "type": "number" },
      },
      "required": ["id"],
      "additionalProperties": false,
    })
    async rpc_killJob(ipc: IPCHandlers, req: any): Promise<string> {
      const jobId = req.id;
      if (isNaN(jobId) || jobId <= 0) {
        return Promise.reject('Invalid Job ID');
      }
      const killedJob = await ipc.client.killJob(jobId);
      return Base64.fromUint8Array(killedJob.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "host": { "type": "string" },
        "port": { "type": "number" },
      },
      "required": ["host", "port"],
      "additionalProperties": false,
    })
    async rpc_startMTLSListener(ipc: IPCHandlers, req: any): Promise<string> {
      const job = await ipc.client.startMTLSListener(req.host, req.port);
      return Base64.fromUint8Array(job.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "host": { "type": "string" },
        "domain": { "type": "string" },
        "website": { "type": "string" },
        "port": { "type": "number" },
      },
      "required": ["host", "port"],
      "additionalProperties": false,
    })
    async rpc_startHTTPListener(ipc: IPCHandlers, req: any): Promise<string> {
      const job = await ipc.client.startHTTPListener(req.domain, req.host, req.port, req.website);
      return Base64.fromUint8Array(job.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "host": { "type": "string" },
        "domain": { "type": "string" },
        "website": { "type": "string" },
        "acme": { "type": "boolean" },
        "port": { "type": "number" },
        "cert": { "type": "string" },
        "key": { "type": "string" }
      },
      "required": ["host", "port"],
      "additionalProperties": false,
    })
    async rpc_startHTTPSListener(ipc: IPCHandlers, req: any): Promise<string> {
      const cert = req.cert ? Buffer.from(Base64.toUint8Array(req.cert)) : undefined;
      const key = req.key ? Buffer.from(Base64.toUint8Array(req.key)) : undefined;
      const job = await ipc.client.startHTTPSListener(req.domain, req.host, req.port, req.acme, req.website, cert, key);
      return Base64.fromUint8Array(job.serializeBinary());
    }
  
    @isConnected()
    @jsonSchema({
      "type": "object",
      "properties": {
        "domains": {
          "type": "array",
          "items": { "type": "string" },
          "additionalItems": false,
        },
        "canaries": { "type": "boolean" },
        "host": { "type": "string" },
        "port": { "type": "number" },
      },
      "required": ["host", "port"],
      "additionalProperties": false,
    })
    async rpc_startDNSListener(ipc: IPCHandlers, req: any): Promise<string> {
      const job = await ipc.client.startDNSListener(req.domains, req.canaries, req.host, req.port);
      return Base64.fromUint8Array(job.serializeBinary());
    }


}