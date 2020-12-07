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

Maps IPC calls to RPC calls, and provides other local operations such as
listing/selecting configs to the sandboxed code.

*/

import {
  app, ipcMain, dialog, FileFilter, BrowserWindow, IpcMainEvent, nativeTheme
} from 'electron';
import { homedir } from 'os';
import { Base64 } from 'js-base64';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';
import * as log4js from 'log4js';
import { SliverClient, SliverClientConfig } from 'sliver-script';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import { walk, downloadSliverAsset } from './util';
import { jsonSchema } from './json-schema';
import { isConnected } from './is-connected';
import { getLocalesJSON, getClientDir, getCurrentLocale, setLocaleSync } from '../locale';
import { WindowManager, Progress } from '../windows/window-manager';
import { WorkerManager } from '../workers/worker-manager';


const logger = log4js.getLogger(__filename);
const DEFAULT_SERVER_URL = 'https://api.github.com/repos/BishopFox/sliver/releases/latest';
const CONFIG_DIR = path.join(getClientDir(), 'configs');
const SETTINGS_PATH = path.join(getClientDir(), 'gui-settings.json');
const MINUTE = 60;

export interface SaveFileReq {
  title: string;
  message: string;
  filename: string;
  data: string;
}

export interface ReadFileReq {
  title: string;
  message: string;
  openDirectory: boolean;
  multiSelections: boolean;
  filters: FileFilter[] | null; // { filters: [ { name: 'Custom File Type', extensions: ['as'] } ] }
}

export interface IPCMessage {
  id: number;
  type: string;
  method: string; // Identifies the target method and in the response if the method call was a success/error
  data: string;
}

async function makeConfigDir(): Promise<NodeJS.ErrnoException | null> {
  return new Promise((resolve, reject) => {
    const dirOptions = {
      mode: 0o700,
      recursive: true
    };
    fs.mkdir(CONFIG_DIR, dirOptions, (err) => {
      err ? reject(err) : resolve(null);
    });
  });
}


/*
 - IPC Methods used to start/interact with the RPCClient
  
  If you're wondering why each method has a `self` argument, it's because TypeScript
  inherits the `this` keyword from JavaScript, and JavaScript is a *fucking stupid*
  language. Because of the indirection in the calls to these methods, there's no way
  to reference the object instance, and no bind() / call() don't work in this case,
  because again JavaScript is *fucking awful* --why anyone likes this shitty fucking
  programming language is beyond human comprehension.
*/
export class IPCHandlers {

  public client: SliverClient;
  private _windowManager: WindowManager;
  private _workerManager: WorkerManager;

  constructor(windowManager: WindowManager) {
    this._windowManager = windowManager;
    this._workerManager = windowManager.workerManager;
  }

