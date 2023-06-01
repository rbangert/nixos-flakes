{ inputs, outputs, lib, config, pkgs, ... }: 
{
    imports = [ 
        ../../modules/default.nix
        inputs.nix-colors.homeManagerModules.default
        # You can also split up your configuration and import pieces of it here:
        # ./nvim.nix 
        ];

    home = {
        username = "russ";
        homeDirectory = "/home/russ";
        #programs.hyprland = { 
        #    enable = true;
        #    nvidiaPatches = false;
        #    xwayland = {
        #        enable = true;
        #        hidpi = true;
        #    };
        #    #inputs.hyprland-plugins.packages.${pkgs.system}.hyprbars
        #    #    "/absolute/path/to/plugin.so"
        #    #];
        #};
    };

    modules = {
        # gui
        firefox.enable = true;
        foot.enable = true;
        eww.enable = true;
        dunst.enable = true;
        hyprland.enable = true;
        wofi.enable = true;

        # cli
        nvim.enable = true;
        zsh.enable = true;
        git.enable = true;
        gpg.enable = true;
        direnv.enable = false;

        # system
        xdg.enable = true;
        packages.enable = true;
    };

    programs = { 
        home-manager.enable = true;
        vscode = {
            enable = true;
            extensions = with pkgs.vscode-extensions; [
                vscodevim.vim
            ];
        };
    };

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
