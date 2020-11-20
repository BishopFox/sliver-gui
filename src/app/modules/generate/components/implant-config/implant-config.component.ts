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

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf

import { FadeInOut } from '@app/shared/animations';
import { JobsService } from '@app/providers/jobs.service';
import { EventsService } from '@app/providers/events.service';


interface Listener {
  job: clientpb.Job;
  checked: boolean;
}

interface C2 {
  protocol: string;
  domains: string[];
  lport: number;
}


@Component({
  selector: 'generate-implant-config',
  templateUrl: './implant-config.component.html',
  styleUrls: ['./implant-config.component.scss'],
  animations: [FadeInOut]
})
export class ImplantConfigComponent implements OnInit, OnDestroy {

  @Output() onImplantConfigEvent = new EventEmitter<clientpb.ImplantConfig>();

  targetForm: FormGroup;
  targetFormSub: Subscription;
  compileTimeForm: FormGroup;

  c2s: clientpb.ImplantC2[] = [];

  constructor(private _fb: FormBuilder,
              private _eventsService: EventsService,
              private _jobsService: JobsService) { }

  ngOnInit() {
    this.targetForm = this._fb.group({
      os: ['windows', Validators.compose([
        Validators.required,
      ])],
      arch: ['amd64', Validators.compose([
        Validators.required,
      ])],
      format: ['exe', Validators.compose([
        Validators.required,
      ])],
    });
    this.targetFormSub = this.targetForm.controls['os'].valueChanges.subscribe((os) => {
      if (os !== 'windows') {
        this.targetForm.controls['format'].setValue('exe');
      }
    });

    this.compileTimeForm = this._fb.group({
      reconnect: [60],
      maxErrors: [1000],
      skipSymbols: [false],
      debug: [false],
    });
  }

  ngOnDestroy() {
    if (this.targetFormSub) {
      this.targetFormSub.unsubscribe();
    }
  }

  onC2sUpdate(c2s: clientpb.ImplantC2[]) {
    this.c2s = c2s;
  }

  isValidC2Config(): boolean {
    return this.c2s?.length ? true : false;
  }

  getOs(): string {
    return String(this.targetForm.controls['os'].value);
  }

  getArch(): string {
    return String(this.targetForm.controls['arch'].value);
  }

  getFormat(): any {
    switch (String(this.targetForm.controls['format'].value).toLowerCase()) {
      case 'exe':
        return clientpb.ImplantConfig.OutputFormat.EXECUTABLE;
      case 'shared':
        return clientpb.ImplantConfig.OutputFormat.SHARED_LIB;
      case 'shellcode':
        return clientpb.ImplantConfig.OutputFormat.SHELLCODE;
      default:
        return clientpb.ImplantConfig.OutputFormat.EXECUTABLE;
    }
  }

  getReconnect(): number {
    return this.compileTimeForm.controls['reconnect'].value;
  }

  getMaxErrors(): number {
    return this.compileTimeForm.controls['maxErrors'].value;
  }

  getSkipSymbols(): boolean {
    return this.compileTimeForm.controls['skipSymbols'].value;
  }

  getDebug(): boolean {
    return this.compileTimeForm.controls['debug'].value;
  }

  emitImplantConfig() {
    const implantConfig = new clientpb.ImplantConfig();

    // Target values
    implantConfig.setGoos(this.getOs());
    implantConfig.setGoarch(this.getArch());
    implantConfig.setFormat(this.getFormat());

    // Compile time values
    implantConfig.setReconnectinterval(this.getReconnect());
    implantConfig.setMaxconnectionerrors(this.getMaxErrors());
    implantConfig.setObfuscatesymbols(this.getSkipSymbols());
    implantConfig.setDebug(this.getDebug());

    implantConfig.setC2List(this.c2s);
    console.log(implantConfig);
    this.onImplantConfigEvent.emit(implantConfig);
  }

}
