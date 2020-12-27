handlers
=========

This package contains various namespaced handler functions that are called via IPC.

These handler functions represent the majority of the attack surface in the privileged code, so security around calls to those functions is paramount to not allowing untrusted code from escaping the sandbox (though we try very hard to prevent it from running even within the sandbox).

__IMPORTANT:__ Any handler function that accepts arguments MUST implement a JSON schema.

__IMPORTANT:__ Handler functions must accept specific arguments since calls are automatically dispatched from the IPC manager.
