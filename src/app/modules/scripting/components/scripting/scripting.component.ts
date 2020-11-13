import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { WorkersService } from '@app/providers/workers.service';
import { FadeInOut } from '@app/shared/animations';


@Component({
  selector: 'scripting',
  templateUrl: './scripting.component.html',
  styleUrls: ['./scripting.component.scss'],
  animations: [FadeInOut]
})
export class ScriptingComponent implements OnInit {

  constructor(public dialog: MatDialog,
              private _router: Router,
              private _workerService: WorkersService) { }

  ngOnInit(): void {

  }

  createNewScript() {
    const dialogRef = this.dialog.open(NewScriptDialogComponent);
    dialogRef.afterClosed().subscribe(async (result) => {
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
