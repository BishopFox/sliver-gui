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
import { JobComponent } from './components/job/job.component';
import { WebsiteDetailsComponent } from './components/website-details/website-details.component';
import { StartListenerComponent } from './components/start-listener/start-listener.component';


const routes: Routes = [

  { path: 'jobs', component: MainComponent, canActivate: [ActiveConfig] },
  { path: 'jobs/start-c2-listener', component: StartListenerComponent, canActivate: [ActiveConfig] },
  { path: 'jobs/:job-id', component: JobComponent, canActivate: [ActiveConfig] },
  { path: 'jobs/websites/:name', component: WebsiteDetailsComponent, canActivate: [ActiveConfig] },

];

export const JobsRoutes: ModuleWithProviders<any> = RouterModule.forChild(routes);
