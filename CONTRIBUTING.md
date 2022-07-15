Contributing to Sliver GUI
===========================

## General

* Contributions to core code must be GPLv3 (but not libraries)
* If you'd like to work on a feature, please open a ticket and assign it to yourself
* Changes should be made in a new branch
* Please [sign](https://docs.github.com/en/github/authenticating-to-github/signing-commits) commits for any PR to master
* Please provide meaningful commit messages
* Ensure code passes existing unit tests, or provide updated test(s)
* Please use TypeScript types whenever possible.
* Try to keep PRs succinct to one feature/change/fix 


## Security

Electron is a [security minefield](https://github.com/moloch--/reasonably-secure-electron), please adhere the following guidelines:

* _Never_ use `eval()`, `.innerHTML`, `BypassSecurityTrustHtml()`, or any other dangerous (e.g. string concatenation / string interpolation) methods when interacting with the DOM.
* _Never_ enable an `unsafe-` directive for active content source in the Content-Security-Policy (the only exception is `style-src` with has inline enabled, which Angular needs).
* _Never_ modify the `default-src`, it should _always_ be set to `none` for any window or web context.
* _Never_ trust IPC messages originating from the renderer (i.e., sandbox) all messages must be validated using JSON Schema in addition to any parameter specific validation.
* _Never_ trust the user, applied in a common-sense way.
* _Never_ enable `NodeIntegration` in _any_ window or web context, you MUST call native code via the IPC interface (including web workers, etc).
* _Avoid_ expanding the Content-Security-Policy
* __Secure by default__, please ensure any contributed code follows this methodology to the best of your ability. It should be difficult to insecurely configure features/servers.
    - It is better to fail securely than operate in an insecure manner.
* _Avoid_ incorporating user controlled values when constructing file/directory paths. Ensure any values that must be incorporated into paths are properly canonicalized.
* _Never_ use homegrown or non-peer reviewed encryption or random number generation algorithms.
* Whenever possible, use the following algorithms/encryption modes:
    - AES-GCM-256
    - ED25519
    - SHA2-256 / HMAC-SHA2-256 or higher (e.g. SHA2-384)
    - ChaCha20Poly1305
* _Never_ use the following in a security context, and _avoid_ use even in a non-security context:
    - MD5
    - SHA1
    - AES-ECB
    - AES-CBC, AES-CTR, etc. -without use case justification
* `math.rand` should _never_ be used to generate values related to a security context.
* Always apply the most restrictive file permissions possible.

