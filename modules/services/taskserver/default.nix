




services = { 
    taskserver = { 
        enable = true;
        #debug = true;
        fqdn
        listenHost
        listenPort = 53589;
        organisations = {
            rrsv = {
                groups = [
                    "us"
                    "them"
                ];
                users = [
                    "russ"
                    "becca"
                ];
            };
        }
    };
}