import { Injectable } from '@angular/core';

import { Terminal } from 'xterm';
import { IPCService } from './ipc.service';


export interface Script {
  id: string;
  name: string;
  code: string;
}

export interface WorkerOptions {
  siaf: boolean;
}

const WORKER_PROTOCOL = 'worker:';

@Injectable({
  providedIn: 'root'
})
export class WorkersService {

  private readonly TERMINAL_TYPE = "terminal";
  private readonly elemId = "workers";

  private _workers: Map<string, HTMLIFrameElement>;
  private _terminals: Map<string, Terminal>;

  constructor(private _ipcService: IPCService) {
    this._workers = new Map<string, HTMLIFrameElement>();
    this._terminals = new Map<string, Terminal>();
    window.addEventListener('message', (event) => {
      const origin = new URL(event.origin);
      if (origin.protocol !== WORKER_PROTOCOL || event.data?.type !== this.TERMINAL_TYPE) {
        return;
      }
      if (this._terminals.has(origin.hostname)) {
        const term = this._terminals.get(origin.hostname);
        console.log(`Term write: ${event.data?.data}`);
        term.write(event.data?.data);
      }
    });
  }

  private getWorkersElem(): HTMLElement {
    return document.getElementById(this.elemId);
  }

  async startWorker(scriptId: string, name: string, options: WorkerOptions): Promise<string> {
    
    const execId = await this._ipcService.request('script_execute', JSON.stringify({
      id: scriptId,
      options: {
        siaf: options.siaf,
      }
    }));

    const iframe = document.createElement('iframe');
    iframe.setAttribute("id", execId);
    iframe.setAttribute("name", name);
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    iframe.setAttribute("style", "display: none;");
    iframe.setAttribute("src", `worker://${execId}`);

    const terminal = new Terminal();
    this._terminals.set(execId, terminal);
    this._workers.set(execId, iframe);
    this.getWorkersElem().appendChild(iframe);

    return execId;
  }

  // execId->name
  workers(): Map<string, string> {
    const keys = Array.from(this._workers.keys());
    const workers = new Map<string, string>();
    keys.forEach(key => workers.set(key, this.getWorkerName(key)));
    return workers;
  }

  getWorkerTerminal(execId: string): Terminal {
    return this._terminals.get(execId);
  }

  getWorkerName(execId: string): string {
    const iframe = this._workers.get(execId);
    return iframe.getAttribute("name");
  }

  async stopWorker(execId: string): Promise<void> {
    const iframe = this._workers.get(execId);
    iframe?.remove();
    this._workers.delete(execId);
    await this._ipcService.request('script_stop', JSON.stringify({
      id: execId,
    }));
  }

  async listScripts(): Promise<any> {
    const scripts = await this._ipcService.request('script_list');
    return JSON.parse(scripts);
  }

  async newScript(name: string, code: string): Promise<string> {
    const id = await this._ipcService.request('script_new', JSON.stringify({
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

  async loadScript(id: string): Promise<Script> {
    const script = await this._ipcService.request('script_load', JSON.stringify({
      id: id,
    }));
    return JSON.parse(script);
  }

  async removeScript(id: string): Promise<void> {
    await this._ipcService.request('script_remove', JSON.stringify({
      id: id,
    }));
  }

}
