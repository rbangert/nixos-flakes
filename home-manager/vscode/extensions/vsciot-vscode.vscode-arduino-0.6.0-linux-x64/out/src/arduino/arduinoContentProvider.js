"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArduinoContentProvider = void 0;
const path = require("path");
const Uuid = require("uuid/v4");
const vscode = require("vscode");
const arduinoActivator_1 = require("../arduinoActivator");
const arduinoContext_1 = require("../arduinoContext");
const Constants = require("../common/constants");
const JSONHelper = require("../common/cycle");
const deviceContext_1 = require("../deviceContext");
const Logger = require("../logger/logger");
const localWebServer_1 = require("./localWebServer");
class ArduinoContentProvider {
    constructor(_extensionPath) {
        this._extensionPath = _extensionPath;
        this._onDidChange = new vscode.EventEmitter();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this._webserver = new localWebServer_1.default(this._extensionPath);
            // Arduino Boards Manager
            this.addHandlerWithLogger("show-boardmanager", "/boardmanager", (req, res) => this.getHtmlView(req, res));
            this.addHandlerWithLogger("show-packagemanager", "/api/boardpackages", (req, res) => __awaiter(this, void 0, void 0, function* () { return yield this.getBoardPackages(req, res); }));
            this.addHandlerWithLogger("install-board", "/api/installboard", (req, res) => __awaiter(this, void 0, void 0, function* () { return yield this.installPackage(req, res); }), true);
            this.addHandlerWithLogger("uninstall-board", "/api/uninstallboard", (req, res) => __awaiter(this, void 0, void 0, function* () { return yield this.uninstallPackage(req, res); }), true);
            this.addHandlerWithLogger("open-link", "/api/openlink", (req, res) => __awaiter(this, void 0, void 0, function* () { return yield this.openLink(req, res); }), true);
            this.addHandlerWithLogger("open-settings", "/api/opensettings", (req, res) => this.openSettings(req, res), true);
            // Arduino Libraries Manager
            this.addHandlerWithLogger("show-librarymanager", "/librarymanager", (req, res) => this.getHtmlView(req, res));
            this.addHandlerWithLogger("load-libraries", "/api/libraries", (req, res) => __awaiter(this, void 0, void 0, function* () { return yield this.getLibraries(req, res); }));
            this.addHandlerWithLogger("install-library", "/api/installlibrary", (req, res) => __awaiter(this, void 0, void 0, function* () { return yield this.installLibrary(req, res); }), true);
            this.addHandlerWithLogger("uninstall-library", "/api/uninstalllibrary", (req, res) => __awaiter(this, void 0, void 0, function* () { return yield this.uninstallLibrary(req, res); }), true);
            this.addHandlerWithLogger("add-libpath", "/api/addlibpath", (req, res) => __awaiter(this, void 0, void 0, function* () { return yield this.addLibPath(req, res); }), true);
            // Arduino Board Config
            this.addHandlerWithLogger("show-boardconfig", "/boardconfig", (req, res) => this.getHtmlView(req, res));
            this.addHandlerWithLogger("load-installedboards", "/api/installedboards", (req, res) => this.getInstalledBoards(req, res));
            this.addHandlerWithLogger("load-configitems", "/api/configitems", (req, res) => __awaiter(this, void 0, void 0, function* () { return yield this.getBoardConfig(req, res); }));
            this.addHandlerWithLogger("update-selectedboard", "/api/updateselectedboard", (req, res) => this.updateSelectedBoard(req, res), true);
            this.addHandlerWithLogger("update-config", "/api/updateconfig", (req, res) => __awaiter(this, void 0, void 0, function* () { return yield this.updateConfig(req, res); }), true);
            this.addHandlerWithLogger("run-command", "/api/runcommand", (req, res) => this.runCommand(req, res), true);
            // Arduino Examples TreeView
            this.addHandlerWithLogger("show-examplesview", "/examples", (req, res) => this.getHtmlView(req, res));
            this.addHandlerWithLogger("load-examples", "/api/examples", (req, res) => __awaiter(this, void 0, void 0, function* () { return yield this.getExamples(req, res); }));
            this.addHandlerWithLogger("open-example", "/api/openexample", (req, res) => this.openExample(req, res), true);
            yield this._webserver.start();
        });
    }
    provideTextDocumentContent(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!arduinoContext_1.default.initialized) {
                yield arduinoActivator_1.default.activate();
            }
            let type = "";
            if (uri.toString() === Constants.BOARD_MANAGER_URI.toString()) {
                type = "boardmanager";
            }
            else if (uri.toString() === Constants.LIBRARY_MANAGER_URI.toString()) {
                type = "librarymanager";
            }
            else if (uri.toString() === Constants.BOARD_CONFIG_URI.toString()) {
                type = "boardConfig";
            }
            else if (uri.toString() === Constants.EXAMPLES_URI.toString()) {
                type = "examples";
            }
            const timeNow = new Date().getTime();
            return `
        <html>
        <head>
            <script type="text/javascript">
                window.onload = function() {
                    console.log('reloaded results window at time ${timeNow}ms');
                    var doc = document.documentElement;
                    var styles = window.getComputedStyle(doc);
                    var backgroundcolor = styles.getPropertyValue('--background-color') || '#1e1e1e';
                    var color = styles.getPropertyValue('--color') || '#d4d4d4';
                    var theme = document.body.className || 'vscode-dark';
                    var url = "${(yield vscode.env.asExternalUri(this._webserver.getEndpointUri(type))).toString()}?" +
                            "theme=" + encodeURIComponent(theme.trim()) +
                            "&backgroundcolor=" + encodeURIComponent(backgroundcolor.trim()) +
                            "&color=" + encodeURIComponent(color.trim());
                    document.getElementById('frame').src = url;
                };
            </script>
        </head>
        <body style="margin: 0; padding: 0; height: 100%; overflow: hidden;">
            <iframe id="frame" width="100%" height="100%" frameborder="0" style="position:absolute; left: 0; right: 0; bottom: 0; top: 0px;"/>
        </body>
        </html>`;
        });
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
    getHtmlView(req, res) {
        return res.sendFile(path.join(this._extensionPath, "./out/views/index.html"));
    }
    getBoardPackages(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            yield arduinoContext_1.default.boardManager.loadPackages(req.query.update === "true");
            return res.json({
                platforms: JSONHelper.decycle(arduinoContext_1.default.boardManager.platforms, undefined),
            });
        });
    }
    installPackage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.body.packageName || !req.body.arch) {
                return res.status(400).send("BAD Request! Missing { packageName, arch } parameters!");
            }
            else {
                try {
                    yield arduinoContext_1.default.arduinoApp.installBoard(req.body.packageName, req.body.arch, req.body.version);
                    return res.json({
                        status: "OK",
                    });
                }
                catch (error) {
                    return res.status(500).send(`Install board failed with message "code:${error.code}, err:${error.stderr}"`);
                }
            }
        });
    }
    uninstallPackage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.body.packagePath) {
                return res.status(400).send("BAD Request! Missing { packagePath } parameter!");
            }
            else {
                try {
                    yield arduinoContext_1.default.arduinoApp.uninstallBoard(req.body.boardName, req.body.packagePath);
                    return res.json({
                        status: "OK",
                    });
                }
                catch (error) {
                    return res.status(500).send(`Uninstall board failed with message "${error}"`);
                }
            }
        });
    }
    openLink(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.body.link) {
                return res.status(400).send("BAD Request! Missing { link } parameter!");
            }
            else {
                try {
                    yield vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(req.body.link));
                    return res.json({
                        status: "OK",
                    });
                }
                catch (error) {
                    return res.status(500).send(`Cannot open the link with error message "${error}"`);
                }
            }
        });
    }
    openSettings(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.body.query) {
                return res.status(400).send("BAD Request! Missing { query } parameter!");
            }
            else {
                try {
                    yield vscode.commands.executeCommand("workbench.action.openGlobalSettings", { query: req.body.query });
                    return res.json({
                        status: "OK",
                    });
                }
                catch (error) {
                    return res.status(500).send(`Cannot open the setting with error message "${error}"`);
                }
            }
        });
    }
    runCommand(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.body.command) {
                return res.status(400).send("BAD Request! Missing { command } parameter!");
            }
            else {
                try {
                    yield vscode.commands.executeCommand(req.body.command);
                    return res.json({
                        status: "OK",
                    });
                }
                catch (error) {
                    return res.status(500).send(`Cannot run command with error message "${error}"`);
                }
            }
        });
    }
    getLibraries(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            yield arduinoContext_1.default.arduinoApp.libraryManager.loadLibraries(req.query.update === "true");
            return res.json({
                libraries: arduinoContext_1.default.arduinoApp.libraryManager.libraries,
            });
        });
    }
    installLibrary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.body.libraryName) {
                return res.status(400).send("BAD Request! Missing { libraryName } parameters!");
            }
            else {
                try {
                    yield arduinoContext_1.default.arduinoApp.installLibrary(req.body.libraryName, req.body.version);
                    return res.json({
                        status: "OK",
                    });
                }
                catch (error) {
                    return res.status(500).send(`Install library failed with message "code:${error.code}, err:${error.stderr}"`);
                }
            }
        });
    }
    uninstallLibrary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.body.libraryPath) {
                return res.status(400).send("BAD Request! Missing { libraryPath } parameters!");
            }
            else {
                try {
                    yield arduinoContext_1.default.arduinoApp.uninstallLibrary(req.body.libraryName, req.body.libraryPath);
                    return res.json({
                        status: "OK",
                    });
                }
                catch (error) {
                    return res.status(500).send(`Uninstall library failed with message "code:${error.code}, err:${error.stderr}"`);
                }
            }
        });
    }
    addLibPath(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.body.libraryPath) {
                return res.status(400).send("BAD Request! Missing { libraryPath } parameters!");
            }
            else {
                try {
                    yield arduinoContext_1.default.arduinoApp.includeLibrary(req.body.libraryPath);
                    return res.json({
                        status: "OK",
                    });
                }
                catch (error) {
                    return res.status(500).send(`Add library path failed with message "code:${error.code}, err:${error.stderr}"`);
                }
            }
        });
    }
    getInstalledBoards(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const installedBoards = [];
            arduinoContext_1.default.boardManager.installedBoards.forEach((b) => {
                const isSelected = arduinoContext_1.default.boardManager.currentBoard ? b.key === arduinoContext_1.default.boardManager.currentBoard.key : false;
                installedBoards.push({
                    key: b.key,
                    name: b.name,
                    platform: b.platform.name,
                    isSelected,
                });
            });
            return res.json({
                installedBoards: JSONHelper.decycle(installedBoards, undefined),
            });
        });
    }
    getBoardConfig(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            return res.json({
                configitems: (arduinoContext_1.default.boardManager.currentBoard === null) ? null : arduinoContext_1.default.boardManager.currentBoard.configItems,
            });
        });
    }
    updateSelectedBoard(req, res) {
        if (!req.body.boardId) {
            return res.status(400).send("BAD Request! Missing parameters!");
        }
        else {
            try {
                const bd = arduinoContext_1.default.boardManager.installedBoards.get(req.body.boardId);
                arduinoContext_1.default.boardManager.doChangeBoardType(bd);
                return res.json({
                    status: "OK",
                });
            }
            catch (error) {
                return res.status(500).send(`Update board config failed with message "code:${error.code}, err:${error.stderr}"`);
            }
        }
    }
    updateConfig(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.body.configId || !req.body.optionId) {
                return res.status(400).send("BAD Request! Missing parameters!");
            }
            else {
                try {
                    arduinoContext_1.default.boardManager.currentBoard.updateConfig(req.body.configId, req.body.optionId);
                    const dc = deviceContext_1.DeviceContext.getInstance();
                    dc.configuration = arduinoContext_1.default.boardManager.currentBoard.customConfig;
                    return res.json({
                        status: "OK",
                    });
                }
                catch (error) {
                    return res.status(500).send(`Update board config failed with message "code:${error.code}, err:${error.stderr}"`);
                }
            }
        });
    }
    getExamples(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const examples = yield arduinoContext_1.default.arduinoApp.exampleManager.loadExamples();
            return res.json({
                examples,
            });
        });
    }
    openExample(req, res) {
        if (!req.body.examplePath) {
            return res.status(400).send("BAD Request! Missing { examplePath } parameter!");
        }
        else {
            try {
                arduinoContext_1.default.arduinoApp.openExample(req.body.examplePath);
                return res.json({
                    status: "OK",
                });
            }
            catch (error) {
                return res.status(500).send(`Cannot open the example folder with error message "${error}"`);
            }
        }
    }
    addHandlerWithLogger(handlerName, url, handler, post = false) {
        const wrappedHandler = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const guid = Uuid().replace(/-/g, "");
            let properties = {};
            if (post) {
                properties = Object.assign({}, req.body);
                // Removal requirement for GDPR
                if ("install-board" === handlerName) {
                    const packageNameKey = "packageName";
                    delete properties[packageNameKey];
                }
            }
            Logger.traceUserData(`start-` + handlerName, Object.assign({ correlationId: guid }, properties));
            const timer1 = new Logger.Timer();
            try {
                yield Promise.resolve(handler(req, res));
            }
            catch (error) {
                Logger.traceError("expressHandlerError", error, Object.assign({ correlationId: guid, handlerName }, properties));
            }
            Logger.traceUserData(`end-` + handlerName, { correlationId: guid, duration: timer1.end() });
        });
        if (post) {
            this._webserver.addPostHandler(url, wrappedHandler);
        }
        else {
            this._webserver.addHandler(url, wrappedHandler);
        }
    }
}
exports.ArduinoContentProvider = ArduinoContentProvider;

