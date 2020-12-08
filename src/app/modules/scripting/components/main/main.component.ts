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
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { WorkersService } from '@app/providers/workers.service';
import { FadeInOut } from '@app/shared/animations';


@Component({
  selector: 'scripting',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  animations: [FadeInOut]
})
export class MainComponent implements OnInit {

  constructor(public dialog: MatDialog,
              private _router: Router,
              private _workerService: WorkersService) { }

  ngOnInit(): void {

  }

  createNewScript() {
    const dialogRef = this.dialog.open(NewScriptDialogComponent);
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      if (result) {
        this.newScript(result);
      }
    });
  }

  private async newScript(name: string) {
    console.log(`Create new script ${name}`);
    const scriptId = await this._workerService.newScript(name, '\n\n\n');
    this._router.navigate(['scripting', 'editor', scriptId]);
  }

}



@Component({
  selector: 'scripting-new-script-dialog',
  templateUrl: 'new-script.dialog.html',
})
export class NewScriptDialogComponent implements OnInit {

  result: any;

  constructor(public dialogRef: MatDialogRef<NewScriptDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.result = this.data;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
