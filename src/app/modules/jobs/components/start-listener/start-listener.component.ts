/*
  Sliver Implant Framework
  Copyright (C) 2019  Bishop Fox
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

import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import { FadeInOut } from '@app/shared/animations';
import { JobsService } from '@app/providers/jobs.service';
import { EventsService } from '@app/providers/events.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'jobs-start-listener',
  templateUrl: './start-listener.component.html',
  styleUrls: ['./start-listener.component.scss'],
  animations: [FadeInOut]
})
export class StartListenerComponent implements OnInit, OnDestroy {

  selectProtocolForm: FormGroup;
  mtlsOptionsForm: FormGroup;
  httpOptionsForm: FormGroup;
  httpsOptionsForm: FormGroup;
  dnsOptionsForm: FormGroup;

  websites: clientpb.Website[];
  websitesSub: Subscription;

  jobs: clientpb.Job[];
  jobsSub: Subscription;

  constructor(public dialog: MatDialog,
              private _router: Router,
              private _fb: FormBuilder,
              private _eventService: EventsService,
              private _jobsService: JobsService) { }

  ngOnInit() {
    this.fetchWebsites();
    this.websitesSub = this._eventService.websites$.subscribe(this.fetchWebsites.bind(this));
    this.fetchJobs();
    this.jobsSub = this._eventService.jobs$.subscribe(this.fetchJobs.bind(this));

    // Protocol selector
    this.selectProtocolForm = this._fb.group({
      protocol: ['mtls', Validators.required]
    });

    // Protocol-specific forms
    this.mtlsOptionsForm = this._fb.group({
      lport: [8888, Validators.compose([
        Validators.required, this.validatePort.bind(this),
      ])],
    });
    this.httpOptionsForm = this._fb.group({
      domains: ['', Validators.compose([
        this.validateDomains,
      ])],
      lport: [80, Validators.compose([
        Validators.required, this.validatePort.bind(this),
      ])],
      website: [''],
    });
    this.httpsOptionsForm = this._fb.group({
      domain: ['', Validators.compose([
        this.validateDomain
      ])],
      acme: [false],
      cert: [''],
      key: [''],
      lport: [443, Validators.compose([
        Validators.required, this.validatePort.bind(this),
      ])],
      website: [''],
    });
    this.dnsOptionsForm = this._fb.group({
      domains: ['', Validators.compose([
        Validators.required, this.validateDomains,
      ])],
      canarydomains: [false],
      lport: [53, Validators.compose([
        Validators.required, this.validatePort.bind(this),
      ])],
    });
  }

  ngOnDestroy(): void {
    this.websitesSub?.unsubscribe();
    this.jobsSub?.unsubscribe();
  }

  async fetchWebsites() {
    this.websites = await this._jobsService.websites();
  }

  async fetchJobs() {
    this.jobs = await this._jobsService.jobs();
    this.mtlsOptionsForm.controls['lport'].updateValueAndValidity();
    this.mtlsOptionsForm.controls['lport'].markAsTouched();
    this.httpOptionsForm.controls['lport'].updateValueAndValidity();
    this.httpOptionsForm.controls['lport'].markAsTouched();
    this.httpsOptionsForm.controls['lport'].updateValueAndValidity();
    this.httpsOptionsForm.controls['lport'].markAsTouched();
    this.dnsOptionsForm.controls['lport'].updateValueAndValidity();
    this.dnsOptionsForm.controls['lport'].markAsTouched();
  }

  get protocol(): string {
    return this.selectProtocolForm.controls.protocol.value;
  }

  async startListener() {
    let job: clientpb.Job;
    let form: any;
    try {
      switch (this.protocol) {

        case 'mtls':
          if (!this.mtlsOptionsForm.valid) {
            return this.invalidOptionDialog();
          }
          form = this.mtlsOptionsForm.value;
          job = await this._jobsService.startMTLSListener("", form.lport);
          break;
  
        case 'http':
          if (!this.httpOptionsForm.valid) {
            return this.invalidOptionDialog();
          }
          form = this.httpOptionsForm.value;
          job = await this._jobsService.startHTTPListener(form.domain, form.website, "", form.lport);
          break;
  
        case 'https':
          if (!this.httpsOptionsForm.valid) {
            return this.invalidOptionDialog();
          }
          form = this.httpsOptionsForm.value;
          job = await this._jobsService.startHTTPSListener(form.domain, form.website, form.acme, "", form.lport);
          break;
  
        case 'dns':
          if (!this.dnsOptionsForm.valid) {
            return this.invalidOptionDialog();
          }
          form = this.dnsOptionsForm.value;
          job = await this._jobsService.startDNSListener(form.domains, form.canarydomains, "", form.lport);
          break;
      }
      this._router.navigate(['jobs']);
    } catch (err) {
      console.error(`Error: ${err}`);
      this.dialog.open(StartErrorDialogComponent, {
        data: `${err}`,
      });
    }
  }

  back() {
    window.history.back();
  }
  
  validatePort(control: AbstractControl): {[key: string]: any} | null {
    const port = parseInt(control.value);
    const outOfRange = port < 1 || 65535 < port ? true : false;
    if (outOfRange) {
      return { outOfRangeError: {value: control.value} };
    }
    if (this.jobs) {
      const inUse = this.jobs.map(job => job.getPort());
      if (inUse.some(jobPort => jobPort == port)) {
        return { inUseError: {value: control.value} };
      }
    }
    return null;
  }

  validateDomain(control: AbstractControl): {[key: string]: any} | null {
    if (control.value.length === 0) {
      return null;
    }
    const host = String(control.value).trim();
    if (host.length < 1) {
      return {badHostLength: {value: control.value}};
    }
    if (!RegExp('^[a-zA-Z0-9\.\-]*$').test(host)) {
      return {badHostPattern: {value: control.value}};
    }
    return null;
  }

  validateDomains(control: AbstractControl): {[key: string]: any} | null {
    if (control.value.length === 0) {
      return null;
    }
    const hosts = String(control.value).trim().split(',');
    if (hosts.some(host => host.length < 1)) {
      return {badHostLength: {value: control.value}};
    }
    if (hosts.some(host => !RegExp('^[a-zA-Z0-9\.\-]*$').test(host))) {
      return {badHostPattern: {value: control.value}};
    }
    return null;
  }

  invalidOptionDialog() {
    this.dialog.open(InvalidOptionDialogComponent);
  }

}


@Component({
  selector: 'jobs-invalid-option-dialog',
  templateUrl: './invalid-option.dialog.html',
})
export class InvalidOptionDialogComponent {

  constructor(public dialogRef: MatDialogRef<InvalidOptionDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

@Component({
  selector: 'jobs-start-error-dialog',
  templateUrl: './start-error.dialog.html',
})
export class StartErrorDialogComponent {

  constructor(public dialogRef: MatDialogRef<StartErrorDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public errorMessage: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
