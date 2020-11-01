# Sliver GUI

Electron based Sliver GUI written in Angular/TypeScript.

## Design Goals

### Why Electron?

Because I value my development time more than your RAM.

## Build

Built with the following prerequisites:

* Node v13.8.0
* npm v6.13.7
* protoc v3.11.4

From this directory:

```bash
npm install
npm install -g electron-packager
npm install -g ts-protoc-gen
npm install -g @angular/cli
./protobuf.sh
npm run electron:local
```

## Source Code

Source code is organized as follows:

`main.ts` - Electron entrypoint.

`preload.js` - Electron preload script used to bridge the sandbox code to the Node process.

`ipc/` - Node IPC handler code, this translates messages from the `preload.js` script into RPC or local procedure calls that cannot be done from within the sandbox.

`rpc/` - TypeScript implementation of Sliver's RPC protocol.

`src/` - Angular source code (webview code).
