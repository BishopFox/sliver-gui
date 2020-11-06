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

import * as fs from 'fs';
import * as path from 'path';


type ProtocolCallback = (arg0: { mimeType: string; charset: string; data: Buffer; }) => void;
const DIST_PATH = path.join(__dirname);
const INDEX_FILE = path.join(DIST_PATH, 'index.html');
const JS_PATH = path.join(DIST_PATH, 'js');

export const scheme = 'worker';

export function requestHandler(req: Electron.ProtocolRequest, next: ProtocolCallback) {
  const reqUrl = new URL(req.url);
  const reqPath = path.normalize(reqUrl.pathname);
  if (reqPath === '/' || reqPath === '/index.html') {
    return fs.readFile(INDEX_FILE, (_, data) => {
      next({
        mimeType: 'text/html',
        charset: 'utf-8',
        data: data
      });
    });
  }

  /* JavaScript Request */
  if (reqPath === '/code.js') {

    // Pull user code and return it

  }

  // Default handler
  const reqFilename = path.basename(reqPath);
  fs.readFile(path.join(JS_PATH, reqFilename), (err, data) => {
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
