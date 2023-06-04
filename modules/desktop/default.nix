{ inputs, pkgs, config, ... }:

{
    imports = [
        ./hyprland
        ./dunst
        ./eww
        ./wofi # TODO: 
        ./xdg
    ];
}