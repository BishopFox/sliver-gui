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
*/

import { app,  protocol } from 'electron';

import { createMainWindow } from './windows/main';
import { IPCHandlers } from './ipc/ipc';
import { WorkerManager } from './workers/worker-manager';

import * as WorkerProtocol from './workers/worker-protocol';
import * as AppProtocol from './app-protocol';


protocol.registerSchemesAsPrivileged([{
  scheme: AppProtocol.scheme,
  privileges: { standard: true, secure: true }
}]);

protocol.registerSchemesAsPrivileged([{
  scheme: WorkerProtocol.scheme,
  privileges: { standard: true, secure: true }
}]);


// ----------------------------------------- [ MAIN ] -----------------------------------------
let mainWindow;

function main() {
  try {

    let workerManager = new WorkerManager();
    let handlers = new IPCHandlers(workerManager);

    // Custom protocol handler
    app.on('ready', () => {

      protocol.registerBufferProtocol(AppProtocol.scheme, AppProtocol.requestHandler);
      protocol.registerBufferProtocol(WorkerProtocol.scheme, (req, next) => {
        WorkerProtocol.requestHandler(workerManager, req, next);
      });

      mainWindow = createMainWindow(handlers);

    });

    app.on('activate', () => {
      if (mainWindow === null) {
        mainWindow = createMainWindow(handlers);
      }
    });

    // Prevent navigation in any window
    // WARNING: This actually doesn't work because Electron hates security
    // https://github.com/electron/electron/issues/8841
    app.on('web-contents-created', (_, contents) => {
      contents.on('will-navigate', (event, url) => {
        console.log(`[will-navigate] ${url}`);
        console.log(event);
        event.preventDefault();
      });
      contents.on('will-redirect', (event, url) => {
        console.log(`[will-redirect] ${url}`);
        console.log(event);
        event.preventDefault();
      });
    });

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
      // On OS X it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

  } catch (error) {
    console.trace(error);
    process.exit(1);
  }
}

main();
