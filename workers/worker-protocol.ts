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


import { ProtocolRequest } from 'electron';
import { WorkerManager } from './worker-manager';
import { getDistPath } from '../locale';

import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';


type ProtocolCallback = (arg0: { mimeType: string; charset: string; data: Buffer; }) => void;
const WORKER_PATH = path.join(__dirname);
const INDEX_FILE = path.join(WORKER_PATH, 'index.html');
const DIST_PATH = getDistPath();
const WORKER_DIST_PATH = path.join(DIST_PATH, 'worker');


export const scheme = 'worker';

export async function requestHandler(workerManager: WorkerManager, req: ProtocolRequest, next: ProtocolCallback) {
  const reqUrl = new URL(req.url);
  if (!workerManager.isScriptExecuting(reqUrl.hostname)) {
    console.warn(`[WorkerProtocol] Script is not executing: ${reqUrl.hostname}`);
    return;
  }

  const reqPath = path.resolve(reqUrl.pathname);

  /* Index Request */
  if (reqPath === '/' || reqPath === '/index.html') {
    return fs.readFile(INDEX_FILE, (_, data) => {
      const frameTemplate = Handlebars.compile(data.toString());
      next({
        mimeType: 'text/html',
        charset: 'utf-8',
        data: Buffer.from(frameTemplate({ execId: reqUrl.hostname })),
      });
    });
  }

  /* JavaScript Request */
  if (reqPath === '/code.js') {
    const script = await workerManager.getScriptExecutionById(reqUrl.hostname);
    return next({
      mimeType: 'text/javascript',
      charset: 'utf-8',
      data: script,
    });
  }

  // Default handler
  fs.readFile(path.join(WORKER_DIST_PATH, reqPath), (err, data: Buffer) => {
    if (!err) {
      next({
        mimeType: 'text/javascript',
        charset: 'utf-8',
        data: data
      });
    } else {
      console.error(`Worker protocol: ${err}`);
    }
  });
  
}
