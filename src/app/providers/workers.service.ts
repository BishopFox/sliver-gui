import { Injectable } from '@angular/core';

import { IPCService } from './ipc.service';


@Injectable({
  providedIn: 'root'
})
export class WorkersService {

  private readonly elemId = "workers";

  constructor(private _ipcService: IPCService) { }

  private getWorkersElem(): HTMLElement {
    return document.getElementById(this.elemId);
  }

  async startWorker(code: string): Promise<string> {
    
    const execId = await this._ipcService.request('script_execute', JSON.stringify({
      code: code
    }));

    const iframe = document.createElement('iframe');
    iframe.setAttribute("id", execId);
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    iframe.setAttribute("style", "display: none;");
    iframe.setAttribute("src", `worker://${execId}`);
    
    this.getWorkersElem().appendChild(iframe);
    return execId;
  }

  async listWorkers(): Promise<string[]> {

    return [];
  }

  async stopWorker(execId: string): Promise<void> {
    this.getWorkersElem().querySelector(`#${execId}`).remove();
    await this._ipcService.request('script_stop', JSON.stringify({
      execId: execId,
    }));
  }

  async listScripts(): Promise<[string, string][]> {
    let scripts = await this._ipcService.request('script_list');
    return JSON.parse(scripts)?.scripts;
  }

  async newScript(name: string, code: string): Promise<string> {
    let id = await this._ipcService.request('script_new', JSON.stringify({
      name: name,
      code: code,
    }));
    return id;
  }

  async updateScript(id: string, name: string, code: string): Promise<void> {
    await this._ipcService.request('script_update', JSON.stringify({
      id: id,
      name: name,
      code: code,
    }));
  }

  async loadScript(id: string): Promise<[string, string]> {
    const rawScript = await this._ipcService.request('script_load', JSON.stringify({
      id: id,
    }));
    const script = JSON.parse(rawScript);
    return [script.name, script.code];
  }

  async removeScript(id: string): Promise<void> {
    await this._ipcService.request('script_remove', JSON.stringify({
      id: id,
    }));
  }

}
