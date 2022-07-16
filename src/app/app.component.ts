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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { Events } from 'sliver-script/lib/events';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import {
  AboutDialogComponent, DownloadSliverServerDialogComponent, DownloadSliverClientDialogComponent, DownloadProgressSnackComponent
} from './components/dialogs/dialogs.component';
import { EventsService, Notification, MenuEvent, DownloadEvent } from './providers/events.service';
import { ClientService, Platforms, Settings, Themes } from './providers/client.service';
import { BreakPointRegistry } from '@angular/flex-layout';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  private readonly LIGHT_CSS = 'light-theme';
  private readonly DARK_NO_GLASS_CSS = 'dark-theme-no-glass';
  private readonly CSS_THEMES = [this.LIGHT_CSS, this.DARK_NO_GLASS_CSS];

  // Navigation hot keys are disabled if the active elem is any of:
  private readonly DISABLE_NAV = ['input', 'textarea'];

  mainWindow = window.location.origin === "app://sliver";
  settings: Settings;
  subs: Subscription[] = [];

  constructor(private _router: Router,
    private _overlayContainer: OverlayContainer,
    private _eventsService: EventsService,
    private _clientService: ClientService,
    private _snackBar: MatSnackBar,
    public dialog: MatDialog) {
    if (this.mainWindow) {
      this.initAlerts();
    }
  }

  ngOnInit(): void {
    this.fetchSettings();
    const sub = this._clientService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
      this.setTheme();
    });
    this.subs.push(sub);
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub?.unsubscribe());
  }

  async fetchSettings() {
    this.settings = await this._clientService.getSettings();
    this.setTheme();
  }

  async setTheme() {
    console.log(`Set theme to: ${this.settings.theme}`);
    const platform = await this._clientService.getPlatform();
    switch (this.settings.theme) {
      case Themes.Auto:
        this.setAutoTheme();
        break;
      case Themes.Dark:
        platform === Platforms.MacOS ? this.setDarkTheme() : this.setDarkThemeNoGlass();
        break;
      case Themes.DarkNoGlass:
        this.setDarkThemeNoGlass();
        break;
      case Themes.Light:
        this.setLightTheme();
        break;
      default:
        this.setAutoTheme();
    }
  }

  async setAutoTheme(): Promise<void> {
    const isDark = await this._clientService.getSystemThemeIsDark();
    const platform = await this._clientService.getPlatform();
    if (isDark) {
      if (platform === Platforms.MacOS) {
        this.setDarkTheme();
      } else {
        this.setDarkThemeNoGlass();
      }
    } else {
      this.setLightTheme();
    }
  }

  clearThemes(): void {
    this.CSS_THEMES.forEach((css_theme) => {
      document.body.classList.remove(css_theme);
      this._overlayContainer.getContainerElement().classList.remove(css_theme);
    });
  }

  setDarkTheme(): void {
    this.clearThemes(); // Dark theme w/glass is default
  }

  setDarkThemeNoGlass(): void {
    this.clearThemes();
    document.body.classList.add(this.DARK_NO_GLASS_CSS);
    this._overlayContainer.getContainerElement().classList.add(this.DARK_NO_GLASS_CSS);
  }

  setLightTheme(): void {
    this.clearThemes();
    document.body.classList.add(this.LIGHT_CSS);
    this._overlayContainer.getContainerElement().classList.add(this.LIGHT_CSS);
  }

  initAlerts() {
    let sub = this._eventsService.sessions$.subscribe((event: clientpb.Event) => {
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
    this.subs.push(sub);

    sub = this._eventsService.players$.subscribe((event: clientpb.Event) => {
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
    this.subs.push(sub);

    sub = this._eventsService.events$.subscribe((event: clientpb.Event) => {
      const eventType = event.getEventtype();
      switch (eventType) {
        case Events.JobStopped:
          this.jobStoppedAlert(event.getJob());
          break;
      }
    });
    this.subs.push(sub);

    sub = this._eventsService.notifications$.subscribe((notify: Notification) => {
      this.notificationAlert(notify.message, notify.buttonLabel, notify.seconds, notify.callback);
    });
    this.subs.push(sub);

    // Back menu event
    sub = this._eventsService.menu$.pipe(
      filter(event => event.button === 'back')
    ).subscribe(() => {
      const activeElem = document.activeElement.tagName.toLowerCase();
      console.log(`active elem: ${activeElem}`);
      if (!this.DISABLE_NAV.some((elem) => elem === activeElem)) {
        window.history.back();
      }
    });
    this.subs.push(sub);

    // Forward menu event
    sub = this._eventsService.menu$.pipe(
      filter(event => event.button === 'forward')
    ).subscribe(() => {
      const activeElem = document.activeElement.tagName.toLowerCase();
      if (!this.DISABLE_NAV.some((elem) => elem === activeElem)) {
        window.history.forward();
      }
    });
    this.subs.push(sub);

    // Settings menu event
    sub = this._eventsService.menu$.pipe(
      filter(event => event.button === 'settings')
    ).subscribe(() => {
      this._router.navigate(['settings']);
    });
    this.subs.push(sub);

    // About menu event
    sub = this._eventsService.menu$.pipe(
      filter(event => event.button === 'about')
    ).subscribe(() => {
      this.aboutDialog();
    });
    this.subs.push(sub);

    // Download event (updates/server/client)
    sub = this._eventsService.menu$.pipe(
      filter(event => event.button.startsWith('sliver-download'))
    ).subscribe((event) => {
      this.sliverDownload(event);
    });
    this.subs.push(sub);


    // Back menu event
    sub = this._eventsService.menu$.pipe(
      filter(event => event.button === 'screenshot')
    ).subscribe((event) => {
      this.notificationAlert(`Saved screenshots to '${event['saveTo']}'`, 'Dismiss', 5);
    });
    this.subs.push(sub);

    // Auto update events
    sub = this._eventsService.download$.pipe(
      filter((autoUpdateEvent: DownloadEvent) => [
        'auto-update-checking-for-update',
        'auto-update-update-available',
        'auto-update-update-not-available',
        'auto-update-download-progress',
        'auto-update-update-downloaded',
        'auto-update-error'
      ].includes(autoUpdateEvent.event))
    ).subscribe((autoUpdateEvent: DownloadEvent) => {
      this.autoUpdateEvents(autoUpdateEvent);
    });
    this.subs.push(sub);
  }

  notificationAlert(message: string, buttonLabel: string, seconds: number, callback: Function | null = null) {
    const snackBarRef = this._snackBar.open(message, buttonLabel, {
      duration: seconds * 1000,
    });
    if (callback !== null) {
      snackBarRef.onAction().pipe(take(1)).subscribe(() => {
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

  async sessionConnectedAlert(session: clientpb.Session) {
    const snackBarRef = this._snackBar.open(`Session #${session.getId()} opened`, 'Interact', {
      duration: 5000,
    });
    snackBarRef.onAction().pipe(take(1)).subscribe(() => {
      this._router.navigate(['sessions', session.getId(), 'info']);
    });
    const reply = await this._clientService.notify('Sliver', 'New Session', `Session #${session.getId()} opened`, true, 10, undefined, ['Interact']);
    if (!reply.err && reply.response === 'activate') {
      this._router.navigate(['sessions', session.getId(), 'info']);
    }
  }

  sessionDisconnectedAlert(session: clientpb.Session) {
    this._snackBar.open(`Lost session #${session.getId()}`, 'Dismiss', {
      duration: 5000,
    });
    this._clientService.notify('Sliver', 'Lost Session', `Session #${session.getId()} closed`, true, 10);
  }

  aboutDialog() {
    this.dialog.open(AboutDialogComponent);
  }

  sliverDownload(event: MenuEvent) {
    switch (event.button) {
      case 'sliver-download-server':
        this.sliverServerDownload();
        break;
      case 'sliver-download-client':
        this.sliverClientDownload();
        break;
    }
  }

  autoUpdateEvents(autoUpdateEvent: DownloadEvent) {
    console.log(autoUpdateEvent);
    switch (autoUpdateEvent.event) {
      case 'auto-update-checking-for-update':
        this.notificationAlert('Checking for updates ...', 'Dismiss', 3);
        break;
      case 'auto-update-update-not-available':
        const noUpdateMsg = autoUpdateEvent?.info?.version ? `No updates available (current v${autoUpdateEvent.info.version})` : 'No updates available';
        this.notificationAlert(noUpdateMsg, 'Dismiss', 3);
        break;
      case 'auto-update-update-available':
        const updateMsg = autoUpdateEvent?.info?.version ? `Downloading update (v${autoUpdateEvent.info.version})` : 'Downloading update';
        this.notificationAlert(updateMsg, 'Dismiss', 3);
        break;
      case 'auto-update-download-progress':
        console.log(autoUpdateEvent.info);
        break;
      case 'auto-update-update-downloaded':
        this.notificationAlert('Installing new version, restarting application ...', 'Dismiss', 1);
        break;
      case 'auto-update-error':
        this.notificationAlert(`Error: ${autoUpdateEvent.info}`, 'Dismiss', 3);
        break;
    }
  }

  sliverServerDownload() {
    const dialogRef = this.dialog.open(DownloadSliverServerDialogComponent);
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      if (!result?.goos) {
        return;
      }
      const downloadId = await this._clientService.downloadSliverServer(result.goos, result.goarch, result.saveToDownloads);
      const observe = this._eventsService.download$.pipe(
        filter((download: DownloadEvent) => download.event === downloadId)
      );
      const snackBarRef = this._snackBar.openFromComponent(DownloadProgressSnackComponent, {
        data: {
          message: 'Downloading Sliver Server',
          download$: observe,
        }
      });
      // Wait for a 100% event, then wait 1 sec. and dismiss the snackbar
      observe.pipe(
        filter((download: DownloadEvent) => download.progress?.percent >= 100.0)
      ).pipe(take(1)).subscribe(() => {
        setTimeout(() => {
          snackBarRef.dismiss();
        }, 1000);
      });
    });
  }

  sliverClientDownload() {
    const dialogRef = this.dialog.open(DownloadSliverClientDialogComponent);
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      if (!result?.goos) {
        return;
      }
      const downloadId = await this._clientService.downloadSliverClient(result.goos, result.goarch, result.saveToDownloads);
      const observe = this._eventsService.download$.pipe(
        filter((download: DownloadEvent) => download.event === downloadId)
      );
      const snackBarRef = this._snackBar.openFromComponent(DownloadProgressSnackComponent, {
        data: {
          message: 'Downloading Console Client',
          download$: observe,
        }
      });
      // Wait for a 100% event, then wait 1 sec. and dismiss the snackbar
      observe.pipe(
        filter((download: DownloadEvent) => download.progress?.percent >= 100.0)
      ).pipe(take(1)).subscribe(() => {
        setTimeout(() => {
          snackBarRef.dismiss();
        }, 1000);
      });
    });
  }

}

