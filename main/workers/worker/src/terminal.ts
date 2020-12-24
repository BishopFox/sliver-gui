
import { APP_ORIGIN } from './constants';

export class Terminal {

  private readonly TERMINAL_TYPE = 'terminal';

  write(data: string|Uint8Array) {
    parent.postMessage({
      type: this.TERMINAL_TYPE,
      method: 'write',
      data: data,
    }, APP_ORIGIN);
  }
  
}
  