import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { WorkersService } from '@app/providers/workers.service'

@Component({
  selector: 'scripting-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.scss']
})
export class BrowserComponent implements OnInit {

  scripts: [string, string][] = [];

  constructor(private _router: Router,
              private _workerService: WorkersService) { }

  ngOnInit(): void {
    this.fetchScripts();
  }

  async fetchScripts() {
    this.scripts = await this._workerService.listScripts();
    console.log(this.scripts);
  }

  async newScript(name: string) {
    const scriptId = await this._workerService.newScript(name, '\n\n\n');
    this._router.navigate(['scripting', 'editor', scriptId]);
  }

}
