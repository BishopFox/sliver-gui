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

import { homedir } from 'os';
import { Sequelize, Model, ModelCtor } from 'sequelize';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';

import { ScriptModel } from './models';


const CLIENT_DIR = path.join(homedir(), '.sliver-client');
const SCRIPTS_DIR = path.join(CLIENT_DIR, 'scripts');
const SAVED_DIR = path.join(SCRIPTS_DIR, 'saved');
const SCRIPTS_DB = path.join(SCRIPTS_DIR, 'scripts.db');
const SCRIPT_FILE = 'code.js';


export class WorkerManager {

  private execDir = os.tmpdir();
  private sequelize: Sequelize;
  private Script: ModelCtor<Model<any, any>>;
  private ScriptFileSystemAccess: ModelCtor<Model<any, any>>;

  constructor() {
    console.log(`[WorkerManager] execDir: ${this.execDir}`);
    fs.mkdirSync(SAVED_DIR, { mode: 0o700, recursive: true });
  }

  async init() {
    console.log(`Init sqlite database ...`);
    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: SCRIPTS_DB,
    });
    [this.Script, this.ScriptFileSystemAccess] = ScriptModel(this.sequelize);
    await this.sequelize.sync();
    console.log(`Database initialization completed`);
  }

  async newScript(name: string, code: string): Promise<string> {
    const script: any = await this.Script.create({name: name});
    return new Promise(async (resolve, reject) => {
      const fileOptions = { mode: 0o600, encoding: 'utf-8' };
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
      await this.Script.update({name: name}, {where: {id: script.getDataValue('id')}});
    }
    return new Promise((resolve, reject) => {
      const fileOptions = { mode: 0o600, encoding: 'utf-8' };
      fs.writeFile(path.join(SAVED_DIR, script.getDataValue('id')), code, fileOptions, (err) => {
        err ? reject(err) : resolve();
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
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(SAVED_DIR, script.getDataValue('id')), (err, data: Buffer) => {
        err ? reject(err) : resolve({
          id: id,
          name: script.getDataValue('name'),
          code: data.toString()
        });
      });
    });
  }

  async removeScript(id: string): Promise<void> {
    await this.Script.destroy({where: { id: id }});
    fs.unlink(path.join(SAVED_DIR, id), (err) => { console.error(err) });
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