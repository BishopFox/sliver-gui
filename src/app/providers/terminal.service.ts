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
  ----------------------------------------------------------------------

  General purpose terminal storage class, not all terminal objects are
  stored in this class, but it provides a general purpose storage option
  for multiple components.

*/

import { Injectable } from '@angular/core';
import { Terminal, ITerminalOptions } from 'xterm';


export interface SliverTerminal {
  id: number;
  name: string;
  terminal: Terminal;
}


@Injectable({
  providedIn: 'root'
})
export class TerminalService {

  // SessionID -> nextId
  private terminalIds = new Map<number, number>();
  // SessionID -> Namespace -> [id, SliverTerminal]
  private terminals = new Map<number, Map<string, Map<number, SliverTerminal>>>();
  private readonly DEFAULT_OPTIONS: ITerminalOptions = {
    scrollback: Number.MAX_VALUE,
    convertEol: true,
  };

  constructor() { }

  newTerminal(sessionId: number, namespace: string, name: string = '', options?: ITerminalOptions): SliverTerminal {
    const term = new Terminal(options ? options : this.DEFAULT_OPTIONS);
    let id: number;
    if (!this.terminals.has(sessionId)) {
      id = 1;
      this.terminalIds.set(sessionId, id);
      this.terminals.set(sessionId, new Map<string, Map<number, SliverTerminal>>());
      this.terminals.get(sessionId).set(namespace, new Map<number, SliverTerminal>());

    } else {
      id = this.nextId(sessionId);
    }
    if (name === '') {
      name = id.toString();
    }
    this.terminals.get(sessionId).get(namespace).set(id, {
      id: id,
      name: name,
      terminal: term,
    });
    return {
      id: id,
      name: name,
      terminal: term,
    };
  }

  private nextId(sessionId: number): number {
    let id = this.terminalIds.get(sessionId);
    id++
    this.terminalIds.set(sessionId, id);
    return id;
  }

  getId(sessionId: number, namespace: string, id: number): SliverTerminal {
    return this.terminals.get(sessionId)?.get(namespace)?.get(id);
  }

  getNamespace(sessionId: number, namespace: string): IterableIterator<[number, SliverTerminal]>|undefined {
    return this.terminals?.get(sessionId)?.get(namespace).entries();
  }

  getNamespaceTerminals(sessionId: number, namespace: string): SliverTerminal[] {
    const terms: SliverTerminal[] = [];
    if (this.terminals.has(sessionId) && this.terminals.get(sessionId).has(namespace)) {
      this.terminals.get(sessionId).get(namespace).forEach((term: SliverTerminal) => {
        terms.push(term);
      });
    }
    return terms.sort((a, b) => (a.id > b.id) ? 1 : -1);
  }

  delete(sessionId:number, namespace: string, id: number) {
    this.terminals.get(sessionId)?.get(namespace)?.delete(id);
  }

}
