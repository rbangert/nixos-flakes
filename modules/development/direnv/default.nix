{ pkgs, lib, config, ... }:

with lib;
let cfg = config.modules.development.direnv;

in {
    options.modules.development.direnv= { enable = mkEnableOption "direnv"; };
    config = mkIf cfg.enable {
        programs.direnv = {
            enable = true;
            nix-direnv.enable = true;
            enableZshIntegration = true;
        };
    };
}
