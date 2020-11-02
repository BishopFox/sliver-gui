# Sliver GUI

Electron based Sliver GUI written in Angular/TypeScript.

![Node.js CI](https://github.com/moloch--/sliver-gui/workflows/Node.js%20CI/badge.svg) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

### Usage

Download the [latest release](https://github.com/moloch--/sliver-gui/releases) and connect to a Sliver server using a standard operator profile. See the [wiki](https://github.com/moloch--/sliver-gui/wiki) for more details.

### FAQ

#### Why Electron?

Because I value my development time more than your RAM.

#### Electron is Insecure!

You can read about the [security architecture of this application here](https://github.com/moloch--/reasonably-secure-electron).

### Build

From this directory:

```bash
npm install
npm install -g electron-packager
npm install -g ts-protoc-gen
npm install -g @angular/cli
npm run electron:local
```

For platform specific builds use:

```
npm run electron:mac
npm run electron:windows
npm run electron:linux
```
