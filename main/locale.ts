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

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import { logger } from './logs';


const DEFAULT_CLIENT_DIR = path.join(os.homedir(), '.sliver-client');
export const DEFAULT_LOCALE = "en";
export const Locales = new Map<string, string>([
  [DEFAULT_LOCALE, "English"],
  ["fr", "Français (French)"],
  ["es", "Español (Spanish)"],
  ["ja", "日本語 (Japanese)"],
  ["de", "Deutsch (German)"],
  ["uk", "Українська (Ukrainian)"],
  ["zh", "中文 (Chinese)"]
]);

export function setLocaleSync(locale: string): void {
  if (Locales.has(locale)) {
    const fileOptions: fs.WriteFileOptions = { mode: 0o600, encoding: 'utf-8' };
    fs.writeFileSync(localeFilePath(), locale, fileOptions);
  }
}

function matchLocale(locale: string) {
  return Locales.has(locale) ? locale : DEFAULT_LOCALE;
}

export async function getCurrentLocale(): Promise<string> {
  return new Promise((resolve) => {
    const localePath = localeFilePath();
    if (!fs.existsSync(localePath)) {
      return resolve(DEFAULT_LOCALE);
    }
    fs.readFile(localePath, (err, data) => {
      if (err) {
        resolve(DEFAULT_LOCALE);
      } else {
        const locale = data.toString('utf-8').trim();
        logger.silly(`Locale data: ${locale}`);
        resolve(matchLocale(locale));
      }
    });
  });
}

export function getCurrentLocaleSync(): string {
  const localePath = localeFilePath();
  if (!fs.existsSync(localePath)) {
    return DEFAULT_LOCALE;
  }
  const locale = fs.readFileSync(localePath).toString('utf-8').trim();
  logger.debug(`Locale data: ${locale}`);
  return matchLocale(locale);
}

export function getClientDir(): string {
  return DEFAULT_CLIENT_DIR;
}

function localeFilePath(): string {
  const localePath = path.join(getClientDir(), 'locale');
  logger.silly(`Locale file path: ${localePath}`);
  return localePath;
}

export function getDistPath() {
  const distPath = path.join(__dirname, '..', 'dist', getCurrentLocaleSync());
  logger.silly(`Locale dist path: ${distPath}`);
  return path.resolve(distPath);
}

export function getLocalesJSON(): any {
  return Array.from(Locales.entries()).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});
}