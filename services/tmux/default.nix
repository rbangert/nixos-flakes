    
    
    systemd.user.services = {
        tmux-master = {
            Unit = {
                Description = "tmux-master";
            };
            Service = {
                Type=oneshot;
                User = russ;
                ExecStart = "$HOME/bin/tmux new-session -s master -d";
                ExecStop= "$HOME/bin/tmux kill-session -t master";
            };
            Install.WantedBy = ["multi-user.target"];
        };
        tmux-1 = {
            Unit = {
                Description = "tmux-1";
                PartOf = master.service;
                After = master.service;
            };
            Service = {
                Type = oneshot;
                RemainAfterExit = yes;
                User = russ;
                ExecStart = "$HOME/bin/tmux new-session -s tmux1 -d";
                ExecStop= "$HOME/bin/tmux kill-session -t tmux1";
            };
            Install.WantedBy = ["multi-user.target"];
        };
        tmux-2 = {
            Unit = {
                Description = "tmux-2";
                PartOf = master.service;
                After = master.service;
            };
            Service = {
                Type = oneshot;
                RemainAfterExit = yes;
                User = russ;
                ExecStart = "$HOME/bin/tmux new-session -s tmux2 -d";
                ExecStop= "$HOME/bin/tmux kill-session -t tmux2";
            };
            Install.WantedBy = ["multi-user.target"];
        };