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
import { DragDropModule } from '@angular/cdk/drag-drop';
import { BaseMaterialModule } from '@app/base-material';
import { CreateImplantConfigComponent } from './components/create-implant-config/create-implant-config.component';
import { BuildsComponent, GeneratingDialogComponent } from './components/builds/builds.component';
import { BuildsTableComponent, RegenerateDialogComponent } from './components/builds-table/builds-table.component';
import { CanariesComponent } from './components/canaries/canaries.component';
import { GenerateComponent } from './components/generate/generate.component';
import {
  C2TableComponent, AddMTLSDialogComponent, AddHTTPDialogComponent, AddDNSDialogComponent
} from './components/c2-table/c2-table.component';
import { ImplantConfigComponent } from './components/implant-config/implant-config.component';


@NgModule({
  declarations: [
    CreateImplantConfigComponent,
    BuildsComponent,
    GeneratingDialogComponent,
    BuildsTableComponent,
    RegenerateDialogComponent,
    CanariesComponent,
    GenerateComponent,
    C2TableComponent,
    AddMTLSDialogComponent,
    AddHTTPDialogComponent,
    AddDNSDialogComponent,
    ImplantConfigComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BaseMaterialModule,
    DragDropModule,
  ],
  exports: [
    ImplantConfigComponent,
  ],
  entryComponents: [RegenerateDialogComponent]
})
export class GenerateModule { }
