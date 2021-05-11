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

import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { Subscription } from 'rxjs';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf
import { FadeInOut } from '@app/shared/animations';
import { JobsService } from '@app/providers/jobs.service';
import { EventsService } from '@app/providers/events.service';


interface TableJobData {
  id: number;
  name: string;
  protocol: string;
  port: number;
  description: string;
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}


@Component({
  selector: 'jobs-table',
  templateUrl: './jobs-table.component.html',
  styleUrls: ['./jobs-table.component.scss'],
  animations: [FadeInOut]
})
export class JobsTableComponent implements OnInit, OnDestroy {

  jobsSub: Subscription;
  dataSrc: MatTableDataSource<TableJobData>;
  
  @Input() title = true;
  @Input() displayedColumns: string[] = [
    'id', 'name', 'protocol', 'port', 'description',
  ];

  constructor(private _router: Router,
              private _eventsService: EventsService,
              private _jobsService: JobsService) { }

  ngOnInit() {
    this.fetchJobs();
    this.jobsSub = this._eventsService.jobs$.subscribe(this.fetchJobs.bind(this));
  }

  ngOnDestroy() {
    this.jobsSub?.unsubscribe();
  }

  async fetchJobs() {
    const jobs = await this._jobsService.jobs();
    this.dataSrc = new MatTableDataSource(this.tableData(jobs));
  }

  tableData(jobs: clientpb.Job[]): TableJobData[] {
    const table: TableJobData[] = [];
    for (let index = 0; index < jobs.length; index++) {
      table.push({
        id: jobs[index].getId(),
        name: jobs[index].getName(),
        protocol: jobs[index].getProtocol(),
        port: jobs[index].getPort(),
        description: jobs[index].getDescription(),
      });
    }
    return table.sort((a, b) => (a.id > b.id) ? 1 : -1);
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  onRowSelection(row: any) {
    this._router.navigate(['jobs', row.id]);
  }

  // Because MatTableDataSource is absolute piece of shit
  sortData(event: Sort) {
    this.dataSrc.data = this.dataSrc.data.slice().sort((a, b) => {
      const isAsc = event.direction === 'asc';
      switch (event.active) {
        case 'id': return compare(a.id, b.id, isAsc);
        case 'name': return compare(a.name, b.name, isAsc);
        case 'protocol': return compare(a.protocol, b.protocol, isAsc);
        case 'port': return compare(a.port, b.protocol, isAsc);
        case 'description': return compare(a.description, b.description, isAsc);
        default: return 0;
      }
    });
  }
}
