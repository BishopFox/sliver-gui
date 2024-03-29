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

Implementing a custom protocol achieves two goals:
  1) Allows us to use ES6 modules/targets for Angular
  2) Avoids running the app in a file:// origin

*/

import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import { getDistPath } from './locale';
import { logger } from './logs';


type ProtocolCallback = (arg0: { mimeType: string; charset: string; data: Buffer; }) => void;
const DIST_PATH = getDistPath();
export const scheme = 'app';


const mimeTypes = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.json': 'application/json',
  '.css': 'text/css',
  '.svg': 'application/svg+xml',
  '.ico': 'image/vnd.microsoft.icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.map': 'text/plain',
  '.woff': 'application/x-font-woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function charset(mimeType: string): string {
  return ['.html', '.htm', '.js', '.mjs'].some(m => m === mimeType) ? 'utf-8' : null;
}

function mime(filename: string): string {
  const type = mimeTypes[path.extname(`${filename || ''}`).toLowerCase()];
  return type ? type : null;
}

export function requestHandler(req: Electron.ProtocolRequest, next: ProtocolCallback) {
  const reqUrl = new URL(req.url);

  // If the path doesn't start with "/" then path.normalize will not 
  // resolve all '..' and could lead to path traversal attacks this is
  // because NodeJS is a terrible language designed by terrible people.
  if (!reqUrl.pathname.startsWith("/")) {
    logger.error(`Invalid path '${reqUrl.pathname}', cannot normalize`);
    return next({
      mimeType: null,
      charset: null,
      data: null,
    });
  }

  let reqPath = path.normalize(reqUrl.pathname);
  if (reqPath === '/') {
    reqPath = '/index.html';
  }

  const reqFilename = path.basename(reqPath);
  logger.debug(`ReqPath: ${path.join(DIST_PATH, reqPath)} (mime: ${mime(reqFilename)})`);
  fs.readFile(path.join(DIST_PATH, reqPath), (err, data) => {
    const mimeType = mime(reqFilename);
    if (!err && mimeType !== null) {
      next({
        mimeType: mimeType,
        charset: charset(mimeType),
        data: data
      });
    } else {
      logger.error(err);
      next({
        mimeType: null,
        charset: null,
        data: null,
      });
    }
  });
}
