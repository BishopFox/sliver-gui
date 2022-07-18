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


import { SliverClientConfig } from 'sliver-script';
import { dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';

import { jsonSchema } from '../../ipc/json-schema';
import { logger } from '../../logs';
import { IPCHandlers, SliverConfig, CONFIG_DIR } from '../../ipc/ipc';


async function makeConfigDir(): Promise<NodeJS.ErrnoException | null> {
  return new Promise((resolve, reject) => {
    const dirOptions = {
      mode: 0o700,
      recursive: true
    };
    fs.mkdir(CONFIG_DIR, dirOptions, (err) => {
      err ? reject(err) : resolve(null);
    });
  });
}

export const CONFIG_NAMESPACE = "config";
export class ConfigHandlers {

  // ----------
  // > Config
  // ----------

  public config_list(ipc: IPCHandlers): Promise<string> {
    return new Promise((resolve) => {
      fs.readdir(CONFIG_DIR, (_, items) => {
        if (!fs.existsSync(CONFIG_DIR) || items === undefined) {
          return resolve(JSON.stringify([]));
        }
        const configs: SliverConfig[] = [];
        for (let index = 0; index < items.length; ++index) {
          const filePath = path.join(CONFIG_DIR, items[index]);
          if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
            const fileData = fs.readFileSync(filePath);
            const clientConfig: SliverClientConfig = JSON.parse(fileData.toString('utf8'));
            configs.push({
              filename: path.basename(filePath),
              clientConfig: clientConfig,
            });
          }
        }
        resolve(JSON.stringify(configs));
      });
    });
  }

  @jsonSchema({
    "type": "object",
    "properties": {
      "configs": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "operator": { "type": "string", "minLength": 1 },
            "lhost": { "type": "string", "minLength": 1 },
            "lport": { "type": "number" },
            "ca_certificate": { "type": "string", "minLength": 1 },
            "certificate": { "type": "string", "minLength": 1 },
            "private_key": { "type": "string", "minLength": 1 },
            "token": { "type": "string", "minLength": 1 },
          },
          "additionalProperties": false,
        },
      },
    },
    "required": ["configs"],
    "additionalProperties": false,
  })
  async config_add(ipc: IPCHandlers, req: any): Promise<string> {
    const configs: SliverClientConfig[] = req.configs;
    if (!fs.existsSync(CONFIG_DIR)) {
      const err = await makeConfigDir();
      if (err) {
        return Promise.reject(`Failed to create config dir: ${err}`);
      }
    }
    const fileOptions: fs.WriteFileOptions = { mode: 0o600, encoding: 'utf-8' };
    await Promise.all(configs.map((config) => {
      return new Promise((resolve) => {
        const fileName: string = uuid.v4();
        const data = JSON.stringify(config);
        fs.writeFile(path.join(CONFIG_DIR, fileName), data, fileOptions, (err) => {
          if (err) {
            logger.error(err);
          }
          resolve(undefined);
        });
      });
    }));
    return ipc.dispatch('config_list', null);
  }

  @jsonSchema({
    "type": "object",
    "properties": {
      "filename": { "type": "string", "minLength": 1 },
      "clientConfig": {
        "type": "object",
        "properties": {
          "operator": { "type": "string", "minLength": 1 },
          "lhost": { "type": "string", "minLength": 1 },
          "lport": { "type": "number" },
          "ca_certificate": { "type": "string", "minLength": 1 },
          "certificate": { "type": "string", "minLength": 1 },
          "private_key": { "type": "string", "minLength": 1 },
          "token": { "type": "string", "minLength": 1 },
        },
        "required": [
          "operator", "lhost", "lport", "ca_certificate",
          "certificate", "private_key"
        ],
        "additionalProperties": false,
      }
    },
    "required": ["filename", "clientConfig"],
    "additionalProperties": false,
  })
  async config_save(ipc: IPCHandlers, config: SliverConfig): Promise<void> {
    if (!fs.existsSync(CONFIG_DIR)) {
      const err = await makeConfigDir();
      if (err) {
        return Promise.reject(`Failed to create config dir: ${err}`);
      }
    }
    const fileOptions: fs.WriteFileOptions = { mode: 0o600, encoding: 'utf-8' };
    const fileName = path.basename(config.filename);
    if (fileName.length < 1) {
      return Promise.reject(`Empty filename`);
    }
    return new Promise((resolve) => {
      const data = JSON.stringify(config.clientConfig);
      fs.writeFile(path.join(CONFIG_DIR, fileName), data, fileOptions, (err) => {
        if (err) {
          logger.error(err);
        }
        resolve();
      });
    });
  }

  @jsonSchema({
    "type": "object",
    "properties": {
      "operator": { "type": "string" },
      "lhost": { "type": "string", "minLength": 1 },
      "lport": { "type": "number" },
      "ca_certificate": { "type": "string" },
      "certificate": { "type": "string" },
      "private_key": { "type": "string", "minLength": 1 },
      "token": { "type": "string", "minLength": 1 },
    },
    "required": ["lhost", "lport", "private_key"],
    "additionalProperties": false,
  })
  async config_rm(ipc: IPCHandlers, req: any): Promise<string> {
    let deleted = false;
    try {
      // Filter anything that isn't a file
      const configDir = await fs.promises.readdir(CONFIG_DIR);
      const configFiles = configDir.filter(fileName => {
        fileName = path.join(CONFIG_DIR, fileName);
        if (fs.existsSync(fileName) && !fs.lstatSync(fileName).isDirectory()) {
          return true;
        }
        return false;
      });

      // Parse all files and unlink if we find a match, match is defined as private key/lhost/lport
      await Promise.all(configFiles.map(async (configFile) => {
        const configPath = path.join(CONFIG_DIR, configFile);
        const data = await fs.promises.readFile(configPath);
        const conf: SliverClientConfig = JSON.parse(data.toString());
        if (conf.lhost === req.lhost && conf.lport === req.lport && conf.private_key === req.private_key) {
          const confirm = await dialog.showMessageBox({
            buttons: ["Delete", "Cancel"],
            message: `Delete config for ${conf.operator}@${conf.lhost}:${conf.lport}?`
          });
          if (confirm.response === 0) {
            fs.unlink(configPath, () => logger.info(`Removed config ${configPath}`));
            deleted = true; // Deleted at least one config
          } else {
            logger.info('User canceled config delete operation');
          }
        }
      }));
    } catch (err) {
      logger.error(err);
    }
    return JSON.stringify({ success: deleted });
  }

}