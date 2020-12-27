ipc
====

This directory contains the main IPC interface, which can be called from the sandboxed/renderer code. The primary code that can be called from within the sandbox is implemented in the `handlers/` package, and functionality is split up into various handler classes/namespaces that can be individually gated with IPC permissions.

This package also contains helper methods and classes.
