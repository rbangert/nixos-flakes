{ inputs, pkgs, lib, config, ... }:

with lib;
let cfg = config.modules.desktop.hyprland;

in {
    options.modules.desktop.hyprland= { enable = mkEnableOption "hyprland"; };
    config = mkIf cfg.enable {
	home.packages = with pkgs; [
        wofi rofi swaybg wlsunset wl-clipboard
        swaylock swayidle grim slurp hyprland
        ];
    };
}
