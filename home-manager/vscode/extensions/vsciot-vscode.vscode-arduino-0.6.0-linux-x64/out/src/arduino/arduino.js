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
exports.ArduinoApp = exports.BuildMode = void 0;
const fs = require("fs");
const glob = require("glob");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const constants = require("../common/constants");
const util = require("../common/util");
const logger = require("../logger/logger");
const deviceContext_1 = require("../deviceContext");
const intellisense_1 = require("./intellisense");
const vscodeSettings_1 = require("./vscodeSettings");
const outputChannel_1 = require("../common/outputChannel");
const workspace_1 = require("../common/workspace");
const serialMonitor_1 = require("../serialmonitor/serialMonitor");
const usbDetector_1 = require("../serialmonitor/usbDetector");
/**
 * Supported build modes. For further explanation see the documentation
 * of ArduinoApp.build().
 * The strings are used for status reporting within the above function.
 */
var BuildMode;
(function (BuildMode) {
    BuildMode["Verify"] = "Verifying";
    BuildMode["Analyze"] = "Analyzing";
    BuildMode["Upload"] = "Uploading";
    BuildMode["CliUpload"] = "Uploading using Arduino CLI";
    BuildMode["UploadProgrammer"] = "Uploading (programmer)";
    BuildMode["CliUploadProgrammer"] = "Uploading (programmer) using Arduino CLI";
})(BuildMode = exports.BuildMode || (exports.BuildMode = {}));
/**
 * Represent an Arduino application based on the official Arduino IDE.
 */
