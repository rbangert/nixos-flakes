

HISTSIZE="10000"
SAVEHIST="10000"

HISTFILE="$HOME/.cache/zsh_history"
mkdir -p "$(dirname "$HISTFILE")"

setopt HIST_FCNTL_LOCK
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_SPACE
unsetopt HIST_EXPIRE_DUPS_FIRST
setopt SHARE_HISTORY
unsetopt EXTENDED_HISTORY


source $ZDOTDIR/aliases
source $ZDOTDIR/functions
#source $ZPLUG_HOME/init.zsh
source $ZDOTDIR/

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
