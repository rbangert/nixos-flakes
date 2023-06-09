#{ pkgs, lib, config, ... }:
#
#with lib;
#let cfg = config.modules.packages;
#    #screen = pkgs.writeShellScriptBin "screen" ''${builtins.readFile ./screen}'';
#    bandw = pkgs.writeShellScriptBin "bandw" ''${builtins.readFile ./bandw}'';
#    maintenance = pkgs.writeShellScriptBin "maintenance" ''${builtins.readFile ./maintenance}'';
#
#in {
#    options.modules.packages = { enable = mkEnableOption "packages"; };
#    config = mkIf cfg.enable {
#        home.packages = with pkgs; [
#            ripgrep ffmpeg tealdeer
#            exa htop fzf
#            pass gnupg bat obsidian
#            unzip lowdown zk slop
#            imagemagick age libnotify
#            git python3 lua zig 
#            mpv mattermost-desktop librewolf
#            bandw maintenance
#            wf-recorder nil nixpkgs-fmt 
#            taskwarrior taskwarrior-tui
#        ];
#    };
#}
