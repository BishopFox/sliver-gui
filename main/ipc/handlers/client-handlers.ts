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
import { homedir } from 'os';
import { SliverClient, SliverClientConfig } from 'sliver-script';
import { app, dialog, nativeTheme } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';
import { NotificationMetadata, notify } from 'node-notifier';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import {
  IPCHandlers, Handlers, SaveFileReq, ReadFileReq, DEFAULT_SERVER_URL, SETTINGS_PATH, CONFIG_DIR
} from '../../ipc/ipc';
import { getLocalesJSON, getCurrentLocale, setLocaleSync, getDistPath } from '../../locale';
import { downloadSliverAsset } from '../../ipc/util';
import { jsonSchema } from '../../ipc/json-schema';
import { Progress } from '../../windows/window-manager';
import { logger } from '../../logs';

// https://nodejs.org/api/process.html#process_process_platform
export enum Platforms {
  Windows = 'win32',
  MacOS = 'darwin',
  Linux = 'linux',
};


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

// Annoyingly the node-notify package regularly shells out to a subprocess
// to invoke the notifications, so we need to be extra careful when passing
// parameters that originate from within the sandbox.
const NOTIFY_STR = {
  "type": "string",
  "minLength": 1,
  "maxLength": 64,
  "pattern": "^[a-zA-Z0-9_#!\\- ]*$"
};


