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


import { dialog } from 'electron';
import { Sequelize, Model, ModelCtor } from 'sequelize';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';

import { getClientDir } from '../ipc/util';
import { logger } from '../logs';
import { WorkerModels } from '../models/worker-models';


const SCRIPTS_DIR = path.join(getClientDir(), 'scripts');
const SAVED_DIR = path.join(SCRIPTS_DIR, 'saved');
const SCRIPT_FILE = 'code.js';

enum FileSystemPermissions {
  ReadOnly = 'Read-only',
  Writable = 'Writable'
}

export interface WorkerOptions {
  siaf: boolean;
}


export class WorkerManager {

  private sequelize: Sequelize;
  private execDir = os.tmpdir();

  // ExecId <-> ScriptId
  private scriptExecutions = new Map<string, string>();
  Script: ModelCtor<Model<any, any>>;
  ScriptFileSystemAccess: ModelCtor<Model<any, any>>;

  constructor() {
    logger.debug(`execDir: ${this.execDir}`);
    fs.mkdirSync(SAVED_DIR, { mode: 0o700, recursive: true });
  }

  async init(sequelize: Sequelize) {
    this.sequelize = sequelize;
    [this.Script, this.ScriptFileSystemAccess] = WorkerModels(this.sequelize);
  }

  async newScript(name: string, code: string): Promise<string> {
    const script: any = await this.Script.create({name: name});
    return new Promise(async (resolve, reject) => {
      const fileOptions: fs.WriteFileOptions = { mode: 0o600, encoding: 'utf-8' };
      fs.writeFile(path.join(SAVED_DIR, script.id), code, fileOptions, async (err) => {
        if (err) {
          return reject(err);
        }
        resolve(script.id);
      });
    });
  }

  async updateScript(id: string, name: string, code: string) {
    const script = await this.Script.findByPk(id);
    if (script.getDataValue('name') !== name) {
      await this.Script.update({ name: name }, { where: { id: script.getDataValue('id') } });
    }
    return new Promise((resolve, reject) => {
      const fileOptions: fs.WriteFileOptions = { mode: 0o600, encoding: 'utf-8' };
      fs.writeFile(path.join(SAVED_DIR, script.getDataValue('id')), code, fileOptions, (err) => {
        err ? reject(err) : resolve(undefined);
      });
    });
  }

  async scripts(): Promise<any> {
    const dbScripts = await this.Script.findAll();
    const scripts = {};
    dbScripts.forEach((script: any) => {
      scripts[script.getDataValue('id')] = script.getDataValue('name');
    });
    return scripts;
  }

  async loadScript(id: string): Promise<any> {
    const script: any = await this.Script.findByPk(id);
    if (script === null) {
      return Promise.reject(`No script with id ${id} found`);
    }
    const access = await script.getAccess();
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(SAVED_DIR, script.getDataValue('id')), (err, data: Buffer) => {
        err ? reject(err) : resolve({
          id: script.getDataValue('id'),
          name: script.getDataValue('name'),
          code: data.toString(),
          access: access,
        });
      });
    });
  }

  async addFileSystemAccess(id: string): Promise<void> {
    const script: any = await this.Script.findByPk(id);
    const open = await dialog.showOpenDialog(null, {
      title: 'File System Access',
      message: `Grant access to ${script.getDataValue('name')}`,
      properties: ['openDirectory', 'showHiddenFiles'],
    });
    if (open.filePaths.length < 1) {
      return;
    }
    const filePath = open.filePaths[0];
    const buttons = [
      FileSystemPermissions.ReadOnly,
      FileSystemPermissions.Writable
    ];
    const permission = await dialog.showMessageBox(null, {
      title: 'File System Access',
      message: `Grant access to ${filePath}`,
      buttons: buttons,
    });
    const writable = permission.response === buttons.indexOf(FileSystemPermissions.Writable);
    await this.ScriptFileSystemAccess.create({
      ScriptId: script.getDataValue('id'),
      path: filePath,
      write: writable,
    });
  }

  async getFileSystemAccess(id: string): Promise<[string, boolean][]> {
    const permissions = await this.ScriptFileSystemAccess.findAll({where: {ScriptId: id}});
    return permissions.map((permission: any) => { 
      return [
        permission.getDataValue('path'),
        permission.getDataValue('write')
      ];
    });
  }

  async execFileSystemAccess(execId: string): Promise<[string, boolean][]> {
    const scriptId = this.scriptExecutions.get(execId);
    return this.getFileSystemAccess(scriptId);
  }
  
  async removeFileSystemAccess(id: string, path: string): Promise<void> {
    const permissions = await this.ScriptFileSystemAccess.findAll({ 
      where: {
        ScriptId: id, 
        path: path,
      }
    });
    permissions.forEach(async (permission) => {
      await permission.destroy();
    });
  }

  async removeScript(id: string): Promise<void> {
    const script = await this.Script.findByPk(id);
    await script.destroy();
    await this.Script.destroy({ where: { id: id } });
    fs.unlink(path.join(SAVED_DIR, id), (err) => { console.error(err) });
  }

  async startScriptExecution(id: string, options: WorkerOptions): Promise<string> {
    const script = await this.loadScript(id);
    const execId = uuid.v4();
    const scriptExecDir = path.join(this.execDir, execId);

    // Wrap code in siaf so we can use top level await
    const code = options.siaf ? `(async () => { ${script.code} })()` : script.code;

    fs.mkdirSync(scriptExecDir, { mode: 0o700 });
    return new Promise((resolve, reject) => {
      const fileOptions: fs.WriteFileOptions = { mode: 0o600, encoding: 'utf-8' };
      fs.writeFile(path.join(scriptExecDir, SCRIPT_FILE), code, fileOptions, (err) => {
        if (!err) {
          this.scriptExecutions.set(execId, script.id);
          resolve(execId);
        } else {
          reject(err);
        }
      });
    });
  }

  async stopScriptExecutionById(execId: string): Promise<void> {
    const scriptExecDir = path.join(this.execDir, path.basename(execId));
    if (this.scriptExecutions.has(execId)) {
      this.scriptExecutions.delete(execId);
    }
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
