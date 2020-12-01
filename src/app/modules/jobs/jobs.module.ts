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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BaseMaterialModule } from '@app/base-material';
import { JobsTableComponent } from './components/jobs-table/jobs-table.component';
import { StartListenerComponent } from './components/start-listener/start-listener.component';
import { JobComponent, StopJobDialogComponent } from './components/job/job.component';
import { MainComponent } from './components/main/main.component';

@NgModule({
  declarations: [
    JobsTableComponent,
    StopJobDialogComponent,
    StartListenerComponent,
    JobComponent,
    MainComponent
  ],
  imports: [
    CommonModule,
    BaseMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule
  ],
  exports: [
    JobsTableComponent
  ]
})
export class JobsModule { }
