
{ inputs, outputs, lib, config, pkgs, ... }: {

  imports = [

    inputs.nix-colors.homeManagerModules.default

    # You can also split up your configuration and import pieces of it here:
    # ./nvim.nix
  ];

  nixpkgs = {
    overlays = [
      outputs.overlays.additions
      outputs.overlays.modifications
      outputs.overlays.unstable-packages
      # You can also add overlays exported from other flakes:
      # neovim-nightly-overlay.overlays.default
    ];
    config = {
      allowUnfree = true;
      allowUnfreePredicate = (_: true);
    };
  };

  homeasdd = {
    username = "russ";
    homeDirectory = "/home/russ";
    packages = with pkgs; [
      git
      wget
      curl
      zsh
      tailscale
      pulseaudio    
      pavucontrol   
    ];
  };

  programs = { 
    home-manager.enable = true;
    git.enable = true;
    vscode = {
      enable = true;
      extensions = with pkgs.vscode-extensions; [
        vscodevim.vim
      ];
    };
  };

  # Nicely reload system units when changing configs
  systemd.user.startServices = "sd-switch";

  # https://nixos.wiki/wiki/FAQ/When_do_I_update_stateVersion
 
}
