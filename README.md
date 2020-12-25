# Sliver GUI

[Sliver](https://github.com/BishopFox/sliver) GUI based on Electron/Angular/TypeScript. The GUI is a Sliver client, you'll need to setup and [connect to a Sliver server](https://github.com/BishopFox/sliver/wiki/Multiplayer-Mode).

![Node.js CI](https://github.com/moloch--/sliver-gui/workflows/Node.js%20CI/badge.svg) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

### Usage

Download the [latest release](https://github.com/moloch--/sliver-gui/releases) and connect to a Sliver server using a standard operator profile. See the [wiki](https://github.com/moloch--/sliver-gui/wiki) for more details.

### Features

* You can click on stuff!
* Sandboxed JavaScript scripting engine (with built-in script editor)
* i18n Language Support (French, Spanish, Japanese, Chinese)

### FAQ

#### Why Electron!?

Because I value my development time more than your RAM.

#### Are Electron Apps Secure?

I tried ¯\\_(ツ)_/¯. Having personally written multiple exploits for Electron apps, I like to think I have a fighting chance. You can [read more about the application architecture here](https://github.com/moloch--/reasonably-secure-electron). In short:
 * No content runs in a `file://` origin, all content is served from internal Electron protocol handlers (i.e. `app://`).
 * A strict content content security policy (CSP) is applied to all origins (`script-src` does not allow `unsafe-inline` or `unsafe-eval`).
 * The renderer process is sandboxed, and preload scripts have context isolation enabled. Methods in the main process can only be called via `postMessage()` / JSON, and all JSON arguments must pass JSON-Schema checks.
 * Nearly the entire interface is implemented via Angular data binding; there are zero calls to `bypassSecurityTrustHtml()`.

If you're concerned about security, I also encourage you to audit the code! See the repo security policy for bounties.

#### Why Not a Web Interface?

Sliver clients connect over mTLS, which is not available from within a browser. Electron allows lets us to implement other native-host interactions that would otherwise not be possible.


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
