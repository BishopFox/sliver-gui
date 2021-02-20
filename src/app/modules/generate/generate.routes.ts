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
import { GenerateComponent } from './components/generate/generate.component';
import { BuildsComponent } from './components/builds/builds.component';
import { ProfilesComponent } from './components/profiles/profiles.component';
import { CreateProfileComponent } from './components/create-profile/create-profile.component';
import { BuildDetailsComponent } from './components/build-details/build-details.component';
import { CanariesComponent } from './components/canaries/canaries.component';


const routes: Routes = [

    { path: 'generate/new-implant', component: GenerateComponent, canActivate: [ActiveConfig] },
    { path: 'generate/builds', component: BuildsComponent, canActivate: [ActiveConfig] },
    { path: 'generate/profiles', component: ProfilesComponent, canActivate: [ActiveConfig] },
    { path: 'generate/new-profile', component: CreateProfileComponent, canActivate: [ActiveConfig] },
    { path: 'generate/build-details/:name', component: BuildDetailsComponent, canActivate: [ActiveConfig] },
    { path: 'generate/canaries', component: CanariesComponent, canActivate: [ActiveConfig] },

];

export const GenerateRoutes: ModuleWithProviders<any> = RouterModule.forChild(routes);
