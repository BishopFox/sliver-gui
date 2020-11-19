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

  genTargetForm: FormGroup;
  formSub: Subscription;
  compileTimeOptionsForm: FormGroup;

  jobs: clientpb.Job[];
  jobsSubscription: Subscription;
  listeners: Listener[];

  constructor(private _fb: FormBuilder,
              private _eventsService: EventsService,
              private _jobsService: JobsService) { }

  ngOnInit() {

    this.genTargetForm = this._fb.group({
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

    this.formSub = this.genTargetForm.controls['os'].valueChanges.subscribe((os) => {
      if (os !== 'windows') {
        this.genTargetForm.controls['format'].setValue('exe');
      }
    });

    this.compileTimeOptionsForm = this._fb.group({
      reconnect: [60],
      maxErrors: [1000],
      skipSymbols: [false],
      debug: [false],
    });

    this.fetchJobs();
    this.jobsSubscription = this._eventsService.jobs$.subscribe(this.fetchJobs);
  }

  ngOnDestroy() {
    if (this.formSub) {
      this.formSub.unsubscribe();
    }
    if (this.jobsSubscription) {
      this.jobsSubscription.unsubscribe();
    }
  }

  async fetchJobs() {
    const jobs = await this._jobsService.jobs();
    this.listeners = [];
    for (let index = 0; index < jobs.length; ++index) {
      if (jobs[index].getName().toLowerCase() === 'grpc') {
        continue;
      }
      this.listeners.push({
        job: jobs[index],
        checked: false,
      });
    }
  }

  get C2s(): C2[] {
    const c2s = [];

    return c2s;
  }

  isValidC2Config(): boolean {
    return this.C2s?.length ? true : false;
  }

  get mtlsEndpoints(): C2[] {
    return [];
  }

  parseURLs(value: string): URL[] {
    const urls: URL[] = [];
    try {
      value.split(',').forEach((rawValue) => {
        if (rawValue === '') {
          return;
        }
        if (rawValue.indexOf('://') !== -1) {
          rawValue = rawValue.slice(rawValue.indexOf('://') + 3, rawValue.length);
        }
        // Basically because JavaScript is a total piece of shit language, if the
        // url is not prefixed with "http" it won't be parsed correctly. Because
        // why would you ever want to parse a non-HTTP URL? Do those even exist?
        const url: URL = new URL(`http://${rawValue}`);
        urls.push(url);
      });
    } catch (err) {
      console.error(err);
    }
    return urls;
  }

  emitImplantConfig() {
    console.log(`Emit ImplantConfig`);
  }

}
