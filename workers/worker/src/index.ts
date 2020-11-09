import * as commonpb from 'sliver-script/lib/pb/commonpb/common_pb';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import * as sliverpb from 'sliver-script/lib/pb/sliverpb/sliver_pb';
import * as Base64 from 'js-base64';
import { sprintf, vsprintf } from 'sprintf-js';

import { Sliver } from './sliver';
import { Terminal } from './terminal';
import { Colors } from './colors';


/* Export to 'window' */
declare global {
  interface Window { CommonPB: any; }
  interface Window { ClientPB: any; }
  interface Window { SliverPB: any; }
  interface Window { Base64: any; }
  interface Window { Sliver: Sliver; }
  interface Window { Terminal: Terminal; }
  interface Window { Colors: Colors; }
  interface Window { sprintf: any; }
  interface Window { vsprintf: any; }
}

// Functions
window.sprintf = sprintf;
window.vsprintf = vsprintf;

// Classes
window.CommonPB = commonpb;
window.ClientPB = clientpb;
window.SliverPB = sliverpb;
window.Base64 = Base64;
window.Sliver = new Sliver();
window.Terminal = new Terminal();
window.Colors = Colors;

// Hooks
const originalLog = console.log;
console.log = (...args: any[]): void => {
  originalLog(...args);
  
  if (1 < args.length) {
    window.Terminal.write(sprintf(args[0], ...args));
  } else {
    window.Terminal.write(args[0]);
  }

}

const originalError = console.error;
console.error = (...args: any[]): void => {
  originalError(...args);
  
  if (1 < args.length) {
    const err = sprintf(args[0], ...args);
    window.Terminal.write(`${Colors.Red}${err}${Colors.Reset}`);
  } else {
    window.Terminal.write(`${Colors.Red}${args[0]}${Colors.Reset}`);
  }

}

window.onerror = function(message, source, lineno, colno, error) {
  const fmtErr = Colors.Red+"%(message)s\r\nLine %(lineno)s:%(colno)s"+Colors.Reset;
  window.Terminal.write(sprintf(fmtErr, {
    message: message,
    source: source,
    lineno: lineno,
    colno: colno,
    error: error,
    stack: error.stack,
  }));

};