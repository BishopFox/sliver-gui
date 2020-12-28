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


import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb';


import { LibraryService, LibraryItem } from '@app/providers/library.service';
import { LibraryDialogComponent, RenameDialogComponent } from '@app/modules/sessions/components/dialogs/dialogs.component';
import { SliverService } from '@app/providers/sliver.service';
import { Colors } from '@app/modules/terminal/colors';
import { TerminalService, SliverTerminal } from '@app/providers/terminal.service';
import { FadeInOut } from '@app/shared';


@Component({
  selector: 'sessions-execute-shellcode',
  templateUrl: './execute-shellcode.component.html',
  styleUrls: ['./execute-shellcode.component.scss'],
  animations: [FadeInOut]
})
export class ExecuteShellcodeComponent implements OnInit {

  private readonly TERM_NAMESPACE = 'ExecuteShellcodeComponent';
  private readonly LIBRARY_NAME = 'shellcode';

  @Input() selectAfterAdding = true;

  session: clientpb.Session;
  selected = new FormControl(0);
  shellcodeForm: FormGroup;
  shellcodes: LibraryItem[];

  constructor(private _route: ActivatedRoute,
              private _fb: FormBuilder,
              public dialog: MatDialog,
              private _libraryService: LibraryService,
              private _terminalService: TerminalService,
              private _sliverService: SliverService) { }

  ngOnInit(): void {
    this._route.parent.params.pipe(take(1)).subscribe(params => {
      const sessionId: number = parseInt(params['session-id'], 10);
      this._sliverService.sessionById(sessionId).then(session => {
        this.session = session;
        this.fetchShellcode();
      }).catch(err => {
        console.error(`No session with id ${sessionId} (${err})`);
      });
    });

    this.shellcodeForm = this._fb.group({
      shellcode: ['', Validators.required],
      process: ['notepad.exe', Validators.required],
      rwx: [false],
      interactive: [false],
    });
  }

  get terminals(): SliverTerminal[] {
    return this._terminalService.getNamespaceTerminals(this.session.getId(), this.namespace);
  }

  get namespace(): string {
    return this.TERM_NAMESPACE;
  }

  async fetchShellcode() {
    this.shellcodes = await this._libraryService.items(this.LIBRARY_NAME);
  }

  async execute() {

  }

  async manageShellcode() {
    const dialogRef = this.dialog.open(LibraryDialogComponent, {
      width: '50%',
      data: {
        title: "Shellcode Library",
        libraryName: this.LIBRARY_NAME,
      },
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe(() => {
      this.fetchShellcode();
    });
  }

  jumpToTop() {
    const term = this.terminals[this.selected?.value];
    if (term) {
      term.terminal.scrollToTop();
    }
  }

  jumpToBottom() {
    const term = this.terminals[this.selected?.value];
    if (term) {
      term.terminal.scrollToBottom();
    }
  }

  copyScrollback() {
    const term = this.terminals[this.selected?.value];
    if (term) {
      term.terminal.selectAll();
      document.execCommand('copy');
      term.terminal.clearSelection();
    }
  }

  renameTab() {
    const selected = this.terminals[this.selected?.value];
    if (selected) {
      const dialogRef = this.dialog.open(RenameDialogComponent, {
        width: '40%',
        data: selected.name,
      });
      dialogRef.afterClosed().pipe(take(1)).subscribe(name => {
        if (name) {
          selected.name = name;
        }
      });
    }
  }

  removeTab(term: SliverTerminal) {
    if (this.terminals.length) {
      this._terminalService.delete(this.session.getId(), this.namespace, term.id);
    }
  }

}