class ArduinoApp {
    /**
     * @param {IArduinoSettings} _settings ArduinoSetting object.
     */
    constructor(_settings) {
        this._settings = _settings;
        /**
         * Indicates if a build is currently in progress.
         * If so any call to this.build() will return false immediately.
         */
        this._building = false;
        const analysisDelayMs = 1000 * 3;
        this._analysisManager = new intellisense_1.AnalysisManager(() => this._building, () => __awaiter(this, void 0, void 0, function* () { yield this.build(BuildMode.Analyze); }), analysisDelayMs);
    }
    /**
     * Need refresh Arduino IDE's setting when starting up.
     * @param {boolean} force - Whether force initialize the arduino
     */
    initialize(force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!util.fileExistsSync(this._settings.preferencePath)) {
                try {
                    // Use empty pref value to initialize preference.txt file
                    yield this.setPref("boardsmanager.additional.urls", "");
                    this._settings.reloadPreferences(); // reload preferences.
                }
                catch (ex) {
                }
            }
            if (force || !util.fileExistsSync(path.join(this._settings.packagePath, "package_index.json"))) {
                try {
                    // Use the dummy package to initialize the Arduino IDE
                    yield this.installBoard("dummy", "", "", true);
                }
                catch (ex) {
                }
            }
            if (this._settings.analyzeOnSettingChange) {
                // set up event handling for IntelliSense analysis
                const requestAnalysis = () => __awaiter(this, void 0, void 0, function* () {
                    if (intellisense_1.isCompilerParserEnabled()) {
                        yield this._analysisManager.requestAnalysis();
                    }
                });
                const dc = deviceContext_1.DeviceContext.getInstance();
                dc.onChangeBoard(requestAnalysis);
                dc.onChangeConfiguration(requestAnalysis);
                dc.onChangeSketch(requestAnalysis);
            }
        });
    }
    /**
     * Initialize the arduino library.
     * @param {boolean} force - Whether force refresh library index file
     */
    initializeLibrary(force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (force || !util.fileExistsSync(path.join(this._settings.packagePath, "library_index.json"))) {
                try {
                    // Use the dummy library to initialize the Arduino IDE
                    yield this.installLibrary("dummy", "", true);
                }
                catch (ex) {
                }
            }
        });
    }
    getAdditionalUrls() {
        // For better compatibility, merge urls both in user settings and arduino IDE preferences.
        const settingsUrls = vscodeSettings_1.VscodeSettings.getInstance().additionalUrls;
        let preferencesUrls = [];
        const preferences = this._settings.preferences;
        if (preferences && preferences.has("boardsmanager.additional.urls")) {
            preferencesUrls = util.toStringArray(preferences.get("boardsmanager.additional.urls"));
        }
        return util.union(settingsUrls, preferencesUrls);
    }
    /**
     * Set the Arduino preferences value.
     * @param {string} key - The preference key
     * @param {string} value - The preference value
     */
    setPref(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.useArduinoCli()) {
                    yield util.spawn(this._settings.commandPath, ["--build-property", `${key}=${value}`]);
                }
                else {
                    yield util.spawn(this._settings.commandPath, ["--pref", `${key}=${value}`, "--save-prefs"]);
                }
            }
            catch (ex) {
            }
        });
    }
    /**
     * Returns true if a build is currently in progress.
     */
    get building() {
        return this._building;
    }
    /**
     * Runs the arduino builder to build/compile and - if necessary - upload
     * the current sketch.
     * @param buildMode Build mode.
     *  * BuildMode.Upload: Compile and upload
     *  * BuildMode.UploadProgrammer: Compile and upload using the user
     *     selectable programmer
     *  * BuildMode.Analyze: Compile, analyze the output and generate
     *     IntelliSense configuration from it.
     *  * BuildMode.Verify: Just compile.
     * All build modes except for BuildMode.Analyze run interactively, i.e. if
     * something is missing, it tries to query the user for the missing piece
     * of information (sketch, board, etc.). Analyze runs non interactively and
     * just returns false.
     * @param buildDir Override the build directory set by the project settings
     * with the given directory.
     * @returns true on success, false if
     *  * another build is currently in progress
     *  * board- or programmer-manager aren't initialized yet
     *  * or something went wrong during the build
     */
    build(buildMode, buildDir) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._boardManager || !this._programmerManager || this._building) {
                return false;
            }
            this._building = true;
            return yield this._build(buildMode, buildDir)
                .then((ret) => {
                this._building = false;
                return ret;
            })
                .catch((reason) => {
                this._building = false;
                logger.notifyUserError("ArduinoApp.build", reason, `Unhandled exception when cleaning up build "${buildMode}": ${JSON.stringify(reason)}`);
                return false;
            });
        });
    }
    // Include the *.h header files from selected library to the arduino sketch.
    includeLibrary(libraryPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!workspace_1.ArduinoWorkspace.rootPath) {
                return;
            }
            const dc = deviceContext_1.DeviceContext.getInstance();
            const appPath = path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch);
            if (util.fileExistsSync(appPath)) {
                const hFiles = glob.sync(`${libraryPath}/*.h`, {
                    nodir: true,
                    matchBase: true,
                });
                const hIncludes = hFiles.map((hFile) => {
                    return `#include <${path.basename(hFile)}>`;
                }).join(os.EOL);
                // Open the sketch and bring up it to current visible view.
                const textDocument = yield vscode.workspace.openTextDocument(appPath);
                yield vscode.window.showTextDocument(textDocument, vscode.ViewColumn.One, true);
                const activeEditor = vscode.window.visibleTextEditors.find((textEditor) => {
                    return path.resolve(textEditor.document.fileName) === path.resolve(appPath);
                });
                if (activeEditor) {
                    // Insert *.h at the beginning of the sketch code.
                    yield activeEditor.edit((editBuilder) => {
                        editBuilder.insert(new vscode.Position(0, 0), `${hIncludes}${os.EOL}${os.EOL}`);
                    });
                }
            }
        });
    }
    /**
     * Installs arduino board package.
     * (If using the aduino CLI this installs the corrosponding core.)
     * @param {string} packageName - board vendor
     * @param {string} arch - board architecture
     * @param {string} version - version of board package or core to download
     * @param {boolean} [showOutput=true] - show raw output from command
     */
    installBoard(packageName, arch = "", version = "", showOutput = true) {
        return __awaiter(this, void 0, void 0, function* () {
            outputChannel_1.arduinoChannel.show();
            const updatingIndex = packageName === "dummy" && !arch && !version;
            if (updatingIndex) {
                outputChannel_1.arduinoChannel.start(`Update package index files...`);
            }
            else {
                try {
                    const packagePath = path.join(this._settings.packagePath, "packages", packageName, arch);
                    if (util.directoryExistsSync(packagePath)) {
                        util.rmdirRecursivelySync(packagePath);
                    }
                    outputChannel_1.arduinoChannel.start(`Install package - ${packageName}...`);
                }
                catch (error) {
                    outputChannel_1.arduinoChannel.start(`Install package - ${packageName} failed under directory : ${error.path}${os.EOL}
                                      Please make sure the folder is not occupied by other procedures .`);
                    outputChannel_1.arduinoChannel.error(`Error message - ${error.message}${os.EOL}`);
                    outputChannel_1.arduinoChannel.error(`Exit with code=${error.code}${os.EOL}`);
                    return;
                }
            }
            outputChannel_1.arduinoChannel.info(`${packageName}${arch && ":" + arch}${version && ":" + version}`);
            try {
                if (this.useArduinoCli()) {
                    if (updatingIndex) {
                        yield this.spawnCli(["core", "update-index"], undefined, { channel: showOutput ? outputChannel_1.arduinoChannel.channel : null });
                    }
                    else {
                        yield this.spawnCli(["core", "install", `${packageName}${arch && ":" + arch}${version && "@" + version}`], undefined, { channel: showOutput ? outputChannel_1.arduinoChannel.channel : null });
                    }
                }
                else {
                    yield util.spawn(this._settings.commandPath, ["--install-boards", `${packageName}${arch && ":" + arch}${version && ":" + version}`], undefined, { channel: showOutput ? outputChannel_1.arduinoChannel.channel : null });
                }
                if (updatingIndex) {
                    outputChannel_1.arduinoChannel.end("Updated package index files.");
                }
                else {
                    outputChannel_1.arduinoChannel.end(`Installed board package - ${packageName}${os.EOL}`);
                }
            }
            catch (error) {
                // If a platform with the same version is already installed, nothing is installed and program exits with exit code 1
                if (error.code === 1) {
                    if (updatingIndex) {
                        outputChannel_1.arduinoChannel.end("Updated package index files.");
                    }
                    else {
                        outputChannel_1.arduinoChannel.end(`Installed board package - ${packageName}${os.EOL}`);
                    }
                }
                else {
                    outputChannel_1.arduinoChannel.error(`Exit with code=${error.code}${os.EOL}`);
                }
            }
        });
    }
    uninstallBoard(boardName, packagePath) {
        outputChannel_1.arduinoChannel.start(`Uninstall board package - ${boardName}...`);
        util.rmdirRecursivelySync(packagePath);
        outputChannel_1.arduinoChannel.end(`Uninstalled board package - ${boardName}${os.EOL}`);
    }
    /**
     * Downloads or updates a library
     * @param {string} libName - name of the library to download
     * @param {string} version - version of library to download
     * @param {boolean} [showOutput=true] - show raw output from command
     */
    installLibrary(libName, version = "", showOutput = true) {
        return __awaiter(this, void 0, void 0, function* () {
            outputChannel_1.arduinoChannel.show();
            const updatingIndex = (libName === "dummy" && !version);
            if (updatingIndex) {
                outputChannel_1.arduinoChannel.start("Update library index files...");
            }
            else {
                outputChannel_1.arduinoChannel.start(`Install library - ${libName}`);
            }
            try {
                if (this.useArduinoCli()) {
                    if (updatingIndex) {
                        this.spawnCli(["lib", "update-index"], undefined, { channel: showOutput ? outputChannel_1.arduinoChannel.channel : undefined });
                    }
                    else {
                        yield this.spawnCli(["lib", "install", `${libName}${version && "@" + version}`], undefined, { channel: showOutput ? outputChannel_1.arduinoChannel.channel : undefined });
                    }
                }
                else {
                    yield util.spawn(this._settings.commandPath, ["--install-library", `${libName}${version && ":" + version}`], undefined, { channel: showOutput ? outputChannel_1.arduinoChannel.channel : undefined });
                }
                if (updatingIndex) {
                    outputChannel_1.arduinoChannel.end("Updated library index files.");
                }
                else {
                    outputChannel_1.arduinoChannel.end(`Installed library - ${libName}${os.EOL}`);
                }
            }
            catch (error) {
                // If a library with the same version is already installed, nothing is installed and program exits with exit code 1
                if (error.code === 1) {
                    if (updatingIndex) {
                        outputChannel_1.arduinoChannel.end("Updated library index files.");
                    }
                    else {
                        outputChannel_1.arduinoChannel.end(`Installed library - ${libName}${os.EOL}`);
                    }
                }
                else {
                    outputChannel_1.arduinoChannel.error(`Exit with code=${error.code}${os.EOL}`);
                }
            }
        });
    }
    uninstallLibrary(libName, libPath) {
        outputChannel_1.arduinoChannel.start(`Remove library - ${libName}`);
        util.rmdirRecursivelySync(libPath);
        outputChannel_1.arduinoChannel.end(`Removed library - ${libName}${os.EOL}`);
    }
    openExample(example) {
        function tmpName(name) {
            let counter = 0;
            let candidateName = name;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                if (!util.fileExistsSync(candidateName) && !util.directoryExistsSync(candidateName)) {
                    return candidateName;
                }
                counter++;
                candidateName = `${name}_${counter}`;
            }
        }
        // Step 1: Copy the example project to a temporary directory.
        const sketchPath = path.join(this._settings.sketchbookPath, "generated_examples");
        if (!util.directoryExistsSync(sketchPath)) {
            util.mkdirRecursivelySync(sketchPath);
        }
        let destExample = "";
        if (util.directoryExistsSync(example)) {
            destExample = tmpName(path.join(sketchPath, path.basename(example)));
            util.cp(example, destExample);
        }
        else if (util.fileExistsSync(example)) {
            const exampleName = path.basename(example, path.extname(example));
            destExample = tmpName(path.join(sketchPath, exampleName));
            util.mkdirRecursivelySync(destExample);
            util.cp(example, path.join(destExample, path.basename(example)));
        }
        if (destExample) {
            // Step 2: Scaffold the example project to an arduino project.
            const items = fs.readdirSync(destExample);
            const sketchFile = items.find((item) => {
                return util.isArduinoFile(path.join(destExample, item));
            });
            if (sketchFile) {
                // Generate arduino.json
                const dc = deviceContext_1.DeviceContext.getInstance();
                const arduinoJson = {
                    sketch: sketchFile,
                    // TODO EW, 2020-02-18: COM1 is Windows specific - what about OSX and Linux users?
                    port: dc.port || "COM1",
                    board: dc.board,
                    configuration: dc.configuration,
                };
                const arduinoConfigFilePath = path.join(destExample, constants.ARDUINO_CONFIG_FILE);
                util.mkdirRecursivelySync(path.dirname(arduinoConfigFilePath));
                fs.writeFileSync(arduinoConfigFilePath, JSON.stringify(arduinoJson, null, 4));
            }
            // Step 3: Open the arduino project at a new vscode window.
            vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(destExample), true);
        }
        return destExample;
    }
    get settings() {
        return this._settings;
    }
    get boardManager() {
        return this._boardManager;
    }
    set boardManager(value) {
        this._boardManager = value;
    }
    get libraryManager() {
        return this._libraryManager;
    }
    set libraryManager(value) {
        this._libraryManager = value;
    }
    get exampleManager() {
        return this._exampleManager;
    }
    set exampleManager(value) {
        this._exampleManager = value;
    }
    get programmerManager() {
        return this._programmerManager;
    }
    set programmerManager(value) {
        this._programmerManager = value;
    }
    /**
     * Runs the pre or post build command.
     * Usually before one of
     *  * verify
     *  * upload
     *  * upload using programmer
     * @param dc Device context prepared during one of the above actions
     * @param what "pre" if the pre-build command should be run, "post" if the
     * post-build command should be run.
     * @returns True if successful, false on error.
     */
    runPrePostBuildCommand(dc, environment, what) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmdline = what === "pre"
                ? dc.prebuild
                : dc.postbuild;
            if (!cmdline) {
                return true; // Successfully done nothing.
            }
            outputChannel_1.arduinoChannel.info(`Running ${what}-build command: "${cmdline}"`);
            let cmd;
            let args;
            // pre-/post-build commands feature full bash support on UNIX systems.
            // On Windows you have full cmd support.
            if (os.platform() === "win32") {
                args = [];
                cmd = cmdline;
            }
            else {
                args = ["-c", cmdline];
                cmd = "bash";
            }
            try {
                yield util.spawn(cmd, args, {
                    shell: os.platform() === "win32",
                    cwd: workspace_1.ArduinoWorkspace.rootPath,
                    env: Object.assign({}, environment),
                }, { channel: outputChannel_1.arduinoChannel.channel });
            }
            catch (ex) {
                const msg = ex.error
                    ? `${ex.error}`
                    : ex.code
                        ? `Exit code = ${ex.code}`
                        : JSON.stringify(ex);
                outputChannel_1.arduinoChannel.error(`Running ${what}-build command failed: ${os.EOL}${msg}`);
                return false;
            }
            return true;
        });
    }
    /**
     * Checks if the arduino cli is being used
     * @returns {bool} - true if arduino cli is being use
     */
    useArduinoCli() {
        return this._settings.useArduinoCli;
        // return VscodeSettings.getInstance().useArduinoCli;
    }
    /**
     * Checks if the line contains memory usage information
     * @param line output line to check
     * @returns {bool} true if line contains memory usage information
     */
    isMemoryUsageInformation(line) {
        return line.startsWith("Sketch uses ") || line.startsWith("Global variables use ");
    }
    /**
     * Private implementation. Not to be called directly. The wrapper build()
     * manages the build state.
     * @param buildMode See build()
     * @param buildDir See build()
     * @see https://github.com/arduino/Arduino/blob/master/build/shared/manpage.adoc
     */
    _build(buildMode, buildDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const dc = deviceContext_1.DeviceContext.getInstance();
            const args = [];
            let restoreSerialMonitor = false;
            const verbose = vscodeSettings_1.VscodeSettings.getInstance().logLevel === constants.LogLevel.Verbose;
            if (!this.boardManager.currentBoard) {
                if (buildMode !== BuildMode.Analyze) {
                    logger.notifyUserError("boardManager.currentBoard", new Error(constants.messages.NO_BOARD_SELECTED));
                }
                return false;
            }
            const boardDescriptor = this.boardManager.currentBoard.getBuildConfig();
            if (this.useArduinoCli()) {
                args.push("-b", boardDescriptor);
            }
            else {
                args.push("--board", boardDescriptor);
            }
            if (!workspace_1.ArduinoWorkspace.rootPath) {
                vscode.window.showWarningMessage("Workspace doesn't seem to have a folder added to it yet.");
                return false;
            }
            if (!dc.sketch || !util.fileExistsSync(path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch))) {
                if (buildMode === BuildMode.Analyze) {
                    // Analyze runs non interactively
                    return false;
                }
                if (!(yield dc.resolveMainSketch())) {
                    vscode.window.showErrorMessage("No sketch file was found. Please specify the sketch in the arduino.json file");
                    return false;
                }
            }
            const selectSerial = () => __awaiter(this, void 0, void 0, function* () {
                const choice = yield vscode.window.showInformationMessage("Serial port is not specified. Do you want to select a serial port for uploading?", "Yes", "No");
                if (choice === "Yes") {
                    vscode.commands.executeCommand("arduino.selectSerialPort");
                }
            });
            if (buildMode === BuildMode.Upload) {
                if ((!dc.configuration || !/upload_method=[^=,]*st[^,]*link/i.test(dc.configuration)) && !dc.port) {
                    yield selectSerial();
                    return false;
                }
                if (this.useArduinoCli()) {
                    args.push("compile", "--upload");
                }
                else {
                    args.push("--upload");
                }
                if (dc.port) {
                    args.push("--port", dc.port);
                }
            }
            else if (buildMode === BuildMode.CliUpload) {
                if ((!dc.configuration || !/upload_method=[^=,]*st[^,]*link/i.test(dc.configuration)) && !dc.port) {
                    yield selectSerial();
                    return false;
                }
                if (!this.useArduinoCli()) {
                    outputChannel_1.arduinoChannel.error("This command is only available when using the Arduino CLI");
                    return false;
                }
                args.push("upload");
                if (dc.port) {
                    args.push("--port", dc.port);
                }
            }
            else if (buildMode === BuildMode.UploadProgrammer) {
                const programmer = this.programmerManager.currentProgrammer;
                if (!programmer) {
                    logger.notifyUserError("programmerManager.currentProgrammer", new Error(constants.messages.NO_PROGRAMMMER_SELECTED));
                    return false;
                }
                if (!dc.port) {
                    yield selectSerial();
                    return false;
                }
                if (this.useArduinoCli()) {
                    args.push("compile", "--upload", "--programmer", programmer);
                }
                else {
                    args.push("--upload", "--useprogrammer", "--pref", `programmer=${programmer}`);
                }
                args.push("--port", dc.port);
            }
            else if (buildMode === BuildMode.CliUploadProgrammer) {
                const programmer = this.programmerManager.currentProgrammer;
                if (!programmer) {
                    logger.notifyUserError("programmerManager.currentProgrammer", new Error(constants.messages.NO_PROGRAMMMER_SELECTED));
                    return false;
                }
                if (!dc.port) {
                    yield selectSerial();
                    return false;
                }
                if (!this.useArduinoCli()) {
                    outputChannel_1.arduinoChannel.error("This command is only available when using the Arduino CLI");
                    return false;
                }
                args.push("upload", "--programmer", programmer, "--port", dc.port);
            }
            else {
                if (this.useArduinoCli()) {
                    args.unshift("compile");
                }
                else {
                    args.push("--verify");
                }
            }
            if (dc.buildPreferences) {
                for (const pref of dc.buildPreferences) {
                    // Note: BuildPrefSetting makes sure that each preference
                    // value consists of exactly two items (key and value).
                    if (this.useArduinoCli()) {
                        args.push("--build-property", `${pref[0]}=${pref[1]}`);
                    }
                    else {
                        args.push("--pref", `${pref[0]}=${pref[1]}`);
                    }
                }
            }
            // We always build verbosely but filter the output based on the settings
            this._settings.useArduinoCli ? args.push("--verbose", "--no-color") : args.push("--verbose-build");
            if (verbose && !this._settings.useArduinoCli) {
                args.push("--verbose-upload");
            }
            yield vscode.workspace.saveAll(false);
            // we prepare the channel here since all following code will
            // or at leas can possibly output to it
            outputChannel_1.arduinoChannel.show();
            if (vscodeSettings_1.VscodeSettings.getInstance().clearOutputOnBuild) {
                outputChannel_1.arduinoChannel.clear();
            }
            outputChannel_1.arduinoChannel.start(`${buildMode} sketch '${dc.sketch}'`);
            if (buildDir || dc.output) {
                // 2020-02-29, EW: This whole code appears a bit wonky to me.
                //   What if the user specifies an output directory "../builds/my project"
                // the first choice of the path should be from the users explicit settings.
                if (dc.output) {
                    buildDir = path.resolve(workspace_1.ArduinoWorkspace.rootPath, dc.output);
                }
                else {
                    buildDir = path.resolve(workspace_1.ArduinoWorkspace.rootPath, buildDir);
                }
                const dirPath = path.dirname(buildDir);
                if (!util.directoryExistsSync(dirPath)) {
                    util.mkdirRecursivelySync(dirPath);
                }
                if (this.useArduinoCli()) {
                    args.push("--build-path", buildDir);
                }
                else {
                    args.push("--pref", `build.path=${buildDir}`);
                }
                outputChannel_1.arduinoChannel.info(`Please see the build logs in output path: ${buildDir}`);
            }
            else {
                const msg = "Output path is not specified. Unable to reuse previously compiled files. Build will be slower. See README.";
                outputChannel_1.arduinoChannel.warning(msg);
            }
            // Environment variables passed to pre- and post-build commands
            const env = {
                VSCA_BUILD_MODE: buildMode,
                VSCA_SKETCH: dc.sketch,
                VSCA_BOARD: boardDescriptor,
                VSCA_WORKSPACE_DIR: workspace_1.ArduinoWorkspace.rootPath,
                VSCA_LOG_LEVEL: verbose ? constants.LogLevel.Verbose : constants.LogLevel.Info,
            };
            if (dc.port) {
                env["VSCA_SERIAL"] = dc.port;
            }
            if (buildDir) {
                env["VSCA_BUILD_DIR"] = buildDir;
            }
            // TODO EW: What should we do with pre-/post build commands when running
            //   analysis? Some could use it to generate/manipulate code which could
            //   be a prerequisite for a successful build
            if (!(yield this.runPrePostBuildCommand(dc, env, "pre"))) {
                return false;
            }
            // stop serial monitor when everything is prepared and good
            // what makes restoring of its previous state easier
            if (buildMode === BuildMode.Upload ||
                buildMode === BuildMode.UploadProgrammer ||
                buildMode === BuildMode.CliUpload ||
                buildMode === BuildMode.CliUploadProgrammer) {
                restoreSerialMonitor = yield serialMonitor_1.SerialMonitor.getInstance().closeSerialMonitor(dc.port);
                usbDetector_1.UsbDetector.getInstance().pauseListening();
            }
            // Push sketch as last argument
            args.push(path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch));
            const cocopa = intellisense_1.makeCompilerParserContext(dc);
            const cleanup = (result) => __awaiter(this, void 0, void 0, function* () {
                let ret = true;
                if (result === "ok") {
                    ret = yield this.runPrePostBuildCommand(dc, env, "post");
                }
                yield cocopa.conclude();
                if (buildMode === BuildMode.Upload || buildMode === BuildMode.UploadProgrammer) {
                    usbDetector_1.UsbDetector.getInstance().resumeListening();
                    if (restoreSerialMonitor) {
                        yield serialMonitor_1.SerialMonitor.getInstance().openSerialMonitor(true);
                    }
                }
                return ret;
            });
            // Wrap line-oriented callbacks to accept arbitrary chunks of data.
            const wrapLineCallback = (callback) => {
                let buffer = "";
                let startIndex = 0;
                const eol = this.useArduinoCli() ? "\n" : os.EOL;
                return (data) => {
                    buffer += data;
                    while (true) {
                        const pos = buffer.indexOf(eol, startIndex);
                        if (pos < 0) {
                            startIndex = buffer.length;
                            break;
                        }
                        const line = buffer.substring(0, pos + eol.length);
                        buffer = buffer.substring(pos + eol.length);
                        startIndex = 0;
                        callback(line);
                    }
                };
            };
            const stdoutcb = wrapLineCallback((line) => {
                if (cocopa.callback) {
                    cocopa.callback(line);
                }
                if (verbose) {
                    outputChannel_1.arduinoChannel.channel.append(line);
                }
                else {
                    // Output sketch memory usage in non-verbose mode
                    if (this.isMemoryUsageInformation(line)) {
                        outputChannel_1.arduinoChannel.channel.append(line);
                    }
                }
            });
            const stderrcb = wrapLineCallback((line) => {
                if (os.platform() === "win32") {
                    line = line.trim();
                    if (line.length <= 0) {
                        return;
                    }
                    line = line.replace(/(?:\r|\r\n|\n)+/g, os.EOL);
                    line = `${line}${os.EOL}`;
                }
                if (!verbose) {
                    // Don't spill log with spurious info from the backend. This
                    // list could be fetched from a config file to accommodate
                    // messages of unknown board packages, newer backend revisions
                    const filters = [
                        /^Picked\sup\sJAVA_TOOL_OPTIONS:\s+/,
                        /^\d+\d+-\d+-\d+T\d+:\d+:\d+.\d+Z\s(?:INFO|WARN)\s/,
                        /^(?:DEBUG|TRACE|INFO)\s+/,
                        // 2022-04-09 22:48:46.204 Arduino[55373:2073803] Arg 25: '--pref'
                        /^[\d\-.:\s]*Arduino\[[\d:]*\]/,
                    ];
                    for (const f of filters) {
                        if (line.match(f)) {
                            return;
                        }
                    }
                }
                outputChannel_1.arduinoChannel.channel.append(line);
            });
            const run = (...args) => this.useArduinoCli() ?
                this.spawnCli(...(args.slice(1))) :
                util.spawn.apply(undefined, args);
            return yield run(this._settings.commandPath, args, { cwd: workspace_1.ArduinoWorkspace.rootPath }, { /*channel: arduinoChannel.channel,*/ stdout: stdoutcb, stderr: stderrcb }).then(() => __awaiter(this, void 0, void 0, function* () {
                const ret = yield cleanup("ok");
                if (ret) {
                    outputChannel_1.arduinoChannel.end(`${buildMode} sketch '${dc.sketch}'${os.EOL}`);
                }
                return ret;
            }), (reason) => __awaiter(this, void 0, void 0, function* () {
                yield cleanup("error");
                const msg = reason.code
                    ? `Exit with code=${reason.code}`
                    : JSON.stringify(reason);
                outputChannel_1.arduinoChannel.error(`${buildMode} sketch '${dc.sketch}': ${msg}${os.EOL}`);
                return false;
            }));
        });
    }
    spawnCli(args = [], options = {}, output) {
        const additionalUrls = this.getAdditionalUrls();
        return util.spawn(this._settings.commandPath, args.concat(["--additional-urls", additionalUrls.join(",")]), options, output);
    }
}
exports.ArduinoApp = ArduinoApp;

