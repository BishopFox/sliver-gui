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

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { LibraryItem, LibraryService } from '@app/providers/library.service';
import { FadeInOut } from '@app/shared';


function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}


@Component({
  selector: 'sessions-library-table',
  templateUrl: './library-table.component.html',
  styleUrls: ['./library-table.component.scss'],
  animations: [FadeInOut]
})
export class LibraryTableComponent implements OnInit {

  @Input() title: string;
  @Input() card: boolean = true;
  @Input() showControls: boolean = true;
  @Input() libraryName: string;
  @Input() displayedColumns: string[] = [
    'name', 'path', 'controls'
  ];
  @Output() onLibrarySelection = new EventEmitter<LibraryItem>();

  dataSrc: MatTableDataSource<LibraryItem>;
  libraryItems: LibraryItem[];
  
  constructor(private _libraryService: LibraryService) { }

  ngOnInit(): void {
    this.fetchLibraryItems();
  }

  async fetchLibraryItems() {
    this.libraryItems = await this._libraryService.items(this.libraryName);
    this.dataSrc = new MatTableDataSource(this.tableData());
  }

  tableData(): LibraryItem[] {
    return this.libraryItems.sort((a, b) => (a.name > b.name) ? 1 : -1);
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  onRowSelection(item: LibraryItem) {
    this.onLibrarySelection.emit(item);
  }

  sortData(event: Sort) {
    this.dataSrc.data = this.dataSrc.data.slice().sort((a, b) => {
      const isAsc = event.direction === 'asc';
      switch (event.active) {
        case 'id': return compare(a.id, b.id, isAsc);
        case 'name': return compare(a.name, b.name, isAsc);
        case 'path': return compare(a.path, b.path, isAsc);
        default: return 0;
      }
    });
  }

  async addItem() {
    await this._libraryService.addItem(this.libraryName);
    this.fetchLibraryItems();
  }

  async renameItem(item: LibraryItem, name: string) {
    await this._libraryService.updateItem(this.libraryName, item.id, name);
    this.fetchLibraryItems();
  }

  async removeItem(item: LibraryItem) {
    await this._libraryService.removeItem(this.libraryName, item.id);
    this.fetchLibraryItems();
  }

  getCardStyle() {
    return this.card ? {} : {'box-shadow': 'none'};
  }

}
