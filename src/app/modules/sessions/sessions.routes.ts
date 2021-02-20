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

import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { ActiveConfig } from '@app/app-routing-guards.module';

import { MainComponent } from './components/main/main.component';
import { StandaloneInteractComponent } from './components/standalone-interact/standalone-interact.component';
import { InteractComponent } from './components/interact/interact.component';
import { InfoComponent } from './components/info/info.component';
import { PsComponent } from './components/ps/ps.component';
import { FileBrowserComponent } from './components/file-browser/file-browser.component';
import { ShellComponent } from './components/shell/shell.component';
import { ExecuteCommandComponent } from './components/execute-command/execute-command.component';
import { ExecuteShellcodeComponent } from './components/execute-shellcode/execute-shellcode.component';
import { ExecuteAssemblyComponent } from './components/execute-assembly/execute-assembly.component';
import { ScreenshotsComponent } from './components/screenshots/screenshots.component';
import { SideLoadComponent } from './components/side-load/side-load.component';


const childRoutes = [
  { path: 'execute-assembly', component: ExecuteAssemblyComponent, canActivate: [ActiveConfig] },
  { path: 'execute-command', component: ExecuteCommandComponent, canActivate: [ActiveConfig] },
  { path: 'execute-shellcode', component: ExecuteShellcodeComponent, canActivate: [ActiveConfig] },
  { path: 'file-browser', component: FileBrowserComponent, canActivate: [ActiveConfig] },
  { path: 'info', component: InfoComponent, canActivate: [ActiveConfig] },
  { path: 'ps', component: PsComponent, canActivate: [ActiveConfig] },
  { path: 'screenshots', component: ScreenshotsComponent, canActivate: [ActiveConfig] },
  { path: 'shell', component: ShellComponent, canActivate: [ActiveConfig] },
  { path: 'side-load', component: SideLoadComponent, canActivate: [ActiveConfig] },
];

const routes: Routes = [

  { path: 'sessions', component: MainComponent, canActivate: [ActiveConfig] },
  {
    path: 'sessions/:session-id', component: InteractComponent, canActivate: [ActiveConfig],
    children: childRoutes,
  },
  {
    path: 'sessions-standalone/:session-id', component: StandaloneInteractComponent, canActivate: [ActiveConfig],
    children: childRoutes,
  },

];

export const SessionsRoutes: ModuleWithProviders<any> = RouterModule.forChild(routes);
