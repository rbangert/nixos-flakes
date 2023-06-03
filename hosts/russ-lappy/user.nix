{ inputs, outputs, lib, config, pkgs, ... }: 
{
    imports = [ 
        ../../modules/default.nix
        inputs.nix-colors.homeManagerModules.default
        # ./nvim.nix 
        ];

    home = {
        username = "russ";
        homeDirectory = "/home/russ";
    };

    modules = {
        apps = { 
            firefox.enable = true;
        };
        
        desktop = {
            eww.enable = true;
            dunst.enable = true;
            hyprland.enable = true;
            wofi.enable = true;
            xdg.enable = true;
        };

        cli = {
            foot.enable = true;
            zsh.enable = true;  
            gpg.enable = true;
            tmux.enable = true;
        };

        development = {
            vscode.enable = true;
            nvim.enable = true;
            git.enable = true;
            direnv.enable = false;
        };
        # system

        packages.enable = true;
    };

    programs.home-manager.enable = true;

    nixpkgs = {
        #overlays = [
        #    outputs.overlays.additions
        #    outputs.overlays.modifications
        #    outputs.overlays.unstable-packages
        #    # You can also add overlays exported from other flakes:
        #    # neovim-nightly-overlay.overlays.default
        #];
        config = {
            allowUnfree = true;
            allowUnfreePredicate = (_: true);
        };
    };

    systemd.user.startServices = "sd-switch";

    home.stateVersion = "22.11";    
}
