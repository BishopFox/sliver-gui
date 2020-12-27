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

import { Sequelize, DataTypes, Model, ModelCtor, UUIDV4 } from 'sequelize';


export function LibraryModels(sequelize: Sequelize): [ModelCtor<Model<any, any>>, ModelCtor<Model<any, any>>] {
  const LibraryItem = sequelize.define('LibraryItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {
    timestamps: true,
  });

  const Library = sequelize.define('Library', {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {
    timestamps: true,
  });
  Library.hasMany(LibraryItem, { as: 'access' });

  return [Library, LibraryItem];
}
