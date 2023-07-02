{
  description = "nix config";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
    unstable.url = "github:nixos/nixpkgs/nixos-unstable";
    nixos-hardware.url = "github:nixos/nixos-hardware";
    
    home-manager.url = "github:nix-community/home-manager/release-23.05";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";
    
    fufexan.url = "github:fufexan/dotfiles";
    fufexan.inputs.nixpkgs.follows = "nixpkgs";
    
    plusultra.url = "github:jakehamilton/config";
    plusultra.inputs.nixpkgs.follows = "nixpkgs";
    plusultra.inputs.unstable.follows = "unstable";
    
    neovim-flake.url = "github:cwfryer/neovim-flake";
    neovim-flake.inputs.nixpkgs.follows = "nixpkgs";

    deploy-rs.url = "github:serokell/deploy-rs";
    deploy-rs.inputs.nixpkgs.follows = "unstable";

    nixos-generators.url = "github:nix-community/nixos-generators";
    nixos-generators.inputs.nixpkgs.follows = "nixpkgs";
  
    snowfall-lib.url = "github:snowfallorg/lib/dev";
    snowfall-lib.inputs.nixpkgs.follows = "nixpkgs";
    flake.url = "github:snowfallorg/flake";
    flake.inputs.nixpkgs.follows = "unstable";
# TODO: 
    nixd.url = "github:nix-community/nixd";
    nil-lsp.url = "github:oxalica/nil";
    nix-colors.url = "github:misterio77/nix-colors";
    hyprland.url = "github:hyprwm/Hyprland";
  };

  outputs = { self, nixpkgs, unstable, neovim-flake, fufexan, flake, snowfall-lib, home-manager, ... }@inputs:
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
          specialArgs = { inherit inputs; };
        };

    in
    {
      nixosConfigurations = {
        nixbook = mkSystem inputs.nixpkgs "x86_64-linux" "nixbook";
      };
    };

}
