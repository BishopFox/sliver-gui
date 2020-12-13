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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMaterialModule } from '../../base-material';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { SessionsComponent } from './components/sessions-table/sessions-table.component';
import { InteractComponent } from './components/interact/interact.component';
import {
  FileBrowserComponent, MkdirDialogComponent, RmDialogComponent,
  DownloadDialogComponent
} from './components/file-browser/file-browser.component';
import { ShellComponent, ShellRenameDialogComponent, ShellCloseDialogComponent } from './components/shell/shell.component';
import { PsComponent } from './components/ps/ps.component';
import { InfoComponent } from './components/info/info.component';
import { SharedModule } from '../../shared/shared.module';
import { MainComponent } from './components/main/main.component';
import { StandaloneInteractComponent } from './components/standalone-interact/standalone-interact.component';
import { NgTerminalModule } from '@app/modules/terminal/ng-terminal.module';


@NgModule({
  declarations: [
    SessionsComponent,
    InteractComponent,
    FileBrowserComponent,
    MkdirDialogComponent,
    RmDialogComponent,
    DownloadDialogComponent,
    ShellComponent,
    ShellRenameDialogComponent,
    ShellCloseDialogComponent,
    PsComponent,
    InfoComponent,
    MainComponent,
    StandaloneInteractComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    BaseMaterialModule,
    FormsModule,
    FlexLayoutModule,
    NgTerminalModule,
    SharedModule
  ],
  exports: [
    SessionsComponent
  ],
  entryComponents: [MkdirDialogComponent, RmDialogComponent, DownloadDialogComponent]
})
export class SessionsModule { }
