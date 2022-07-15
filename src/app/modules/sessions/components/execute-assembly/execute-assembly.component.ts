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
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs/operators';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb';

import { LibraryDialogComponent, RenameDialogComponent } from '@app/modules/sessions/components/dialogs/dialogs.component';
import { TerminalService, SliverTerminal } from '@app/providers/terminal.service';
import { LibraryService, LibraryItem } from '@app/providers/library.service';
import { SliverService } from '@app/providers/sliver.service';
import { Colors } from '@app/modules/terminal/colors';
import { FadeInOut } from '@app/shared';


@Component({
  selector: 'sessions-execute-assembly',
  templateUrl: './execute-assembly.component.html',
  styleUrls: ['./execute-assembly.component.scss'],
  animations: [FadeInOut]
})
export class ExecuteAssemblyComponent implements OnInit {

  private readonly TERM_NAMESPACE = 'ExecuteAssemblyComponent';
  private readonly LIBRARY_NAME = 'dotnet';

  assemblies: LibraryItem[];

  @Input() selectAfterAdding = true;
  selected = new UntypedFormControl(0);

  session: clientpb.Session;
  executeAssemblyForm: UntypedFormGroup;

  constructor(private _route: ActivatedRoute,
              public dialog: MatDialog,
              private _fb: UntypedFormBuilder,
              private _terminalService: TerminalService,
              private _libraryService: LibraryService,
              private _sliverService: SliverService) { }

  ngOnInit(): void {
    this._route.parent.params.pipe(take(1)).subscribe(params => {
      const sessionId: string = params['session-id'];
      this._sliverService.sessionById(sessionId).then(session => {
        this.session = session;
        this.fetchDotNetItems();
      }).catch(err => {
        console.error(`No session with id ${sessionId} (${err})`);
      });
    });
    this.executeAssemblyForm = this._fb.group({
      assembly: ['', Validators.required],
      args: [''],
      process: ['notepad.exe', Validators.required],
      amsi: [true],
      etw: [false],
    });
  }

  get terminals(): SliverTerminal[] {
    return this._terminalService.getNamespaceTerminals(this.session.getId(), this.namespace);
  }

  get namespace(): string {
    return this.TERM_NAMESPACE;
  }

  async fetchDotNetItems() {
    this.assemblies = await this._libraryService.items(this.LIBRARY_NAME);
  }

  async manageAssemblies() {
    const dialogRef = this.dialog.open(LibraryDialogComponent, {
      width: '50%',
      data: {
        title: '.NET Library',
        libraryName: this.LIBRARY_NAME,
      },
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe(() => {
      this.fetchDotNetItems();
    });
  }

  async execute() {
    const form = this.executeAssemblyForm.value;
    try {
      const executed = await this._sliverService.executeAssembly(this.session.getId(), this.LIBRARY_NAME, form.assembly, form.args, form.process, form.amsi, form.etw);
      this.displayOutput(executed);
    } catch(err) {
      this.displayError(err);
    } 
  }

  displayOutput(executed: sliverpb.ExecuteAssembly) {
    const term = this._terminalService.newTerminal(this.session.getId(), this.namespace);
    term.terminal.write(executed.getOutput());
    if (this.selectAfterAdding) {
      this.selected.setValue(this.terminals.length - 1);
    }
  }

  displayError(err) {
    const term = this._terminalService.newTerminal(this.session.getId(), this.namespace);
    term.terminal.write(`${Colors.Red}${err}${Colors.Reset}`);
    if (this.selectAfterAdding) {
      this.selected.setValue(this.terminals.length - 1);
    }
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
