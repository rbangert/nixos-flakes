{ inputs, lib, config, pkgs, ... }:

with lib;
let cfg = config.modules.development.nixneovim;
in {
  options.modules.cli.nixneovim = { enable = mkEnableOption "nixneovim"; };
  config = mkIf cfg.enable {
    home.packages = with pkgs; [
      nixneovim
    ];
    programs.nixneovim = {
      enable = true;
      extraConfigVim = ''
        # you can add your old config to make the switch easier
        ${lib.strings.fileContents ./init.vim}
        # or with lua
        lua << EOF
          ${lib.strings.fileContents ./init.lua}
        EOF
      '';
# NOTE: https://nixneovim.github.io/NixNeovim/options.html
      # to install plugins just activate their modules
      plugins = {
        lsp = {
          enable = true;
          hls.enable = true;
          rust-analyzer.enable = true;
          servers = { 
            nil = {
              enable = true;
              #extraConfig = ''
              #'';
            };
            rnix-lsp = {
              enable = true;
              #extraConfig = ''
              #'';
            };
            gopls = {
              enable = true;
              #extraConfig = ''
              #'';
            };
            bashls = {
              enable = true;
              #extraConfig = ''
              #'';
            };
          };
        };
        vimwiki.enable  = true;
        which-key.enable  = true;
        treesitter = {
          enable = true;
          indent = true;
        };
        mini = {
          enable = true;
          ai.enable = true;
          jump.enable = true;
        };
        telescope = { 
          enable = true; 
        };
        todo-comments.enable = { 
          enable = true; 
        };
      };
      colorschemes.tokyonight = {
        enable = true;
      };
      # Not all plugins have own modules
      # You can add missing plugins here
      # `pkgs.vimExtraPlugins` is added by the overlay you added at the beginning
      # For a list of available plugins, look here: [available plugins](https://github.com/jooooscha/nixpkgs-vim-extra-plugins/blob/main/plugins.md)
      #extraPlugins = [ pkgs.vimExtraPlugins.<plugin> ];
    };
  };
}