//# sourceMappingURL=arduinoContentProvider.js.map

// SIG // Begin signature block
// SIG // MIInnAYJKoZIhvcNAQcCoIInjTCCJ4kCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // wDDx049HCH3V4HJF6brhG1ZyBw7NiC8pAkfmf4SFSFeg
// SIG // gg2FMIIGAzCCA+ugAwIBAgITMwAAAs3zZL/41ExdUQAA
// SIG // AAACzTANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTIyMDUxMjIwNDYwMloX
// SIG // DTIzMDUxMTIwNDYwMlowdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // 6yM7GOtjJiq83q4Ju1HJ7vg7kh3YM0WVQiBovQmpRa4c
// SIG // LYivtxSA85TmG7P88x8Liwt4Yq+ecFYB6GguJYkMEOtM
// SIG // FckdexGT2uAUNvAuQEZcan7Xadx/Ea11m1cr0GlJwUFW
// SIG // TO91w8hldaFD2RhxlrYHarQVHetFY5xTyAkn/KZxYore
// SIG // ob0sR+SFViNIjp36nV2KD1lLVVDJlaltcgV9DbW0JUhy
// SIG // FOoZT76Pf7qir5IxVBQNi2wvQFkGyZh/tbjNJeJw0inw
// SIG // qnHL3SOZd84xJPclElJodSEIQxZ/uUi9iZpwhdI2RGeH
// SIG // +RxO8pAz/qIgN0Pn4SgrHoPtGhB4vg0T2QIDAQABo4IB
// SIG // gjCCAX4wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFNFsph+Aj+7NfskJLRMG3C0L
// SIG // kfWcMFQGA1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // FjAUBgNVBAUTDTIzMDAxMis0NzA1MzAwHwYDVR0jBBgw
// SIG // FoAUSG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0w
// SIG // SzBJoEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYB
// SIG // BQUHMAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3
// SIG // DQEBCwUAA4ICAQBOy0rrjTmwgVmLrbcSQIIpVyfdhqcl
// SIG // f304slx2f/S2817PzHypz8EcnZZgNmpNKxliwxYfPcwF
// SIG // hxSPLfSS8KXf1UaFRN/lss0yLJHWwZx239co6P/tLaR5
// SIG // Z66BSXXA0jCLB/k+89wpWPulp40k3raYNWP6Szi12aWY
// SIG // 2Hl0IhcKPRuZc1HEnfGFUDT0ABiApdiUUmgjZcwHSBQh
// SIG // eTzSqF2ybRKg3D2fKA6zPSnTu06lBOVangXug4IGNbGW
// SIG // J0A/vy1pc+Q9MAq4jYBkP01lnsTMMJxKpSMH5CHDRcaN
// SIG // EDQ/+mGvQ0wFMpJNkihkj7dJC7R8TRJ9hib3DbX6IVWP
// SIG // 29LbshdOXlxN3HbWGW3hqFNcUIsT2QJU3bS5nhTZcvNr
// SIG // gVW8mwGeFLdfBf/1K7oFUPVFHStbmJnPtknUUEAnHCsF
// SIG // xjrmIGdVC1truT8n1sc6OAUfvudzgf7WV0Kc+DpIAWXq
// SIG // rPWGmCxXykZUB1bZkIIRR8web/1haJ8Q1Zbz8ctoKGtL
// SIG // vWfmZSKb6KGUb5ujrV8XQIzAXFgQLJwUa/zo+bN+ehA3
// SIG // X9pf7C8CxWBOtbfjBIjWHctKVy+oDdw8U1X9qoycVxZB
// SIG // X4404rJ3bnR7ILhDJPJhLZ78KPXzkik+qER4TPbGeB04
// SIG // P00zI1JY5jd5gWFgFiORMXQtYp7qINMaypjllTCCB3ow
// SIG // ggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQEL
// SIG // BQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMT
// SIG // KU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhv
// SIG // cml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcw
// SIG // ODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYG
// SIG // A1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0Eg
// SIG // MjAxMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCq
// SIG // uAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJ
// SIG // DXlkh36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/X
// SIG // llnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPL
// SIG // bfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5
// SIG // pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt
// SIG // 7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3
// SIG // Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwP
// SIG // rRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDgl
// SIG // mDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLE
// SIG // tVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9
// SIG // G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/C
// SIG // HFfbg43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kp
// SIG // pxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9A
// SIG // N0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE
// SIG // 2rCIF96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB
// SIG // 6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k
// SIG // 5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h
// SIG // 6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNy
// SIG // bDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCB
// SIG // nwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYI
// SIG // KwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggr
// SIG // BgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABp
// SIG // AGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuW
// SIG // EeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79H
// SIG // qaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS
// SIG // 0LD9a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32m
// SIG // kHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWElj
// SIG // HwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMO
// SIG // r5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsat
// SIG // ruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+n
// SIG // t3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVA
// SIG // KmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0Hj
// SIG // Wwechz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv
// SIG // 7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3
// SIG // HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs
// SIG // 6jeZeRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991
// SIG // bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYib
// SIG // V3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0x
// SIG // ghlvMIIZawIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAACzfNkv/jUTF1RAAAAAALNMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCDvaSnttQpFweeE
// SIG // CiKmcEOWo0Hgugjxme7enEB3C2u0STBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAJN93tzWl5bBWF1Lyl6YaLh+TwXR6d6E
// SIG // oAmB3JrE8zcXQg3HG6s7IGY6nIROfiGT4aH3AF/xEHgA
// SIG // yrkZnPrOkf0mkeFwKOPlTijLUFeyZO1TWwuXXNJVz1SE
// SIG // 3v+aiSerW5+41s9rAn1fgWPpnzxZkKw9DakcWn5qTTt0
// SIG // CSmt1vTWCtLGXoWH/up+X/HzWtCx9pw7D2qTdb14CqYK
// SIG // L5XclGXV5twT4xSKUDR99rK1eUX6AeFXRYXg2UbQ0uDU
// SIG // zf4z9j2Dz8TKhHeILKvbWJvPNb9gKScillTQmAXYo1oz
// SIG // ZCX1sfns9aMqamZ/e8aWPKdro7kG4LclVJQ/COOtQIH3
// SIG // xwGhghb5MIIW9QYKKwYBBAGCNwMDATGCFuUwghbhBgkq
// SIG // hkiG9w0BBwKgghbSMIIWzgIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBTQYLKoZIhvcNAQkQAQSgggE8BIIBODCCATQC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // GJooYeFgeRtJZkOG2Wvip5ceK4VsMMor8J1BEvslFWcC
// SIG // BmPuZNDTVxgPMjAyMzAzMTUyMTA1MzdaMASAAgH0oIHQ
// SIG // pIHNMIHKMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSUwIwYDVQQL
// SIG // ExxNaWNyb3NvZnQgQW1lcmljYSBPcGVyYXRpb25zMSYw
// SIG // JAYDVQQLEx1UaGFsZXMgVFNTIEVTTjpFNUE2LUUyN0Mt
// SIG // NTkyRTElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3Rh
// SIG // bXAgU2VydmljZaCCEVQwggcMMIIE9KADAgECAhMzAAAB
// SIG // vvQgou6W1iDWAAEAAAG+MA0GCSqGSIb3DQEBCwUAMHwx
// SIG // CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9u
// SIG // MRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jv
// SIG // c29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMB4XDTIyMTEw
// SIG // NDE5MDEyMloXDTI0MDIwMjE5MDEyMlowgcoxCzAJBgNV
// SIG // BAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYD
// SIG // VQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQg
// SIG // Q29ycG9yYXRpb24xJTAjBgNVBAsTHE1pY3Jvc29mdCBB
// SIG // bWVyaWNhIE9wZXJhdGlvbnMxJjAkBgNVBAsTHVRoYWxl
// SIG // cyBUU1MgRVNOOkU1QTYtRTI3Qy01OTJFMSUwIwYDVQQD
// SIG // ExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIIC
// SIG // IjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEApV/y
// SIG // 2z7Da7nMu0tykLY8olh7Z03EqFNz3iFlMp9gOfVmZABm
// SIG // heCc87RuPdQ2P+OHUJiqCQAWNuNSoI/Q1ixEw9AA657l
// SIG // dD8Z3/EktpmxKHHavOhwQSFPcpTGFVXIxKCwoO824giy
// SIG // HPG84dfhdi6WU7f7D+85LaPB0dOsPHKKMGlC9p66Lv9y
// SIG // QzvAhZGFmFhlusCy/egrz6JX/OHOT9qCwughrL0IPf47
// SIG // ULe1pQSEEihy438JwS+rZU4AVyvQczlMC26XsTuDPgEQ
// SIG // Klzx9ru7EvNV99l/KCU9bbFf5SnkN1moUgKUq09NWlKx
// SIG // zLGEvhke2QNMopn86Jh1fl/PVevN/xrZSpV23rM4lB7l
// SIG // h7XSsCPeFslTYojKN2ioOC6p3By7kEmvZCh6rAsPKsAR
// SIG // JISdzKQCMq+mqDuiP6mr/LvuWKinP+2ZGmK/C1/skvlT
// SIG // jtIehu50yoXNDlh1CN9B3QLglQY+UCBEqJog/BxAn3pW
// SIG // dR01o/66XIacgXI/d0wG2/x0OtbjEGAkacfQlmw0bDc0
// SIG // 2dhQFki/1Q9Vbwh4kC7VgAiJA8bC5zEIYWHNU7C+He69
// SIG // B4/2dZpRjgd5pEpHbF9OYiAf7s5MnYEnHN/5o/bGO0aj
// SIG // Ab7VI4f9av62sC6xvhKTB5R4lhxEMWF0z4v7BQ5CHyMN
// SIG // kL+oTnzJLqnLVdXnuM0CAwEAAaOCATYwggEyMB0GA1Ud
// SIG // DgQWBBTrKiAWoYRBoPGtbwvbhhX6a2+iqjAfBgNVHSME
// SIG // GDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBfBgNVHR8E
// SIG // WDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0
// SIG // YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUH
// SIG // AQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8vd3d3Lm1p
// SIG // Y3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01pY3Jvc29m
// SIG // dCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNy
// SIG // dDAMBgNVHRMBAf8EAjAAMBMGA1UdJQQMMAoGCCsGAQUF
// SIG // BwMIMA0GCSqGSIb3DQEBCwUAA4ICAQDHlfu9c0ImhdBi
// SIG // s1yj56bBvOSyGpC/rSSty+1F49Tf6fmFEeqxhwTTHVHO
// SIG // eIRNd8gcDLSz0d79mXCqq8ynq6gJgy2u4LyyAr2LmwzF
// SIG // VuuxoGVR8YuUnRtvsDH5J+unye/nMkwHiC+G82h3uQ8f
// SIG // cGj+2H0nKPmUpUtfQruMUXvzLjV5NyRjDiCL5c/f5ecm
// SIG // z01dnpnCvE6kIz/FTpkvOeVJk22I2akFZhPz24D6OT6K
// SIG // kTtwBRpSEHDYqCQ4cZ+7SXx7jzzd7b+0p9vDboqCy7Sw
// SIG // WgKpGQG+wVbKrTm4hKkZDzcdAEgYqehXz78G00mYILiD
// SIG // TyUikwQpoZ7am9pA6BdTPY+o1v6CRzcneIOnJYanHWz0
// SIG // R+KER/ZRFtLCyBMvLzSHEn0sR0+0kLklncKjGdA1YA42
// SIG // zOb611UeIGytZ9VhNwn4ws5GJ6n6PJmMPO+yPEkOy2f8
// SIG // OBiuhaqlipiWhzGtt5UsC0geG0sW9qwa4QAW1sQWIrhS
// SIG // l24MOOVwNl/Am9/ZqvLRWr1x4nupeR8G7+DNyn4MTg28
// SIG // yFZRU1ktSvyBMUSvN2K99BO6p1gSx/wvSsR45dG33PDG
// SIG // 5fKqHOgDxctjBU5bX49eJqjNL7S/UndLF7S0OWL9mdk/
// SIG // jPVHP2I6XtN0K4VjdRwvIgr3jNib3GZyGJnORp/ZMbY2
// SIG // Dv1mKcx7dTCCB3EwggVZoAMCAQICEzMAAAAVxedrngKb
// SIG // SZkAAAAAABUwDQYJKoZIhvcNAQELBQAwgYgxCzAJBgNV
// SIG // BAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYD
// SIG // VQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQg
// SIG // Q29ycG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29mdCBS
// SIG // b290IENlcnRpZmljYXRlIEF1dGhvcml0eSAyMDEwMB4X
// SIG // DTIxMDkzMDE4MjIyNVoXDTMwMDkzMDE4MzIyNVowfDEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwggIiMA0GCSqG
// SIG // SIb3DQEBAQUAA4ICDwAwggIKAoICAQDk4aZM57RyIQt5
// SIG // osvXJHm9DtWC0/3unAcH0qlsTnXIyjVX9gF/bErg4r25
// SIG // PhdgM/9cT8dm95VTcVrifkpa/rg2Z4VGIwy1jRPPdzLA
// SIG // EBjoYH1qUoNEt6aORmsHFPPFdvWGUNzBRMhxXFExN6AK
// SIG // OG6N7dcP2CZTfDlhAnrEqv1yaa8dq6z2Nr41JmTamDu6
// SIG // GnszrYBbfowQHJ1S/rboYiXcag/PXfT+jlPP1uyFVk3v
// SIG // 3byNpOORj7I5LFGc6XBpDco2LXCOMcg1KL3jtIckw+DJ
// SIG // j361VI/c+gVVmG1oO5pGve2krnopN6zL64NF50ZuyjLV
// SIG // wIYwXE8s4mKyzbnijYjklqwBSru+cakXW2dg3viSkR4d
// SIG // Pf0gz3N9QZpGdc3EXzTdEonW/aUgfX782Z5F37ZyL9t9
// SIG // X4C626p+Nuw2TPYrbqgSUei/BQOj0XOmTTd0lBw0gg/w
// SIG // EPK3Rxjtp+iZfD9M269ewvPV2HM9Q07BMzlMjgK8Qmgu
// SIG // EOqEUUbi0b1qGFphAXPKZ6Je1yh2AuIzGHLXpyDwwvoS
// SIG // CtdjbwzJNmSLW6CmgyFdXzB0kZSU2LlQ+QuJYfM2BjUY
// SIG // hEfb3BvR/bLUHMVr9lxSUV0S2yW6r1AFemzFER1y7435
// SIG // UsSFF5PAPBXbGjfHCBUYP3irRbb1Hode2o+eFnJpxq57
// SIG // t7c+auIurQIDAQABo4IB3TCCAdkwEgYJKwYBBAGCNxUB
// SIG // BAUCAwEAATAjBgkrBgEEAYI3FQIEFgQUKqdS/mTEmr6C
// SIG // kTxGNSnPEP8vBO4wHQYDVR0OBBYEFJ+nFV0AXmJdg/Tl
// SIG // 0mWnG1M1GelyMFwGA1UdIARVMFMwUQYMKwYBBAGCN0yD
// SIG // fQEBMEEwPwYIKwYBBQUHAgEWM2h0dHA6Ly93d3cubWlj
// SIG // cm9zb2Z0LmNvbS9wa2lvcHMvRG9jcy9SZXBvc2l0b3J5
// SIG // Lmh0bTATBgNVHSUEDDAKBggrBgEFBQcDCDAZBgkrBgEE
// SIG // AYI3FAIEDB4KAFMAdQBiAEMAQTALBgNVHQ8EBAMCAYYw
// SIG // DwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBTV9lbL
// SIG // j+iiXGJo0T2UkFvXzpoYxDBWBgNVHR8ETzBNMEugSaBH
// SIG // hkVodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtpL2Ny
// SIG // bC9wcm9kdWN0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0y
// SIG // My5jcmwwWgYIKwYBBQUHAQEETjBMMEoGCCsGAQUFBzAC
// SIG // hj5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpL2Nl
// SIG // cnRzL01pY1Jvb0NlckF1dF8yMDEwLTA2LTIzLmNydDAN
// SIG // BgkqhkiG9w0BAQsFAAOCAgEAnVV9/Cqt4SwfZwExJFvh
// SIG // nnJL/Klv6lwUtj5OR2R4sQaTlz0xM7U518JxNj/aZGx8
// SIG // 0HU5bbsPMeTCj/ts0aGUGCLu6WZnOlNN3Zi6th542DYu
// SIG // nKmCVgADsAW+iehp4LoJ7nvfam++Kctu2D9IdQHZGN5t
// SIG // ggz1bSNU5HhTdSRXud2f8449xvNo32X2pFaq95W2KFUn
// SIG // 0CS9QKC/GbYSEhFdPSfgQJY4rPf5KYnDvBewVIVCs/wM
// SIG // nosZiefwC2qBwoEZQhlSdYo2wh3DYXMuLGt7bj8sCXgU
// SIG // 6ZGyqVvfSaN0DLzskYDSPeZKPmY7T7uG+jIa2Zb0j/aR
// SIG // AfbOxnT99kxybxCrdTDFNLB62FD+CljdQDzHVG2dY3RI
// SIG // LLFORy3BFARxv2T5JL5zbcqOCb2zAVdJVGTZc9d/HltE
// SIG // AY5aGZFrDZ+kKNxnGSgkujhLmm77IVRrakURR6nxt67I
// SIG // 6IleT53S0Ex2tVdUCbFpAUR+fKFhbHP+CrvsQWY9af3L
// SIG // wUFJfn6Tvsv4O+S3Fb+0zj6lMVGEvL8CwYKiexcdFYmN
// SIG // cP7ntdAoGokLjzbaukz5m/8K6TT4JDVnK+ANuOaMmdbh
// SIG // IurwJ0I9JZTmdHRbatGePu1+oDEzfbzL6Xu/OHBE0ZDx
// SIG // yKs6ijoIYn/ZcGNTTY3ugm2lBRDBcQZqELQdVTNYs6Fw
// SIG // ZvKhggLLMIICNAIBATCB+KGB0KSBzTCByjELMAkGA1UE
// SIG // BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
// SIG // BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
// SIG // b3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0IEFt
// SIG // ZXJpY2EgT3BlcmF0aW9uczEmMCQGA1UECxMdVGhhbGVz
// SIG // IFRTUyBFU046RTVBNi1FMjdDLTU5MkUxJTAjBgNVBAMT
// SIG // HE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2WiIwoB
// SIG // ATAHBgUrDgMCGgMVAGitWlL3vPu8ENOAe+i2+4wfTMB7
// SIG // oIGDMIGApH4wfDELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQG
// SIG // A1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIw
// SIG // MTAwDQYJKoZIhvcNAQEFBQACBQDnvHlTMCIYDzIwMjMw
// SIG // MzE2MDEwNTIzWhgPMjAyMzAzMTcwMTA1MjNaMHQwOgYK
// SIG // KwYBBAGEWQoEATEsMCowCgIFAOe8eVMCAQAwBwIBAAIC
// SIG // EmMwBwIBAAICEt0wCgIFAOe9ytMCAQAwNgYKKwYBBAGE
// SIG // WQoEAjEoMCYwDAYKKwYBBAGEWQoDAqAKMAgCAQACAweh
// SIG // IKEKMAgCAQACAwGGoDANBgkqhkiG9w0BAQUFAAOBgQBp
// SIG // pzlKlhtY6ogiav8K1K4gQOp0X2RPfY3CyGDvM18GnfAe
// SIG // EiCJSjeGHnjAOWTZ/dBLdmzeB5Cj41vJzYEiyVGCP7rE
// SIG // B9BWANifowsfhDSdhLtpZSOBcAIFu2MC7BebcVi05Jdu
// SIG // pGF9ar/GPVsxHX+m7LAybvoGIfB8y6iOKq276DGCBA0w
// SIG // ggQJAgEBMIGTMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAk
// SIG // BgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAy
// SIG // MDEwAhMzAAABvvQgou6W1iDWAAEAAAG+MA0GCWCGSAFl
// SIG // AwQCAQUAoIIBSjAaBgkqhkiG9w0BCQMxDQYLKoZIhvcN
// SIG // AQkQAQQwLwYJKoZIhvcNAQkEMSIEIPslwWHFI+DDweR+
// SIG // Nd4bIUw5aOKgV8C65UFxRs/OjV5UMIH6BgsqhkiG9w0B
// SIG // CRACLzGB6jCB5zCB5DCBvQQglO6Kr632/Oy9ZbXPrhEP
// SIG // idNAg/Fef7K3SZg+DxjhDC8wgZgwgYCkfjB8MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAb70IKLultYg
// SIG // 1gABAAABvjAiBCCgB6Wc6U7MbEen8BEJPFx7EmwGlceE
// SIG // KA+cPEzIRp2aCzANBgkqhkiG9w0BAQsFAASCAgAN9ikh
// SIG // 2xI+y+gS52Aezk1Zq108foF7hBVGKswHzXnej+kSSEqX
// SIG // 5osb4JkkiKRM+InCX5lg+OIGbt4FmW3yZRhVMmRTEtbg
// SIG // LtGiEzVjz5WKyK+b2zbI1zxlsWvCBMpV+VQEU1TmKwSZ
// SIG // nW5zCEncw6qkqDZI+lBYAlCm3FzKLT7nwDWF3nwAe7It
// SIG // QQpycmH8LpZ++82D4HshCfNM4n0obVbgJRiTYNIOj085
// SIG // NtggOfAgEJLm9pCI8wgoGzyeHvhzeRO7PpE+w7Jmw8Bj
// SIG // o3v/3tPX3Refg/dmmBIWoxStZBfnsouhmbx0yFI9kPOH
// SIG // kjaTeC6zmG0Y5ht25q1/AA2BXeh2+0wHayaxxBnAWzWH
// SIG // rDyT31c+HqzDAkRbCqAKq3vCMZSGosIm0Y9G8+jF//af
// SIG // p6IJQ0dTWAEuJlAh4HHGnhlxyEE2iF7eLO2RKQrhe6Zv
// SIG // u4dkKfcUJbJi83VzQ/uvdETmPfZ+QwfA7t+QnratI0ai
// SIG // 6pk1Y7oRS/PVRpG34G9+y/Yxsd2EYFHIooMXKgwE8/mI
// SIG // enrWWhIII3wZeUo1MUM8InhjtLmZqJqvw11UZrv+oZ84
// SIG // VDNRuUb3wsPyl21gryNXIG4SZYl7IO5estrTllSfgEWK
// SIG // oqTEUAW3j0z0YdujIq5KpCT0DKDDGZQdmAiJuropQeGJ
// SIG // Kz9BLKKTOZDOz2Q08A==
// SIG // End signature block
