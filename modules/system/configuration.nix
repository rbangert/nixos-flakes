{ config, pkgs, inputs, ... }:


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
          ripgrep ffmpeg tealdeer
          exa htop fzf curl wget
          pass gnupg bat obsidian xfce.thunar
          unzip lowdown zk slop
          imagemagick age libnotify
          git python3 lua zig perl go
          mpv mattermost-desktop librewolf
          # TODO: examine these scripts left over in modules/packages 
          # bandw maintenance 
          wf-recorder nil nixpkgs-fmt 
          taskwarrior taskwarrior-tui
          acpi tlp vim nano     
          tailscale dhcpcd
          pulseaudio pavucontrol
        ];
        variables = {
            CONFIG_DIR = "$HOME/.config";
            NIXOS_CONFIG_DIR = "$HOME/.config/nixos";
            XDG_DATA_HOME = "$HOME/.local/share";
            XDG_CONFIG_HOME = "$HOME/.config";
            PASSWORD_STORE_DIR = "$HOME/.local/share/password-store";
            GTK_RC_FILES = "$HOME/.local/share/gtk-1.0/gtkrc";
            GTK2_RC_FILES = "$HOME/.local/share/gtk-2.0/gtkrc";
            MOZ_ENABLE_WAYLAND = "1";
            EDITOR = "nvim";
            DIRENV_LOG_FORMAT = "";
            DISABLE_QT5_COMPAT = "0";
            DOTS = "$NIXOS_CONFIG_DIR";
            STUFF = "$HOME/stuff";
            JUNK = "$HOME/stuff/other";
            TASKRC= "$CONFIG_DIR/taskrc";
            };
        };

    fonts = {
      enableDefaultFonts = false;
      fonts = with pkgs; [
        noto-fonts noto-fonts-emoji
        jetbrains-mono nerdfonts
        twemoji-color-font 
        material-icons lexend
        openmoji-color jost 
        (nerdfonts.override { fonts = [ "FiraCode" "JetBrainsMono" ]; })
      ];
      fontconfig = {
        hinting.autohint = true;
        defaultFonts = { 
          serif = ["Noto Serif" "Noto Color Emoji"];
          sansSerif = ["Noto Sans" "Noto Color Emoji"];
          monospace = ["JetBrainsMono Nerd Font" "Noto Color Emoji"];
          emoji = ["Noto Color Emoji"];
        };
      };
    };

    nixpkgs.config.allowUnfree = true;

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

    boot = {
        #cleanOnBoot = true;
        loader = {
        systemd-boot.enable = true;
        systemd-boot.editor = false;
        timeout = 0;
            efi ={
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

    networking = {
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
                vaapiIntel         # LIBVA_DRIVER_NAME=i965 (older but works better for Firefox/Chromium)
                vaapiVdpau
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
