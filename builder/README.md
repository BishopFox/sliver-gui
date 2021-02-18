Builder
========

Electron Builder config files, we need separate config files for each artifact because Electron Builder doesn't work when you want to do unheard of edge cases like build multiple artifacts for the same OS, or multiple artifacts for the same OS but with different architectures. You of course _can do this,_ but since you can't specify different names for artifacts when you try to upload them to GitHub everything explodes.
