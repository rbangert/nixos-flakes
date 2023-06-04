{ config, lib, pkgs, ... }:

with lib;
let
  cfg = config.modules.development.neovim;
  install_lsp = pkgs.writeShellScriptBin "install_lsp" ''
      #!/bin/bash 
    if [ ! -d ~/.npm-global ]; then  
            mkdir ~/.npm-global
            npm set prefix ~/.npm-global
      else 
            npm set prefix ~/.npm-global
    fi
    npm i -g npm vscode-langservers-extracted typescript typescript-language-server bash-language-server
  '';
in {
  options.modules.development.neovim = { enable = mkEnableOption "neovim"; };
  config = mkIf cfg.enable {
    programs = {
    neovim = {
      enable = true;
      withPython3 = true;
      withNodeJs = true;
      extraPackages = [
      ];
      #-- Plugins --#
      plugins = with pkgs.vimPlugins;[ 
        barbecue-nvim # https://github.com/utilyre/barbecue.nvim
        yuck-vim # https://github.com/elkowar/yuck.vim/
      ];
    };
  };
  home = {
    packages = with pkgs; [
      neovide
      uivonim
      #-- LSP --#
      install_lsp
      rnix-lsp
      lua-language-server
      gopls
      pyright
      zk
      rust-analyzer
      clang-tools
      haskell-language-server
      #-- tree-sitter --#
      tree-sitter
      #-- format --#
      stylua
      black
      nixpkgs-fmt
      rustfmt
      beautysh
      nodePackages.prettier
      stylish-haskell
      #-- Debug --#
      lldb
    ];
  };

    home.file.".config/nvim/init.lua".source = ./init.lua;
    home.file.".config/nvim/lua".source = ./lua;
  };
}
