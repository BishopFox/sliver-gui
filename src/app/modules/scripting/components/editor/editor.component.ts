import { Component, OnInit } from '@angular/core';
import { WorkersService } from '@app/providers/workers.service';

import { MonacoEditorLoaderService, MonacoEditorComponent } from '@materia-ui/ngx-monaco-editor';

import { Subject } from 'rxjs';
import { debounceTime, filter, take } from 'rxjs/operators';


@Component({
  selector: 'scripting-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  siaf: boolean = true;
  editor: MonacoEditorComponent;
  editorOptions = {
    theme: 'vs',
    fontFamily: 'Source Code Pro',
    fontSize: 13,
    language: 'javascript'
  };

  name: string;
  private _code = '\n\n\n';

  private debounceSave: Subject<void> = new Subject();
  lastSave: Date;

  constructor(private _workersService: WorkersService,
              private _monacoLoaderService: MonacoEditorLoaderService) {

    this._monacoLoaderService.isMonacoLoaded$.pipe(
      filter(isLoaded => isLoaded),
      take(1),
    ).subscribe(() => {
      this.registerSliverAutocomplete(monaco);
    });

  }

  ngOnInit() {
    this.debounceSave.pipe(debounceTime(500)).subscribe(() => {
      this.save();
    });
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

  }

  editorInit(editor: MonacoEditorComponent) {
    this.editor = editor;
  }

  async executeScript() {
    let execCode = this.siaf ? `(async () => { ${this.code} })();` : this.code;
    const execId = await this._workersService.startWorker(execCode);
    console.log(`Started execution with id ${execId}`);
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
