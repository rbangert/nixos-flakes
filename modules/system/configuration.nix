{ config, pkgs, inputs, ... }:

# TODO: virtualization
# Virtmanager settings
#programs.dconf.enable = true;
#services.qemuGuest.enable = true;
# 
# virtualisation.libvirtd = {
#  enable = true;
#  qemuOvmf = true;
#  qemuRunAsRoot = true;
#  onBoot = "ignore";
#  onShutdown = "shutdown";
#};

# virtualisation.virtualbox.guest.enable = true;
# virtualisation.virtualbox.host.enable = true;
# virtualisation.virtualbox.host.enableExtensionPack = true;

# services.xrdp.enable = true;
# services.xrdp.defaultWindowManager = "startplasma-x11";
# networking.firewall.allowedTCPPorts = [ 3389 ];

# Docker
#virtualisation.docker.enable = true;
#virtualisation.docker.enableOnBoot = true;

{
  programs = {
    zsh.enable = true;
    gnupg.agent = {
      enable = true;
      enableSSHSupport = true;
    };
  };

  users.users.russ = {
    isNormalUser = true;
    #InitialHashedPassword = 
    openssh.authorizedKeys.keys = [
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOdfj6SbSBSWs2medcA8jKdFmVT1CL8l6iXTCyPUsw7y rbangert@proton.me"
    ];
    extraGroups = [ "wheel" "audio" "docker" "input" "networkmanager" ];
    shell = pkgs.zsh;
  };

  environment = {
    defaultPackages = [ ];
    systemPackages = with pkgs; [
      nano
      ripgrep
      ffmpeg
      tealdeer
      lynx
      vim
      nano
      bash
      exa
      htop
      fzf
      curl
      wget
      ranger
      #terminology
      alacritty
      xxh
      rsync
      remmina
      librewolf
      pass
      gnupg
      bat
      obsidian
      nb
      jq
      hugo
      ntfy-sh
      ntfy
      gotify-cli
      gotify-server
      gotify-desktop #
      xfce.thunar
      xfce.thunar-archive-plugin
      xfce.thunar-volman
      unzip
      lowdown
      zk
      slop
      imagemagick
      age
      libnotify
      kicad
      nodejs_20
      git
      gh
      python3
      lua
      zig
      perl
      go
      charm
      vhs
      glow
      gum
      yarn

      tmux-sessionizer
      mpv
      
      wf-recorder

      nil
      nixfmt
      nixpkgs-fmt
      #flake
      dstask
      # tui apps
      wtf
      lazygit
      lazycli
      lazydocker
      # what are these for?
      #python311Packages.tasklib
      #python311Packages.pynvim
      #python311Packages.shtab
      # Virtualization
      virt-viewer
      virt-manager-qt
      spice-gtk
      boxes
      docker-client
      pkgs._1password
      pkgs._1password-gui
      git-credential-1password
      # laptop stuff
      acpi
      tlp

      xcape
      tailscale
      dhcpcd
      busybox
      nmap
      copyq
      pstree
      wgcf # cloudflare warp client clone
      pulseaudio
      pavucontrol
      yai
      aichat
      mattermost-desktop
      matterhorn
      discordo #  
      nextcloud-client
      qownnotes #
    ];
    variables = {
      CFG = "$HOME/.config";
      NIXOS_CONFIG_DIR = "$HOME/.config/nixos";
      XDG_DATA_HOME = "$HOME/.local/share";
      XDG_CONFIG_HOME = "$HOME/.config";
      PASSWORD_STORE_DIR = "$HOME/.local/share/password-store";
      GTK_RC_FILES = "$HOME/.local/share/gtk-1.0/gtkrc";
      GTK2_RC_FILES = "$HOME/.local/share/gtk-2.0/gtkrc";
      MOZ_ENABLE_WAYLAND = "1";
      DIRENV_LOG_FORMAT = "";
      DISABLE_QT5_COMPAT = "0";
      DOTS = "$NIXOS_CONFIG_DIR";
      STUFF = "$HOME/stuff";
      JUNK = "$HOME/stuff/other";
    };
    sessionVariables = {
      EDITOR = "nvim";
      BROWSER = "librewolf";
      TERMINAL = "alacritty";
    };
  };

  fonts = {
    enableDefaultFonts = false;
    fonts = with pkgs; [
      noto-fonts
      noto-fonts-emoji
      jetbrains-mono
      nerdfonts
      twemoji-color-font
      material-icons
      material-symbols
      lexend
      openmoji-color
      jost
      (nerdfonts.override { fonts = [ "FiraCode" "JetBrainsMono" ]; })
    ];
    fontconfig = {
      hinting.autohint = true;
      defaultFonts = {
        serif = [ "Noto Serif" "Noto Color Emoji" ];
        sansSerif = [ "Noto Sans" "Noto Color Emoji" ];
        monospace = [ "JetBrainsMono Nerd Font" "Noto Color Emoji" ];
        emoji = [ "Noto Color Emoji" ];
      };
    };
  };

  nixpkgs = {
    config = {
      allowUnfree = true;
      permittedInsecurePackages = [
        "python-2.7.18.6"
      ];
    };
  };

  nix = {
    settings.auto-optimise-store = true;
    settings.allowed-users = [ "russ" ];
    gc = {
      automatic = true;
      dates = "weekly";
      options = "--delete-older-than 7d";
    };
    extraOptions = ''
      experimental-features = nix-command flakes
      keep-outputs = true
      keep-derivations = true
    '';

  };
  networking.hostName = "nixbook";

  boot = {
    #cleanOnBoot = true;
    loader = {
      systemd-boot.enable = true;
      systemd-boot.editor = false;
      timeout = 0;
      efi = {
        efiSysMountPoint = "/boot/efi";
        canTouchEfiVariables = true;
      };
    };
  };

  time.timeZone = "America/Denver";
  i18n.defaultLocale = "en_US.UTF-8";
  console = {
    font = "Lat2-Terminus16";
    keyMap = "us";
  };
networking.hostName = "nixbook";
  networking = {
    enableIPv6 = false;
    #networkmanager.enable = true;
    wireless.iwd.enable = true;
    firewall = {
      enable = true;
      checkReversePath = "loose";
      #    allowedTCPPorts = [ 443 80 ];
      #    allowedUDPPorts = [ 443 80 44857 ];
      #    allowPing = false;
    };
  };

  services.xserver.enable = true;

  services.xserver.displayManager.gdm.enable = true;
  services.xserver.desktopManager.gnome.enable = true;

  services = {
    tailscale.enable = true;
    openssh.enable = true;
    pipewire = {
      enable = true;
      alsa.enable = true;
      alsa.support32Bit = true;
      pulse.enable = true;
      jack.enable = true;
    };
    xserver.displayManager.lightdm = {
      greeters.slick = {
        enable = true;
        # TODO: theme lightdm https://github.com/linuxmint/lightdm-settings
        #theme =
        #iconTheme = 
        #font = 
        #draw-user-backgrounds = 
        #extraConfig = 
      };
    };
  };

  # Sound
  sound.enable = true;

  # Security 
  security = {
    sudo = {
      enable = true;
      wheelNeedsPassword = false;
    };
    rtkit.enable = true;
    doas = {
      enable = true;
      extraRules = [{
        users = [ "russ" ];
        keepEnv = true;
        persist = true;
      }];
    };
    # Extra security
    protectKernelImage = true;
  };

  hardware = {
    pulseaudio.enable = false;
    bluetooth.enable = true;
    opengl = {
      enable = true;
      driSupport = true;
      extraPackages = with pkgs; [
        intel-media-driver # LIBVA_DRIVER_NAME=iHD
        vaapiIntel # LIBVA_DRIVER_NAME=i965
        libvdpau-va-gl
      ];
    };
  };

  system = {
    stateVersion = "22.11";
    autoUpgrade = {
      enable = false;
      channel = "https://nixos.org/channels/nixos-unstable";
    };
  };
}
