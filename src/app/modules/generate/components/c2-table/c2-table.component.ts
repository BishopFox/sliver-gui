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

import { Component, EventEmitter, Input, OnInit, Output, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FadeInOut } from '@app/shared/animations';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf

interface TableSessionData {
  priority: number;
  url: string;
}


@Component({
  selector: 'generate-c2-table',
  templateUrl: './c2-table.component.html',
  styleUrls: ['./c2-table.component.scss'],
  animations: [FadeInOut]
})
export class C2TableComponent implements OnInit {

  @Input() initC2s: clientpb.ImplantC2[] = [];
  @Input() title = false;
  @Input() editable = true;
  @Input() displayedColumns: string[] = [
    'priority', 'url',
  ];
  @Output() onC2sUpdate = new EventEmitter<clientpb.ImplantC2[]>();

  table: TableSessionData[];
  dataSrc: MatTableDataSource<TableSessionData>;
  
  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
    this.dataSrc = new MatTableDataSource(this.tableData(this.initC2s));
  }

  tableData(c2s: clientpb.ImplantC2[]): TableSessionData[] {
    this.table = [];
    for (let index = 0; index < c2s.length; index++) {
      const c2 = c2s[index];
      c2.setPriority(index);
      this.table.push({
        priority: c2.getPriority(),
        url: c2.getUrl(),
      });
    }
    return this.table.sort((a, b) => (a.priority > b.priority) ? 1 : -1);
  }

  drop(event: CdkDragDrop<string[]>) {
    console.log(event);
    moveItemInArray(this.table, event.previousIndex, event.currentIndex);
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  onRowSelection(row: any) {
    
  }

}

@Component({
  selector: 'generate-add-mtls-dialog',
  templateUrl: 'add-mtls.dialog.html',
})
export class AddMTLSDialogComponent {

  constructor(public dialogRef: MatDialogRef<AddMTLSDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

@Component({
  selector: 'generate-add-http-dialog',
  templateUrl: 'add-http.dialog.html',
})
export class AddHTTPDialogComponent {

  constructor(public dialogRef: MatDialogRef<AddHTTPDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

@Component({
  selector: 'generate-add-dns-dialog',
  templateUrl: 'add-dns.dialog.html',
})
export class AddDNSDialogComponent {

  constructor(public dialogRef: MatDialogRef<AddDNSDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
