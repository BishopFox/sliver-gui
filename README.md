# Sliver GUI

[Sliver](https://github.com/BishopFox/sliver) GUI client.

⚠️ THIS PROJECT IS PRE-ALPHA AND FOR DEVELOPERS ONLY ⚠️

* The GUI client is NOT feature complete, expect bugs and missing features.
* Not accepting any issues/bug reports at this time, however feel free to submit PRs.
* There's no documentation or tutorials aside from this readme (and the repo wiki).


[![Tagged Release](https://github.com/BishopFox/sliver-gui/actions/workflows/autorelease.yml/badge.svg)](https://github.com/BishopFox/sliver-gui/actions/workflows/autorelease.yml) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

### Install

Download the [latest release](https://github.com/BishopFox/sliver-gui/releases) and connect to a Sliver server using a standard operator profile. See the [wiki](https://github.com/BishopFox/sliver-gui/wiki) for more details. 

### Features

* You can click on stuff!
* Sandboxed JavaScript scripting engine (with built-in script editor)
* i18n Language Support (French, Spanish, Japanese, Chinese)

### FAQ

#### Why Electron!?

Because I value my development time more than your RAM.

#### Are Electron Apps Secure?

I tried ¯\\_(ツ)_/¯. Having personally written multiple exploits for Electron apps, I like to think I have a fighting chance, and I really did go thru a lot of effort to make the Sliver GUI as secure as possible (the UI code is sandboxed and I even patched all of the `eval`s out of the protobuf code). You can [read more about the application architecture here](https://github.com/moloch--/reasonably-secure-electron). In short:
 * The renderer process is sandboxed, and preload scripts have context isolation enabled. Methods in the main process can only be called via `postMessage()`, and all JSON arguments must pass JSON-Schema checks.
 * No content runs in a `file://` origin, all content is served from internal Electron protocol handlers (i.e. `app://`).
 * A strict content content security policy (CSP) is applied to all origins (`script-src` does not allow `unsafe-inline` or `unsafe-eval`).
 * Nearly the entire interface is implemented via Angular data binding; there are zero calls to `bypassSecurityTrustHtml()`.

If you're concerned about security, I also encourage you to audit the code! See the repo security policy for bounties.

#### Why Not a Web Interface?

Sliver clients connect using gRPC over Mutual TLS (mTLS), which is not available from within a browser. Even sandboxed, Electron also lets us implement other native app integrations that would otherwise not be possible.


### Build

From the root of the git repo, to build your local platform:

```bash
npm install
cd main/workers/worker && npm install && cd ../../..
sudo npm install -g electron-packager
sudo npm install -g @angular/cli
npm run electron:local
```

If that works, then you should be able to do platform specific builds (`publish:macos` will build both x64 and arm64):

```
npm run publish:macos
npm run publish:windows
npm run publish:linux
```

You can also use `publish:windows_exe` to build a portable (i.e., no installer) Windows executable.

To work on i18n/translations, you'll likely need to install the `ngx-i18nsupport` package:

```
npm install -g ngx-i18nsupport
```
