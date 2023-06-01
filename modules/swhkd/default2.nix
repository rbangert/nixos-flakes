{
  lib,
  rustPlatform,
  makeWrapper,
  psmisc,
  runtimeShell,
}:  

let
  swhkd = {
    pname = "swhkd";
    version = "3b19fc33b32efde88311579152a1078a8004397c";
    src = fetchFromGitHub ({
      owner = "waycrate";
      repo = "swhkd";
      rev = "3b19fc33b32efde88311579152a1078a8004397c";
      fetchSubmodules = false;
      sha256 = "sha256-245Y3UicW33hrQ6Mtf07I9vsWSpuijIEoEhxIKtjVQE=";
    });
    cargoLock."Cargo.lock" = {
      lockFile = ./cargo.lock;
      outputHashes = {
      };
    };
    date = "2022-12-23";
  };
in
  rustPlatform.buildRustPackage {
    inherit pname src version;

    cargoLock = cargoLock."Cargo.lock";

    preInstall = ''
      mkdir -p $out/lib/systemd/user $out/share/polkit-1/actions

      substitute ./contrib/init/systemd/hotkeys.service "$out/lib/systemd/user/swhkd.service" \
        --replace '# ExecStart=/path/to/hotkeys.sh' "ExecStart=/run/wrappers/bin/pkexec $out/bin/swhkd"

      substitute ./com.github.swhkd.pkexec.policy "$out/share/polkit-1/actions/com.github.swhkd.pkexec.policy" \
        --replace /usr/bin/swhkd "$out/bin/swhkd"
    '';

  nativeBuildInputs = [makeWrapper];

  postInstall = ''
    cp ${./swhkd.service} ./swhkd.service
    cp ${./hotkeys.sh} ./hotkeys.sh
    chmod +x ./hotkeys.sh
    install -D -m0444 -t "$out/lib/systemd/user" ./swhkd.service
    install -D -m0444 -t "$out/share/swhkd" ./hotkeys.sh
    install -D -m0444 -t "$out/share/polkit-1/actions" ./com.github.swhkd.pkexec.policy
    chmod +x "$out/share/swhkd/hotkeys.sh"
    substituteInPlace "$out/share/swhkd/hotkeys.sh" \
      --replace @runtimeShell@ "${runtimeShell}" \
      --replace @psmisc@ "${psmisc}" \
      --replace @out@ "$out"
    substituteInPlace "$out/lib/systemd/user/swhkd.service" \
      --replace @out@ "$out/share/swhkd/hotkeys.sh"
    substituteInPlace "$out/share/polkit-1/actions/com.github.swhkd.pkexec.policy" \
      --replace /usr/bin/swhkd \
        "$out/bin/swhkd"
  '';
  }

  