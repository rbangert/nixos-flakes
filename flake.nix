{
  description = "nix config";

  inputs = {
    nixpkgs.url = 
      "github:nixos/nixpkgs/nixos-23.05";
    unstable.url = 
      "github:nixos/nixpkgs/nixos-unstable";
  
    home-manager = {
      url = "github:nix-community/home-manager/release-23.05";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    fufexan = {
      url = "github:fufexan/dotfiles";
      inputs.fufexan.inputs.nixpkgs.follows = "nixpkgs";
    };
    plusultra = {
      url = "github:jakehamilton/config";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.unstable.follows = "unstable";
    };
		neovim = {
			url = "github:rbangert/neovim";
			# This flake currently requires changes that are only on the Unstable channel.
			inputs.nixpkgs.follows = "nixpkgs";
		};
    
    # Generate System Images
    nixos-generators.url = "github:nix-community/nixos-generators";
    nixos-generators.inputs.nixpkgs.follows = "nixpkgs";
    nixos-hardware.url = "github:nixos/nixos-hardware";
    # Snowfall Lib
    snowfall-lib.url = "github:snowfallorg/lib/dev";
    snowfall-lib.inputs.nixpkgs.follows = "nixpkgs";
    # Snowfall Flake
    flake.url = "github:snowfallorg/flake";
    flake.inputs.nixpkgs.follows = "unstable";
    flake.inputs.snowfall-lib.follows = "snowfall-lib";


    # System Deployment
    deploy-rs.url = "github:serokell/deploy-rs";
    deploy-rs.inputs.nixpkgs.follows = "unstable";

    nil-lsp.url = "github:oxalica/nil";
    nix-colors.url = "github:misterio77/nix-colors";
    hyprland.url = "github:hyprwm/Hyprland";



    #nur = {
    #  url = "github:nix-community/NUR";
    #  inputs.nixpkgs.follows = "nixpkgs";
    #};
  };


  outputs = { self, nixpkgs, unstable, fufexan, snowfall-lib, home-manager, ... }@inputs:
    let
      system = "x86_64-linux";
      pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
      lib = nixpkgs.lib;

      
      mkSystem = pkgs: system: hostname:
        pkgs.lib.nixosSystem {
          system = system;
          modules = [
            { networking.hostName = hostname; }
            ./modules/system/configuration.nix
            (./. + "/hosts/${hostname}/hardware-configuration.nix")
            home-manager.nixosModules.home-manager
            {
              home-manager = {
                useUserPackages = true;
                useGlobalPkgs = true;
                extraSpecialArgs = { inherit inputs; };
                users.russ = (./. + "/hosts/${hostname}/user.nix");
              };
            }
          ];
          specialArgs = { inherit inputs; neovim = inputs.neovim.defaultPackage.${system};};
        };

    in
    {
      nixosConfigurations = {
        russ-lappy = mkSystem inputs.nixpkgs "x86_64-linux" "russ-lappy";
      };
    };
    
}