  // ----------
  // > Script
  // ----------
  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "options": {
        "type": "object",
        "properties": {
          "siaf": { "type": "boolean" },
        },
        "additionalProperties": false,
      },
    },
    "required": ["id", "options"],
    "additionalProperties": false,
  })
  async script_execute(self: IPCHandlers, req: any): Promise<string> {
    const execId = await self._workerManager.startScriptExecution(req.id, req.options);
    return execId;
  }

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "id": { "type": "string" },
    },
    "required": ["id"],
    "additionalProperties": false,
  })
  async script_stop(self: IPCHandlers, req: any): Promise<void> {
    await self._workerManager.stopScriptExecutionById(req.id);
  }

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "code": { "type": "string" },
    },
    "required": ["name", "code"],
    "additionalProperties": false,
  })
  async script_new(self: IPCHandlers, req: any): Promise<string> {
    const scriptId = await self._workerManager.newScript(req.name, req.code);
    return scriptId;
  }

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "name": { "type": "string" },
      "code": { "type": "string" },
    },
    "required": ["id", "name", "code"],
    "additionalProperties": false,
  })
  async script_update(self: IPCHandlers, req: any): Promise<void> {
    await self._workerManager.updateScript(req.id, req.name, req.code);
  }

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "id": { "type": "string" },
    },
    "required": ["id"],
    "additionalProperties": false,
  })
  async script_load(self: IPCHandlers, req: any): Promise<string> {
    const script = await self._workerManager.loadScript(req.id);
    return JSON.stringify({
      id: script.id,
      name: script.name,
      code: script.code
    });
  }

  @isConnected()
  async script_list(self: IPCHandlers): Promise<string> {
    const scripts = await self._workerManager.scripts();
    return JSON.stringify(scripts);
  }

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "id": { "type": "string" },
    },
    "required": ["id"],
    "additionalProperties": false,
  })
  async script_remove(self: IPCHandlers, req: any) {
    await self._workerManager.removeScript(req.id);
  }

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "id": { "type": "string" },
    },
    "required": ["id"],
    "additionalProperties": false,
  })
  async script_addFileSystemAccess(self: IPCHandlers, req: any): Promise<void> {
    return self._workerManager.addFileSystemAccess(req.id);
  }

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "path": { "type": "string" },
    },
    "required": ["id", "path"],
    "additionalProperties": false,
  })
  async script_removeFileSystemAccess(self: IPCHandlers, req: any): Promise<void> {
    return self._workerManager.removeFileSystemAccess(req.id, req.path);
  }

  // ----------
  // > Local
  // ----------

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "path": { "type": "string" },
    },
    "required": ["path"],
    "additionalProperties": false,
  })
  async local_readFile(self: IPCHandlers, origin: string, req: any): Promise<string> {
    const execId = new URL(origin).hostname;
    const reqPath = path.resolve(req.path);
    if (!path.isAbsolute(reqPath)) {
      return Promise.reject('Unable to determine absolute path');
    }
    const permissions = await self._workerManager.execFileSystemAccess(execId);
    permissions.forEach(permission => {
      if (reqPath.startsWith(permission[0])) {
        return new Promise((resolve, reject) => {
          fs.readFile(reqPath, (err, data: Buffer) => {
            err ? reject(err) : resolve(Base64.fromUint8Array(data));
          });
        });
      }
    });
    return Promise.reject('Permission denied');
  }

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "data": { "type": "string" },
    },
    "required": ["path", "data"],
    "additionalProperties": false,
  })
  async local_writeFile(self: IPCHandlers, origin: string, req: any): Promise<void> {
    const execId = new URL(origin).hostname;
    const reqPath = path.resolve(req.path);
    if (!path.isAbsolute(reqPath)) {
      return Promise.reject('Unable to determine absolute path');
    }
    const data = Base64.toUint8Array(req.data);
    const permissions = await self._workerManager.execFileSystemAccess(execId);
    permissions.forEach(permission => {
      if (reqPath.startsWith(permission[0]) && permission[1]) {
        return new Promise((resolve, reject) => {
          fs.writeFile(reqPath, data, (err) => {
            err ? reject(err) : resolve();
          });
        });
      }
    });
    return Promise.reject('Permission denied');
  }

  // ----------
  // > RPC
  // ----------

  // Sessions / Implants

  @isConnected()
  async rpc_sessions(self: IPCHandlers): Promise<string[]> {
    const sessions = await self.client.sessions();
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
  async rpc_sessionById(self: IPCHandlers, req: any): Promise<string> {
    const sessionId = req.id;
    // Remember JS is *terrible* and any direct compares to NaN will
    // return false, for example `sessionId == NaN` is always false
    if (isNaN(sessionId) || sessionId <= 0) {
      return '';
    }
    const sessions = await self.client.sessions();
    for (let index = 0; index < sessions.length; ++index) {
      if (sessions[index].getId() === sessionId) {
        return Base64.fromUint8Array(sessions[index].serializeBinary());
      }
    }
    return '';
  }

  @isConnected()
  async rpc_implantBuilds(self: IPCHandlers): Promise<string> {
    const builds = await self.client.implantBuilds();
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
  async rpc_deleteImplantBuild(self: IPCHandlers, req: any): Promise<void> {
    return self.client.deleteImplantBuild(req.name);
  }

  @isConnected()
  async rpc_canaries(self: IPCHandlers): Promise<string[]> {
    const canaries = await self.client.canaries();
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
  async rpc_generate(self: IPCHandlers, req: any): Promise<string> {
    const config = clientpb.ImplantConfig.deserializeBinary(Base64.toUint8Array(req.config));
    const generated = await self.client.generate(config, 120 * MINUTE);
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
  async rpc_regenerate(self: IPCHandlers, req: any): Promise<string> {
    const regenerated = await self.client.regenerate(req.name);
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
  async rpc_saveImplantProfile(self: IPCHandlers, req: any): Promise<string> {
    const profile = clientpb.ImplantProfile.deserializeBinary(Base64.toUint8Array(req.profile));
    const savedProfile = await self.client.saveImplantProfile(profile);
    return Base64.fromUint8Array(savedProfile.serializeBinary());
  }

  @isConnected()
  async rpc_implantProfiles(self: IPCHandlers): Promise<string[]> {
    const profiles = await self.client.implantProfiles();
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
  async rpc_deleteImplantProfile(self: IPCHandlers, req: any): Promise<void> {
    return self.client.deleteImplantProfile(req.name);
  }

  // Session Interaction
  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "sessionId": { "type": "number" }
    },
    "required": ["sessionId"],
    "additionalProperties": false,
  })
  async rpc_ps(self: IPCHandlers, req: any): Promise<string[]> {
    const session = await self.client.interact(req.sessionId);
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
  async rpc_ls(self: IPCHandlers, req: any): Promise<string> {
    const session = await self.client.interact(req.sessionId);
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
  async rpc_cd(self: IPCHandlers, req: any): Promise<string> {
    const session = await self.client.interact(req.sessionId);
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
  async rpc_rm(self: IPCHandlers, req: any): Promise<string> {
    const session = await self.client.interact(req.sessionId);
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
  async rpc_mkdir(self: IPCHandlers, req: any): Promise<string> {
    const session = await self.client.interact(req.sessionId);
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
  async rpc_download(self: IPCHandlers, req: any): Promise<string> {
    const session = await self.client.interact(req.sessionId);
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
  async rpc_upload(self: IPCHandlers, req: any): Promise<string> {
    const session = await self.client.interact(req.sessionId);
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
  async rpc_ifconfig(self: IPCHandlers, req: any): Promise<string> {
    const session = await self.client.interact(req.sessionId);
    const ifconfig = await session.ifconfig();
    return Base64.fromUint8Array(ifconfig.serializeBinary());
  }

  // Websites
  @isConnected()
  async rpc_websites(self: IPCHandlers, _: any): Promise<string[]> {
    const websites = await self.client.websites();
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
  async rpc_addWebsite(self: IPCHandlers, req: any): Promise<string> {
    const contents = new Map<string, clientpb.WebContent>();
    const website = await self.client.websiteAddContent(req.name, contents);
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
  async rpc_website(self: IPCHandlers, req: any): Promise<string> {
    const website = await self.client.website(req.name);
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
  async rpc_addWebContentFromFile(self: IPCHandlers, req: any): Promise<string> {
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
        const website = await self.client.websiteAddContent(req.name, contents);
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
  async rpc_addWebContentFromDirectory(self: IPCHandlers, req: any): Promise<string> {
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
    const website = await self.client.websiteAddContent(req.name, contents);
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
  async rpc_removeWebsite(self: IPCHandlers, req: any): Promise<void> {
    return self.client.websiteRemove(req.name);
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
  async rpc_removeWebContents(self: IPCHandlers, req: any): Promise<string> {
    const website = await self.client.websiteRemoveContent(req.name, req.paths);
    return Base64.fromUint8Array(website.serializeBinary());
  }

  // Jobs
  @isConnected()
  async rpc_jobs(self: IPCHandlers): Promise<string[]> {
    const jobs = await self.client.jobs();
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
  async rpc_jobById(self: IPCHandlers, req: any): Promise<string> {
    const jobId = req.id;
    if (isNaN(jobId) || jobId <= 0) {
      return Promise.reject('Invalid Job ID');
    }
    const jobs = await self.client.jobs();
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
  async rpc_killJob(self: IPCHandlers, req: any): Promise<string> {
    const jobId = req.id;
    if (isNaN(jobId) || jobId <= 0) {
      return Promise.reject('Invalid Job ID');
    }
    const killedJob = await self.client.killJob(jobId);
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
  async rpc_startMTLSListener(self: IPCHandlers, req: any): Promise<string> {
    const job = await self.client.startMTLSListener(req.host, req.port);
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
  async rpc_startHTTPListener(self: IPCHandlers, req: any): Promise<string> {
    const job = await self.client.startHTTPListener(req.domain, req.host, req.port, req.website);
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
      "acme": { "type": "boolean" },
      "cert": { "type": "string" },
      "key": { "type": "string" }
    },
    "required": ["host", "port"],
    "additionalProperties": false,
  })
  async rpc_startHTTPSListener(self: IPCHandlers, req: any): Promise<string> {
    const job = await self.client.startHTTPSListener(req.domain, req.host, req.port, req.acme, req.website, req.cert, req.key);
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
  async rpc_startDNSListener(self: IPCHandlers, req: any): Promise<string> {
    const job = await self.client.startDNSListener(req.domains, req.canaries, req.host, req.port);
    return Base64.fromUint8Array(job.serializeBinary());
  }

  // ----------
  // > Config
  // ----------

  public config_list(self: IPCHandlers): Promise<string> {
    return new Promise((resolve) => {
      fs.readdir(CONFIG_DIR, (_, items) => {
        if (!fs.existsSync(CONFIG_DIR) || items === undefined) {
          return resolve(JSON.stringify([]));
        }
        const configs: SliverClientConfig[] = [];
        for (let index = 0; index < items.length; ++index) {
          const filePath = path.join(CONFIG_DIR, items[index]);
          if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
            const fileData = fs.readFileSync(filePath);
            configs.push(JSON.parse(fileData.toString('utf8')));
          }
        }
        resolve(JSON.stringify(configs));
      });
    });
  }

  @jsonSchema({
    "type": "object",
    "properties": {
      "configs": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "operator": { "type": "string", "minLength": 1 },
            "lhost": { "type": "string", "minLength": 1 },
            "lport": { "type": "number" },
            "ca_certificate": { "type": "string", "minLength": 1 },
            "certificate": { "type": "string", "minLength": 1 },
            "private_key": { "type": "string", "minLength": 1 },
          },
          "additionalProperties": false,
        },
      },
    },
    "required": ["configs"],
    "additionalProperties": false,
  })
  async config_save(self: IPCHandlers, req: any): Promise<string> {
    const configs: SliverClientConfig[] = req.configs;
    if (!fs.existsSync(CONFIG_DIR)) {
      const err = await makeConfigDir();
      if (err) {
        return Promise.reject(`Failed to create config dir: ${err}`);
      }
    }

    const fileOptions = { mode: 0o600, encoding: 'utf-8' };
    await Promise.all(configs.map((config) => {
      return new Promise((resolve) => {
        const fileName: string = uuid.v4();
        const data = JSON.stringify(config);
        fs.writeFile(path.join(CONFIG_DIR, fileName), data, fileOptions, (err) => {
          if (err) {
            logger.error(err);
          }
          resolve();
        });
      });
    }));

    return self.config_list(self);
  }

  // ----------
  // > Client
  // ----------

  @jsonSchema({
    "type": "object",
    "properties": {
      "operator": { "type": "string", "minLength": 1 },
      "lhost": { "type": "string", "minLength": 1 },
      "lport": { "type": "number" },
      "ca_certificate": { "type": "string", "minLength": 1 },
      "certificate": { "type": "string", "minLength": 1 },
      "private_key": { "type": "string", "minLength": 1 },
    },
    "required": [
      "operator", "lhost", "lport", "ca_certificate", "certificate", "private_key"
    ],
    "additionalProperties": false,
  })
  public async client_start(self: IPCHandlers, config: SliverClientConfig): Promise<string> {
    self.client = new SliverClient(config);
    await self.client.connect();
    logger.debug('Connection successful');

    // Pipe realtime events back to renderer process
    self.client.event$.subscribe((event: clientpb.Event) => {
      ipcMain.emit('push', {}, Base64.fromUint8Array(event.serializeBinary()));
    });

    return 'success';
  }

  public async client_activeConfig(self: IPCHandlers): Promise<string> {
    return self.client ? JSON.stringify(self.client.config) : '';
  }

  public async client_downloadSliverServer(self: IPCHandlers): Promise<string> {
    const downloadId = uuid.v4().toString();
    return new Promise(resolve => {
      resolve(downloadId);
      const saveTo = path.join(homedir(), 'Downloads');
      downloadSliverAsset(DEFAULT_SERVER_URL, 'server', 'linux', saveTo, (progress: Progress) => {
        self._windowManager.downloadEvents.next({
          event: downloadId,
          progress: progress,
        });
      });
    });
  }

  public async client_downloadSliverClient(self: IPCHandlers): Promise<string> {
    const downloadId = uuid.v4().toString();
    return new Promise(resolve => {
      resolve(downloadId);
      const saveTo = path.join(homedir(), 'Downloads');
      downloadSliverAsset(DEFAULT_SERVER_URL, 'client', 'linux', saveTo, (progress: Progress) => {
        self._windowManager.downloadEvents.next({
          event: downloadId,
          progress: progress,
        });
      });
    });
  }

  @jsonSchema({
    "type": "object",
    "properties": {
      "title": { "type": "string", "minLength": 1, "maxLength": 100 },
      "message": { "type": "string", "minLength": 1, "maxLength": 100 },
      "openDirectory": { "type": "boolean" },
      "multiSelection": { "type": "boolean" },
      "filter": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "extensions": {
              "type": "array",
              "items": { "type": "string" },
              "additionalItems": false,
            }
          },
          "additionalProperties": false,
        }
      }
    },
    "required": ["title", "message"],
    "additionalProperties": false,
  })
  public async client_readFile(self: IPCHandlers, readFileReq: ReadFileReq): Promise<string> {
    const dialogOptions = {
      title: readFileReq.title,
      message: readFileReq.message,
      openDirectory: readFileReq.openDirectory,
      multiSelections: readFileReq.multiSelections
    };
    const files = [];
    const open = await dialog.showOpenDialog(null, dialogOptions);
    await Promise.all(open.filePaths.map((filePath) => {
      return new Promise(async (resolve) => {
        fs.readFile(filePath, (err, data) => {
          files.push({
            filePath: filePath,
            error: err ? err.toString() : null,
            data: data ? Base64.fromUint8Array(data) : null
          });
          resolve();
        });
      });
    }));
    return JSON.stringify({ files: files });
  }

  @jsonSchema({
    "type": "object",
    "properties": {
      "title": { "type": "string", "minLength": 1, "maxLength": 100 },
      "message": { "type": "string", "minLength": 1, "maxLength": 100 },
      "filename": { "type": "string", "minLength": 1 },
      "data": { "type": "string" }
    },
    "required": ["title", "message", "filename", "data"],
    "additionalProperties": false,
  })
  public async client_saveFile(self: IPCHandlers, saveFileReq: SaveFileReq): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const dialogOptions = {
        title: saveFileReq.title,
        message: saveFileReq.message,
        defaultPath: path.join(homedir(), 'Downloads', path.basename(saveFileReq.filename)),
      };
      const save = await dialog.showSaveDialog(dialogOptions);
      logger.debug(`[save file] ${save.filePath}`);
      if (save.canceled) {
        return resolve('');  // Must return to stop execution
      }
      const fileOptions = {
        mode: 0o644,
        encoding: 'binary',
      };
      const data = Buffer.from(Base64.toUint8Array(saveFileReq.data));
      fs.writeFile(save.filePath, data, fileOptions, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.stringify({ filename: save.filePath }));
        }
      });
    });
  }

  public async client_getSettings(self: IPCHandlers): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(SETTINGS_PATH)) {
          return resolve('{}');
        }
        fs.readFile(SETTINGS_PATH, 'utf-8', (err, data) => {
          if (err) {
            return reject(err);
          }
          JSON.parse(data); // Just make sure we can parse it
          resolve(data);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // The Node process never interacts with the "settings" values, so
  // we do not validate them, aside from ensuing it's valid JSON
  async client_saveSettings(self: IPCHandlers, settings: string): Promise<string> {
    return new Promise(async (resolve, reject) => {

      if (!fs.existsSync(CONFIG_DIR)) {
        const err = await makeConfigDir();
        if (err) {
          return reject(`Failed to create config dir: ${err}`);
        }
      }

      const fileOptions = { mode: 0o600, encoding: 'utf-8' };
      try {
        JSON.parse(settings); // Just ensure it's valid JSON
        fs.writeFile(SETTINGS_PATH, settings, fileOptions, async (err) => {
          if (err) {
            reject(err);
          } else {
            const updated = await self.client_getSettings(self);
            resolve(updated);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  public async client_systemThemeIsDark(_: IPCHandlers): Promise<string> {
    return nativeTheme.shouldUseDarkColors ? 'true' : 'false';
  }

  public async client_platform(_: IPCHandlers): Promise<string> {
    return process.platform;
  }

  public async client_listLocales(self: IPCHandlers): Promise<string> {
    return JSON.stringify(getLocalesJSON());
  }

  public async client_currentLocale(self: IPCHandlers): Promise<string> {
    return getCurrentLocale();
  }

  public async client_setLocale(self: IPCHandlers, req: string): Promise<string> {
    setLocaleSync(req);
    return getCurrentLocale();
  }

  @jsonSchema({
    "type": "object",
    "properties": {
      "sessionId": { "type": "number" },
    },
    "required": ["sessionId"],
    "additionalProperties": false,
  })
  public client_sessionWindow(self: IPCHandlers, req: any) {
    self._windowManager.createSessionWindow(req.sessionId);
  }

  public client_exit(self: IPCHandlers) {
    process.on('unhandledRejection', () => { }); // STFU Node
    app.exit();
  }

}

// Dispatcher
export async function dispatchIPC(handlers: IPCHandlers, method: string, data: string): Promise<any> {
  logger.debug(`IPC Dispatch: ${method}`);

  // IPC handlers must start with "namespace_" this helps ensure we do not inadvertently
  // expose methods that we don't want exposed to the sandboxed code.
  if (['client_', 'config_', 'rpc_', 'script_'].some(prefix => method.startsWith(prefix))) {
    if (typeof handlers[method] === 'function') {
      const result: any = await handlers[method](handlers, data);
      return result;
    } else {
      return Promise.reject(`No handler for method: ${method}`);
    }
  } else {
    return Promise.reject(`Invalid method handler namespace for "${method}"`);
  }
}

// Dispatcher
export async function dispatchLocalIPC(handlers: IPCHandlers, origin: string, method: string, data: string): Promise<any> {
  logger.debug(`IPC Local Dispatch: ${method}`);
  if (['local_'].some(prefix => method.startsWith(prefix))) {
    if (typeof handlers[method] === 'function') {
      const result: any = await handlers[method](handlers, origin, data);
      return result;
    } else {
      return Promise.reject(`No local handler for method: ${method}`);
    }
  } else {
    return Promise.reject(`Invalid local method handler namespace for "${method}"`);
  }
}

export function startIPCHandlers(window: BrowserWindow, handlers: IPCHandlers) {

  ipcMain.on('ipc', async (event: IpcMainEvent, msg: IPCMessage, origin: string) => {

    // Local handlers (needs origin)
    if (msg.method.startsWith('local_')) {
      dispatchLocalIPC(handlers, origin, msg.method, msg.data).then((result: any) => {
        if (msg.id !== 0) {
          event.sender.send('ipc', {
            id: msg.id,
            type: 'response',
            method: 'success',
            data: result
          }, origin);
        }
      }).catch((err) => {
        logger.error(`[local ipc handlers](${origin}): ${err}`);
        if (msg.id !== 0) {
          event.sender.send('ipc', {
            id: msg.id,
            type: 'response',
            method: 'error',
            data: err.toString()
          }, origin);
        }
      });
    } else {

      // default handlers
      dispatchIPC(handlers, msg.method, msg.data).then((result: any) => {
        if (msg.id !== 0) {
          event.sender.send('ipc', {
            id: msg.id,
            type: 'response',
            method: 'success',
            data: result
          }, origin);
        }
      }).catch((err) => {
        logger.error(`[ipc handlers](${origin}): ${err}`);
        if (msg.id !== 0) {
          event.sender.send('ipc', {
            id: msg.id,
            type: 'response',
            method: 'error',
            data: err.toString()
          }, origin);
        }
      });
    }
  });

  // I know what you're thinking, why do we need a main<->main event emitter here,
  // can't you just send an IPC event to the renderer? The answer is no, you can't.
  ipcMain.on('push', async (event: IpcMainEvent, data: string) => {
    window.webContents.send('push', data);
  });

}
