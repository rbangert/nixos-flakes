{ inputs, lib, config, pkgs, ... }:
with lib;
let
    cfg = config.modules.desktop.eww;

    reload_script = pkgs.writeShellScript "reload_eww" ''
        windows=$(eww windows | rg '\*' | tr -d '*')
        systemctl --user restart eww.service
        echo $windows | while read -r w; do
            eww open $w
        done
    '';

    dependencies = with pkgs; [
        bash
        blueberry
        bluez
        brillo
        coreutils
        dbus
        findutils
        gawk
        gnome.gnome-control-center
        gnused
        imagemagick
        jaq
        jc
        libnotify
        networkmanager
        pavucontrol
        playerctl
        procps
        pulseaudio
        ripgrep
        socat
        udev
        upower
        util-linux
        wget
        wireplumber
        wlogout
    ];

in {
  options.modules.desktop.eww = { 
      enable = mkEnableOption "eww"; 

      package = lib.mkOption {
          type = with lib.types; nullOr package;
          default = pkgs.eww-wayland;
          defaultText = lib.literalExpression "pkgs.eww-wayland";
          description = "Eww package to use.";
      };

      autoReload = lib.mkOption {
          type = lib.types.bool;
          default = false;
          defaultText = lib.literalExpression "false";
          description = "Whether to restart the eww daemon and windows on change.";
      };

      colors = lib.mkOption {
          type = with lib.types; nullOr lines;
          default = null;
          defaultText = lib.literalExpression "null";
          description = ''
              SCSS file with colors defined in the same way as Catppuccin colors are,
              to be used by eww.
              Defaults to Catppuccin Mocha.
          '';
      };
  };

  config = mkIf cfg.enable {
    home.packages = with pkgs; [
        eww-wayland
        pamixer
        brightnessctl
        (nerdfonts.override { fonts = [ "JetBrainsMono" ]; })
    ];

    xdg.configFile."eww" = {
        source = lib.cleanSourceWith {
            filter = name: _type: let
                baseName = baseNameOf (toString name);
            in
                !(lib.hasSuffix ".nix" baseName) && (baseName != "_colors.scss");
            src = lib.cleanSource ./.;
        };
        recursive = true;
        onChange =
            if cfg.autoReload
            then reload_script.outPath
            else "";
    };
    xdg.configFile."eww/css/_colors.scss".text =
      if cfg.colors != null
      then cfg.colors
      else (builtins.readFile ./css/_colors.scss);

    systemd.user.services.eww = {
      Unit = {
        Description = "Eww Daemon";
        # not yet implemented
        # PartOf = ["tray.target"];
        PartOf = ["graphical-session.target"];
      };
      Service = {
        Environment = "PATH=/run/wrappers/bin:${lib.makeBinPath dependencies}";
        ExecStart = "${cfg.package}/bin/eww daemon --no-daemonize";
        Restart = "on-failure";
      };
      Install.WantedBy = ["graphical-session.target"];
    };
  };
}

