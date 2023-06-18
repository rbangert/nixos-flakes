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

        # Smart pane switching with awareness of Vim splits.
        # See: https://github.com/christoomey/vim-tmux-navigator
        is_vim="ps -o state= -o comm= -t '#{pane_tty}' \
            | grep -iqE '^[^TXZ ]+ +(\\S+\\/)?g?(view|l?n?vim?x?)(diff)?$'"
        bind-key -n 'C-h' if-shell "$is_vim" 'send-keys C-h'  'select-pane -L'
        bind-key -n 'C-j' if-shell "$is_vim" 'send-keys C-j'  'select-pane -D'
        bind-key -n 'C-k' if-shell "$is_vim" 'send-keys C-k'  'select-pane -U'
        bind-key -n 'C-l' if-shell "$is_vim" 'send-keys C-l'  'select-pane -R'
        tmux_version='$(tmux -V | sed -En "s/^tmux ([0-9]+(.[0-9]+)?).*/\1/p")'
        if-shell -b '[ "$(echo "$tmux_version < 3.0" | bc)" = 1 ]' \
            "bind-key -n 'C-\\' if-shell \"$is_vim\" 'send-keys C-\\'  'select-pane -l'"
        if-shell -b '[ "$(echo "$tmux_version >= 3.0" | bc)" = 1 ]' \
            "bind-key -n 'C-\\' if-shell \"$is_vim\" 'send-keys C-\\\\'  'select-pane -l'"
        
        bind-key -T copy-mode-vi 'C-h' select-pane -L
        bind-key -T copy-mode-vi 'C-j' select-pane -D
        bind-key -T copy-mode-vi 'C-k' select-pane -U
        bind-key -T copy-mode-vi 'C-l' select-pane -R
        bind-key -T copy-mode-vi 'C-\' select-pane -l
      '';

      inherit plugins;
    };
  };
}
