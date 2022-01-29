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

import { Base64 } from 'js-base64';
import * as path from 'path';
import * as fs from 'fs';
import { URL } from 'url';
import { jsonSchema } from '../../ipc/json-schema';
import { isConnected } from '../../ipc/is-connected';
import { IPCHandlers } from '../../ipc/ipc';

export const LOCAL_NAMESPACE = "local";
export class LocalHandlers {
  
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
    async local_readFile(ipc: IPCHandlers, origin: string, req: any): Promise<string> {
      const execId = new URL(origin).hostname;
      const reqPath = path.resolve(req.path);
      if (!path.isAbsolute(reqPath)) {
        return Promise.reject('Unable to determine absolute path');
      }
      const permissions = await ipc.workerManager.execFileSystemAccess(execId);
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
    async local_writeFile(ipc: IPCHandlers, origin: string, req: any): Promise<void> {
      const execId = new URL(origin).hostname;
      const reqPath = path.resolve(req.path);
      if (!path.isAbsolute(reqPath)) {
        return Promise.reject('Unable to determine absolute path');
      }
      const data = Base64.toUint8Array(req.data);
      const permissions = await ipc.workerManager.execFileSystemAccess(execId);
      permissions.forEach(permission => {
        if (reqPath.startsWith(permission[0]) && permission[1]) {
          return new Promise((resolve, reject) => {
            fs.writeFile(reqPath, data, (err) => {
              err ? reject(err) : resolve(undefined);
            });
          });
        }
      });
      return Promise.reject('Permission denied');
    }

}