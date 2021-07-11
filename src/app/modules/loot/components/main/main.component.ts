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

import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClientService, ReadFiles } from '@app/providers/client.service';
import { SliverService } from '@app/providers/sliver.service';
import { FadeInOut } from '@app/shared/animations';
import { take } from 'rxjs/operators';


@Component({
  selector: 'loot-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  animations: [FadeInOut]
})
export class MainComponent implements OnInit {

  constructor(public dialog: MatDialog,
              private _sliverService: SliverService,
              private _clientService: ClientService) { }

  ngOnInit(): void { }

  async addFile() {
    const dialogRef = this.dialog.open(LootAddFileDialogComponent);
    dialogRef.afterClosed().pipe(take(1)).subscribe(async result => {
      console.log(result);
    });
  }

  async addCredential() {
    const dialogRef = this.dialog.open(LootAddCredentialDialogComponent);
    dialogRef.afterClosed().pipe(take(1)).subscribe(async result => {
      console.log(result);
    });
  }

}


@Component({
  selector: 'loot-add-file-dialog',
  templateUrl: './add-file.dialog.html',
})
export class LootAddFileDialogComponent implements OnInit {

  addFile: FormGroup;
  readFiles: ReadFiles = null;

  constructor(public dialogRef: MatDialogRef<LootAddFileDialogComponent>,
              private _fb: FormBuilder,
              private _clientService: ClientService,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.addFile = this._fb.group({
      name: ['', Validators.compose([
        Validators.required,
      ])],
      fileType: ['text', Validators.compose([
        Validators.required,
      ])]
    });
  }

  async selectFile() {
    this.readFiles = await this._clientService.readFile('', 'Select a file to add as loot', false, true);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  complete() {
    this.dialogRef.close({
      form: this.addFile.value,
      files: this.readFiles.files,
    });
  }

}


@Component({
  selector: 'loot-add-credential-dialog',
  templateUrl: './add-credential.dialog.html',
})
export class LootAddCredentialDialogComponent implements OnInit {

  readonly USER_PASSWORD = 'user-password';
  readonly API_KEY = 'api-key';
  
  addCredential: FormGroup;
  credentialType: string = this.USER_PASSWORD;
  user: string = '';
  password: string = '';
  apiKey: string = '';

  constructor(public dialogRef: MatDialogRef<LootAddCredentialDialogComponent>,
              private _fb: FormBuilder,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.addCredential = this._fb.group({
      name: ['', Validators.compose([
        Validators.required,
      ])]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  complete() {
    this.dialogRef.close(this.addCredential.value);
  }

}