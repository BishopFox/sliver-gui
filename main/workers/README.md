workers
========

This package contains the code that manages and loads worker scripts. Worker scripts are loaded via the `worker://` protocol into sandboxed iframes within the main window, and each worker iframe runs in a distinct origin.

The `worker/` subdirectory contains helper code that is loaded into the worker iframe in addition to the user provided code. All code within a worker iframe (including the helper code) is considered untrusted.

Worker frames can call a subset of IPC handlers, and can also write to `Terminal` objects in the main window but are otherwise restricted (i.e., workers cannot change GUI settings, etc).
