{ pkgs, lib, config, ... }:

with lib;
let cfg = config.modules.development.vscode;

in {
    options.modules.development.vscode = { enable = mkEnableOption "vscode"; };
    config = mkIf cfg.enable {
        programs.vscode = {
            enable = true;
            package = pkgs.vscode;
            extensions = with pkgs.vscode-extensions; [
                golang.go
                arrterian.nix-env-selector
                brettm12345.nixfmt-vscode
                bungcip.better-toml
                esbenp.prettier-vscode
                Gruntfuggly.todo-tree
                
                #TODO: import extensions
                ##enkia.tokyo-night
                #eww-yuck.yuck
                #foxundermoon.shell-format
                #GitHub.remotehub
                #GitLab.gitlab-workflow              
                #hashicorp.terraform
                #hediet.vscode-drawio
                #jnoortheen.nix-ide
                #ms-azuretools.vscode-docker
                #ms-kubernetes-tools.vscode-kubernetes-tools
                #ms-vscode-remote.remote-ssh-edit
                #ms-vscode.azure-repos
                #ms-vscode.cpptools
                #ms-vscode.remote-explorer
                #ms-vscode.remote-repositories
                #ms-vscode.remote-server
                #ms-vscode.vscode-serial-monitor
                #oderwat.indent-rainbow
                #redhat.vscode-yaml
                #tal7aouy.rainbow-bracket
                #VisualStudioExptTeam.intellicode-api-usage-examples
                #vsciot-vscode.vscode-arduino
                #vscode-icons-team.vscode-icons
                #vscodevim.vim
            ];
            userSettings = {
                "terminal.integrated.fontFamily" = "JetBrainsMono Nerd Font";
            };
        };
    };
}
