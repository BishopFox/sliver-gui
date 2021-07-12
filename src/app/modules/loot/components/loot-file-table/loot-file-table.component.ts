/*
  Sliver Implant Framework
  Copyright (C) 2021  Bishop Fox
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

import { Component, Input, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { EventsService } from '@app/providers/events.service';
import { SliverService } from '@app/providers/sliver.service';
import { Subscription } from 'rxjs';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

interface TableLootData {
  name: string;
  fileName: string;
  uuid: string;
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

@Component({
  selector: 'loot-file-table',
  templateUrl: './loot-file-table.component.html',
  styleUrls: ['./loot-file-table.component.scss']
})
export class LootFileTableComponent implements OnInit {

  @Input() title = true;
  @Input() displayedColumns: string[] = [
    'name', 'fileName', 'uuid', 'options'
  ];

  subscription: Subscription;
  dataSrc: MatTableDataSource<TableLootData>;
  
  constructor(private _router: Router,
              private _eventsService: EventsService,
              private _sliverService: SliverService) { }

  ngOnInit(): void {
    this.fetchFileLoot();
    this.subscription = this._eventsService.loot$.subscribe(() => {
      this.fetchFileLoot();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async fetchFileLoot(): Promise<void> {
    const loot = await this._sliverService.lootAllOf('files');
    this.dataSrc = new MatTableDataSource(this.tableData(loot));
  }

  tableData(loot: clientpb.Loot[]): TableLootData[] {
    const table: TableLootData[] = [];
    for (let index = 0; index < loot.length; index++) {
      table.push({
        name: loot[index].getName(),
        fileName: loot[index].getFile()?.getName(),
        uuid: loot[index].getLootid(),
      });
    }
    return table.sort((a, b) => (a.name > b.name) ? 1 : -1);
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  onRowSelection(row: any) {
    this._router.navigate(['loot', row.uuid]);
  }

  // Because MatTableDataSource is absolute piece of shit
  sortData(event: Sort) {
    this.dataSrc.data = this.dataSrc.data.slice().sort((a, b) => {
      const isAsc = event.direction === 'asc';
      switch (event.active) {
        case 'name': return compare(a.name, b.name, isAsc);
        case 'fileName': return compare(a.fileName, b.fileName, isAsc);
        case 'uuid': return compare(a.uuid, b.uuid, isAsc);
        default: return 0;
      }
    });
  }

  removeLoot(event, loot) {
    event.stopPropagation();
  }

}