//# sourceMappingURL=arduino.js.map

// SIG // Begin signature block
// SIG // MIInkgYJKoZIhvcNAQcCoIIngzCCJ38CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // M0IDUi6FBz6Y1pMjTlxNphjmhn7W3qwrlB7fas3yhWmg
// SIG // gg12MIIF9DCCA9ygAwIBAgITMwAAAsu3dTn7AnFCNgAA
// SIG // AAACyzANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTIyMDUxMjIwNDU1OVoX
// SIG // DTIzMDUxMTIwNDU1OVowdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // t7DdFnHRqRlz2SG+YjXxQdMWfK5yb2J8Q+lH9gR14JaW
// SIG // 0xH6Hvpjv/6C1pEcQMKaXYrbElTg9KIJSm7Z4fVqdgwE
// SIG // S3MWxmluGGpzlkgdS8i0aR550OTzpYdlOba4ON4EI75T
// SIG // WZUAd5S/s6z7WzbzAOxNFpJqPmemBZ7H+2npPihs2hm6
// SIG // AHhTuLimY0F2OUZjMxO9AcGs+4bwNOYw1EXUSh9Iv9ci
// SIG // vekw7j+yckRSzrwN1FzVs9NEfcO6aTA3DZV7a5mz4oL9
// SIG // 8RPRX6X5iUbYjmUCne9yu9lro5o+v0rt/gwU6TquzYHZ
// SIG // 7VtpSX1912uqHuBfT5PcUYZMB7JOybvRPwIDAQABo4IB
// SIG // czCCAW8wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFK4P57f4I/gQS3dY2VmIaJO7
// SIG // +f8OMEUGA1UdEQQ+MDykOjA4MR4wHAYDVQQLExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xFjAUBgNVBAUTDTIzMDAx
// SIG // Mis0NzA1MjgwHwYDVR0jBBgwFoAUSG5k5VAF04KqFzc3
// SIG // IrVtqMp1ApUwVAYDVR0fBE0wSzBJoEegRYZDaHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9jcmwvTWlj
// SIG // Q29kU2lnUENBMjAxMV8yMDExLTA3LTA4LmNybDBhBggr
// SIG // BgEFBQcBAQRVMFMwUQYIKwYBBQUHMAKGRWh0dHA6Ly93
// SIG // d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMvTWlj
// SIG // Q29kU2lnUENBMjAxMV8yMDExLTA3LTA4LmNydDAMBgNV
// SIG // HRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4ICAQCS+beq
// SIG // VYyEZUPI+HQBSWZzJHt60R3kAzjxcbMDOOx0b4EGthNY
// SIG // 3mtmmIjJNVpnalp2MNW2peCM0ZUlX+HM388dr4ziDomh
// SIG // pZVtgch5HygKZ4DsyZgEPBdecUhz0bzTJr6QtzxS7yjH
// SIG // 98uUsjycYfdtk06tKuXqSb9UoGQ1pVJRy/xMdZ1/JMwU
// SIG // YR73Og+heZWvqADuAN6P2QtOTjoJuBCcWT/TKlIuYond
// SIG // ncOCYPx77Q6QnC49RiyIQg2nmynoGowiZTIYcZw16xhS
// SIG // yX1/I+5Oy1L62Q7EJ4iWdw+uivt0mUy4b8Cu3TBlRblF
// SIG // CVHw4n65Qk4yhvZsbDw5ZX8nJOMxp0Wb/CcPUYBNcwII
// SIG // Z1NeC9L1VDTs4v+GxO8CLIkciHAnFaF0Z3gQN5/36y17
// SIG // 3Yw7G29paRru/PrNc2zuTdG4R1quI+VjLra7KQcRIaht
// SIG // j0gYwuWKYvo4bX7t/se+jZgb7Mirscffh5vwC55cysa+
// SIG // CsjEd/8+CETMwNUMqaTZOuVIvowdeIPsOL6JXt9zNaVa
// SIG // lXJK5knm1JJo5wrIQoh9diBYB2Re4EcBOGGaye0I8WXq
// SIG // Gah2irEC0TKeud23gXx33r2vcyT4QUnVXAlu8fatHNh1
// SIG // TyyR1/WAlFO9eCPqrS6Qxq3W2cQ/ZopD6i/06P9ZQ2dH
// SIG // IfBbXj4TBO4aLrqD3DCCB3owggVioAMCAQICCmEOkNIA
// SIG // AAAAAAMwDQYJKoZIhvcNAQELBQAwgYgxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29mdCBSb290
// SIG // IENlcnRpZmljYXRlIEF1dGhvcml0eSAyMDExMB4XDTEx
// SIG // MDcwODIwNTkwOVoXDTI2MDcwODIxMDkwOVowfjELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEoMCYGA1UEAxMfTWljcm9zb2Z0
// SIG // IENvZGUgU2lnbmluZyBQQ0EgMjAxMTCCAiIwDQYJKoZI
// SIG // hvcNAQEBBQADggIPADCCAgoCggIBAKvw+nIQHC6t2G6q
// SIG // ghBNNLrytlghn0IbKmvpWlCquAY4GgRJun/DDB7dN2vG
// SIG // EtgL8DjCmQawyDnVARQxQtOJDXlkh36UYCRsr55JnOlo
// SIG // XtLfm1OyCizDr9mpK656Ca/XllnKYBoF6WZ26DJSJhIv
// SIG // 56sIUM+zRLdd2MQuA3WraPPLbfM6XKEW9Ea64DhkrG5k
// SIG // NXimoGMPLdNAk/jj3gcN1Vx5pUkp5w2+oBN3vpQ97/vj
// SIG // K1oQH01WKKJ6cuASOrdJXtjt7UORg9l7snuGG9k+sYxd
// SIG // 6IlPhBryoS9Z5JA7La4zWMW3Pv4y07MDPbGyr5I4ftKd
// SIG // gCz1TlaRITUlwzluZH9TupwPrRkjhMv0ugOGjfdf8NBS
// SIG // v4yUh7zAIXQlXxgotswnKDglmDlKNs98sZKuHCOnqWbs
// SIG // YR9q4ShJnV+I4iVd0yFLPlLEtVc/JAPw0XpbL9Uj43Bd
// SIG // D1FGd7P4AOG8rAKCX9vAFbO9G9RVS+c5oQ/pI0m8GLhE
// SIG // fEXkwcNyeuBy5yTfv0aZxe/CHFfbg43sTUkwp6uO3+xb
// SIG // n6/83bBm4sGXgXvt1u1L50kppxMopqd9Z4DmimJ4X7Iv
// SIG // hNdXnFy/dygo8e1twyiPLI9AN0/B4YVEicQJTMXUpUMv
// SIG // dJX3bvh4IFgsE11glZo+TzOE2rCIF96eTvSWsLxGoGyY
// SIG // 0uDWiIwLAgMBAAGjggHtMIIB6TAQBgkrBgEEAYI3FQEE
// SIG // AwIBADAdBgNVHQ4EFgQUSG5k5VAF04KqFzc3IrVtqMp1
// SIG // ApUwGQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYD
// SIG // VR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0j
// SIG // BBgwFoAUci06AjGQQ7kUBU7h6qfHMdEjiTQwWgYDVR0f
// SIG // BFMwUTBPoE2gS4ZJaHR0cDovL2NybC5taWNyb3NvZnQu
// SIG // Y29tL3BraS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0
// SIG // MjAxMV8yMDExXzAzXzIyLmNybDBeBggrBgEFBQcBAQRS
// SIG // MFAwTgYIKwYBBQUHMAKGQmh0dHA6Ly93d3cubWljcm9z
// SIG // b2Z0LmNvbS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0MjAx
// SIG // MV8yMDExXzAzXzIyLmNydDCBnwYDVR0gBIGXMIGUMIGR
// SIG // BgkrBgEEAYI3LgMwgYMwPwYIKwYBBQUHAgEWM2h0dHA6
// SIG // Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvZG9jcy9w
// SIG // cmltYXJ5Y3BzLmh0bTBABggrBgEFBQcCAjA0HjIgHQBM
// SIG // AGUAZwBhAGwAXwBwAG8AbABpAGMAeQBfAHMAdABhAHQA
// SIG // ZQBtAGUAbgB0AC4gHTANBgkqhkiG9w0BAQsFAAOCAgEA
// SIG // Z/KGpZjgVHkaLtPYdGcimwuWEeFjkplCln3SeQyQwWVf
// SIG // Liw++MNy0W2D/r4/6ArKO79HqaPzadtjvyI1pZddZYSQ
// SIG // fYtGUFXYDJJ80hpLHPM8QotS0LD9a+M+By4pm+Y9G6XU
// SIG // tR13lDni6WTJRD14eiPzE32mkHSDjfTLJgJGKsKKELuk
// SIG // qQUMm+1o+mgulaAqPyprWEljHwlpblqYluSD9MCP80Yr
// SIG // 3vw70L01724lruWvJ+3Q3fMOr5kol5hNDj0L8giJ1h/D
// SIG // Mhji8MUtzluetEk5CsYKwsatruWy2dsViFFFWDgycSca
// SIG // f7H0J/jeLDogaZiyWYlobm+nt3TDQAUGpgEqKD6CPxNN
// SIG // ZgvAs0314Y9/HG8VfUWnduVAKmWjw11SYobDHWM2l4bf
// SIG // 2vP48hahmifhzaWX0O5dY0HjWwechz4GdwbRBrF1HxS+
// SIG // YWG18NzGGwS+30HHDiju3mUv7Jf2oVyW2ADWoUa9WfOX
// SIG // pQlLSBCZgB/QACnFsZulP0V3HjXG0qKin3p6IvpIlR+r
// SIG // +0cjgPWe+L9rt0uX4ut1eBrs6jeZeRhL/9azI2h15q/6
// SIG // /IvrC4DqaTuv/DDtBEyO3991bWORPdGdVk5Pv4BXIqF4
// SIG // ETIheu9BCrE/+6jMpF3BoYibV3FWTkhFwELJm3ZbCoBI
// SIG // a/15n8G9bW1qyVJzEw16UM0xghl0MIIZcAIBATCBlTB+
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNy
// SIG // b3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExAhMzAAAC
// SIG // y7d1OfsCcUI2AAAAAALLMA0GCWCGSAFlAwQCAQUAoIGu
// SIG // MBkGCSqGSIb3DQEJAzEMBgorBgEEAYI3AgEEMBwGCisG
// SIG // AQQBgjcCAQsxDjAMBgorBgEEAYI3AgEVMC8GCSqGSIb3
// SIG // DQEJBDEiBCCNYgu9ROlpy0Cw+ue2sic4nHawc1Nx7GAC
// SIG // JzXcELC8RDBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAHk+5aLZ
// SIG // TbRXb43PQ/+j1Bz43apJ4nhDaGI1f6130gXaoVRX/ntc
// SIG // y5G+BCnfzdVfk4zbHS+8/7WrWJgR6q5j/2HqHuLMz2nP
// SIG // 96Rcy68+Jljt0v7r+5a2uEWbq7SJyl9Y8wtJ3XodjJ4/
// SIG // fJcca5xFO2Tv4Mt2+am780c5YlNGa0Gw5w1l4825tjfl
// SIG // q0D+BFmCYx5eqkbszRs1Zo1Mo+trA8DFcBrDea4XgC5j
// SIG // OTBK/7l0wVa2scMm4eOY3ngkijRQKoxfIXzMAIpGJ2i/
// SIG // jXQNgJ4ZuIL5sscD6dxo0PzihDbOSdY2IfIiZQaG2C7Q
// SIG // kZDQDQkRvm8Q8ng4vg1sTXR/Rjihghb+MIIW+gYKKwYB
// SIG // BAGCNwMDATGCFuowghbmBgkqhkiG9w0BBwKgghbXMIIW
// SIG // 0wIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBTwYLKoZIhvcN
// SIG // AQkQAQSgggE+BIIBOjCCATYCAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQguf7vPsFBx0Zma5XF42Bc
// SIG // OAgxySBqNLeCKtOHkRr74bMCBmPukhYZlxgRMjAyMzAz
// SIG // MTUyMTA1MzcuM1owBIACAfSggdCkgc0wgcoxCzAJBgNV
// SIG // BAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYD
// SIG // VQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQg
// SIG // Q29ycG9yYXRpb24xJTAjBgNVBAsTHE1pY3Jvc29mdCBB
// SIG // bWVyaWNhIE9wZXJhdGlvbnMxJjAkBgNVBAsTHVRoYWxl
// SIG // cyBUU1MgRVNOOjhBODItRTM0Ri05RERBMSUwIwYDVQQD
// SIG // ExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNloIIR
// SIG // VzCCBwwwggT0oAMCAQICEzMAAAHC+n2HDlRTRyQAAQAA
// SIG // AcIwDQYJKoZIhvcNAQELBQAwfDELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3Rh
// SIG // bXAgUENBIDIwMTAwHhcNMjIxMTA0MTkwMTI4WhcNMjQw
// SIG // MjAyMTkwMTI4WjCByjELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEl
// SIG // MCMGA1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0
// SIG // aW9uczEmMCQGA1UECxMdVGhhbGVzIFRTUyBFU046OEE4
// SIG // Mi1FMzRGLTlEREExJTAjBgNVBAMTHE1pY3Jvc29mdCBU
// SIG // aW1lLVN0YW1wIFNlcnZpY2UwggIiMA0GCSqGSIb3DQEB
// SIG // AQUAA4ICDwAwggIKAoICAQC18Qm88o5IWfel62n3Byjb
// SIG // 39SgmYMPIemaalGu5FVYEXfsHLSe+uzNJw5X8r4u8dZZ
// SIG // YLhL1yZ7g/rcSY2HFM3+TYKA+ci3+wN6nIAJKTJri6Sp
// SIG // zWxPYj7RSh3TGPL0rb6MsfxQ1v28zfIf+8JidolJSqC2
// SIG // plSXLzamBhIHq0N5khhxCg6FMj4zUeFHGbG3xFoApmcO
// SIG // deAt2SGchgMmtGRAGkiBqG0TG1O46SZWnbLxgKgU9pSF
// SIG // QPYlPqE+IMPuoPsDvs8ukXMPZAWY17NPxoceEqxUG4kw
// SIG // s9dk7WTXiPT+TrwNka2zVgG0Z6Bc2TK+RdKAILG3dDxY
// SIG // XyVoFdsOeEdoMsGEI4FplDyOpwVTHxklJdDyxu8SeZYV
// SIG // maAz3cH0/8lMVMXqoFUUwN39XQ8FtFALZNy1kfht+/6P
// SIG // Ja9k54XPnKW08tHFSoGO/gochomAGFTae0zDgfSGmbgH
// SIG // uzosvGROyMuxqOMIkjw+IqL+Y8pgRF2ZHK8Uvz9gD892
// SIG // qQjBZaDZOPm3K60YW19VH7oZtwJWGKOPLuXui3Fr/BhV
// SIG // JfroujRqVpOGNz66iNXAfimwv4DWq9tYMH2zCgqVrbR5
// SIG // m5vDt/MKkV7qqz74bTWyy3VJoDQYabO5AJ3ThR7V4fcM
// SIG // VENk+w35pa8DjnlCZ31kksZe6qcGjgFfBXF1Zk2Pr5vg
// SIG // /wIDAQABo4IBNjCCATIwHQYDVR0OBBYEFEaxiHvpXjVp
// SIG // QJFcT1a8P76wh8ZqMB8GA1UdIwQYMBaAFJ+nFV0AXmJd
// SIG // g/Tl0mWnG1M1GelyMF8GA1UdHwRYMFYwVKBSoFCGTmh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY3Js
// SIG // L01pY3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAy
// SIG // MDEwKDEpLmNybDBsBggrBgEFBQcBAQRgMF4wXAYIKwYB
// SIG // BQUHMAKGUGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY2VydHMvTWljcm9zb2Z0JTIwVGltZS1TdGFt
// SIG // cCUyMFBDQSUyMDIwMTAoMSkuY3J0MAwGA1UdEwEB/wQC
// SIG // MAAwEwYDVR0lBAwwCgYIKwYBBQUHAwgwDQYJKoZIhvcN
// SIG // AQELBQADggIBABF27d0KRwss99onetHUzsP2NYe+d59+
// SIG // SZe8Ugm2rEcZYzWioCH5urGkjsdnPYx42GHUKj4T0Bps
// SIG // 6CP3hKnWx5fF1YhIn2VEZoABbMDzvdpMHf9KPC4apupC
// SIG // 4C9TMEUI7jRQn1qelq+Smr/ScOotvtcjkf6eyaMXK7zK
// SIG // pfU8yadvizV9tz8XfSKNoBLOon6nmuuBhbAOgyKEzlsX
// SIG // RjSuJeKHATt5NKFqT8TBzFGYbeH45P47Hwo4u4urAUWX
// SIG // WyJN5AKn5hK3gnW1ZdqmoYkOUJtivdHPz6vJNLwKhkBT
// SIG // S9IcI5ByrXZOHzWntCUdm/1xNEOFmDZNXKDwbHdfqaSk
// SIG // 05dvnpBSiEjdKff1ZAnCMOfvgnRpVgxqLyZjr9Y66sow
// SIG // oS5I2EKJ6LRMrry85juwfRcQFadFJtV595K0Oj3hQhRV
// SIG // PB3YeYER9jyR+vKndGUD0DgW99S8McxoX0G29T+krp3U
// SIG // J0obb1XRY3e5XN9gRMmhGmMtgUarQy8rpBUya43GTdsJ
// SIG // F+PVpxJZ57XhQaOCXFbC/I580l7enFw0U53weHKn13gC
// SIG // VAZUs2i1oW+imA8t4nBRPd2XlVoACEzC8gWarCx99DL3
// SIG // eaiuumtye/vivmDd6MLf01ikUSjL6qbMtbWMVrVpcTZd
// SIG // v8pnDbJrCqV1KnQe7hUSSMbEU1z4DO0hRbCZMIIHcTCC
// SIG // BVmgAwIBAgITMwAAABXF52ueAptJmQAAAAAAFTANBgkq
// SIG // hkiG9w0BAQsFADCBiDELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEy
// SIG // MDAGA1UEAxMpTWljcm9zb2Z0IFJvb3QgQ2VydGlmaWNh
// SIG // dGUgQXV0aG9yaXR5IDIwMTAwHhcNMjEwOTMwMTgyMjI1
// SIG // WhcNMzAwOTMwMTgzMjI1WjB8MQswCQYDVQQGEwJVUzET
// SIG // MBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVk
// SIG // bW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0
// SIG // aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFt
// SIG // cCBQQ0EgMjAxMDCCAiIwDQYJKoZIhvcNAQEBBQADggIP
// SIG // ADCCAgoCggIBAOThpkzntHIhC3miy9ckeb0O1YLT/e6c
// SIG // BwfSqWxOdcjKNVf2AX9sSuDivbk+F2Az/1xPx2b3lVNx
// SIG // WuJ+Slr+uDZnhUYjDLWNE893MsAQGOhgfWpSg0S3po5G
// SIG // awcU88V29YZQ3MFEyHFcUTE3oAo4bo3t1w/YJlN8OWEC
// SIG // esSq/XJprx2rrPY2vjUmZNqYO7oaezOtgFt+jBAcnVL+
// SIG // tuhiJdxqD89d9P6OU8/W7IVWTe/dvI2k45GPsjksUZzp
// SIG // cGkNyjYtcI4xyDUoveO0hyTD4MmPfrVUj9z6BVWYbWg7
// SIG // mka97aSueik3rMvrg0XnRm7KMtXAhjBcTyziYrLNueKN
// SIG // iOSWrAFKu75xqRdbZ2De+JKRHh09/SDPc31BmkZ1zcRf
// SIG // NN0Sidb9pSB9fvzZnkXftnIv231fgLrbqn427DZM9itu
// SIG // qBJR6L8FA6PRc6ZNN3SUHDSCD/AQ8rdHGO2n6Jl8P0zb
// SIG // r17C89XYcz1DTsEzOUyOArxCaC4Q6oRRRuLRvWoYWmEB
// SIG // c8pnol7XKHYC4jMYctenIPDC+hIK12NvDMk2ZItboKaD
// SIG // IV1fMHSRlJTYuVD5C4lh8zYGNRiER9vcG9H9stQcxWv2
// SIG // XFJRXRLbJbqvUAV6bMURHXLvjflSxIUXk8A8FdsaN8cI
// SIG // FRg/eKtFtvUeh17aj54WcmnGrnu3tz5q4i6tAgMBAAGj
// SIG // ggHdMIIB2TASBgkrBgEEAYI3FQEEBQIDAQABMCMGCSsG
// SIG // AQQBgjcVAgQWBBQqp1L+ZMSavoKRPEY1Kc8Q/y8E7jAd
// SIG // BgNVHQ4EFgQUn6cVXQBeYl2D9OXSZacbUzUZ6XIwXAYD
// SIG // VR0gBFUwUzBRBgwrBgEEAYI3TIN9AQEwQTA/BggrBgEF
// SIG // BQcCARYzaHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3Br
// SIG // aW9wcy9Eb2NzL1JlcG9zaXRvcnkuaHRtMBMGA1UdJQQM
// SIG // MAoGCCsGAQUFBwMIMBkGCSsGAQQBgjcUAgQMHgoAUwB1
// SIG // AGIAQwBBMAsGA1UdDwQEAwIBhjAPBgNVHRMBAf8EBTAD
// SIG // AQH/MB8GA1UdIwQYMBaAFNX2VsuP6KJcYmjRPZSQW9fO
// SIG // mhjEMFYGA1UdHwRPME0wS6BJoEeGRWh0dHA6Ly9jcmwu
// SIG // bWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3RzL01p
// SIG // Y1Jvb0NlckF1dF8yMDEwLTA2LTIzLmNybDBaBggrBgEF
// SIG // BQcBAQROMEwwSgYIKwYBBQUHMAKGPmh0dHA6Ly93d3cu
// SIG // bWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljUm9vQ2Vy
// SIG // QXV0XzIwMTAtMDYtMjMuY3J0MA0GCSqGSIb3DQEBCwUA
// SIG // A4ICAQCdVX38Kq3hLB9nATEkW+Geckv8qW/qXBS2Pk5H
// SIG // ZHixBpOXPTEztTnXwnE2P9pkbHzQdTltuw8x5MKP+2zR
// SIG // oZQYIu7pZmc6U03dmLq2HnjYNi6cqYJWAAOwBb6J6Gng
// SIG // ugnue99qb74py27YP0h1AdkY3m2CDPVtI1TkeFN1JFe5
// SIG // 3Z/zjj3G82jfZfakVqr3lbYoVSfQJL1AoL8ZthISEV09
// SIG // J+BAljis9/kpicO8F7BUhUKz/AyeixmJ5/ALaoHCgRlC
// SIG // GVJ1ijbCHcNhcy4sa3tuPywJeBTpkbKpW99Jo3QMvOyR
// SIG // gNI95ko+ZjtPu4b6MhrZlvSP9pEB9s7GdP32THJvEKt1
// SIG // MMU0sHrYUP4KWN1APMdUbZ1jdEgssU5HLcEUBHG/ZPkk
// SIG // vnNtyo4JvbMBV0lUZNlz138eW0QBjloZkWsNn6Qo3GcZ
// SIG // KCS6OEuabvshVGtqRRFHqfG3rsjoiV5PndLQTHa1V1QJ
// SIG // sWkBRH58oWFsc/4Ku+xBZj1p/cvBQUl+fpO+y/g75LcV
// SIG // v7TOPqUxUYS8vwLBgqJ7Fx0ViY1w/ue10CgaiQuPNtq6
// SIG // TPmb/wrpNPgkNWcr4A245oyZ1uEi6vAnQj0llOZ0dFtq
// SIG // 0Z4+7X6gMTN9vMvpe784cETRkPHIqzqKOghif9lwY1NN
// SIG // je6CbaUFEMFxBmoQtB1VM1izoXBm8qGCAs4wggI3AgEB
// SIG // MIH4oYHQpIHNMIHKMQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSUw
// SIG // IwYDVQQLExxNaWNyb3NvZnQgQW1lcmljYSBPcGVyYXRp
// SIG // b25zMSYwJAYDVQQLEx1UaGFsZXMgVFNTIEVTTjo4QTgy
// SIG // LUUzNEYtOUREQTElMCMGA1UEAxMcTWljcm9zb2Z0IFRp
// SIG // bWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsOAwIaAxUA
// SIG // ynU3VUuE8y9ZcShl+YXhqlmWdFSggYMwgYCkfjB8MQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0B
// SIG // AQUFAAIFAOe8p70wIhgPMjAyMzAzMTYwNDIzMjVaGA8y
// SIG // MDIzMDMxNzA0MjMyNVowdzA9BgorBgEEAYRZCgQBMS8w
// SIG // LTAKAgUA57ynvQIBADAKAgEAAgIdWgIB/zAHAgEAAgIS
// SIG // OjAKAgUA5735PQIBADA2BgorBgEEAYRZCgQCMSgwJjAM
// SIG // BgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQowCAIBAAID
// SIG // AYagMA0GCSqGSIb3DQEBBQUAA4GBABBe+/RTyWCYa901
// SIG // 75NrEV4HIbjOq6NQXtRycvmZwri1aaoDU9cYz8GwHISj
// SIG // HtuGOAGjh+eeqJojMiYWyImJSOeAPMYdBw+UakHLoIe5
// SIG // VVJRBO5IiEq2Wx1tJ7zkrb+z0fgPv479bIYQXjwzhFrU
// SIG // bSQ5I3ZHHRddB/4ajmFSrs8mMYIEDTCCBAkCAQEwgZMw
// SIG // fDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAHC
// SIG // +n2HDlRTRyQAAQAAAcIwDQYJYIZIAWUDBAIBBQCgggFK
// SIG // MBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAvBgkq
// SIG // hkiG9w0BCQQxIgQgcoUwfiMK9kohiIuAnwatXpkJrL1o
// SIG // cT5+GFzVH1sRWVkwgfoGCyqGSIb3DQEJEAIvMYHqMIHn
// SIG // MIHkMIG9BCDKk2Bbx+mwxXnuvQXlt5S6IRU5V7gF2Zo7
// SIG // 57byYYNQFjCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFBDQSAyMDEwAhMzAAABwvp9hw5UU0ckAAEAAAHCMCIE
// SIG // IEQz9ibsMsDYCBXudkBzvpQYJ+poEV9ww9VWvUQymJ9l
// SIG // MA0GCSqGSIb3DQEBCwUABIICADdLs6Uimir4HLSPut7C
// SIG // jIPubSMW1eCHbU01dQjFld5mu+HmdSJpLMGSuJyDKEk3
// SIG // bOwuO/AnmsqAVz2rcum3/+CNfjFAWWAdv1N2zJJgw5uA
// SIG // D9ch0wpd6Uj/qAWnha3XjH/A0lPZm62vWYiyhtfK84sN
// SIG // awGRAAJc59B9oIaMOzJR3hiSBBytfQxSE51ZQ1miUwvn
// SIG // hqGqESztJhUgaPFhCJiDBONaU2SvNbZ95RlMqC2qxwQb
// SIG // DuS+VbkWrOlRv/cRH0QarqIPNrr3CNFGPOD/BsnDRqPQ
// SIG // MY8Y5bvZo3/J+TQJEdeIAHik3ZCHFfPr6Z7L8Ic4Q2Nw
// SIG // RYy10+NUFmfDpPzUXSXysJ7WeGVhGfpNA2VkkmPTH2BO
// SIG // 8kdqbASNx6KGzVqfqqZCl1ZDLkWDiWwrTloCjrYfpTAc
// SIG // 1cuOC9DHb6MC2SGXHD0j3n5HbhSndbgkrfAf39fiFnN3
// SIG // lCo4l4rttgjS5T2nBsA3deoxrXoPjG0esnsCKQU9etHE
// SIG // d2HsZEd0N2HK6EgfvStS1bnBDJxY34ccvuQOi2E+LjtT
// SIG // eqWkN6p8uAIHlpqVgaa/eDL2m8bhzLhNeQNYZ5r3DU5z
// SIG // 4Y9NKIUDeBhkMoBp5SW4wdnNaMZxN8/d9w9OnC2nIqf1
// SIG // jGhMNhecezHQHAnI1wYTO2i0gTBxsxP3y1cA73wniXdh
// SIG // C3Oc
// SIG // End signature block
