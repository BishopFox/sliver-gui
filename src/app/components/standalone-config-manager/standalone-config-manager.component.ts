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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, AbstractControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as sliver from 'sliver-script';

import { FadeInOut } from '@app/shared/animations';
import { ClientService, SliverConfig, ReadFiles } from '@app/providers/client.service';
import { EventsService } from '@app/providers/events.service';


@Component({
  selector: 'app-standalone-config-manager',
  templateUrl: './standalone-config-manager.component.html',
  styleUrls: ['./standalone-config-manager.component.scss'],
  animations: [FadeInOut],
})
export class StandaloneConfigManagerComponent implements OnInit, OnDestroy {

  private configSub: Subscription;
  configs: SliverConfig[];

  selectedConfig: SliverConfig;
  selectedConfigForm: UntypedFormGroup;

  constructor(private _clientService: ClientService,
              private _eventsService: EventsService,
              private _fb: UntypedFormBuilder) { }

  ngOnInit(): void {
    this.fetchConfigs();
    this.configSub = this._eventsService.config$.subscribe(this.fetchConfigs.bind(this));
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }

  async fetchConfigs() {
    this.configs = await this._clientService.listConfigs(); 
  }

  onSelectConfig(config: SliverConfig) {
    this.selectedConfig = config;
    this.selectedConfigForm = this._fb.group({
      lhost: ['', Validators.compose([
        Validators.required, this.validateLHost.bind(this),
      ])],
      lport: [1, Validators.compose([
        Validators.required, this.validateLPort.bind(this),
      ])],
    });
    this.selectedConfigForm.controls['lhost'].setValue(config.clientConfig.lhost);
    this.selectedConfigForm.controls['lport'].setValue(config.clientConfig.lport);
  }

  saveSelectedConfig() {
    const form = this.selectedConfigForm.value;
    this.selectedConfig.clientConfig.lhost = form.lhost;
    this.selectedConfig.clientConfig.lport = form.lport;
    this._clientService.saveConfig(this.selectedConfig);
    this.selectedConfig = null;
  }

  async addConfigFile() {
    this.selectedConfig = null;

    const title = 'Add Config(s)';
    const msg = 'Select new configuration file(s)';
    const rawConfigs: ReadFiles = await this._clientService.readFile(title, msg, false, true);
    
    if (!rawConfigs || !rawConfigs.files) {
      return;  // User hit cancel
    }

    const configs: sliver.SliverClientConfig[] = [];
    for (let index = 0; index < rawConfigs.files.length; ++index) {
      try {
        const config: sliver.SliverClientConfig = JSON.parse(atob(rawConfigs.files[index].data));
        configs.push(config);
      } catch (err) {
        console.error(err);
      }
    }
    this._clientService.addConfigs(configs); // Should fire a config event
  }

  validateLPort(control: AbstractControl): {[key: string]: any} | null {
    const port = parseInt(control.value);
    const outOfRange = port < 1 || 65535 < port ? true : false;
    if (outOfRange) {
      return { outOfRangeError: {value: control.value} };
    }
    return null;
  }

  validateLHost(control: AbstractControl): {[key: string]: any} | null {

    return null;
  }

  async rmSelectedConfig() {
    let deleted = await this._clientService.rmConfig(this.selectedConfig.clientConfig);
    if (deleted) {
      this.selectedConfig = null;
      this.fetchConfigs();
    }
  }

}