export const CLIENT_NAMESPACE = "client";
export class ClientHandlers implements Handlers {

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
      "token": { "type": "string", "minLength": 1 },
    },
    "required": [
      "operator", "lhost", "lport", "ca_certificate", "certificate", "private_key", "token"
    ],
    "additionalProperties": false,
  })
  public async client_start(ipc: IPCHandlers, config: SliverClientConfig): Promise<string> {
    ipc.client = new SliverClient(config);
    await ipc.client.connect();
    logger.debug('Connection successful');

    // Pipe realtime events back to renderer process
    ipc.client.event$.subscribe((event: clientpb.Event) => {
      ipc.windowManager.send('push', Base64.fromUint8Array(event.serializeBinary()));
    });

    return 'success';
  }

  public async client_activeConfig(ipc: IPCHandlers): Promise<string> {
    return ipc.client ? JSON.stringify(ipc.client.config) : '';
  }

  @jsonSchema({
    'type': 'object',
    'properties': {
      'goos': { 'type': 'string', 'minLength': 1 },
      'goarch': { 'type': 'string', 'minLength': 1 },
      'saveToDownloads': { 'type': 'boolean' }
    },
    'required': ['goos', 'goarch', 'saveToDownloads'],
    'additionalProperties': false,
  })
  public async client_downloadSliverServer(ipc: IPCHandlers, req: any): Promise<string> {
    if (!['linux', 'macos', 'windows'].some(goos => goos === req.goos)) {
      return Promise.reject('Invalid operating system');
    }
    let saveTo = path.join(homedir(), 'Downloads');
    if ((!req.saveToDownloads) || (!fs.existsSync(saveTo))) {
      const openDialog = await dialog.showOpenDialog({
        title: "Server Download",
        message: "Save Sliver download to ...",
        defaultPath: path.join(homedir()),
        properties: ["openDirectory", "showHiddenFiles", "dontAddToRecent"],
      });
      if (openDialog.canceled || openDialog.filePaths.length < 1) {
        return Promise.reject('User canceled');
      }
      saveTo = openDialog.filePaths[0];
    }

    const downloadId = uuid.v4().toString();
    return new Promise(resolve => {
      resolve(downloadId);
      downloadSliverAsset(DEFAULT_SERVER_URL, 'server', req.goos, req.goarch, saveTo, (progress: Progress) => {
        ipc.windowManager.downloadEvents.next({
          event: downloadId,
          progress: progress,
        });
      });
    });
  }

  @jsonSchema({
    'type': 'object',
    'properties': {
      'goos': { 'type': 'string', 'minLength': 1 },
      'goarch': { 'type': 'string', 'minLength': 1 },
      'saveToDownloads': { 'type': 'boolean' }
    },
    'required': ['goos', 'goarch', 'saveToDownloads'],
    'additionalProperties': false,
  })
  public async client_downloadSliverClient(ipc: IPCHandlers, req: any): Promise<string> {
    if (!['linux', 'macos', 'windows'].some(goos => goos === req.goos)) {
      return Promise.reject('Invalid operating system');
    }
    let saveTo = path.join(homedir(), 'Downloads');
    if (!req.saveToDownloads || !fs.existsSync(saveTo)) {
      const openDialog = await dialog.showOpenDialog({
        title: "Server Download",
        message: "Save Sliver download to ...",
        defaultPath: path.join(homedir()),
        properties: ["openDirectory", "showHiddenFiles", "dontAddToRecent"],
      });
      if (openDialog.canceled || openDialog.filePaths.length < 1) {
        return Promise.reject('User canceled');
      }
      saveTo = openDialog.filePaths[0];
    }

    const downloadId = uuid.v4().toString();
    return new Promise(resolve => {
      resolve(downloadId);
      const saveTo = path.join(homedir(), 'Downloads');
      downloadSliverAsset(DEFAULT_SERVER_URL, 'client', req.goos, req.goarch, saveTo, (progress: Progress) => {
        ipc.windowManager.downloadEvents.next({
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
  public async client_readFile(ipc: IPCHandlers, readFileReq: ReadFileReq): Promise<string> {
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
          resolve(undefined);
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
  public async client_saveFile(ipc: IPCHandlers, saveFileReq: SaveFileReq): Promise<string> {
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
      const fileOptions: fs.WriteFileOptions = {
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

  public async client_getSettings(ipc: IPCHandlers): Promise<string> {
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
  async client_saveSettings(ipc: IPCHandlers, settings: string): Promise<string> {
    return new Promise(async (resolve, reject) => {

      if (!fs.existsSync(CONFIG_DIR)) {
        const err = await makeConfigDir();
        if (err) {
          return reject(`Failed to create config dir: ${err}`);
        }
      }

      const fileOptions: fs.WriteFileOptions = { mode: 0o600, encoding: 'utf-8' };
      try {
        JSON.parse(settings); // Just ensure it's valid JSON
        fs.writeFile(SETTINGS_PATH, settings, fileOptions, async (err) => {
          if (err) {
            reject(err);
          } else {
            const updated = await ipc.dispatch('client_getSettings', null);
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

  public async client_listLocales(ipc: IPCHandlers): Promise<string> {
    return JSON.stringify(getLocalesJSON());
  }

  public async client_currentLocale(ipc: IPCHandlers): Promise<string> {
    return getCurrentLocale();
  }

  public async client_setLocale(ipc: IPCHandlers, req: string): Promise<string> {
    setLocaleSync(req);
    return getCurrentLocale();
  }

  @jsonSchema({
    "type": "object",
    "properties": {
      "sessionId": { "type": "string" },
    },
    "required": ["sessionId"],
    "additionalProperties": false,
  })
  public async client_sessionWindow(ipc: IPCHandlers, req: any): Promise<void> {
    ipc.windowManager.createSessionWindow(req.sessionId);
  }

  public async client_configManagerWindow(ipc: IPCHandlers): Promise<void> {
    ipc.windowManager.createConfigManagerWindow();
  }

  @jsonSchema({
    "type": "object",
    "properties": {
      "title": NOTIFY_STR,
      "subtitle": NOTIFY_STR,
      "message": NOTIFY_STR,
      "sound": { "type": "boolean" },
      "timeout": { "type": "number" },
      "closeLabel": NOTIFY_STR,
      "actions": {
        "type": "array",
        "items": NOTIFY_STR,
        "additionalItems": false,
      },
      "dropdownLabel": NOTIFY_STR,
      "reply": { "type": "boolean" }
    },
    "required": ["title", "message"],
    "additionalProperties": false,
  })
  public async client_notify(ipc: IPCHandlers, req: any): Promise<string> {
    const iconPath = path.join(getDistPath(), 'favicon.ico');
    return new Promise(resolve => {
      const notification = {
        title: req.title,
        subtitle: req.subtitle,
        message: req.message,
        sound: req.sound ? true : false,
        icon: iconPath,
        timeout: req.timeout > 0 ? req.timeout : 10,
      };
      if (req.closeLabel?.length) {
        notification['closeLabel'] = req.closeLabel;
      }
      if (req.actions?.length) {
        notification['actions'] = req.actions;
      }
      if (req.dropdownLabel?.length) {
        notification['dropdownLabel'] = req.dropdownLabel;
      }
      notify(notification, (err: Error, response: string, metadata: NotificationMetadata) => {
        resolve(JSON.stringify({
          err: err,
          response: response,
          metadata: metadata,
        }));
      });
    });
 
  }

  public client_exit(ipc: IPCHandlers) {
    process.on('unhandledRejection', () => { }); // STFU Node
    app.exit();
  }

}