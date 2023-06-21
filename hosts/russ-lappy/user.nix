{ inputs, neovim-flake, outputs, lib, config, pkgs, nixneovim, ... }: {

  imports = [
    ../../modules/apps/default.nix
    ../../modules/cli/default.nix
    ../../modules/desktop/default.nix
    ../../modules/development/default.nix
    ../../modules/nixos/default.nix
    ../../modules/scripts/default.nix
    inputs.neovim-flake.nixosModules.x86_64-linux
  #../../packages/modules/default.nix
  ];

  home = {
    username = "russ";
    homeDirectory = "/home/russ";
    sessionVariables = {
      EDITOR = "nvim";
      BROWSER = "firefox";
      TERMINAL = "alacritty";
    };
  };

  programs = {
    home-manager.enable = true;
    vscode.enable = true;
    neovim-ide = {
      enable = true;
      settings = {
      #... your options ...
      };
    };
  };

  modules = {
    apps.firefox.enable = false;

    desktop = {
      dunst.enable = true;
      eww.enable = true;
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
      git.enable = true;
      direnv.enable = false;
    };
  };

  nixpkgs = {
    overlays = with inputs; [
      snowfall-flake.overlay
    #    outputs.overlays.additions
    #    outputs.overlays.modifications
    #    outputs.overlays.unstable-packages
    #    # You can also add overlays exported from other flakes:
    #    # neovim-nightly-overlay.overlays.default
    ];
  };

  systemd.user.startServices = "sd-switch";

  home.stateVersion = "22.11";
}
