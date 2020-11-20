# Sliver GUI

[Sliver](https://github.com/BishopFox/sliver) GUI based on Electron/Angular/TypeScript. The GUI is an alternative to the Sliver console client.

![Node.js CI](https://github.com/moloch--/sliver-gui/workflows/Node.js%20CI/badge.svg) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

### Usage

Download the [latest release](https://github.com/moloch--/sliver-gui/releases) and connect to a Sliver server using a standard operator profile. See the [wiki](https://github.com/moloch--/sliver-gui/wiki) for more details.

### FAQ

#### Why Electron!?

Because I value my development time more than your RAM.

#### Why Not a Web Interface?

Sliver clients connect over mTLS, which is not available from within a browser. Futhermore, Electron allows us to implement file system and other native-host interactions that would otherwise not be possible.

#### Is Electron Secure?

While no one can write perfect code, we strive to adhere to application security best practices in every aspect of the GUI implementation. You can [read more about the application architecture here](). In short:
 * All content is in a non-`file://` origin.
 * A strict content content security policy (CSP) is applied to all content.
 * The renderer process is sandboxed, and preload scripts have context isolation enabled. Methods in the main process can only be called via JSON and all JSON arguments must pass JSON Schema checks.
 * Extremely limited DOM interactions, nearly the entire interface is implemented via Angular; there are zero calls to `bypassSecurityTrustHtml`.

### Features

* You can click on stuff!
* Sandboxed JavaScript scripting engine
* Built-in script editor
* i18n Language Support


### Build

From this directory:

```bash
npm install
cd workers/worker && npm install && cd ../..
npm install -g electron-packager
npm install -g @angular/cli
npm install -g ngx-i18nsupport
npm run electron:local
```

For platform specific builds use:

```
npm run electron:mac
npm run electron:windows
npm run electron:linux
```
