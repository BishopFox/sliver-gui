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

import { Component, Input, OnDestroy, OnInit, Inject } from '@angular/core';
import { SliverService } from '@app/providers/sliver.service';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { GeneratingDialogComponent, BuildErrorDialogComponent } from '../generate/generate.component';
import { FadeInOut } from '@app/shared/animations';
import { EventsService } from '@app/providers/events.service';
import { ClientService } from '@app/providers/client.service';


interface TableImplantProfileData {
  name: string;
  os: string;
  arch: string;
  debug: boolean;
  format: string;
  c2URLs: string[];
}

function compare(a: number | string | boolean, b: number | string | boolean, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}


@Component({
  selector: 'generate-profiles-table',
  templateUrl: './profiles-table.component.html',
  styleUrls: ['./profiles-table.component.scss'],
  animations: [FadeInOut]
})
export class ProfilesTableComponent implements OnInit, OnDestroy {

  @Input() title = true;
  @Input() displayedColumns: string[] = [
    'name', 'os', 'arch', 'debug', 'format', 'options'
  ];

  profiles: clientpb.ImplantProfile[];
  dataSrc: MatTableDataSource<TableImplantProfileData>;
  profileSub: Subscription;
  generatingDialogRef: MatDialogRef<GeneratingDialogComponent, any>;

  constructor(public dialog: MatDialog,
              private _router: Router,
              private _clientService: ClientService,
              private _sliverService: SliverService,
              private _eventsService: EventsService) { }

  ngOnInit(): void {
    this.fetchProfiles();
    this.profileSub = this._eventsService.profiles$.subscribe(this.fetchProfiles.bind(this));
  }

  ngOnDestroy(): void {
    this.profileSub.unsubscribe();
  }

  async fetchProfiles() {
    this.profiles = await this._sliverService.implantProfiles();
    this.dataSrc = new MatTableDataSource(this.tableData());
  }

  tableData(): TableImplantProfileData[] {
    const table: TableImplantProfileData[] = [];
    for (const profile of this.profiles) {
      const config = profile.getConfig().toObject();
      table.push({
        name: profile.getName(),
        os: config.goos,
        arch: config.goarch,
        debug: config.debug,
        format: this.formatToName(config.format),
        c2URLs: this.c2sToURLs(config.c2List)
      });
    }
    return table.sort((a, b) => (a.name > b.name) ? 1 : -1);
  }

  applyFilter(filterValue: string) {
    this.dataSrc.filter = filterValue.trim().toLowerCase();
  }

  onRowSelection(row: any) {
    let profile: clientpb.ImplantProfile;
    for (let index = 0; index < this.profiles.length; ++index) {
      if (this.profiles[index].getName() === row.name) {
        profile = this.profiles[index];
        break;
      }
    }
    if (!profile) {
      return;
    }
    this.profileGenerate(profile);
  }

  profileGenerate(profile: clientpb.ImplantProfile) {
    const dialogRef = this.dialog.open(ProfileGenerateDialogComponent, {
      data: profile,
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe(async (profile: clientpb.ImplantProfile) => {
      if (profile) {
        console.log(`Generating from profile: ${profile.getName()}`);
        this.generate(profile.getConfig());
      }
    });
  }

  async generate(implantConfig: clientpb.ImplantConfig) {
    setTimeout(async () => {
      try {
        const file = await this._sliverService.generate(implantConfig);
        this._eventsService.notify(`Build ${file.getName()} completed`, 'Download', 10, () => {
          this._clientService.saveFile('Save', 'Save Implant', file.getName(), file.getData_asU8());
        });
      } catch (err) {
        console.error(err);
        this.generatingDialogRef?.close();
        this.dialog.open(BuildErrorDialogComponent, {
          data: {
            errorMessage: err.toString(),
            stack: err.stack,
          },
        });
      }
    }, 0);
    this.generatingDialog();
  }

  generatingDialog() {
    this.generatingDialogRef = this.dialog.open(GeneratingDialogComponent);
    this.generatingDialogRef.afterClosed().pipe(take(1)).subscribe(() => {
      this._router.navigate(['generate', 'builds']);
    });
  }

  c2sToURLs(sliverC2s: clientpb.ImplantC2.AsObject[]): string[] {
    const c2URLs: string[] = [];
    for (let index = 0; index < sliverC2s.length; ++index) {
      c2URLs.push(sliverC2s[index].url);
    }
    return c2URLs;
  }

  formatToName(format: number): string {
    // As defined in `client.proto`
    switch (format) {
      case 0:
        return 'Shared Library';
      case 1:
        return 'Shellcode';
      case 2:
        return 'Executable';
      default:
        return 'Unknown';
    }
  }

  // Because MatTableDataSource is absolute piece of shit
  sortData(event: Sort) {
    this.dataSrc.data = this.dataSrc.data.slice().sort((a, b) => {
      const isAsc = event.direction === 'asc';
      switch (event.active) {
        case 'name': return compare(a.name, b.name, isAsc);
        case 'os': return compare(a.os, b.os, isAsc);
        case 'arch': return compare(a.arch, b.arch, isAsc);
        case 'debug': return compare(a.debug, b.debug, isAsc);
        case 'format': return compare(a.format, b.format, isAsc);
        default: return 0;
      }
    });
  }

  deleteProfile(event, row) {
    event.stopPropagation();
    this._sliverService.deleteImplantProfile(row.name);
  }

}


@Component({
  selector: 'generate-profile-generate-dialog',
  templateUrl: 'profile-generate.dialog.html',
})
export class ProfileGenerateDialogComponent {

  constructor(public dialogRef: MatDialogRef<ProfileGenerateDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public profile: clientpb.ImplantProfile) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
