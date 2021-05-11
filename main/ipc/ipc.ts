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
--------------------------------------------------------------------------

Maps IPC calls to RPC calls, and provides other local operations such as
listing/selecting configs to the sandboxed code.

*/

import { ipcMain, FileFilter, BrowserWindow, IpcMainEvent } from 'electron';
import { SliverClient, SliverClientConfig } from 'sliver-script';
import * as path from 'path';

import { getClientDir } from '../locale';
import { WindowManager } from '../windows/window-manager';
import { WorkerManager } from '../workers/worker-manager';
import { LibraryManager } from '../libraries/library-manager';
import { logger } from '../logs';

import { ClientHandlers, CLIENT_NAMESPACE } from './handlers/client-handlers';
import { ConfigHandlers, CONFIG_NAMESPACE } from './handlers/config-handlers';
import { LocalHandlers, LOCAL_NAMESPACE } from './handlers/local-handlers';
import { RPCHandlers, RPC_NAMESPACE } from './handlers/rpc-handlers';
import { ScriptHandlers, SCRIPT_NAMESPACE } from './handlers/script-handlers';
import { LibraryHandlers, LIBRARY_NAMESPACE } from './handlers/library-handlers';


export const DEFAULT_SERVER_URL = 'https://api.github.com/repos/BishopFox/sliver/releases/latest';
export const CONFIG_DIR = path.join(getClientDir(), 'configs');
export const SETTINGS_PATH = path.join(getClientDir(), 'gui-settings.json');

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

export interface SliverConfig {
  filename: string;
  clientConfig: SliverClientConfig;
}

export enum TLSSettings {
  SelfSigned = 'self-signed',
  LetsEncrypt = 'lets-encrypt',
  Custom = 'custom'
}

export interface Handlers { }

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

  // Bind namespaces to classes/methods
  namespaces = new Map<string, Handlers>([
    [CLIENT_NAMESPACE, new ClientHandlers()],
    [CONFIG_NAMESPACE, new ConfigHandlers()],
    [LOCAL_NAMESPACE, new LocalHandlers()],
    [RPC_NAMESPACE, new RPCHandlers()],
    [SCRIPT_NAMESPACE, new ScriptHandlers()],
    [LIBRARY_NAMESPACE, new LibraryHandlers()]
  ]);

  public client: SliverClient;
  public windowManager: WindowManager;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  public get workerManager(): WorkerManager {
    return this.windowManager.workerManager;
  }

  public get libraryManager(): LibraryManager {
    return this.windowManager.libraryManager;
  }

  // Dispatcher
  async dispatch(method: string, data: string): Promise<any> {
    logger.debug(`IPC Dispatch: ${method}`);

    // IPC handlers must start with "namespace_" this helps ensure we do not inadvertently
    // expose methods that we don't want exposed to the sandboxed code.
    const namespaceFilter = ['client_', 'config_', 'rpc_', 'script_', 'library_'];
    if (namespaceFilter.some(prefix => method.startsWith(prefix))) {
      const handlers = this.getNamespaceHandlers(method);
      if (typeof handlers[method] === 'function') {
        const result: any = await handlers[method](this, data);
        return result;
      } else {
        return Promise.reject(`No handler for method: ${method}`);
      }
    } else {
      return Promise.reject(`Invalid method handler namespace for "${method}"`);
    }
  }

  // Local Dispatcher - Are special as they need an extra parameter (origin)
  async dispatchLocal(origin: string, method: string, data: string): Promise<any> {
    logger.debug(`IPC Local Dispatch: ${method}`);
    if (['local_'].some(prefix => method.startsWith(prefix))) {
      const handlers = this.getNamespaceHandlers(method);
      if (typeof handlers[method] === 'function') {
        const result: any = await handlers[method](this, origin, data);
        return result;
      } else {
        return Promise.reject(`No local handler for method: ${method}`);
      }
    } else {
      return Promise.reject(`Invalid local method handler namespace for "${method}"`);
    }
  }

  getNamespaceHandlers(method: string): Handlers {
    const prefix = method.split("_");
    return this.namespaces.get(prefix[0]);
  }

}

export function startIPCHandlers(window: BrowserWindow, ipc: IPCHandlers) {

  ipcMain.on('ipc', async (event: IpcMainEvent, msg: IPCMessage, origin: string) => {

    // Local handlers (needs origin)
    if (msg.method.startsWith('local_')) {
      ipc.dispatchLocal(origin, msg.method, msg.data).then((result: any) => {
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
      ipc.dispatch(msg.method, msg.data).then((result: any) => {
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
