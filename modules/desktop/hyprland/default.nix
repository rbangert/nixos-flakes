{ inputs, pkgs, lib, config, ... }:

with lib;
let cfg = config.modules.desktop.hyprland;

in {
  options.modules.desktop.hyprland= { 
    enable = mkEnableOption "hyprland"; 
    
    security.pam.services.swaylock = { };
    xdg.portal = {
      enable = true;
      wlr.enable = true;
    };
  };
  config = mkIf cfg.enable {
	home.packages = with pkgs; [
        wofi rofi swaybg wlsunset wl-clipboard waybar cliphist
        swaylock-effects swayidle grim slurp hyprland
        ];
  };
}
