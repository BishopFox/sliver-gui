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
import { homedir } from 'os';
import * as path from 'path';

import { jsonSchema } from '../../ipc/json-schema';
import { isConnected } from '../../ipc/is-connected';
import { IPCHandlers } from '../../ipc/ipc';


export const LIBRARY_NAMESPACE = "library";
export class LibraryHandlers {

  // ------------
  // > Libraries
  // ------------

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "libraryName": { "type": "string", "minLength": 1 },
    },
    "required": ["libraryName"],
    "additionalProperties": false,
  })
  async library_items(ipc: IPCHandlers, req: any): Promise<string[]> {
    const items = await ipc.libraryManager.getItems(req.libraryName);
    return items.map(item => { 
      return JSON.stringify({
        id: item.getDataValue('id'),
        name: item.getDataValue('name'),
        path: item.getDataValue('path'),
      });
    });
  }

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "libraryName": { "type": "string", "minLength": 1 },
    },
    "required": ["libraryName"],
    "additionalProperties": false,
  })
  async library_addItem(ipc: IPCHandlers, req: any): Promise<void> {
    const openDialog = await dialog.showOpenDialog({
      title: `Add file(s) to ${req.libraryName} library`,
      message: `Add file(s) to ${req.libraryName} library`,
      defaultPath: path.join(homedir()),
      properties: ["openFile", "multiSelections", "showHiddenFiles", "dontAddToRecent"],
    });
    if (openDialog.canceled || openDialog.filePaths.length < 1) {
      return Promise.reject('User cancel');
    }
    await Promise.all(openDialog.filePaths.map(async (filePath) => {
      const fileName = path.basename(filePath);
      await ipc.libraryManager.addItem(req.libraryName, filePath, fileName);
    }));
  }

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "libraryName": { "type": "string", "minLength": 1 },
      "id": { "type": "string" },
      "name": { "type": "string" }
    },
    "required": ["libraryName", "id", "name"],
    "additionalProperties": false,
  })
  async library_updateItem(ipc: IPCHandlers, req: any): Promise<void> {
    await ipc.libraryManager.updateItem(req.libraryName, req.id, req.name);
  }

  @isConnected()
  @jsonSchema({
    "type": "object",
    "properties": {
      "libraryName": { "type": "string", "minLength": 1 },
      "id": { "type": "string" },
    },
    "required": ["libraryName", "id"],
    "additionalProperties": false,
  })
  async library_removeItem(ipc: IPCHandlers, req: any): Promise<void> {
    await ipc.libraryManager.removeItem(req.libraryName, req.id);
  }

}