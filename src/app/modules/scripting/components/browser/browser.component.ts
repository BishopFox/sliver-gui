import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';

import { WorkersService } from '@app/providers/workers.service'
import { FadeInOut } from '@app/shared/animations';

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
  styleUrls: ['./browser.component.scss'],
  animations: [FadeInOut],
})
export class BrowserComponent implements OnInit {

  scripts: any;
  dataSrc: MatTableDataSource<TableSessionData>;
  displayedColumns: string[] = [
    'name'
  ];

  constructor(public dialog: MatDialog,
              private _router: Router,
              private _workerService: WorkersService) { }

  ngOnInit(): void {
    this.fetchScripts();
  }

  async fetchScripts() {
    this.scripts = await this._workerService.listScripts();
    console.log(typeof this.scripts);
    this.dataSrc = new MatTableDataSource(this.tableData(this.scripts));
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

  tableData(scripts): TableSessionData[] {
    const table: TableSessionData[] = [];
    for (const [id, name] of Object.entries(scripts)) {
      console.log(id, name);
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
