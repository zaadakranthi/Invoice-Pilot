{ pkgs, ... }:

{
  # https://devenv.sh/basics/
  packages = [
    pkgs.nodejs_22
    pkgs.openssh
  ];

  # https://devenv.sh/scripts/
  scripts.dev.exec = "npm run dev";
  scripts.genkit-dev.exec = "npm run genkit:dev";
  scripts.genkit-watch.exec = "npm run genkit:watch";

  # https://devenv.sh/services/
  # services.postgres.enable = true;

  # https://devenv.sh/languages/
  languages.javascript.enable = true;

  # https://devenv.sh/pre-commit-hooks/
  pre-commit.hooks = {
    eslint.enable = true;
    prettier.enable = true;
  };

  enterShell = ''
    npm install
  '';
}
