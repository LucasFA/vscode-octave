{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # system should match the system you are running on
    system = "x86_64-linux";
    # system = "x86_64-darwin";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs {
        inherit system;
      };
    in pkgs.mkShell {
      packages = with pkgs; [
        nodejs_22
        typescript
        vsce
        #nodePackages.pnpm
        #(yarn.override { nodejs = nodejs_18; })
      ];

      shellHook = ''
        echo "node `${pkgs.nodejs}/bin/node --version`"
      '';
    };
  };
}
