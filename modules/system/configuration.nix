{ config, pkgs, inputs, ... }:

{
    programs = {
        zsh.enable = true;
        mtr.enable = true;
        gnupg.agent = {
            enable = true;
            enableSSHSupport = true;
        };
    };

    users.users.russ = {
        isNormalUser = true;
        openssh.authorizedKeys.keys = [
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOdfj6SbSBSWs2medcA8jKdFmVT1CL8l6iXTCyPUsw7y rbangert@proton.me"
        ];
        extraGroups = [ "wheel" "audio" "docker" "input" "networkmanager" ];
        shell = pkgs.zsh;
    };

    environment = {
        defaultPackages = [ ];
        systemPackages = with pkgs; [
            acpi dhcpcd tlp 
            git zsh curl wget
            tailscale
            pulseaudio pavucontrol
        ];
        variables = {
            NIXOS_CONFIG_DIR = "$HOME/.config/nixos/";
            XDG_DATA_HOME = "$HOME/.local/share";
            PASSWORD_STORE_DIR = "$HOME/.local/share/password-store";
            GTK_RC_FILES = "$HOME/.local/share/gtk-1.0/gtkrc";
            GTK2_RC_FILES = "$HOME/.local/share/gtk-2.0/gtkrc";
            MOZ_ENABLE_WAYLAND = "1";
            EDITOR = "nvim";
            DIRENV_LOG_FORMAT = "";
            DISABLE_QT5_COMPAT = "0";
        };
    };

    # Install fonts
    fonts = {
        fonts = with pkgs; [
            jetbrains-mono
            roboto
            openmoji-color
            (nerdfonts.override { fonts = [ "JetBrainsMono" ]; })
        ];

        fontconfig = {
            hinting.autohint = true;
            defaultFonts = {
            emoji = [ "OpenMoji Color" ];
            };
        };
    };


    # Wayland stuff: enable XDG integration, allow sway to use brillo
    xdg = {
        portal = {
            enable = true;
            extraPortals = with pkgs; [
                xdg-desktop-portal-wlr
                xdg-desktop-portal-gtk
            ];
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

    # Set up networking and secure it
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
        xserver = { 
            enable = true;
            displayManager = {
                sddm.enable = true;
                sddm.enableHidpi  = true;
                sessionPackages = [ pkgs.hyprland ];
            };
            desktopManager.plasma5.enable = true;       
        };
        pipewire = {
            enable = true;
            alsa.enable = true;
            alsa.support32Bit = true;
            pulse.enable = true;
            jack.enable = true;
        };
    };

    # Sound
    sound.enable = true;

    # Security 
    security = {
        sudo.enable = true;
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
    
    system.stateVersion = "22.11";
}