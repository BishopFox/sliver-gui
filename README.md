# Sliver GUI

Electron based Sliver GUI written in Angular/TypeScript.

![Node.js CI](https://github.com/moloch--/sliver-gui/workflows/Node.js%20CI/badge.svg)

#### Why Electron?

Because I value my development time more than your RAM.

### Build

From this directory:

```bash
npm install
npm install -g electron-packager
npm install -g ts-protoc-gen
npm install -g @angular/cli
./protobuf.sh
npm run electron:local
```
