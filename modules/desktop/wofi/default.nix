{ pkgs, lib, config, ... }:

with lib;
let cfg = config.modules.desktop.wofi;

in {
    options.modules.desktop.wofi = { enable = mkEnableOption "wofi"; };
    config = mkIf cfg.enable {
        home.file.".config/wofi.css".source = ./wofi.css;
    };
}
