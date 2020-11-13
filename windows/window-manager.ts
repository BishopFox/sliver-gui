import { ipcMain, BrowserWindow, IpcMainEvent, screen } from 'electron';
import * as uuid from 'uuid';
import * as path from 'path';

import { WorkerManager } from '../workers/worker-manager';
import { dispatchIPC, IPCHandlers, IPCMessage } from '../ipc/ipc';
import * as AppProtocol from '../app-protocol';


export class WindowManager {

  public handlers: IPCHandlers;
  public workerManager: WorkerManager;

  private mainWindow: BrowserWindow;
  private sessionWindows = new Map<string, BrowserWindow>();

  constructor() {
    this.workerManager = new WorkerManager();
    this.handlers = new IPCHandlers(this);
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
        console.error(`[ipc handlers](${origin}): ${err}`);
        console.trace();
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
    const electronScreen = screen;
    const size = electronScreen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    const gutterSize = 100;
    this.mainWindow = new BrowserWindow({
      titleBarStyle: 'hidden',
      x: gutterSize,
      y: gutterSize,
      width: size.width - (gutterSize * 2),
      height: size.height - (gutterSize * 2),
      webPreferences: {
        scrollBounce: true,
        // I think I got all of the settings we want here to reasonably lock down
        // the BrowserWindow - https://electronjs.org/docs/api/browser-window
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
        preload: path.join(__dirname, '..', 'preload.js'),
      },
      show: false, // hide until 'ready-to-show'
    });

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    this.mainWindow.loadURL(`${AppProtocol.scheme}://sliver/index.html`);
    this.mainWindow.webContents.openDevTools();

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

    const electronScreen = screen;
    const size = electronScreen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    const gutterSize = 100;
    let sessionWindow = new BrowserWindow({
      titleBarStyle: 'hidden',
      x: gutterSize,
      y: gutterSize,
      width: size.width - (gutterSize * 2),
      height: size.height - (gutterSize * 2),
      webPreferences: {
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
        preload: path.join(__dirname, '..', 'preload.js'),
      },
      show: false, // hide until 'ready-to-show'
    });

    sessionWindow.once('ready-to-show', () => {
      sessionWindow.show();
    });

    const windowId = uuid.v4();
    sessionWindow.loadURL(`${AppProtocol.scheme}://${windowId}/#/sessions-standalone/${sessionId}/info`);
    sessionWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    sessionWindow.on('closed', () => {
      // Dereference the window object, usually you would store window
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      sessionWindow = null;
      this.sessionWindows.delete(windowId);
    });

    this.sessionWindows.set(windowId, sessionWindow);

    return sessionWindow;
  }

}