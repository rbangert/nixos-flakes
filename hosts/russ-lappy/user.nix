{ inputs, outputs, lib, config, pkgs, ... }: {
  imports = [
    ../../modules/apps/default.nix
    ../../modules/cli/default.nix
    ../../modules/desktop/default.nix
    ../../modules/development/default.nix
    ../../modules/nixos/default.nix
    ../../modules/packages/default.nix
    ../../modules/scripts/default.nix
    #../../modules/system/default.nix

    inputs.nix-colors.homeManagerModules.default
  ];

  home = {
    username = "russ";
    homeDirectory = "/home/russ";
  };

  programs = {
    home-manager.enable = true;
    vscode.enable = true;
  };

  gtk = {
    enable = true;
    theme = {
      name = "Catppuccin-Macchiato-Compact-Pink-Dark";
      package = pkgs.catppuccin-gtk.override {
        accents = [ "pink" ];
        size = "compact";
        tweaks = [ "rimless" "black" ];
        variant = "macchiato";
      };
    };
  };

  modules = {
    packages.enable = true;
    apps.firefox.enable = true;

    desktop = {
      #eww.enable = true;
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
      #vscode-with-extensions.enable = true;
      #nvim.enable = true;
      git.enable = true;
      direnv.enable = false;
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
  };

  systemd.user.startServices = "sd-switch";

  home.stateVersion = "22.11";
}
