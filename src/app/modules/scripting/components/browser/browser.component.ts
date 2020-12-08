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

import { WorkersService } from '@app/providers/workers.service'

interface TableSessionData {
  id: string;
  name: string;
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

@Component({
  selector: 'scripting-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.scss']
})
export class BrowserComponent implements OnInit {

  scripts: any;
  dataSrc: MatTableDataSource<TableSessionData>;

  @Input() title = true;
  @Input() displayedColumns: string[] = [
    'name', 'options'
  ];

  constructor(public dialog: MatDialog,
              private _router: Router,
              private _workerService: WorkersService) { }

  ngOnInit(): void {
    this.fetchScripts();
  }

  async fetchScripts() {
    this.scripts = await this._workerService.listScripts();
    this.dataSrc = new MatTableDataSource(this.tableData(this.scripts));
  }

  tableData(scripts): TableSessionData[] {
    const table: TableSessionData[] = [];
    for (const [id, name] of Object.entries(scripts)) {
      table.push({
        id: id,
        name: name.toString(),
      });
    }
    return table.sort((a, b) => (a.id > b.id) ? 1 : -1);
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  onRowSelection(row: any) {
    this._router.navigate(['scripting', 'editor', row.id]);
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

  removeScript(event, script) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(DeleteScriptDialogComponent, {
      data: script,
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      if (result) {
        await this._workerService.removeScript(script.id);
        this.fetchScripts();
      }
    });
  } 

}


@Component({
  selector: 'scripting-delete-script-dialog',
  templateUrl: 'delete-script.dialog.html',
})
export class DeleteScriptDialogComponent implements OnInit {

  result: any;

  constructor(public dialogRef: MatDialogRef<DeleteScriptDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.result = this.data;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
