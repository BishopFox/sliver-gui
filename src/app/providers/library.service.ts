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

import { Injectable } from '@angular/core';

import { IPCService } from './ipc.service';


export interface LibraryItem {
  id: string;
  name: string;
  path: string;
}


@Injectable({
  providedIn: 'root'
})
export class LibraryService {

  constructor(private _ipc: IPCService) { }

  async items(libraryName: string): Promise<LibraryItem[]> {
    const items: string[] = await this._ipc.request('library_items', JSON.stringify({
      libraryName: libraryName
    }));
    return items.map(item => JSON.parse(item));
  }

  async addItem(libraryName: string) {
    await this._ipc.request('library_addItem', JSON.stringify({
      libraryName: libraryName
    }));
  }

  async updateItem(libraryName: string, id: string, name: string) {
    await this._ipc.request('library_updateItem', JSON.stringify({
      libraryName: libraryName,
      id: id,
      name: name,
    }));
  }

  async removeItem(libraryName: string, id: string) {
    await this._ipc.request('library_removeItem', JSON.stringify({
      libraryName: libraryName,
      id: id,
    }));
  }

}
