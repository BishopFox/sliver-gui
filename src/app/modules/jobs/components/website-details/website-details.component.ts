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

import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import { FadeInOut } from '@app/shared/animations';
import { JobsService } from '@app/providers/jobs.service';


@Component({
  selector: 'jobs-website-details',
  templateUrl: './website-details.component.html',
  styleUrls: ['./website-details.component.scss'],
  animations: [FadeInOut]
})
export class WebsiteDetailsComponent implements OnInit {

  name: string;
  website: clientpb.Website;

  constructor(public dialog: MatDialog,
              private _router: Router,
              private _route: ActivatedRoute,
              private _jobsService: JobsService) { }

  ngOnInit(): void {
    this._route.params.pipe(take(1)).subscribe(params => {
      this.name = params['name'];
      this._jobsService.websiteByName(this.name).then(website => {
        this.website = website;
      }).catch((err) => {
        console.error(`Could not fetch website data ${err}`);
      });
    });
  }

  back() {
    window.history.back();
  }

  addFile() {
    const dialogRef = this.dialog.open(AddFileDialogComponent, {
      width: '40%'
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      console.log(result);
      if (result) {
        this.website = await this._jobsService.websiteAddContentFromFile(this.name, result.path, result.contentType);
      }
    });
  }

  addDirectory() {
    const dialogRef = this.dialog.open(AddDirectoryDialogComponent, {
      width: '40%'
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      console.log(result);
      if (result) {
        this.website = await this._jobsService.websiteAddContentFromDirectory(this.name, result.path);
      }
    });
  }

  deleteWebsite() {
    const dialogRef = this.dialog.open(DeleteWebsiteDialogComponent);
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      console.log(result);
      if (result) {
        await this._jobsService.removeWebsite(this.name);
        this._router.navigate(['jobs']);
      }
    });
  }

}

@Component({
  selector: 'jobs-add-file-dialog',
  templateUrl: './add-file.dialog.html',
})
export class AddFileDialogComponent {

  addFileForm: UntypedFormGroup;

  constructor(public dialogRef: MatDialogRef<AddFileDialogComponent>,
              private _fb: UntypedFormBuilder,
              @Inject(MAT_DIALOG_DATA) public data: any) { }


  ngOnInit() {
    this.addFileForm = this._fb.group({
      path: ['/', Validators.compose([
        Validators.required,
      ])],
      contentType: ['text/html; charset=utf-8', Validators.compose([
        Validators.required,
      ])]
    });
  }

  complete(): void {
    this.dialogRef.close(this.addFileForm.value);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

@Component({
  selector: 'jobs-add-directory-dialog',
  templateUrl: './add-directory.dialog.html',
})
export class AddDirectoryDialogComponent implements OnInit {

  addDirectoryForm: UntypedFormGroup;

  constructor(public dialogRef: MatDialogRef<AddDirectoryDialogComponent>,
              private _fb: UntypedFormBuilder,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.addDirectoryForm = this._fb.group({
      path: ['/', Validators.compose([
        Validators.required,
      ])]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  complete() {
    this.dialogRef.close(this.addDirectoryForm.value);
  }

}

@Component({
  selector: 'jobs-delete-website-dialog',
  templateUrl: './delete-website.dialog.html',
})
export class DeleteWebsiteDialogComponent {

  constructor(public dialogRef: MatDialogRef<DeleteWebsiteDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  complete() {
    this.dialogRef.close(true);
  }

}