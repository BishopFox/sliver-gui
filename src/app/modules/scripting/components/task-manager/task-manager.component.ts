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

import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { take } from 'rxjs/operators';

import { WorkersService } from '@app/providers/workers.service';
import { FadeInOut } from '@app/shared/animations';


interface TableSessionData {
  id: string;
  name: string;
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

@Component({
  selector: 'scripting-task-manager',
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.scss'],
  animations: [FadeInOut],
})
export class TaskManagerComponent implements OnInit {

  @Input() title = true;

  private workers: Map<string, string>;
  dataSrc: MatTableDataSource<TableSessionData>;
  displayedColumns: string[] = [
    'id', 'name', 'options'
  ];

  constructor(public dialog: MatDialog,
              private _workerService: WorkersService,
              private _router: Router) { }

  ngOnInit(): void {
    this.fetchWorkers();
  }

  fetchWorkers() {
    this.workers = this._workerService.workers();
    this.dataSrc = new MatTableDataSource(this.tableData());
  }

  tableData(): TableSessionData[] {
    const table: TableSessionData[] = [];
    for (const [id, name] of this.workers.entries()) {
      console.log(id, name);
      table.push({
        id: id,
        name: name.toString(),
      });
    }
    return table.sort((a, b) => (a.name > b.name) ? 1 : -1);
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  onRowSelection(row: any) {
    this._router.navigate(['scripting', 'tasks', row.id]);
  }

  sortData(event: Sort) {
    this.dataSrc.data = this.dataSrc.data.slice().sort((a, b) => {
      const isAsc = event.direction === 'asc';
      switch (event.active) {
        case 'id': return compare(a.id, b.id, isAsc);
        case 'name': return compare(a.name, b.name, isAsc);
        default: return 0;
      }
    });
  }

  async stopTask(event, task) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(StopTaskDialogComponent, {
      data: task,
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      if (result) {
        await this._workerService.stopWorker(task.id);
        this.fetchWorkers();
      }
    });
  }

}


@Component({
  selector: 'scripting-stop-task-dialog',
  templateUrl: 'stop-task.dialog.html',
})
export class StopTaskDialogComponent implements OnInit {

  result: any;

  constructor(public dialogRef: MatDialogRef<StopTaskDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.result = this.data;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
