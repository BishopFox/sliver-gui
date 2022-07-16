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

import { Injectable } from '@angular/core';
import { IPCService } from './ipc.service';
import { Subject } from 'rxjs';

import { Events } from 'sliver-script/lib/events';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';


export interface Notification {
  message: string;
  buttonLabel: string;
  seconds: number;
  callback: Function | null;
}

export interface MenuEvent {
  button: string;
  id?: number;
}

export interface Progress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
  delta: number;
}

export interface DownloadEvent {
  event: string;
  info?: any;
  progress?: Progress;
  error?: string;
}

export interface ConfigEvent {
  filename?: string;
}


@Injectable({
  providedIn: 'root'
})
export class EventsService {

  events$ = new Subject<clientpb.Event>();
  players$ = new Subject<clientpb.Event>();
  jobs$ = new Subject<clientpb.Event>();
  sessions$ = new Subject<clientpb.Event>();
  builds$ = new Subject<clientpb.Event>();
  profiles$ = new Subject<clientpb.Event>();
  websites$ = new Subject<clientpb.Event>();
  loot$ = new Subject<clientpb.Event>();
  notifications$ = new Subject<Notification>();
  menu$ = new Subject<MenuEvent>();
  download$ = new Subject<DownloadEvent>();
  config$ = new Subject<ConfigEvent>();

  constructor(private _ipc: IPCService) {

    this._ipc.menuEvent$.subscribe(event => {
      this.menu$.next(event);
    });
    this._ipc.downloadEvent$.subscribe(event => {
      this.download$.next(event);
    });
    this._ipc.configEvent$.subscribe(event => {
      this.config$.next(event);
    });

    this._ipc.ipcEvent$.subscribe(event => {
      try {
        this.events$.next(event);

        const eventType = event.getEventtype();
        switch (eventType) {

          // Players
          case Events.ClientJoined:
          case Events.ClientLeft:
            this.players$.next(event);
            break;

          // Jobs
          case Events.JobStarted:
          case Events.JobStopped:
            this.jobs$.next(event);
            break;

          // Sessions
          case Events.SessionConnected:
          case Events.SessionDisconnected:
            this.sessions$.next(event);
            break;

          // Builds
          case Events.Build:
          case Events.BuildCompleted:
            this.builds$.next(event);
            break;

          // Profiles
          case Events.Profile:
            this.profiles$.next(event);
            break;

          // Websites
          case Events.Website:
            this.websites$.next(event);
            break;

          // Loot
          case Events.LootRemovedEvent:
          case Events.LootAddedEvent:
            this.loot$.next(event);
            break;

          default:
            console.error(`Unknown event type: '${eventType}'`);
        }

      } catch (err) {
        console.error(err);
      }
    });
  }

  notify(message: string, buttonLabel: string, seconds: number = 10, callback: Function | null = null) {
    this.notifications$.next({
      message: message,
      buttonLabel: buttonLabel,
      seconds: seconds,
      callback: callback,
    });
  }

}
