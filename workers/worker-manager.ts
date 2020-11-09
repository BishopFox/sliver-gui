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

import { homedir } from 'os';

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';


const CLIENT_DIR = path.join(homedir(), '.sliver-client');
const SCRIPTS_DIR = path.join(CLIENT_DIR, 'scripts');
const SAVED_DIR = path.join(SCRIPTS_DIR, 'saved');
const SAVED_INDEX = path.join(SAVED_DIR, 'index.json');
const SCRIPT_FILE = 'code.js';


export class WorkerManager {

  private execDir = os.tmpdir();

  constructor() {
    console.log(`[WorkerManager] execDir: ${this.execDir}`);
    fs.mkdirSync(SAVED_DIR, { mode: 0o700, recursive: true });
  }

  private async saveScriptIndex(scriptIndex: Map<string, string>): Promise<void> {
    const data = JSON.stringify(this.indexToJSON(scriptIndex));
    const fileOptions = { mode: 0o600, encoding: 'utf-8' };
    return new Promise((resolve, reject) => {
      fs.writeFile(SAVED_INDEX, data, fileOptions, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }

  private indexToJSON(scriptIndex: Map<string, string>): any {
    return Array.from(scriptIndex.entries()).reduce((obj, [key, value]) => { 
        obj[key] = value; 
        return obj; 
      }, {});
  }

  private async loadScriptIndex(): Promise<Map<string, string>> {
    const scriptIndex = new Map<string, string>();
    if (!fs.existsSync(SAVED_INDEX)) {
      return new Map<string, string>();
    }
    return new Promise((resolve, reject) => {
      fs.readFile(SAVED_INDEX, (err, data: Buffer) => {
        if (err) {
          return reject(err);
        }
        try {
          const saved = JSON.parse(data.toString());
          Object.keys(saved).forEach((key: string) => {
            scriptIndex.set(key, saved[key]);
          });
          resolve(scriptIndex);
        } catch(err) {
          reject(err);
        }
      });
    });
  }

  async newScript(name: string, code: string): Promise<string> {
    const scriptIndex = await this.loadScriptIndex();
    let id = uuid.v4();
    scriptIndex.set(id, name);
    return new Promise(async (resolve, reject) => {
      const fileOptions = { mode: 0o600, encoding: 'utf-8' };
      fs.writeFile(path.join(SAVED_DIR, id), code, fileOptions, async (err) => {
        if (err) {
          return reject(err);
        }
        await this.saveScriptIndex(scriptIndex);
        resolve(id);
      });
    });
  }

  async updateScript(id: string, name: string, code: string) {
    const scriptIndex = await this.loadScriptIndex();
    if (!scriptIndex.has(id)) {
      return;
    }
    scriptIndex.set(id, name);
    await this.saveScriptIndex(scriptIndex);
    return new Promise((resolve, reject) => {
      const fileOptions = { mode: 0o600, encoding: 'utf-8' };
      fs.writeFile(path.join(SAVED_DIR, id), code, fileOptions, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }

  async listScripts(): Promise<any> {
    const scriptIndex = await this.loadScriptIndex();
    return this.indexToJSON(scriptIndex);
  }

  async loadScript(id: string): Promise<any> {
    const scriptIndex = await this.loadScriptIndex();
    if (!scriptIndex.has(id)) {
      return null;
    }
    const name = scriptIndex.get(id);
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(SAVED_DIR, id), (err, data: Buffer) => {
        err ? reject(err) : resolve({
          id: id,
          name: name,
          code: data.toString()
        });
      });
    });
  }

  async removeScript(id: string): Promise<void> {
    const scriptIndex = await this.loadScriptIndex();
    if (!scriptIndex.has(id)) {
      return;
    }
    fs.unlink(path.join(SAVED_DIR, id), (err) => { console.error(err) });
    scriptIndex.delete(id);
    await this.saveScriptIndex(scriptIndex);
  }

  async startScriptExecution(script: string): Promise<string> {
    const execId = uuid.v4();
    const scriptExecDir = path.join(this.execDir, execId);
    fs.mkdirSync(scriptExecDir, { mode: 0o700 });
    return new Promise((resolve, reject) => {
      const fileOptions = { mode: 0o600, encoding: 'utf-8' };
      fs.writeFile(path.join(scriptExecDir, SCRIPT_FILE), script, fileOptions, (err) => {
        err ? reject(err) : resolve(execId);
      });
    });
  }

  async stopScriptExecutionById(execId: string): Promise<void> {
    const scriptExecDir = path.join(this.execDir, path.basename(execId));
    if (fs.existsSync(scriptExecDir)) {
      fs.unlinkSync(path.join(scriptExecDir, SCRIPT_FILE));
    }
  }

  async getScriptExecutionById(execId: string): Promise<Buffer> {
    const scriptExecDir = path.join(this.execDir, path.basename(execId));
    if (fs.existsSync(scriptExecDir)) {
      return new Promise((resolve, reject) => {
        fs.readFile(path.join(scriptExecDir, SCRIPT_FILE), (err, data: Buffer) => {
          err ? reject(err) : resolve(data);
        });
      });
    }
    return Promise.reject('Execution ID does not exist');
  }

  async isScriptExecuting(execId: string): Promise<boolean> {
    const scriptExecDir = path.join(this.execDir, path.basename(execId));
    return fs.existsSync(scriptExecDir);
  }

}