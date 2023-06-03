{ inputs, pkgs, config, ... }:

{
    home.stateVersion = "22.11";
    imports = [
        ./apps
        ./cli
        ./desktop
        ./development

        # system
        ./packages
    ];
}
