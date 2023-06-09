{ pkgs, lib, config, ... }:

with lib;
let cfg = config.modules.development.git;

in {
    options.modules.development.git = { enable = mkEnableOption "git"; };
    config = mkIf cfg.enable {
        programs.git = {
            enable = true;
            userName = "rbangert";
            userEmail = "rbangert@proton.me";
            extraConfig = {
                init = { defaultBranch = "main"; };
                core = {
                    excludesfile = "$NIXOS_CONFIG_DIR/scripts/gitignore";
                };
            };
        };
    };
}
