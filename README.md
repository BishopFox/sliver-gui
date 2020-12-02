# Sliver GUI

[Sliver](https://github.com/BishopFox/sliver) GUI based on Electron/Angular/TypeScript. The GUI is a Sliver client, you'll need to setup and [connect to a Sliver server](https://github.com/BishopFox/sliver/wiki/Multiplayer-Mode).

![Node.js CI](https://github.com/moloch--/sliver-gui/workflows/Node.js%20CI/badge.svg) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

### Usage

Download the [latest release](https://github.com/moloch--/sliver-gui/releases) and connect to a Sliver server using a standard operator profile. See the [wiki](https://github.com/moloch--/sliver-gui/wiki) for more details.

### Features

* You can click on stuff!
* Sandboxed JavaScript scripting engine
* Built-in script editor
* i18n Language Support


### FAQ

#### Why Electron!?

Because I value my development time more than your RAM.

#### Why Not a Web Interface?

Sliver clients connect over mTLS, which is not available from within a browser. Electron also lets us to implement other native-host interactions that would otherwise not be possible.

#### Is Electron Secure?

I at least tried ¯\\_(ツ)_/¯. You can [read more about the application architecture here](https://github.com/moloch--/reasonably-secure-electron). In short:
 * All content is in a non-`file://` origin.
 * A strict content content security policy (CSP) is applied to all origins.
 * The renderer process is sandboxed, and preload scripts have context isolation enabled. Methods in the main process can only be called via JSON and all JSON arguments must pass JSON Schema checks.
 * Extremely limited DOM interactions, nearly the entire interface is implemented via Angular; there are zero calls to `bypassSecurityTrustHtml`.

Please report any security bugs you may find, see the repo security policy for bounties.

### Build

From this directory, first do a local build:

```bash
npm install
cd workers/worker && npm install && cd ../..
npm install -g electron-packager
npm install -g @angular/cli
npm install -g ngx-i18nsupport
npm run electron:local
```

If that works, then you should be able to do platform specific builds:

```
npm run electron:mac
npm run electron:windows
npm run electron:linux
```
