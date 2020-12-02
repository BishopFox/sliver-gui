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


export async function initMenu(menuEvents: Subject<MenuEvent>) {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Menu',
      submenu: [
        {
          label: 'About Sliver',
          click: () => {
            this.menuEvents.next({ button: 'about' });
          }
        },
        {
          label: 'Check For Updates...',
          click: () => {
            this.menuEvents.next({ button: 'updates' });
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: () => {
            app.quit()
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
      role: 'help',
      submenu: [
        {
          label: 'Sliver Wiki',
          click: async () => {
            await shell.openExternal('https://github.com/BishopFox/sliver/wiki')
          }
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu);
}