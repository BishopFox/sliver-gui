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
    iframe.setAttribute("sandbox", "allow-scripts");
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

}
