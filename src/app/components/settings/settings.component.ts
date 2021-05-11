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

import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClientService, Platforms, Settings, Themes, DEFAULT_THEME } from '@app/providers/client.service';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  settings: Settings;
  locales: Map<string, string>;
  currentLocale: string;
  currentTheme: string;
  glassEffect = true;
  isMacOS: boolean;

  constructor(public dialog: MatDialog,
              private _clientService: ClientService) { }

  ngOnInit() {
    this.fetchSettings();
    this.fetchLocales();
  }

  async fetchSettings() {
    this.isMacOS = (await this._clientService.getPlatform()) === Platforms.MacOS;
    this.settings = await this._clientService.getSettings();
    this.currentTheme = this.settings.theme ? this.settings.theme : DEFAULT_THEME;
  }

  async saveSettings() {
    console.log(`[Save Settings] ${JSON.stringify(this.settings)}`);
    await this._clientService.saveSettings(this.settings);
    await this.fetchSettings();
  }

  async fetchLocales() {
    this.locales = await this._clientService.locales();
    this.currentLocale = await this._clientService.getCurrentLocale();
  }

  back() {
    window.history.back();
  }

  async selectLanguage(event) {
    await this._clientService.setLocale(event.value);
    this.dialog.open(RestartDialogComponent);
  }

  async selectTheme(event) {
    console.log(event.value);
    this.settings.theme = event.value;
    this.saveSettings();
  }

  get themes() {
    return this.isMacOS ? [Themes.Auto, Themes.Dark, Themes.DarkNoGlass, Themes.Light] : [Themes.Auto, Themes.Dark, Themes.Light];
  }

}

@Component({
  selector: 'settings-restart-dialog',
  templateUrl: 'restart.dialog.html',
})
export class RestartDialogComponent {

  constructor(public dialogRef: MatDialogRef<RestartDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
