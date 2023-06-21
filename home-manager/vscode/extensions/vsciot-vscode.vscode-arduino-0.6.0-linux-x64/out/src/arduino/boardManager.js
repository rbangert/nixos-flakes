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
exports.BoardManager = void 0;
const fs = require("fs");
const path = require("path");
const url = require("url");
const vscode = require("vscode");
const util = require("../common/util");
const constants = require("../common/constants");
const outputChannel_1 = require("../common/outputChannel");
const utils_1 = require("../common/sharedUtilities/utils");
const deviceContext_1 = require("../deviceContext");
const board_1 = require("./board");
const package_1 = require("./package");
const programmer_1 = require("./programmer");
const vscodeSettings_1 = require("./vscodeSettings");
class BoardManager {
    constructor(_settings, _arduinoApp) {
        this._settings = _settings;
        this._arduinoApp = _arduinoApp;
        this._onBoardTypeChanged = new vscode.EventEmitter();
        this._boardConfigStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.BOARD);
        this._boardConfigStatusBar.command = "arduino.showBoardConfig";
        this._boardConfigStatusBar.tooltip = "Show Board Config";
    }
    loadPackages(update = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this._packages = [];
            this._platforms = [];
            this._installedPlatforms = [];
            const additionalUrls = this._arduinoApp.getAdditionalUrls();
            if (update) { // Update index files.
                yield this.setPreferenceUrls(additionalUrls);
                yield this._arduinoApp.initialize(true);
            }
            // Parse package index files.
            const indexFiles = ["package_index.json"].concat(additionalUrls);
            const rootPackageFolder = this._settings.packagePath;
            for (const indexFile of indexFiles) {
                const indexFileName = this.getIndexFileName(indexFile);
                if (!indexFileName) {
                    continue;
                }
                if (!update && !util.fileExistsSync(path.join(rootPackageFolder, indexFileName))) {
                    yield this.setPreferenceUrls(additionalUrls);
                    yield this._arduinoApp.initialize(true);
                }
                this.loadPackageContent(indexFileName);
            }
            // Load default platforms from arduino installation directory and user manually installed platforms.
            this.loadInstalledPlatforms();
            // Load all supported board types
            this.loadInstalledBoards();
            this.loadInstalledProgrammers();
            this.updateStatusBar();
            this._boardConfigStatusBar.show();
            const dc = deviceContext_1.DeviceContext.getInstance();
            dc.onChangeBoard(() => this.onDeviceContextBoardChange());
            dc.onChangeConfiguration(() => this.onDeviceContextConfigurationChange());
            // load initial board from DeviceContext by emulating
            // a board change event.
            this.onDeviceContextBoardChange();
            this.updateStatusBar(true);
        });
    }
    changeBoardType() {
        return __awaiter(this, void 0, void 0, function* () {
            const supportedBoardTypes = this.listBoards();
            if (supportedBoardTypes.length === 0) {
                vscode.window.showInformationMessage("No supported board is available.");
                return;
            }
            // TODO:? Add separator item between different platforms.
            const chosen = yield vscode.window.showQuickPick(supportedBoardTypes.map((entry) => {
                return {
                    label: entry.name,
                    description: entry.platform.name,
                    entry,
                };
            }).sort((a, b) => {
                if (a.description === b.description) {
                    return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
                }
                else {
                    return a.description > b.description ? 1 : -1;
                }
            }), { placeHolder: "Select board type" });
            if (chosen && chosen.label) {
                this.doChangeBoardType(chosen.entry);
            }
        });
    }
    updatePackageIndex(indexUri) {
        return __awaiter(this, void 0, void 0, function* () {
            let allUrls = this._arduinoApp.getAdditionalUrls();
            if (!(allUrls.indexOf(indexUri) >= 0)) {
                allUrls = allUrls.concat(indexUri);
                vscodeSettings_1.VscodeSettings.getInstance().updateAdditionalUrls(allUrls);
                yield this._arduinoApp.setPref("boardsmanager.additional.urls", this._arduinoApp.getAdditionalUrls().join(","));
            }
            return true;
        });
    }
    get onBoardTypeChanged() {
        return this._onBoardTypeChanged.event;
    }
    doChangeBoardType(targetBoard) {
        const dc = deviceContext_1.DeviceContext.getInstance();
        if (dc.board === targetBoard.key) {
            return;
        }
        // Resetting the board first that we don't overwrite the configuration
        // of the previous board.
        this._currentBoard = null;
        // This will cause a configuration changed event which will have no
        // effect because no current board is set.
        dc.configuration = targetBoard.customConfig;
        // This will generate a device context board event which will set the
        // correct board and configuration. We know that it will trigger - we
        // made sure above that the boards actually differ
        dc.board = targetBoard.key;
    }
    get packages() {
        return this._packages;
    }
    get platforms() {
        return this._platforms;
    }
    get installedBoards() {
        return this._boards;
    }
    get installedProgrammers() {
        return this._programmers;
    }
    get currentBoard() {
        return this._currentBoard;
    }
    getInstalledPlatforms() {
        // Always using manually installed platforms to overwrite the same platform from arduino installation directory.
        const installedPlatforms = this.getDefaultPlatforms();
        const mergePlatform = (plat) => {
            const find = installedPlatforms.find((_plat) => {
                return _plat.packageName === plat.packageName && _plat.architecture === plat.architecture;
            });
            if (!find) {
                installedPlatforms.push(plat);
            }
            else {
                find.defaultPlatform = plat.defaultPlatform;
                find.version = plat.version;
                find.rootBoardPath = plat.rootBoardPath;
            }
        };
        const customPlatforms = this.getCustomPlatforms();
        const manuallyInstalled = this.getManuallyInstalledPlatforms();
        customPlatforms.forEach(mergePlatform);
        manuallyInstalled.forEach(mergePlatform);
        return installedPlatforms;
    }
    loadPackageContent(indexFile) {
        const indexFileName = this.getIndexFileName(indexFile);
        if (!util.fileExistsSync(path.join(this._settings.packagePath, indexFileName))) {
            return;
        }
        const packageContent = fs.readFileSync(path.join(this._settings.packagePath, indexFileName), "utf8");
        if (!packageContent) {
            return;
        }
        let rawModel = null;
        try {
            rawModel = JSON.parse(packageContent);
        }
        catch (ex) {
            outputChannel_1.arduinoChannel.error(`Invalid json file "${path.join(this._settings.packagePath, indexFileName)}".
            Suggest to remove it manually and allow boardmanager to re-download it.`);
            return;
        }
        if (!rawModel || !rawModel.packages || !rawModel.packages.length) {
            return;
        }
        this._packages = this._packages.concat(rawModel.packages);
        rawModel.packages.forEach((pkg) => {
            pkg.platforms.forEach((plat) => {
                plat.package = pkg;
                const addedPlatform = this._platforms
                    .find((_plat) => _plat.architecture === plat.architecture && _plat.package.name === plat.package.name);
                if (addedPlatform) {
                    // union boards from all versions.
                    // We should not union boards: https://github.com/Microsoft/vscode-arduino/issues/414
                    // addedPlatform.boards = util.union(addedPlatform.boards, plat.boards, (a, b) => {
                    //     return a.name === b.name;
                    // });
                    // Check if platform name is the same, if not, we should use the name from the latest version.
                    if (addedPlatform.name !== plat.name) {
                        addedPlatform.name = plat.name;
                    }
                    addedPlatform.versions.push(plat.version);
                    // Check if this is the latest version. Platforms typically support more boards in later versions.
                    addedPlatform.versions.sort(utils_1.versionCompare);
                    if (plat.version === addedPlatform.versions[addedPlatform.versions.length - 1]) {
                        addedPlatform.boards = plat.boards;
                    }
                }
                else {
                    plat.versions = [plat.version];
                    // Clear the version information since the plat will be used to contain all supported versions.
                    plat.version = "";
                    this._platforms.push(plat);
                }
            });
        });
    }
    updateInstalledPlatforms(pkgName, arch) {
        const archPath = path.join(this._settings.packagePath, "packages", pkgName, "hardware", arch);
        const allVersion = util.filterJunk(util.readdirSync(archPath, true));
        if (allVersion && allVersion.length) {
            const newPlatform = {
                packageName: pkgName,
                architecture: arch,
                version: allVersion[0],
                rootBoardPath: path.join(archPath, allVersion[0]),
                defaultPlatform: false,
            };
            const existingPlatform = this._platforms.find((_plat) => {
                return _plat.package.name === pkgName && _plat.architecture === arch;
            });
            if (existingPlatform) {
                existingPlatform.defaultPlatform = newPlatform.defaultPlatform;
                if (!existingPlatform.installedVersion) {
                    existingPlatform.installedVersion = newPlatform.version;
                    existingPlatform.rootBoardPath = newPlatform.rootBoardPath;
                    this._installedPlatforms.push(existingPlatform);
                }
                this.loadInstalledBoardsFromPlatform(existingPlatform);
                this.loadInstalledProgrammersFromPlatform(existingPlatform);
            }
        }
    }
    updateStatusBar(show = true) {
        if (show) {
            this._boardConfigStatusBar.show();
            if (this._currentBoard) {
                this._boardConfigStatusBar.text = this._currentBoard.name;
            }
            else {
                this._boardConfigStatusBar.text = "<Select Board Type>";
            }
        }
        else {
            this._boardConfigStatusBar.hide();
        }
    }
    /**
     * Event callback if DeviceContext detected a new board - either when
     * loaded from configuration file or when set by the doChangeBoardType
     * member.
     */
    onDeviceContextBoardChange() {
        const dc = deviceContext_1.DeviceContext.getInstance();
        const newBoard = this._boards.get(dc.board);
        if (board_1.boardEqual(newBoard, this._currentBoard)) {
            return;
        }
        if (newBoard) {
            this._currentBoard = newBoard;
            if (dc.configuration) {
                // In case the configuration is incompatible, we reset it as
                // setting partially valid configurations can lead to nasty
                // surprises. When setting a new board this is acceptable
                const r = this._currentBoard.loadConfig(dc.configuration);
                if (r !== package_1.BoardConfigResult.Success && r !== package_1.BoardConfigResult.SuccessNoChange) {
                    this._currentBoard.resetConfig();
                    // we don't reset dc.configuration to give the user a
                    // chance to fix her/his configuration
                    this.invalidConfigWarning(r);
                }
            }
            else {
                this._currentBoard.resetConfig();
                dc.configuration = undefined;
            }
        }
        else {
            this._currentBoard = null;
        }
        this._onBoardTypeChanged.fire();
        this.updateStatusBar();
    }
    /**
     * Event callback if DeviceContext detected a configuration change
     * - either when loaded from configuration file or when set by the
     * doChangeBoardType member.
     */
    onDeviceContextConfigurationChange() {
        const dc = deviceContext_1.DeviceContext.getInstance();
        if (this._currentBoard) {
            const r = this._currentBoard.loadConfig(dc.configuration);
            if (r !== package_1.BoardConfigResult.Success && r !== package_1.BoardConfigResult.SuccessNoChange) {
                this._currentBoard.resetConfig();
                // We reset the configuration here but do not write it back
                // to the configuration file - this can be annoying when
                // someone tries to set a special configuration and doesn't
                // get it right the first time.
                this.invalidConfigWarning(r);
            }
        }
    }
    invalidConfigWarning(result) {
        let what = "";
        switch (result) {
            case package_1.BoardConfigResult.InvalidFormat:
                what = ": Invalid format must be of the form \"key1=value2,key1=value2,...\"";
                break;
            case package_1.BoardConfigResult.InvalidConfigID:
                what = ": Invalid configuration key";
                break;
            case package_1.BoardConfigResult.InvalidOptionID:
                what = ": Invalid configuration value";
                break;
        }
        vscode.window.showWarningMessage(`Invalid board configuration detected in configuration file${what}. Falling back to defaults.`);
    }
    loadInstalledPlatforms() {
        const installed = this.getInstalledPlatforms();
        installed.forEach((platform) => {
            const existingPlatform = this._platforms.find((_plat) => {
                return _plat.package.name === platform.packageName && _plat.architecture === platform.architecture;
            });
            if (existingPlatform) {
                existingPlatform.defaultPlatform = platform.defaultPlatform;
                if (!existingPlatform.installedVersion) {
                    existingPlatform.installedVersion = platform.version;
                    existingPlatform.rootBoardPath = platform.rootBoardPath;
                    this._installedPlatforms.push(existingPlatform);
                }
            }
            else {
                platform.installedVersion = platform.version;
                this._installedPlatforms.push(platform);
            }
        });
    }
    // Default arduino package information from arduino installation directory.
    getDefaultPlatforms() {
        const defaultPlatforms = [];
        try {
            const packageBundled = fs.readFileSync(path.join(this._settings.defaultPackagePath, "package_index_bundled.json"), "utf8");
            if (!packageBundled) {
                return defaultPlatforms;
            }
            const bundledObject = JSON.parse(packageBundled);
            if (bundledObject && bundledObject.packages) {
                for (const pkg of bundledObject.packages) {
                    for (const platform of pkg.platforms) {
                        if (platform.version) {
                            defaultPlatforms.push({
                                packageName: pkg.name,
                                architecture: platform.architecture,
                                version: platform.version,
                                rootBoardPath: path.join(this._settings.defaultPackagePath, pkg.name, platform.architecture),
                                defaultPlatform: true,
                            });
                        }
                    }
                }
            }
        }
        catch (ex) {
        }
        return defaultPlatforms;
    }
    getCustomPlatforms() {
        const customPlatforms = [];
        const hardwareFolder = path.join(this._settings.sketchbookPath, "hardware");
        if (!util.directoryExistsSync(hardwareFolder)) {
            return customPlatforms;
        }
        const dirs = util.filterJunk(util.readdirSync(hardwareFolder, true)); // in Mac, filter .DS_Store file.
        if (!dirs || dirs.length < 1) {
            return customPlatforms;
        }
        for (const packageName of dirs) {
            const architectures = util.filterJunk(util.readdirSync(path.join(hardwareFolder, packageName), true));
            if (!architectures || architectures.length < 1) {
                continue;
            }
            architectures.forEach((architecture) => {
                const platformFolder = path.join(hardwareFolder, packageName, architecture);
                if (util.fileExistsSync(path.join(platformFolder, "boards.txt")) && util.fileExistsSync(path.join(platformFolder, "platform.txt"))) {
                    const configs = util.parseConfigFile(path.join(platformFolder, "platform.txt"));
                    customPlatforms.push({
                        packageName,
                        architecture,
                        version: configs.get("version"),
                        rootBoardPath: path.join(hardwareFolder, packageName, architecture),
                        defaultPlatform: false,
                    });
                }
            });
        }
        return customPlatforms;
    }
    // User manually installed packages.
    getManuallyInstalledPlatforms() {
        const manuallyInstalled = [];
        const rootPackagePath = path.join(path.join(this._settings.packagePath, "packages"));
        if (!util.directoryExistsSync(rootPackagePath)) {
            return manuallyInstalled;
        }
        const dirs = util.filterJunk(util.readdirSync(rootPackagePath, true)); // in Mac, filter .DS_Store file.
        for (const packageName of dirs) {
            const archPath = path.join(this._settings.packagePath, "packages", packageName, "hardware");
            if (!util.directoryExistsSync(archPath)) {
                continue;
            }
            const architectures = util.filterJunk(util.readdirSync(archPath, true));
            architectures.forEach((architecture) => {
                const allVersion = util.filterJunk(util.readdirSync(path.join(archPath, architecture), true));
                if (allVersion && allVersion.length) {
                    manuallyInstalled.push({
                        packageName,
                        architecture,
                        version: allVersion[0],
                        rootBoardPath: path.join(archPath, architecture, allVersion[0]),
                        defaultPlatform: false,
                    });
                }
            });
        }
        return manuallyInstalled;
    }
    loadInstalledBoards() {
        this._boards = new Map();
        this._installedPlatforms.forEach((plat) => {
            this.loadInstalledBoardsFromPlatform(plat);
        });
    }
    loadInstalledBoardsFromPlatform(plat) {
        if (util.fileExistsSync(path.join(plat.rootBoardPath, "boards.txt"))) {
            const boardContent = fs.readFileSync(path.join(plat.rootBoardPath, "boards.txt"), "utf8");
            const res = board_1.parseBoardDescriptor(boardContent, plat);
            res.forEach((bd) => {
                this._boards.set(bd.key, bd);
            });
        }
    }
    loadInstalledProgrammers() {
        this._programmers = new Map();
        this._installedPlatforms.forEach((plat) => {
            this.loadInstalledProgrammersFromPlatform(plat);
        });
    }
    loadInstalledProgrammersFromPlatform(plat) {
        if (util.fileExistsSync(path.join(plat.rootBoardPath, "programmers.txt"))) {
            const programmersContent = fs.readFileSync(path.join(plat.rootBoardPath, "programmers.txt"), "utf8");
            const res = programmer_1.parseProgrammerDescriptor(programmersContent, plat);
            res.forEach((prog) => {
                this._programmers.set(prog.name, prog);
            });
        }
    }
    listBoards() {
        const result = [];
        this._boards.forEach((b) => {
            result.push(b);
        });
        return result;
    }
    getIndexFileName(uriString) {
        if (!uriString) {
            return;
        }
        const normalizedUrl = url.parse(uriString);
        if (!normalizedUrl) {
            return;
        }
        return normalizedUrl.pathname.substr(normalizedUrl.pathname.lastIndexOf("/") + 1);
    }
    setPreferenceUrls(additionalUrls) {
        return __awaiter(this, void 0, void 0, function* () {
            const settingsUrls = additionalUrls.join(",");
            if (this._settings.preferences.get("boardsmanager.additional.urls") !== settingsUrls) {
                yield this._arduinoApp.setPref("boardsmanager.additional.urls", settingsUrls);
            }
        });
    }
}
exports.BoardManager = BoardManager;

