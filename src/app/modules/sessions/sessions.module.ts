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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMaterialModule } from '../../base-material';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { SessionsComponent } from './components/sessions-table/sessions-table.component';
import { InteractComponent } from './components/interact/interact.component';
import {
  FileBrowserComponent, MkdirDialogComponent, RmDialogComponent,
  DownloadDialogComponent
} from './components/file-browser/file-browser.component';
import {
  ShellComponent, ShellCloseDialogComponent, ShellCustomDialogComponent
} from './components/shell/shell.component';
import {
  LibraryDialogComponent, RenameDialogComponent
} from './components/dialogs/dialogs.component';
import { PsComponent } from './components/ps/ps.component';
import { InfoComponent } from './components/info/info.component';
import { SharedModule } from '../../shared/shared.module';
import { MainComponent } from './components/main/main.component';
import { StandaloneInteractComponent } from './components/standalone-interact/standalone-interact.component';
import { NgTerminalModule } from '@app/modules/terminal/ng-terminal.module';
import { ExecuteCommandComponent } from './components/execute-command/execute-command.component';
import { SideLoadComponent } from './components/side-load/side-load.component';
import { ScreenshotsComponent } from './components/screenshots/screenshots.component';
import { ExecuteAssemblyComponent } from './components/execute-assembly/execute-assembly.component';
import { ExecuteShellcodeComponent } from './components/execute-shellcode/execute-shellcode.component';
import { LibraryTableComponent } from './components/library-table/library-table.component';


@NgModule({
    declarations: [
        SessionsComponent,
        InteractComponent,
        FileBrowserComponent,
        MkdirDialogComponent,
        RmDialogComponent,
        DownloadDialogComponent,
        ShellComponent,
        ShellCloseDialogComponent,
        ShellCustomDialogComponent,
        PsComponent,
        InfoComponent,
        MainComponent,
        StandaloneInteractComponent,
        ExecuteCommandComponent,
        SideLoadComponent,
        ScreenshotsComponent,
        ExecuteAssemblyComponent,
        ExecuteShellcodeComponent,
        RenameDialogComponent,
        LibraryDialogComponent,
        LibraryTableComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        BaseMaterialModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        NgTerminalModule,
        SharedModule
    ],
    exports: [
        SessionsComponent
    ]
})
export class SessionsModule { }
