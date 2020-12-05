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

import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import { FadeInOut } from '@app/shared/animations';
import { JobsService } from '@app/providers/jobs.service';
import { EventsService } from '@app/providers/events.service';
import { Subscription } from 'rxjs';

interface TableWebsiteData {
  name: string;
  pages: number;
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}


@Component({
  selector: 'jobs-websites-table',
  templateUrl: './websites-table.component.html',
  styleUrls: ['./websites-table.component.scss'],
  animations: [FadeInOut]
})
export class WebsitesTableComponent implements OnInit, OnDestroy {

  websites: clientpb.Website[];
  dataSrc: MatTableDataSource<TableWebsiteData>;
  websiteEventsSub: Subscription;

  @Input() title = true;
  @Input() displayedColumns: string[] = [
    'name', 'pages'
  ];

  constructor(private _router: Router,
              private _jobService: JobsService,
              private _eventsService: EventsService) { }

  ngOnInit(): void {
    this.fetchWebsites();
    this.websiteEventsSub = this._eventsService.websites$.subscribe(this.fetchWebsites.bind(this));
  }

  ngOnDestroy(): void {
    this.websiteEventsSub.unsubscribe();
  }

  async fetchWebsites() {
    this.websites = await this._jobService.websites();
    this.dataSrc = new MatTableDataSource(this.tableData());
  }

  tableData(): TableWebsiteData[] {
    const table: TableWebsiteData[] = [];
    for (let index = 0; index < this.websites.length; index++) {
      table.push({
        name: this.websites[index].getName(),
        pages: this.websites[index].getContentsMap().getEntryList().length,
      });
    }
    return table.sort((a, b) => (a.name > b.name) ? 1 : -1);
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  onRowSelection(row: any) {
    this._router.navigate(['jobs', 'websites', row.name]);
  }

  // Because MatTableDataSource is absolute piece of shit
  sortData(event: Sort) {
    this.dataSrc.data = this.dataSrc.data.slice().sort((a, b) => {
      const isAsc = event.direction === 'asc';
      switch (event.active) {
        case 'name': return compare(a.name, b.name, isAsc);
        default: return 0;
      }
    });
  }

}
