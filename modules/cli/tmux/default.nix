{ pkgs, lib, config, ... }:

with lib;
let cfg = config.modules.cli.tmux;
configFiles = lib.snowfall.fs.get-files ./config;

  extrakto = pkgs.tmuxPlugins.mkTmuxPlugin {
    pluginName = "extrakto";
    version = "unstable-2021-04-04-wayland";
    src = pkgs.fetchFromGitHub {
      owner = "laktak";
      repo = "extrakto";
      rev = "de8ac3e8a9fa887382649784ed8cae81f5757f77";
      sha256 = "0mkp9r6mipdm7408w7ls1vfn6i3hj19nmir2bvfcp12b69zlzc47";
    };
    nativeBuildInputs = [ pkgs.makeWrapper ];
    postInstall = ''
      for f in extrakto.sh open.sh tmux-extrakto.sh; do
        wrapProgram $target/scripts/$f \
          --prefix PATH : ${with pkgs; lib.makeBinPath (
          [ pkgs.fzf pkgs.python3 pkgs.xclip wl-clipboard ]
          )}
      done
    '';
    meta = {
      homepage = "https://github.com/laktak/extrakto";
      description = "Fuzzy find your text with fzf instead of selecting it by hand ";
      license = lib.licenses.mit;
      platforms = lib.platforms.unix;
    };
  };

  plugins =
    [ extrakto ] ++
    (with pkgs.tmuxPlugins; [
      continuum
      tilish
      tmux-fzf
      #vim-tmux-navigator
      weather
    ]);

in {
    options.modules.cli.tmux = { enable = mkEnableOption "tmux"; };
    config = mkIf cfg.enable {
        programs.tmux = {
            enable = true;
            terminal = "tmux-256color";
            tmuxp.enable = true;
            inherit plugins;
        };
    };
}