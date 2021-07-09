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

import { Subject } from 'rxjs';
import { Menu, app, shell } from 'electron';


export interface MenuEvent {
  button: string;
  id?: number;
}

export async function initMenu(menuEvents: Subject<MenuEvent>, updateCallback: CallableFunction) {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Sliver',
      submenu: [
        {
          label: 'About Sliver',
          click: () => {
            menuEvents.next({ button: 'about' });
          }
        },
        {
          label: 'Check For Updates...',
          click: () => {
            updateCallback();
          },
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            menuEvents.next({ button: 'settings' })
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Screenshot GUI',
          accelerator: 'CmdOrCtrl+s',
          click: () => { 
            menuEvents.next({ button: 'screenshot' });
          }
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Forward',
          accelerator: 'Shift+L',
          click: () => {
            menuEvents.next({ button: 'forward' });
          }
        },
        {
          label: 'Back',
          accelerator: 'Shift+H',
          click: () => {
            menuEvents.next({ button: 'back' });
          }
        }
      ]
    },
    {
      label: 'Download',
      submenu: [
        {
          label: 'Sliver Server',
          click: () => {
            menuEvents.next({ button: 'sliver-download-server' });
          }
        },
        {
          label: 'Console Client',
          click: () => {
            menuEvents.next({ button: 'sliver-download-client' });
          }
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Sliver Server Setup',
          click: () => {
            shell.openExternal('https://github.com/BishopFox/sliver/wiki');
          }
        },
        {
          label: 'Sliver Wiki',
          click: () => {
            shell.openExternal('https://github.com/BishopFox/sliver/wiki');
          }
        },
        { type: 'separator' },
        {
          label: 'Ask a Question',
          click: () => {
            shell.openExternal('https://github.com/BishopFox/sliver/discussions');
          }
        },
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}
