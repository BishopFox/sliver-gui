libraries
==========

Libraries are collections of file paths that can be automatically accessed by sandboxed code without user interaction.

For example, we can have a "Shellcode Library" that contains multiple shellcode files, and sandboxed code can automatically specify one of these files via it's ID when invoking a shellcode execute command. This improves the UX by not requiring the user to repeatedly select the file(s) for each invocation while still maintain privilege separation.

Only privileged code can add files to a library, currently only files (i.e., no directories) are supported.
