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



import { Sequelize, Model, ModelCtor } from 'sequelize';
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
    return this.Library.findOne({ where: { name: libraryName } });
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
    const count = await this.Library.count({ where: { name: libraryName } });
    let library: Model<any, any>;
    if (count < 1) {
      library = await this.Library.create({ name: libraryName });
    } else {
      library = await this.Library.findOne({ where: { name: libraryName }});
    }
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
      await this.LibraryItem.update({ name: name }, { where: { id: library.getDataValue('id') } });
    }
  }

  async removeItem(libraryName: string, id: string): Promise<void> {
    const item = await this.getItem(libraryName, id);
    if (item) {
      await item.destroy();
    }
  }

}