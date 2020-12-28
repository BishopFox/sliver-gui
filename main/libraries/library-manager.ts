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


import * as fs from 'fs';
import { Sequelize, Model, ModelCtor } from 'sequelize';

import { logger } from '../logs';
import { LibraryModels } from '../models/library-models';


export class LibraryManager {

  private sequelize: Sequelize;
  Library: ModelCtor<Model<any, any>>;
  LibraryItem: ModelCtor<Model<any, any>>;

  async init(sequelize: Sequelize) {
    this.sequelize = sequelize;
    [this.Library, this.LibraryItem] = LibraryModels(this.sequelize);
  }

  async libraryByName(libraryName: string): Promise<Model<any, any>> {
    const count = await this.Library.count({ where: { name: libraryName } });
    let library: Model<any, any>;
    if (count < 1) {
      library = await this.Library.create({ name: libraryName });
    } else {
      library = await this.Library.findOne({ where: { name: libraryName }});
    }
    return library;
  }

  async getItems(libraryName: string) {
    const library = await this.libraryByName(libraryName);
    return this.LibraryItem.findAll({ where: { LibraryId: library.getDataValue('id') } });
  }

  async getItem(libraryName: string, id: string) {
    const library = await this.libraryByName(libraryName);
    return this.LibraryItem.findOne({
      where: {
        LibraryId: library.getDataValue('id'),
        id: id
      }
    });
  }

  async addItem(libraryName: string, filePath: string, name?: string): Promise<Model<any, any>> {
    const library = await this.libraryByName(libraryName);
    return this.LibraryItem.create({
      LibraryId: library.getDataValue('id'),
      path: filePath,
      name: name,
    });
  }

  // You can only update the 'name' value, to modify path you need to re-add the item
  async updateItem(libraryName: string, id: string, name: string): Promise<void> {
    const library = await this.libraryByName(libraryName);
    const item = await this.getItem(library.getDataValue('name'), id);
    if (item.getDataValue('name') !== name) {
      await this.LibraryItem.update({ name: name }, { 
        where: { 
          id: library.getDataValue('id')
        }
      });
    }
  }

  async removeItem(libraryName: string, id: string): Promise<void> {
    const item = await this.getItem(libraryName, id);
    if (item) {
      await item.destroy();
    }
  }

  async readFile(libraryName: string, id: string): Promise<Buffer> {
    const item = await this.getItem(libraryName, id);
    if (!item) {
      return Promise.reject('Library item not found');
    }
    const filePath = item.getDataValue('path');
    try {
      const lstat = await fs.promises.lstat(filePath);
      if (lstat.isFile()) {
        const data = await fs.promises.readFile(filePath);
        return data;
      }
    } catch (err) {
      logger.error(err);
    }
    return Promise.reject('File does not exist');
  }

}