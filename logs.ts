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

import * as winston from 'winston';
import * as path from 'path';

import { getClientDir } from './locale';


const LOG_FORMAT = winston.format.printf(({ level, message, label, timestamp }) => {
  return `[${level}] ${timestamp} - ${message}`;
});


const enum Level { 
  Error = 'error', 
  Warn = 'warn', 
  Info = 'info', 
  Http = 'http',
  Verbose = 'verbose', 
  Debug = 'debug', 
  Silly = 'silly'
}

// Log levels: https://github.com/winstonjs/winston#logging-levels
// This is used to link the strings to their numeric value by index
const Levels: string[] = [
  Level.Error,   // 0
  Level.Warn,    // 1
  Level.Info,    // 2
  Level.Http,    // 3
  Level.Verbose, // 4
  Level.Debug,   // 5
  Level.Silly    // 6
];


// ----------------------------------------- [ Logs ] -----------------------------------------
const DEFAULT_LOG_LEVEL = Level.Debug;
function getLevel(): string {
  const level = process.env.SLIVER_GUI_LOG_LEVEL ? process.env.SLIVER_GUI_LOG_LEVEL.toLowerCase() : DEFAULT_LOG_LEVEL;
  return Levels.some(logLevel => logLevel === level) ? level : DEFAULT_LOG_LEVEL;
}

const CURRENT_LEVEL = getLevel();
export const logger = winston.createLogger({
  level: CURRENT_LEVEL,
  format:  winston.format.combine(
    winston.format.simple(),
    winston.format.timestamp(),
    LOG_FORMAT,
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(getClientDir(), 'sliver-gui.log')
    }),
  ],
});


if (Levels.indexOf(Level.Verbose) <= Levels.indexOf(logger.level) || process.env.SLIVER_GUI_CONSOLE_LOG) {
  logger.add(new winston.transports.Console({
    level: CURRENT_LEVEL,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.timestamp(),
      LOG_FORMAT,
    )
  }));
  logger.info('*** Console output enabled ***');
}
