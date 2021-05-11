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
-------------------------------------------------------------------------

This preload script is callable from within the sandbox via postMessage,
but should not be directly accessible since it itself is not sandboxed.

*/

const { ipcRenderer } = require('electron');


/** App Listener */
const APP_PROTOCOL = 'app:';
const MAIN_ORIGIN = `${APP_PROTOCOL}//sliver`; // Origin for the main window
const appPrefixes = ['client_', 'config_', 'rpc_', 'script_', 'library_'];


window.addEventListener('message', (event) => {
  const url = new URL(event.origin);
  if (url.protocol !== APP_PROTOCOL || typeof(event.data) !== 'string') {
    return;
  }
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'request') {
      if (appPrefixes.some(prefix => msg.method.startsWith(prefix))) {
        ipcRenderer.send('ipc', msg, event.origin);
      } else {
        console.error(`Invalid namespace: ${msg.method}`);
      }
    } else if (msg.type === 'tunnel-outgoing') {
      if (msg.tunnelIpcId && typeof(msg.tunnelIpcId) === 'string' && typeof(msg.data) === 'string') {
        console.log(`[preload] outgoing: ${msg}`);
        ipcRenderer.send('tunnel-outgoing', msg.tunnelIpcId, msg.data);
      } else {
        console.error('Invalid outgoing tunnel message format');
      }
    }
  } catch (err) {
    console.trace(err);
  }
});

ipcRenderer.on('ipc', (_, msg, origin) => {
  const url = new URL(origin);
  if (url.protocol !== APP_PROTOCOL) {
    return;
  }
  try {
    if (msg.type === 'response') {
      window.postMessage(JSON.stringify(msg), origin);
    }
  } catch (err) {
    console.trace(err);
  }
});

// Push events - Can go to all app windows
ipcRenderer.on('push', (_, data) => {
  window.postMessage(JSON.stringify({
    type: 'push',
    data: data,
  }), MAIN_ORIGIN);
});

// Config events - Can go to all app windows
ipcRenderer.on('config', (_, data) => {
  window.postMessage(JSON.stringify({
    type: 'config',
    data: data,
  }), window.location.origin);
});

// Tunnel events (incoming)
ipcRenderer.on('tunnel-incoming', (_, data) => {
  window.postMessage(JSON.stringify({
    type: 'tunnel-incoming',
    data: data,
  }), window.location.origin);
});


if (window.location.origin === MAIN_ORIGIN) {
  // Menu events
  ipcRenderer.on('menu', (_, data) => {
    window.postMessage(JSON.stringify({
      type: 'menu',
      data: data,
    }), MAIN_ORIGIN);
  });

  // Download events
  ipcRenderer.on('download', (_, data) => {
    window.postMessage(JSON.stringify({
      type: 'download',
      data: data,
    }), MAIN_ORIGIN);
  });
}


/** Worker Listener */
const WORKER_PROTOCOL = 'worker:';
const workerPrefixes = ['rpc_', 'local_'];

window.addEventListener('message', (event) => {
  let url = new URL(event.origin);
  if (url.protocol !== WORKER_PROTOCOL || typeof(event.data) !== 'string') {
    return;
  }

  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'request') {
      if (workerPrefixes.some(prefix => msg.method.startsWith(prefix))) {
        ipcRenderer.send('ipc', msg, event.origin);
      } else {
        console.error(`Invalid namespace: ${msg.method}`);
      }
    }
  } catch (err) {
    console.trace(err);
  }
});

ipcRenderer.on('ipc', (_, msg, origin) => {

  if (typeof origin !== 'string') {
    return;
  }

  try {
    let url = new URL(origin);
    if (url.protocol !== WORKER_PROTOCOL) {
      return;
    }
    if (msg.type === 'response') {
      const iframe = document.getElementById(url.hostname);
      iframe?.contentWindow?.postMessage(JSON.stringify(msg), origin);
    }
  } catch (err) {
    console.trace(err);
  }
});
