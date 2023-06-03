{ inputs, pkgs, config, ... }:

{
	imports = [
		./direnv
		./git
		./nvim
		./vscode
    }
