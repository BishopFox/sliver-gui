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
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs/operators';
import * as shlex from 'shlex';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb';

import { SliverService } from '@app/providers/sliver.service';
import { TerminalService, SliverTerminal } from '@app/providers/terminal.service';
import { FadeInOut } from '@app/shared';


@Component({
  selector: 'sessions-execute-command',
  templateUrl: './execute-command.component.html',
  styleUrls: ['./execute-command.component.scss'],
  animations: [FadeInOut]
})
export class ExecuteCommandComponent implements OnInit {

  private readonly TERM_NAMESPACE = 'ExecuteCommandComponent';

  @Input() selectAfterAdding = true;

  command: string;
  session: clientpb.Session;
  selected = new FormControl(0);
  commandForm: FormGroup;

  constructor(private _route: ActivatedRoute,
              private _fb: FormBuilder,
              private _terminalService: TerminalService,
              private _sliverService: SliverService) { }

  ngOnInit() {
    this._route.parent.params.pipe(take(1)).subscribe(params => {
      const sessionId: number = parseInt(params['session-id'], 10);
      this._sliverService.sessionById(sessionId).then(session => {
        this.session = session;
      }).catch(err => {
        console.error(`No session with id ${sessionId} (${err})`);
      });
    });
    this.commandForm = this._fb.group({
      cmd: ['', Validators.required],
      output: [true, Validators.required],
    });
  }

  get terminals(): SliverTerminal[] {
    return this._terminalService.getNamespaceTerminals(this.session.getId(), this.namespace);
  }

  get namespace(): string {
    return this.TERM_NAMESPACE;
  }

  async execute() {
    const output = this.commandForm.controls['output'].value;
    let args = shlex.split(this.commandForm.controls['cmd'].value);
    if (1 <= args.length) {
      const exe = args[0];
      args = args.splice(1, args.length);
      console.log(`exe: ${exe} args: ${args}`);
      const executed = await this._sliverService.execute(this.session.getId(), exe, args);
      if (output) {
        this.captureOutput(executed);
      }
    } else {
      this.commandForm.controls['cmd'].setErrors({
        invalidCommand: "Must specify a subprocess",
      });
    }
  }

  captureOutput(executed: sliverpb.Execute) {
    const term = this._terminalService.newTerminal(this.session.getId(), this.namespace);
    console.log(`status: ${executed.getStatus()}`);
    console.log(`result: ${executed.getResult()}`);
    if (executed.getStatus() === 0) {
      term.terminal.write(executed.getResult());
    } else {
      term.terminal.write(`Exit code: ${executed.getStatus()}`);
    }
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

  removeTab() {
    if (this.terminals.length) {
      const term = this.terminals[this.selected?.value];
      this._terminalService.delete(this.session.getId(), this.namespace, term.id);
    }
  }

}
