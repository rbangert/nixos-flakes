{ inputs, lib, config, pkgs, ... }:
with lib;
let
    cfg = config.modules.desktop.eww;
in
{
    options.modules.desktop.eww = { enable = mkEnableOption "eww"; };

    config = mkIf cfg.enable {
        # theres no programs.eww.enable here because eww looks for files in .config
        # thats why we have all the files
    
        # eww package
        home = {
            packages = with pkgs; [
                eww-wayland
                pamixer
                brightnessctl
                (nerdfonts.override { fonts = [ "JetBrainsMono" ]; })
            ];

            # configuration
            file.".config/eww/eww.scss".source = ./eww.scss;
            file.".config/eww/eww.yuck".source = ./eww.yuck;

            # scripts
            file.".config/eww/modules/trash.sh" = {
                source = ./modules/trash.sh;
                executable = true;
            };

            file.".config/eww/modules/noisetorch.sh" = {
                source = ./modules/noisetorch.sh;
                executable = true;
            };

            file.".config/eww/modules/updates.sh" = {
                source = ./modules/updates.sh;
                executable = true;
            };

            file.".config/eww/modules/github.sh" = {
                source = ./modules/github.sh;
                executable = true;
            };

            file.".config/eww/modules/ping.sh" = {
                source = ./modules/ping.sh;
                executable = true;
            };

            file.".config/eww/modules/workspaces.sh" = {
                source = ./modules/workspaces.sh;
                executable = true;
            };

            file.".config/eww/modules/player.sh" = {
                source = ./modules/player.sh;
                executable = true;
            };

            file.".config/eww/modules/nvidia.sh" = {
                source = ./modules/nvidia.sh;
                executable = true;
            };

            file.".config/eww/modules/notifications.sh" = {
                source = ./modules/notifications.sh;
                executable = true;
            };

            file.".config/eww/modules/microphone.sh" = {
                source = ./modules/microphone.sh;
                executable = true;
            };

            file.".config/eww/modules/speaker.sh" = {
                source = ./modules/speaker.sh;
                executable = true;
            };
        };
    };
}
