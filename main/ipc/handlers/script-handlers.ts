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

import { jsonSchema } from '../../ipc/json-schema';
import { isConnected } from '../../ipc/is-connected';
import { IPCHandlers } from '../../ipc/ipc';


export const SCRIPT_NAMESPACE = "script";
export class ScriptHandlers {

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
  async script_execute(ipc: IPCHandlers, req: any): Promise<string> {
    const execId = await ipc.workerManager.startScriptExecution(req.id, req.options);
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
  async script_stop(ipc: IPCHandlers, req: any): Promise<void> {
    await ipc.workerManager.stopScriptExecutionById(req.id);
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
  async script_new(ipc: IPCHandlers, req: any): Promise<string> {
    const scriptId = await ipc.workerManager.newScript(req.name, req.code);
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
  async script_update(ipc: IPCHandlers, req: any): Promise<void> {
    await ipc.workerManager.updateScript(req.id, req.name, req.code);
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
  async script_load(ipc: IPCHandlers, req: any): Promise<string> {
    const script = await ipc.workerManager.loadScript(req.id);
    return JSON.stringify({
      id: script.id,
      name: script.name,
      code: script.code
    });
  }

  @isConnected()
  async script_list(ipc: IPCHandlers): Promise<string> {
    const scripts = await ipc.workerManager.scripts();
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
  async script_remove(ipc: IPCHandlers, req: any) {
    await ipc.workerManager.removeScript(req.id);
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
  async script_addFileSystemAccess(ipc: IPCHandlers, req: any): Promise<void> {
    return ipc.workerManager.addFileSystemAccess(req.id);
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
  async script_removeFileSystemAccess(ipc: IPCHandlers, req: any): Promise<void> {
    return ipc.workerManager.removeFileSystemAccess(req.id, req.path);
  }

}