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
-------------------------------------------------------------------------

This preload script is callable from within the sandbox via postMessage,
but should not be directly accessible since it itself is not sandboxed.

*/

const { ipcRenderer } = require('electron');


/** App Listener */

const APP_ORIGIN = 'app://sliver';
const appPrefixes = ['client_', 'config_', 'rpc_', 'script_'];

window.addEventListener('message', (event) => {
  if (event.origin !== APP_ORIGIN) {
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
    }
  } catch (err) {
    console.trace(err);
  }
});

ipcRenderer.on('ipc', (_, msg, origin) => {
  if (origin !== APP_ORIGIN && origin !== '*') {
    return;
  }
  try {
    if (msg.type === 'response' || msg.type === 'push') {
      window.postMessage(JSON.stringify(msg), APP_ORIGIN);
    }
  } catch (err) {
    console.trace(err);
  }
});


/** Worker Listener */

const WORKER_PROTOCOL = 'worker:';
const workerPrefixes = ['rpc_'];

window.addEventListener('message', (event) => {
  let url = new URL(event.origin);
  if (url.protocol !== WORKER_PROTOCOL) {
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

  if (origin === '*') {
    return; // Pushes are forwarded to the worker from the main app
  }

  let url = new URL(origin);
  if (url.protocol !== WORKER_PROTOCOL) {
    return;
  }

  try {
    if (msg.type === 'response' || msg.type === 'push') {
      const iframe = document.getElementById(url.hostname);
      iframe?.contentWindow?.postMessage(JSON.stringify(msg), origin);
    }
  } catch (err) {
    console.trace(err);
  }
});
