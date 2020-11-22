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

import { Component } from '@angular/core';
import { EventsService, Events, Notification } from './providers/events.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb'; // Protobuf


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  mainWindow = window.location.origin == "app://sliver";

  constructor(private _router: Router,
              private _eventsService: EventsService,
              private _snackBar: MatSnackBar) 
  {
    if (this.mainWindow) {
      this.initAlerts();
    }
  }

  initAlerts() {
    this._eventsService.sessions$.subscribe((event: clientpb.Event) => {
      const eventType = event.getEventtype();
      switch (eventType) {
        case Events.SessionConnected:
          this.sessionConnectedAlert(event.getSession());
          break;
        case Events.SessionDisconnected:
          this.sessionDisconnectedAlert(event.getSession());
          break;
      }
    });

    this._eventsService.players$.subscribe((event: clientpb.Event) => {
      const eventType = event.getEventtype();
      switch (eventType) {
        case Events.ClientJoined:
          this.playerAlert('joined', event.getClient());
          break;
        case Events.ClientLeft:
          this.playerAlert('left', event.getClient());
          break;
      }
    });

    this._eventsService.events$.subscribe((event: clientpb.Event) => {
      const eventType = event.getEventtype();
      switch (eventType) {
        case Events.JobStopped:
          this.jobStoppedAlert(event.getJob());
          break;
      }
    });

    this._eventsService.notifications$.subscribe((notify: Notification) => {
      this.notificationAlert(notify.message, notify.buttonLabel, notify.seconds, notify.callback);
    });

  }

  notificationAlert(message: string, buttonLabel: string, seconds: number, callback: Function|null = null) {
    const snackBarRef = this._snackBar.open(message, buttonLabel, {
      duration: seconds * 1000,
    });
    if (callback !== null) {
      snackBarRef.onAction().subscribe(() => {
        callback();
      });
    }
  }

  playerAlert(action: string, client: clientpb.Client) {
    this._snackBar.open(`${client.getOperator()?.getName()} has ${action} the game!`, 'Dismiss', {
      duration: 5000,
    });
  }

  jobStoppedAlert(job: clientpb.Job) {
    this._snackBar.open(`Job #${job.getId()} (${job.getProtocol()}/${job.getName()}) has stopped.`, 'Dismiss', {
      duration: 5000,
    });
  }

  sessionConnectedAlert(session: clientpb.Session) {
    const snackBarRef = this._snackBar.open(`Session #${session.getId()} opened`, 'Interact', {
      duration: 5000,
    });
    snackBarRef.onAction().subscribe(() => {
      this._router.navigate(['sessions', session.getId()]);
    });

    const _ = new Notification('Sliver', {
      body: `Session #${session.getId()} opened`
    });
  }

  sessionDisconnectedAlert(session: clientpb.Session) {
    this._snackBar.open(`Lost session #${session.getId()}`, 'Dismiss', {
      duration: 5000,
    });
  }

}