//# sourceMappingURL=boardManager.js.map

// SIG // Begin signature block
// SIG // MIInowYJKoZIhvcNAQcCoIInlDCCJ5ACAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // MMG0SwvEof03FUT9nMuK89Wkv6Iu3COWSJ82kB0hFAug
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
// SIG // ghl2MIIZcgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAACzfNkv/jUTF1RAAAAAALNMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCCHCB8GfND/x8vF
// SIG // tptJSFrXzJLoj/dTLtp8imepiy/yLzBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBADW+rrZmRJkehkmxzKHThIKIQmB4S3vk
// SIG // GGpsaDhjg6AmCWvCTdrOcG3uUoC5yUW/FY3ltMnGPTX/
// SIG // XNVUNoEcYezGUA5vSxJaiL8bOf2iDnwXAps5IWTzPv8o
// SIG // PJIS4vZqWikSvz3YAbtB5bxNZRpvYkUSg+KHxdDX13gr
// SIG // flhWZo4xZBSnGbzaJ4sw3YG1JXDwJTzb236h25MpNnDu
// SIG // h2iKsVk6B+bjC+Dge5qeWkbhlZ/zrZVrn26BG01+GcrO
// SIG // y/DF/OG7bcK4aqhK3Y5NJxWCD0FinnbTasL6hrZ22bbx
// SIG // spwzeILW5uWuwPcB3dHoQrT02NcShwQtDf7gISR0mI4O
// SIG // wQChghcAMIIW/AYKKwYBBAGCNwMDATGCFuwwghboBgkq
// SIG // hkiG9w0BBwKgghbZMIIW1QIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUQYLKoZIhvcNAQkQAQSgggFABIIBPDCCATgC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // LocvOknrSFPOpRqVmStSgcB5EKaFb2Qoek0tAir2hf4C
// SIG // BmPueaDFBxgTMjAyMzAzMTUyMTA1MzcuNDY3WjAEgAIB
// SIG // 9KCB0KSBzTCByjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEmMCQGA1UECxMdVGhhbGVzIFRTUyBFU046NDlCQy1F
// SIG // MzdBLTIzM0MxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFNlcnZpY2WgghFXMIIHDDCCBPSgAwIBAgIT
// SIG // MwAAAcBVpI3DZBXFSwABAAABwDANBgkqhkiG9w0BAQsF
// SIG // ADB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDAeFw0y
// SIG // MjExMDQxOTAxMjVaFw0yNDAyMDIxOTAxMjVaMIHKMQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMSUwIwYDVQQLExxNaWNyb3Nv
// SIG // ZnQgQW1lcmljYSBPcGVyYXRpb25zMSYwJAYDVQQLEx1U
// SIG // aGFsZXMgVFNTIEVTTjo0OUJDLUUzN0EtMjMzQzElMCMG
// SIG // A1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgU2Vydmlj
// SIG // ZTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIB
// SIG // ALztYPtjYYZgUL5RpQkzjGhcN42yIVHQ06pGkIUaXR1W
// SIG // /oblP9BzYS5qEWL66e8+byKC9TDwJFQRViSJK3Bu7Eq3
// SIG // nZ8mcK3mNtOwvZ/F4ry/WQTkHolHi/0zJSelYp63Gn24
// SIG // XZ5DTuSQ5T6MwvXRskorm68nbORirbuvQ9cDWrfQyEJe
// SIG // mpRTuqZ3GSuESM37/is5DO0ZGN7x6YVdAvBBVKRfpcrG
// SIG // hiVxX/ULFFB8I/Vylh33PQX4S6AkXl1M74K7KXRZlZwP
// SIG // QE2F5onUo67IX/APhNPxaU3YVzyPV16rGQxwaq+w5WKE
// SIG // glN5b61Q0btaeaRx3+7N5DNeh6Sumqw7WN2otbKAEphK
// SIG // b9wtjf8uTAwQKQ3eEqUpCzGu/unrP3Wnku83R9anQmtk
// SIG // aCTzOhIf+mJgX6H4Xy0KHyjyZd+AC5WViuQM1bRUTTl2
// SIG // nKI+jABtnU/EXOX6Sgh9RN5+2Y3tHStuEFX0r/2DscOd
// SIG // hAmjC5VuT4R092SDTWgpkYHBwkwpTiswthTq9N2AXNsz
// SIG // zlumyFXV5aD5gTFWhPrYV6j5gDQcNGLJ3GjpFYIIw2+T
// SIG // uVajqffDJJR6SaCSOqZOcwJcfPzrQuxbra3bWDVAuspF
// SIG // 8zADxbmJFhoMf1uwNIrSlvFs2M8Dt2wIaa8M56LhmZkY
// SIG // sNpPKXp/NAc6s3cj72808ULDAgMBAAGjggE2MIIBMjAd
// SIG // BgNVHQ4EFgQUAETGePNI8KStz+qrlVlBCdHN9IUwHwYD
// SIG // VR0jBBgwFoAUn6cVXQBeYl2D9OXSZacbUzUZ6XIwXwYD
// SIG // VR0fBFgwVjBUoFKgUIZOaHR0cDovL3d3dy5taWNyb3Nv
// SIG // ZnQuY29tL3BraW9wcy9jcmwvTWljcm9zb2Z0JTIwVGlt
// SIG // ZS1TdGFtcCUyMFBDQSUyMDIwMTAoMSkuY3JsMGwGCCsG
// SIG // AQUFBwEBBGAwXjBcBggrBgEFBQcwAoZQaHR0cDovL3d3
// SIG // dy5taWNyb3NvZnQuY29tL3BraW9wcy9jZXJ0cy9NaWNy
// SIG // b3NvZnQlMjBUaW1lLVN0YW1wJTIwUENBJTIwMjAxMCgx
// SIG // KS5jcnQwDAYDVR0TAQH/BAIwADATBgNVHSUEDDAKBggr
// SIG // BgEFBQcDCDANBgkqhkiG9w0BAQsFAAOCAgEArU4dBEJ9
// SIG // epCkMgnlZPVXNdJui9BMC0aNwE0aLj+2HdoVnhAdmOGR
// SIG // eAiSnvan11hiSs1e7TFJugwLASmB/50/vMmyPLiYhxp3
// SIG // 51Yukoe4BY506X4dY9U/dB/7i3qBY6Tp//nqAqCZqK1u
// SIG // Rm9ns5U5aOSNJDQLm8bQsamy4s7jzT6G/JEQCkIL/uPw
// SIG // gtSZolBRtLiiDZSo/UrB3K1ngQUB1+tpzYM4iME+OCah
// SIG // 6wNNiOnJkAIvQWXLH+ezji6UWJc6Dx98f/pXUsklwJsi
// SIG // 6trkm1rULg/OCP9GYEvweS93sKk3YhNSmyl/PTFuSagi
// SIG // v8iP5gCEGppgJRz6lPXmWUzDzh0LNF66Qoo5ZPqsqNiW
// SIG // h4sksMOp7j6l81N7BI91VtNGIlUmsihLtSK0c819y2vK
// SIG // nujqi07yv+oLuV3Squ00/OdpweiD9EDPgbnba+BW8eP7
// SIG // L6ShxqSvf8wbmhxw11+QKEpLIf5Eg2Cn3n0CISH0CSc6
// SIG // BN1/jIpjCa4K8GV5bW+o9SC9B2N6gqWtNxoYItCE86n5
// SIG // MNzGp9xvJAdUJfknjXIj1I+9yp9r3iXpxi7U/CZFDPUV
// SIG // ItMKDtIrmOLSZ2Lkvknqmr11DlqlGFWNfRSK9Ty6qZlp
// SIG // G6zucSo5Mjh6AJi8YzWyozp5AMH7ftRtNJLpSqs6j25v
// SIG // kp/uOybBkBYTRm0wggdxMIIFWaADAgECAhMzAAAAFcXn
// SIG // a54Cm0mZAAAAAAAVMA0GCSqGSIb3DQEBCwUAMIGIMQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNyb3Nv
// SIG // ZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkgMjAx
// SIG // MDAeFw0yMTA5MzAxODIyMjVaFw0zMDA5MzAxODMyMjVa
// SIG // MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMIICIjAN
// SIG // BgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5OGmTOe0
// SIG // ciELeaLL1yR5vQ7VgtP97pwHB9KpbE51yMo1V/YBf2xK
// SIG // 4OK9uT4XYDP/XE/HZveVU3Fa4n5KWv64NmeFRiMMtY0T
// SIG // z3cywBAY6GB9alKDRLemjkZrBxTzxXb1hlDcwUTIcVxR
// SIG // MTegCjhuje3XD9gmU3w5YQJ6xKr9cmmvHaus9ja+NSZk
// SIG // 2pg7uhp7M62AW36MEBydUv626GIl3GoPz130/o5Tz9bs
// SIG // hVZN7928jaTjkY+yOSxRnOlwaQ3KNi1wjjHINSi947SH
// SIG // JMPgyY9+tVSP3PoFVZhtaDuaRr3tpK56KTesy+uDRedG
// SIG // bsoy1cCGMFxPLOJiss254o2I5JasAUq7vnGpF1tnYN74
// SIG // kpEeHT39IM9zfUGaRnXNxF803RKJ1v2lIH1+/NmeRd+2
// SIG // ci/bfV+AutuqfjbsNkz2K26oElHovwUDo9Fzpk03dJQc
// SIG // NIIP8BDyt0cY7afomXw/TNuvXsLz1dhzPUNOwTM5TI4C
// SIG // vEJoLhDqhFFG4tG9ahhaYQFzymeiXtcodgLiMxhy16cg
// SIG // 8ML6EgrXY28MyTZki1ugpoMhXV8wdJGUlNi5UPkLiWHz
// SIG // NgY1GIRH29wb0f2y1BzFa/ZcUlFdEtsluq9QBXpsxREd
// SIG // cu+N+VLEhReTwDwV2xo3xwgVGD94q0W29R6HXtqPnhZy
// SIG // acaue7e3PmriLq0CAwEAAaOCAd0wggHZMBIGCSsGAQQB
// SIG // gjcVAQQFAgMBAAEwIwYJKwYBBAGCNxUCBBYEFCqnUv5k
// SIG // xJq+gpE8RjUpzxD/LwTuMB0GA1UdDgQWBBSfpxVdAF5i
// SIG // XYP05dJlpxtTNRnpcjBcBgNVHSAEVTBTMFEGDCsGAQQB
// SIG // gjdMg30BATBBMD8GCCsGAQUFBwIBFjNodHRwOi8vd3d3
// SIG // Lm1pY3Jvc29mdC5jb20vcGtpb3BzL0RvY3MvUmVwb3Np
// SIG // dG9yeS5odG0wEwYDVR0lBAwwCgYIKwYBBQUHAwgwGQYJ
// SIG // KwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYDVR0PBAQD
// SIG // AgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0jBBgwFoAU
// SIG // 1fZWy4/oolxiaNE9lJBb186aGMQwVgYDVR0fBE8wTTBL
// SIG // oEmgR4ZFaHR0cDovL2NybC5taWNyb3NvZnQuY29tL3Br
// SIG // aS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0XzIwMTAt
// SIG // MDYtMjMuY3JsMFoGCCsGAQUFBwEBBE4wTDBKBggrBgEF
// SIG // BQcwAoY+aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3Br
// SIG // aS9jZXJ0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0yMy5j
// SIG // cnQwDQYJKoZIhvcNAQELBQADggIBAJ1VffwqreEsH2cB
// SIG // MSRb4Z5yS/ypb+pcFLY+TkdkeLEGk5c9MTO1OdfCcTY/
// SIG // 2mRsfNB1OW27DzHkwo/7bNGhlBgi7ulmZzpTTd2YurYe
// SIG // eNg2LpypglYAA7AFvonoaeC6Ce5732pvvinLbtg/SHUB
// SIG // 2RjebYIM9W0jVOR4U3UkV7ndn/OOPcbzaN9l9qRWqveV
// SIG // tihVJ9AkvUCgvxm2EhIRXT0n4ECWOKz3+SmJw7wXsFSF
// SIG // QrP8DJ6LGYnn8AtqgcKBGUIZUnWKNsIdw2FzLixre24/
// SIG // LAl4FOmRsqlb30mjdAy87JGA0j3mSj5mO0+7hvoyGtmW
// SIG // 9I/2kQH2zsZ0/fZMcm8Qq3UwxTSwethQ/gpY3UA8x1Rt
// SIG // nWN0SCyxTkctwRQEcb9k+SS+c23Kjgm9swFXSVRk2XPX
// SIG // fx5bRAGOWhmRaw2fpCjcZxkoJLo4S5pu+yFUa2pFEUep
// SIG // 8beuyOiJXk+d0tBMdrVXVAmxaQFEfnyhYWxz/gq77EFm
// SIG // PWn9y8FBSX5+k77L+DvktxW/tM4+pTFRhLy/AsGConsX
// SIG // HRWJjXD+57XQKBqJC4822rpM+Zv/Cuk0+CQ1ZyvgDbjm
// SIG // jJnW4SLq8CdCPSWU5nR0W2rRnj7tfqAxM328y+l7vzhw
// SIG // RNGQ8cirOoo6CGJ/2XBjU02N7oJtpQUQwXEGahC0HVUz
// SIG // WLOhcGbyoYICzjCCAjcCAQEwgfihgdCkgc0wgcoxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJTAjBgNVBAsTHE1pY3Jvc29m
// SIG // dCBBbWVyaWNhIE9wZXJhdGlvbnMxJjAkBgNVBAsTHVRo
// SIG // YWxlcyBUU1MgRVNOOjQ5QkMtRTM3QS0yMzNDMSUwIwYD
// SIG // VQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNl
// SIG // oiMKAQEwBwYFKw4DAhoDFQAQEOxMRdfSpMFS9RNwHfJN
// SIG // D3m+naCBgzCBgKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYD
// SIG // VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
// SIG // MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
// SIG // JjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBD
// SIG // QSAyMDEwMA0GCSqGSIb3DQEBBQUAAgUA57yOIDAiGA8y
// SIG // MDIzMDMxNjAyMzQwOFoYDzIwMjMwMzE3MDIzNDA4WjB3
// SIG // MD0GCisGAQQBhFkKBAExLzAtMAoCBQDnvI4gAgEAMAoC
// SIG // AQACAgZBAgH/MAcCAQACAkq3MAoCBQDnvd+gAgEAMDYG
// SIG // CisGAQQBhFkKBAIxKDAmMAwGCisGAQQBhFkKAwKgCjAI
// SIG // AgEAAgMHoSChCjAIAgEAAgMBhqAwDQYJKoZIhvcNAQEF
// SIG // BQADgYEAYgYzJFbPC1ERZa4gVEq/vhgT0WJn7GZU2SFO
// SIG // BDIXy+lc9nM0vq9+CCuhYJMyslX8nbtcpwMDWxNwj46f
// SIG // pdWZEsDgc9TgkuElfntBOMvDpuf+1B+9Uy7lJo25sX4H
// SIG // pd2tiAQQuAx478IohQ8jkVGGVeL+Q1ku9s/Clsz2bT7J
// SIG // QLUxggQNMIIECQIBATCBkzB8MQswCQYDVQQGEwJVUzET
// SIG // MBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVk
// SIG // bW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0
// SIG // aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFt
// SIG // cCBQQ0EgMjAxMAITMwAAAcBVpI3DZBXFSwABAAABwDAN
// SIG // BglghkgBZQMEAgEFAKCCAUowGgYJKoZIhvcNAQkDMQ0G
// SIG // CyqGSIb3DQEJEAEEMC8GCSqGSIb3DQEJBDEiBCDU/ux4
// SIG // 7I2Q4rmHj6sjJx4ovnGDQ1cqFY13gRes7TrhGjCB+gYL
// SIG // KoZIhvcNAQkQAi8xgeowgecwgeQwgb0EIFrxWKJSCFzB
// SIG // NMyv1ul7ApJGF+5WDW/cgPCccGNOD5NPMIGYMIGApH4w
// SIG // fDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAHA
// SIG // VaSNw2QVxUsAAQAAAcAwIgQgl+nAbN6PyCLUy+wcFygw
// SIG // n40ZUtbHYbd33KUwnDX50pEwDQYJKoZIhvcNAQELBQAE
// SIG // ggIAHn3gGTTTXFW/6Nv1w50xChdTnrh029lT7sWNdV9d
// SIG // FABv4MhlvlcvuBg14EKn2kiow63n7RjLQEvHkUK7Q24T
// SIG // zYYYvZWJq8MdyMo5bkV8YdQQ688FhSBrhRzrOV+9AqnU
// SIG // /stKF4STztwaecaQm5TLd6M1s95JF/Uipc/bcM7/lx4I
// SIG // R6nWumjI8Z07TiJzKA1j0go68dQLr9SARs1Yk4AweEQ7
// SIG // BYX/C7ea0sutb/LWphFVREUnXMuS2ojBo4R0xF4bPoNk
// SIG // pkwXnsIa+twgQ2Wj1lngY2IkGfaUIyA9mWmkqaJlC2M7
// SIG // m11jyQbuJE0aGhqW2CXIbAtsAiEB5h4wf5CMo0nTCEEv
// SIG // J6nwO0/hQZqInyPc8zP13ws/S8RDJ6t06yJLbZ6Ch+ov
// SIG // WJT7NtY+nZiG5ksE1xJGfD41oSzoX/zOazPVscVWAOiJ
// SIG // qpE31C4YFkZdRNJ1CUJ4UV+IEPrhL93Pnkbu1zAMn9/E
// SIG // E2vB/bTYvFIOT5sbsh5SQGSE41m1f2eGBvsMphY21AqV
// SIG // 1k+ZvkQm8h7B1LTVgpkvDM2FcejVPxNMHjLBiI/EhLmp
// SIG // Sel1uyWOMY59XxCAGt1FkZmfyFm953maTwIvUjrk3QIC
// SIG // 48xCZxeYS9+5AvPDHIrbD92keftOkfUZuBGDFC/gpHJi
// SIG // d60xf5Cim2TN954vKytgVovRVAg=
// SIG // End signature block
