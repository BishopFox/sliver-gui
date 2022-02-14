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
--------------------------------------------------------------------------

This service is talks to the mTLS client and manages configs/etc.

*/

import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Base64 } from 'js-base64';

import * as sliver from 'sliver-script';

import { IPCService } from './ipc.service';
import { FileFilter } from 'electron';


export enum Themes {
  Auto = 'Auto',
  Dark = 'Dark',
  DarkNoGlass = 'Dark (No Glass)',
  Light = 'Light'
}

// https://nodejs.org/api/process.html#process_process_platform
export enum Platforms {
  Windows = 'win32',
  MacOS = 'darwin',
  Linux = 'linux',
};

export const DEFAULT_THEME = Themes.Auto;

export interface SaveFileReq {
  title: string;
  message: string;
  filename: string;
  data: string;
}

export interface ReadFile {
  filePath: string|null;
  error: string|null;
  data: string|null;
}

export interface ReadFiles {
  files: Array<ReadFile>;
}

export interface SliverConfig {
  filename: string;
  clientConfig: sliver.SliverClientConfig;
}

export interface Settings {
  theme: string;
  preferredServer: string;
  notifications: {
    sessionOpened: boolean;
    sessionClosed: boolean;
    jobStopped: boolean;
    playerJoined: boolean;
    playerLeft: boolean;
  };
}

export interface Notified {
  err: string;
  response: string;
  metadata: {
    activationType?: string;
    activationAt?: string;
    deliveredAt?: string;
    activationValue?: string;
    activationValueIndex?: string;
  };
}


@Injectable({
  providedIn: 'root'
})
export class ClientService {

  isConnected$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  settings$ = new EventEmitter<Settings>();

  constructor(private _ipc: IPCService) { }

  async openSessionWindow(sessionId: string): Promise<void> {
    await this._ipc.request('client_sessionWindow', JSON.stringify({
      sessionId: sessionId
    }));
  }

  async openConfigManagerWindow(): Promise<void> {
    await this._ipc.request('client_configManagerWindow');
  }

  async locales(): Promise<Map<string, string>> {
    const rawLocales = await this._ipc.request('client_listLocales');
    const localLocales = JSON.parse(rawLocales);
    
    // Convert JSON back to map<str, str>
    const locales = new Map<string, string>();
    Object.keys(localLocales).forEach((key: string) => {
      locales.set(key, localLocales[key]);
    });
    return locales;
  }

  async getCurrentLocale(): Promise<string> {
    return this._ipc.request('client_currentLocale');
  }

  async setLocale(locale: string): Promise<string> {
    return this._ipc.request('client_setLocale', locale);
  }

  async getActiveConfig(): Promise<sliver.SliverClientConfig> {
    const rawConfig = await this._ipc.request('client_activeConfig');
    return rawConfig ? JSON.parse(rawConfig) : null;
  }

  async setActiveConfig(config: sliver.SliverClientConfig): Promise<string> {
    const data = await this._ipc.request('client_start', JSON.stringify(config));
    this.isConnected$.next(true);
    return data;
  }

  async getSettings(): Promise<Settings> {
    const data = await this._ipc.request('client_getSettings');
    return data ? JSON.parse(data) : {};
  }

  async saveSettings(settings: Settings): Promise<Settings> {
    const raw = await this._ipc.request('client_saveSettings', JSON.stringify(settings));
    const updated = JSON.parse(raw);
    this.settings$.next(updated);
    return updated;
  }

  async getTheme(): Promise<string> {
    const settings = await this.getSettings();
    return settings.theme ? settings.theme : DEFAULT_THEME;
  }

  async getSystemThemeIsDark(): Promise<boolean> {
    const isDark = await this._ipc.request('client_systemThemeIsDark');
    return isDark === 'true' ? true : false;
  }

  async getPlatform(): Promise<string> {
    return this._ipc.request('client_platform');
  }

  async listConfigs(): Promise<SliverConfig[]> {
    const resp = await this._ipc.request('config_list');
    const configs: SliverConfig[] = JSON.parse(resp);
    return configs;
  }

  async addConfigs(configs: sliver.SliverClientConfig[]): Promise<string> {
    return this._ipc.request('config_add', JSON.stringify({ configs: configs })); 
  }

  async rmConfig(config: sliver.SliverClientConfig): Promise<boolean> {
    let deleted = await this._ipc.request('config_rm', JSON.stringify(config));
    return JSON.parse(deleted)?.success ? true : false;
  }

  async saveConfig(config: SliverConfig): Promise<void> {
    return this._ipc.request('config_save', JSON.stringify(config)); 
  }

  async saveFile(title: string, message: string, filename: string, data: Uint8Array): Promise<string> {
    return await this._ipc.request('client_saveFile', JSON.stringify({
      title: title,
      message: message,
      filename: filename,
      data: Base64.fromUint8Array(data),
    }));
  }

  async saveFileB64(title: string, message: string, filename: string, data: string): Promise<string> {
    return await this._ipc.request('client_saveFile', JSON.stringify({
      title: title,
      message: message,
      filename: filename,
      data: data,
    }));
  }

  async readFile(title: string, message: string, openDirectory?: boolean,
                 multiSelection?: boolean, filter?: FileFilter[]): Promise<ReadFiles|null> {
    const resp = await this._ipc.request('client_readFile', JSON.stringify({
      title: title,
      message: message,
      openDirectory: openDirectory !== undefined ? openDirectory : false,
      multiSelection: multiSelection !== undefined ? multiSelection : false,
      filter: filter !== undefined ? filter : [{
        name: 'All Files', extensions: ['*']
      }],
    }));
    return resp ? JSON.parse(resp) : null;
  }

  async downloadSliverServer(goos: string, goarch: string, saveToDownloads: boolean): Promise<string> {
    const downloadId = await this._ipc.request('client_downloadSliverServer', JSON.stringify({
      goos: goos,
      goarch: goarch,
      saveToDownloads: saveToDownloads,
    }));
    return downloadId;
  }

  async downloadSliverClient(goos: string, goarch: string, saveToDownloads: boolean): Promise<string> {
    const downloadId = await this._ipc.request('client_downloadSliverClient', JSON.stringify({
      goos: goos,
      goarch: goarch,
      saveToDownloads: saveToDownloads,
    }));
    return downloadId;
  }

  // Notify - Trigger a native OS notification
  // NOTE: Not all features are available on all platforms!
  async notify(title: string, subtitle: string, message: string, sound: boolean = true, timeout: number = 5,
               closeLabel?: string, actions?: string[], dropdownLabel?: string, reply?: boolean): Promise<Notified> {
    const notified = await this._ipc.request('client_notify', JSON.stringify({
      title: title,
      subtitle: subtitle,
      message: message,
      sound: sound,
      timeout: timeout,
      closeLabel: closeLabel,
      actions: actions,
      dropdownLabel: dropdownLabel,
      reply: reply,
    }));
    return JSON.parse(notified);
  }

  exit() {
    this._ipc.request('client_exit', '');
  }

}
