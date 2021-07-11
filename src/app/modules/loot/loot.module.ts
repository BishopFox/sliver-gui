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
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseMaterialModule } from '@app/base-material';
import { SharedModule } from '@app/shared/shared.module';
import { 
  MainComponent, LootAddCredentialDialogComponent, LootAddFileDialogComponent,
} from './components/main/main.component';
import { LootFileTableComponent } from './components/loot-file-table/loot-file-table.component';
import { LootCredentialTableComponent } from './components/loot-credential-table/loot-credential-table.component';


@NgModule({
  declarations: [
    MainComponent,
    LootFileTableComponent,
    LootAddCredentialDialogComponent,
    LootAddFileDialogComponent,
    LootCredentialTableComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    BaseMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    SharedModule
  ]
})
export class LootModule { }
