/*
  Sliver Implant Framework
  Copyright (C) 2019  Bishop Fox
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

import { Component, OnInit, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf

import { FadeInOut } from '@app/shared/animations';
import { SliverService } from '@app/providers/sliver.service';
import { ClientService } from '@app/providers/client.service';


interface TableSliverBuildData {
  name: string;
  os: string;
  arch: string;
  debug: boolean;
  format: string;
  c2URLs: string[];
}

function compare(a: number | string | boolean, b: number | string | boolean, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}


@Component({
  selector: 'app-regenerate-dialog',
  templateUrl: 'regenerate-dialog.html',
})
export class RegenerateDialogComponent {

  constructor(public dialogRef: MatDialogRef<RegenerateDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}


@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  animations: [FadeInOut]
})
export class HistoryComponent implements OnInit {

  dataSrc: MatTableDataSource<TableSliverBuildData>;
  displayedColumns: string[] = [
    'name', 'os', 'arch', 'debug', 'format'
  ];

  constructor(public dialog: MatDialog,
              private _snackBar: MatSnackBar,
              private _clientService: ClientService,
              private _sliverService: SliverService) { }

  ngOnInit() {
    this.fetchSliverBuilds();
  }

  async fetchSliverBuilds() {
    const implantBuilds = await this._sliverService.implantBuilds();
    this.dataSrc = new MatTableDataSource(this.tableData(implantBuilds));
  }

  tableData(builds: clientpb.ImplantBuilds): TableSliverBuildData[] {
    const table: TableSliverBuildData[] = [];
    for (const [name, build] of builds.toObject().configsMap) {
      table.push({
        name: name,
        os: build.goos,
        arch: build.goarch,
        debug: build.debug,
        format: this.formatToName(build.format),
        c2URLs: this.c2sToURLs(build.c2List)
      });
    }
    return table.sort((a, b) => (a.name > b.name) ? 1 : -1);
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  onRowSelection(row: any) {
    const dialogRef = this.dialog.open(RegenerateDialogComponent, {
      data: row,
    });
    dialogRef.afterClosed().subscribe(async (targetRow) => {
      console.log(`Regenerate target sliver: ${targetRow.name}`);
      this._snackBar.open(`Regenerating ${targetRow.name}, please wait...`, 'Dismiss', {
        duration: 5000,
      });
      const regenerated = await this._sliverService.regenerate(targetRow.name);
      if (regenerated) {
        const msg = `Save regenerated file ${regenerated.getName()}`;
        const path = await this._clientService.saveFile('Save File', msg, regenerated.getName(), regenerated.getData_asU8());
        console.log(`Saved file to: ${path}`);
      } else {
        console.error(`Failed to regenerate sliver ${targetRow.name}`);
      }
    });
  }

  c2sToURLs(sliverC2s: clientpb.ImplantC2.AsObject[]): string[] {
    const c2URLs: string[] = [];
    for (let index = 0; index < sliverC2s.length; ++index) {
      c2URLs.push(sliverC2s[index].url);
    }
    return c2URLs;
  }

  formatToName(format: number): string {
    // As defined in `client.proto`
    switch (format) {
      case 0:
        return 'Shared Library';
      case 1:
        return 'Shellcode';
      case 2:
        return 'Executable';
      default:
        return 'Unknown';
    }
  }

  // Because MatTableDataSource is absolute piece of shit
  sortData(event: Sort) {
    this.dataSrc.data = this.dataSrc.data.slice().sort((a, b) => {
      const isAsc = event.direction === 'asc';
      switch (event.active) {
        case 'name': return compare(a.name, b.name, isAsc);
        case 'os': return compare(a.os, b.os, isAsc);
        case 'arch': return compare(a.arch, b.arch, isAsc);
        case 'debug': return compare(a.debug, b.debug, isAsc);
        case 'format': return compare(a.format, b.format, isAsc);
        default: return 0;
      }
    });
  }

}
