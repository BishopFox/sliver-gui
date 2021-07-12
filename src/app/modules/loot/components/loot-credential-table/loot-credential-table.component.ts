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
  credentialType: number;
  user: string;
  password: string;
  apiKey: string;
  uuid: string;
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

@Component({
  selector: 'loot-credential-table',
  templateUrl: './loot-credential-table.component.html',
  styleUrls: ['./loot-credential-table.component.scss']
})
export class LootCredentialTableComponent implements OnInit {

  @Input() title = true;
  @Input() displayedColumns: string[] = [
    'name', 'credentialType', 'user', 'password', 'apiKey', 'uuid', 'options'
  ];
  
  subscription: Subscription;
  dataSrc: MatTableDataSource<TableLootData>;
  
  constructor(private _router: Router,
              private _eventsService: EventsService,
              private _sliverService: SliverService) { }

  ngOnInit(): void {
    this.fetchCredentialLoot();
    this.subscription = this._eventsService.loot$.subscribe(() => {
      this.fetchCredentialLoot();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async fetchCredentialLoot(): Promise<void> {
    const loot = await this._sliverService.lootAllOf('credentials');
    this.dataSrc = new MatTableDataSource(this.tableData(loot));
  }

  tableData(loot: clientpb.Loot[]): TableLootData[] {
    const table: TableLootData[] = [];
    for (let index = 0; index < loot.length; index++) {
      table.push({
        name: loot[index].getName(),
        credentialType: loot[index].getCredentialtype(),
        user: loot[index].getCredential()?.getUser(),
        password: loot[index].getCredential()?.getPassword(),
        apiKey: loot[index].getCredential()?.getApikey(),
        uuid: loot[index].getLootid(),
      });
    }
    return table.sort((a, b) => (a.name > b.name) ? 1 : -1);
  }

  credentialTypeToStr(credentialType: number): string {
    switch (credentialType) {
      case clientpb.CredentialType.USER_PASSWORD:
        return 'User/Password';
      case clientpb.CredentialType.API_KEY:
        return 'API Key';
    }
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
        case 'user': return compare(a.user, b.user, isAsc);
        case 'password': return compare(a.password, b.password, isAsc);
        case 'apiKey': return compare(a.apiKey, b.apiKey, isAsc);
        case 'uuid': return compare(a.uuid, b.uuid, isAsc);
        default: return 0;
      }
    });
  }

  removeLoot(event, loot) {
    event.stopPropagation();
  }

}
