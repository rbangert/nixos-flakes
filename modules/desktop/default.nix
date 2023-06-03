{ inputs, pkgs, config, ... }:

{
    imports = [
        ./hyprland
        ./eww # TODO:
        ./dunst
        ./wofi # TODO: 
        ./xdg
    ];
}