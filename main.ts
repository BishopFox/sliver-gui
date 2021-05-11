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
*/

import { app, protocol } from 'electron';

import { logger } from './main/logs';
import { WindowManager } from './main/windows/window-manager';
import * as contextMenu from 'electron-context-menu';
import * as WorkerProtocol from './main/workers/worker-protocol';
import * as AppProtocol from './main/app-protocol';

// ----------------------------------------- [ Context Menu ] -----------------------------------------
contextMenu({
  prepend: (defaultActions, params, browserWindow) => [],
});


// ----------------------------------------- [ Protocols ] -----------------------------------------
protocol.registerSchemesAsPrivileged([{
  scheme: AppProtocol.scheme,
  privileges: { standard: true, secure: true }
}]);

protocol.registerSchemesAsPrivileged([{
  scheme: WorkerProtocol.scheme,
  privileges: { standard: true, secure: true }
}]);

// ----------------------------------------- [ Main ] -----------------------------------------
async function main() {
  logger.debug(`Main starting ...`);
  try {

    let mainWindow: Electron.BrowserWindow;
    const windowManager = new WindowManager();
    windowManager.init();

    // Custom protocol handler
    app.on('ready', () => {
      logger.debug('App ready ...');
      protocol.registerBufferProtocol(AppProtocol.scheme, AppProtocol.requestHandler);
      protocol.registerBufferProtocol(WorkerProtocol.scheme, (req, next) => {
        WorkerProtocol.requestHandler(windowManager.workerManager, req, next);
      });
      mainWindow = windowManager.createMainWindow();
    });

    app.on('activate', () => {
      logger.debug('App activate ...');
      if (mainWindow === null) {
        mainWindow = windowManager.createMainWindow();
      }
    });

    // Prevent navigation in any window
    // WARNING: This actually doesn't work because Electron hates security
    // https://github.com/electron/electron/issues/8841
    app.on('web-contents-created', (_, contents) => {
      contents.on('will-navigate', (event, url) => {
        logger.warn(`[will-navigate] ${url}`);
        logger.warn(event);
        event.preventDefault();
      });
      contents.on('will-redirect', (event, url) => {
        logger.warn(`[will-redirect] ${url}`);
        logger.warn(event);
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
