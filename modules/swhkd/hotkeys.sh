#! @runtimeShell@

PATH="$PATH:@path@"

@psmisc@/bin/killall swhks

@out@/bin/swhks & /run/wrappers/bin/pkexec @out@/bin/swhkd -c "$HOME"/.config/swhkd/swhkdrc

## Old script that doesn't work on nixos 
##!/usr/bin/env bash
#
#killall swhks
#swhks & pkexec swhkd -c $HOME/.config/swhkd/swhkdrc