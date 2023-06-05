{ inputs, lib, config, pkgs, ... }:

with lib;
let cfg = config.modules.cli.zsh;

#TODO: finish customization of shell
in {
  options.modules.cli.zsh = { enable = mkEnableOption "zsh"; };
  config = mkIf cfg.enable {
    home.packages = with pkgs; [
    zsh
    oh-my-posh
    powerline-go
    ];

        #home.file.".config/zsh/starship.toml".source = ./myStarship.toml;
        
        #programs.starship.enable = true; 
        
        programs.zsh = {
            enable = true;
            dotDir = ".config/zsh";
            #interactiveShellInit = ;
            initExtra = ''
                #export ZPLUG_HOME="$ZDOTDIR/zplug"
                #export STARSHIP_CONFIG="$ZDOTDIR/starship.toml"
                source $ZDOTDIR/aliases
                source $ZDOTDIR/functions
                #source $ZPLUG_HOME/init.zsh

                #source $ZDOTDIR/powerline-go

                eval "$(oh-my-posh init zsh --config ~/.config/zsh/princess.yml)"
                #eval "$(oh-my-posh init zsh)"
                #eval "$(starship init zsh)"

                ## Install Zplug
                #if [[ ! -d $ZDOTDIR/zplug ]]; then
                #    git clone https://github.com/zplug/zplug $ZDOTDIR/zplug
                #    source $ZPLUG_HOME/init.zsh && zplug update --self
                #fi

                # Plugin List
                #zplug "chrissicool/zsh-256color"
                #zplug "zsh-users/zsh-completions"
                #zplug "rupa/z"
                #zplug "changyuheng/fz.sh"
                #zplug "zsh-users/zsh-history-substring-search", defer:3

                ## Install new plugins
                #if ! zplug check --verbose; then
                #    printf "Install? [y/N]: "
                #    if read -q; then
                #        echo; zplug install
                #    else
                #        echo
                #    fi
                #fi

                #zplug load

                # TODO: evaluate
                #PROMPT="%F{blue}%m %~%b "$'\n'"%(?.%F{green}%Bλ%b |.%F{red}?) %f"
                #bindkey '^ ' autosuggest-accept
                #edir() { tar -cz $1 | age -p > $1.tar.gz.age && rm -rf $1 &>/dev/null && echo "$1 encrypted" }
                #ddir() { age -d $1 | tar -xz && rm -rf $1 &>/dev/null && echo "$1 decrypted" }
            '';

            history = {
                save = 10000;
                size = 10000;
                path = "$HOME/.cache/zsh_history";
            };
            #enableCompletion = true;
            #enableAutosuggestions = true;
            #enableSyntaxHighlighting = true;
#
            ## Source all plugins, nix-style
            #plugins = [
            #    {
            #        name = "auto-ls";
            #        src = pkgs.fetchFromGitHub {
            #            owner = "notusknot";
            #            repo = "auto-ls";
            #            rev = "62a176120b9deb81a8efec992d8d6ed99c2bd1a1";
            #            sha256 = "08wgs3sj7hy30x03m8j6lxns8r2kpjahb9wr0s0zyzrmr4xwccj0";
            #        };
            #    }
            # ];
    };
  };
}