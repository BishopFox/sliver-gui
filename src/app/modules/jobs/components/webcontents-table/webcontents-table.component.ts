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
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import { FadeInOut } from '@app/shared/animations';
import { JobsService } from '@app/providers/jobs.service';
import { Subscription } from 'rxjs';
import { EventsService } from '@app/providers/events.service';


interface TableWebContentData {
  path: string;
  contentType: string;
  size: number;
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}


@Component({
  selector: 'jobs-webcontents-table',
  templateUrl: './webcontents-table.component.html',
  styleUrls: ['./webcontents-table.component.scss'],
  animations: [FadeInOut]
})
export class WebContentsTableComponent implements OnInit, OnDestroy {

  @Input() name: string;
  @Input() title = true;
  @Input() displayedColumns: string[] = [
    'path', 'contentType', 'size'
  ];

  dataSrc: MatTableDataSource<TableWebContentData>;
  website: clientpb.Website;
  private websiteEventsSub: Subscription;

  constructor(private _jobsService: JobsService,
              private _eventsService: EventsService) { }

  ngOnInit(): void {
    this.fetchWebsite();
    this.websiteEventsSub = this._eventsService.websites$.subscribe(this.fetchWebsite.bind(this));
  }

  ngOnDestroy(): void {
    this.websiteEventsSub.unsubscribe();
  }

  async fetchWebsite() {
    this.website = await this._jobsService.websiteByName(this.name);
    this.dataSrc = new MatTableDataSource(this.tableData());
  }

  tableData(): TableWebContentData[] {
    const table: TableWebContentData[] = [];
    console.log(this.website.getContentsMap());
    this.website.getContentsMap().forEach((content, key) => {
      table.push({
        path: content.getPath(),
        contentType: content.getContenttype(),
        size: parseInt(content.getSize(), 10)
      });
    });
    return table.sort((a, b) => (a.path > b.path) ? 1 : -1);
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  onRowSelection(row: any) {

  }

  // Because MatTableDataSource is absolute piece of shit
  sortData(event: Sort) {
    this.dataSrc.data = this.dataSrc.data.slice().sort((a, b) => {
      const isAsc = event.direction === 'asc';
      switch (event.active) {
        case 'path': return compare(a.path, b.path, isAsc);
        case 'contentType': return compare(a.contentType, b.contentType, isAsc);
        case 'size': return compare(a.size, b.size, isAsc);
        default: return 0;
      }
    });
  }

  deleteWebContent() {
    
  }

}
