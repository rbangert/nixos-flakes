{ inputs, pkgs, config, ... }:

{
    imports = [
        ./foot
        #./tmux
        ./gpg
        ./zsh
    ];
}
