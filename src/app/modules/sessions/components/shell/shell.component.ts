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


import { Component, OnInit, ViewChildren, Input, QueryList, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import { SliverService } from '@app/providers/sliver.service';
import { ShellService, Shell } from '@app/providers/shell.service';
import { RenameDialogComponent } from '@app/modules/sessions/components/dialogs/dialogs.component';
import { NgTerminalComponent } from '@app/modules/terminal/ng-terminal.component';
import { FadeInOut } from '@app/shared';


@Component({
  selector: 'sessions-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  animations: [FadeInOut]
})
export class ShellComponent implements OnInit {

  @Input() selectAfterAdding = true;
  session: clientpb.Session;
  textEncoder = new TextEncoder();
  selected = new UntypedFormControl(0);
  @ViewChildren(NgTerminalComponent) terminalChildren!: QueryList<NgTerminalComponent>;

  constructor(public dialog: MatDialog,
              private _route: ActivatedRoute,
              private _sliverService: SliverService,
              private _shellService: ShellService) { }

  ngOnInit() {
    this._route.parent.params.pipe(take(1)).subscribe(params => {
      const sessionId: string = params['session-id'];
      this._sliverService.sessionById(sessionId).then(session => {
        this.session = session;
      }).catch(err => {
        console.error(`No session with id ${sessionId} (${err})`);
      });
    });
  }

  get shells(): Shell[] {
    return this._shellService.getOpenShells();
  }

  onKeyEvent(event, shell: Shell) {
    shell.tunnel.stdin.next(this.textEncoder.encode(event.key));
  }

  jumpToTop() {
    const selectedShell = this.shells[this.selected?.value];
    if (selectedShell) {
      selectedShell.terminal.scrollToTop();
    }
  }

  jumpToBottom() {
    const selectedShell = this.shells[this.selected?.value];
    if (selectedShell) {
      selectedShell.terminal.scrollToBottom();
    }
  }

  copyScrollback() {
    const selectedShell = this.shells[this.selected?.value];
    if (selectedShell) {
      selectedShell.terminal.selectAll();
      document.execCommand('copy');
      selectedShell.terminal.clearSelection();
    }
  }

  renameTab() {
    const selectedShell = this.shells[this.selected?.value];
    if (selectedShell) {
      const dialogRef = this.dialog.open(RenameDialogComponent, {
        width: '40%',
        data: selectedShell.name,
      });
      dialogRef.afterClosed().pipe(take(1)).subscribe(name => {
        if (name) {
          selectedShell.name = name;
        }
      });
    }
  }

  async addDefaultShell() {
    const pty = !this.isShittyOperatingSystem();
    await this._shellService.openShell(this.session.getId(), '', pty);
    if (this.selectAfterAdding) {
      this.selected.setValue(this.shells.length - 1);
      const selectedShell = this.shells[this.selected?.value];
      selectedShell.name = `${this.session.getUsername()}@${this.session.getRemoteaddress()} (${this.shells.length})`;
    }
  }

  addCustomShell() {
    const dialogRef = this.dialog.open(ShellCustomDialogComponent, {
      width: '40%',
      data: {
        session: this.session,
      }
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (customShell) => {
      if (!customShell) {
        return;
      }
      await this._shellService.openShell(this.session.getId(), customShell.path, customShell.pty);
      if (this.selectAfterAdding) {
        this.selected.setValue(this.shells.length - 1);
        const selectedShell = this.shells[this.selected?.value];
        selectedShell.name = `${this.session.getUsername()}@${this.session.getRemoteaddress()} (${this.shells.length})`;
      }
    });
  }

  removeTab(shell: Shell) {
    if (shell) {
      const dialogRef = this.dialog.open(ShellCloseDialogComponent);
      dialogRef.afterClosed().pipe(take(1)).subscribe(confirm => {
        if (confirm) {
          shell.tunnel.stdin.complete();
        }
      });
    }
  }

  isShittyOperatingSystem() {
    return this.session.getOs().toLowerCase() === 'windows';
  }

}


@Component({
  selector: 'session-shell-close-dialog',
  templateUrl: './shell-close.dialog.html',
})
export class ShellCloseDialogComponent {

  constructor(public dialogRef: MatDialogRef<ShellCloseDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  complete() {
    this.dialogRef.close(true);
  }

}

@Component({
  selector: 'session-shell-custom-dialog',
  templateUrl: './shell-custom.dialog.html',
})
export class ShellCustomDialogComponent implements OnInit {

  customShellForm: UntypedFormGroup;

  constructor(public dialogRef: MatDialogRef<ShellCustomDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private _fb: UntypedFormBuilder) { }

  ngOnInit(): void {
    const defaultPty = !this.isWindows();
    const defaultShellPath = this.defaultShellPath();
    this.customShellForm = this._fb.group({
      path: [defaultShellPath, Validators.compose([
        Validators.required,
      ])],
      pty: [defaultPty],
    });
  }

  defaultShellPath(): string {
    if (this.isWindows()) {
      return 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
    } else {
      return '/bin/bash';
    }
  }

  isWindows(): boolean {
    return this.data.session.getOs().toLowerCase() === 'windows';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  complete() {
    this.dialogRef.close(this.customShellForm.value);
  }

}