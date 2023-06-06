{ pkgs, lib, config, ... }:

with lib;
let cfg = config.modules.cli.tmux;
configFiles = lib.snowfall.fs.get-files ./config;

  #extrakto = pkgs.tmuxPlugins.mkTmuxPlugin {
  #  pluginName = "extrakto";
  #  version = "unstable-2021-04-04-wayland";
  #  src = pkgs.fetchFromGitHub {
  #    owner = "laktak";
  #    repo = "extrakto";
  #    rev = "de8ac3e8a9fa887382649784ed8cae81f5757f77";
  #    sha256 = "0mkp9r6mipdm7408w7ls1vfn6i3hj19nmir2bvfcp12b69zlzc47";
  #  };
  #  nativeBuildInputs = [ pkgs.makeWrapper ];
  #  postInstall = ''
  #    for f in extrakto.sh open.sh tmux-extrakto.sh; do
  #      wrapProgram $target/scripts/$f \
  #        --prefix PATH : ${with pkgs; lib.makeBinPath (
  #        [ pkgs.fzf pkgs.python3 pkgs.xclip wl-clipboard ]
  #        )}
  #    done
  #  '';
  #  meta = {
  #    homepage = "https://github.com/laktak/extrakto";
  #    description = "Fuzzy find your text with fzf instead of selecting it by hand ";
  #    license = lib.licenses.mit;
  #    platforms = lib.platforms.unix;
  #  };
  #};

  plugins =
    #[ extrakto ] ++
    (with pkgs.tmuxPlugins; [
      continuum
      nord
      tilish
      tmux-fzf
      vim-tmux-navigator
      weather
    ]);

in {
    options.modules.cli.tmux = { enable = mkEnableOption "tmux"; };
    config = mkIf cfg.enable {
        programs.tmux = {
            enable = true;
            keyMode = "vi";
            shell = "\${pkgs.zsh}/bin/zsh";
            #extraConfig = "~/.config/tmux/tmux.conf";
            #terminal = "screen-265color";
            #tmuxinator.enable
            tmuxp.enable = true;

            inherit plugins;
            # TODO: configure tmuxp https://github.com/tmux-python/tmuxp
            #plugins = with pkgs; [
            #  tmuxPlugins.cpu
            #  tmuxPlugins.battery
            #  tmuxPlugins.copycat
            #  tmuxPlugins.ctrlw
            #  tmuxPlugins.yank
            #  tmuxPlugins.catppuccin # https://github.com/catppuccin/tmux
            #  tmuxPlugins.tmux-fzf # https://github.com/sainnhe/tmux-fzf
            #  tmuxPlugins.better-mouse-mode # tmuxPlugins.better-mouse-mode
            #  tmuxPlugins.copy-toolkit # https://github.com/CrispyConductor/tmux-copy-toolkit
            #  tmuxPlugins.vim-tmux-focus-events # https://github.com/tmux-plugins/vim-tmux-focus-events
            #    {
            #      plugin = tmuxPlugins.resurrect; # https://github.com/tmux-plugins/tmux-resurrect
            #      extraConfig = "'set -g @resurrect-strategy-nvim 'session'";
            #    }
            #    {
            #      plugin = tmuxPlugins.continuum; # https://github.com/tmux-plugins/tmux-continuum
            #      extraConfig = "'
            #        set -g @continuum-restore 'on'
            #        set -g @continuum-save-interval '60' # minutes
            #      '";
            #    }
            #    {
            #      plugin = tmuxPlugins.weather; # https://github.com/xamut/tmux-weather
            #      extraConfig = "'
            #        set -g status-right '#{weather}'
            #        set-option -g @tmux-weather-interval 60
            #        set-option -g @tmux-weather-units 'u'
            #        set-option -g @tmux-weather-format '%c+%t+%w+%m'
            #      '";
            #    }
            #];
        };
    };
}