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

import { ipcMain, BrowserWindow, IpcMainEvent, screen } from 'electron';
import { Subject } from 'rxjs';
import * as uuid from 'uuid';
import * as path from 'path';
import * as log4js from 'log4js';

import { WorkerManager } from '../workers/worker-manager';
import { initMenu, MenuEvent } from './menu';
import { dispatchIPC, IPCHandlers, IPCMessage } from '../ipc/ipc';
import * as AppProtocol from '../app-protocol';


const logger = log4js.getLogger(__filename);

// https://nodejs.org/api/process.html#process_process_platform
export enum Platforms {
  Windows = 'win32',
  MacOS = 'darwin',
  Linux = 'linux',
};


export class WindowManager {

  public handlers: IPCHandlers;
  public workerManager: WorkerManager;

  private mainWindow: BrowserWindow;
  private sessionWindows = new Map<string, BrowserWindow>();
  private menuEvents = new Subject<MenuEvent>();

  constructor() {
    this.workerManager = new WorkerManager();
    this.handlers = new IPCHandlers(this);
  }

  async init() {
    await this.workerManager.init();
    initMenu(this.menuEvents);
    this.menuEvents.subscribe(event => {
      this.mainWindow.webContents.send('menu', JSON.stringify(event));
    });
  }

  private startIPCHandlers() {
    ipcMain.on('ipc', async (event: IpcMainEvent, msg: IPCMessage, origin: string) => {
      dispatchIPC(this.handlers, msg.method, msg.data).then((result: any) => {
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
    });
  }

  createMainWindow() {

    const gutterSize = 100;
    this.mainWindow = this.window(gutterSize, path.join(__dirname, '..', 'preload.js'))

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    this.mainWindow.loadURL(`${AppProtocol.scheme}://sliver/index.html`);
    // this.mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    this.mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store window
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      this.mainWindow = null;
    });

    this.startIPCHandlers();

    // I know what you're thinking, why do we need a main<->main event emitter here,
    // can't you just send an IPC event to the renderer? The answer is no, you can't.
    ipcMain.on('push', async (event: IpcMainEvent, data: string) => {
      this.mainWindow.webContents.send('push', data);
    });

    return this.mainWindow;
  }

  createSessionWindow(sessionId: number) {
    const gutterSize = 250;
    let sessionWindow = this.window(gutterSize, path.join(__dirname, '..', 'preload.js'));
    sessionWindow.once('ready-to-show', () => {
      sessionWindow.show();
    });
    const windowId = uuid.v4();
    sessionWindow.loadURL(`${AppProtocol.scheme}://${windowId}/index.html#/sessions-standalone/${sessionId}/file-browser`);
    sessionWindow.on('closed', () => {
      sessionWindow = null;
      this.sessionWindows.delete(windowId);
    });
    this.sessionWindows.set(windowId, sessionWindow);
    return sessionWindow;
  }

  private window(gutterSize: number, preload: string): Electron.BrowserWindow {
    switch(process.platform) {
      case Platforms.MacOS:
        return this.glassWindow(gutterSize, preload)
      default:
        return this.normalWindow(gutterSize, preload);
    }
  }

  private glassWindow(gutterSize: number, preload: string) {
    const size = screen.getPrimaryDisplay().workAreaSize;
    return new BrowserWindow({
      titleBarStyle: 'hidden',
      transparent: true,
      hasShadow: true,
      vibrancy: 'ultra-dark',
      x: gutterSize,
      y: gutterSize,
      width: size.width - (gutterSize * 2),
      height: size.height - (gutterSize * 2),
      webPreferences: this.webPreferences(preload),
      show: false,
    });
  }

  private normalWindow(gutterSize: number, preload: string) {
    const size = screen.getPrimaryDisplay().workAreaSize;
    return new BrowserWindow({
      hasShadow: true,
      x: gutterSize,
      y: gutterSize,
      width: size.width - (gutterSize * 2),
      height: size.height - (gutterSize * 2),
      webPreferences: this.webPreferences(preload),
      show: false,
    });
  }

  private webPreferences(preload: string) {
    return {
      scrollBounce: true,
      sandbox: true,
      webSecurity: true,
      contextIsolation: true,
      webviewTag: false,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      nativeWindowOpen: false,
      safeDialogs: true,
      preload: preload,
    };
  }

}