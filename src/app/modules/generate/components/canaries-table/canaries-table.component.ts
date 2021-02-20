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
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { SliverService } from '@app/providers/sliver.service';
import { FadeInOut } from '@app/shared/animations';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf


function compare(a: number | string | boolean, b: number | string | boolean, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

interface TableCanaryData {
  implantName: string;
  domain: string;
  triggered: boolean;
  firstTriggered: string;
  latestTrigger: string;
}

@Component({
  selector: 'generate-canaries-table',
  templateUrl: './canaries-table.component.html',
  styleUrls: ['./canaries-table.component.scss'],
  animations: [FadeInOut]
})
export class CanariesTableComponent implements OnInit {

  dataSrc: MatTableDataSource<TableCanaryData>;
  
  @Input() title = true;
  @Input() displayedColumns: string[] = [
    'implantName', 'domain', 'triggered', 'firstTriggered', 'latestTrigger'
  ];

  constructor(private _sliverService: SliverService) { }

  ngOnInit() {
    this.fetchCanaries();
  }

  async fetchCanaries() {
    const canaries = await this._sliverService.canaries();
    this.dataSrc = new MatTableDataSource(this.tableData(canaries));
  }

  tableData(canaries: clientpb.DNSCanary[]): TableCanaryData[] {
    const table: TableCanaryData[] = [];
    for (const canary of canaries) {
      table.push({
        implantName: canary.getImplantname(),
        domain: canary.getDomain(),
        triggered: canary.getTriggered(),
        firstTriggered: canary.getFirsttriggered(),
        latestTrigger: canary.getLatesttrigger()
      });
    }
    return table.sort((a, b) => (a.triggered > b.triggered) ? 1 : -1);
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  sortData(event: Sort) {
    this.dataSrc.data = this.dataSrc.data.slice().sort((a, b) => {
      const isAsc = event.direction === 'asc';
      switch (event.active) {
        case 'implantName': return compare(a.implantName, b.implantName, isAsc);
        case 'domain': return compare(a.domain, b.domain, isAsc);
        case 'triggered': return compare(a.triggered, b.triggered, isAsc);
        case 'firstTriggered': return compare(a.firstTriggered, b.firstTriggered, isAsc);
        case 'latestTrigger': return compare(a.latestTrigger, b.latestTrigger, isAsc);
        default: return 0;
      }
    });
  }

}
