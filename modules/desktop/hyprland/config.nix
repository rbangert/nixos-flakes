# TODO: import config when it's done
{
  config,
  default,
  ...
}: let
  inherit (default) colors;

  pointer = config.home.pointerCursor;
  homeDir = config.home.homeDirectory;
in {
  wayland.windowManager.hyprland.extraConfig = ''

    '';
}