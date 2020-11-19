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
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
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

  @Input() c2s: clientpb.ImplantC2[] = [];
  @Input() title = true;
  @Input() editable = true;
  @Input() displayedColumns: string[] = [
    'priority', 'url',
  ];
  @Output() onC2sUpdateEvent = new EventEmitter<clientpb.ImplantC2[]>();

  table: TableSessionData[];
  dataSrc: MatTableDataSource<TableSessionData>;
  
  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
    this.refreshTable();
  }

  refreshTable() {
    this.dataSrc = new MatTableDataSource(this.tableData());
    this.onC2sUpdateEvent.emit(this.c2s);
  }

  tableData(): TableSessionData[] {
    this.table = [];
    for (let index = 0; index < this.c2s.length; index++) {
      const c2 = this.c2s[index];
      console.log(`${index}: ${c2}`);
      c2.setPriority(index);
      this.table.push({
        priority: c2.getPriority(),
        url: c2.getUrl(),
      });
    }
    return this.table
  }

  onListDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.c2s, event.previousIndex, event.currentIndex);
    this.refreshTable();
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  onRowSelection(row: any) {
    
  }

  addMtls() {
    const dialogRef = this.dialog.open(AddMTLSDialogComponent);
    dialogRef.afterClosed().subscribe(async (result: clientpb.ImplantC2|null) => {
      if (result) {
        this.c2s.push(result);
        this.refreshTable();
      }
    });
  }

  addHttp() {
    const dialogRef = this.dialog.open(AddHTTPDialogComponent);
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.c2s.push(result);
        this.refreshTable();
      }
    });
  }

  addDns() {
    const dialogRef = this.dialog.open(AddDNSDialogComponent);
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.c2s.push(result);
        this.refreshTable();
      }
    });
  }

}


class BaseC2Validators {

  validatePort(control: AbstractControl): {[key: string]: any} | null {
    const port = parseInt(control.value);
    const invalid = port < 1 || 65535 < port ? true : false;
    return invalid ? {badPortNumber: {value: control.value}} : null;
  }

  validateHost(control: AbstractControl): {[key: string]: any} | null {
    const host = String(control.value).trim();
    if (host.length < 1) {
      return {badHostLength: {value: control.value}};
    }
    if (!RegExp('^[a-zA-Z0-9\.\-]*$').test(host)) {
      return {badHostPattern: {value: control.value}};
    }
    return null;
  }
}

@Component({
  selector: 'generate-add-mtls-dialog',
  templateUrl: 'add-mtls.dialog.html',
})
export class AddMTLSDialogComponent extends BaseC2Validators implements OnInit {

  mtlsForm: FormGroup;

  constructor(public dialogRef: MatDialogRef<AddMTLSDialogComponent>,
              private _fb: FormBuilder,
              @Inject(MAT_DIALOG_DATA) public data: any)
  { 
    super();
  }

  ngOnInit() {
    this.mtlsForm = this._fb.group({
      host: ['', Validators.compose([
        Validators.required, this.validateHost,
      ])],
      port: [8888, Validators.compose([
        Validators.required, this.validatePort,
      ])]
    });
  }

  getHost(): string {
    return String(this.mtlsForm.controls['host'].value).trim();
  }

  getPort(): number {
    return parseInt(this.mtlsForm.controls['port'].value);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  complete(): void {
    const host = this.getHost();
    const port = this.getPort();
    
    // There's just no good way to programmatically build a URL in JavaScript
    // because JavaScript is a *fucking awful* programming language.
    const c2 = new clientpb.ImplantC2();
    c2.setUrl(`mtls://${host}:${port}`);
    this.dialogRef.close(c2);
  }

}

@Component({
  selector: 'generate-add-http-dialog',
  templateUrl: 'add-http.dialog.html',
})
export class AddHTTPDialogComponent extends BaseC2Validators implements OnInit {

  httpForm: FormGroup;

  constructor(public dialogRef: MatDialogRef<AddHTTPDialogComponent>,
              private _fb: FormBuilder,
              @Inject(MAT_DIALOG_DATA) public data: any)
  {
    super();
  }

  ngOnInit() {
    this.httpForm = this._fb.group({
      host: ['', Validators.compose([
        Validators.required, this.validateHost,
      ])],
      port: [8888, Validators.compose([
        Validators.required, this.validatePort,
      ])]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

@Component({
  selector: 'generate-add-dns-dialog',
  templateUrl: 'add-dns.dialog.html',
})
export class AddDNSDialogComponent extends BaseC2Validators implements OnInit {

  dnsForm: FormGroup;

  constructor(public dialogRef: MatDialogRef<AddDNSDialogComponent>,
              private _fb: FormBuilder,
              @Inject(MAT_DIALOG_DATA) public data: any)
  {
    super();
  }

  ngOnInit() {
    this.dnsForm = this._fb.group({
      host: ['', Validators.compose([
        Validators.required, this.validateHost,
      ])],
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
