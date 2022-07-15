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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ClientService } from '@app/providers/client.service';
import { EventsService } from '@app/providers/events.service';
import { FadeInOut } from '@app/shared/animations';
import { Subscription } from 'rxjs';

import * as sliver from 'sliver-script';

@Component({
  selector: 'app-select-server',
  templateUrl: './select-server.component.html',
  styleUrls: ['./select-server.component.scss'],
  animations: [FadeInOut]
})
export class SelectServerComponent implements OnInit, OnDestroy {

  configs: sliver.SliverClientConfig[];
  selectedConfig: sliver.SliverClientConfig;
  connecting = false;
  connectionError: string;

  selectConfigForm: UntypedFormGroup;
  configSub: Subscription;

  constructor(private _router: Router,
              private _fb: UntypedFormBuilder,
              private _eventsService: EventsService,
              private _clientService: ClientService) { }

  ngOnInit() {
    this.selectConfigForm = this._fb.group({
      config: ['', Validators.compose([
        Validators.required,
      ])]
    });
    this.fetchConfigs();
    this.configSub = this._eventsService.config$.subscribe(this.fetchConfigs.bind(this));
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }

  onSelectedConfig(config: sliver.SliverClientConfig) {
    this.connecting = true;
    this._clientService.setActiveConfig(config).then(() => {
      this._router.navigate(['/home']);
    }).catch((err) => {
      this.connectionError = err.toString();
      this.connecting = false;
      setTimeout(() => {
        this.selectConfigForm.controls.config.setErrors({
          connectionError : true
        });
      });
    });
  }

  async fetchConfigs() {
    const sliverConfigs = await this._clientService.listConfigs();
    this.configs = sliverConfigs.map(config => config.clientConfig);
  }

  async manageConfigs() {
    this._clientService.openConfigManagerWindow();
  }
}
