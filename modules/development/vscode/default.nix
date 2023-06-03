{ pkgs, lib, config, ... }:

with lib;
let cfg = config.modules.vscode-with-extensions;

in {
    options.modules.vscode-with-extensions = { enable = mkEnableOption "vscode-with-extensions"; };
    config = mkIf cfg.enable {
        programs.vscode-with-extensions = {
            enable = true;
        };
    };
}
