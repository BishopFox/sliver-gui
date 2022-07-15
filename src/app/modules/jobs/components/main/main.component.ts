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
import { Router } from '@angular/router';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { take } from 'rxjs/operators';
import { JobsService } from '@app/providers/jobs.service';


@Component({
  selector: 'jobs-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  constructor(public dialog: MatDialog,
              private _router: Router,
              private _jobsService: JobsService) { }

  ngOnInit(): void { }

  startC2Listener() {
    this._router.navigate(['jobs', 'start-c2-listener']);
  }

  startStageListener() {
    this._router.navigate([]);
  }

  addWebsite() {
    const dialogRef = this.dialog.open(AddWebsiteDialogComponent);
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      if (result) {
        const website = await this._jobsService.addWebsite(result.name);
        this._router.navigate(['jobs', 'websites', website.getName()]);
      }
    });
  }

}


@Component({
  selector: 'jobs-add-website-dialog',
  templateUrl: './add-website.dialog.html',
})
export class AddWebsiteDialogComponent implements OnInit {

  addWebsiteForm: UntypedFormGroup;

  constructor(public dialogRef: MatDialogRef<AddWebsiteDialogComponent>,
              private _fb: UntypedFormBuilder,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.addWebsiteForm = this._fb.group({
      name: ['', Validators.compose([
        Validators.required,
      ])]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  complete() {
    this.dialogRef.close(this.addWebsiteForm.value);
  }

}