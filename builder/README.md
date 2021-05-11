Builder
========

Electron Builder config files, we need separate config files for each artifact because Electron Builder doesn't work when you want to build multiple artifacts for the same OS but with different architectures. You of course _can try do this,_ but since you can't specify different names for artifacts, so when you try to upload them to GitHub everything explodes.
