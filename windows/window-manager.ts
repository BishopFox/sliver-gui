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
import * as fs from 'fs';
import * as uuid from 'uuid';
import * as path from 'path';
import * as log4js from 'log4js';
import * as Base64 from 'js-base64';
import { autoUpdater } from 'electron-updater';
import { Tunnel } from 'sliver-script';

import { CONFIG_DIR } from '../ipc/ipc';
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

export interface Progress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
  delta: number;
}

export interface DownloadEvent {
  event: string;
  progress?: Progress;
  error?: string;
}

export interface ConfigEvent {
  filename?: string;
}

export class WindowManager {

  public handlers: IPCHandlers;
  public workerManager: WorkerManager;

  private mainWindow: BrowserWindow;
  private otherWindows = new Map<string, BrowserWindow>();
  menuEvents = new Subject<MenuEvent>();
  downloadEvents = new Subject<DownloadEvent>();
  configEvents = new Subject<ConfigEvent>();
  tunnels = new Map<string, Tunnel>();


  constructor() {
    this.workerManager = new WorkerManager();
    this.handlers = new IPCHandlers(this);
  }

  async init() {
    await this.workerManager.init();
    this.initUpdate();
    initMenu(this.menuEvents, () => {
      autoUpdater.checkForUpdatesAndNotify();
    });

    fs.watch(CONFIG_DIR, { encoding: 'utf-8' }, (_, filename) => {
      this.configEvents.next({ filename: filename });
    });

    ipcMain.on('tunnel-outgoing', async (_: IpcMainEvent, tunnelIpcId: string, data: string) => {
      if (this.tunnels.has(tunnelIpcId)) {
        logger.debug(`[window-manager] tunnel outgoing (ipc: ${tunnelIpcId}) ${data}`);
        const tunnel = this.tunnels.get(tunnelIpcId);
        tunnel.stdin.next(Buffer.from(Base64.toUint8Array(data)));
      } else {
        logger.warn(`Outgoing data for non-existent tunnel (ipc: ${tunnelIpcId})`);
      }
    });
  
  }

  initUpdate() {

    autoUpdater.on('checking-for-update', () => {
      this.downloadEvents.next({
        event: 'checking-for-update',
      });
    });

    autoUpdater.on('update-available', (info) => {
      logger.debug(info);
      this.downloadEvents.next({
        event: 'update-available',
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      logger.debug(info);
      this.downloadEvents.next({
        event: 'update-not-available',
      });
    });

    autoUpdater.on('download-progress', (progress) => {
      logger.debug(progress);
      this.downloadEvents.next({
        event: 'download-progress',
        progress: progress,
      })
    });

    autoUpdater.on('update-downloaded', (info) => {
      logger.debug(info);
      autoUpdater.quitAndInstall();
    });

    autoUpdater.on('error', (err) => {
      logger.warn(err);
      this.downloadEvents.next({
        event: 'error',
        error: err.toString(),
      });
    });
  }

  // send - Send a message to a window's webContents
  send(channel: string, message: any, otherWindows = false): void {
    this.mainWindow.webContents.send(channel, message);
    if (otherWindows) {
      this.otherWindows.forEach(window => {
        window.webContents.send(channel, message);
      });
    }
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

  createMainWindow(): BrowserWindow {
    const screenSize = screen.getPrimaryDisplay().workAreaSize;
    const gutterSize = 100;
    const width = screenSize.width - (gutterSize * 2);
    const height = screenSize.height - (gutterSize * 2);

    const preload = path.join(__dirname, 'preload.js');
    this.mainWindow = this.window(preload, width, height, gutterSize, gutterSize);
    const menuSub = this.menuEvents.subscribe(event => {
      this.send('menu', JSON.stringify(event), true);
    });
    const downloadSub = this.downloadEvents.subscribe(event => {
      this.send('download', JSON.stringify(event));
    });
    const configSub = this.configEvents.subscribe(event => {
      this.send('config', JSON.stringify(event), true);
    });
    
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });
    this.mainWindow.loadURL(`${AppProtocol.scheme}://sliver/index.html`);
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      menuSub.unsubscribe();
      downloadSub.unsubscribe();
      configSub.unsubscribe();
    });

    this.startIPCHandlers();
    return this.mainWindow;
  }

  createSessionWindow(sessionId: number): BrowserWindow {
    const screenSize = screen.getPrimaryDisplay().workAreaSize;
    const gutterSize = 150;
    const width = screenSize.width - (gutterSize * 2);
    const height = screenSize.height - (gutterSize * 2);

    const preload = path.join(__dirname, 'preload.js');
    let sessionWindow = this.window(preload, width, height, gutterSize, gutterSize);
    sessionWindow.once('ready-to-show', () => {
      sessionWindow.show();
    });
    const windowId = uuid.v4();
    sessionWindow.loadURL(`${AppProtocol.scheme}://${windowId}/index.html#/sessions-standalone/${sessionId}/info`);
    sessionWindow.on('closed', () => {
      sessionWindow = null;
      this.otherWindows.delete(windowId);
    });
    this.otherWindows.set(windowId, sessionWindow);
    return sessionWindow;
  }

  createConfigManagerWindow(): BrowserWindow {
    const gutterSize = 100;
    const width = 875;
    const height = 400;

    const preload = path.join(__dirname, 'preload.js');
    let configManagerWindow = this.window(preload, width, height, gutterSize, gutterSize);
    configManagerWindow.once('ready-to-show', () => {
      configManagerWindow.show();
    });
    const windowId = uuid.v4();
    configManagerWindow.loadURL(`${AppProtocol.scheme}://${windowId}/index.html#/config-manager-standalone`);
    const configSub = this.configEvents.subscribe(event => {
      configManagerWindow.webContents.send('config', JSON.stringify(event));
    });
    this.otherWindows.set(windowId, configManagerWindow);
    configManagerWindow.on('closed', () => {
      configManagerWindow = null;
      this.otherWindows.delete(windowId);
      configSub.unsubscribe();
    });
    return configManagerWindow;
  }

  private window(preload: string, width: number, height: number, x: number, y: number): Electron.BrowserWindow {
    switch (process.platform) {
      case Platforms.MacOS:
        return this.glassWindow(preload, width, height, x, y)
      default:
        return this.normalWindow(preload, width, height, x, y);
    }
  }

  private glassWindow(preload: string, width: number, height: number, x: number, y: number) {
    return new BrowserWindow({
      titleBarStyle: 'hidden',
      transparent: true,
      hasShadow: true,
      vibrancy: 'ultra-dark',
      x: x,
      y: y,
      width: width,
      height: height,
      webPreferences: this.webPreferences(preload),
      show: false,
    });
  }

  private normalWindow(preload: string, width: number, height: number, x: number, y: number) {
    return new BrowserWindow({
      hasShadow: true,
      x: x,
      y: y,
      width: width,
      height: height,
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