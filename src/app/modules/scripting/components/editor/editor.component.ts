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

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MonacoEditorLoaderService, MonacoEditorComponent } from '@materia-ui/ngx-monaco-editor';

import { Subject, Subscription } from 'rxjs';
import { debounceTime, filter, take } from 'rxjs/operators';

import { WorkersService, Script } from '@app/providers/workers.service';
import { FadeInOut } from '@app/shared/animations';
import { ClientService, Themes } from '@app/providers/client.service';


@Component({
  selector: 'scripting-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  animations: [FadeInOut],
})
export class EditorComponent implements OnInit {

  siaf: boolean = true;
  editor: MonacoEditorComponent;
  editorOptions: any;
  lastSave: Date;
  scriptId: string;
  name: string;
  private _code = '';
  private debounceSave: Subject<void> = new Subject();
  private debounceSub: Subscription;

  constructor(private _route: ActivatedRoute,
              private _router: Router,
              private _workersService: WorkersService,
              private _clientService: ClientService,
              private _monacoLoaderService: MonacoEditorLoaderService) 
  {
    this._monacoLoaderService.isMonacoLoaded$.pipe(
      filter(isLoaded => isLoaded),
      take(1),
    ).subscribe(() => {
      this.registerSliverAutocomplete(monaco);
    });

  }

  ngOnInit() {
    this.initEditorOptions();
    this._route.params.pipe(take(1)).subscribe((params) => {
      this.scriptId = params['script-id'];
      this._workersService.loadScript(this.scriptId).then((script: Script) => {
        this.name = script.name;
        this.code = script.code;
      }).catch(() => {
        console.log(`No session with id ${this.scriptId}`);
      });
    });
    this.debounceSub = this.debounceSave.pipe(debounceTime(500)).subscribe(() => {
      this.save();
    });
  }

  ngOnDestroy(): void {
    this.debounceSub?.unsubscribe();
  }

  get code() {
    return this._code;
  }

  set code(value: string) {
    this._code = value;
    this.debounceSave.next();
  }

  async save() {
    this.lastSave = new Date();
    this._workersService.updateScript(this.scriptId, this.name, this.code);
  }

  async editorInit(editor: MonacoEditorComponent) {
    this.editor = editor;
  }

  async executeScript() {
    await this.save();
    const execId = await this._workersService.startWorker(this.scriptId, this.name, {
      siaf: true,
    });
    console.log(`Started execution with id ${execId}`);
    this._router.navigate(['scripting', 'tasks', execId]);
  }

  async initEditorOptions() {
    let theme = await this._clientService.getTheme();
    if (theme === Themes.Auto) {
      const isDark = await this._clientService.getSystemThemeIsDark();
      theme = isDark ? Themes.Dark : Themes.Light;
    }
    if (theme === Themes.Dark) {
      this.editorOptions =  {
        theme: 'vs-dark',
        fontFamily: 'Source Code Pro',
        fontSize: 13,
        language: 'javascript'
      };
    } else {
      this.editorOptions = {
        theme: 'vs',
        fontFamily: 'Source Code Pro',
        fontSize: 13,
        language: 'javascript'
      };
    }
  }

  // --------------------
  // > Autocomplete Code
  // --------------------

  private createRootSuggestions(range) {
    return [
      {
        label: 'Sliver',
        kind: monaco.languages.CompletionItemKind.Class,
        documentation: "Sliver API Class",
        insertText: 'Sliver.',
        range: range
      },
      {
        label: 'CommonPB',
        kind: monaco.languages.CompletionItemKind.Class,
        documentation: "Common protobuf definitions",
        insertText: 'CommonPB.',
        range: range
      },
      {
        label: 'SliverPB',
        kind: monaco.languages.CompletionItemKind.Class,
        documentation: "Sliver protobuf definitions",
        insertText: 'SliverPB.',
        range: range
      },
      {
        label: 'ClientPB',
        kind: monaco.languages.CompletionItemKind.Class,
        documentation: "Client protobuf definitions",
        insertText: 'ClientPB.',
        range: range
      }
    ];
  }

  registerSliverAutocomplete(monaco: any) {
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        let word = model.getWordUntilPosition(position);
        let range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        return {
          suggestions: this.createRootSuggestions(range)
        };
      }
    });
  }


}
