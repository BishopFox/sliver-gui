import { Component, OnInit } from '@angular/core';
import { IPCService } from '@app/providers/ipc.service';
import { WorkersService } from '@app/providers/workers.service';
import { MonacoEditorLoaderService, MonacoEditorComponent } from '@materia-ui/ngx-monaco-editor';

import { filter, take } from 'rxjs/operators';


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  editor: MonacoEditorComponent;
  editorOptions = {
    theme: 'vs',
    fontFamily: 'Source Code Pro',
    fontSize: 13,
    language: 'javascript'
  };
  code = 'function x() {\nconsole.log("Hello world!");\n}';

  constructor(private _ipcService: IPCService,
              private _workersService: WorkersService,
              private _monacoLoaderService: MonacoEditorLoaderService) {

    this._monacoLoaderService.isMonacoLoaded$.pipe(
      filter(isLoaded => isLoaded),
      take(1),
    ).subscribe(() => {
      console.log(monaco);
      //monaco.setTheme(...);
    });
  }

  ngOnInit() {

  }

  editorInit(editor) {
    console.log(editor);
    this.editor = editor;
  }

  async executeScript() {
    console.log(`Executing script, with code\n${this.code}`);
    const execId = await this._workersService.startWorker(this.code);
    console.log(`Started execution with id ${execId}`);
  }

}
