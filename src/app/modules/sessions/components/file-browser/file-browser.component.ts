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

import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb';

import { FadeInOut } from '@app/shared/animations';
import { SliverService } from '@app/providers/sliver.service';
import { ClientService } from '@app/providers/client.service';


interface TableFileData {
  name: string;
  size: number;
  isDir: boolean;
}

function compare(a: number | string | boolean, b: number | string | boolean, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}


@Component({
  selector: 'sessions-file-browser',
  templateUrl: './file-browser.component.html',
  styleUrls: ['./file-browser.component.scss'],
  animations: [FadeInOut]
})
export class FileBrowserComponent implements OnInit {

  ls: sliverpb.Ls;
  session: clientpb.Session;
  dataSrc = new MatTableDataSource<TableFileData>();
  displayedColumns: string[] = [
    'isDir', 'name', 'size', 'options'
  ];
  isFetching = false;
  working = false;
  showHiddenFiles = true;

  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };

  constructor(public dialog: MatDialog,
              private _route: ActivatedRoute,
              private _clientService: ClientService,
              private _sliverService: SliverService) { }

  ngOnInit() {
    this._route.parent.params.pipe(take(1)).subscribe((params) => {
      const sessionId: string = params['session-id'];
      this._sliverService.sessionById(sessionId).then((session) => {
        this.session = session;
        this.fetchLs('.');
      }).catch(() => {
        console.error(`No session with id ${sessionId}`);
      });
    });
  }

  async fetchLs(targetDir: string) {
    this.isFetching = true;
    this.ls = await this._sliverService.ls(this.session.getId(), targetDir);
    this.dataSrc.data = this.tableData();
    this.isFetching = false;
  }

  async onRowSelection(row: TableFileData) {
    if (this.isFetching) {
      return;
    }
    if (row.isDir) {
      this.isFetching = true;
      const pwd = await this._sliverService.cd(this.session.getId(), row.name);
      this.fetchLs(pwd.getPath());
    } else {
      const dialogRef = this.dialog.open(DownloadDialogComponent, {
        data: {
          cwd: this.ls.getPath(),
          name: row.name,
          size: row.size,
        }
      });
      dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
        if (result) {
          this.download(result);
        }
      });
    }
  }

  tableData(): TableFileData[] {
    const dirLs = this.ls.getFilesList();
    const table: TableFileData[] = [];
    table.push({
      name: '..',
      size: 0,
      isDir: true,
    });
    for (let index = 0; index < dirLs.length; index++) {
      const name = dirLs[index].getName();
      if (!this.showHiddenFiles && name.startsWith('.')) {
        continue;
      }
      table.push({
        name: name,
        size: dirLs[index].getSize(),
        isDir: dirLs[index].getIsdir()
      });
    }
    return table;
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  // Because MatTableDataSource is absolute piece of shit
  sortData(event: Sort) {
    this.dataSrc.data = this.dataSrc.data.slice().sort((a, b) => {
      const isAsc = event.direction === 'asc';
      switch (event.active) {
        case 'name': return compare(a.name, b.name, isAsc);
        case 'size': return compare(a.size, b.size, isAsc);
        case 'isDir': return compare(a.isDir, b.isDir, isAsc);
        default: return 0;
      }
    });
  }

  toggleShowHiddenFiles(checked: boolean) {
    this.showHiddenFiles = checked;
    this.dataSrc.data = this.tableData();
  }

  rm(event: any, target: TableFileData) {
    event.stopPropagation();
    this.contextMenu.closeMenu();
    const dialogRef = this.dialog.open(RmDialogComponent, {
      data: {
        cwd: this.ls.getPath(),
        name: target.name,
        isDir: target.isDir
      }
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      if (result) {
        await this._sliverService.rm(this.session.getId(), result.name);
        this.fetchLs('.');
      }
    });
  }

  mkdir() {
    const dialogRef = this.dialog.open(MkdirDialogComponent);
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      if (result) {
        await this._sliverService.mkdir(this.session.getId(), result.name);
        this.fetchLs('.');
      }
    });
  }

  async download(target: TableFileData) {
    this.contextMenu.closeMenu();
    this.working = true;
    const data = await this._sliverService.download(this.session.getId(), target.name);
    this.working = false;
    const msg = `Save downloaded file: ${target.name}`;
    const save = await this._clientService.saveFile('Save File', msg, target.name, data);
  }

  async upload() {
    this.working = true;
    try {
      await this._sliverService.upload(this.session.getId(), this.ls.getPath());
      setTimeout(() => {
        this.working = false;
        this.fetchLs('.');
      }, 50); // 50ms margin of error to avoid races with remote file system
    } catch (err) {
      this.working = false;
    }
  }

  async openFile(target: TableFileData) {
    this.contextMenu.closeMenu();
    this.working = true;
    const data = await this._sliverService.download(this.session.getId(), target.name);
    this.working = false;
  }

  onContextMenu(event: MouseEvent, row: TableFileData) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { 'item': row };
    this.contextMenu.openMenu();
  }

}


@Component({
  selector: 'sessions-mkdir-dialog',
  templateUrl: 'mkdir-dialog.html',
})
export class MkdirDialogComponent implements OnInit {

  result: any;

  constructor(public dialogRef: MatDialogRef<MkdirDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.result = this.data;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}


@Component({
  selector: 'sessions-rm-dialog',
  templateUrl: 'rm-dialog.html',
})
export class RmDialogComponent {

  isConfirmed = false;
  confirmName = '';

  constructor(public dialogRef: MatDialogRef<RmDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  checkConfirmed() {
    this.isConfirmed = this.confirmName === this.data.name && this.data.name !== '';
  }

}


@Component({
  selector: 'sessions-download-dialog',
  templateUrl: 'download-dialog.html',
})
export class DownloadDialogComponent {

  constructor(public dialogRef: MatDialogRef<DownloadDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
