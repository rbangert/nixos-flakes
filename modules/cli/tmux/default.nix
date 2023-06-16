{ pkgs, lib, config, ... }:

with lib;
let
  cfg = config.modules.cli.tmux;
  #configFiles = lib.snowfall.fs.get-files ./config;

  plugins = (with pkgs.tmuxPlugins; [
    tilish
    tmux-fzf
    vim-tmux-navigator
    weather
    catppuccin
    cpu
    {
      plugin = resurrect;
      extraConfig = "set -g @resurrect-strategy-nvim 'session'";
    }
    {
      plugin = continuum;
      extraConfig = ''
        set -g @continuum-restore 'on'
        set -g @continuum-save-interval '60' # minutes
      '';
    }
  ]);

in
{
  options.modules.cli.tmux = { enable = mkEnableOption "tmux"; };
  config = mkIf cfg.enable {
    programs.tmux = {
      enable = true;
      historyLimit = 2000;
      keyMode = "vi";
      terminal = "xterm-256color";
      mouse = true;
      tmuxp.enable = true;
      extraConfig = ''
        # Reload tmux config
        bind r source-file ~/.config/tmux/tmux.conf

        # Binding prefix to CTRL+SPACE
        unbind C-b
        set -g prefix C-Space
            
        set -g base-index 1 # Start windows at 1
            
        # Wayland Clipboard
        bind-key P run "wl-paste | tmux load-buffer -; tmux paste-buffer"
            
        # Set new panes to open in current directory
        bind c new-window -c "#{pane_current_path}"
        bind '"' split-window -c "#{pane_current_path}"
        bind % split-window -h -c "#{pane_current_path}"

        # vim-like pane switching
        bind -r ^ last-window
        bind -r k select-pane -U
        bind -r j select-pane -D
        bind -r h select-pane -L
        bind -r l select-pane -R
      '';

      inherit plugins;
    };
  };
}
