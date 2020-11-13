# Sliver GUI

[Sliver](https://github.com/BishopFox/sliver) GUI based on Electron/Angular/TypeScript. The GUI is an alternative to the Sliver console client.

![Node.js CI](https://github.com/moloch--/sliver-gui/workflows/Node.js%20CI/badge.svg) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

### Usage

Download the [latest release](https://github.com/moloch--/sliver-gui/releases) and connect to a Sliver server using a standard operator profile. See the [wiki](https://github.com/moloch--/sliver-gui/wiki) for more details.

### FAQ

#### Why Electron!?

Because I value my development time more than your RAM.

### Features

* You can click on stuff!
* Sandboxed JavaScript scripting engine
* Built-in scripting editor
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
