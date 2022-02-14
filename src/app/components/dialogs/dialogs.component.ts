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

import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { Observable, Subscription } from 'rxjs';

import { DownloadEvent, Progress } from '@app/providers/events.service';
import { Version } from '../../../environments/version';


@Component({
  selector: 'app-about-dialog',
  templateUrl: './about.dialog.html',
})
export class AboutDialogComponent {

  version = Version;

  constructor(public dialogRef: MatDialogRef<AboutDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

@Component({
  selector: 'app-download-sliver-server-dialog',
  templateUrl: './download-sliver-server.dialog.html',
})
export class DownloadSliverServerDialogComponent {

  target: string;
  saveToDownloads: boolean = true;

  constructor(public dialogRef: MatDialogRef<DownloadSliverServerDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  complete() {
    const goos = this.target.split('-')[0];
    const goarch = this.target.split('-')[1];
    this.dialogRef.close({ 
      goos: goos,
      goarch: goarch,
      saveToDownloads: this.saveToDownloads
    });
  }

}

@Component({
  selector: 'app-download-sliver-server-dialog',
  templateUrl: './download-sliver-client.dialog.html',
})
export class DownloadSliverClientDialogComponent {

  target: string;
  saveToDownloads: boolean = true;

  constructor(public dialogRef: MatDialogRef<DownloadSliverClientDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  complete() {
    const goos = this.target.split('-')[0];
    const goarch = this.target.split('-')[1];
    this.dialogRef.close({ 
      goos: goos,
      goarch: goarch,
      saveToDownloads: this.saveToDownloads
    });
  }

}


export interface DownloadProgressSnack {
  download$: Observable<DownloadEvent>;
  message: string;
}

@Component({
  selector: 'app-download-progress-snack',
  templateUrl: './download-progress.snack.html',
})
export class DownloadProgressSnackComponent implements OnInit, OnDestroy {

  message: string;
  progress: Progress;
  private downloadSub: Subscription;

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: DownloadProgressSnack) { }

  ngOnInit(): void {
    this.message = this.data.message;
    this.downloadSub = this.data.download$.subscribe(download => {
      this.progress = download.progress;
    });
  }

  ngOnDestroy(): void {
    this.downloadSub.unsubscribe();
  }

  getPercent() {
    return this.progress?.percent ? this.progress.percent : 0;
  }

  getBytesPerSecond(): number {
    return this.progress?.bytesPerSecond ? this.progress.bytesPerSecond : 0;
  }

}