{ pkgs, nixneovim, lib, config, ... }:

with lib;
let
  cfg = config.modules.development.neovim;
in
{
  options.modules.development.neovim = { enable = mkEnableOption "neovim"; };
  config = mkIf cfg.enable {
    programs.nixneovim = {
      enable = true;
      #extraConfigVim = ''
      #  lua << EOF
      #    ${lib.strings.fileContents ./config/init.lua}
      #  EOFnix 
      #'';
      colorschemes.rose-pine = {
        enable = true;
        #extraConfig = ''
        #'';
      };
      # to install plugins just activate their modules
      plugins = {
        lsp = {
          enable = true;
          #hls.enable = true;
          #rust-analyzer.enable = true;
        };
        treesitter = {
          enable = true;
          indent = true;
        };
        mini = {
          enable = true;
          ai.enable = true;
          jump.enable = true;
        };
        airline = {
          # https://github.com/vim-airline/vim-airline
          enable = true;
          powerline = true;
          theme = "angr";
        };
        barbar = {
          enable = true;
          #extraConfig = ''
          #'';
        };
      };

      # Not all plugins have own modules
      # You can add missing plugins here
      # `pkgs.vimExtraPlugins` is added by the overlay you added at the beginning
      # For a list of available plugins, look here: [available plugins](https://github.com/jooooscha/nixpkgs-vim-extra-plugins/blob/main/plugins.md)
      extraPlugins = [ pkgs.vimExtraPlugins ];
    };
  };
}
