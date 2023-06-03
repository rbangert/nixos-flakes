{ pkgs, lib, config, ... }:

with lib;
let cfg = config.modules.cli.tmux;

in {
    options.modules.cli.tmux = { enable = mkEnableOption "tmux"; };
    config = mkIf cfg.enable {
        programs.tmux = {
            enable = true;
            keyMode = "vi";
            shell = "\${pkgs.zsh}/bin/zsh";
            #extraConfig = "tmux.conf";
            #terminal = "screen-265color";
            #tmuxinator.enable
            tmuxp.enable = true;
            # TODO: configure tmuxp https://github.com/tmux-python/tmuxp
            plugins = with pkgs; [
              tmuxPlugins.cpu
              tmuxPlugins.battery
              tmuxPlugins.copycat
              tmuxPlugins.ctrlw
              tmuxPlugins.yank
              tmuxPlugins.catppuccin # https://github.com/catppuccin/tmux
              tmuxPlugins.tmux-fzf # https://github.com/sainnhe/tmux-fzf
              tmuxPlugins.better-mouse-mode # tmuxPlugins.better-mouse-mode
              tmuxPlugins.copy-toolkit # https://github.com/CrispyConductor/tmux-copy-toolkit
              tmuxPlugins.vim-tmux-focus-events # https://github.com/tmux-plugins/vim-tmux-focus-events
                {
                  plugin = tmuxPlugins.resurrect; # https://github.com/tmux-plugins/tmux-resurrect
                  extraConfig = "'set -g @resurrect-strategy-nvim 'session'";
                }
                {
                  plugin = tmuxPlugins.continuum; # https://github.com/tmux-plugins/tmux-continuum
                  extraConfig = "'
                    set -g @continuum-restore 'on'
                    set -g @continuum-save-interval '60' # minutes
                  '";
                }
                {
                  plugin = tmuxPlugins.weather; # https://github.com/xamut/tmux-weather
                  extraConfig = "'
                    set -g status-right '#{weather}'
                    set-option -g @tmux-weather-interval 60
                    set-option -g @tmux-weather-units 'u'
                    set-option -g @tmux-weather-format '%c+%t+%w+%m'
                  '";
                }
            ];


        };
    };
}