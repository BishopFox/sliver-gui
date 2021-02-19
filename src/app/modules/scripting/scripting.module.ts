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


import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './components/editor/editor.component';
import { FormsModule } from '@angular/forms';
import { BaseMaterialModule } from '@app/base-material';
import { FlexLayoutModule } from '@angular/flex-layout';

import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { BrowserComponent, DeleteScriptDialogComponent } from './components/browser/browser.component';
import { TaskManagerComponent, StopTaskDialogComponent } from './components/task-manager/task-manager.component';
import { MainComponent, NewScriptDialogComponent } from './components/main/main.component';
import { TaskComponent } from './components/task/task.component';


@NgModule({
  declarations: [
    EditorComponent,
    BrowserComponent,
    DeleteScriptDialogComponent,
    NewScriptDialogComponent,
    StopTaskDialogComponent,
    TaskManagerComponent,
    MainComponent,
    TaskComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    BaseMaterialModule,
    MonacoEditorModule,
    FlexLayoutModule,
  ]
})
export class ScriptingModule { }
